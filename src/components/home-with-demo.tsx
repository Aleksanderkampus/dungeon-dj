"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DemoOverlay, useDemoOverlay } from "@/components/demo-overlay";

export function HomeWithDemo() {
  const { open, setOpen } = useDemoOverlay("dungeon-dj-demo-v2"); // Changed key to force re-show

  return (
    <>
      <DemoOverlay
        open={open}
        onOpenChange={setOpen}
        title="DUNGEON DJ DEMO"
        description="Welcome to Dungeon DJ - an AI-powered tabletop RPG experience with voice narration, dynamic grid maps, and interactive gameplay. Create epic adventures with your friends!"
        link={{
          url: "https://www.youtube.com/embed/mHBjM2CeEgo", // Replace with your actual demo link
          label: "Check out our video demo",
        }}
        video={{
          url: "https://www.youtube.com/embed/mHBjM2CeEgo", // Replace with your actual video
          // thumbnail: "/demo-thumbnail.jpg", // Optional: Add your thumbnail
        }}
        dismissible={true}
      />

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

            {/* Show demo button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOpen(true)}
              className="mt-2 text-xs text-muted-foreground"
            >
              View Demo Info
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
