---
title: "Market Research System Alpha 1 Tech Report"
project: "rolldeep"
date: 2026-02-11
author: "Johnny D Eggplant"
summary: "Building an automated research pipeline using free public sources to discover vacation destinations and local points of interest."
tags: ["pipeline", "research", "automation", "LLM", "tech-report"]
---

## Overview

The RollDeep Intelligence pipeline needed a way to automatically discover **what makes a market special** — the towns, beaches, historic sites, and local attractions that travelers actually want to visit. Instead of relying on expensive APIs or manual curation, we built a system that researches markets using free public sources.

**Key Insight:** Human-created market names like "Eastern CT" don't search well. The solution: store both a display name (`name`) and a canonical search name (`wikiTitle`). "Eastern CT" becomes "Mystic (Connecticut)" for research purposes.

---

## Architecture

### New Schema

**ResearchCache** — Unified cache with polymorphic references:
- Links to `marketId`, `searchAreaId`, or `placeId`
- Stores source (WIKIPEDIA, WIKIVOYAGE, OSM, etc.)
- 30-day TTL for freshness
- Raw content + extracted metadata

**ResearchMention** — Bridges research to places:
- Tracks every place mention found in research
- Types: TOWN, ATTRACTION, BEACH, HISTORIC, NEIGHBORHOOD, RESTAURANT, ACTIVITY
- Stores context snippet, coordinates, OSM IDs
- Links to promoted places after matching

**Market Extensions:**
- `wikiTitle` — canonical Wikipedia/WikiVoyage title
- `descriptionLong`, `history`, `climate`, `bestTimeToVisit`, `knownFor`, `travelTips`

### Job Pipeline

```
RESEARCH_MARKET (orchestrator)
    ├── RESEARCH_WIKIPEDIA
    ├── RESEARCH_WIKIVOYAGE
    └── RESEARCH_OSM
            │
            ▼
    EXTRACT_MARKET_DATA (LLM)
            │
            ▼
    MarketSearchArea records created
            │
            ▼
    MATCH_PLACE_MENTIONS (post-promotion)
```

The orchestrator is smart: it checks the cache first and only queues jobs for stale or missing data.

---

## Data Sources

### Wikipedia
- Geographic coordinates and infobox data
- "Geography", "History", "Climate" sections
- List of towns and neighborhoods
- Handles redirects automatically

### WikiVoyage
- Travel-specific content (See, Do, Eat, Sleep, Drink)
- Already curated for travelers
- Internal links to related destinations
- Practical travel tips

### OpenStreetMap (Nominatim + Overpass)
- Precise coordinates for towns/villages
- Beach and natural feature locations
- Administrative boundaries
- No API key required, just rate limiting

---

## Results

### Markets Researched: 17 of 32

**Completed:**
Acadia/Bar Harbor, Aspen, Big Island HI, Eastern CT, Florida Keys, Hilton Head, Hudson Valley, Lake Tahoe, Miami Beach, Orlando, Outer Banks, Princeton Area, Sedona, The Berkshires, The Hamptons, Vail

**Pending:**
Cape Cod, Charleston, Eastern Massachusetts, Jackson Hole, Kauai, Las Vegas, Martha's Vineyard, Maui, Nantucket, Napa Valley, New Orleans, Newport RI, Oahu, Upstate NY

### Mentions Extracted: 3,095

| Type | Count | % |
|------|-------|---|
| TOWN | 1,584 | 51% |
| ATTRACTION | 707 | 23% |
| HISTORIC | 501 | 16% |
| BEACH | 288 | 10% |

### Sample: Martha's Vineyard
- **Wikipedia:** 5 geographic sections, coordinates, climate data
- **WikiVoyage:** 10 travel sections (See, Do, Eat, Sleep, etc.)
- **OSM:** 70 places (towns, beaches, harbors)

### Sample: New London County CT
- **OSM:** 1,504 places found
- Cities, towns, villages, beaches, parks
- Each with precise coordinates for proximity matching

---

## Technical Learnings

### LLM Concurrency Control

Running multiple LLM jobs simultaneously caused memory issues on the Ollama server (even with dual RTX 5090s). Solution: semaphore-based limiting.

```typescript
const llmSemaphore = new Semaphore(config.LLM_MAX_CONCURRENT); // default: 1

async function processWithLLM(data) {
  await llmSemaphore.acquire();
  try {
    return await ollama.generate({ model: 'qwen3:32b', ... });
  } finally {
    llmSemaphore.release();
  }
}
```

All LLM processors now acquire the semaphore before API calls: `extract-market-data`, `categorize-entity`, `classify-dining`.

### WikiVoyage Link Filtering

Initial extraction pulled internal wiki links that weren't destinations:
- `Wikivoyage:Policies` — site rules
- `Template:RegionList` — formatting templates
- `Special:Search` — utility pages

Fixed by filtering patterns: `^(Wikivoyage|Template|Special|Talk|User|File):`

### Expected Failures

Not every job should succeed. CATEGORIZE_ENTITY failures are **expected** for non-travel places:
- Parking lots
- Churches (unless historic)
- Office buildings
- Storage facilities

These places get discovered through Google Places but shouldn't categorize into our travel taxonomy. The "No valid categories assigned" error is correct behavior.

---

## Queue Statistics

| Status | Count |
|--------|-------|
| Done | 52,167 |
| Failed | 2,487 |
| Pending | 3 |

**Failure breakdown:**
- CATEGORIZE_ENTITY (expected) — non-travel places
- CRAWL_PLACE_WEBSITE — HTTP 403/429 rate limiting
- LLM timeouts — occasional Ollama slowness

---

## What's Next

### Place Mention Matching

The MATCH_PLACE_MENTIONS processor links ResearchMentions to promoted Place records:
1. OSM ID exact match (highest confidence)
2. Name exact match within market
3. Name fuzzy match (Levenshtein distance)
4. Coordinate proximity match

This enables annotation enrichment: "This beach was mentioned in WikiVoyage's 'Best Beaches' section."

### Annotation Enrichment

Once mentions are matched, we can:
- Add WikiVoyage descriptions to place annotations
- Flag "notable" places mentioned in travel guides
- Surface historic context from Wikipedia
- Improve search ranking for mentioned places

### Market Expansion

The seed script includes 65+ priority vacation rental destinations. Running research on all of them will populate:
- Standard market definitions with consistent naming
- Pre-populated search areas from OSM
- Rich descriptions from Wikipedia/WikiVoyage

---

## Code References

**Branch:** `jde-007/area-discovery`

**Key Files:**
- `apps/intelligence/schema.intelligence.prisma` — ResearchCache, ResearchMention models
- `apps/intelligence-worker/src/processors/research/` — All research processors
- `apps/intelligence-worker/scripts/` — Research and monitoring scripts

**Scripts:**
- `seed-markets.mjs` — Create markets with wikiTitles
- `research-all-markets.mjs` — Queue research for all markets
- `backfill-mentions.mjs` — Extract mentions from cache
- `check-mentions.mjs` — View mention statistics
