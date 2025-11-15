"use client";

import * as React from "react";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import * as z from "zod";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
  genre: z.string().min(1, "Please select a genre"),
  teamBackground: z
    .string()
    .min(20, "Team background must be at least 20 characters")
    .max(500, "Team background must be at most 500 characters"),
  storyGoal: z
    .string()
    .min(20, "Story goal must be at least 20 characters")
    .max(500, "Story goal must be at most 500 characters"),
  storyDescription: z
    .string()
    .min(10, "Story description must be at least 10 characters")
    .max(1000, "Story description must be at most 1000 characters"),
  facilitatorPersona: z
    .string()
    .min(10, "Facilitator persona must be at least 10 characters")
    .max(500, "Facilitator persona must be at most 500 characters"),
  facilitatorVoice: z.string().min(1, "Please select a voice"),
  actionsPerSession: z.string().min(1, "Please select actions per session"),
});

const STEPS = [
  { id: 1, title: "Genre", description: "Select the genre of your adventure" },
  {
    id: 2,
    title: "Team Background",
    description: "Describe your team's story",
  },
  { id: 3, title: "Story Goal", description: "What is the main objective?" },
  {
    id: 4,
    title: "Story Details",
    description: "Provide additional story context",
  },
  {
    id: 5,
    title: "Facilitator Persona",
    description: "Define the facilitator's character",
  },
  { id: 6, title: "Facilitator Voice", description: "Choose the voice style" },
  {
    id: 7,
    title: "Session Settings",
    description: "Configure gameplay parameters",
  },
];

async function createGame(worldData: unknown) {
  const response = await fetch("/api/games/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ worldData }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create game");
  }

  return response.json();
}

