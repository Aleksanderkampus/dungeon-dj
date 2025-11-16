import { Static, Type } from "@sinclair/typebox";
import { ChatCompletionMessageParam } from "openai/resources";

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
  hitPoints: number;
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
  status: GameStatus;
  players: Player[];
  worldData: {
    genre: string;
    teamBackground: string;
    storyGoal: string;
    storyIdea: string;
    facilitatorPersona: string;
    facilitatorVoice: string;
    actionsPerSession: string;
  };
  createdAt?: Date;
  story?: string;
  roomData?: string;
  gameState?: GameState;
  updatedAt?: Date;
  narratorVoiceId?: string;
  supabaseId?: number;
};

export const RoomPlanSchema = Type.Object({
  rooms: Type.Array(
    Type.Object({
      npc: Type.Object({
        npcName: Type.String({ description: "Name of the NPC" }),
        npcType: Type.String({
          description: "Type of NPC",
          enum: ["bad", "neutral", "good"],
        }),
        damage: Type.Number({
          description: "Damage that the provided NPC can do. Maximum is 5",
          minimum: 0,
          maximum: 5,
        }),
      }),
      roomDescription: Type.String({
        description:
          "In-depth description of a room that takes into account the NPCs that are there.",
      }),
      equipments: Type.Array(
        Type.String({
          description: "Equipment that can be found in the room",
        }),
        { description: "Equipments that can be found in the room" }
      ),
    }),
    {
      description:
        "Array of all the room objects with their NPCs and equipments",
    }
  ),
});

export type RoomPlanSchema = Static<typeof RoomPlanSchema>;

export type AIGeneratedGame = {
  story: string;
  map: RoomPlanSchema;
  narratorVoice: { voiceId: string };
};

export type StorySectionObject = {
  id: number;
  heading: string;
  storyPart: string;
  sectionStatus: "pending" | "being_narrated" | "has_completed";
  interactionsTakenInTheRoom: ChatCompletionMessageParam[];
};

export type GameState = {
  storySections: StorySectionObject[];
};
