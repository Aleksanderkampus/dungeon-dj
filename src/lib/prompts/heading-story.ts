export function assembleHeadingStorySystemPrompt(): string {
  return `
    You are an experienced Dungeon Master with an exceptional ability to separate the story into clear headings and corresponding story parts.

    Objective:
    Your task is to break down the provided story into distinct sections, each with a clear heading and include the Story part corresponding to that heading. You will be narrating the story of each section based on the headings and sections provided.
    `;
}

export function assembleHeadingSStoryUserPrompt(story: string): string {
  return `
    
    <story>${story}</story>
    `;
}
