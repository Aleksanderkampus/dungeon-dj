# Dungeon DJ - Junction 2025 Game Jam Submission

**Challenge:** Supercell AI Game Jam - Create a game that uses AI to shape how it's built, played, or experienced

---

## The Pitch

# Dungeon DJ

### A game that couldn't exist without AI

**The core idea:** What if the game master *is* the AI?

Dungeon DJ is a tabletop RPG where AI doesn't just assist the experience - it *is* the experience. Every world is generated on the fly. Every story beat adapts to player choices in real-time. Every session is narrated with voice that brings characters and scenarios to life. The AI doesn't follow a script; it improvises, reacts, and creates moments that surprise even us.

---

## Why This Couldn't Exist Without AI

**Traditional tabletop RPGs need a human game master** - someone who spends hours preparing worlds, memorizing rules, improvising dialogue, and adapting to player chaos. Finding one is hard. Being one is harder.

**Dungeon DJ flips this:** The AI *is* your game master.

- **Generative World Building**: Players define genre, tone, and story hooks. The AI generates a complete campaign world - locations, conflicts, NPCs, plot threads. Every world is unique.

- **Adaptive Storytelling**: The AI doesn't follow a branching narrative tree. It listens to player choices and improvises the next beat, like a human DM would. Want to befriend the dragon instead of fighting it? The AI adapts.

- **Real-Time Voice Narration**: Using ElevenLabs, the AI speaks as the narrator, bringing scenes and characters to life. It's not reading pre-written dialogue - it's generating and speaking the story as players create it.

- **Memory Across Sessions**: The AI remembers what happened, who your characters are, and the choices you made. Each session builds on the last, creating an evolving campaign.

**This is impossible without AI.** You can't pre-script infinite possibilities. You can't voice-act procedurally generated dialogue. You can't adapt to chaos without intelligence.

---

## How AI Shapes the Play Experience

### 1. **Every Playthrough is Unique**
No two games are the same. Different players, different choices, different worlds. The AI generates fresh content every time - not from a template, but from understanding narrative structure and player intent.

### 2. **Accessible to Everyone**
You don't need to know the rules. You don't need a DM friend. You don't need to coordinate schedules across time zones. The AI handles the complexity, so players can focus on creativity and storytelling.

### 3. **Players Shape the Story**
The AI isn't railroading you through a pre-written plot. It's responding to what *you* want to do. Try something unexpected, and the AI rolls with it. This creates emergent moments - the kind human DMs love, but automated systems struggle with.

### 4. **Multiplayer Chaos, Managed**
Multiple players can join, each with their own ideas and character goals. The AI weaves everyone's actions into a coherent narrative, balancing spotlight time and keeping the story moving.

---

## Technical Highlights

**Built with:**
- Next.js 16 with React Server Components
- TanStack Query for real-time game state synchronization
- ElevenLabs for professional voice synthesis
- Custom n8n workflow for AI story generation
- Zod-validated multi-step world creation form

**What makes it work:**
- Real-time polling (3-second intervals) for multiplayer state sync
- Optimistic updates for instant player feedback
- In-memory game state management for fast lookups
- Modular world generation pipeline (genre → story → narrator voice → session settings)
- API-first architecture for extensibility

**Playable demo:** Players can create worlds, join lobbies with room codes, and experience AI-generated campaign content with voice narration.

---

## Why It's Fun

Tabletop RPGs are magical when they work - collaborative storytelling where anything is possible. But they're fragile. They need the right people, the right time, the right preparation.

**Dungeon DJ removes the friction and keeps the magic.**

You get the spontaneity of improvised storytelling, the thrill of choices mattering, and the delight of hearing your adventure narrated - all without needing a human DM who spent their weekend prepping stat blocks.

The AI doesn't replace human creativity. It amplifies it. Players still drive the story. They still make choices, roleplay characters, and create memorable moments. The AI just makes sure there's always a world to explore and a voice to guide them.

---

## What Makes This Original

**Existing AI games:** Usually AI is a helper (NPC dialogue) or a gimmick (procedural levels). The core game still works without it.

**Dungeon DJ:** Remove the AI, and there's no game. The AI *is* the game master. It's not flavoring an existing experience - it's creating an entirely new one.

**This is a game that thinks.** It generates. It adapts. It remembers. It speaks. And every time you play, it creates something that's never existed before.

---

## The Vision

Right now, Dungeon DJ proves the concept: AI can be a game master. It can generate worlds, narrate stories, and adapt to players.

**Where this goes next:**
- Deeper character memory (the AI remembers your rogue's fear of spiders)
- Dynamic combat systems (tactical encounters that adapt to player strategy)
- Visual generation (AI-generated maps and character portraits)
- Longer campaigns (persistent worlds that evolve over months)
- Community sharing (players export their best campaigns for others to experience)

But at its core, Dungeon DJ will always be about one thing: **making collaborative storytelling accessible to everyone through AI that understands narrative, adapts to chaos, and brings imagination to life.**

---

**Built by:** [Your Team Name]
**For:** Junction 2025 - Supercell AI Game Jam
**Try it:** [Demo URL if available]
