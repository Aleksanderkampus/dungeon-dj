"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const VOICE_OPTIONS = [
  { value: "adam", label: "Adam - Deep & Authoritative" },
  { value: "bella", label: "Bella - Warm & Friendly" },
  { value: "charlie", label: "Charlie - British & Sophisticated" },
  { value: "daniel", label: "Daniel - Professional & Clear" },
  { value: "emily", label: "Emily - Energetic & Youthful" },
  { value: "george", label: "George - Mature & Wise" },
  { value: "jessica", label: "Jessica - Confident & Dynamic" },
  { value: "thomas", label: "Thomas - Calm & Narrative" },
];

const DEFAULT_TEXT =
  "Welcome, brave adventurers! Your journey begins in the mystical land of Eldoria, where magic flows through the very air you breathe. Ancient ruins dot the landscape, whispering secrets of a forgotten age.";

export default function TestTTSPage() {
  const [text, setText] = useState(DEFAULT_TEXT);
  const [voiceId, setVoiceId] = useState("adam");
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isFirstCall, setIsFirstCall] = useState(true);

  const handleGenerate = async () => {
    if (!text.trim()) {
      toast.error("Please enter some text to convert");
      return;
    }

    if (!voiceId) {
      toast.error("Please select a voice");
      return;
    }

    setIsLoading(true);
    setAudioUrl(null);

    try {
      const response = await fetch("/api/tts/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text, voiceId, isFirstCall }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate audio");
      }

      // Create a blob from the response
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      toast.success("Audio generated successfully!");
    } catch (error) {
      console.error("Error generating audio:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to generate audio"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-3xl p-8">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            ElevenLabs TTS Test Interface
          </h1>
          <p className="text-muted-foreground">
            Test text-to-speech functionality with different voices
          </p>
        </div>

        <div className="space-y-6 bg-card border rounded-lg p-6">
          {/* First/Second Call Toggle */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="space-y-0.5">
              <Label>Call Type</Label>
              <p className="text-sm text-muted-foreground">
                {isFirstCall
                  ? "First Call - Generates new story headings"
                  : "Second Call - Uses existing game state"}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={isFirstCall ? "default" : "outline"}
                size="sm"
                onClick={() => setIsFirstCall(true)}
              >
                First
              </Button>
              <Button
                variant={!isFirstCall ? "default" : "outline"}
                size="sm"
                onClick={() => setIsFirstCall(false)}
              >
                Second
              </Button>
            </div>
          </div>

          {/* Voice Selection */}
          <div className="space-y-2">
            <Label htmlFor="voice">Voice Selection</Label>
            <Select value={voiceId} onValueChange={setVoiceId}>
              <SelectTrigger id="voice">
                <SelectValue placeholder="Select a voice..." />
              </SelectTrigger>
              <SelectContent>
                {VOICE_OPTIONS.map((voice) => (
                  <SelectItem key={voice.value} value={voice.value}>
                    {voice.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Text Input */}
          <div className="space-y-2">
            <Label htmlFor="text">Text to Convert</Label>
            <Textarea
              id="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter the text you want to convert to speech..."
              rows={8}
              className="resize-none"
            />
            <p className="text-sm text-muted-foreground">
              Characters: {text.length}
            </p>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={isLoading || !text.trim() || !voiceId}
            className="w-full"
            size="lg"
          >
            {isLoading ? "Generating Audio..." : "Generate Speech"}
          </Button>

          {/* Audio Player */}
          {audioUrl && (
            <div className="space-y-2 p-4 bg-muted rounded-lg">
              <Label>Generated Audio</Label>
              <audio controls className="w-full" src={audioUrl}>
                Your browser does not support the audio element.
              </audio>
              <p className="text-sm text-muted-foreground">
                Audio generated successfully. Use the controls above to play.
              </p>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="text-sm text-muted-foreground space-y-2">
          <p>
            <strong>How to use:</strong>
          </p>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>Toggle between "First" or "Second" call type</li>
            <li>Select a voice from the dropdown</li>
            <li>Enter or modify the text you want to convert</li>
            <li>Click "Generate Speech" to create the audio</li>
            <li>Use the audio player to listen to the result</li>
          </ol>
          <p className="text-xs mt-2">
            <strong>Note:</strong> First call generates new story headings,
            second call uses existing game state (simulating facilitatorAgent
            behavior).
          </p>
        </div>
      </div>
    </div>
  );
}
