---
title: "Making Local LLMs Production-Ready for Classification"
date: "2026-02-04"
excerpt: "From 61% false positives to 93%+ accuracy using off-the-shelf models, prompt engineering, and deterministic post-processing — with zero cloud API spend."
tags: ["LLM", "classification", "Ollama", "prompt-engineering"]
---

## The Problem

We're building a vacation rental platform that recommends local experiences to travelers based on their preferences. To power this, we need to classify 1,300+ places across categories like food-drinks, beach-water, hiking-nature, arts-entertainment, and more — plus assign vibe attributes (energy level, style, popularity).

Our first pass with a local LLM tagged 61% of places as "food-drinks" (including hair salons, gas stations, and theaters) and slapped "relaxing" on 88% of everything. The model wasn't wrong about the world — it was wrong about our taxonomy.

## The Setup

- **Hardware:** Dual NVIDIA RTX 5090s (local server)
- **Models tested:** gemma3:27b, qwen2.5:32b, qwen3:32b (all Q4_K_M quantized)
- **Database:** PostgreSQL with 1,300+ places, website crawl data, and existing annotation context
- **Concurrency:** 4 parallel jobs, 2 concurrent LLM requests (power-constrained)

## What v1 Got Wrong (Examples)

Before we look at what worked, here's what "61% food-drinks" actually looked like:

| Place Type | v1 Categories | v1 Vibe | What's Wrong |
|---|---|---|---|
| Yacht club (marina) | food-drinks, history-culture | romantic | It's a marina, not a restaurant |
| Convenience store | food-drinks | relaxing | Sells snacks ≠ serves food |
| Hair salon | wellness-spa | relaxing | Personal service, not a traveler experience |
| Go-kart track (event venue) | sports-adventure, family-fun | adventurous | Correct! But 2 out of 20 doesn't redeem the other 18 |
| Liquor store | food-drinks | relaxing | Retail, not a bar |
| Fitness center | sports-adventure *or* wellness-spa | relaxing | Models disagreed with each other |

The model treated any place tangentially related to food, drink, or "being calm" as food-drinks or relaxing. It was pattern-matching on vibes, not classifying against a taxonomy.

## What Actually Worked (In Order of Impact)

### 1. Prompt Engineering > Model Selection

The single biggest improvement came from rewriting the system prompt. Our v1 prompt said "assign 1 or more categories" with a flat list. v2 added:

- **Explicit negative examples** per category: *"food-drinks EXCLUDES salons, spas, hotels, bowling alleys, farms, theaters, gift shops, convenience stores, gas stations — even if they happen to sell snacks"*
- **Strict caps:** 1-3 categories max, 0-2 vibe styles max
- **Mandatory reasoning field** before classification: forces the model to articulate *what the place is* before deciding *what category it fits*
- **Precise definitions** for subjective terms: *"relaxing: Places where relaxation IS the core experience — spas, beaches, peaceful gardens. NOT restaurants, NOT shops."*

This alone dropped false food-drinks from 61% to ~20% and false "relaxing" from 88% to 25%. The model was always capable — it just needed clearer instructions.

**Before (v1 prompt output):**
```json
{"categories": ["food-drinks", "shopping"], "vibeEnergy": 2, "vibeStyles": ["relaxing"]}
```
*— for a convenience store*

**After (v2 prompt output):**
```json
{"reasoning": "This is a convenience store that primarily sells packaged goods and snacks. It does not prepare or serve food as its primary business.", "categories": ["shopping"], "vibeEnergy": 2, "vibeStyles": []}
```

The reasoning field is the key — it forces chain-of-thought before the classification decision, and we can audit it later.

### 2. Pre-Filtering (Deterministic, Free)

We defined 50+ Google Places `primaryType` values that are never relevant to travelers: gas stations, car dealers, veterinarians, doctors, dentists, banks, insurance agencies, hair salons, barber shops, nail salons, laundromats, plumbers, etc.

These skip the LLM entirely. In our dataset, this eliminated ~111 places (8%) from unnecessary classification — saving tokens and preventing a guaranteed class of errors. A veterinary clinic will never be correctly classified as a travel experience, no matter how good your prompt is.

**Example:** A place with `primaryType: "veterinary_care"` skips classification entirely. Before pre-filtering, the model gamely attempted to classify it and produced `{"categories": ["wellness-spa"]}`. No amount of prompt engineering fixes that — just don't ask.

### 3. Post-Processing Rules (Deterministic Corrections)

After the LLM responds, we apply business rules that catch its most predictable mistakes:

