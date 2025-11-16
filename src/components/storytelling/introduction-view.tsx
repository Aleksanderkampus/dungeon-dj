"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX, Play, Pause, Loader2 } from "lucide-react";
import { useAudioPlayer } from "@/hooks/use-audio-player";
import { splitIntoSentences } from "@/lib/story-parser";
import { GridMapVisualization } from "@/components/grid-map/grid-map-visualization";
import { Game } from "@/types/game";
import { base64ToAudioBlob } from "@/lib/audio-utils";
import { SpeechToTextRecorder } from "./speech-to-text-recorder";

type IntroductionViewProps = {
  roomCode: string;
};

type TTSResponse = {
  audioBlob: Blob;
  text: string;
};

async function fetchTTSAudio(params: {
  roomCode: string;
}): Promise<TTSResponse> {
  const response = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`TTS API error: ${response.status}`);
  }

  const data = await response.json();

  if (!data.audio || !data.text) {
    throw new Error("Invalid response from TTS API");
  }

  return {
    audioBlob: base64ToAudioBlob(data.audio),
    text: data.text,
  };
}

export function IntroductionView({ roomCode }: IntroductionViewProps) {
  const [currentSentenceIndex, setCurrentSentenceIndex] = React.useState(-1);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isMuted, setIsMuted] = React.useState(false);
  const [isComplete, setIsComplete] = React.useState(false);
  const [narrationText, setNarrationText] = React.useState("");
  const [audioBlob, setAudioBlob] = React.useState<Blob | null>(null);

  // Fetch game data to get room information
  const { data: gameData } = useQuery({
    queryKey: ["game", roomCode],
    queryFn: async () => {
      const response = await fetch(`/api/games/${roomCode}`);
      if (!response.ok) throw new Error("Failed to fetch game data");
      const data = await response.json();
      return data.game as Game;
    },
    staleTime: Infinity,
  });

  // Fetch TTS audio and text with React Query (starts immediately on mount)
  const { data: ttsData, isLoading } = useQuery({
    queryKey: ["tts", roomCode],
    queryFn: () => fetchTTSAudio({ roomCode }),
    enabled: true, // Fetch immediately on mount
    staleTime: Infinity, // Audio doesn't go stale
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
  });

  React.useEffect(() => {
    if (!ttsData) return;
    setNarrationText(ttsData.text);
    setAudioBlob(ttsData.audioBlob);
    setCurrentSentenceIndex(-1);
    setIsComplete(false);
    setIsPlaying(false);
  }, [ttsData]);

  // Extract audio blob and split text into sentences
  const sectionSentences = React.useMemo(() => {
    if (!narrationText) return [];
    return splitIntoSentences(narrationText);
  }, [narrationText]);

  // Initialize audio player
  const audioPlayer = useAudioPlayer({
    onEnded: () => {
      setIsPlaying(false);
      setIsComplete(true);
    },
    onError: (error) => {
      console.error("Audio playback error:", error);
      setIsPlaying(false);
    },
  });

  // Start the storytelling (play audio and show controls)
  const handleStart = () => {
    if (!audioBlob) return;

    setCurrentSentenceIndex(0);
    audioPlayer.play(audioBlob);
    setIsPlaying(true);
  };

  // Toggle play/pause
  const handleTogglePlay = () => {
    if (!audioBlob) return; // Wait for audio to load

    if (isPlaying) {
      audioPlayer.pause();
      setIsPlaying(false);
    } else {
      audioPlayer.play(audioBlob);
      setIsPlaying(true);
    }
  };

  // Toggle mute
  const handleToggleMute = () => {
    setIsMuted(!isMuted);
  };

  // Sync mute state
  React.useEffect(() => {
    if (isMuted !== audioPlayer.isMuted) {
      audioPlayer.toggleMute();
    }
  }, [isMuted, audioPlayer]);

  // Progressive sentence display with timing based on audio duration
  React.useEffect(() => {
    if (!isPlaying || currentSentenceIndex === -1 || !audioPlayer.duration)
      return;

    if (currentSentenceIndex < sectionSentences.length - 1) {
      // Calculate time per sentence based on audio duration
      const timePerSentence =
        sectionSentences[currentSentenceIndex].split(" ").length * 500;
      console.log(
        "timePerSentence",
        timePerSentence,
        audioPlayer.duration,
        sectionSentences.length
      );

      const timer = setTimeout(() => {
        setCurrentSentenceIndex((prev) => prev + 1);
      }, timePerSentence);

      return () => clearTimeout(timer);
    }
  }, [isPlaying, currentSentenceIndex, sectionSentences, audioPlayer.duration]);

  const handleFacilitatorResponse = React.useCallback(
    (payload: { audioBlob: Blob; text: string }) => {
      setNarrationText(payload.text);
      setAudioBlob(payload.audioBlob);
      setCurrentSentenceIndex(0);
      setIsComplete(false);
      setIsPlaying(true);
      audioPlayer.play(payload.audioBlob);
    },
    [audioPlayer]
  );

  // Get the first room's grid map for visualization
  const firstRoom = gameData?.roomData
    ? JSON.parse(gameData.roomData).rooms[0]
    : null;

  return (
    <div className="container mx-auto max-w-7xl space-y-6 p-4">
      <Card>
        <CardContent className="p-8">
          <h2 className="mb-6 text-2xl font-bold">Introduction</h2>

          {/* Two-column layout: Story text + Grid map */}
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Left column: Story text */}
            <div className="space-y-4">
              {/* Story text display */}
              <div className="min-h-[300px] space-y-2 text-lg leading-relaxed">
                {currentSentenceIndex === -1 ? (
                  <p className="text-muted-foreground italic">
                    Press start to begin the adventure...
                  </p>
                ) : (
                  sectionSentences
                    .slice(0, currentSentenceIndex + 1)
                    .map((sentence, idx) => (
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
            </div>

            {/* Right column: Grid map */}
            <div className="flex items-start">
              {firstRoom?.gridMap ? (
                <GridMapVisualization
                  gridMap={firstRoom.gridMap}
                  className="w-full"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 p-8">
                  <p className="text-center text-sm text-muted-foreground">
                    Loading room map...
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="mt-8 flex items-center justify-center gap-4">
            {currentSentenceIndex === -1 ? (
              <Button size="lg" onClick={handleStart} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Loading Audio...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-5 w-5" />
                    Start Adventure
                  </>
                )}
              </Button>
            ) : (
              <>
                <Button size="lg" variant="outline" onClick={handleTogglePlay}>
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

                <Button size="lg" variant="outline" onClick={handleToggleMute}>
                  {isMuted ? (
                    <VolumeX className="h-5 w-5" />
                  ) : (
                    <Volume2 className="h-5 w-5" />
                  )}
                </Button>
              </>
            )}
          </div>

          {isComplete && (
            <div className="mt-8">
              <SpeechToTextRecorder
                roomCode={roomCode}
                onResponse={handleFacilitatorResponse}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
