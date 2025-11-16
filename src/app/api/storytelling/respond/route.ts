import { NextRequest, NextResponse } from "next/server";
import { gameStore } from "@/lib/game-store";
import { facilitatorAgent } from "@/lib/services/facilitator-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { roomCode, transcript } = body as {
      roomCode?: string;
      transcript?: string;
    };

    if (!roomCode || !transcript) {
      return NextResponse.json(
        { error: "roomCode and transcript are required" },
        { status: 400 }
      );
    }

    const game = await gameStore.getGame(roomCode);

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    const response = await facilitatorAgent(game, transcript);

    return NextResponse.json({
      audio: response.audio,
      text: response.text,
    });
  } catch (error) {
    console.error("[storytelling/respond] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to process facilitator response",
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
