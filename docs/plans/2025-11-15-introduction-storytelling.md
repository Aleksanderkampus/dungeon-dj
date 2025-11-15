# Introduction Storytelling Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement sentence-by-sentence introduction storytelling with synchronized text-to-speech audio playback using mock data.

**Architecture:** Parse introduction section from story markdown, render text progressively sentence-by-sentence, integrate with text-to-speech backend endpoint for audio playback, synchronize text display with audio narration timing.

**Tech Stack:** Next.js App Router, React 19, TypeScript, TanStack React Query, Web Audio API, shadcn/ui components

---

## Task 1: Create Introduction Parser Utility

**Files:**
- Create: `src/lib/story-parser.ts`
- Test: Manual verification via console logging

**Step 1: Create feature branch**

```bash
git checkout master
git pull
git checkout -b feature/story-parser
```

**Step 2: Create story parser utility file**

```typescript
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
```

**Step 3: Verify parser works with mock data**

Create a simple test in the file:

```typescript
// Manual test (remove after verification)
if (require.main === module) {
  const mockStory = `
### INTRODUCTION

The ancient city of Eldoria lies before you. Dark clouds gather overhead. Your quest begins now.

---

### CHAPTER 1
More content here...
`;

  const intro = parseIntroduction(mockStory);
  console.log('Introduction:', intro);

  const sentences = splitIntoSentences(intro);
  console.log('Sentences:', sentences);
}
```

**Step 4: Test the parser**

Run: `npx tsx src/lib/story-parser.ts`

Expected output:
```
Introduction: The ancient city of Eldoria lies before you. Dark clouds gather overhead. Your quest begins now.
Sentences: [
  'The ancient city of Eldoria lies before you.',
  'Dark clouds gather overhead.',
  'Your quest begins now.'
]
```

**Step 5: Remove test code**

Remove the manual test block from the file.

**Step 6: Commit and push**

```bash
git add src/lib/story-parser.ts
git commit -m "feat: add story parser for introduction extraction"
git push -u origin feature/story-parser
```

---

## Task 2: Create Storytelling UI Component (Mock Data)

**Files:**
- Create: `src/components/storytelling/introduction-view.tsx`
- Modify: `src/types/game.ts` (add storytelling types if needed)

**Step 1: Create feature branch**

```bash
git checkout master
git pull
git checkout -b feature/introduction-view-component
```

**Step 2: Create the IntroductionView component with mock data**

```typescript
"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX, Play, Pause } from "lucide-react";

type IntroductionViewProps = {
  roomCode: string;
};

export function IntroductionView({ roomCode }: IntroductionViewProps) {
  // Mock data for initial development
  const mockSentences = [
    "The ancient city of Eldoria lies before you.",
    "Dark clouds gather overhead as thunder rumbles in the distance.",
    "Your quest to retrieve the Crystal of Light begins now.",
    "The fate of the kingdom rests in your hands.",
  ];

  const [currentSentenceIndex, setCurrentSentenceIndex] = React.useState(-1);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isMuted, setIsMuted] = React.useState(false);

  // Start the storytelling
  const handleStart = () => {
    setIsPlaying(true);
    setCurrentSentenceIndex(0);
  };

  // Toggle play/pause
  const handleTogglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  // Toggle mute
  const handleToggleMute = () => {
    setIsMuted(!isMuted);
  };

  // Get all sentences up to current index for display
  const displayedText = mockSentences
    .slice(0, currentSentenceIndex + 1)
    .join(" ");

  return (
    <div className="container mx-auto max-w-4xl space-y-6 p-4">
      <Card>
        <CardContent className="p-8">
          <div className="mb-8">
            <h2 className="mb-4 text-2xl font-bold">Introduction</h2>

            {/* Story text display */}
            <div className="min-h-[200px] text-lg leading-relaxed">
              {currentSentenceIndex === -1 ? (
                <p className="text-muted-foreground italic">
                  Press start to begin the adventure...
                </p>
              ) : (
                <p className="animate-in fade-in duration-500">
                  {displayedText}
                </p>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4">
            {currentSentenceIndex === -1 ? (
              <Button size="lg" onClick={handleStart}>
                <Play className="mr-2 h-5 w-5" />
                Start Adventure
              </Button>
            ) : (
              <>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleTogglePlay}
                >
                  {isPlaying ? (
                    <>
                      <Pause className="mr-2 h-5 w-5" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-5 w-5" />
                      Resume
                    </>
                  )}
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleToggleMute}
                >
                  {isMuted ? (
                    <VolumeX className="h-5 w-5" />
                  ) : (
                    <Volume2 className="h-5 w-5" />
                  )}
                </Button>
              </>
            )}
          </div>

          {/* Debug info (remove later) */}
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Sentence {currentSentenceIndex + 1} of {mockSentences.length}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Step 3: Create a route to test the component**

Create: `src/app/storytelling/[roomCode]/page.tsx`

```typescript
import { IntroductionView } from "@/components/storytelling/introduction-view";

