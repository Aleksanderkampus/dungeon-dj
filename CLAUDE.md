# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Dungeon DJ is a Next.js application for creating AI-facilitated tabletop RPG adventures. The main feature is a multi-step world generation form that collects campaign details including genre, story background, facilitator persona, and session settings. The application uses ElevenLabs for voice narration.

## Development Commands

```bash
# Start development server (http://localhost:3000)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## Tech Stack & Architecture

### Core Framework
- **Next.js 16** with App Router (not Pages Router)
- **React 19** (React Server Components enabled by default)
- **TypeScript** with strict mode enabled

### Styling & UI
- **Tailwind CSS v4** (new CSS-first configuration in `globals.css`, not JS config)
- **shadcn/ui** components (New York style, installed via components.json)
- **Radix UI** primitives for accessible components
- **Geist & Geist Mono** fonts from Vercel
- Dark mode is enabled by default via `className="dark"` on html element in `layout.tsx`

### Form Handling
- **TanStack Form** (`@tanstack/react-form`) for form state management
- **Zod** for schema validation (integrated with TanStack Form validators)
- **Sonner** for toast notifications

### Path Aliases
- `@/*` maps to `./src/*` (configured in tsconfig.json)
- All imports use the `@/` prefix for src files

## Code Conventions

### Component Patterns

**shadcn/ui Components** (in `src/components/ui/`):
- Follow shadcn/ui conventions with "use client" directive when needed
- Use `cn()` utility from `@/lib/utils` for conditional class merging
- Leverage Radix UI primitives with Tailwind styling
- Components use data attributes for styling variants (e.g., `data-invalid`, `data-slot`)

**Form Components**:
- Use TanStack Form's `useForm` hook for form state
- Define Zod schemas for validation at the component level
- Integrate validators via `validators: { onChange: schema, onSubmit: schema }`
- Access field state via `field.state.meta` for validation errors
- Multi-step forms track current step in local state

**UI Architecture**:
- Field components use a slot-based system with data attributes (`data-slot="field"`, `data-slot="field-label"`, etc.)
- Form validation displays inline with `FieldError` component
- Character counters shown in `FieldDescription` for text inputs

### File Organization

```
src/
├── app/                        # Next.js App Router
│   ├── layout.tsx             # Root layout with fonts & Toaster
│   ├── page.tsx               # Home page
│   └── globals.css            # Tailwind CSS v4 configuration
├── components/
│   ├── ui/                    # shadcn/ui components
│   └── create-agent-form/     # Feature-specific form components
└── lib/
    └── utils.ts               # Shared utilities (cn function)
```

### Styling with Tailwind v4

- CSS variables defined in `globals.css` using `@theme inline` directive
- Dark mode uses `.dark` class with custom variant: `@custom-variant dark (&:is(.dark *))`
- Color tokens use OKLCH format for better color perception
- Design tokens: `--radius`, `--color-*`, `--font-*`
- Animation utilities from `tw-animate-css` package

## Key Implementation Details

### World Generation Form
Located in `src/components/create-agent-form/world-generation-form.tsx`:
- 7-step multi-step form for RPG world creation
- Each step validates before allowing progression to next step
- Field validation triggered via `form.validateField(fieldName, "change")`
- Steps map to specific Zod schema fields via `stepFieldMap`
- ElevenLabs voice options hardcoded in facilitator voice step
- Final submission shows success toast (backend integration pending)

### Type Safety
- Strict TypeScript mode enabled
- All form values typed via Zod schema inference
- Component props use React.ComponentProps for proper typing
- Variant props via `class-variance-authority` VariantProps utility

### Multiplayer Game System

**Game Flow:**
1. **Create Game** (`/create-game`): Host fills WorldGenerationForm → React Query mutation calls API → API creates game → calls n8n for story generation → redirects to lobby
2. **Join Game** (`/join-game`): Player enters room code (verified via React Query mutation) → enters character name → React Query mutation joins lobby
3. **Lobby** (`/lobby/[roomCode]`): Real-time view with React Query polling for state synchronization, showing room code, players, ready status, and story generation progress

**Real-time Updates:**
- React Query polling with `refetchInterval: 3000` (every 3 seconds)
- `refetchIntervalInBackground: true` for continuous updates
- No WebSocket server required - works with serverless deployments
- 3-second latency is acceptable for lobby interactions

**State Management:**
- **Server State:** TanStack React Query v5
  - Query key pattern: `["game", roomCode]`
  - Polling every 3 seconds for real-time synchronization
  - Optimistic updates for player ready status (instant UI feedback)
  - Automatic cache invalidation after mutations
- **Database:** In-memory game store (`src/lib/game-store.ts`) using Map
  - Game state includes: roomCode, players, status, worldData, generatedStory
  - Player state includes: id, characterName, isReady, isHost

**API Endpoints:**
- `POST /api/games/create`: Create new game, trigger n8n story generation
- `GET /api/games/[roomCode]`: Fetch game state (polled by React Query every 3s)
- `POST /api/games/join`: Join existing game with character name
- `POST /api/games/ready`: Toggle player ready status (optimistic updates via React Query)
- `POST /api/games/story-callback`: Webhook for n8n to send generated story

**React Query Patterns:**
- **Mutations:** `useMutation` for create game, join game, toggle ready status
- **Queries:** `useQuery` with polling for real-time lobby state
- **Optimistic Updates:** Ready status updates immediately before server confirmation
- **Polling Strategy:** Aggressive 3-second polling for lobby synchronization
- **Error Handling:** Automatic rollback on mutation failure

**n8n Integration:**
- Environment variable: `N8N_WEBHOOK_URL`
- Sends: worldData + roomCode + callbackUrl
- Expects callback: `{ roomCode, story, status: "success" }`
- Game status: `generating` → `ready` when story arrives