export function WorldGenerationForm() {
  const [currentStep, setCurrentStep] = React.useState(1);
  const router = useRouter();

  // Add create game mutation
  const createGameMutation = useMutation({
    mutationFn: createGame,
    onSuccess: (data) => {
      const { roomCode, hostId } = data;

      // Store host ID
      sessionStorage.setItem("playerId", hostId);
      sessionStorage.setItem("roomCode", roomCode);

      toast.success("Game created successfully!");
      router.push(`/lobby/${roomCode}`);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create game. Please try again.");
      console.error(error);
    },
  });

  // Map steps to field names
  const stepFieldMap: Record<number, keyof typeof formSchema.shape> = {
    1: "genre",
    2: "teamBackground",
    3: "storyGoal",
    4: "storyDescription",
    5: "facilitatorPersona",
    6: "facilitatorVoice",
    7: "actionsPerSession",
  };

  const form = useForm({
    defaultValues: {
      genre: "",
      teamBackground: "",
      storyGoal: "",
      storyDescription: "",
      facilitatorPersona: "",
      facilitatorVoice: "",
      actionsPerSession: "",
    },
    validators: {
      onChange: formSchema,
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      createGameMutation.mutate(value);
    },
  });

  const handleNext = async () => {
    const currentFieldName = stepFieldMap[currentStep];

    // Validate the current field by touching it and checking validity
    await form.validateField(currentFieldName, "change");

    const fieldMeta = form.getFieldMeta(currentFieldName);

    if (!fieldMeta?.errors?.length) {
      // If no errors, move to next step
      if (currentStep < STEPS.length) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentStepData = STEPS.find((step) => step.id === currentStep);

  return (
    <Card className="w-full sm:max-w-2xl">
      <CardHeader>
        <CardTitle>{currentStepData?.title}</CardTitle>
        <CardDescription>
          {currentStepData?.description} (Step {currentStep} of {STEPS.length})
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          id="world-generation-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (currentStep === STEPS.length) {
              form.handleSubmit();
            }
          }}
        >
          <FieldGroup>
            {/* Step 1: Genre */}
            {currentStep === 1 && (
              <form.Field name="genre">
                {(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Genre</FieldLabel>
                      <Select
                        value={field.state.value}
                        onValueChange={field.handleChange}
                      >
                        <SelectTrigger id={field.name} aria-invalid={isInvalid}>
                          <SelectValue placeholder="Select a genre..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sci-fi">Sci-Fi</SelectItem>
                          <SelectItem value="medieval">Medieval</SelectItem>
                          <SelectItem value="fantasy">Fantasy</SelectItem>
                          <SelectItem value="modern">Modern</SelectItem>
                          <SelectItem value="post-apocalyptic">
                            Post-Apocalyptic
                          </SelectItem>
                          <SelectItem value="cyberpunk">Cyberpunk</SelectItem>
                          <SelectItem value="steampunk">Steampunk</SelectItem>
                          <SelectItem value="horror">Horror</SelectItem>
                        </SelectContent>
                      </Select>
                      <FieldDescription>
                        Choose the setting and theme for your adventure
                      </FieldDescription>
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  );
                }}
              </form.Field>
            )}

            {/* Step 2: Team Background */}
            {currentStep === 2 && (
              <form.Field name="teamBackground">
                {(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>
                        Team Background/Story
                      </FieldLabel>
                      <Textarea
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="It is a team of variety of characters..."
                        rows={8}
                        className="min-h-32 resize-none"
                        aria-invalid={isInvalid}
                      />
                      <FieldDescription>
                        Describe the composition and background of your
                        adventuring team ({field.state.value.length}/500
                        characters)
                      </FieldDescription>
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  );
                }}
              </form.Field>
            )}

            {/* Step 3: Story Goal */}
            {currentStep === 3 && (
              <form.Field name="storyGoal">
                {(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>
                        Goal of the Story
                      </FieldLabel>
                      <Textarea
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="There is a gorgeous Latina princess stuck in a tower that is protected by a dragon..."
                        rows={8}
                        className="min-h-32 resize-none"
                        aria-invalid={isInvalid}
                      />
                      <FieldDescription>
                        What is the main objective or quest your team must
                        accomplish? ({field.state.value.length}/500 characters)
                      </FieldDescription>
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  );
                }}
              </form.Field>
            )}

            {/* Step 4: Story Description */}
            {currentStep === 4 && (
              <form.Field name="storyDescription">
                {(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>
                        Small Story Description/Idea
                      </FieldLabel>
                      <Textarea
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Add any additional story details, plot points, or ideas..."
                        rows={10}
                        className="min-h-40 resize-none"
                        aria-invalid={isInvalid}
                      />
                      <FieldDescription>
                        Provide additional context, plot elements, or creative
                        ideas for your story ({field.state.value.length}/1000
                        characters)
                      </FieldDescription>
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  );
                }}
              </form.Field>
            )}

            {/* Step 5: Facilitator Persona */}
            {currentStep === 5 && (
              <form.Field name="facilitatorPersona">
                {(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>
                        Facilitator&apos;s Persona
                      </FieldLabel>
                      <Textarea
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="The facilitator should be a Napoleon..."
                        rows={8}
                        className="min-h-32 resize-none"
                        aria-invalid={isInvalid}
                      />
                      <FieldDescription>
                        Describe the personality, mannerisms, and character of
                        your game facilitator ({field.state.value.length}/500
                        characters)
                      </FieldDescription>
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  );
                }}
              </form.Field>
            )}

            {/* Step 6: Facilitator Voice */}
            {currentStep === 6 && (
              <form.Field name="facilitatorVoice">
                {(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>
                        Voice of the Facilitator
                      </FieldLabel>
                      <Select
                        value={field.state.value}
                        onValueChange={field.handleChange}
                      >
                        <SelectTrigger id={field.name} aria-invalid={isInvalid}>
                          <SelectValue placeholder="Select a voice..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="adam">
                            Adam - Deep & Authoritative
                          </SelectItem>
                          <SelectItem value="bella">
                            Bella - Warm & Friendly
                          </SelectItem>
                          <SelectItem value="charlie">
                            Charlie - British & Sophisticated
                          </SelectItem>
                          <SelectItem value="daniel">
                            Daniel - Professional & Clear
                          </SelectItem>
                          <SelectItem value="emily">
                            Emily - Energetic & Youthful
                          </SelectItem>
                          <SelectItem value="george">
                            George - Mature & Wise
                          </SelectItem>
                          <SelectItem value="jessica">
                            Jessica - Confident & Dynamic
                          </SelectItem>
                          <SelectItem value="thomas">
                            Thomas - Calm & Narrative
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FieldDescription>
                        Choose the ElevenLabs voice that will narrate your
                        adventure
                      </FieldDescription>
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  );
                }}
              </form.Field>
            )}

            {/* Step 7: Actions Per Session */}
            {currentStep === 7 && (
              <form.Field name="actionsPerSession">
                {(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>
                        How Many Actions Per Session
                      </FieldLabel>
                      <Select
                        value={field.state.value}
                        onValueChange={field.handleChange}
                      >
                        <SelectTrigger id={field.name} aria-invalid={isInvalid}>
                          <SelectValue placeholder="Select action count..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low (1-2 actions)</SelectItem>
                          <SelectItem value="medium">
                            Medium (3-4 actions)
                          </SelectItem>
                          <SelectItem value="high">
                            High (5-7 actions)
                          </SelectItem>
                          <SelectItem value="very-high">
                            Very High (8+ actions)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FieldDescription>
                        Choose how many actions players can take per gaming
                        session
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
        </form>
      </CardContent>
      <CardFooter>
        <Field orientation="horizontal" className="w-full">
          <div className="flex w-full justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
            >
              Previous
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => form.reset()}
              >
                Reset
              </Button>
              {currentStep === STEPS.length ? (
                <Button
                  type="submit"
                  form="world-generation-form"
                  disabled={createGameMutation.isPending}
                >
                  {createGameMutation.isPending ? "Creating..." : "Submit"}
                </Button>
              ) : (
                <Button type="button" onClick={handleNext}>
                  Next
                </Button>
              )}
            </div>
          </div>
        </Field>
      </CardFooter>
    </Card>
  );
}
