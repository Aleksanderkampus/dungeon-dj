# Multiplayer Game Lobby Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a multiplayer game system where users can create games via WorldGenerationForm, generate unique room codes, and allow other players to join lobbies with character names and ready status, all synchronized in real-time via WebSockets.

**Architecture:** Next.js App Router with API routes for game management, Socket.io for real-time lobby updates, TanStack React Query for server state management with optimistic updates, in-memory storage for game state (Map-based), and n8n webhook integration for story generation. TanStack Form for all form handling with Zod validation.

**Tech Stack:** Next.js 16, Socket.io (WebSockets), TanStack React Query v5, TanStack Form, Zod, Sonner (toasts), shadcn/ui components, in-memory Map storage

---

## Task 1: Set up Socket.io infrastructure

**Files:**
- Create: `src/lib/socket-server.ts`
- Create: `src/lib/socket-client.ts`
- Create: `src/app/api/socket/route.ts`
- Modify: `package.json`

**Step 1: Install Socket.io dependencies**

Run:
```bash
npm install socket.io socket.io-client
npm install --save-dev @types/socket.io @types/socket.io-client
```

Expected: Dependencies installed successfully

**Step 2: Create Socket.io server setup**

Create: `src/lib/socket-server.ts`

```typescript
import { Server as NetServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { NextApiResponse } from "next";

export type NextApiResponseServerIO = NextApiResponse & {
  socket: {
    server: NetServer & {
      io?: SocketIOServer;
    };
  };
};

export function initSocketServer(httpServer: NetServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    path: "/api/socket",
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  return io;
}
```

**Step 3: Create Socket.io client hook**

Create: `src/lib/socket-client.ts`

```typescript
"use client";

import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!socket) {
      socket = io({
        path: "/api/socket",
      });

      socket.on("connect", () => {
        console.log("Socket connected");
        setIsConnected(true);
      });

      socket.on("disconnect", () => {
        console.log("Socket disconnected");
        setIsConnected(false);
      });
    }

    return () => {
      // Don't disconnect on unmount, keep connection alive
    };
  }, []);

  return { socket, isConnected };
}
```

**Step 4: Create API route for Socket.io**

Create: `src/app/api/socket/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  // Socket.io will handle upgrade internally
  return NextResponse.json({ message: "Socket.io server running" });
}
```

**Step 5: Test Socket.io connection**

Run dev server:
```bash
npm run dev
```

Expected: Server starts without errors. We'll test the actual connection in later tasks.

**Step 6: Commit**

```bash
git add package.json package-lock.json src/lib/socket-server.ts src/lib/socket-client.ts src/app/api/socket/route.ts
git commit -m "feat: add Socket.io infrastructure for real-time updates"
```

---

## Task 2: Create game state management

**Files:**
- Create: `src/lib/game-store.ts`
- Create: `src/types/game.ts`

**Step 1: Define game types**

Create: `src/types/game.ts`

```typescript
export type Player = {
  id: string;
  characterName: string;
  isReady: boolean;
  isHost: boolean;
};

export type GameStatus = "generating" | "ready" | "in-progress" | "completed";

export type Game = {
  roomCode: string;
  hostId: string;
  players: Player[];
  status: GameStatus;
  worldData: {
    genre: string;
    teamBackground: string;
    storyGoal: string;
    storyDescription: string;
    facilitatorPersona: string;
    facilitatorVoice: string;
    actionsPerSession: string;
  };
  generatedStory?: string;
  createdAt: Date;
};
```

**Step 2: Create in-memory game store**

Create: `src/lib/game-store.ts`

