"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Mic, Square } from "lucide-react";

async function blobToBase64(blob: Blob): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function SpeechToTextTester() {
  const [isRecording, setIsRecording] = React.useState(false);
  const [transcript, setTranscript] = React.useState("");
  const [status, setStatus] = React.useState<"idle" | "recording" | "sending">(
    "idle"
  );
  const [error, setError] = React.useState<string | null>(null);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);

  const handleStartRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        setStatus("sending");
        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType });
        try {
          const base64Audio = await blobToBase64(blob);
          const response = await fetch("/api/speech-to-text", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              audio: base64Audio,
              mimeType: blob.type,
            }),
          });

          const data = await response.json();
          if (!response.ok) {
            throw new Error(data?.error || "Unable to transcribe audio");
          }
          setTranscript(data.transcript || "");
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Failed to transcribe audio";
          setError(message);
        } finally {
          setStatus("idle");
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setStatus("recording");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to start recording";
      setError(message);
      setStatus("idle");
    }
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    mediaRecorderRef.current?.stop();
  };

  const isBusy = status === "recording" || status === "sending";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Speech-to-Text Tester</CardTitle>
        <CardDescription>
          Record a short phrase to test the ElevenLabs transcription pipeline.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          {isRecording ? (
            <Button
              variant="destructive"
              onClick={handleStopRecording}
              disabled={status === "sending"}
            >
              <Square className="h-4 w-4" />
              Stop recording
            </Button>
          ) : (
            <Button onClick={handleStartRecording} disabled={isBusy}>
              <Mic className="h-4 w-4" />
              Start recording
            </Button>
          )}
          {status === "recording" && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Listening...
            </div>
          )}
          {status === "sending" && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Transcribing...
            </div>
          )}
        </div>
        <Textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Transcript will appear here..."
          rows={4}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
