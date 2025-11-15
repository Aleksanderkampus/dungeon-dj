import { redirect } from "next/navigation";
import { gameStore } from "@/lib/game-store";
import { LobbyView } from "@/components/lobby/lobby-view";

type LobbyPageProps = {
  params: {
    roomCode: string;
  };
};

export default function LobbyPage({ params }: LobbyPageProps) {
  const roomCode = params.roomCode.toUpperCase();
  const game = gameStore.getGame(roomCode);

  if (!game) {
    redirect("/");
  }

  // In a real app, get playerId from authenticated session
  // For now, we'll handle it client-side via sessionStorage
  return <LobbyView initialGame={game} playerId={null} />;
}