```typescript
import { Game, Player } from "@/types/game";

class GameStore {
  private games: Map<string, Game> = new Map();

  generateRoomCode(): string {
    // Generate 6-character alphanumeric code
    const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    // Ensure uniqueness
    if (this.games.has(code)) {
      return this.generateRoomCode();
    }

    return code;
  }

  createGame(hostId: string, worldData: Game["worldData"]): Game {
    const roomCode = this.generateRoomCode();
    const game: Game = {
      roomCode,
      hostId,
      players: [],
      status: "generating",
      worldData,
      createdAt: new Date(),
    };

    this.games.set(roomCode, game);
    return game;
  }

  getGame(roomCode: string): Game | undefined {
    return this.games.get(roomCode);
  }

  addPlayer(roomCode: string, player: Player): Game | null {
    const game = this.games.get(roomCode);
    if (!game) return null;

    game.players.push(player);
    this.games.set(roomCode, game);
    return game;
  }

  updatePlayerReady(roomCode: string, playerId: string, isReady: boolean): Game | null {
    const game = this.games.get(roomCode);
    if (!game) return null;

    const player = game.players.find((p) => p.id === playerId);
    if (!player) return null;

    player.isReady = isReady;
    this.games.set(roomCode, game);
    return game;
  }

  updateGameStatus(roomCode: string, status: Game["status"]): Game | null {
    const game = this.games.get(roomCode);
    if (!game) return null;

    game.status = status;
    this.games.set(roomCode, game);
    return game;
  }

  setGeneratedStory(roomCode: string, story: string): Game | null {
    const game = this.games.get(roomCode);
    if (!game) return null;

    game.generatedStory = story;
    game.status = "ready";
    this.games.set(roomCode, game);
    return game;
  }

  removePlayer(roomCode: string, playerId: string): Game | null {
    const game = this.games.get(roomCode);
    if (!game) return null;

    game.players = game.players.filter((p) => p.id !== playerId);
    this.games.set(roomCode, game);
    return game;
  }

  deleteGame(roomCode: string): boolean {
    return this.games.delete(roomCode);
  }
}

export const gameStore = new GameStore();
```

**Step 3: Verify types and store**

Check that TypeScript compiles without errors:
```bash
npx tsc --noEmit
```

Expected: No TypeScript errors

**Step 4: Commit**

```bash
git add src/types/game.ts src/lib/game-store.ts
git commit -m "feat: add game state management with in-memory store"
```

---

## Task 3: Update home page with Create/Join buttons

**Files:**
- Modify: `src/app/page.tsx`

**Step 1: Update home page with navigation buttons**

Modify: `src/app/page.tsx`

Replace entire file content:
```typescript
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <Card className="w-full sm:max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">Dungeon DJ</CardTitle>
          <CardDescription>
            Create AI-facilitated tabletop RPG adventures
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Link href="/create-game">
            <Button className="w-full" size="lg">
              Create Game
            </Button>
          </Link>
          <Link href="/join-game">
            <Button className="w-full" size="lg" variant="outline">
              Join Game
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Step 2: Test navigation**

Run:
```bash
npm run dev
```

Navigate to http://localhost:3000 and verify:
- Two buttons are visible
- Buttons have correct styling
- Links navigate to `/create-game` and `/join-game` (will 404 for now)

**Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: add Create/Join game buttons to home page"
```

---

## Task 4: Set up TanStack React Query

