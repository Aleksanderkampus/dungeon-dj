# Player Movement System Documentation

## Overview

This document describes the comprehensive player movement and visualization system implemented in Dungeon DJ.

## Features Implemented

### 1. **Player Visualization on Grid Map**

Players are now displayed on the grid map with the following characteristics:

- **Blue user icons** represent player positions
- **Badge counter** shows when multiple players are in the same cell
- Players initially spawn at the **door/entrance** position (edges of the room)
- Player positions are **persistent** across room interactions

**Location**: `src/components/grid-map/grid-map-visualization.tsx`

### 2. **Improved Spawn Point Logic**

Players now spawn near walls where doors are typically located instead of the center:

- Top wall (y=1, center x)
- Bottom wall (y=7, center x)
- Left wall (x=1, center y)
- Right wall (x=7, center y)

One of these positions is randomly selected for each room's spawn point.

**Location**: `src/lib/grid-generator.ts:43-59`

### 3. **Movement System**

#### Movement Functions

**`initializePlayerPositions(gridMap, players)`**

- Initializes all player positions at the spawn point when entering a room
- Called automatically by the facilitator service on first room entry

**`movePlayerOnGrid(gridMap, playerId, target?)`**

- Moves a specific player on the grid
- Supports multiple target types:
  - `npc`: Moves 2 steps closer to the NPC
  - `equipment`: Moves 2 steps closer to specified equipment
  - `wall`: Moves 2 steps closer to nearest wall
  - `random` or `undefined`: Moves randomly within 3 coordinates

**Location**: `src/lib/grid-generator.ts:216-366`

### 4. **Facilitator Agent Integration**

#### New Tool: `move_player`

The facilitator now has a `move_player` tool that can be called when players request movement:

```typescript
{
  name: "move_player",
  parameters: {
    player_id: string;        // Player to move
    target_type: "npc" | "equipment" | "wall" | "random";
    equipment_name?: string;   // Required if target_type is "equipment"
    message: string;          // Narrative description of movement
  }
}
```

**How it works:**

1. Player says: "I want to move closer to the NPC"
2. Facilitator calls `move_player` tool with `target_type: "npc"`
3. Player position is updated on the grid
4. Room data is persisted to database
5. Updated grid map is returned with audio narration
6. Frontend automatically displays updated player positions

**Location**:

- Tool definition: `src/lib/prompts/tools/get-facilitator-tools.ts:61-100`
- Tool handler: `src/lib/services/facilitator-service.ts:219-298`

### 5. **Real-time Map Updates**

The Introduction View now receives map data directly from the TTS/response endpoints:

**Response format:**

```typescript
{
  audio: string; // Base64 encoded audio
  text: string; // Narration text
  currentRoom: Room; // Current room with updated grid map
  currentSectionId: number; // Current section being narrated
}
```

This eliminates the need for separate polling and ensures the map is always in sync with the narration.

**Location**:

- Backend: `src/app/api/tts/route.ts`, `src/app/api/storytelling/respond/route.ts`
- Frontend: `src/components/storytelling/introduction-view.tsx`

### 6. **Type Safety**

Updated `RoomGridMap` type to include player positions:

```typescript
export type RoomGridMap = {
  width: 9;
  height: 9;
  cells: GridCell[][];
  playerSpawnPosition: GridPosition;
  npcPosition: GridPosition;
  equipmentPositions: Array<{
    equipmentName: string;
    position: GridPosition;
  }>;
  playerPositions?: Array<{
    playerId: string;
    characterName: string;
    position: GridPosition;
  }>;
};
```

**Location**: `src/types/game.ts:98-113`

## User Experience Flow

### Initial Room Entry

1. Players join the game in the lobby
2. Facilitator generates introduction for first room
3. Player positions are automatically initialized at the spawn point (door)
4. Grid map displays all players at the entrance with blue icons

### Player Movement Request

1. Player says via voice: "I want to approach the treasure chest"
2. Speech-to-text converts to transcript
3. Facilitator agent receives transcript
4. Agent calls `move_player` tool with:
   - `player_id`: extracted from context
   - `target_type`: "equipment"
   - `equipment_name`: "treasure chest"
   - `message`: "You cautiously approach the ornate treasure chest..."
