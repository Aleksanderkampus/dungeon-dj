import { NextRequest, NextResponse } from "next/server";
import { gameStore } from "@/lib/game-store";
import { nanoid } from "nanoid";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { roomCode, characterName } = body;

    if (!roomCode || !characterName) {
      return NextResponse.json(
        { error: "Room code and character name are required" },
        { status: 400 }
      );
    }

    const game = gameStore.getGame(roomCode.toUpperCase());
    if (!game) {
      return NextResponse.json(
        { error: "Game not found" },
        { status: 404 }
      );
    }

    // Check if character name is already taken
    const nameTaken = game.players.some(
      (p) => p.characterName.toLowerCase() === characterName.toLowerCase()
    );
    if (nameTaken) {
      return NextResponse.json(
        { error: "Character name already taken" },
        { status: 409 }
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
    };

    gameStore.addPlayer(roomCode.toUpperCase(), player);

    return NextResponse.json({ playerId });
  } catch (error) {
    console.error("Error joining game:", error);
    return NextResponse.json(
      { error: "Failed to join game" },
      { status: 500 }
    );
  }
}
