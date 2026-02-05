---
title: "Anatomy of an Intelligence Pipeline"
date: "2026-02-04"
excerpt: "How we built a self-healing data pipeline that discovers, qualifies, enriches, and annotates thousands of local experiences — powered by local LLMs and a PostgreSQL job queue."
tags: ["pipeline", "architecture", "PostgreSQL", "LLM"]
---

## The Goal

A traveler books a vacation rental. Before they arrive, we want to show them a personalized list of things to do nearby — restaurants that match their dining style, hikes that match their energy level, hidden gems they'd never find on Google. All without a human curator touching each recommendation.

This requires turning raw Google Places data into rich, opinionated, traveler-ready recommendations. That's what our intelligence pipeline does.

## The Pipeline, End to End

The pipeline has seven stages. Each stage is a job type processed by a background worker, with automatic chaining — completing one stage enqueues the next.

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   GENERATE   │────▶│   EXECUTE    │────▶│    QUALIFY    │
│   SEARCHES   │     │   SEARCH     │     │    PLACE     │
│              │     │              │     │              │
│ Area + terms │     │ Google API   │     │ LLM triage   │
│ → search grid│     │ → raw places │     │ → keep/skip  │
└──────────────┘     └──────────────┘     └──────────────┘
                                                │
                          ┌─────────────────────┤
                          ▼                     ▼
                   ┌──────────────┐     ┌──────────────┐
                   │    FETCH     │     │    CRAWL     │
                   │   DETAILS    │     │   WEBSITE    │
                   │              │     │              │
                   │ Google API   │     │ HTTP + parse │
                   │ → full data  │     │ → text content│
                   └──────────────┘     └──────────────┘
                          │                     │
                          └─────────┬───────────┘
                                    ▼
                          ┌──────────────┐
                          │   ANNOTATE   │
                          │  EXPERIENCE  │
                          │              │
                          │ 17 ann types │
                          │ via LLM      │
                          └──────────────┘
                                    │
                                    ▼
                          ┌──────────────┐
                          │  CATEGORIZE  │────▶ CLASSIFY_DINING
                          │   ENTITY     │     (food-drinks only)
                          │              │
                          │ Survey-aligned│
                          │ classification│
                          └──────────────┘
