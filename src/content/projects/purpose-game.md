---
title: "Purpose Game"
icon: "🎮"
tagline: "An idle-strategic life simulation — finding purpose through repeated practice, self-discovery, and progressive revelation."
status: "Early prototype"
devOnly: true
tags: ["Flutter", "Next.js", "TypeScript", "Dart", "Game Design", "Psychology"]
order: 3
---

## What is Purpose Game?

Purpose Game is an **idle-strategic life simulation** disguised as a mobile game. It's about finding purpose through repeated practice, self-discovery, and progressive revelation — not through explicit instruction, but through the act of playing.

The secret: the game is designed to **inspire real-life practices** (breathwork, meditation, yoga, movement). These start veiled as generic "routines" and gradually reveal their true nature through play. The game teaches without preaching.

## Philosophical Foundations

The design draws from two major influences:

- **Hegel's Phenomenology of Spirit** — Dialectical progression through stages of consciousness. The game models growth not as linear leveling, but as thesis→antithesis→synthesis through experience.
- **Hesse's Glass Bead Game** — The unnamed practice, the mystery of the journey, the synthesis of disciplines. Players discover the game's true nature by playing it.

## The Four States

Players move between four modes, each affecting seven currencies differently:

| State | Nature | Effect |
|-------|--------|--------|
| **Journey** | Movement, outward, active | Drains energy, builds experience and strength |
| **Garden** | Stillness, outward, preparatory | Restores energy, builds clarity |
| **Depths** | Stillness, inward, reflective | Slight drain, builds wisdom and clarity |
| **Circle** | Variable, collective | Moderate drain, builds connection |

## The Veiling System

The core innovation: **nothing is what it first appears**.

- **Obstacles** start generic ("Enemy Type A") and gradually reveal psychological meaning ("Fear", "Self-Doubt", "Procrastination")
- **Practices** start unnamed ("Routine A") and reveal their true nature ("Breathwork", "Meditation", "Movement")
- **Revelation happens through play** — encounter count, achievements, and spending the Clarity currency

Five stages: Complete Obscurity → Behavioral Hints → Pattern Recognition → Partial Understanding → Full Revelation

## The Idle Loop

The game respects your time differently as you progress:

- **Early**: 5-minute loops, many small choices, high attention (learning the systems)
- **Mid**: 30-60 minute loops, fewer strategic choices (understanding the patterns)
- **Late**: Hours or days, rare profound choices (mastery emerging)
- **Endgame**: The game plays itself. You observe and occasionally guide.

## Honest Mode

An optional bridge between game and reality:

- Self-report when you've actually done the revealed practices
- Own up to past reports that weren't quite true
- No punishment — just honesty as its own reward
- The game becomes a mirror for real life

## Architecture

- **Mobile**: Flutter (iOS primary, also Android/web)
- **Backend**: Next.js API + admin dashboard
- **Shared Types**: TypeScript package (`@purpose/api-types`)
- **Simulation Tool**: Separate Next.js app for balance testing and Monte Carlo simulation

## Why "Purpose"?

Purpose isn't a destination you reach — it's a state you become. The formula emerges from all systems combined:

```
Purpose = Habits × Motivation × Understanding × Energy × Relationships × Time
```

None of these can be maxed out. None can be ignored. The game is about finding your balance.
