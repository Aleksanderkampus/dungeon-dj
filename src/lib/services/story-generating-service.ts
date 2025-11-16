"use server";

import OpenAI from "openai";
import { AIGeneratedGame, Game, RoomPlanSchema } from "@/types/game";
import "dotenv/config";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { generateAllRoomGrids } from "../grid-generator";

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

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const elevenlabs = new ElevenLabsClient();

export async function setTheGameScene(game: Game): Promise<AIGeneratedGame> {
  const generatedGameStory = await generateGameStory(game);

  const [gameMap, narratorVoiceId] = await Promise.all([
    generateGameMap(generatedGameStory),
    generateNarratorVoiceDescription(
      generatedGameStory,
      game.worldData.facilitatorPersona
    ),
  ]);

  // Generate 9x9 grid maps for each room with NPCs and equipment positioned
  const roomsWithGrids = generateAllRoomGrids(gameMap.rooms);

  return {
    story: generatedGameStory,
    map: {
      rooms: roomsWithGrids,
    },
    narratorVoice: {
      voiceId: narratorVoiceId,
    },
  };
}

export async function generateGameStory(game: Game): Promise<string> {
  const storySystemMessage = assembleStorySystemPrompt();
  const storyUserMessage = assembleStoryUserPrompt(game);

  const completion = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
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
    model: "gpt-4.1-mini",
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
  story: string,
  facilitatorPersona: string
): Promise<string> {
  const narratorSystemVoicePrompt = assembleNarratorSystemVoicePrompt();
  const narratorUserVoicePrompt = assembleNarratorUserVoicePrompt(
    story,
    facilitatorPersona
  );

  const completion = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      { role: "system", content: narratorSystemVoicePrompt },
      { role: "user", content: narratorUserVoicePrompt },
    ],
  });

  const voiceDescription = completion.choices[0].message?.content || "";

  const { previews } = await elevenlabs.textToVoice.design({
    modelId: "eleven_multilingual_ttv_v2",
    voiceDescription,
    text: facilitatorPersona || story,
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
