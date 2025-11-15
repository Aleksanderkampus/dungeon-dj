import { NextRequest, NextResponse } from "next/server";
import { gameStore } from "@/lib/game-store";

export async function GET(
  req: NextRequest,
  { params }: { params: { roomCode: string } }
) {
  const roomCode = params.roomCode.toUpperCase();
  const game = gameStore.getGame(roomCode);

  if (!game) {
    return NextResponse.json(
      { error: "Game not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ game });
}
