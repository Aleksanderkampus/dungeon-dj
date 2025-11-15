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
