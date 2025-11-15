"use client";

import * as React from "react";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import * as z from "zod";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";

const formSchema = z.object({
  roomCode: z
    .string()
    .length(6, "Room code must be 6 characters")
    .regex(/^[A-Z0-9]+$/, "Room code must contain only uppercase letters and numbers"),
  characterName: z
    .string()
    .min(2, "Character name must be at least 2 characters")
    .max(30, "Character name must be at most 30 characters"),
});

// API functions
async function verifyRoomCode(roomCode: string) {
  const response = await fetch(`/api/games/${roomCode}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Invalid room code");
  }

  return response.json();
}

async function joinGame(data: { roomCode: string; characterName: string }) {
  const response = await fetch("/api/games/join", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to join game");
  }

  return response.json();
}

export function JoinGameForm() {
  const router = useRouter();
  const [step, setStep] = React.useState<"roomCode" | "characterName">("roomCode");
  const [verifiedRoomCode, setVerifiedRoomCode] = React.useState<string>("");

  // Verify room code mutation
  const verifyMutation = useMutation({
    mutationFn: verifyRoomCode,
    onSuccess: () => {
      setStep("characterName");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Invalid room code. Please check and try again.");
    },
  });

  // Join game mutation
  const joinMutation = useMutation({
    mutationFn: joinGame,
    onSuccess: (data, variables) => {
      const { playerId } = data;

      // Store player ID in session storage
      sessionStorage.setItem("playerId", playerId);
      sessionStorage.setItem("roomCode", verifiedRoomCode);

      toast.success("Joined game successfully!");
      router.push(`/lobby/${verifiedRoomCode}`);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to join game. Please try again.");
    },
  });

  const form = useForm({
    defaultValues: {
      roomCode: "",
      characterName: "",
    },
    validators: {
      onChange: formSchema,
    },
    onSubmit: async ({ value }) => {
      if (step === "roomCode") {
        const upperRoomCode = value.roomCode.toUpperCase();
        setVerifiedRoomCode(upperRoomCode);
        verifyMutation.mutate(upperRoomCode);
      } else {
        joinMutation.mutate({
          roomCode: verifiedRoomCode,
          characterName: value.characterName,
        });
      }
    },
  });

  const handleBack = () => {
    setStep("roomCode");
  };

  const isLoading = verifyMutation.isPending || joinMutation.isPending;

  return (
    <Card className="w-full sm:max-w-md">
      <CardHeader>
        <CardTitle>
          {step === "roomCode" ? "Join Game" : "Create Your Character"}
        </CardTitle>
        <CardDescription>
          {step === "roomCode"
            ? "Enter the room code to join a game"
            : "Choose a name for your character"}
        </CardDescription>
      </CardHeader>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <CardContent>
          <FieldGroup>
            {step === "roomCode" && (
              <form.Field name="roomCode">
                {(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Room Code</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) =>
                          field.handleChange(e.target.value.toUpperCase())
                        }
                        placeholder="ABC123"
                        maxLength={6}
                        className="font-mono text-lg"
                        aria-invalid={isInvalid}
                      />
                      <FieldDescription>
                        Enter the 6-character room code from your game host
                      </FieldDescription>
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  );
                }}
              </form.Field>
            )}

            {step === "characterName" && (
              <form.Field name="characterName">
                {(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>
                        Character Name
                      </FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Enter your character's name"
                        maxLength={30}
                        aria-invalid={isInvalid}
                      />
                      <FieldDescription>
                        Choose a name for your character (2-30 characters)
                      </FieldDescription>
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  );
                }}
              </form.Field>
            )}
          </FieldGroup>
        </CardContent>
        <CardFooter className="flex justify-between">
          {step === "characterName" ? (
            <Button type="button" variant="outline" onClick={handleBack}>
              Back
            </Button>
          ) : (
            <div />
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading
              ? "Loading..."
              : step === "roomCode"
              ? "Continue"
              : "Join Game"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
