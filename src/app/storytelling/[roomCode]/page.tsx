import { redirect } from "next/navigation";
import { IntroductionView } from "@/components/storytelling/introduction-view";
import { gameStore } from "@/lib/game-store";

type StorytellingPageProps = {
  params: Promise<{
    roomCode: string;
  }>;
};

export default async function StorytellingPage({
  params,
}: StorytellingPageProps) {
  const { roomCode: rawRoomCode } = await params;
  const roomCode = rawRoomCode.toUpperCase();
  const game = await gameStore.getGame(roomCode);

  if (!game) {
    redirect("/");
  }

  return (
    <IntroductionView roomCode={roomCode} />
  );
}