type StorytellingPageProps = {
  params: Promise<{
    roomCode: string;
  }>;
};

export default async function StorytellingPage({ params }: StorytellingPageProps) {
  const { roomCode } = await params;

  return <IntroductionView roomCode={roomCode} />;
}
```

**Step 4: Test the component manually**

Run: `npm run dev`

Navigate to: `http://localhost:3000/storytelling/TEST123`

Expected: See the introduction view with "Start Adventure" button, click it to see the mock text appear.

**Step 5: Commit and push**

```bash
git add src/components/storytelling/introduction-view.tsx src/app/storytelling/[roomCode]/page.tsx
git commit -m "feat: add introduction view component with mock data"
git push -u origin feature/introduction-view-component
```

---

## Task 3: Implement Progressive Sentence Display

**Files:**
- Modify: `src/components/storytelling/introduction-view.tsx`

**Step 1: Create feature branch**

```bash
git checkout master
git pull
git checkout -b feature/progressive-sentence-display
```

**Step 2: Add sentence progression logic with timing**

Update the component to automatically advance sentences:

```typescript
// Add inside IntroductionView component, after state declarations

// Auto-advance to next sentence with timing
React.useEffect(() => {
  if (!isPlaying) return;

  // Check if we've displayed all sentences
  if (currentSentenceIndex >= mockSentences.length - 1) {
    setIsPlaying(false);
    return;
  }

  // Mock timing: 3 seconds per sentence (will be replaced with audio duration)
  const timer = setTimeout(() => {
    setCurrentSentenceIndex(prev => prev + 1);
  }, 3000);

  return () => clearTimeout(timer);
}, [isPlaying, currentSentenceIndex, mockSentences.length]);
```

**Step 3: Add visual indicator for current sentence**

Update the text display section to highlight the current sentence:

```typescript
{/* Story text display - replace existing display */}
<div className="min-h-[200px] space-y-2 text-lg leading-relaxed">
  {currentSentenceIndex === -1 ? (
    <p className="text-muted-foreground italic">
      Press start to begin the adventure...
    </p>
  ) : (
    mockSentences.slice(0, currentSentenceIndex + 1).map((sentence, idx) => (
      <span
        key={idx}
        className={
          idx === currentSentenceIndex
            ? "animate-in fade-in duration-300 font-medium"
            : "text-muted-foreground"
        }
      >
        {sentence}{" "}
      </span>
    ))
  )}
</div>
```

**Step 4: Test progressive display**

Run: `npm run dev`

Navigate to: `http://localhost:3000/storytelling/TEST123`

Expected:
- Click "Start Adventure"
- See first sentence appear
- After 3 seconds, second sentence appears
- Continue until all sentences are displayed
- New sentences are highlighted, old ones are muted

**Step 5: Commit and push**

```bash
git add src/components/storytelling/introduction-view.tsx
git commit -m "feat: add progressive sentence display with timing"
git push -u origin feature/progressive-sentence-display
```

---

## Task 4: Create Text-to-Speech API Endpoint (Mock)

**Files:**
- Create: `src/app/api/tts/route.ts`

**Step 1: Create feature branch**

```bash
git checkout master
git pull
git checkout -b feature/mock-tts-endpoint
```

**Step 2: Create mock TTS endpoint**

```typescript
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, voiceId } = body;

    if (!text) {
      return NextResponse.json(
        { error: "Text is required" },
        { status: 400 }
      );
    }

    // Mock response - in real implementation, this would call ElevenLabs
    // Return a mock audio URL and duration
    const mockAudioUrl = "data:audio/mp3;base64,//uQx..."; // Empty audio data
    const mockDuration = text.length * 50; // ~50ms per character as rough estimate

    return NextResponse.json({
      audioUrl: mockAudioUrl,
      duration: mockDuration,
      text,
    });
  } catch (error) {
    console.error("Error in TTS endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

**Step 3: Test the endpoint**

Run: `npm run dev`

Test with curl or Postman:
```bash
curl -X POST http://localhost:3000/api/tts \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello world","voiceId":"test"}'
```

Expected response:
```json
{
  "audioUrl": "data:audio/mp3;base64,//uQx...",
  "duration": 550,
  "text": "Hello world"
}
```

**Step 4: Commit and push**

```bash
git add src/app/api/tts/route.ts
git commit -m "feat: add mock text-to-speech API endpoint"
git push -u origin feature/mock-tts-endpoint
```

---

## Task 5: Integrate Audio Playback Hook

**Files:**
- Create: `src/hooks/use-audio-player.ts`

**Step 1: Create feature branch**

```bash
git checkout master
git pull
git checkout -b feature/audio-player-hook
```

**Step 2: Create audio player hook**

```typescript
import * as React from "react";

