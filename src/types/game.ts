export type Player = {
  id: string;
  characterName: string;
  isReady: boolean;
  race?: string;
  class?: string;
  skills?: string[];
  flaw?: string;
  hp?: number;
  strength?: number;
  dexterity?: number;
  constitution?: number;
  intelligence?: number;
  wisdom?: number;
  charisma?: number;
  generated_voice_id?: string;
};

export type GameStatus =
  | "generating"
  | "ready"
  | "in-progress"
  | "completed"
  | "error";

export type Game = {
  roomCode: string;
  players: Player[];
  status: GameStatus;
  worldData: {
    genre: string;
    teamBackground: string;
    storyGoal: string;
    storyIdea: string;
    facilitatorPersona: string;
    facilitatorVoice: string;
    actionsPerSession: string;
  };
  generatedStory?: string;
  createdAt: Date;
};
