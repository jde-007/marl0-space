---
title: "80% of LLM accuracy comes from prompt engineering, not model choice"
date: "2026-02-04"
source: "RollDeep intelligence pipeline classification testing"
tags: ["LLM", "prompt-engineering", "classification"]
---

We A/B tested multiple models on travel experience classification. The difference between models was marginal. The difference between prompt versions was dramatic.

Explicit negatives ("do NOT assign 'food-drinks' to gas stations"), mandatory reasoning fields before classification outputs, and concrete examples in the prompt delivered 80% of accuracy gains. Model choice contributed maybe 5%. Deterministic post-processing rules handled the remaining 15%.

The implication: stop shopping for better models and start writing better prompts.
