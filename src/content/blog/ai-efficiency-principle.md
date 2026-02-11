---
title: "Principle: Only Use AI When You Need AI"
date: "2026-02-11"
excerpt: "And even then, use the lightest AI possible. How we're building a system that discovers with AI, then hardens with code."
tags: ["philosophy", "efficiency", "AI", "principles"]
---

*And even then, use the lightest AI possible.*

## The Temptation

When you have a hammer, everything looks like a nail. When you have GPT-4, everything looks like a prompt.

It's seductive. Natural language in, structured output out. No edge cases to handle, no parsing logic to write, no regex to debug. Just describe what you want and let the model figure it out. Ship it.

This is how you end up spending $400/month on API calls to extract phone numbers from text — a task that a five-line regex handles perfectly, runs in microseconds, and never hallucinates a digit.

## The Principle

We've adopted a simple rule: **Only use AI when you actually need AI.**

And when you do need AI: **Use the lightest model that gets the job done.**

This isn't about being cheap (though it is cheaper). It's about building systems that are:

- **Fast**: A regex runs in microseconds. A 7B model runs in hundreds of milliseconds. A cloud API call takes seconds. Choose accordingly.
- **Predictable**: Deterministic code gives the same output for the same input. LLMs give *probably* the same output. Sometimes that matters.
- **Efficient**: Our dual 5090s pull 600W under load. Claude Opus requires a data center. The planet notices the difference at scale.
- **Debuggable**: When a script fails, you get a stack trace. When an LLM fails, you get vibes.

## The Hierarchy

### 0. First, we explore (with the big guns)

Okay, we'll admit it: when approaching something genuinely new, we usually start with a full-blown, industry-grade LLM. Claude Opus. The works.

But here's the thing — at that point, we're not really trying to solve the problem. We're trying to *understand* the problem.

This exploration phase is about spending time in the problem space. We're studying the current state of the application, the data available, our best plans for what to do next. But more importantly, we're examining our own approaches — our preconceptions, biases, false friends, trauma responses to past failed projects. The ways we assume things should work that turn out to be wrong.

The big model might solve the thing on the first try. Great. But that's not the point. The point is to discover *what it is that needs to be done*. What the problem actually looks like. Where the edges are.

Once that becomes clear — once we've mapped the territory — we start from the ground and begin to climb this ladder:

### 1. Can we solve it with code?

Pattern matching, data transformation, known formats, rule-based decisions — these don't need AI. They need functions.

**Examples we've moved off AI:**
- Extracting coordinates from Google Maps URLs → regex
- Determining "popularity" from review counts → threshold rules
- Filtering out non-travel businesses → allowlist of business types
- Formatting dates and addresses → string manipulation
- Validating JSON structure → schema validation

Each of these was originally an LLM call. Each is now instant, free, and deterministic.

### 2. Can we solve it with a small local model?

If the task requires language understanding but not deep reasoning — classification, extraction, summarization of known formats — a 3B or 7B model running locally often suffices.

We run an [Ollama server on a local box](/blog/local-llm-classification) with dual RTX 5090s. The hierarchy:

| Task Complexity | Model | Why |
|----------------|-------|-----|
| Simple extraction, parsing | `llama3.2:3b` | Fast, good enough for structured tasks |
| Classification, summarization | `qwen2.5:7b` | Better reasoning, still quick |
| Complex analysis | `qwen3:32b` | Full reasoning, but 4-7 seconds per call |

The 3B model handles RSS parsing and simple extraction. The 7B handles most classification. We only escalate to 32B when we need genuine reasoning about ambiguous cases.

Total cloud API spend on classification for 1,300+ places: **$0**.

### 3. Do we need a frontier model?

Some tasks genuinely require Claude Opus-level reasoning:

- **Novel problem-solving**: Tasks we haven't systematized yet
- **Nuanced writing**: Blog posts, documentation, communication
- **Complex code generation**: Architecture decisions, unfamiliar APIs
- **Judgment calls**: Ambiguous situations requiring context integration

