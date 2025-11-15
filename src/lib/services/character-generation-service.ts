import OpenAI from "openai";
import dotenv from "dotenv";
import { Static, Type } from "@sinclair/typebox";
import { CharacterSheet, Game, Player } from "@/types/game";
import {
  assembleCharacterSystemPrompt,
  assembleCharacterUserPrompt,
} from "@/lib/prompts/character-generation-prompts";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const CharacterSheetSchema = Type.Object({
  name: Type.String({
    description: "In-world character name ready to use at the table",
  }),
  ancestry: Type.String({
    description: "Ancestry/species such as Human, Elf, Tiefling",
  }),
  characterClass: Type.String({
    description: "Adventuring class archetype such as Fighter or Wizard",
  }),
  level: Type.Integer({
    description: "Character level (1-5)",
    minimum: 1,
    maximum: 5,
  }),
  hitPoints: Type.Integer({
    description: "Recommended starting hit points",
    minimum: 4,
    maximum: 30,
  }),
  alignment: Type.String({
    description: "Short description of alignment or ethos",
  }),
  backgroundSummary: Type.String({
    description: "3-4 sentence summary of who they are and motivations",
  }),
  abilityScores: Type.Object({
    strength: Type.Integer({ minimum: 3, maximum: 18 }),
    dexterity: Type.Integer({ minimum: 3, maximum: 18 }),
    constitution: Type.Integer({ minimum: 3, maximum: 18 }),
    intelligence: Type.Integer({ minimum: 3, maximum: 18 }),
    wisdom: Type.Integer({ minimum: 3, maximum: 18 }),
    charisma: Type.Integer({ minimum: 3, maximum: 18 }),
  }),
  combatStyle: Type.String({
    description: "Sentence describing how they approach combat encounters",
  }),
  skills: Type.Array(
    Type.String({
      description: "Specific trained skills or proficiencies",
    }),
    { minItems: 3, maxItems: 8 }
  ),
  equipment: Type.Array(
    Type.String({ description: "Starting gear or signature items" }),
    { minItems: 3, maxItems: 10 }
  ),
  personalityTraits: Type.Array(
    Type.String({ description: "Short statements about personality" }),
    { minItems: 2, maxItems: 5 }
  ),
  specialAbilities: Type.Array(
    Type.String({
      description: "Class features, spells, or unique abilities",
    }),
    { minItems: 2, maxItems: 6 }
  ),
});

type CharacterSheetSchemaType = Static<typeof CharacterSheetSchema>;

export type CharacterSheetResponse = CharacterSheetSchemaType & CharacterSheet;

export async function generateCharacterSheet(params: {
  game: Game;
  player: Player;
  background: string;
}): Promise<CharacterSheetResponse> {
  const { game, player, background } = params;
  const systemPrompt = assembleCharacterSystemPrompt();
  const userPrompt = assembleCharacterUserPrompt({
    game,
    player,
    background,
  });

  const completion = await openai.chat.completions.create({
    model: "gpt-4.1",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "CharacterSheetResponse",
        schema: CharacterSheetSchema,
      },
    },
  });

  const message = completion.choices[0].message?.content;

  if (!message) {
    throw new Error("No character sheet generated");
  }

  try {
    const parsed = JSON.parse(message) as CharacterSheetResponse;
    return parsed;
  } catch (error) {
    throw new Error("Failed to parse character sheet JSON");
  }
}