type AudioPlayerOptions = {
  onEnded?: () => void;
  onError?: (error: Error) => void;
};

export function useAudioPlayer({ onEnded, onError }: AudioPlayerOptions = {}) {
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isMuted, setIsMuted] = React.useState(false);

  // Initialize audio element
  React.useEffect(() => {
    const audio = new Audio();

    audio.addEventListener("ended", () => {
      setIsPlaying(false);
      onEnded?.();
    });

    audio.addEventListener("error", (e) => {
      setIsPlaying(false);
      setIsLoading(false);
      onError?.(new Error("Audio playback failed"));
    });

    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, [onEnded, onError]);

  // Handle mute state
  React.useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const play = async (audioUrl: string) => {
    if (!audioRef.current) return;

    try {
      setIsLoading(true);
      audioRef.current.src = audioUrl;
      await audioRef.current.play();
      setIsPlaying(true);
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      setIsPlaying(false);
      onError?.(error as Error);
    }
  };

  const pause = () => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    setIsPlaying(false);
  };

  const toggleMute = () => {
    setIsMuted(prev => !prev);
  };

  return {
    play,
    pause,
    toggleMute,
    isLoading,
    isPlaying,
    isMuted,
  };
}
```

**Step 3: Commit and push**

```bash
git add src/hooks/use-audio-player.ts
git commit -m "feat: add audio player hook for TTS playback"
git push -u origin feature/audio-player-hook
```

---

## Task 6: Integrate TTS with Sentence Display

**Files:**
- Modify: `src/components/storytelling/introduction-view.tsx`

**Step 1: Create feature branch**

```bash
git checkout master
git pull
git checkout -b feature/tts-sentence-integration
```

**Step 2: Add TTS fetching and audio playback**

```typescript
// Add imports at the top
import { useAudioPlayer } from "@/hooks/use-audio-player";

// Add inside component, after existing state
const [isLoadingAudio, setIsLoadingAudio] = React.useState(false);

// Initialize audio player
const audioPlayer = useAudioPlayer({
  onEnded: () => {
    // Move to next sentence when audio finishes
    if (currentSentenceIndex < mockSentences.length - 1) {
      setCurrentSentenceIndex(prev => prev + 1);
    } else {
      setIsPlaying(false);
    }
  },
  onError: (error) => {
    console.error("Audio playback error:", error);
    // Continue to next sentence even on error
    if (currentSentenceIndex < mockSentences.length - 1) {
      setCurrentSentenceIndex(prev => prev + 1);
    } else {
      setIsPlaying(false);
    }
  },
});

// Sync mute state
React.useEffect(() => {
  if (isMuted !== audioPlayer.isMuted) {
    audioPlayer.toggleMute();
  }
}, [isMuted, audioPlayer]);

// Fetch and play TTS for current sentence
React.useEffect(() => {
  if (!isPlaying || currentSentenceIndex === -1) return;

  const currentSentence = mockSentences[currentSentenceIndex];

  async function fetchAndPlayTTS() {
    try {
      setIsLoadingAudio(true);

      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: currentSentence,
          voiceId: "mock-voice-id",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch TTS audio");
      }

      const { audioUrl } = await response.json();
      setIsLoadingAudio(false);

      // Play the audio
      await audioPlayer.play(audioUrl);
    } catch (error) {
      console.error("TTS fetch error:", error);
      setIsLoadingAudio(false);
      // Continue to next sentence after delay on error
      setTimeout(() => {
        if (currentSentenceIndex < mockSentences.length - 1) {
          setCurrentSentenceIndex(prev => prev + 1);
        } else {
          setIsPlaying(false);
        }
      }, 2000);
    }
  }

  fetchAndPlayTTS();
}, [currentSentenceIndex, isPlaying]);
```

**Step 3: Update play/pause handlers**

```typescript
// Update handleTogglePlay
const handleTogglePlay = () => {
  if (isPlaying) {
    audioPlayer.pause();
  }
  setIsPlaying(!isPlaying);
};
```

**Step 4: Remove old auto-advance effect**

Remove the previous `useEffect` that used `setTimeout` for sentence progression (from Task 3), since we now advance based on audio completion.

**Step 5: Add loading indicator**

Update the controls section to show loading state:

```typescript
{/* Update the Play/Pause button */}
<Button
  size="lg"
  variant="outline"
  onClick={handleTogglePlay}
  disabled={isLoadingAudio}
>
  {isLoadingAudio ? (
    <>
      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
      Loading...
    </>
  ) : isPlaying ? (
    <>
      <Pause className="mr-2 h-5 w-5" />
      Pause
    </>
  ) : (
    <>
      <Play className="mr-2 h-5 w-5" />
      Resume
    </>
  )}
