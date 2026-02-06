---
title: "Production LLM Engineering"
tagline: "Taking LLMs from demo to production — not calling an API, but building reliable systems around inherently unreliable models."
category: "build"
icon: "🧠"
proof: ["rolldeep"]
order: 3
stat: "93%+"
statLabel: "classification accuracy on local hardware"
---

- 80% of accuracy gains come from prompt engineering, not model selection
- Explicit negatives ("do NOT classify X as Y") dramatically reduce false positives
- Mandatory reasoning fields before classification outputs force the model to think first
- Deterministic post-processing catches what models miss
- Rules like "convenience stores are shopping, not food-drinks" fire hundreds of times and are 100% reliable
- Off-the-shelf 32B quantized models (qwen3:32b) are production-ready for classification
- No fine-tuning needed
- Local inference on consumer GPUs eliminates API costs entirely
- Our classification pipeline processes thousands of entities at zero marginal cost
- Down from 61% false positives to realistic distributions through systematic testing