**Files:**
- Create: `src/lib/query-client.ts`
- Create: `src/components/providers/query-provider.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `package.json`

**Step 1: Install TanStack React Query**

Run:
```bash
npm install @tanstack/react-query @tanstack/react-query-devtools
```

Expected: Dependencies installed successfully

**Step 2: Create Query Client configuration**

Create: `src/lib/query-client.ts`

```typescript
import { QueryClient } from "@tanstack/react-query";

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
        refetchOnWindowFocus: false,
        retry: 1,
      },
      mutations: {
        retry: 1,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

export function getQueryClient() {
  if (typeof window === "undefined") {
    // Server: always make a new query client
    return makeQueryClient();
  } else {
    // Browser: make a new query client if we don't already have one
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}
```

**Step 3: Create Query Provider component**

Create: `src/components/providers/query-provider.tsx`

```typescript
"use client";

import * as React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { getQueryClient } from "@/lib/query-client";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

**Step 4: Add QueryProvider to root layout**

Modify: `src/app/layout.tsx`

Add import at top:
```typescript
import { QueryProvider } from "@/components/providers/query-provider";
```

Wrap children with QueryProvider (around line 26-38):
```typescript
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryProvider>
          {children}
          <Toaster
            theme="dark"
            toastOptions={{ className: "bg-card border-border" }}
          />
        </QueryProvider>
      </body>
    </html>
  );
}
```

**Step 5: Verify installation**

Run:
```bash
npx tsc --noEmit
```

Expected: No TypeScript errors

Run dev server:
```bash
npm run dev
```

Expected: Server starts without errors. You should see React Query DevTools in the bottom left corner (minimized).

**Step 6: Commit**

```bash
git add package.json package-lock.json src/lib/query-client.ts src/components/providers/query-provider.tsx src/app/layout.tsx
git commit -m "feat: add TanStack React Query with provider setup"
```

---

## Task 6: Create game creation page

**Files:**
- Create: `src/app/create-game/page.tsx`
- Modify: `src/components/create-agent-form/world-generation-form.tsx`

**Step 1: Create game creation page**

Create: `src/app/create-game/page.tsx`

```typescript
import { WorldGenerationForm } from "@/components/create-agent-form/world-generation-form";

export default function CreateGamePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black p-4">
      <WorldGenerationForm />
    </div>
  );
}
```

**Step 2: Update WorldGenerationForm to use React Query mutation**

Modify: `src/components/create-agent-form/world-generation-form.tsx`

Add imports at the top (after existing imports):
```typescript
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
```

Add mutation function before the component (around line 80, before `export function WorldGenerationForm`):
```typescript
async function createGame(worldData: any) {
  const response = await fetch("/api/games/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ worldData }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create game");
  }

  return response.json();
}

export function WorldGenerationForm() {
  const [currentStep, setCurrentStep] = React.useState(1);
  const router = useRouter();

  // Add create game mutation
  const createGameMutation = useMutation({
    mutationFn: createGame,
    onSuccess: (data) => {
      const { roomCode, hostId } = data;

      // Store host ID
      sessionStorage.setItem("playerId", hostId);
      sessionStorage.setItem("roomCode", roomCode);

      toast.success("Game created successfully!");
      router.push(`/lobby/${roomCode}`);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create game. Please try again.");
      console.error(error);
    },
  });
```

Update the form initialization to use the mutation (replace the `onSubmit` handler around line 109):
```typescript
  const form = useForm({
    defaultValues: {
      genre: "",
      teamBackground: "",
      storyGoal: "",
      storyDescription: "",
      facilitatorPersona: "",
      facilitatorVoice: "",
      actionsPerSession: "",
    },
    validators: {
      onChange: formSchema,
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      createGameMutation.mutate(value);
    },
  });
```

Update the Submit button to show loading state (around line 464-467):
```typescript
              {currentStep === STEPS.length ? (
                <Button
                  type="submit"
                  form="world-generation-form"
                  disabled={createGameMutation.isPending}
                >
                  {createGameMutation.isPending ? "Creating..." : "Submit"}
                </Button>
              ) : (
```

**Step 3: Test page renders**

Run:
```bash
npm run dev
```

Navigate to http://localhost:3000/create-game and verify form renders correctly.

**Step 4: Commit**

```bash
git add src/app/create-game/page.tsx src/components/create-agent-form/world-generation-form.tsx
git commit -m "feat: add create game page with form submission"
```

---

## Task 7: Create game creation API endpoint

**Files:**
- Create: `src/app/api/games/create/route.ts`

**Step 1: Create game creation API route**

Create: `src/app/api/games/create/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { gameStore } from "@/lib/game-store";
import { Game } from "@/types/game";
import { nanoid } from "nanoid";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { worldData } = body;

    if (!worldData) {
      return NextResponse.json(
        { error: "World data is required" },
        { status: 400 }
      );
    }

    // Generate host ID (in real app, use authenticated user ID)
    const hostId = nanoid();

    // Create game
    const game = gameStore.createGame(hostId, worldData);

    // Add host as first player
    gameStore.addPlayer(game.roomCode, {
      id: hostId,
      characterName: "Game Master",
      isReady: false,
      isHost: true,
    });

    // Trigger n8n story generation (async)
    triggerStoryGeneration(game);

    return NextResponse.json({
      roomCode: game.roomCode,
      hostId,
    });
  } catch (error) {
    console.error("Error creating game:", error);
    return NextResponse.json(
      { error: "Failed to create game" },
      { status: 500 }
    );
  }
}

async function triggerStoryGeneration(game: Game) {
  try {
    // TODO: Replace with actual n8n endpoint URL
    const n8nEndpoint = process.env.N8N_WEBHOOK_URL || "http://localhost:5678/webhook/generate-story";

    const response = await fetch(n8nEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomCode: game.roomCode,
        worldData: game.worldData,
        callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/games/story-callback`,
      }),
    });

    if (!response.ok) {
      console.error("n8n API error:", await response.text());
      gameStore.updateGameStatus(game.roomCode, "ready");
    }
  } catch (error) {
    console.error("Error calling n8n:", error);
    // Mark as ready even if generation fails
    gameStore.updateGameStatus(game.roomCode, "ready");
  }
}
```

**Step 2: Install nanoid for ID generation**

Run:
```bash
npm install nanoid
```

Expected: Package installed successfully

**Step 3: Add environment variables**

Create/modify: `.env.local`

```
N8N_WEBHOOK_URL=http://localhost:5678/webhook/generate-story
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Step 4: Test API endpoint**

Run:
```bash
curl -X POST http://localhost:3000/api/games/create \
  -H "Content-Type: application/json" \
  -d '{"worldData":{"genre":"fantasy","teamBackground":"test","storyGoal":"test","storyDescription":"test","facilitatorPersona":"test","facilitatorVoice":"adam","actionsPerSession":"medium"}}'
```

