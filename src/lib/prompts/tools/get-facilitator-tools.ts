import { RoomPlanSchema } from "@/types/game";
import { ChatCompletionTool } from "openai/resources";

export function getFacilitatorTools(
  roomData: string,
  currentSelectionIndex: number
): ChatCompletionTool[] {
  const tools: ChatCompletionTool[] = [
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
  ];

  const gameMap = JSON.parse(roomData) as RoomPlanSchema;

  if (
    gameMap.rooms[currentSelectionIndex] &&
    gameMap.rooms[currentSelectionIndex].equipments.length > 0
  ) {
    tools.push({
      type: "function",
      function: {
        name: "provide_one_equipment_from_current_room",
        description:
          "During interactions you can choose to provide one equipment found in the current room to the players. Use this function to provide one equipment from the current room to the players when appropriate.",
        parameters: {
          type: "object",
          properties: {
            provided_equipment: {
              type: "string",
              description:
                "The equipment provided to the players from the current room.",
              enum: gameMap.rooms[currentSelectionIndex].equipments,
            },
            message: {
                type: "string",
                description: "A message describing how the players found the equipment in the room and also describing the equipment itself.",
            }
          },
        },
      },
    });
  }
  return tools;
}
