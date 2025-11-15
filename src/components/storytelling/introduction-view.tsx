"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX, Play, Pause, Loader2 } from "lucide-react";
import { useAudioPlayer } from "@/hooks/use-audio-player";

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

  // Start the storytelling
  const handleStart = () => {
    setIsPlaying(true);
    setCurrentSentenceIndex(0);
  };

  // Toggle play/pause
  const handleTogglePlay = () => {
    if (isPlaying) {
      audioPlayer.pause();
    }
    setIsPlaying(!isPlaying);
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
