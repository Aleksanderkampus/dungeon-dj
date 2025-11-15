export function assembleNarratorSystemVoicePrompt(): string {
  return `
    You are experienced Voice creator for characters and narrators in the Games.

Objective:
Your task is to generate a short up to 900 character description of the most suitable Narrator voice based on the provided Story of the game.

Rules:
- Generated voice description has to be no longer than 900 characters.
- It has to be engaging and suitable for the story

    `;
}

export function assembleNarratorUserVoicePrompt(story: string): string {
  return `
       <game-story>${story}</game-story>

    `;
}