Expected: Returns JSON with `roomCode` and `hostId`

**Step 5: Commit**

```bash
git add src/app/api/games/create/route.ts package.json package-lock.json .env.local
git commit -m "feat: add game creation API endpoint with n8n integration"
```

---

## Task 8: Create story callback API endpoint

**Files:**
- Create: `src/app/api/games/story-callback/route.ts`

**Step 1: Create story callback endpoint**

Create: `src/app/api/games/story-callback/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { gameStore } from "@/lib/game-store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { roomCode, story, status } = body;

    if (!roomCode) {
      return NextResponse.json(
        { error: "Room code is required" },
        { status: 400 }
      );
    }

    const game = gameStore.getGame(roomCode);
    if (!game) {
      return NextResponse.json(
        { error: "Game not found" },
        { status: 404 }
      );
    }

    if (status === "success" && story) {
      gameStore.setGeneratedStory(roomCode, story);

      // Emit socket event to notify lobby
      // We'll implement socket emission in next task

      return NextResponse.json({ success: true });
    } else {
      // Mark as ready even if generation failed
      gameStore.updateGameStatus(roomCode, "ready");
      return NextResponse.json(
        { error: "Story generation failed" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in story callback:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

**Step 2: Test callback endpoint**

Run:
```bash
curl -X POST http://localhost:3000/api/games/story-callback \
  -H "Content-Type: application/json" \
  -d '{"roomCode":"ABC123","story":"Generated story content","status":"success"}'
```

Expected: Returns `{"success":true}` (will return 404 if game doesn't exist)

**Step 3: Commit**

```bash
git add src/app/api/games/story-callback/route.ts
git commit -m "feat: add n8n story callback API endpoint"
```

---

## Task 9: Create join game page with React Query

**Files:**
- Create: `src/app/join-game/page.tsx`
- Create: `src/components/join-game/join-game-form.tsx`

**Step 1: Create join game form component with React Query**

Create: `src/components/join-game/join-game-form.tsx`

```typescript
"use client";

import * as React from "react";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import * as z from "zod";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const formSchema = z.object({
  roomCode: z
    .string()
    .length(6, "Room code must be 6 characters")
    .regex(/^[A-Z0-9]+$/, "Room code must contain only uppercase letters and numbers"),
  characterName: z
    .string()
    .min(2, "Character name must be at least 2 characters")
    .max(30, "Character name must be at most 30 characters"),
});

