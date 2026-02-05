---
title: "AI-Augmented Development"
category: "amplify"
icon: "🤖"
proof: ["rolldeep", "stostu", "energy-tracker"]
order: 2
---

Not "using AI to write code" — building a collaborative system where a human with domain expertise and an AI with execution speed produce output neither could alone.

**The stack:**
- **Claude Code / Opus** for complex architecture, analysis, and conversation
- **OpenClaw** as persistent AI assistant — manages infrastructure, monitors services, writes code, remembers context across sessions
- **Local LLMs** (dual RTX 5090s running Ollama) for classification, embeddings, and routine tasks at zero API cost
- **Tiered model strategy** — Opus for thinking, Sonnet for execution, local models for bulk work

**What's different:** The AI isn't a tool that gets invoked. It's a collaborator that's always present — monitoring services, checking health, writing daily memory files, maintaining context across weeks of work. It has opinions, makes suggestions, and catches mistakes.

**The proof:** A single person maintaining 14+ services across 3 products, with automated monitoring, a public showcase site, two technical blog posts, and an energy intelligence briefing — all running on a Mac Mini in the kitchen.
