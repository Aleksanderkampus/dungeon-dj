import { Static, Type } from "@sinclair/typebox";

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
  createdAt?: Date;
  story?: string;
  roomData?: string;
  gameState?: string;
  updatedAt?: Date;
  narratorVoiceId?: string;
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
