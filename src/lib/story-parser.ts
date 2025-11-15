/**
 * Parses the introduction section from a story markdown string
 * Introduction starts with "### INTRODUCTION" and ends with "---"
 */
export function parseIntroduction(story: string): string {
  const introStart = story.indexOf('### INTRODUCTION');

  if (introStart === -1) {
    throw new Error('No introduction section found in story');
  }

  // Find the content after the header
  const contentStart = story.indexOf('\n', introStart) + 1;

  // Find the end marker
  const endMarker = story.indexOf('---', contentStart);

  if (endMarker === -1) {
    throw new Error('No end marker (---) found for introduction');
  }

  // Extract and trim the introduction text
  const introduction = story.slice(contentStart, endMarker).trim();

  return introduction;
}

/**
 * Splits text into sentences for progressive display
 * Handles common sentence endings: . ! ?
 */
export function splitIntoSentences(text: string): string[] {
  // Split on sentence endings followed by space or end of string
  // Preserve the punctuation in the sentence
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  return sentences;
}
