import { JoinGameForm } from "@/components/join-game/join-game-form";

type JoinGamePageProps = {
  searchParams: Promise<{
    roomCode?: string;
  }>;
};

export default async function JoinGamePage({ searchParams }: JoinGamePageProps) {
  const params = await searchParams;
  const initialRoomCode = params?.roomCode ?? "";

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black p-4">
      <JoinGameForm prefilledRoomCode={initialRoomCode} />
    </div>
  );
}
