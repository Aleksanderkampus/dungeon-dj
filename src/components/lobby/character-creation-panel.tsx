"use client";

import * as React from "react";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { CharacterSheet, Player } from "@/types/game";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCcw } from "lucide-react";

const formSchema = z.object({
  background: z
    .string()
    .min(50, "Character background must be at least 50 characters")
    .max(1500, "Character background must be less than 1500 characters"),
});

async function requestCharacterSheet(payload: {
  roomCode: string;
  playerId: string;
  background: string;
}): Promise<CharacterSheet> {
  const response = await fetch("/api/characters/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error || "Failed to generate character sheet");
  }

  return data.characterSheet as CharacterSheet;
}

type CharacterCreationPanelProps = {
  player: Player;
  roomCode: string;
};

export function CharacterCreationPanel({
  player,
  roomCode,
}: CharacterCreationPanelProps) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: requestCharacterSheet,
    onSuccess: () => {
      toast.success("Character sheet generated!");
      queryClient.invalidateQueries({ queryKey: ["game", roomCode] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
  const backgroundValue = player.characterBackground ?? "";
  const form = useForm({
    defaultValues: {
      background: backgroundValue,
    },
    validators: {
      onChange: formSchema,
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      mutation.mutate({
        roomCode,
        playerId: player.id,
        background: value.background,
      });
    },
  });

  React.useEffect(() => {
    if (player.characterBackground === undefined) {
      return;
    }

    const currentValue = form.getFieldValue("background");
    if (currentValue === player.characterBackground) {
      return;
    }

    form.setFieldValue("background", player.characterBackground);
  }, [player.characterBackground, form]);

  const status = player.characterGenerationStatus ?? "idle";
  const isGenerating = mutation.isPending || status === "generating";
  const formId = `character-creation-${player.id}`;

  return (
    <div className="space-y-4">
      <Card>
        <form
          id={formId}
          onSubmit={(event) => {
            event.preventDefault();
            form.handleSubmit();
          }}
        >
          <CardHeader>
            <CardTitle>Describe Your Character</CardTitle>
            <CardDescription>
              Share your hero&apos;s background and we&apos;ll craft a full
              character sheet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <form.Field name="background">
                {(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>
                        Character Background
                      </FieldLabel>
                      <Textarea
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(event) =>
                          field.handleChange(event.target.value)
                        }
                        placeholder="Describe their origin, personality, and goals..."
                        rows={6}
                        maxLength={1500}
                        disabled={isGenerating}
                        aria-invalid={isInvalid}
                      />
                      <FieldDescription>
                        At least 50 characters. Currently{" "}
                        {field.state.value.length} / 1500.
                      </FieldDescription>
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  );
                }}
              </form.Field>
              {player.characterGenerationError && (
                <p className="text-sm text-destructive">
                  {player.characterGenerationError}
                </p>
              )}
            </FieldGroup>
          </CardContent>
          <CardFooter className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">
              Status:{" "}
              {status === "ready"
                ? "Ready"
                : status === "generating"
                  ? "Generating character sheet..."
                  : status === "error"
                    ? "Needs attention"
                    : "Waiting for submission"}
            </div>
            <Button
              type="submit"
              className="w-full sm:w-auto"
              disabled={isGenerating}
            >
              {status === "ready" ? "Regenerate" : "Generate Character"}
              {isGenerating ? (
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              ) : (
                status === "ready" && <RefreshCcw className="ml-2 h-4 w-4" />
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {player.characterSheet && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Character Sheet</CardTitle>
            <CardDescription>
              Copy this JSON into your tools or share with the host.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="max-h-[400px] overflow-auto rounded-md bg-muted p-4 text-sm">
              {JSON.stringify(player.characterSheet, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
