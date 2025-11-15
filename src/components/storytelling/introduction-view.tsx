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
