# Demo Overlay Component Documentation

A flashy, eye-catching overlay component built with shadcn/ui to showcase your demo/beta application with big bold letters, optional video, and links.

## Features

✨ **Flashy Design**
- Gradient animated title (yellow → pink → purple)
- Pulsating glow effects
- Decorative background sparkles
- Smooth animations

📹 **Video Support**
- Embed YouTube/Vimeo videos
- Custom thumbnail support
- Click-to-play functionality
- Full-screen video player

🔗 **Link Integration**
- Custom call-to-action buttons
- External link support
- GitHub, docs, or any URL

💾 **Smart Persistence**
- localStorage integration via `useDemoOverlay` hook
- Only shows once per user (dismissible)
- Optional force-show button

## Installation

The component uses shadcn/ui's Dialog component:

```bash
npx shadcn@latest add dialog
```

## Basic Usage

### Simple Demo Overlay

```tsx
"use client";

import { DemoOverlay, useDemoOverlay } from "@/components/demo-overlay";

export function MyPage() {
  const { open, setOpen } = useDemoOverlay();

  return (
    <>
      <DemoOverlay
        open={open}
        onOpenChange={setOpen}
        title="DEMO VERSION"
        description="This is a demo of our amazing app!"
      />

      {/* Your page content */}
    </>
  );
}
```

### With Link

```tsx
<DemoOverlay
  open={open}
  onOpenChange={setOpen}
  title="BETA ACCESS"
  description="You're using an early beta version. We'd love your feedback!"
  link={{
    url: "https://github.com/yourusername/yourapp",
    label: "View on GitHub"
  }}
/>
```

### With Video

```tsx
<DemoOverlay
  open={open}
  onOpenChange={setOpen}
  title="PRODUCT DEMO"
  description="Watch how our app works in under 2 minutes."
  video={{
    url: "https://www.youtube.com/embed/YOUR_VIDEO_ID",
    thumbnail: "/path/to/thumbnail.jpg" // Optional
  }}
/>
```

### Complete Example

```tsx
<DemoOverlay
  open={open}
  onOpenChange={setOpen}
  title="DUNGEON DJ"
  description="Welcome to Dungeon DJ - an AI-powered tabletop RPG experience!"
  link={{
    url: "https://github.com/yourusername/dungeon-dj",
    label: "Star on GitHub ⭐"
  }}
  video={{
    url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    thumbnail: "/demo-thumbnail.jpg"
  }}
  dismissible={true}
/>
```

## Props API

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `open` | `boolean` | required | Controls overlay visibility |
| `onOpenChange` | `(open: boolean) => void` | required | Callback when overlay opens/closes |
| `title` | `string` | `"DEMO VERSION"` | Big flashy title text |
| `description` | `string` | Default description | Subtitle/description text |
| `link` | `{ url: string, label: string }` | `undefined` | Optional CTA link button |
| `video` | `{ url: string, thumbnail?: string }` | `undefined` | Optional embedded video |
| `dismissible` | `boolean` | `true` | Whether user can close overlay |

## Hook API: `useDemoOverlay`

```tsx
const { open, setOpen } = useDemoOverlay(storageKey?: string);
```

### Parameters
- `storageKey` (optional): localStorage key for persistence. Default: `"demo-overlay-dismissed"`

### Returns
- `open`: boolean - Current overlay state
- `setOpen`: function - Function to show/hide overlay and persist state

### Behavior
- On mount, checks if user has dismissed overlay (via localStorage)
- If not dismissed, automatically shows overlay
- When user closes overlay, saves dismissal to localStorage
- Won't show again unless localStorage is cleared or different key is used

## Advanced Usage

### Non-Dismissible Overlay (Force Modal)

```tsx
<DemoOverlay
  open={true}
  onOpenChange={() => {}} // No-op
  title="MAINTENANCE MODE"
  description="System is under maintenance. Please check back later."
  dismissible={false}
  link={{
    url: "https://status.yourapp.com",
    label: "View Status Page"
  }}
/>
```

### Custom Storage Key (Multiple Overlays)

```tsx
// First overlay - shows on home page
const home = useDemoOverlay("home-demo-dismissed");

// Second overlay - shows on dashboard
const dashboard = useDemoOverlay("dashboard-tour-dismissed");
```

### Manual Control (No Persistence)

```tsx
const [open, setOpen] = useState(false);

// Show overlay on button click
<Button onClick={() => setOpen(true)}>View Demo</Button>

<DemoOverlay
  open={open}
  onOpenChange={setOpen}
  // ... props
/>
```

