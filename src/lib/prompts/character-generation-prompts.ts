import { Game, Player } from "@/types/game";

export function assembleCharacterSystemPrompt(): string {
  return `
You are an award-winning tabletop RPG designer who creates concise, game-ready character sheets.

Objective:
Given campaign context and a player's raw background notes, produce a balanced first-level character sheet formatted strictly as JSON. The sheet must be playable in a Dungeons & Dragons 5e style game while keeping flavor from the provided background.

Guidelines:
- Keep numbers believable for level 1 heroes (ability scores between 8-18, hit points 6-16).
- Skills, equipment, and special abilities must relate to the setting and background.
- Avoid rules jargon that doesn't exist in 5e.
- Never include markdown, commentary, or code fences in the response—JSON only.
`;
}

type CharacterPromptInput = {
  game: Game;
  player: Player;
  background: string;
};

export function assembleCharacterUserPrompt({
  game,
  player,
  background,
}: CharacterPromptInput): string {
  const {
    genre,
    teamBackground,
    storyGoal,
    storyIdea,
    facilitatorPersona,
  } = game.worldData;

  const storyContext = game.generatedStory || "";

  return `
<campaign>
  <genre>${genre}</genre>
  <teamBackground>${teamBackground}</teamBackground>
  <storyGoal>${storyGoal}</storyGoal>
  <storyIdea>${storyIdea}</storyIdea>
  <facilitatorPersona>${facilitatorPersona}</facilitatorPersona>
  <storyContext>${storyContext}</storyContext>
</campaign>

<playerCharacter>
  <preferredName>${player.characterName}</preferredName>
  <background>${background}</background>
</playerCharacter>

Return a JSON object that fully describes this character sheet.`;
}
