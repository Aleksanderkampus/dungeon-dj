import OpenAI from "openai";
import dotenv from "dotenv";
import { Game } from "@/types/game";
import { Static, Type } from "@sinclair/typebox";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import "dotenv/config";

import {
  assembleStorySystemPrompt,
  assembleStoryUserPrompt,
} from "../prompts/story-generation-prompts";
import {
  assembleMapGenerationSystemPrompt,
  assembleMapGenerationUserPrompt,
} from "../prompts/map-generation-prompts";
import {
  assembleNarratorSystemVoicePrompt,
  assembleNarratorUserVoicePrompt,
} from "../prompts/narrator-voice-prompts";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const elevenlabs = new ElevenLabsClient();

const RoomPlanSchema = Type.Object({
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

type RoomPlanSchema = Static<typeof RoomPlanSchema>;

export async function setTheGameScene(worldData: Game): Promise<{
  story: string;
  map: RoomPlanSchema;
  narratorVoice: { voiceId: string };
}> {
  const generatedGameStory = await generateGameStory(worldData);

  const [gameMap, narratorVoiceId] = await Promise.all([
    generateGameMap(generatedGameStory),
    generateNarratorVoiceDescription(generatedGameStory),
  ]);

  return {
    story: generatedGameStory,
    map: gameMap,
    narratorVoice: {
      voiceId: narratorVoiceId,
    },
  };
}

export async function generateGameStory(worldData: Game): Promise<string> {
  const storySystemMessage = assembleStorySystemPrompt();
  const storyUserMessage = assembleStoryUserPrompt(worldData);

  const completion = await openai.chat.completions.create({
    model: "gpt-4.1",
    messages: [
      { role: "system", content: storySystemMessage },
      { role: "user", content: storyUserMessage },
    ],
  });

  const story = completion.choices[0].message?.content || "";
  return story;
}

export async function generateGameMap(story: string): Promise<RoomPlanSchema> {
  const storySystemMessage = assembleMapGenerationSystemPrompt();
  const storyUserMessage = assembleMapGenerationUserPrompt(story);

  const completion = await openai.chat.completions.create({
    model: "gpt-4.1",
    messages: [
      { role: "system", content: storySystemMessage },
      { role: "user", content: storyUserMessage },
    ],
    response_format: {
      type: "json_schema",
      json_schema: { name: "RoomsPlanResponse", schema: RoomPlanSchema },
    },
  });

  if (!completion.choices[0].message?.content) {
    throw new Error("No content received from OpenAI");
  }

  try {
    const parsed = JSON.parse(completion.choices[0].message.content);
    return parsed as RoomPlanSchema;
  } catch (error) {
    throw new Error("Failed to parse OpenAI response as JSON");
  }
}

export async function generateNarratorVoiceDescription(
  story: string
): Promise<string> {
  const narratorSystemVoicePrompt = assembleNarratorSystemVoicePrompt();
  const narratorUserVoicePrompt = assembleNarratorUserVoicePrompt(story);

  const completion = await openai.chat.completions.create({
    model: "gpt-4.1",
    messages: [
      { role: "system", content: narratorSystemVoicePrompt },
      { role: "user", content: narratorUserVoicePrompt },
    ],
  });

  const voiceDescription = completion.choices[0].message?.content || "";

  const { previews } = await elevenlabs.textToVoice.design({
    modelId: "eleven_multilingual_ttv_v2",
    voiceDescription,
    text: "My mouth is so big. I would need to fill it. If there would be someone who would help me, scratch my throat.",
  });

  const firstPreview = previews[0];
  if (!firstPreview) {
    throw new Error("No voice preview generated");
  }

  const voice = await elevenlabs.textToVoice.create({
    voiceName: "DnD Legend Narrator",
    voiceDescription,
    generatedVoiceId: firstPreview.generatedVoiceId,
  });

  return voice.voiceId;
}
