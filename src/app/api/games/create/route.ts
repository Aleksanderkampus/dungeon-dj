import { NextRequest, NextResponse } from "next/server";
import { gameStore } from "@/lib/game-store";
import { Game } from "@/types/game";
import { setTheGameScene } from "@/lib/services/story-generating-service";
import { facilitatorAgent } from "@/lib/services/facilitator-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { worldData } = body;

    if (!worldData) {
      return NextResponse.json(
        { error: "World data is required" },
        { status: 400 }
      );
    }

    // Create game
    const game = gameStore.createGame(worldData);

    // Trigger n8n story generation and wait for response
    await triggerStoryGeneration(game);

    triggerWorldAndStoryGeneration(game);

    await facilitatorAgent(game);

    return NextResponse.json({
      roomCode: game.roomCode,
    });
  } catch (error) {
    console.error("Error creating game:", error);
    return NextResponse.json(
      { error: "Failed to create game" },
      { status: 500 }
    );
  }
}

async function triggerStoryGeneration(game: Game) {
  try {
    const n8nEndpoint =
      process.env.N8N_WEBHOOK_URL ||
      "http://localhost:5678/webhook/generate-story";

    const response = await fetch(n8nEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomCode: game.roomCode,
        ...game.worldData,
      }),
    });

    if (!response.ok) {
      console.error("n8n API error:", await response.text());
      gameStore.updateGameStatus(game.roomCode, "error");
      return;
    }

    // Parse the story from n8n response
    const data = await response.json();

    if (data.output) {
      gameStore.setGeneratedStory(game.roomCode, data.output);
    } else {
      console.error("No story in n8n response");
      gameStore.updateGameStatus(game.roomCode, "error");
    }
  } catch (error) {
    console.error("Error calling n8n:", error);
    gameStore.updateGameStatus(game.roomCode, "error");
  }
}

async function triggerWorldAndStoryGeneration(game: Game) {
  const result = await setTheGameScene(game);

  console.log('RESULT', result);

  if (!result) {
    gameStore.updateGameStatus(game.roomCode, "in-progress");
  }

  gameStore.updateGameStatus(game.roomCode, "ready");
}
