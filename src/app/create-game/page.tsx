import { WorldGenerationForm } from "@/components/create-agent-form/world-generation-form";

export default function CreateGamePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black p-4">
      <WorldGenerationForm />
    </div>
  );
}