```

### Stage 1: Generate Searches

**Input:** A market definition — geographic boundaries and search terms.

A market is divided into overlapping search areas (circles on a map). For each area, we generate search queries from a curated term list: "seafood restaurant," "kayak rental," "museum," "hiking trail," "yoga studio," etc.

For one regional market, this produced ~2,700 search queries covering ~70 distinct terms across ~40 geographic areas.

### Stage 2: Execute Search

**Input:** A search query + location.
**Output:** Raw place records.
**External dependency:** Google Places API.

Each search hits the Google Places API and stores every result. Deduplication happens at the database level — the same restaurant appears in multiple overlapping searches, but we store it once and link it to all the searches that found it.

One market produced ~5,400 raw place records from 2,700 searches — about 2 results per search on average, after deduplication.

### Stage 3: Qualify Place

**Input:** A raw place with name, address, types, and basic metadata.
**Output:** A classification — is this a potential vendor, a trip idea, or not relevant?

This is the first LLM step. The model reviews each place and decides:
- **TRIP_IDEA** — a place a traveler would want to visit (restaurant, park, museum)
- **POTENTIAL_VENDOR** — a business that could partner with the platform (tour operator, rental shop)
- **NOT_RELEVANT** — doesn't belong (law offices, banks, chain gas stations)

The LLM also extracts structured data: experience types, indoor/outdoor classification, and price level.

Out of 5,400 raw places in one market, qualification kept ~1,350 and discarded the rest. An auto-curation script applies additional rules: chain detection (100+ known chain name patterns), minimum quality thresholds, and a scoring model that weighs type, quality, authenticity, and location.

### Stage 4: Fetch Details + Crawl Website

**Input:** A qualified place.
**Output:** Rich place data + website text content.
**External dependencies:** Google Places API (details), HTTP (website crawl).

These run in parallel. Fetch Details pulls the full Google Places record — hours, phone number, photos, reviews. Crawl Website fetches and extracts readable text from the business's website.

For places with complex websites (multi-page restaurant sites, activity booking platforms), a spider subprocess discovers linked pages, crawls them, cleans the HTML, and extracts structured content.

Coverage in one market: ~3,200 detail fetches, ~2,400 successful website crawls (some places have no website or block crawlers).

### Stage 5: Annotate Experience

**Input:** A place with details and website content.
**Output:** 17 annotation types, each generated by a tailored LLM prompt.

This is the heart of the pipeline. Each annotation type has its own:
- System prompt (tuned for that specific extraction task)
- Model (smaller models for simple tags, larger for creative writing)
- Version (bumped when the prompt improves, triggering re-annotation)

The annotation types:

| Annotation | What It Extracts | Example Output |
|---|---|---|
| marketing.longDescription | Traveler-facing description | "A family-owned seafood shack on the harbor, known for their lobster rolls and sunset views..." |
| marketing.shortDescription | One-line elevator pitch | "Harbor-side seafood with the best lobster rolls in town" |
| tag.activity | Activity classifications | "dining, waterfront, seafood" |
| experience.types | Experience type labels | "restaurant, seafood, waterfront-dining" |
| experience.pricing | Price expectations | "Entrees $18-32, lobster market price" |
| experience.authenticity | How "local" it feels | "Family-owned since 1987, sources from local fishermen" |
| experience.activityDetails | What you actually do there | "Sit-down dining, outdoor patio, BYOB wine" |
| experience.visitorCompatibility | Who it's good for | "Couples, families with older kids, groups" |
| traveler.segment | Target traveler types | "foodies, couples, beach-lovers" |
| season.period | When to visit | "May through October, peak summer weekends" |
| weather.condition | Weather considerations | "Outdoor seating weather-dependent, indoor available" |

Each annotation is stored with a confidence score, linked to an annotation batch for audit, and versioned. When we improve a prompt, the version bumps and the reconciliation system knows to re-run that annotation type across all places.

### Stage 6: Categorize Entity

**Input:** A place with all prior annotations.
**Output:** Survey-aligned categories, vibe attributes, popularity.

This is the newest stage — the one we [wrote about in detail](/blog-local-llm-classification). It maps every place to the same taxonomy our traveler survey uses, so a traveler's preferences ("I like beach activities, romantic vibes, hidden gems") directly filter the experience list.

Outputs:
- **survey.category** — 1-3 from: beach-water, hiking-nature, history-culture, food-drinks, shopping, arts-entertainment, wellness-spa, sports-adventure, family-fun, farm-local
- **vibe.energy** — 1 (contemplative) to 5 (thrilling)
- **vibe.style** — romantic, adventurous, educational, relaxing, social-nightlife, off-beaten-path
- **vibe.popularity** — popular, hidden-gem, mixed

For food-drinks places, it automatically chains to CLASSIFY_DINING, which adds dining style tags: seafood, farm-to-table, brewery-wine, casual, fine-dining, coffee-bakery, treats.

### Stage 7: Reconcile Pipeline

The reconciliation processor runs hourly, scanning for:
- **Missing steps:** A place went through qualification but never got annotated
- **Stale versions:** An annotation type's prompt was improved (version bumped) but some places still have the old version
- **Failed retries:** Jobs that failed and are eligible for retry

It queues the missing work automatically. This makes the pipeline self-healing — you can add a new annotation type, and reconciliation will queue it for every existing place. You can improve a prompt, bump its version, and every place gets re-annotated on the next reconciliation cycle.

## The Job Queue

All of this runs on a PostgreSQL-backed job queue. No Redis, no RabbitMQ, no external message broker. The `JobQueue` table stores jobs with:

- **Type-based routing:** 23 job types, each mapped to a processor function
- **Priority ordering:** Search jobs run before enrichment, enrichment before annotation
- **Concurrency control:** Configurable max concurrent jobs (we run 4) and max concurrent LLM calls (we run 2, due to GPU power constraints)
- **Automatic retry:** Failed jobs retry with exponential backoff
- **Worker heartbeat:** Workers claim jobs with a heartbeat timestamp; stale claims get reclaimed

The worker is a single Node.js process that polls the queue, dispatches to the appropriate processor, and handles graceful shutdown. A built-in dashboard (Fastify) shows real-time queue stats, LLM latency, and pipeline health.

## The Numbers

For one regional market:

| Metric | Count |
|---|---|
| Search queries executed | 2,717 |
| Places discovered | 5,400+ |
| Places qualified (kept) | 1,356 |
| Website crawls completed | 2,421 |
| Photos downloaded | 5,472 |
| Annotation batches completed | 5,231 |
| Survey classifications completed | 1,200+ |
| Dining classifications completed | 607 |
| Total job queue throughput | 38,000+ jobs |

All running on a single Mac mini (M4) talking to a GPU server (dual 5090s) for LLM inference. The LLM calls are the bottleneck — everything else (database queries, HTTP crawls, photo downloads) is fast.

## Design Decisions

**Why PostgreSQL for the queue?** One less dependency to manage. The intelligence database is already PostgreSQL, so the queue lives in the same database. `SELECT ... FOR UPDATE SKIP LOCKED` gives us efficient job claiming without external infrastructure. At our scale (thousands of jobs, not millions), this is more than sufficient.

**Why local LLMs instead of cloud APIs?** Cost and iteration speed. We ran 38,000+ jobs in one market. At cloud API prices, that's hundreds of dollars per market per run — and we re-run when prompts improve. With local models, re-running is free. We can iterate on prompts 10 times a day without worrying about the bill.

**Why per-type annotation instead of one big prompt?** Each annotation type has different quality requirements. Marketing descriptions need creative writing ability. Activity tags need structured extraction. Pricing needs numerical reasoning. Different prompts (and potentially different models) for different tasks outperform a single monolithic "annotate everything" prompt.

**Why version annotations?** Prompts improve over time. When we discover that our activity tag prompt produces duplicates ("nightlife, nightlife"), we fix it and bump the version. Reconciliation detects the stale annotations and re-queues them. No manual intervention, no "which places have the old data?" questions.

## What's Next

The pipeline currently produces the data. The next challenge is making it useful:

- **Trip planning integration** — duration estimates ("How long should I spend here?") and best-time-to-visit recommendations
- **Insider tips** — LLM-generated "one thing a local would tell you" for each place
- **Mood matching** — situation-based filtering: rainy-day activities, date-night spots, post-beach food
- **Experience pairing** — "Pairs well with..." recommendations that connect places into itineraries

Each of these is a new annotation type. The pipeline is designed so adding them is just: write a prompt, register the type, and let reconciliation do the rest.

---

*Built with Node.js, PostgreSQL, Ollama, and local LLMs on consumer hardware.*
