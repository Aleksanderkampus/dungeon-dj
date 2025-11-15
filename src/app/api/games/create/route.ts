import { NextRequest, NextResponse } from "next/server";
import { gameStore } from "@/lib/game-store";
import { Game } from "@/types/game";

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

    // Trigger n8n story generation (async)
    //triggerStoryGeneration(game);

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
    // TODO: Replace with actual n8n endpoint URL
    const n8nEndpoint =
      process.env.N8N_WEBHOOK_URL ||
      "http://localhost:5678/webhook/generate-story";

    const response = await fetch(n8nEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomCode: game.roomCode,
        worldData: game.worldData,
        callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/games/story-callback`,
      }),
    });

    if (!response.ok) {
      console.error("n8n API error:", await response.text());
      gameStore.updateGameStatus(game.roomCode, "ready");
    }
  } catch (error) {
    console.error("Error calling n8n:", error);
    // Mark as ready even if generation fails
    gameStore.updateGameStatus(game.roomCode, "ready");
  }
}
