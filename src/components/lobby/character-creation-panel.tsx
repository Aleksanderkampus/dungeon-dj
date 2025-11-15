"use client";

import { Player } from "@/types/game";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";

type CharacterCreationPanelProps = {
  player: Player;
};

export function CharacterCreationPanel({ player }: CharacterCreationPanelProps) {
  const status = player.characterGenerationStatus ?? "idle";
  const sheet = player.characterSheet;

  if (!sheet) {
    return (
      <Card>
        <CardHeader className="space-y-2">
          <CardTitle>Character is being generated</CardTitle>
          <CardDescription>
            Sit tight while the AI builds your hero based on the background you
            provided.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <div>
            <p className="font-medium">Status: {status}</p>
            {player.characterGenerationError && (
              <p className="text-sm text-destructive mt-1">
                {player.characterGenerationError}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{sheet.name}</CardTitle>
        <CardDescription>
          {sheet.ancestry} {sheet.characterClass} • Level {sheet.level}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <section>
          <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Background
          </p>
          <p className="text-sm leading-relaxed">{sheet.backgroundSummary}</p>
        </section>

        <section className="grid gap-2 sm:grid-cols-2">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Alignment
            </p>
            <p>{sheet.alignment}</p>
          </div>
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Hit Points
            </p>
            <p>{sheet.hitPoints}</p>
          </div>
        </section>

        <section className="grid gap-2 sm:grid-cols-3">
          {Object.entries(sheet.abilityScores).map(([key, value]) => (
            <div key={key} className="rounded-md border p-2 text-center">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {key}
              </p>
              <p className="text-xl font-semibold">{value}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Skills
            </p>
            <ul className="text-sm space-y-1">
              {sheet.skills.map((skill) => (
                <li key={skill}>• {skill}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Equipment
            </p>
            <ul className="text-sm space-y-1">
              {sheet.equipment.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>
        </section>
      </CardContent>
    </Card>
  );
}
