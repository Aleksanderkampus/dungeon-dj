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

/**
 * Initialize player positions at spawn point for all players
 */
export function initializePlayerPositions(
  gridMap: RoomGridMap,
  players: Array<{ id: string; characterName: string }>
): RoomGridMap {
  // Check for duplicate player names (case-insensitive)
  const nameSet = new Set<string>();
  const duplicates: string[] = [];

  players.forEach((player) => {
    const lowerName = player.characterName.toLowerCase();
    if (nameSet.has(lowerName)) {
      duplicates.push(player.characterName);
    }
    nameSet.add(lowerName);
  });

  if (duplicates.length > 0) {
    console.warn(
      `[initializePlayerPositions] Duplicate player names detected: ${duplicates.join(
        ", "
      )}. This may cause issues with movement.`
    );
  }

  const playerPositions = players.map((player) => ({
    playerId: player.id,
    characterName: player.characterName,
    position: { ...gridMap.playerSpawnPosition },
  }));

  return {
    ...gridMap,
    playerPositions,
  };
}

/**
 * Calculate position closer to a target (NPC, equipment, or wall)
 */
function calculateTargetPosition(
  gridMap: RoomGridMap,
  currentPos: GridPosition,
  target: "npc" | "equipment" | "wall",
  equipmentName?: string
): GridPosition {
  const { width, height } = gridMap;

  if (target === "npc") {
    // Move 1-2 steps closer to NPC
    const npcPos = gridMap.npcPosition;
    const dx = Math.sign(npcPos.x - currentPos.x);
    const dy = Math.sign(npcPos.y - currentPos.y);
    return {
      x: Math.max(0, Math.min(width - 1, currentPos.x + dx * 2)),
      y: Math.max(0, Math.min(height - 1, currentPos.y + dy * 2)),
    };
  }

  if (target === "equipment" && equipmentName) {
    // Move closer to specific equipment
    const equipmentPos = gridMap.equipmentPositions.find(
      (eq) => eq.equipmentName === equipmentName
    );
    if (equipmentPos) {
      const dx = Math.sign(equipmentPos.position.x - currentPos.x);
      const dy = Math.sign(equipmentPos.position.y - currentPos.y);
      return {
        x: Math.max(0, Math.min(width - 1, currentPos.x + dx * 2)),
        y: Math.max(0, Math.min(height - 1, currentPos.y + dy * 2)),
      };
    }
  }

  if (target === "wall") {
    // Move closer to nearest wall
    const distances = [
      { dir: "top", dist: currentPos.y, pos: { x: currentPos.x, y: 0 } },
      {
        dir: "bottom",
        dist: height - 1 - currentPos.y,
        pos: { x: currentPos.x, y: height - 1 },
      },
      { dir: "left", dist: currentPos.x, pos: { x: 0, y: currentPos.y } },
      {
        dir: "right",
        dist: width - 1 - currentPos.x,
        pos: { x: width - 1, y: currentPos.y },
      },
    ];
    const nearest = distances.sort((a, b) => a.dist - b.dist)[0];
    const dx = Math.sign(nearest.pos.x - currentPos.x);
    const dy = Math.sign(nearest.pos.y - currentPos.y);
    return {
      x: Math.max(0, Math.min(width - 1, currentPos.x + dx * 2)),
      y: Math.max(0, Math.min(height - 1, currentPos.y + dy * 2)),
    };
  }

  // Default: random movement within 3 coordinates
  const randomX = Math.floor(Math.random() * 7) - 3; // -3 to +3
  const randomY = Math.floor(Math.random() * 7) - 3;
  return {
    x: Math.max(0, Math.min(width - 1, currentPos.x + randomX)),
    y: Math.max(0, Math.min(height - 1, currentPos.y + randomY)),
  };
}

/**
 * Move a player on the grid
 */
export function movePlayerOnGrid(
  gridMap: RoomGridMap,
  playerName: string,
  target?: {
    type: "npc" | "equipment" | "wall" | "coordinate";
    equipmentName?: string;
    coordinate?: GridPosition;
  }
): RoomGridMap {
  if (!gridMap.playerPositions) {
    throw new Error("Player positions not initialized");
  }

  // Case-insensitive search for player name
  const playerIndex = gridMap.playerPositions.findIndex(
    (p) => p.characterName.toLowerCase() === playerName.toLowerCase()
  );

  if (playerIndex === -1) {
    throw new Error(
      `Player "${playerName}" not found on grid. Available players: ${gridMap.playerPositions
        .map((p) => p.characterName)
        .join(", ")}`
    );
  }

  const currentPos = gridMap.playerPositions[playerIndex].position;
  let newPosition: GridPosition;

  if (target?.type === "coordinate" && target.coordinate) {
    // Move to specific coordinate
    newPosition = target.coordinate;
  } else if (target?.type && target.type !== "coordinate") {
    // Calculate position based on target
    newPosition = calculateTargetPosition(
      gridMap,
      currentPos,
      target.type,
      target.equipmentName
    );
  } else {
    // Default: random movement
    newPosition = calculateTargetPosition(gridMap, currentPos, "wall");
  }

  // Ensure position is within bounds
  newPosition = {
    x: Math.max(0, Math.min(gridMap.width - 1, newPosition.x)),
    y: Math.max(0, Math.min(gridMap.height - 1, newPosition.y)),
  };

  // Update player position
  const newPlayerPositions = [...gridMap.playerPositions];
  newPlayerPositions[playerIndex] = {
    ...newPlayerPositions[playerIndex],
    position: newPosition,
  };

  return {
    ...gridMap,
    playerPositions: newPlayerPositions,
  };
}
