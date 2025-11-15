"use client";

import { Player } from "@/types/game";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle2, Circle, Crown } from "lucide-react";

type PlayerListProps = {
  players: Player[];
};

export function PlayerList({ players }: PlayerListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Players</CardTitle>
        <CardDescription>
          {players.length} {players.length === 1 ? "player" : "players"} in lobby
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {players.map((player) => (
            <div
              key={player.id}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div className="flex items-center gap-3">
                {player.isHost && (
                  <Crown className="h-4 w-4 text-yellow-500" />
                )}
                <span className="font-medium">{player.characterName}</span>
              </div>
              <div className="flex items-center gap-2">
                {player.isReady ? (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-sm">Ready</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Circle className="h-4 w-4" />
                    <span className="text-sm">Not Ready</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
