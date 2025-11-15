import { NextRequest, NextResponse } from "next/server";
import { gameStore } from "@/lib/game-store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { roomCode, story, status } = body;

    if (!roomCode) {
      return NextResponse.json(
        { error: "Room code is required" },
        { status: 400 }
      );
    }

    const game = gameStore.getGame(roomCode);
    if (!game) {
      return NextResponse.json(
        { error: "Game not found" },
        { status: 404 }
      );
    }

    if (status === "success" && story) {
      gameStore.setGeneratedStory(roomCode, story);

      return NextResponse.json({ success: true });
    } else {
      // Mark as ready even if generation failed
      gameStore.updateGameStatus(roomCode, "ready");
      return NextResponse.json(
        { error: "Story generation failed" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in story callback:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
