import { NextRequest, NextResponse } from "next/server";
import { Buffer } from "node:buffer";

const ELEVENLABS_STT_ENDPOINT =
  process.env.ELEVENLABS_STT_URL ||
  "https://api.elevenlabs.io/v1/speech-to-text";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || "";
const ELEVENLABS_MODEL_ID =
  process.env.ELEVENLABS_STT_MODEL_ID || "scribe_v1";

export async function POST(req: NextRequest) {
  try {
    if (!ELEVENLABS_API_KEY) {
      return NextResponse.json(
        { error: "Speech-to-text API key is not configured" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { audio, mimeType, modelId } = body as {
      audio?: string;
      mimeType?: string;
      modelId?: string;
    };

    if (!audio) {
      return NextResponse.json(
        { error: "Audio payload is required" },
        { status: 400 }
      );
    }

    const audioBuffer = Buffer.from(audio, "base64");
    const resolvedModelId = modelId || ELEVENLABS_MODEL_ID;

    console.log("[speech-to-text] Payload summary", {
      mimeType,
      configuredModel: ELEVENLABS_MODEL_ID,
      incomingModel: modelId,
      resolvedModelId,
      audioBytes: audioBuffer.length,
    });

    const formData = new FormData();
    const blob = new Blob([audioBuffer], {
      type: mimeType || "audio/webm",
    });
    formData.append("model_id", resolvedModelId);
    formData.append("file", blob, `recording.${(mimeType || "audio/webm").split("/")[1] || "webm"}`);

    const response = await fetch(ELEVENLABS_STT_ENDPOINT, {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs STT error:", errorText);
      return NextResponse.json(
        { error: "Failed to transcribe audio" },
        { status: 500 }
      );
    }

    const data = (await response.json()) as {
      text?: string;
      transcription?: string;
    };

    return NextResponse.json({
      transcript: data?.text || data?.transcription || "",
    });
  } catch (error) {
    console.error("Speech to text error:", error);
    return NextResponse.json(
      { error: "Speech to text failed" },
      { status: 500 }
    );
  }
}
