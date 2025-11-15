import { IntroductionView } from "@/components/storytelling/introduction-view";
import { gameStore } from "@/lib/game-store";

type StorytellingPageProps = {
  params: Promise<{
    roomCode: string;
  }>;
};

const STORY = `### INTRODUCTION

In the neon-lit cityscape of Neo-Madrid, rumors swirl through cybermarkets and pirate holovids: The brilliant, beautiful Princess Isabella Esperanza de la Vega—a renowned AI scientist and actual royalty—has been kidnapped by unknown agents and is now imprisoned atop the enigmatic Altitude Spire. This mega-tower, rumoured to have been ‘repurposed’ by the mysterious Quantum Dragon (an advanced AI/biomech hybrid), is said to constantly rearrange its rooms, traps, and defenses, ensuring no two heist attempts are ever the same… and none have succeeded.

You are a mixed crew: space techs, blade-slingers, net-runners, and alien bruisers, united by credits, curiosity, and the whisper of Isabella’s charm (and her massive reward). Tonight, the spire unlocks, and the labyrinth calls.

**Goal:** Navigate the shifting Altitude Spire, outsmart/battle its monstrous defender, and rescue Princess Isabella!
  
---
`;

export default async function StorytellingPage({
  params,
}: StorytellingPageProps) {
  const { roomCode } = await params;
  const game = await gameStore.getGame(roomCode);

  return (
    <IntroductionView
      roomCode={roomCode}
      narratorVoiceId={game?.narratorVoiceId || ""}
      story={STORY}
    />
  );
}
