import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <Card className="w-full sm:max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">Dungeon DJ</CardTitle>
          <CardDescription>
            Create AI-facilitated tabletop RPG adventures
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Link href="/create-game">
            <Button className="w-full" size="lg">
              Create Game
            </Button>
          </Link>
          <Link href="/join-game">
            <Button className="w-full" size="lg" variant="outline">
              Join Game
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
