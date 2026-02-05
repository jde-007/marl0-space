---
title: "Story Stuff"
icon: "📖"
tagline: "Non-linear storytelling — capture oral stories, structure them with AI, navigate and remix."
status: "Early development"
liveUrl: "https://stostu.marl0.space"
devOnly: true
tags: ["Next.js", "Whisper", "Ollama", "PostgreSQL", "Expo"]
order: 2
---

## What is Story Stuff?

Story Stuff is a platform for **non-linear storytelling**. Think of it as the tool that captures how stories actually get told — not in neat chapters, but in loops, tangents, callbacks, and audience interruptions.

Oral storytelling is alive and messy. Written storytelling is dead and organized. We want the best of both: the energy of oral tradition with the navigability of written form.

## Three Universes

We're building Story Stuff around three test universes, each exploring a different storytelling pattern:

- **🥯 Bagel Hole** — Recombinant formula storytelling. Episodes built from interchangeable beat slots — same structure, infinite variations.
- **🐉 Joe the Dragon** — Connected web storytelling. Characters, locations, and events form a navigable graph — enter from any node, explore in any direction.
- **🍆 Johnny D Eggplant** — Meta-documentary. The AI assistant building the platform becomes a character in the platform. (Yes, this is getting recursive.)

## How It Works

1. **Capture**: Record audio of oral storytelling (Whisper transcription on local M4)
2. **Structure**: AI segments and extracts narrative elements (Ollama gemma3:27b)
3. **Model**: Map to story graph — beats, decision points, audience moments, story gaps
4. **Navigate**: Non-linear UI for exploring, remixing, branching
5. **Community**: Story gaps become prompts for community contribution

## Key Concepts

- **BeatDefinition** — Formula slots that define story structure (UNIVERSAL vs EPISODIC scope)
- **AudienceMoment** — Audience interactions are first-class story elements
- **StoryGap** — Untold moments that invite community participation
- **DecisionPoint** — Branching points that create multiverse narratives

## Architecture

- **Monorepo**: pnpm + Turbo (Next.js web + Expo mobile + Node worker)
- **Database**: PostgreSQL (19-table Prisma schema)
- **AI Pipeline**: Whisper → Ollama gemma3:27b (segmentation + extraction)

Building Bagel Hole first — audio files exist, pipeline validated.
