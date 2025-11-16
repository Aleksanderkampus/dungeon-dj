import { RoomGridMap, GridCell, GridPosition, Room } from "@/types/game";

/**
 * Generates a 9x9 grid map for a single room
 * Places NPC and equipment at random positions
 * Sets player spawn position
 */
export function generateRoomGrid(room: Room): RoomGridMap {
  const GRID_SIZE = 9;

  // Initialize empty grid
  const cells: GridCell[][] = Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => ({ type: "empty" }))
  );

  // Track used positions to avoid collisions
  const usedPositions = new Set<string>();

  // Helper to get random available position
  const getRandomPosition = (): GridPosition => {
    let position: GridPosition;
    let attempts = 0;
    const MAX_ATTEMPTS = 100;

    do {
      position = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      attempts++;

      if (attempts > MAX_ATTEMPTS) {
        throw new Error(
          `Could not find empty position after ${MAX_ATTEMPTS} attempts`
        );
      }
    } while (usedPositions.has(`${position.x},${position.y}`));

    usedPositions.add(`${position.x},${position.y}`);
    return position;
  };

  // Set player spawn position near walls/doors (edges of the room)
  // Players typically enter through doors on walls, so spawn near edges
  const spawnOptions = [
    // Top wall (near door)
    { x: Math.floor(GRID_SIZE / 2), y: 1 },
    // Bottom wall (near door)
    { x: Math.floor(GRID_SIZE / 2), y: GRID_SIZE - 2 },
    // Left wall (near door)
    { x: 1, y: Math.floor(GRID_SIZE / 2) },
    // Right wall (near door)
    { x: GRID_SIZE - 2, y: Math.floor(GRID_SIZE / 2) },
  ];

  // Choose a random spawn position from the edge options
  const playerSpawnPosition =
    spawnOptions[Math.floor(Math.random() * spawnOptions.length)];
  usedPositions.add(`${playerSpawnPosition.x},${playerSpawnPosition.y}`);

  // Place NPC at random position
  const npcPosition = getRandomPosition();
  cells[npcPosition.y][npcPosition.x] = {
    type: "npc",
    npcName: room.npc.npcName,
  };

  // Place equipment at random positions
  const equipmentPositions: RoomGridMap["equipmentPositions"] = [];

  room.equipments.forEach((equipmentName) => {
    const position = getRandomPosition();

    cells[position.y][position.x] = {
      type: "equipment",
      equipmentName,
    };

    equipmentPositions.push({
      equipmentName,
      position,
    });
  });

  return {
    width: 9,
    height: 9,
    cells,
    playerSpawnPosition,
    npcPosition,
    equipmentPositions,
  };
}

/**
 * Generates grid maps for all rooms in the room plan
 */
export function generateAllRoomGrids(rooms: Room[]): Room[] {
  return rooms.map((room) => ({
    ...room,
    gridMap: generateRoomGrid(room),
  }));
}

/**
 * Adds a player to a specific room's grid at the spawn position
 */
export function addPlayerToRoomGrid(
  gridMap: RoomGridMap,
  playerId: string
): RoomGridMap {
  const { playerSpawnPosition } = gridMap;

  // Clone the grid
  const newCells = gridMap.cells.map((row) => [...row]);

  // Add player to spawn position (overwrite if there's already a player there)
  const existingCell = newCells[playerSpawnPosition.y][playerSpawnPosition.x];
  newCells[playerSpawnPosition.y][playerSpawnPosition.x] = {
    ...existingCell,
    type: "player",
    playerId,
  };

  return {
    ...gridMap,
    cells: newCells,
  };
}

/**
 * Removes equipment from a room's grid
 */
export function removeEquipmentFromGrid(
  gridMap: RoomGridMap,
  equipmentName: string
): RoomGridMap {
  // Find equipment position
  const equipmentData = gridMap.equipmentPositions.find(
    (eq) => eq.equipmentName === equipmentName
  );

  if (!equipmentData) {
    console.warn(`Equipment ${equipmentName} not found on grid`);
    return gridMap;
  }

  // Clone the grid
  const newCells = gridMap.cells.map((row) => [...row]);

  // Clear the equipment position
  const { x, y } = equipmentData.position;
  newCells[y][x] = { type: "empty" };

  // Remove from equipment positions array
  const newEquipmentPositions = gridMap.equipmentPositions.filter(
    (eq) => eq.equipmentName !== equipmentName
  );

  return {
    ...gridMap,
    cells: newCells,
    equipmentPositions: newEquipmentPositions,
  };
}

/**
 * Moves an NPC to a new position on the grid
 */
export function moveNpcOnGrid(
  gridMap: RoomGridMap,
  newPosition: GridPosition
): RoomGridMap {
  // Clone the grid
  const newCells = gridMap.cells.map((row) => [...row]);

  // Clear old NPC position
  const oldPos = gridMap.npcPosition;
  newCells[oldPos.y][oldPos.x] = { type: "empty" };

  // Get NPC name from old position
  const npcName = gridMap.cells[oldPos.y][oldPos.x].npcName;

  // Set new NPC position
  newCells[newPosition.y][newPosition.x] = {
    type: "npc",
    npcName,
  };

  return {
    ...gridMap,
    cells: newCells,
    npcPosition: newPosition,
  };
}

/**
 * Checks if a position is valid and empty
 */
export function isPositionValid(
  gridMap: RoomGridMap,
  position: GridPosition
): boolean {
  const { x, y } = position;
  const { width, height, cells } = gridMap;

  // Check bounds
  if (x < 0 || x >= width || y < 0 || y >= height) {
    return false;
  }

  // Check if empty
  return cells[y][x].type === "empty";
}
