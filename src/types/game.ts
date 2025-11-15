export type CharacterGenerationStatus =
  | "idle"
  | "generating"
  | "ready"
  | "error";

export type AbilityScores = {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
};

export type CharacterSheet = {
  name: string;
  ancestry: string;
  characterClass: string;
  level: number;
  alignment: string;
  backgroundSummary: string;
  abilityScores: AbilityScores;
  combatStyle: string;
  skills: string[];
  equipment: string[];
  personalityTraits: string[];
  specialAbilities: string[];
};

export type Player = {
  id: string;
  characterName: string;
  isReady: boolean;
  isHost: boolean;
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
  characterBackground?: string;
  characterGenerationStatus?: CharacterGenerationStatus;
  characterGenerationError?: string;
  characterSheet?: CharacterSheet;
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
