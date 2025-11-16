"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX, Play, Pause, Loader2 } from "lucide-react";
import { useAudioPlayer } from "@/hooks/use-audio-player";
import { splitIntoSentences } from "@/lib/story-parser";

type IntroductionViewProps = {
  roomCode: string;
};

type TTSResponse = {
  audioBlob: Blob;
  text: string;
};

// API function to fetch TTS audio and text
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

  // Decode base64 audio to Blob
  const audioData = atob(data.audio);
  const audioArray = new Uint8Array(audioData.length);
  for (let i = 0; i < audioData.length; i++) {
    audioArray[i] = audioData.charCodeAt(i);
  }
  const audioBlob = new Blob([audioArray], { type: "audio/mpeg" });

  return {
    audioBlob,
    text: data.text,
  };
}

export function IntroductionView({ roomCode }: IntroductionViewProps) {

  const [currentSentenceIndex, setCurrentSentenceIndex] = React.useState(-1);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isMuted, setIsMuted] = React.useState(false);
  const [isComplete, setIsComplete] = React.useState(false);

  // Fetch TTS audio and text with React Query (starts immediately on mount)
  const { data: ttsData, isLoading } = useQuery({
    queryKey: ["tts", roomCode],
    queryFn: () => fetchTTSAudio({ roomCode }),
    enabled: true, // Fetch immediately on mount
    staleTime: Infinity, // Audio doesn't go stale
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
  });

  // Extract audio blob and split text into sentences
  const audioBlob = ttsData?.audioBlob;
  const sectionSentences = React.useMemo(() => {
    if (!ttsData?.text) return [];
    return splitIntoSentences(ttsData.text);
  }, [ttsData?.text]);

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
  }, [
    isPlaying,
    currentSentenceIndex,
    sectionSentences.length,
    audioPlayer.duration,
  ]);

  return (
    <div className="container mx-auto max-w-4xl space-y-6 p-4">
      <Card>
        <CardContent className="p-8">
          <div className="mb-8">
            <h2 className="mb-4 text-2xl font-bold">Introduction</h2>

            {/* Story text display */}
            <div className="min-h-[200px] space-y-2 text-lg leading-relaxed">
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

          {/* Controls */}
          <div className="flex items-center justify-center gap-4">
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
        </CardContent>
      </Card>
    </div>
  );
}
