"use server";

import { NextRequest, NextResponse } from "next/server";
import { gameStore } from "@/lib/game-store";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ roomCode: string }> }
) {
  const { roomCode } = await params;
  const game = await gameStore.getGame(roomCode.toUpperCase());

  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  return NextResponse.json({ game });
}
