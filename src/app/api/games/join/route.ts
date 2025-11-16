import { NextRequest, NextResponse } from "next/server";
import { gameStore } from "@/lib/game-store";
import { nanoid } from "nanoid";
import { generateCharacterSheet } from "@/lib/services/character-generation-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { roomCode, characterName, characterBackground } = body;
    console.log("[join] Incoming request", {
      roomCode,
      characterName,
      hasBackground: Boolean(characterBackground),
    });

    if (!roomCode || !characterName || !characterBackground) {
      return NextResponse.json(
        { error: "Room code, character name, and background are required" },
        { status: 400 }
      );
    }

    const normalizedRoomCode = roomCode.toUpperCase();
    console.log("[join] Normalized room code", normalizedRoomCode);
    const game = gameStore.getGame(normalizedRoomCode);
    if (!game) {
      console.warn("[join] Game not found for code", normalizedRoomCode);
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // Generate player ID
    const playerId = nanoid();

    // Add player to game
    const player = {
      id: playerId,
      characterName,
      isReady: false,
      isHost: false,
      characterBackground,
      characterGenerationStatus: "generating" as const,
    };

    const updatedGame = gameStore.addPlayer(normalizedRoomCode, player);
    console.log("[join] Added player to game", {
      roomCode: normalizedRoomCode,
      playerId,
      playerCount: updatedGame?.players.length,
    });
    if (!updatedGame) {
      return NextResponse.json(
        { error: "Failed to add player to game" },
        { status: 500 }
      );
    }

    gameStore.updatePlayerBackground(
      normalizedRoomCode,
      playerId,
      characterBackground
    );

    generateCharacterForPlayer({
      roomCode: normalizedRoomCode,
      playerId,
      characterBackground,
      playerSnapshot: player,
    });

    return NextResponse.json({ playerId });
  } catch (error) {
    console.error("[join] Error joining game:", error);
    return NextResponse.json({ error: "Failed to join game" }, { status: 500 });
  }
}

async function generateCharacterForPlayer(params: {
  roomCode: string;
  playerId: string;
  playerSnapshot: {
    id: string;
    characterName: string;
    isReady: boolean;
    isHost: boolean;
    characterBackground: string;
  };
  characterBackground: string;
}) {
  const { roomCode, playerId, characterBackground } = params;

  try {
    const enrichedGame = await gameStore.getGame(roomCode);
    if (!enrichedGame) {
      throw new Error("Game state missing after adding player");
    }

    const characterSheet = await generateCharacterSheet({
      game: enrichedGame,
      player: params.playerSnapshot,
      background: characterBackground,
    });

    gameStore.setPlayerCharacterSheet(roomCode, playerId, characterSheet);

    await gameStore.savePlayerCharacterToDatabase({
      roomCode,
      playerId,
      sheet: characterSheet,
      background: characterBackground,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate character";
    console.error("[join] Error generating character sheet:", error);
    gameStore.updatePlayerCharacterStatus(roomCode, playerId, "error", message);
  }
}
