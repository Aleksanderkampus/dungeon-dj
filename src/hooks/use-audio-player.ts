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

  // Initialize audio element
  React.useEffect(() => {
    const audio = new Audio();

    audio.addEventListener("ended", () => {
      setIsPlaying(false);
      onEnded?.();
    });

    audio.addEventListener("error", (e) => {
      setIsPlaying(false);
      setIsLoading(false);
      onError?.(new Error("Audio playback failed"));
    });

    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, [onEnded, onError]);

  // Handle mute state
  React.useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const play = async (audioUrl: string) => {
    if (!audioRef.current) return;

    try {
      setIsLoading(true);
      audioRef.current.src = audioUrl;
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
    setIsMuted(prev => !prev);
  };

  return {
    play,
    pause,
    toggleMute,
    isLoading,
    isPlaying,
    isMuted,
  };
}
