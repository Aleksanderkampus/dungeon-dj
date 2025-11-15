import { IntroductionView } from "@/components/storytelling/introduction-view";

type StorytellingPageProps = {
  params: Promise<{
    roomCode: string;
  }>;
};

export default async function StorytellingPage({ params }: StorytellingPageProps) {
  const { roomCode } = await params;

  return <IntroductionView roomCode={roomCode} />;
}
