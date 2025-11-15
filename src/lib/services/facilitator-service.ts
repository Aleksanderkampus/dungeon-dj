import OpenAI from "openai";
import dotenv from "dotenv";
import { Game, RoomPlanSchema } from "@/types/game";
import { Static, Type } from "@sinclair/typebox";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import "dotenv/config";
import {
  assembleHeadingSStoryUserPrompt,
  assembleHeadingStorySystemPrompt,
} from "../prompts/heading-story";
import {
  assembleInteractionAnswerSystemPrompt,
  assembleInteractionAnswerUserPrompt,
} from "../prompts/facilitator-prompts";
import { gameStore } from "@/lib/game-store";

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

export async function facilitatorAgent(game: Game, text?: string) {
  let gameState = game.gameState;

  const roomPlan = JSON.parse(game.roomData || "{}") as RoomPlanSchema;

  if (!gameState) {
    const storyheadings = await generateHeadings(game);
    gameState = {
      storySections: storyheadings.headings.map((heading, index) => {
        return {
          id: index,
          heading: heading.heading,
          storyPart: heading.storyPart,
          sectionStatus: index === 0 ? "being_narrated" : "pending",
          interactionsTakenInTheRoom: [],
        };
      }),
    };

    gameState.storySections[0].interactionsTakenInTheRoom.push({
      role: "system",
      content: gameState.storySections[0].storyPart,
    });
  }

  const currentSection = gameState.storySections.find(
    (section) => section.sectionStatus === "being_narrated"
  );

  if (!currentSection) {
    throw new Error("No story section is currently being narrated");
  }

  console.log("Generated Story Headings:", JSON.stringify(gameState));

  if (!game.narratorVoiceId) {
    throw new Error("Narrator voice ID is missing in the game data");
  }

  if (!text) {
    const [bufferSTream, _] = await Promise.all([
      createAudioStreamFromText(
        game.narratorVoiceId,
        gameState.storySections[currentSection.id].storyPart
      ),
      gameStore.updateGameState(game.roomCode, gameState),
    ]);
    return bufferSTream;
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      ...gameState.storySections[currentSection.id].interactionsTakenInTheRoom,
      { role: "system", content: assembleInteractionAnswerSystemPrompt() },
      {
        role: "user",
        content: assembleInteractionAnswerUserPrompt(
          gameState.storySections[currentSection.id].storyPart,
          text
        ),
      },
    ],
    tools: [
      {
        type: "function",
        function: {
          name: "finish_current_story_section",
          description:
            "Finishes the current story section and moves to the next one",
          parameters: {
            type: "object",
            properties: {
              smooth_transition_message: {
                type: "string",
                description:
                  "A message that smoothly transitions from the current story section to the next one.",
              },
            },
          },
        },
      },
    ],
  });

  console.log("OpenAI RESP", JSON.stringify(response));

  if (!response) {
    throw new Error("No Response received from OpenAI");
  }

  const toolCalls = response.choices[0].message.tool_calls;

  if (toolCalls) {
    if (
      toolCalls[0].type === "function" &&
      toolCalls[0].function.name === "finish_current_story_section"
    ) {
      game.gameState?.storySections[
        currentSection.id
      ].interactionsTakenInTheRoom.push({
        role: "assistant",
        content: JSON.parse(toolCalls[0].function.arguments)
          .smooth_transition_message,
      });

      game.gameState!.storySections[currentSection.id].sectionStatus =
        "has_completed";

      const nextSection = game.gameState!.storySections.find(
        (section) => section.sectionStatus === "pending"
      );

      if (nextSection) {
        nextSection.sectionStatus = "being_narrated";
      }

      const [bufferSTream, _] = await Promise.all([
        createAudioStreamFromText(
          game.narratorVoiceId,
          JSON.parse(toolCalls[0].function.arguments).smooth_transition_message
        ),
        gameStore.updateGameState(game.roomCode, gameState),
      ]);
      return bufferSTream;
    }
  }

  if (!response.choices[0].message.content) {
    throw new Error("No content received from OpenAI");
  }

  const facilitatorReply = response.choices[0].message.content;

  game.gameState?.storySections[
    currentSection.id
  ].interactionsTakenInTheRoom.push(response.choices[0].message);

  const [bufferSTream, _] = await Promise.all([
    createAudioStreamFromText(game.narratorVoiceId, facilitatorReply),
    gameStore.updateGameState(game.roomCode, game.gameState),
  ]);

  return bufferSTream;
}

export async function generateHeadings(game: Game): Promise<StoryHeadings> {
  const storySteps = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      { role: "system", content: assembleHeadingStorySystemPrompt() },
      {
        role: "user",
        content: assembleHeadingSStoryUserPrompt(
          game.roomData || "",
          game.story || ""
        ),
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

export async function createAudioStreamFromText(
  voiceId: string,
  text: string
): Promise<Buffer> {
  const audioStream = await elevenlabs.textToSpeech.stream(voiceId, {
    modelId: "eleven_multilingual_v2",
    text,
    // outputFormat: "mp3_44100_128",
    // // Optional voice settings that allow you to customize the output
    // voiceSettings: {
    //   stability: 0,
    //   similarityBoost: 1.0,
    //   useSpeakerBoost: true,
    //   speed: 1.0,
    // },
  });
  const chunks: Buffer[] = [];

  console.log("Starting to read audio stream...", audioStream);
  for await (const chunk of audioStream) {
    chunks.push(chunk);
  }
  const content = Buffer.concat(chunks);

  console.log("Finished reading audio stream.", content);
  return content;
}
