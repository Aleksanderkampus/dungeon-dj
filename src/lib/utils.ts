import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type EntityType = 'npc' | 'enemy';

export interface GridEntity {
  x: number; // 1-indexed column (1 = leftmost)
  y: number; // 1-indexed row (1 = topmost)
  type: EntityType;
}

/**
 * Generates a text-based grid using ASCII characters
 * @param width - Number of squares in width
 * @param height - Number of squares in height
 * @param entities - Optional array of entities to place on the grid
 * @returns Array of strings representing each line of the grid
 *
 * @example
 * const grid = generateGrid(3, 2, [
 *   { x: 1, y: 1, type: 'npc' },    // @ in top-left
 *   { x: 3, y: 1, type: 'enemy' }   // X in top-right
 * ]);
 * // Returns:
 * // [
 * //   '+---------+---------+---------+',
 * //   '|         |         |         |',
 * //   '|    @    |         |    X    |',
 * //   '|         |         |         |',
 * //   '+---------+---------+---------+',
 * //   '|         |         |         |',
 * //   '|         |         |         |',
 * //   '|         |         |         |',
 * //   '+---------+---------+---------+'
 * // ]
 */
export function generateGrid(
  width: number,
  height: number,
  entities: GridEntity[] = []
): string[] {
  const grid: string[] = [];
  const cellSize = 9; // 3 times bigger (was 3, now 9)

  // Create horizontal border line
  const borderLine = '+' + '-'.repeat(cellSize) + '+'.repeat(width - 1) + '-'.repeat(cellSize) + '+';

  // Create content line (empty cells)
  const contentLine = '|' + ' '.repeat(cellSize) + '|'.repeat(width - 1) + ' '.repeat(cellSize) + '|';

  // Build the grid: each square is now 3 rows tall
  for (let row = 0; row < height; row++) {
    grid.push(borderLine);
    // Add 3 content lines for each row to make squares taller
    for (let i = 0; i < 3; i++) {
      grid.push(contentLine);
    }
  }

  // Add final bottom border
  grid.push(borderLine);

  // Place entities on the grid
  entities.forEach((entity) => {
    const { x, y, type } = entity;

    // Validate coordinates (1-indexed)
    if (x < 1 || x > width || y < 1 || y > height) {
      console.warn(`Entity at (${x},${y}) is out of bounds for ${width}x${height} grid`);
      return;
    }

    // Calculate the line index and character position
    // Each cell is 3 rows tall + 1 border row = 4 rows per grid row
    // Middle row of the cell is at offset 2 (0=border, 1=top, 2=middle, 3=bottom)
    const lineIndex = (y - 1) * 4 + 2;

    // Each cell is 9 characters wide + 1 border character
    // Middle character of the cell is at offset 5 (4 spaces, then middle char)
    const charIndex = (x - 1) * 10 + 5;

    // Get the symbol for the entity type
    const symbol = type === 'npc' ? '@' : 'X';

    // Replace the character at the calculated position
    const line = grid[lineIndex];
    grid[lineIndex] = line.substring(0, charIndex) + symbol + line.substring(charIndex + 1);
  });

  return grid;
}