</Button>
```

**Step 6: Test the integration**

Run: `npm run dev`

Navigate to: `http://localhost:3000/storytelling/TEST123`

Expected:
- Click "Start Adventure"
- See loading indicator briefly
- First sentence appears (audio won't actually play with mock data)
- After mock audio "finishes", next sentence loads
- Continue through all sentences
- Pause/resume works correctly
- Mute toggle updates state

**Step 7: Commit and push**

```bash
git add src/components/storytelling/introduction-view.tsx
git commit -m "feat: integrate TTS audio playback with sentence display"
git push -u origin feature/tts-sentence-integration
```

---

## Task 7: Add Transition from Lobby to Storytelling

**Files:**
- Modify: `src/components/lobby/lobby-view.tsx`
- Modify: `src/types/game.ts` (if needed)

**Step 1: Create feature branch**

```bash
git checkout master
git pull
git checkout -b feature/lobby-to-storytelling-transition
```

**Step 2: Add "Start Game" button for host when story is ready**

In `lobby-view.tsx`, add after the ready button section (around line 240):

```typescript
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
```

**Step 3: Test the transition**

Run: `npm run dev`

Expected flow:
1. Create a game
2. Wait for story to generate (or mock it as "ready")
3. See "Start Game" button appear for host
4. Click button → navigate to storytelling page
5. See introduction view with mock sentences

**Step 4: Commit and push**

```bash
git add src/components/lobby/lobby-view.tsx
git commit -m "feat: add game start transition from lobby to storytelling"
git push -u origin feature/lobby-to-storytelling-transition
```

---

## Task 8: Integration Testing & Polish

**Files:**
- Modify: `src/components/storytelling/introduction-view.tsx`

**Step 1: Create feature branch**

```bash
git checkout master
git pull
git checkout -b feature/storytelling-polish
```

**Step 2: Add completion state**

Add state for when introduction is complete:

```typescript
const [isComplete, setIsComplete] = React.useState(false);

// Update the onEnded callback in useEffect
const audioPlayer = useAudioPlayer({
  onEnded: () => {
    if (currentSentenceIndex < mockSentences.length - 1) {
      setCurrentSentenceIndex(prev => prev + 1);
    } else {
      setIsPlaying(false);
      setIsComplete(true);
    }
  },
  // ... rest of callbacks
});
```

**Step 3: Add completion UI**

Add after the controls section:

```typescript
{/* Completion message */}
{isComplete && (
  <div className="mt-6 text-center">
    <p className="mb-4 text-lg font-medium text-green-600">
      Introduction Complete!
    </p>
    <Button
      size="lg"
      onClick={() => {
        // TODO: Navigate to next section
        console.log("Continue to next section");
      }}
    >
      Continue to Chapter 1
    </Button>
  </div>
)}
```

**Step 4: Manual end-to-end testing**

Test the complete flow:

1. Start dev server: `npm run dev`
2. Navigate to: `http://localhost:3000/storytelling/TEST123`
3. Verify:
   - Initial state shows "Press start to begin"
   - Click "Start Adventure" → first sentence appears
   - Sentences progress automatically
   - Pause button stops progression
   - Resume continues from same point
   - Mute button toggles (no actual audio yet)
   - After all sentences, completion message appears
   - Debug counter shows correct progress

**Step 5: Clean up debug UI**

Remove the debug info section showing sentence count.

**Step 6: Commit and push**

```bash
git add src/components/storytelling/introduction-view.tsx
git commit -m "feat: add completion state and polish storytelling UI"
git push -u origin feature/storytelling-polish
```

---

## Next Steps (Future Plans)

After testing this mock implementation, the following features can be added:

1. **Real TTS Integration**: Replace mock TTS endpoint with actual ElevenLabs API call
2. **Parse Real Story Data**: Integrate `story-parser.ts` to extract introduction from actual game story
3. **Persist Game State**: Update game status to "in-progress" when storytelling starts
4. **Save Progress**: Allow players to pause and resume later
5. **Chapter Navigation**: Build similar components for subsequent chapters
6. **Multiplayer Sync**: Ensure all players see storytelling in sync (React Query polling)

---

## Verification Checklist

- [ ] Story parser correctly extracts introduction section
- [ ] Sentences split properly on punctuation
- [ ] Introduction view renders with mock data
- [ ] Sentences display progressively
- [ ] Current sentence is highlighted
- [ ] Mock TTS endpoint returns expected response
- [ ] Audio player hook manages playback state
- [ ] Pause/resume controls work correctly
- [ ] Mute toggle updates state
- [ ] Completion state triggers after last sentence
- [ ] Lobby has "Start Game" button for host
- [ ] Navigation from lobby to storytelling works
- [ ] All TypeScript types are correct
- [ ] No console errors during flow