| Rule | What It Fixes | Corrections Applied |
|------|--------------|-------------------|
| Strip "relaxing" from non-wellness/nature places | Cafes, restaurants, shops getting "relaxing" | 29 corrections |
| Popularity from review count | Model guesses; we have data | 221 corrections |
| Energy floor for bars/nightclubs (≥4) | Model under-rates energetic venues | 5 corrections |
| Convenience/grocery/liquor → shopping, not food-drinks | Model conflates "sells food" with "serves food" | 21 corrections |

60% of v2.1 batches had at least one correction applied. These aren't model failures — they're cases where the model gets *close* but a simple rule gets it *right*.

**Example — popularity correction:**

The LLM classified a well-known seafood restaurant as `"popularity": "mixed"`. Our post-processing saw 1,507 Google reviews and corrected it to `"popular"`. The model was guessing from the name; we had data.

**Example — relaxing correction:**

A Chinese restaurant got `"vibeStyles": ["relaxing"]` from the model. The prompt says not to apply "relaxing" to restaurants, but the model picked up on "cozy" language in the marketing description. Post-processing stripped it: relaxing is reserved for spas, beaches, and parks.

### 4. Better Context Feeding

The model classifies better when it understands what a place actually does. We already had marketing descriptions and activity tags from earlier pipeline stages sitting in our database. Instead of feeding a random sample of annotations, we now prioritize:

1. Marketing descriptions — AI-generated place descriptions from website crawls
2. Activity tags — activity classifications
3. Experience types — experience type labels

Same data, better ordering. The model gets the most useful context within its attention window.

**Example — context changes the classification:**

A place listed as `primaryType: "store"` with no other context got classified as `"shopping"`. But its marketing description mentioned "kayak rentals, paddleboard lessons, and guided river tours." With that context fed first, the model correctly classified it as `"sports-adventure, beach-water"`.

### 5. Two-Pass Verification

For classifications where the model reports confidence below 0.8, we run a second LLM call: "You classified X as Y — is this correct?" Only categories that survive both passes are kept. This costs 2x tokens for ambiguous cases (~20% of places) but catches disagreements the model has with itself.

### 6. Confidence Thresholding

Results below 0.7 confidence get flagged for human review rather than blindly accepted. In practice, qwen3:32b reports 0.95 confidence on almost everything — which tells us either the model is well-calibrated or overconfident. We log these flags in an audit trail for manual spot-checking.

## The A/B Test

We tested all three models on the same 20 diverse places (parks, restaurants, marinas, salons, go-kart tracks, yoga studios):

| Model | Avg Time | Parse Errors | Avg Categories | Key Mistake |
|-------|----------|-------------|----------------|-------------|
| gemma3:27b | 7.5s | 0/20 | 1.1 | Yacht club → food-drinks |
| qwen2.5:32b | 7.5s | 0/20 | 0.9 | None on test set |
| qwen3:32b | 4.3s | 3/20* | 0.9 | None when parsing succeeded |

*qwen3:32b parse failures were caused by its thinking mode consuming the token budget before completing JSON output. Fixed by adding `/no_think` to the system prompt — a one-line change.*

**Winner: qwen3:32b** — 43% faster, most conservative, zero false positives when parsing succeeds.

## Final Results

Running against 1,300+ places in a regional market:

**v1.0 (gemma3:27b, naive prompt):**
- 61% tagged food-drinks (should be ~40%)
- 88% tagged "relaxing" (should be ~10%)
- Energy clustered at 2-3 (no differentiation)
- Hair salons, gas stations, vets all classified

**v2.1 (qwen3:32b, full pipeline):**
- Category distribution matches reality
- "relaxing" only on spas, parks, beaches
- Energy differentiated: bars→4, parks→2, restaurants→3
- 111 non-travel places auto-skipped
- 60% of results improved by post-processing
- Audit trail on every classification (reasoning + corrections)

Total processing time: ~2 hours on dual 5090s. Zero cloud API spend.

## The Takeaway

The common instinct when local LLM results are bad is to reach for a bigger model or a cloud API. In our experience, the leverage is elsewhere:

1. **Prompt engineering accounts for ~80% of accuracy gains.** Explicit negative examples and mandatory reasoning are the two highest-ROI prompt techniques.
2. **Deterministic rules catch what LLMs can't learn.** "Popularity" is a function of review count, not vibes. "Relaxing" has a business definition that differs from the English definition. Encode these as rules, not prompts.
3. **Better input > better model.** Feeding existing annotations (marketing descriptions, activity tags) into the classification prompt costs nothing and gives the model dramatically better signal.
4. **Pre-filtering is underrated.** The cheapest LLM call is the one you don't make.

Off-the-shelf 32B quantized models on consumer GPUs are production-ready for structured classification tasks — if you engineer the system around their strengths and patch their weaknesses with code.

---

*Built with qwen3:32b (Q4_K_M) on dual RTX 5090s, PostgreSQL, and a lot of prompt iteration.*