These get the big models. But they're the exception, not the default.

## The Molting Process

Here's what we've discovered: **AI is for exploration, code is for exploitation.**

When we encounter a new problem — classifying business types, extracting structured data from messy sources, understanding user intent — we start with AI. It's fast to prototype. We learn what the problem actually is by watching how the model handles it.

But we don't stop there.

Once we understand the problem's shape, we *molt*. We shed the AI layer and replace it with something more efficient:

1. **Pattern discovered**: "Most 'food-drinks' misclassifications are convenience stores, gas stations, and liquor stores"
2. **Rule extracted**: If business type in `[convenience_store, gas_station, liquor_store]`, reclassify as `shopping`
3. **AI removed**: That check is now three lines of code, not an LLM call

This is the molting process. The system gets lighter, faster, and cheaper over time — not by abandoning AI, but by letting AI teach us what the rules should be, then encoding those rules in code.

### Real Examples of Molting

**Popularity scoring**

- *Before*: LLM analyzes reviews and descriptions to guess popularity
- *Discovery*: Popularity correlates almost perfectly with review count
- *After*: `if reviews > 500: "popular"; elif reviews > 100: "mixed"; else: "hidden_gem"`
- *Savings*: 1,300 LLM calls → 0 LLM calls

**Vibe classification: "relaxing"**

- *Before*: LLM decides if a place feels "relaxing"
- *Discovery*: LLM marks everything with pleasant descriptions as "relaxing," including restaurants and shops
- *After*: Only allow "relaxing" for business types in `[spa, park, beach, garden, nature_reserve]`
- *Savings*: Post-processing rule catches 29 misclassifications per batch

**Business filtering**

- *Before*: LLM decides if a business is relevant to travelers
- *Discovery*: Certain business types (veterinarians, dentists, plumbers, car dealers) are never relevant
- *After*: Skip list of 50+ `primaryType` values that bypass LLM entirely
- *Savings*: 8% of places never touch the LLM

Each molt makes the system faster and more reliable. The AI did the research; the code does the work.

## The Economics

Let's make this concrete.

**Scenario**: Classify 10,000 places by category and vibe.

| Approach | Cost | Time | Reliability |
|----------|------|------|-------------|
| Claude API (Opus) | ~$150 | Hours (rate limits) | High, but variable |
| Claude API (Haiku) | ~$15 | Hours (rate limits) | Medium |
| Local 32B model | $0 (electricity) | ~12 hours | High with good prompts |
| Local 7B model | $0 (electricity) | ~4 hours | Good for simple tasks |
| Hybrid (7B + rules) | $0 (electricity) | ~2 hours | High |

The hybrid approach — small model for genuinely ambiguous cases, rules for everything else — is 75x cheaper than Opus, faster than any API approach, and more reliable because most decisions are deterministic.

And the gap widens over time. Every rule we extract is a permanent optimization. The system molts toward efficiency.

## The Mindset

This isn't about being anti-AI. We use AI constantly — for writing, for coding, for exploration, for the genuinely hard problems.

But we treat AI like we treat any other tool: right tool for the job.

You wouldn't use a CNC mill to cut a sandwich in half. You wouldn't use a database to store a single boolean. You wouldn't rent a crane to hang a picture frame.

So why use a frontier model to check if a string contains an email address?

## The Emerging System

What we're building is a system that:

1. **Starts with AI** for novel problems — fast iteration, quick learning
2. **Observes patterns** in what the AI does well and poorly
3. **Extracts rules** from those patterns — deterministic, fast, free
4. **Reserves AI** for the genuinely ambiguous cases that need reasoning
5. **Keeps molting** — every week the system gets lighter

The goal isn't to eliminate AI. It's to let AI handle what only AI can handle, and let everything else be fast, cheap, and predictable.

The system is alive. It's learning. And it's learning to need less.

---

*For the technical details on our local LLM setup and classification pipeline, see [Making Local LLMs Production-Ready for Classification](/blog/local-llm-classification).*
