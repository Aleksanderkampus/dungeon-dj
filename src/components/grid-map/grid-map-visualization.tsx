"use client";

import * as React from "react";
import { RoomGridMap } from "@/types/game";
import { Package, Bot, DoorOpen, User } from "lucide-react";
import { cn } from "@/lib/utils";

type GridMapVisualizationProps = {
  gridMap: RoomGridMap;
  className?: string;
  showLegend?: boolean;
};

export function GridMapVisualization({
  gridMap,
  className,
  showLegend = true,
}: GridMapVisualizationProps) {
  const { cells, width, height } = gridMap;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Grid Container */}
      <div className="relative rounded-xl border-2 border-border bg-gradient-to-br from-slate-900 to-slate-800 p-4 shadow-2xl">
        {/* Grid */}
        <div
          className="grid gap-1"
          style={{
            gridTemplateColumns: `repeat(${width}, minmax(0, 1fr))`,
          }}
        >
          {cells.map((row, y) =>
            row.map((cell, x) => {
              const isSpawn =
                gridMap.playerSpawnPosition.x === x &&
                gridMap.playerSpawnPosition.y === y;
              const isNpc =
                gridMap.npcPosition.x === x && gridMap.npcPosition.y === y;
              const equipment = gridMap.equipmentPositions.find(
                (eq) => eq.position.x === x && eq.position.y === y
              );
              const playersAtPosition = gridMap.playerPositions?.filter(
                (p) => p.position.x === x && p.position.y === y
              );
              const hasPlayers =
                playersAtPosition && playersAtPosition.length > 0;

              return (
                <div
                  key={`${x}-${y}`}
                  className={cn(
                    "aspect-square rounded-md border border-slate-700/50 transition-all duration-200 relative",
                    // Base cell styling
                    "bg-slate-800/30",
                    // Spawn position
                    isSpawn &&
                      !hasPlayers &&
                      "animate-pulse border-emerald-500/50 bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 shadow-lg shadow-emerald-500/20",
                    // NPC position
                    isNpc &&
                      "border-red-500/50 bg-gradient-to-br from-red-500/20 to-red-600/10 shadow-lg shadow-red-500/20",
                    // Equipment position
                    equipment &&
                      "border-amber-500/50 bg-gradient-to-br from-amber-500/20 to-amber-600/10 shadow-lg shadow-amber-500/20",
                    // Player position
                    hasPlayers &&
                      "border-blue-500/50 bg-gradient-to-br from-blue-500/30 to-blue-600/20 shadow-lg shadow-blue-500/30"
                  )}
                >
                  <div className="flex h-full w-full items-center justify-center">
                    {hasPlayers ? (
                      <div className="relative flex items-center justify-center">
                        <User className="h-5 w-5 text-blue-300 drop-shadow-lg" />
                        {playersAtPosition.length > 1 && (
                          <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-blue-500 text-[8px] font-bold text-white">
                            {playersAtPosition.length}
                          </span>
                        )}
                      </div>
                    ) : isSpawn ? (
                      <DoorOpen className="h-4 w-4 text-emerald-400 drop-shadow-lg" />
                    ) : isNpc ? (
                      <Bot className="h-4 w-4 text-red-400 drop-shadow-lg" />
                    ) : equipment ? (
                      <Package className="h-4 w-4 text-amber-400 drop-shadow-lg" />
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Legend */}
        {showLegend && (
          <div className="mt-4 flex flex-wrap gap-4 border-t border-slate-700/50 pt-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded border border-blue-500/50 bg-gradient-to-br from-blue-500/30 to-blue-600/20">
                <User className="h-3 w-3 text-blue-300" />
              </div>
              <span className="text-muted-foreground">
                Players ({gridMap.playerPositions?.length || 0})
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded border border-emerald-500/50 bg-gradient-to-br from-emerald-500/20 to-emerald-600/10">
                <DoorOpen className="h-3 w-3 text-emerald-400" />
              </div>
              <span className="text-muted-foreground">Entrance</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded border border-red-500/50 bg-gradient-to-br from-red-500/20 to-red-600/10">
                <Bot className="h-3 w-3 text-red-400" />
              </div>
              <span className="text-muted-foreground">
                NPC:{" "}
                {cells[gridMap.npcPosition.y][gridMap.npcPosition.x].npcName}
              </span>
            </div>

            {gridMap.equipmentPositions.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded border border-amber-500/50 bg-gradient-to-br from-amber-500/20 to-amber-600/10">
                  <Package className="h-3 w-3 text-amber-400" />
                </div>
                <span className="text-muted-foreground">
                  Equipment ({gridMap.equipmentPositions.length})
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
