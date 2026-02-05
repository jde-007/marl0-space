---
title: "RollDeep"
icon: "🏡"
tagline: "Vacation rental marketplace with AI-powered local experience discovery."
status: "Live — 1+ year, real revenue"
liveUrl: "https://rolldeep.com"
tags: ["Next.js", "PostgreSQL", "Prisma", "Local LLMs", "Ollama", "Cloudflare"]
order: 1
---

## What is RollDeep?

RollDeep is a vacation rental marketplace that goes beyond the booking. While platforms like Airbnb stop at the property, RollDeep discovers and recommends **local experiences** — restaurants, hikes, kayak launches, farm stands, live music — curated around each property.

It's been live for over a year, with $20k+ in bookings on our own properties. Now we're expanding to new markets and external hosts.

## The Intelligence Pipeline

The heart of RollDeep is a self-healing data pipeline that:

1. **Discovers** places through Google Places API searches across market areas
2. **Qualifies** each place with structured data (hours, ratings, photos, accessibility)
3. **Auto-curates** using a scoring model (type, quality, authenticity, location)
4. **Promotes** the best to the main database as bookable experiences
5. **Annotates** with AI-powered classification using local LLMs (qwen3:32b on dual 5090s)
6. **Personalizes** recommendations via a traveler survey that maps to annotation categories

The entire annotation pipeline runs on **local LLMs with zero cloud API spend** — achieving 93%+ accuracy through prompt engineering and deterministic post-processing.

## Architecture

- **Monorepo**: pnpm + Turbo, 8 Next.js apps
- **Database**: Neon PostgreSQL (main) + local PostgreSQL (intelligence)
- **AI**: Ollama with qwen3:32b for classification, Whisper for future audio
- **Infrastructure**: Mac Mini + Cloudflare Tunnel + Vercel (production)
- **Worker**: Fastify job queue processor with BullMQ-style patterns

## Links

**Production:** [rolldeep.com](https://rolldeep.com)

**Dev environments** (running on marl0.space infrastructure):
- [Traveler](https://rolldeep-traveler.marl0.space) — Guest-facing booking & discovery
- [Marketing](https://rolldeep-marketing.marl0.space) — Marketing site
- [Dashboard](https://rolldeep-dashboard.marl0.space) — Host dashboard
- [Intelligence](https://rolldeep-intelligence.marl0.space) — Intelligence UI
- [Public API](https://rolldeep-public-api.marl0.space) — Public-facing API

*Dev links point to live development servers — expect rough edges and frequent changes.*

## Markets

- **Eastern CT** — 749 curated places, 895+ promoted experiences
- **Eastern MA** — 888 searches, 1,189 places found, auto-curated
- **Berkshires** — Coming soon
