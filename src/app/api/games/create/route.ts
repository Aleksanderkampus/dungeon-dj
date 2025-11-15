import { NextRequest, NextResponse } from "next/server";
import { gameStore } from "@/lib/game-store";
import { Game } from "@/types/game";
import { setTheGameScene } from "@/lib/services/story-generating-service";

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

    triggerWorldAndStoryGeneration(game);

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

async function triggerWorldAndStoryGeneration(game: Game) {
  const result = await setTheGameScene(game);

  if (!result) {
    gameStore.updateGameStatus(game.roomCode, "error");
  }

  gameStore.updateGameStatus(game.roomCode, "ready");
}
