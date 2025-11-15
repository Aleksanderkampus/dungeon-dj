import OpenAI from "openai";
import dotenv from "dotenv";
import { Game } from "@/types/game";
import { Static, Type } from "@sinclair/typebox";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import "dotenv/config";
import { text } from "stream/consumers";
import {
  assembleHeadingSStoryUserPrompt,
  assembleHeadingStorySystemPrompt,
} from "../prompts/heading-story";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const elevenlabs = new ElevenLabsClient();

const StoryHeadings = Type.Object({
  headings: Type.Array(
    Type.Object({
      heading: Type.String({ description: "Heading of the story part" }),
      storyPart: Type.String({
        description: "Story part corresponding to the heading",
      }),
    }),
    {
      description:
        "Array of story headings and their parts to include in the story telling",
    }
  ),
});

type StoryHeadings = Static<typeof StoryHeadings>;

export async function facilitatorAgent(game: Game) {
  const memory = {
    currentStep: "Instroduction",
  };

  const storyheadings = await generateHeadings(game, memory.currentStep);

  await createAudioStreamFromText(storyheadings.headings[0].storyPart);
}

export async function generateHeadings(
  game: Game,
  step: string
): Promise<StoryHeadings> {
  const storySteps = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      { role: "system", content: assembleHeadingStorySystemPrompt() },
      {
        role: "user",
        content: assembleHeadingSStoryUserPrompt(game.generatedStory || ""),
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: { name: "StoryHeadingMapResponse", schema: StoryHeadings },
    },
  });

  if (!storySteps || !storySteps.choices[0].message?.content) {
    throw new Error("Failed to generate story headings");
  }

  try {
    const storyHeadings: StoryHeadings = JSON.parse(
      storySteps.choices[0].message.content
    );

    return storyHeadings;
  } catch (error) {
    throw new Error("Failed to parse story headings from response");
  }
}

export async function createAudioStreamFromText(text: string): Promise<Buffer> {
  const audioStream = await elevenlabs.textToSpeech.stream(
    "JBFqnCBsd6RMkjVDRZzb",
    {
      modelId: "eleven_multilingual_v2",
      text,
      outputFormat: "mp3_44100_128",
      // // Optional voice settings that allow you to customize the output
      // voiceSettings: {
      //   stability: 0,
      //   similarityBoost: 1.0,
      //   useSpeakerBoost: true,
      //   speed: 1.0,
      // },
    }
  );
  const chunks: Buffer[] = [];
  for await (const chunk of audioStream) {
    chunks.push(chunk);
  }
  const content = Buffer.concat(chunks);
  return content;
}
