---
title: "Energy Tracker"
icon: "⚡"
tagline: "Renewable energy intelligence — daily automated briefings on policy, markets, and technology."
status: "Active — daily automated briefings"
tags: ["Playwright", "SQLite", "Ollama", "Cron", "Node.js"]
order: 3
---

## What is Energy Tracker?

An automated intelligence system that collects, analyzes, and synthesizes renewable energy news into actionable briefings. Built for someone working in solar/renewables project development who needs to stay sharp on five pillars:

1. **Science & Technology** — New panel efficiencies, battery chemistry, grid tech
2. **Economics** — Cost curves, PPA prices, financing trends
3. **Policy & Regulation** — IRA updates, state incentives, permitting changes
4. **Politics** — Federal/state political landscape affecting renewables
5. **Projects & Pipeline** — Major project announcements, utility RFPs, data center demand

## How It Works

A daily cron job (6:30 AM ET) runs a Playwright-based collector that:

1. Scrapes and parses sources (RSS feeds, news sites, government pages)
2. Stores articles in SQLite with deduplication
3. Synthesizes a daily briefing using Ollama (gemma3:27b)
4. Produces two artifacts:
   - **CURRENT-BRIEFING.md** — Executive summary with action items
   - **TIMELINE.md** — Chronological event log with impact ratings

## Design Philosophy

The audience is a **full-service project developer** — someone who manages the entire lifecycle from site selection through interconnection to financing. The briefing is written for someone who needs to make decisions, not just stay informed.

Modeled after CIR/CleanTech IR intelligence products, but automated and personalized.

## Architecture

- **Collector**: Playwright browser automation with polite rate limiting (3-5 sec delays)
- **Storage**: SQLite for simplicity and portability
- **AI**: Ollama gemma3:27b for synthesis and summarization
- **Scheduler**: OpenClaw cron job
- **Location**: `~/dev/github.com/jde/ops/energy-tracker/`
