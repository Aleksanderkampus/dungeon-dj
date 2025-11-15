import { NextRequest, NextResponse } from "next/server";
import { gameStore } from "@/lib/game-store";
import { nanoid } from "nanoid";
import { Game } from "@/types/game";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { roomCode, characterName, characterBackground } = body;

    if (!roomCode || !characterName) {
      return NextResponse.json(
        { error: "Room code and character name are required" },
        { status: 400 }
      );
    }

    const game = gameStore.getGame(roomCode.toUpperCase());
    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // Make a call to the n8n webhook to generate a character
    const character = await generateCharacter(characterBackground, roomCode);
    if (!character) {
      return NextResponse.json(
        { error: "Failed to generate character" },
        { status: 500 }
      );
    }

    // Generate player ID
    const playerId = nanoid();

    // Add player to game
    const player = {
      id: playerId,
      characterName,
      isReady: false,
      isHost: false,
      ...character,
      characterBackground,
      characterGenerationStatus: "idle" as const,
    };

    gameStore.addPlayer(roomCode.toUpperCase(), player);

    return NextResponse.json({ playerId });
  } catch (error) {
    console.error("Error joining game:", error);
    return NextResponse.json({ error: "Failed to join game" }, { status: 500 });
  }
}

async function generateCharacter(
  characterBackground: string,
  gameId: Game["roomCode"]
) {
  const response = await fetch(process.env.N8N_CHARACTER_WEBHOOK || "", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ characterBackground, gameId }),
  });
  return response.json();
}
