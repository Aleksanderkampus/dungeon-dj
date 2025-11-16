import { RoomPlanSchema } from "@/types/game";
import { ChatCompletionTool } from "openai/resources";

export function getFacilitatorTools(
  roomData: string,
  currentSelectionIndex: number,
  playerNames: string[]
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
              description:
                "A message describing how the players found the equipment in the room and also describing the equipment itself.",
            },
          },
        },
      },
    });
  }

  // Add move_player tool
  tools.push({
    type: "function",
    function: {
      name: "move_player",
      description:
        "Move a player on the grid map. Players can move towards NPCs, equipment, walls, or to random positions. Use this when players explicitly request to move or approach something.",
      parameters: {
        type: "object",
        properties: {
          player_name: {
            type: "string",
            description:
              "The name of the player to move. Extract this from the conversation context.",
            enum: playerNames,
          },
          target_type: {
            type: "string",
            description:
              "The type of target to move towards. If not specified by player, use 'random'.",
            enum: ["npc", "equipment", "wall", "random"],
          },
          equipment_name: {
            type: "string",
            description:
              "The name of the equipment to move towards (required if target_type is 'equipment').",
            enum:
              gameMap.rooms[currentSelectionIndex]?.equipments.length > 0
                ? gameMap.rooms[currentSelectionIndex].equipments
                : undefined,
          },
          message: {
            type: "string",
            description:
              "A narrative message describing the player's movement in the room.",
          },
        },
        required: ["player_name", "target_type", "message"],
      },
    },
  });

  return tools;
}
