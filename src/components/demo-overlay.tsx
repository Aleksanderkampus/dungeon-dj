"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, Play, X } from "lucide-react";
import { cn } from "@/lib/utils";

type DemoOverlayProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  link?: {
    url: string;
    label: string;
  };
  video?: {
    url: string;
    thumbnail?: string;
  };
  showOnMount?: boolean;
  dismissible?: boolean;
};

export function DemoOverlay({
  open,
  onOpenChange,
  title = "DEMO VERSION",
  description = "This is a demonstration of Dungeon DJ. Experience AI-powered tabletop RPG adventures with voice narration and interactive gameplay.",
  link,
  video,
  dismissible = true,
}: DemoOverlayProps) {
  const [showVideo, setShowVideo] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={dismissible ? onOpenChange : undefined}>
      <DialogContent
        className={cn(
          "max-w-2xl border-2 bg-slate-900 text-white",
          "animate-in fade-in zoom-in-95 duration-200"
        )}
        onPointerDownOutside={(e) => {
          if (!dismissible) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (!dismissible) e.preventDefault();
        }}
      >
        {dismissible && (
          <button
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        )}

        <DialogHeader className="space-y-4 text-center">
          {/* Title */}
          <DialogTitle className="relative">
            <p
              className={cn(
                "text-3xl font-bold tracking-wide md:text-4xl",
                "bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent"
              )}
            >
              {title}
            </p>
          </DialogTitle>

          <DialogDescription className="mx-auto max-w-xl text-base text-slate-300">
            {description}
          </DialogDescription>
        </DialogHeader>

        {/* Video Section */}
        {video && (
          <div className="mt-4 space-y-3">
            {!showVideo ? (
              <div
                className="relative group cursor-pointer"
                onClick={() => setShowVideo(true)}
              >
                {video.thumbnail ? (
                  <img
                    src={video.thumbnail}
                    alt="Video thumbnail"
                    className="w-full rounded-lg border border-slate-700"
                  />
                ) : (
                  <div className="aspect-video w-full rounded-lg border border-slate-700 bg-slate-800 flex items-center justify-center">
                    <div className="text-center">
                      <Play className="h-12 w-12 mx-auto text-slate-400 mb-2" />
                      <p className="text-slate-300 font-medium">
                        Watch Demo Video
                      </p>
                    </div>
                  </div>
                )}
                {/* Play button overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="rounded-full bg-white/10 backdrop-blur-sm p-4 border border-white/30">
                    <Play className="h-8 w-8 text-white" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="aspect-video w-full rounded-lg overflow-hidden border border-slate-700">
                <iframe
                  src={video.url}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          {link && (
            <Button
              className="bg-purple-600 hover:bg-purple-700 text-white"
              onClick={() => window.open(link.url, "_blank")}
            >
              {link.label}
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          )}

          {dismissible && (
            <Button
              variant="outline"
              className="border-slate-700 bg-slate-800/50 text-white hover:bg-slate-700"
              onClick={() => onOpenChange(false)}
            >
              Continue to Demo
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook for easy usage with localStorage persistence
export function useDemoOverlay(storageKey = "demo-overlay-dismissed") {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const dismissed = localStorage.getItem(storageKey);
    if (!dismissed) {
      setOpen(true);
    }
  }, [storageKey]);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      localStorage.setItem(storageKey, "true");
    }
  };

  return { open, setOpen: handleOpenChange };
}
