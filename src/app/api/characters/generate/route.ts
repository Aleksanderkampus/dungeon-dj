import { NextRequest, NextResponse } from "next/server";
import { gameStore } from "@/lib/game-store";
import { generateCharacterSheet } from "@/lib/services/character-generation-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { roomCode, playerId, background } = body as {
      roomCode?: string;
      playerId?: string;
      background?: string;
    };

    if (!roomCode || !playerId || !background) {
      return NextResponse.json(
        { error: "Room code, player ID, and background are required" },
        { status: 400 }
      );
    }

    const trimmedBackground = background.trim();

    if (trimmedBackground.length < 50) {
      return NextResponse.json(
        { error: "Background must be at least 50 characters" },
        { status: 400 }
      );
    }

    if (trimmedBackground.length > 1500) {
      return NextResponse.json(
        { error: "Background must be less than 1500 characters" },
        { status: 400 }
      );
    }

    const normalizedRoomCode = roomCode.toUpperCase();
    const game = gameStore.getGame(normalizedRoomCode);

    if (!game) {
      return NextResponse.json(
        { error: "Game not found" },
        { status: 404 }
      );
    }

    const player = game.players.find((p) => p.id === playerId);

    if (!player) {
      return NextResponse.json(
        { error: "Player not found in this game" },
        { status: 404 }
      );
    }

    gameStore.updatePlayerBackground(
      normalizedRoomCode,
      playerId,
      trimmedBackground
    );
    gameStore.updatePlayerCharacterStatus(
      normalizedRoomCode,
      playerId,
      "generating"
    );

    try {
      const characterSheet = await generateCharacterSheet({
        game,
        player,
        background: trimmedBackground,
      });

      gameStore.setPlayerCharacterSheet(
        normalizedRoomCode,
        playerId,
        characterSheet
      );

      return NextResponse.json({ characterSheet });
    } catch (generationError) {
      const errorMessage =
        generationError instanceof Error
          ? generationError.message
          : "Failed to generate character sheet";

      gameStore.updatePlayerCharacterStatus(
        normalizedRoomCode,
        playerId,
        "error",
        errorMessage
      );

      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error generating character sheet:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
