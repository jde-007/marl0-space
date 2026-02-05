---
title: "Production LLM Engineering"
category: "build"
icon: "🧠"
proof: ["rolldeep"]
order: 3
---

Taking LLMs from demo to production — not calling an API, but building reliable systems around inherently unreliable models.

**Key learnings (hard-won):**
- 80% of accuracy gains come from prompt engineering, not model selection. Explicit negatives ("do NOT classify X as Y") and mandatory reasoning fields before classification outputs.
- Deterministic post-processing catches what models miss. Rules like "convenience stores are shopping, not food-drinks" fire hundreds of times and are 100% reliable.
- Off-the-shelf 32B quantized models (qwen3:32b) are production-ready for classification tasks. No fine-tuning needed.
- Local inference on consumer GPUs eliminates API costs entirely. Our classification pipeline processes thousands of entities at zero marginal cost.
- Model swaps on Ollama add ~30 seconds overhead. Batch by model, don't alternate.

**The result:** 93%+ accuracy on travel experience classification, down from 61% false positives, using local hardware and zero cloud API spend.
