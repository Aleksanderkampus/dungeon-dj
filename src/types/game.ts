export type Player = {
  id: string;
  characterName: string;
  isReady: boolean;
  isHost: boolean;
};

export type GameStatus = "generating" | "ready" | "in-progress" | "completed";

export type Game = {
  roomCode: string;
  players: Player[];
  status: GameStatus;
  worldData: {
    genre: string;
    teamBackground: string;
    storyGoal: string;
    storyDescription: string;
    facilitatorPersona: string;
    facilitatorVoice: string;
    actionsPerSession: string;
  };
  generatedStory?: string;
  createdAt: Date;
};
