"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Mic, Square } from "lucide-react";
import { toast } from "sonner";
import { base64ToAudioBlob } from "@/lib/audio-utils";

async function blobToBase64(blob: Blob): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(arrayBuffer);
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

type SpeechToTextRecorderProps = {
  roomCode: string;
  onResponse?: (payload: { audioBlob: Blob; text: string }) => void;
};

type RecorderStatus = "idle" | "recording" | "transcribing" | "responding";

export function SpeechToTextRecorder({
  roomCode,
  onResponse,
}: SpeechToTextRecorderProps) {
  const [status, setStatus] = React.useState<RecorderStatus>("idle");
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);

  const forwardToFacilitator = async (transcript: string) => {
    try {
      setStatus("responding");
      const response = await fetch("/api/storytelling/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomCode, transcript }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Facilitator request failed");
      }

      if (!data?.audio || !data?.text) {
        throw new Error("Invalid facilitator response");
      }

      const audioBlob = base64ToAudioBlob(data.audio);
      onResponse?.({ audioBlob, text: data.text });
      toast.success("Facilitator responded");
    } catch (error) {
      console.error("[speech-to-text] Facilitator error:", error);
      toast.error(
        error instanceof Error ? error.message : "Facilitator request failed"
      );
    } finally {
      setStatus("idle");
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        setStatus("transcribing");

        try {
          const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
          const audio = await blobToBase64(blob);
          const response = await fetch("/api/speech-to-text", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ audio, mimeType: blob.type }),
          });

          const data = await response.json();
          if (!response.ok) {
            throw new Error(data?.error || "Transcription failed");
          }

          const transcript = data?.transcript?.trim();

          if (!transcript) {
            throw new Error("No transcription received");
          }

          toast.success("Transcription ready");
          await forwardToFacilitator(transcript);
        } catch (error) {
          console.error("STT error:", error);
          toast.error(
            error instanceof Error ? error.message : "Transcription failed"
          );
          setStatus("idle");
        }
      };

      recorder.start();
      setStatus("recording");
    } catch (error) {
      console.error("Recording error:", error);
      toast.error("Microphone permission denied");
      setStatus("idle");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && status === "recording") {
      setStatus("transcribing");
      mediaRecorderRef.current.stop();
    }
  };

  const isRecording = status === "recording";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Respond With Your Voice</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          {isRecording ? (
            <Button variant="destructive" onClick={stopRecording}>
              <Square className="mr-2 h-4 w-4" />
              Stop Recording
            </Button>
          ) : (
            <Button
              onClick={startRecording}
              disabled={status === "transcribing" || status === "responding"}
            >
              <Mic className="mr-2 h-4 w-4" />
              Start Recording
            </Button>
          )}

          {status === "recording" && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Listening...
            </div>
          )}

          {status === "transcribing" && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Transcribing...
            </div>
          )}

          {status === "responding" && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Facilitator is responding...
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
