---
title: "Logos"
icon: "Λ"
tagline: "Where language meets action — tracking discourse that shapes reality."
status: "Active research & development"
tags: ["Next.js", "PostgreSQL", "Puppeteer", "Local LLMs", "Ollama", "RSS", "NLP"]
order: 2
---

## What is Logos?

**Logos** (λόγος) — the ancient Greek word for "word," "reason," and "order" — represents information that effects reality. Ideas that lead to action. Facts that drive reason.

Logos is an intelligence platform that tracks the flow of discourse across domains where language shapes outcomes: energy policy, public health, scientific consensus, and democratic processes.

## The Mission

We maintain a **comprehensive view** of critical domains:

### ⚡ Energy & Climate Intelligence
Monitoring the global conversation around renewable energy — tracking political, economic, and social dynamics as the world navigates the energy transition. Understanding how discourse shapes policy and investment decisions.

### 🛡️ Misinformation Watch
Identifying and tracking misinformation campaigns, especially those targeting scientific consensus, public health initiatives, and democratic processes. Exposing patterns before they become narratives.

### 🔬 Science-to-Policy Translation
Deep analysis of how scientific testimony translates to legislative action. Our New Jersey case studies reveal what makes expert communication effective — and what gets lost in translation.

## Featured Research: NJ Legislative Analysis

Our ongoing study examines how scientists communicate with legislators, analyzing testimony transcripts to understand the mechanics of effective science communication.

| Metric | Value |
|--------|-------|
| Scientific claims analyzed | 77+ |
| Average evidence quality | 87% |
| Legislative hearings studied | 4 |
| Expert witnesses profiled | 12 |

**Key findings:**
- 80% of evidence quality gains come from prompt engineering (explicit negatives, reasoning fields)
- NJ-specific data drives engagement more than national statistics
- Economic framing ($5.8B FEMA claims, $1.3B Sandy savings) resonates with legislators
- Scientists who frame findings as "likely ranges" with uncertainty are respected more

### Hearings Analyzed
- **Plastic Pollution (2024-04-22)** — 42 claims, 81% strong evidence
- **Climate Resiliency (2024-08-01)** — 35 claims, 94% strong evidence
- **Climate Insurance (2024-03-07)** — Policy-focused, fewer scientists
- **Clean Energy (2024-03-11)** — Dr. Jesse Jenkins from Princeton ZERO Lab

## Architecture

- **Monorepo**: pnpm — Next.js API + Expo mobile app
- **Database**: PostgreSQL with pgvector (embeddings) + PostGIS (location)
- **Content**: RSS ingestion, Puppeteer for JS-rendered pages, Readability extraction
- **AI**: Local LLMs via Ollama — entity extraction, classification, summarization
- **Infrastructure**: Redis, MinIO (object storage), Kafka/Redpanda (events)
- **Provenance**: PROV-DM compliant data lineage tracking (W3C standard)

## Key Concepts

- **Documents** — Articles, papers, transcripts ingested from sources worldwide
- **Entities** — People, organizations, places, concepts extracted from documents
- **Projects** — Research lenses over global content (documents/entities are shared)
- **Inclusions** — The relational glue linking projects to documents/entities with project-specific meaning

## Philosophy

> "In the beginning was the Word, and the Word was with God, and the Word was God."
> — John 1:1

The ancient Greeks understood *logos* as the principle of reason and order underlying reality. We continue that tradition — tracking how language, properly deployed, becomes action and shapes the world.

---

*Logos is under active development. The landing page and research outputs are public; the full application is currently private.*
