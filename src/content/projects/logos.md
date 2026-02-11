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

The ancient Greeks understood *logos* as the principle of reason and order underlying reality — the rational structure behind existence. We continue that tradition, tracking how language, properly deployed, becomes action and shapes the world.

---

*Logos is under active development. The landing page and research outputs are public; the full application is currently private.*
