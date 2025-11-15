import {
  CharacterGenerationStatus,
  CharacterSheet,
  Game,
  Player,
  AIGeneratedGame,
} from "@/types/game";
import { supabase } from "../lib/services/supabase";

// Preserve game store across HMR in development
const globalForGameStore = globalThis as unknown as {
  gameStoreMap: Map<string, Game> | undefined;
};

class GameStore {
  private games: Map<string, Game>;

  constructor() {
    // Reuse existing map in development to survive HMR
    if (
      process.env.NODE_ENV === "development" &&
      globalForGameStore.gameStoreMap
    ) {
      this.games = globalForGameStore.gameStoreMap;
    } else {
      this.games = new Map();
      if (process.env.NODE_ENV === "development") {
        globalForGameStore.gameStoreMap = this.games;
      }
    }
  }

  generateRoomCode(): string {
    // Generate 6-character alphanumeric code
    const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    // Ensure uniqueness
    if (this.games.has(code)) {
      return this.generateRoomCode();
    }

    return code;
  }

  async createGame(worldData: Game["worldData"]): Promise<Game> {
    const roomCode = this.generateRoomCode();
    const game: Game = {
      roomCode,
      status: "generating",
      worldData,
    };

    const { error } = await supabase.from("games").insert({
      room_code: roomCode,
      status: game.status,
      genre: worldData.genre,
      team_background: worldData.teamBackground,
      story_goal: worldData.storyGoal,
      story_idea: worldData.storyIdea,
      actions_per_session: worldData.actionsPerSession,
    });

    console.log("Supabase insert error:", error);
    this.games.set(roomCode, game);
    return game;
  }

  async addStoryAndMapToGame(
    roomCode: string,
    aiGeneratedGame: AIGeneratedGame
  ) {
    const { story, map, narratorVoice } = aiGeneratedGame;

    const currentGame = this.games.get(roomCode);

    if (!currentGame) {
      throw new Error("No room exists");
    }

    const updatedGame = {
      room_code: roomCode,
      status: currentGame.status,
      genre: currentGame.worldData.genre,
      team_background: currentGame.worldData.teamBackground,
      story_goal: currentGame.worldData.storyGoal,
      story_idea: currentGame.worldData.storyIdea,
      actions_per_session: currentGame.worldData.actionsPerSession,
      story,
      narrator_voice_id: narratorVoice.voiceId,
      room_data: JSON.stringify(map),
    };

    this.games.set(roomCode, {
      ...currentGame,
      story,
      narratorVoiceId: narratorVoice.voiceId,
      roomData: JSON.stringify(map),
    });

    const { error } = await supabase
      .from("games")
      .update(updatedGame)
      .eq("room_code", roomCode);

    console.log("Supabase update error:", error);

    return {
      ...currentGame,
      story,
      narratorVoiceId: narratorVoice.voiceId,
      roomData: JSON.stringify(map),
    };
  }

  getGame(roomCode: string): Game | undefined {
    return this.games.get(roomCode);
  }

  addPlayer(roomCode: string, player: Player): Game | null {
    const game = this.games.get(roomCode);
    if (!game) return null;

    const normalizedPlayer: Player = {
      ...player,
      characterGenerationStatus: player.characterGenerationStatus ?? "idle",
    };

    game.players.push(normalizedPlayer);
    this.games.set(roomCode, game);
    return game;
  }

  updatePlayerReady(
    roomCode: string,
    playerId: string,
    isReady: boolean
  ): Game | null {
    const game = this.games.get(roomCode);
    if (!game) return null;

    // const player = game.players.find((p) => p.id === playerId);
    // if (!player) return null;

    // player.isReady = isReady;
    this.games.set(roomCode, game);
    return game;
  }

  updateGameStatus(roomCode: string, status: Game["status"]): Game | null {
    const game = this.games.get(roomCode);
    if (!game) return null;

    game.status = status;
    this.games.set(roomCode, game);
    return game;
  }

  setGeneratedStory(roomCode: string, story: string): Game | null {
    const game = this.games.get(roomCode);
    if (!game) return null;

    game.story = story;
    game.status = "ready";
    this.games.set(roomCode, game);
    return game;
  }

  removePlayer(roomCode: string, playerId: string): Game | null {
    const game = this.games.get(roomCode);
    if (!game) return null;

    // game.players = game.players.filter((p) => p.id !== playerId);
    this.games.set(roomCode, game);
    return game;
  }

  deleteGame(roomCode: string): boolean {
    return this.games.delete(roomCode);
  }

  updatePlayerBackground(
    roomCode: string,
    playerId: string,
    background: string
  ): Game | null {
    return this.updatePlayerState(roomCode, playerId, (player) => {
      player.characterBackground = background;
    });
  }

  updatePlayerCharacterStatus(
    roomCode: string,
    playerId: string,
    status: CharacterGenerationStatus,
    error?: string
  ): Game | null {
    return this.updatePlayerState(roomCode, playerId, (player) => {
      player.characterGenerationStatus = status;
      player.characterGenerationError = error;
      if (status !== "error") {
        player.characterGenerationError = undefined;
      }
    });
  }

  setPlayerCharacterSheet(
    roomCode: string,
    playerId: string,
    sheet: CharacterSheet
  ): Game | null {
    return this.updatePlayerState(roomCode, playerId, (player) => {
      player.characterSheet = sheet;
      player.characterGenerationStatus = "ready";
      player.characterGenerationError = undefined;
    });
  }

  private updatePlayerState(
    roomCode: string,
    playerId: string,
    updater: (player: Player) => void
  ): Game | null {
    const game = this.games.get(roomCode);
    if (!game) return null;

    const player = game.players.find((p) => p.id === playerId);
    if (!player) return null;

    updater(player);
    this.games.set(roomCode, game);
    return game;
  }
}

export const gameStore = new GameStore();
