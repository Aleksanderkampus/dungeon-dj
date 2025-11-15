import {
  CharacterGenerationStatus,
  CharacterSheet,
  Game,
  Player,
  AIGeneratedGame
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
      players: [],
      worldData,
    };

    const { data, error } = await supabase
      .from("games")
      .insert({
        room_code: roomCode,
        status: game.status,
        genre: worldData.genre,
        team_background: worldData.teamBackground,
        story_goal: worldData.storyGoal,
        story_idea: worldData.storyIdea,
        actions_per_session: worldData.actionsPerSession,
      })
      .select("id")
      .single();

    if (error) {
      console.log("Supabase insert error:", error);
    }

    if (data?.id) {
      game.supabaseId = data.id;
    }

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

    return updatedGame;
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

    const player = game.players.find((p) => p.id === playerId);
    if (!player) return null;

    player.isReady = isReady;
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

    game.players = game.players.filter((p) => p.id !== playerId);
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
      player.hp = sheet.hitPoints;
      player.strength = sheet.abilityScores.strength;
      player.dexterity = sheet.abilityScores.dexterity;
      player.constitution = sheet.abilityScores.constitution;
      player.intelligence = sheet.abilityScores.intelligence;
      player.wisdom = sheet.abilityScores.wisdom;
      player.charisma = sheet.abilityScores.charisma;
      player.skills = sheet.skills;
      player.race = sheet.ancestry;
      player.class = sheet.characterClass;
      player.characterGenerationStatus = "ready";
      player.characterGenerationError = undefined;
    });
  }

  async savePlayerCharacterToDatabase(params: {
    roomCode: string;
    playerId: string;
    sheet: CharacterSheet;
    background: string;
  }) {
    const { roomCode, playerId, sheet, background } = params;
    const game = this.games.get(roomCode);
    if (!game) {
      console.error(
        "[gameStore] Unable to persist player — game missing for room",
        roomCode
      );
      return;
    }

    const supabaseGameId = await this.ensureSupabaseGameId(roomCode);
    if (!supabaseGameId) {
      console.error("Unable to resolve Supabase game id for room", roomCode);
      return;
    }

    const player = game.players.find((p) => p.id === playerId);
    if (!player) {
      console.error(
        "[gameStore] Unable to persist player — player not found",
        playerId
      );
      return;
    }

    const payload = {
      name: sheet.name || player?.characterName || "Unknown Adventurer",
      backstory: background,
      HP: sheet.hitPoints,
      attributes: sheet.abilityScores,
      skills: sheet.skills,
      equipment: sheet.equipment,
      game_id: supabaseGameId,
    };

    console.log("[gameStore] Inserting player into Supabase", {
      gameId: supabaseGameId,
      playerId,
      name: payload.name,
    });

    const { data, error } = await supabase
      .from("players")
      .insert(payload)
      .select("id")
      .single();
    if (error) {
      console.error("Supabase player insert error:", error);
    } else {
      console.log("[gameStore] Player stored in Supabase", {
        playerId,
        supabasePlayerId: data?.id,
      });
    }
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

  private async ensureSupabaseGameId(
    roomCode: string
  ): Promise<number | null> {
    const game = this.games.get(roomCode);
    if (!game) return null;

    if (game.supabaseId) {
      return game.supabaseId;
    }

    const { data, error } = await supabase
      .from("games")
      .select("id")
      .eq("room_code", roomCode)
      .single();

    if (error || !data?.id) {
      console.error("Failed to load Supabase game id:", error);
      return null;
    }

    game.supabaseId = data.id;
    this.games.set(roomCode, game);
    return data.id;
  }
}

export const gameStore = new GameStore();
