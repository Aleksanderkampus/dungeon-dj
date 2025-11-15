import { Game, Player } from "@/types/game";

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

  createGame(worldData: Game["worldData"]): Game {
    const roomCode = this.generateRoomCode();
    const game: Game = {
      roomCode,
      players: [],
      status: "generating",
      worldData,
      createdAt: new Date(),
    };

    this.games.set(roomCode, game);
    return game;
  }

  getGame(roomCode: string): Game | undefined {
    return this.games.get(roomCode);
  }

  addPlayer(roomCode: string, player: Player): Game | null {
    const game = this.games.get(roomCode);
    if (!game) return null;

    game.players.push(player);
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

    game.generatedStory = story;
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
}

export const gameStore = new GameStore();
