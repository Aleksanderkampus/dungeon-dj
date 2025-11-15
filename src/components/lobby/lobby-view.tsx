"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Game } from "@/types/game";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PlayerList } from "./player-list";
import { CharacterCreationPanel } from "./character-creation-panel";
import { Loader2, Copy, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

type LobbyViewProps = {
  initialGame: Game;
  playerId: string | null;
};

// API functions
async function fetchGame(roomCode: string) {
  const response = await fetch(`/api/games/${roomCode}`);

  if (!response.ok) {
    throw new Error("Failed to fetch game");
  }

  const data = await response.json();
  return data.game as Game;
}

async function toggleReady(params: {
  roomCode: string;
  playerId: string;
  isReady: boolean;
}) {
  const response = await fetch("/api/games/ready", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error("Failed to update ready status");
  }

  return response.json();
}

export function LobbyView({
  initialGame,
  playerId: initialPlayerId,
}: LobbyViewProps) {
  const [copied, setCopied] = React.useState(false);
  const [playerId, setPlayerId] = React.useState<string | null>(
    initialPlayerId
  );
  const queryClient = useQueryClient();
  const roomCode = initialGame.roomCode;

  // Fetch game state with React Query polling
  const { data: game = initialGame } = useQuery({
    queryKey: ["game", roomCode],
    queryFn: () => fetchGame(roomCode),
    initialData: initialGame,
    refetchInterval: 3000, // Poll every 3 seconds for real-time updates
    refetchIntervalInBackground: true, // Keep polling even when tab is not focused
  });

  const currentPlayer = game.players.find((p) => p.id === playerId);

  // Ready status mutation with optimistic updates
  const readyMutation = useMutation({
    mutationFn: toggleReady,
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["game", roomCode] });

      // Snapshot previous value
      const previousGame = queryClient.getQueryData<Game>(["game", roomCode]);

      // Optimistically update
      queryClient.setQueryData<Game>(["game", roomCode], (old) => {
        if (!old) return old;
        return {
          ...old,
          players: old.players.map((p) =>
            p.id === variables.playerId
              ? { ...p, isReady: variables.isReady }
              : p
          ),
        };
      });

      return { previousGame };
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousGame) {
        queryClient.setQueryData(["game", roomCode], context.previousGame);
      }
      toast.error("Failed to update ready status");
      console.error(error);
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: ["game", roomCode] });
    },
  });

  // Get playerId from sessionStorage
  React.useEffect(() => {
    const storedPlayerId = sessionStorage.getItem("playerId");
    const storedRoomCode = sessionStorage.getItem("roomCode");

    if (storedPlayerId && storedRoomCode === roomCode) {
      setPlayerId(storedPlayerId);
    }
  }, [roomCode]);

  const handleCopyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      toast.success("Room code copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy room code");
    }
  };

  const handleToggleReady = () => {
    if (!playerId) return;

    readyMutation.mutate({
      roomCode,
      playerId,
      isReady: !currentPlayer?.isReady,
    });
  };

  return (
    <div className="container mx-auto max-w-4xl space-y-6 p-4">
      {/* Room Code Card */}
      <Card>
        <CardHeader>
          <CardTitle>Game Lobby</CardTitle>
          <CardDescription>
            Share this room code with other players
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="rounded-lg border bg-muted px-6 py-4">
              <span className="font-mono text-3xl font-bold tracking-wider">
                {game.roomCode}
              </span>
            </div>
            <Button variant="outline" size="icon" onClick={handleCopyRoomCode}>
              {copied ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Story Generation Status */}
      {game.status === "generating" && (
        <Card className="border-primary">
          <CardContent className="flex items-center gap-3 py-4">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <div>
              <p className="font-medium">Generating your adventure...</p>
              <p className="text-sm text-muted-foreground">
                The AI is creating your unique story. This may take a minute.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {game.status === "ready" && (
        <Card className="border-green-600">
          <CardContent className="flex items-center gap-3 py-4">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-green-600">Story ready!</p>
              <p className="text-sm text-muted-foreground">
                Your adventure has been generated and is ready to begin.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {game.status === "error" && (
        <Card className="border-red-600">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div>
              <p className="font-medium text-red-600">
                Story generation failed
              </p>
              <p className="text-sm text-muted-foreground">
                Please try again later.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Player List */}
      <PlayerList players={game.players} />

      {/* Character Creation */}
      {playerId && currentPlayer && (
        <CharacterCreationPanel player={currentPlayer} />
      )}

      {/* Ready Button */}
      {playerId && currentPlayer && !currentPlayer.isHost && (
        <div className="flex justify-center">
          <Button
            size="lg"
            variant={currentPlayer.isReady ? "outline" : "default"}
            onClick={handleToggleReady}
            disabled={readyMutation.isPending}
            className="w-full sm:w-auto"
          >
            {currentPlayer.isReady ? "Not Ready" : "Ready to Play"}
          </Button>
        </div>
      )}

      {/* Start Game Button - Only for host when story is ready */}
      {playerId && currentPlayer?.isHost && game.status === "ready" && (
        <div className="flex justify-center">
          <Button
            size="lg"
            onClick={() => {
              window.location.href = `/storytelling/${roomCode}`;
            }}
            className="w-full sm:w-auto"
          >
            Start Game
          </Button>
        </div>
      )}
    </div>
  );
}
