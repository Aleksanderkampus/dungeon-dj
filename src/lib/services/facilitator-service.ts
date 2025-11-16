import OpenAI from "openai";
import dotenv from "dotenv";
import { Game, GameState, RoomPlanSchema } from "@/types/game";
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
import {
  ChatCompletionMessageFunctionToolCall,
  ChatCompletionTool,
} from "openai/resources";
import { getFacilitatorTools } from "../prompts/tools/get-facilitator-tools";

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

export interface FacilitatorResponse {
  audio: string; // base64 encoded audio
  text: string; // original text sent to TTS
  currentRoom?: any; // current room map data
  currentSectionId?: number; // current section ID being narrated
}

async function assembleGameState(game: Game) {
  let gameState = game.gameState;

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

  return gameState;
}

function getNarratedSelection(gameState: GameState) {
  return gameState.storySections.find(
    (section) => section.sectionStatus === "being_narrated"
  );
}

async function respond(
  game: Game,
  gameState: GameState,
  text: string
): Promise<FacilitatorResponse> {
  if (!game.narratorVoiceId) {
    throw new Error("Narrator voice ID is missing in the game data");
  }

  // Get current room data
  const currentSection = getNarratedSelection(gameState);
  let currentRoom = null;

  if (currentSection && game.roomData) {
    try {
      const roomPlan: RoomPlanSchema = JSON.parse(game.roomData);
      currentRoom = roomPlan.rooms[currentSection.id];
    } catch (error) {
      console.error("Error parsing room data in respond:", error);
    }
  }

  const [audioBuffer] = await Promise.all([
    createAudioStreamFromText(game.narratorVoiceId, text),
    gameStore.updateGameState(game.roomCode, gameState),
  ]);

  return {
    audio: audioBuffer.toString("base64"),
    text,
    currentRoom,
    currentSectionId: currentSection?.id,
  };
}

async function finishCurrentSelection(
  game: Game,
  gameState: GameState,
  currentSectionIndex: number,
  toolCall: ChatCompletionMessageFunctionToolCall
): Promise<FacilitatorResponse> {
  gameState.storySections[currentSectionIndex].interactionsTakenInTheRoom.push({
    role: "assistant",
    content: JSON.parse(toolCall.function.arguments).smooth_transition_message,
  });

  gameState.storySections[currentSectionIndex].sectionStatus = "has_completed";

  const nextSection = gameState.storySections.find(
    (section) => section.sectionStatus === "pending"
  );

  if (nextSection) {
    nextSection.sectionStatus = "being_narrated";
  }

  const textToConvert = JSON.parse(
    toolCall.function.arguments
  ).smooth_transition_message;

  return await respond(game, gameState, textToConvert);
}

async function provideEquipment(
  game: Game,
  gameState: GameState,
  currentSectionIndex: number,
  toolCall: ChatCompletionMessageFunctionToolCall
): Promise<FacilitatorResponse> {
  const { provided_equipment, message } = JSON.parse(
    toolCall.function.arguments
  );

  gameState.storySections[currentSectionIndex].interactionsTakenInTheRoom.push({
    role: "assistant",
    content: message,
  });

  // Parse roomData and remove the provided equipment from current room
  if (!game.roomData) {
    throw new Error("Room data is missing in the game data");
  }

  const roomPlan: RoomPlanSchema = JSON.parse(game.roomData);

  // Remove the provided equipment from the current room's equipment array
  if (roomPlan.rooms[currentSectionIndex]) {
    roomPlan.rooms[currentSectionIndex].equipments = roomPlan.rooms[
      currentSectionIndex
    ].equipments.filter((equipment) => equipment !== provided_equipment);
  }

  // Update roomData string
  const updatedRoomData = JSON.stringify(roomPlan);

  if (!game.narratorVoiceId) {
    throw new Error("Narrator voice ID is missing in the game data");
  }

  // Get current room data after equipment update
  const currentSection = gameState.storySections.find(
    (section) => section.sectionStatus === "being_narrated"
  );

  let currentRoom = null;
  if (currentSection) {
    try {
      const updatedRoomPlan: RoomPlanSchema = JSON.parse(updatedRoomData);
      currentRoom = updatedRoomPlan.rooms[currentSection.id];
    } catch (error) {
      console.error("Error parsing updated room data:", error);
    }
  }

  // Update both game state and room data in database
  const [audioBuffer] = await Promise.all([
    createAudioStreamFromText(game.narratorVoiceId, message),
    gameStore.updateGameStateAndRoomData(
      game.roomCode,
      gameState,
      updatedRoomData
    ),
  ]);

  return {
    audio: audioBuffer.toString("base64"),
    text: message,
    currentRoom,
    currentSectionId: currentSection?.id,
  };
}

export async function facilitatorAgent(
  game: Game,
  text?: string
): Promise<FacilitatorResponse> {
  const gameState = await assembleGameState(game);

  const currentSection = getNarratedSelection(gameState);

  if (!currentSection) {
    throw new Error("No story section is currently being narrated");
  }

  console.log("Generated Story Headings:", JSON.stringify(gameState));

  if (!text) {
    const textToConvert = gameState.storySections[currentSection.id].storyPart;
    return respond(game, gameState, textToConvert);
  }

  const tools: ChatCompletionTool[] = getFacilitatorTools(
    game.roomData || "{}",
    currentSection.id
  );

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
    tools,
  });

  console.log("OpenAI RESP", JSON.stringify(response));

  if (!response) {
    throw new Error("No Response received from OpenAI");
  }

  const messageContent = response.choices[0].message.content;
  const toolCalls = response.choices[0].message.tool_calls;

  if (messageContent && !toolCalls) {
    gameState.storySections[currentSection.id].interactionsTakenInTheRoom.push(
      response.choices[0].message
    );

    return await respond(game, gameState, messageContent);
  }

  if (!toolCalls) {
    throw new Error("No tool calls received from OpenAI");
  }

  if (toolCalls[0].type !== "function") {
    throw new Error("Unsupported tool call type received from OpenAI");
  }

  switch (toolCalls[0].function.name) {
    case "finish_current_story_section":
      return await finishCurrentSelection(
        game,
        gameState,
        currentSection.id,
        toolCalls[0]
      );
    case "provide_one_equipment_from_current_room":
      return await provideEquipment(
        game,
        gameState,
        currentSection.id,
        toolCalls[0]
      );

    default:
      break;
  }

  throw new Error("Unsupported tool call received from OpenAI");
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
  // @ts-expect-error - audioStream is a ReadableStream
  for await (const chunk of audioStream) {
    chunks.push(chunk);
  }
  const content = Buffer.concat(chunks);

  console.log("Finished reading audio stream.", content);
  return content;
}