// API functions
async function verifyRoomCode(roomCode: string) {
  const response = await fetch(`/api/games/${roomCode}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Invalid room code");
  }

  return response.json();
}

async function joinGame(data: { roomCode: string; characterName: string }) {
  const response = await fetch("/api/games/join", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to join game");
  }

  return response.json();
}

export function JoinGameForm() {
  const router = useRouter();
  const [step, setStep] = React.useState<"roomCode" | "characterName">("roomCode");
  const [verifiedRoomCode, setVerifiedRoomCode] = React.useState<string>("");

  // Verify room code mutation
  const verifyMutation = useMutation({
    mutationFn: verifyRoomCode,
    onSuccess: () => {
      setStep("characterName");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Invalid room code. Please check and try again.");
    },
  });

  // Join game mutation
  const joinMutation = useMutation({
    mutationFn: joinGame,
    onSuccess: (data, variables) => {
      const { playerId } = data;

      // Store player ID in session storage
      sessionStorage.setItem("playerId", playerId);
      sessionStorage.setItem("roomCode", verifiedRoomCode);

      toast.success("Joined game successfully!");
      router.push(`/lobby/${verifiedRoomCode}`);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to join game. Please try again.");
    },
  });

  const form = useForm({
    defaultValues: {
      roomCode: "",
      characterName: "",
    },
    validators: {
      onChange: formSchema,
    },
    onSubmit: async ({ value }) => {
      if (step === "roomCode") {
        const upperRoomCode = value.roomCode.toUpperCase();
        setVerifiedRoomCode(upperRoomCode);
        verifyMutation.mutate(upperRoomCode);
      } else {
        joinMutation.mutate({
          roomCode: verifiedRoomCode,
          characterName: value.characterName,
        });
      }
    },
  });

  const handleBack = () => {
    setStep("roomCode");
  };

  const isLoading = verifyMutation.isPending || joinMutation.isPending;

  return (
    <Card className="w-full sm:max-w-md">
      <CardHeader>
        <CardTitle>
          {step === "roomCode" ? "Join Game" : "Create Your Character"}
        </CardTitle>
        <CardDescription>
          {step === "roomCode"
            ? "Enter the room code to join a game"
            : "Choose a name for your character"}
        </CardDescription>
      </CardHeader>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <CardContent>
          <FieldGroup>
            {step === "roomCode" && (
              <form.Field name="roomCode">
                {(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Room Code</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) =>
                          field.handleChange(e.target.value.toUpperCase())
                        }
                        placeholder="ABC123"
                        maxLength={6}
                        className="font-mono text-lg"
                        aria-invalid={isInvalid}
                      />
                      <FieldDescription>
                        Enter the 6-character room code from your game host
                      </FieldDescription>
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  );
                }}
              </form.Field>
            )}

            {step === "characterName" && (
              <form.Field name="characterName">
                {(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>
                        Character Name
                      </FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Enter your character's name"
                        maxLength={30}
                        aria-invalid={isInvalid}
                      />
                      <FieldDescription>
                        Choose a name for your character (2-30 characters)
                      </FieldDescription>
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  );
                }}
              </form.Field>
            )}
          </FieldGroup>
        </CardContent>
        <CardFooter className="flex justify-between">
          {step === "characterName" ? (
            <Button type="button" variant="outline" onClick={handleBack}>
              Back
            </Button>
          ) : (
            <div />
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading
              ? "Loading..."
              : step === "roomCode"
              ? "Continue"
              : "Join Game"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
```

**Step 2: Create join game page**

Create: `src/app/join-game/page.tsx`

```typescript
import { JoinGameForm } from "@/components/join-game/join-game-form";

export default function JoinGamePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black p-4">
      <JoinGameForm />
    </div>
  );
}
```

**Step 3: Test join game page**

Run:
```bash
npm run dev
```

Navigate to http://localhost:3000/join-game and verify:
- Form renders with room code input
- Input auto-uppercases
- Validation works for 6-character code

**Step 4: Commit**

```bash
git add src/app/join-game/page.tsx src/components/join-game/join-game-form.tsx
git commit -m "feat: add join game page with two-step form"
```

---

## Task 10: Create game join and fetch API endpoints

**Files:**
- Create: `src/app/api/games/join/route.ts`
- Create: `src/app/api/games/[roomCode]/route.ts`

**Step 1: Create game fetch endpoint**

Create: `src/app/api/games/[roomCode]/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { gameStore } from "@/lib/game-store";

export async function GET(
  req: NextRequest,
  { params }: { params: { roomCode: string } }
) {
  const roomCode = params.roomCode.toUpperCase();
  const game = gameStore.getGame(roomCode);

  if (!game) {
    return NextResponse.json(
      { error: "Game not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ game });
}
```

**Step 2: Create join game endpoint**

Create: `src/app/api/games/join/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { gameStore } from "@/lib/game-store";
import { nanoid } from "nanoid";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { roomCode, characterName } = body;

    if (!roomCode || !characterName) {
      return NextResponse.json(
        { error: "Room code and character name are required" },
        { status: 400 }
      );
    }

    const game = gameStore.getGame(roomCode.toUpperCase());
    if (!game) {
      return NextResponse.json(
        { error: "Game not found" },
        { status: 404 }
      );
    }

    // Check if character name is already taken
    const nameTaken = game.players.some(
      (p) => p.characterName.toLowerCase() === characterName.toLowerCase()
    );
    if (nameTaken) {
      return NextResponse.json(
        { error: "Character name already taken" },
        { status: 409 }
      );
    }

    // Generate player ID
    const playerId = nanoid();

    // Add player to game
    const player = {
      id: playerId,
      characterName,
      isReady: false,
      isHost: false,
    };

    gameStore.addPlayer(roomCode.toUpperCase(), player);

    // TODO: Emit socket event for player joined

    return NextResponse.json({ playerId });
  } catch (error) {
    console.error("Error joining game:", error);
    return NextResponse.json(
      { error: "Failed to join game" },
      { status: 500 }
    );
  }
}
```

**Step 3: Test endpoints**

Create a game first, then test:
```bash
# Test fetch endpoint
curl http://localhost:3000/api/games/ABC123

# Test join endpoint
curl -X POST http://localhost:3000/api/games/join \
  -H "Content-Type: application/json" \
  -d '{"roomCode":"ABC123","characterName":"TestPlayer"}'
```

Expected: Successful responses with game data and playerId

**Step 4: Commit**

```bash
git add src/app/api/games/join/route.ts src/app/api/games/[roomCode]/route.ts
git commit -m "feat: add game join and fetch API endpoints"
```

---

## Task 11: Create lobby page with React Query and real-time updates

**Files:**
- Create: `src/app/lobby/[roomCode]/page.tsx`
- Create: `src/components/lobby/lobby-view.tsx`
- Create: `src/components/lobby/player-list.tsx`

**Step 1: Create player list component**

Create: `src/components/lobby/player-list.tsx`

```typescript
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
```

**Step 2: Create lobby view component with React Query**

Create: `src/components/lobby/lobby-view.tsx`

```typescript
"use client";

import * as React from "react";
import { useSocket } from "@/lib/socket-client";
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
import { Loader2, Copy, CheckCircle2 } from "lucide-react";
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

export function LobbyView({ initialGame, playerId: initialPlayerId }: LobbyViewProps) {
  const { socket, isConnected } = useSocket();
  const [copied, setCopied] = React.useState(false);
  const [playerId, setPlayerId] = React.useState<string | null>(initialPlayerId);
  const queryClient = useQueryClient();
  const roomCode = initialGame.roomCode;

  // Fetch game state with React Query
  const { data: game = initialGame } = useQuery({
    queryKey: ["game", roomCode],
    queryFn: () => fetchGame(roomCode),
    initialData: initialGame,
    refetchInterval: 30000, // Refetch every 30 seconds as backup
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
            p.id === variables.playerId ? { ...p, isReady: variables.isReady } : p
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

  // WebSocket integration - update React Query cache
  React.useEffect(() => {
    if (!socket) return;

    // Join room
    socket.emit("join-lobby", { roomCode, playerId });

    // Listen for game updates and update React Query cache
    const handleGameUpdate = (updatedGame: Game) => {
      queryClient.setQueryData(["game", roomCode], updatedGame);
    };

    const handlePlayerJoined = (updatedGame: Game) => {
      queryClient.setQueryData(["game", roomCode], updatedGame);
      toast.success("A player joined the game!");
    };

    const handlePlayerReadyChanged = (updatedGame: Game) => {
      queryClient.setQueryData(["game", roomCode], updatedGame);
    };

    const handleStoryGenerated = (updatedGame: Game) => {
      queryClient.setQueryData(["game", roomCode], updatedGame);
      toast.success("Story generation complete!");
    };

    socket.on("game-updated", handleGameUpdate);
    socket.on("player-joined", handlePlayerJoined);
    socket.on("player-ready-changed", handlePlayerReadyChanged);
    socket.on("story-generated", handleStoryGenerated);

    return () => {
      socket.off("game-updated", handleGameUpdate);
      socket.off("player-joined", handlePlayerJoined);
      socket.off("player-ready-changed", handlePlayerReadyChanged);
      socket.off("story-generated", handleStoryGenerated);
    };
  }, [socket, roomCode, playerId, queryClient]);

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
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopyRoomCode}
            >
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

      {/* Player List */}
      <PlayerList players={game.players} />

      {/* Ready Button */}
      {playerId && currentPlayer && !currentPlayer.isHost && (
        <div className="flex justify-center">
          <Button
            size="lg"
            variant={currentPlayer.isReady ? "outline" : "default"}
            onClick={handleToggleReady}
            className="w-full sm:w-auto"
          >
            {currentPlayer.isReady ? "Not Ready" : "Ready to Play"}
          </Button>
        </div>
      )}

      {/* Connection Status */}
      {!isConnected && (
        <div className="text-center text-sm text-muted-foreground">
          Connecting to server...
        </div>
      )}
    </div>
  );
}
```

**Step 3: Create lobby page**

Create: `src/app/lobby/[roomCode]/page.tsx`

```typescript
import { redirect } from "next/navigation";
import { gameStore } from "@/lib/game-store";
import { LobbyView } from "@/components/lobby/lobby-view";

type LobbyPageProps = {
  params: {
    roomCode: string;
  };
};

export default function LobbyPage({ params }: LobbyPageProps) {
  const roomCode = params.roomCode.toUpperCase();
  const game = gameStore.getGame(roomCode);

  if (!game) {
    redirect("/");
  }

  // In a real app, get playerId from authenticated session
  // For now, we'll handle it client-side via sessionStorage
  return <LobbyView initialGame={game} playerId={null} />;
}
```

**Step 4: Install lucide-react icons (if not already installed)**

Run:
```bash
npm install lucide-react
```

**Step 5: Test lobby page**

Navigate to a game lobby after creating a game. Verify:
- Room code displays correctly
- Copy button works
- Player list shows
- Loading state shows for story generation
- Ready button toggles optimistically
- WebSocket updates reflected in React Query cache

**Step 6: Commit**

```bash
git add src/app/lobby/[roomCode]/page.tsx src/components/lobby/lobby-view.tsx src/components/lobby/player-list.tsx package.json package-lock.json
git commit -m "feat: add lobby page with React Query and real-time updates"
```

---

## Task 12: Create ready status API endpoint

**Files:**
- Create: `src/app/api/games/ready/route.ts`

**Step 1: Create ready toggle endpoint**

Create: `src/app/api/games/ready/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { gameStore } from "@/lib/game-store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { roomCode, playerId, isReady } = body;

    if (!roomCode || !playerId || typeof isReady !== "boolean") {
      return NextResponse.json(
        { error: "Room code, player ID, and ready status are required" },
        { status: 400 }
      );
    }

    const game = gameStore.updatePlayerReady(
      roomCode.toUpperCase(),
      playerId,
      isReady
    );

    if (!game) {
      return NextResponse.json(
        { error: "Game or player not found" },
        { status: 404 }
      );
    }

    // TODO: Emit socket event for player ready changed

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating ready status:", error);
    return NextResponse.json(
      { error: "Failed to update ready status" },
      { status: 500 }
    );
  }
}
```

**Step 2: Test ready endpoint**

```bash
curl -X POST http://localhost:3000/api/games/ready \
  -H "Content-Type: application/json" \
  -d '{"roomCode":"ABC123","playerId":"player-id","isReady":true}'
```

Expected: Returns `{"success":true}`

**Step 3: Commit**

```bash
git add src/app/api/games/ready/route.ts
git commit -m "feat: add player ready status API endpoint"
```

---

## Task 13: Integrate Socket.io with API routes

**Files:**
- Modify: `src/app/api/games/join/route.ts`
- Modify: `src/app/api/games/ready/route.ts`
- Modify: `src/app/api/games/story-callback/route.ts`
- Modify: `src/lib/socket-server.ts`
- Create: `src/lib/socket-io.ts`

**Step 1: Create Socket.io singleton instance**

Create: `src/lib/socket-io.ts`

```typescript
import { Server as SocketIOServer } from "socket.io";

let io: SocketIOServer | null = null;

export function getIO(): SocketIOServer | null {
  return io;
}

export function setIO(instance: SocketIOServer) {
  io = instance;
}
```

**Step 2: Update socket server with lobby events**

Modify: `src/lib/socket-server.ts`

Replace entire file:
```typescript
import { Server as NetServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { setIO } from "./socket-io";

export function initSocketServer(httpServer: NetServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    path: "/api/socket",
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // Store global reference
  setIO(io);

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("join-lobby", ({ roomCode, playerId }) => {
      console.log(`Player ${playerId} joining lobby ${roomCode}`);
      socket.join(roomCode);
    });

    socket.on("leave-lobby", ({ roomCode }) => {
      console.log(`Socket ${socket.id} leaving lobby ${roomCode}`);
      socket.leave(roomCode);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  return io;
}

export function emitToRoom(roomCode: string, event: string, data: any) {
  const io = getIO();
  if (io) {
    io.to(roomCode).emit(event, data);
  }
}
```

**Step 3: Update join endpoint to emit socket event**

Modify: `src/app/api/games/join/route.ts`

Add import at top:
```typescript
import { getIO } from "@/lib/socket-io";
```

Replace the `// TODO: Emit socket event` comment with:
```typescript
    // Emit socket event for player joined
    const io = getIO();
    if (io) {
      io.to(roomCode.toUpperCase()).emit("player-joined", game);
    }
```

**Step 4: Update ready endpoint to emit socket event**

Modify: `src/app/api/games/ready/route.ts`

Add import at top:
```typescript
import { getIO } from "@/lib/socket-io";
```

Replace the `// TODO: Emit socket event` comment with:
```typescript
    // Emit socket event for player ready changed
    const io = getIO();
    if (io) {
      io.to(roomCode.toUpperCase()).emit("player-ready-changed", game);
    }
```

**Step 5: Update story callback to emit socket event**

Modify: `src/app/api/games/story-callback/route.ts`

Add import at top:
```typescript
import { getIO } from "@/lib/socket-io";
```

Replace the `// Emit socket event` comment with:
```typescript
      // Emit socket event to notify lobby
      const io = getIO();
      if (io) {
        io.to(roomCode).emit("story-generated", game);
      }
```

**Step 6: Test real-time updates**

This requires manual testing:
1. Create a game in one browser window
2. Open lobby in another browser window (same room code)
3. Join game from second window
4. Verify first window shows new player in real-time
5. Toggle ready status and verify it updates in real-time

**Step 7: Commit**

```bash
git add src/lib/socket-server.ts src/lib/socket-io.ts src/app/api/games/join/route.ts src/app/api/games/ready/route.ts src/app/api/games/story-callback/route.ts
git commit -m "feat: integrate Socket.io with game events for real-time updates"
```

---

## Task 14: Add .env.local to .gitignore

**Files:**
- Modify: `.gitignore`

**Step 1: Update .gitignore**

Modify: `.gitignore`

Add to the file:
```
# local env files
.env*.local
```

**Step 2: Commit**

```bash
git add .gitignore
git commit -m "chore: add .env.local to .gitignore"
```

---

## Task 15: Update CLAUDE.md with new architecture

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Add multiplayer architecture to CLAUDE.md**

Modify: `CLAUDE.md`

Add new section after "Key Implementation Details":

```markdown
### Multiplayer Game System

**Game Flow:**
1. **Create Game** (`/create-game`): Host fills WorldGenerationForm → React Query mutation calls API → API creates game → calls n8n for story generation → redirects to lobby
2. **Join Game** (`/join-game`): Player enters room code (verified via React Query mutation) → enters character name → React Query mutation joins lobby
3. **Lobby** (`/lobby/[roomCode]`): Real-time view with React Query for state management, showing room code, players, ready status, and story generation progress

**Real-time Communication:**
- Socket.io for WebSocket connections (path: `/api/socket`)
- Events: `join-lobby`, `player-joined`, `player-ready-changed`, `story-generated`
- Global Socket.io instance managed via `src/lib/socket-io.ts`
- WebSocket events update React Query cache directly via `queryClient.setQueryData()`

**State Management:**
- **Server State:** TanStack React Query v5
  - Query key pattern: `["game", roomCode]`
  - Optimistic updates for player ready status
  - WebSocket events synchronize with React Query cache
  - Automatic refetch every 30 seconds as backup
- **Database:** In-memory game store (`src/lib/game-store.ts`) using Map
  - Game state includes: roomCode, players, status, worldData, generatedStory
  - Player state includes: id, characterName, isReady, isHost

**API Endpoints:**
- `POST /api/games/create`: Create new game, trigger n8n story generation
- `GET /api/games/[roomCode]`: Fetch game state (used by React Query)
- `POST /api/games/join`: Join existing game with character name
- `POST /api/games/ready`: Toggle player ready status (optimistic updates via React Query)
- `POST /api/games/story-callback`: Webhook for n8n to send generated story

**React Query Patterns:**
- **Mutations:** `useMutation` for create game, join game, toggle ready status
- **Queries:** `useQuery` for fetching game state with initial data from server
- **Optimistic Updates:** Ready status updates immediately before server confirmation
- **Cache Synchronization:** WebSocket events update query cache for real-time sync
- **Error Handling:** Automatic rollback on mutation failure

**n8n Integration:**
- Environment variable: `N8N_WEBHOOK_URL`
- Sends: worldData + roomCode + callbackUrl
- Expects callback: `{ roomCode, story, status: "success" }`
- Game status: `generating` → `ready` when story arrives
```

**Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add multiplayer game system architecture to CLAUDE.md"
```

---

## Final Notes

**Testing the complete flow:**

1. Start dev server: `npm run dev`
2. Create game: Go to http://localhost:3000 → "Create Game" → Fill form → Submit
3. Copy room code from lobby
4. Join game: Open new browser window → http://localhost:3000 → "Join Game" → Enter room code → Enter character name
5. Verify real-time updates work in both windows
6. Toggle ready status and verify it updates

**Environment Setup:**

Create `.env.local`:
```
N8N_WEBHOOK_URL=http://localhost:5678/webhook/generate-story
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**n8n Webhook Expected Format:**

Request from Next.js to n8n:
```json
{
  "roomCode": "ABC123",
  "worldData": { /* form data */ },
  "callbackUrl": "http://localhost:3000/api/games/story-callback"
}
```

Response from n8n to callback:
```json
{
  "roomCode": "ABC123",
  "story": "Generated story content...",
  "status": "success"
}
```

**Known Limitations:**
- In-memory storage (data lost on server restart)
- No authentication (playerId stored in sessionStorage)
- No cleanup of old games
- Socket.io server requires custom Next.js server (works in dev mode)

**Production Considerations:**
- Implement proper authentication
- Use persistent database (Supabase, PostgreSQL)
- Add game expiration/cleanup
- Deploy Socket.io separately or use managed service (Pusher, Ably)
- Add error boundaries and loading states
- Implement reconnection logic for WebSockets