5. Backend updates player position on grid (moves 2 steps closer)
6. Returns audio + updated room data
7. Frontend plays narration and displays updated grid with player's new position

### Movement Types

**Specified Movement:**

- "Move to the NPC" → Moves closer to NPC
- "Approach the sword" → Moves closer to equipment named "sword"
- "Go to the wall" → Moves closer to nearest wall

**Unspecified Movement:**

- "I want to move" → Random movement within 3 tiles
- "Walk around the room" → Random movement

## Testing the System

### Manual Test Steps

1. **Create a game** with multiple players
2. **Navigate to storytelling page** (`/storytelling/[roomCode]`)
3. **Wait for introduction** to load - you should see:
   - All players at spawn point (door) with blue icons
   - Legend showing "Players (X)" count
4. **Complete introduction** and use voice recorder
5. **Say**: "I want to move closer to the NPC"
6. **Observe**:
   - Player icon moves on grid
   - Narration describes movement
   - Map updates in real-time

### Expected Behavior

- ✅ Players appear at door entrance initially
- ✅ Multiple players at same position show counter badge
- ✅ Map updates when movement is requested
- ✅ Movement respects grid boundaries (0-8)
- ✅ Visual transition with fade-in animation
- ✅ Legend updates player count

## Technical Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    User Interface                        │
│  (IntroductionView + GridMapVisualization)              │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ Audio + Room Data
                     ▼
┌─────────────────────────────────────────────────────────┐
│                  API Endpoints                           │
│  - /api/tts                                             │
│  - /api/storytelling/respond                            │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ FacilitatorResponse
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Facilitator Agent                           │
│  - Calls move_player tool                               │
│  - Updates room data                                    │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ movePlayerOnGrid()
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Grid Generator                              │
│  - Calculates new position                              │
│  - Updates RoomGridMap                                  │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ Updated RoomData
                     ▼
┌─────────────────────────────────────────────────────────┐
│               Game Store                                 │
│  - Persists to database                                 │
└─────────────────────────────────────────────────────────┘
```

## Future Enhancements

Potential improvements to consider:

1. **Player-specific movements**: Track which player requested movement
2. **Collision detection**: Prevent players from occupying NPC/equipment cells
3. **Movement history**: Track player paths through the room
4. **Animation**: Smooth transitions between grid positions
5. **Multi-step movement**: Allow moving multiple tiles in one command
6. **Pathfinding**: Calculate optimal path around obstacles
7. **Player colors**: Assign unique colors to each player

## Notes

- Player positions are **automatically initialized** on first room entry
- Positions are **persisted** in the database with room data
- Grid size is fixed at **9x9**
- Movement calculations always **respect boundaries**
- Default random movement is **within 3 tiles** in any direction

## Recent Improvements (Latest)

### ✅ Player Name-Based Movement

- Switched from `player_id` to `player_name` for easier frontend integration
- LLM receives enum of valid player names for better accuracy
- **Case-insensitive matching** prevents issues with capitalization

### ✅ Enhanced User Experience

- Multiple players on same cell show counter badge with number
- Clear visual distinction between players (blue), NPCs (red), equipment (amber), and entrances (green)
- Smooth fade-in transitions when room changes

### ✅ Better Error Messages

- Player not found errors now list all available players
- Duplicate player name warnings in console
- Detailed logging of movement operations

### ✅ Robust Error Handling

```typescript
// Case-insensitive player lookup
const player = gridMap.playerPositions.find(
  (p) => p.characterName.toLowerCase() === playerName.toLowerCase()
);

// Helpful error messages
throw new Error(
  `Player "${playerName}" not found. Available: ${availablePlayers.join(", ")}`
);
```

### ✅ Debug Logging

All movement operations now log:

- Player name being moved
- Target type and equipment name
- Available players in the game
- Old position vs new position after movement

### 🔍 Edge Cases Handled

1. **Case sensitivity**: "John" and "john" are treated as the same player
2. **Duplicate names**: System warns if multiple players have the same name (case-insensitive)
3. **Player not found**: Clear error message with list of available players
4. **Missing grid data**: Proper error handling with descriptive messages
