import { facilitatorAgent } from "@/lib/services/facilitator-service";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { story, roomCode, narratorVoiceId } = body;

    if (!story) {
      return NextResponse.json({ error: "Story is required" }, { status: 400 });
    }

    // Call facilitator agent service to generate the audio file
    const audioBuffer = await facilitatorAgent({
      story,
      roomCode,
      narratorVoiceId,
    });

    // Convert Node.js Buffer to Uint8Array for NextResponse
    const audioData = new Uint8Array(audioBuffer);

    // Return the audio data as a binary response
    return new NextResponse(audioData, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioData.length.toString(),
      },
    });
  } catch (error) {
    console.error("Error in TTS endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
