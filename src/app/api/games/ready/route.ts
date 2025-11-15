import { NextRequest, NextResponse } from "next/server";
import { gameStore } from "@/lib/game-store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { roomCode, playerId, isReady } = body;

    if (!roomCode || !playerId || typeof isReady !== "boolean") {
      return NextResponse.json(
        { error: "Room code, player ID, and ready status are required" },
        { status: 400 }
      );
    }

    const game = gameStore.updatePlayerReady(
      roomCode.toUpperCase(),
      playerId,
      isReady
    );

    if (!game) {
      return NextResponse.json(
        { error: "Game or player not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating ready status:", error);
    return NextResponse.json(
      { error: "Failed to update ready status" },
      { status: 500 }
    );
  }
}
