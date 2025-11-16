"use client";

import * as React from "react";
import { RoomGridMap } from "@/types/game";
import { Package, Bot, DoorOpen } from "lucide-react";
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

              return (
                <div
                  key={`${x}-${y}`}
                  className={cn(
                    "aspect-square rounded-md border border-slate-700/50 transition-all duration-200",
                    // Base cell styling
                    "bg-slate-800/30",
                    // Spawn position
                    isSpawn &&
                      "animate-pulse border-emerald-500/50 bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 shadow-lg shadow-emerald-500/20",
                    // NPC position
                    isNpc &&
                      "border-red-500/50 bg-gradient-to-br from-red-500/20 to-red-600/10 shadow-lg shadow-red-500/20",
                    // Equipment position
                    equipment &&
                      "border-amber-500/50 bg-gradient-to-br from-amber-500/20 to-amber-600/10 shadow-lg shadow-amber-500/20"
                  )}
                >
                  <div className="flex h-full w-full items-center justify-center">
                    {isSpawn && (
                      <DoorOpen className="h-4 w-4 text-emerald-400 drop-shadow-lg" />
                    )}
                    {isNpc && (
                      <Bot className="h-4 w-4 text-red-400 drop-shadow-lg" />
                    )}
                    {equipment && (
                      <Package className="h-4 w-4 text-amber-400 drop-shadow-lg" />
                    )}
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