### Re-trigger for Returning Users

```tsx
// Add a "View Demo Again" button
<Button
  onClick={() => {
    localStorage.removeItem("demo-overlay-dismissed");
    setOpen(true);
  }}
>
  Watch Demo Again
</Button>
```

## Video Embedding

### YouTube

```tsx
video={{
  url: "https://www.youtube.com/embed/YOUR_VIDEO_ID",
  // Or with autoplay and controls
  url: "https://www.youtube.com/embed/YOUR_VIDEO_ID?autoplay=1&controls=1"
}}
```

### Vimeo

```tsx
video={{
  url: "https://player.vimeo.com/video/YOUR_VIDEO_ID"
}}
```

### Loom

```tsx
video={{
  url: "https://www.loom.com/embed/YOUR_VIDEO_ID"
}}
```

### Custom Video Player

```tsx
video={{
  url: "https://yourcdn.com/video.mp4",
  thumbnail: "https://yourcdn.com/thumbnail.jpg"
}}
```

## Styling Customization

The component uses Tailwind CSS and can be customized by modifying the source:

```tsx
// Change title gradient colors
className="bg-gradient-to-r from-blue-400 via-cyan-500 to-teal-500"

// Change background gradient
className="from-slate-900 via-blue-900 to-slate-900"

// Adjust title size
className="text-4xl md:text-6xl" // Smaller
className="text-8xl md:text-9xl" // Larger
```

## Examples in the Wild

### Marketing Landing Page

```tsx
export default function LandingPage() {
  const { open, setOpen } = useDemoOverlay("landing-demo");

  return (
    <>
      <DemoOverlay
        open={open}
        onOpenChange={setOpen}
        title="🎉 EARLY ACCESS"
        description="You're one of the first to try our new platform!"
        link={{
          url: "https://discord.gg/yourserver",
          label: "Join Discord Community"
        }}
      />
      <Hero />
      <Features />
    </>
  );
}
```

### Beta Testing App

```tsx
export default function AppLayout({ children }) {
  const { open, setOpen } = useDemoOverlay("beta-warning");

  return (
    <>
      <DemoOverlay
        open={open}
        onOpenChange={setOpen}
        title="⚠️ BETA VERSION"
        description="This is a beta version. Some features may not work as expected. Please report bugs on GitHub."
        link={{
          url: "https://github.com/yourrepo/issues",
          label: "Report an Issue"
        }}
        video={{
          url: "https://www.youtube.com/embed/tutorial-video-id"
        }}
      />
      {children}
    </>
  );
}
```

### Product Demo

```tsx
export default function DemoPage() {
  const [showDemo, setShowDemo] = useState(true);

  return (
    <>
      <DemoOverlay
        open={showDemo}
        onOpenChange={setShowDemo}
        title="PRODUCT TOUR"
        description="Learn how to use all the amazing features in 3 minutes!"
        video={{
          url: "https://www.loom.com/embed/your-product-tour",
          thumbnail: "/tour-thumbnail.jpg"
        }}
        link={{
          url: "/docs",
          label: "Read Full Documentation"
        }}
      />
      <ProductInterface />
    </>
  );
}
```

## Accessibility

- ✅ Keyboard navigation (Escape to close)
- ✅ Focus management
- ✅ Screen reader support via DialogTitle and DialogDescription
- ✅ ARIA attributes from Radix UI Dialog

## Browser Support

Works in all modern browsers that support:
- CSS Grid
- CSS Gradients
- Flexbox
- ES6+

## Performance

- Lazy loads video iframe only when "play" is clicked
- Uses CSS animations (GPU accelerated)
- No JavaScript animations for smooth performance
- localStorage for persistence (no server calls)

## Troubleshooting

### Overlay doesn't show on mount

Make sure you're using the `useDemoOverlay` hook and localStorage is enabled:

```tsx
const { open, setOpen } = useDemoOverlay();
```

### Video doesn't load

- Check the video URL is correct
- Ensure the video allows embedding (YouTube: "Allow embedding" setting)
- Check CORS if using custom video hosting

### Overlay shows every time

localStorage might be disabled. Check if:
```tsx
localStorage.setItem("test", "test"); // Should not throw
```

### Clear stored dismissal

```tsx
localStorage.removeItem("demo-overlay-dismissed");
// Or clear all
localStorage.clear();
```

## License

Part of Dungeon DJ - MIT License
