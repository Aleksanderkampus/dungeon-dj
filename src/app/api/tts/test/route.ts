import { facilitatorAgent } from "@/lib/services/facilitator-service";
import { supabase } from "@/lib/services/supabase";
import { Game } from "@/types/game";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, voiceId, isFirstCall } = body;

    if (!text || !voiceId) {
      return NextResponse.json(
        { error: "Text and voiceId are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("games")
      .select("*")
      .eq("room_code", "XDBRJS")
      .single();

    // Generate audio buffer
    const game: Game = {
      narratorVoiceId: data?.narrator_voice_id || "",
      roomCode: data?.room_code || "",
      story: data?.story || "",
      status: data?.status || "ready",
      worldData: {
        genre: data?.genre || "",
        teamBackground: data?.team_background || "",
        storyGoal: data?.story_goal || "",
        storyIdea: data?.story_idea || "",
        facilitatorPersona: data?.facilitator_persona || "",
        facilitatorVoice: data?.facilitator_voice || "",
        actionsPerSession: data?.actions_per_session || "",
      },
      // If isFirstCall is true, set gameState to empty to trigger new heading generation
      // If isFirstCall is false, use existing game_state from database
      gameState: isFirstCall ? "" : data?.game_state || "",
      roomData: data?.room_data || "",
    };

    console.log(
      `Testing TTS - Call Type: ${
        isFirstCall ? "FIRST" : "SECOND"
      }, gameState: ${game.gameState ? "EXISTS" : "EMPTY"}`
    );

    const response = await facilitatorAgent(game, isFirstCall ? "" : text);

    // Return JSON with audio (base64) and text
    return NextResponse.json({
      audio: response.audio,
      text: response.text,
    });
  } catch (error) {
    console.error("TTS Error:", error);
    return NextResponse.json(
      { error: "Failed to generate audio", details: (error as Error).message },
      { status: 500 }
    );
  }
}
