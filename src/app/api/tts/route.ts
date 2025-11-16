import { facilitatorAgent } from "@/lib/services/facilitator-service";
import { gameStore } from "@/lib/game-store";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { roomCode } = body;

    if (!roomCode) {
      return NextResponse.json(
        { error: "Room code is required" },
        { status: 400 }
      );
    }

    // Get game from store
    const game = await gameStore.getGame(roomCode);

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // Call facilitator agent service to generate audio and get text
    // Pass undefined as second parameter to trigger first call (introduction)
    const response = await facilitatorAgent(game);

    // Return JSON with base64 audio, text, and current room data
    return NextResponse.json({
      audio: response.audio,
      text: response.text,
      currentRoom: response.currentRoom,
      currentSectionId: response.currentSectionId,
    });
  } catch (error) {
    console.error("Error in TTS endpoint:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
