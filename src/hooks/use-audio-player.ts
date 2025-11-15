import * as React from "react";

type AudioPlayerOptions = {
  onEnded?: () => void;
  onError?: (error: Error) => void;
};

export function useAudioPlayer({ onEnded, onError }: AudioPlayerOptions = {}) {
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isMuted, setIsMuted] = React.useState(false);
  const [duration, setDuration] = React.useState<number>(0);

  // Store callbacks in refs to avoid recreating audio element
  const onEndedRef = React.useRef(onEnded);
  const onErrorRef = React.useRef(onError);

  // Update refs when callbacks change
  React.useEffect(() => {
    onEndedRef.current = onEnded;
    onErrorRef.current = onError;
  }, [onEnded, onError]);

  // Initialize audio element (only once)
  React.useEffect(() => {
    const audio = new Audio();

    audio.addEventListener("loadedmetadata", () => {
      setDuration(audio.duration);
    });

    audio.addEventListener("ended", () => {
      setIsPlaying(false);
      onEndedRef.current?.();
    });

    audio.addEventListener("error", (e) => {
      const target = e.target as HTMLAudioElement;
      const error = target?.error;
      console.error("Audio playback error:", error);

      setIsPlaying(false);
      setIsLoading(false);

      const errorMessage = error
        ? `Audio error (${error.code}): ${error.message}`
        : "Audio playback failed";
      onErrorRef.current?.(new Error(errorMessage));
    });

    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, []); // No dependencies - only run once

  // Handle mute state
  React.useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const play = async (audioSource: string | Blob) => {
    if (!audioRef.current) return;

    try {
      setIsLoading(true);

      // Handle both URL strings and Blob objects
      if (typeof audioSource === "string") {
        audioRef.current.src = audioSource;
      } else {
        // Create object URL from blob
        const objectUrl = URL.createObjectURL(audioSource);
        audioRef.current.src = objectUrl;

        // Clean up object URL when audio ends
        audioRef.current.addEventListener(
          "ended",
          () => {
            URL.revokeObjectURL(objectUrl);
          },
          { once: true }
        );
      }

      await audioRef.current.play();
      setIsPlaying(true);
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      setIsPlaying(false);
      onError?.(error as Error);
    }
  };

  const pause = () => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    setIsPlaying(false);
  };

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  return {
    play,
    pause,
    toggleMute,
    isLoading,
    isPlaying,
    isMuted,
    duration,
  };
}
