---
title: "The Multi-App Local LLM Problem: When Your GPUs Go to War"
date: "2026-02-10"
excerpt: "Running multiple applications against a single Ollama server sounds simple — until your GPUs freeze, models refuse to load to VRAM, and you're staring at a black RDP screen with fans at 100%."
tags: ["LLM", "Ollama", "infrastructure", "GPU", "local-AI"]
---

## The Setup

We run a local LLM server with dual NVIDIA RTX 5090s (64GB VRAM total) serving multiple applications:
- A vacation rental intelligence pipeline (classifying thousands of places)
- An AI assistant handling chat and document analysis
- Various development experiments and prototyping

All hitting the same Ollama instance at `http://192.168.1.38:11434`.

This worked great — until it didn't.

## The Failure Mode

Monday morning, 8 AM. The server is responsive (Ollama API returns `{"models":[]}`) but:
- RDP shows a black screen
- Fans are maxed out at 100%
- SSH connections hang
- Can't log in to diagnose

From my AI assistant's perspective, I could still hit the Ollama API, but something was deeply wrong:

```bash
curl -s http://192.168.1.38:11434/api/ps | jq '.models[] | {name, size_vram}'
# Returns: {"name": "qwen3:32b", "size_vram": 0}
```

**`size_vram: 0`** — the 32B model was running entirely on CPU, not GPU. That's why the fans were screaming; the CPUs were doing work the GPUs should have handled.

## The Investigation

After a hard reboot (the only option when you can't log in), we started testing systematically:

| Model | Size | VRAM Allocated | Result |
|-------|------|----------------|--------|
| qwen2.5:7b | ~5GB | 19.7GB ✅ | Loaded to GPU |
| gemma3:27b | 37GB | 0 ❌ | Fell back to CPU |
| qwen3:32b | 55GB | 0 ❌ | Fell back to CPU |

**Pattern:** Models that fit on a single GPU worked. Models that needed to span both GPUs silently fell back to CPU.

After the reboot, the same qwen3:32b model loaded correctly:

```bash
curl -s http://192.168.1.38:11434/api/ps | jq '.models[] | {name, size_vram}'
# Returns: {"name": "qwen3:32b", "size_vram": 54901033984}  # ~51GB across both GPUs
```

And `nvidia-smi` confirmed healthy multi-GPU operation:

```
| 0  NVIDIA GeForce RTX 5090  | 27161MiB / 32607MiB | 46% |
| 1  NVIDIA GeForce RTX 5090  | 27378MiB / 32607MiB | 47% |
```

## Root Cause: GPU Memory Fragmentation from Concurrent Model Loading

The night before, two different applications had been making requests simultaneously:
1. The intelligence pipeline loading `qwen3:32b` for classification
2. The AI assistant loading `gemma3:27b` for document analysis

When both tried to allocate GPU memory at the same time, something broke in the multi-GPU spanning logic. The GPUs got into a fragmented state where:
- Individual allocations under ~20GB worked (fit on one GPU)
- Large allocations that needed to span both GPUs failed silently, falling back to CPU
- The CPU fallback consumed 100% of all cores, hence the fan noise
- The graphics driver got confused, causing the RDP black screen

## Why This Is Tricky

Ollama is designed for single-user, single-model workflows. It handles model loading/unloading gracefully, but it doesn't expect:

1. **Concurrent model switches** — App A requests model X while App B is still using model Y
2. **Race conditions on VRAM** — Both apps trying to allocate GPU memory simultaneously  
3. **No coordination layer** — Each app thinks it's the only user

The failure is silent. You don't get an error saying "GPU memory fragmented, falling back to CPU." The API just works, but 10x slower, burning your CPUs instead of your GPUs.

## Solutions We're Considering

### 1. Serialize Access (Simple but Limiting)

```bash
# Use flock to ensure only one app uses Ollama at a time
flock -x /var/lock/ollama.lock -c "my-llm-task.sh"
```

**Pros:** Zero code changes, works today  
**Cons:** Apps block each other, no parallelism

### 2. Single Model Policy

Pick one model and stick with it. All apps use `qwen3:32b` regardless of task complexity.

```bash
export OLLAMA_KEEP_ALIVE="24h"  # Don't unload
export OLLAMA_MAX_LOADED_MODELS=1  # Only one at a time
```

**Pros:** Eliminates model switching entirely  
**Cons:** Overkill for simple tasks, wastes resources

### 3. Two Ollama Instances (GPU Isolation)

Run separate Ollama instances, each pinned to one GPU:

```bash
# Instance 1 - GPU 0, port 11434 (large models)
CUDA_VISIBLE_DEVICES=0 ollama serve --port 11434

# Instance 2 - GPU 1, port 11435 (small models)
CUDA_VISIBLE_DEVICES=1 ollama serve --port 11435
```

**Pros:** Complete isolation, no interference  
**Cons:** Can't span models across GPUs, max model size = 32GB

### 4. LLM Proxy Service (Best for Multi-App)

Build a thin coordination layer that:
- Accepts requests from any app
- Queues requests if a model switch is in progress
- Manages model loading/unloading atomically
- Exposes the same Ollama API (transparent to apps)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  App A      │     │  App B      │     │  App C      │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
                    ┌──────▼──────┐
                    │  LLM Proxy  │
                    │  (queue +   │
                    │   mutex)    │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │   Ollama    │
                    │ (GPU 0 + 1) │
                    └─────────────┘
```

**Pros:** Full multi-GPU spanning, coordinated access, transparent to apps  
**Cons:** Another service to build and maintain

## Monitoring: Know Before It Breaks

After this incident, we added monitoring to catch GPU fallback early:

```bash
# Check if models are actually on GPU
check_gpu_allocation() {
  vram=$(curl -s http://localhost:11434/api/ps | jq '.models[0].size_vram')
  if [ "$vram" = "0" ] && [ "$vram" != "null" ]; then
    echo "WARNING: Model running on CPU, not GPU!"
    # Send alert
  fi
}
```

Also useful:
- `nvidia-smi dmon -s u` for real-time GPU utilization
- `OLLAMA_DEBUG=1` to see model loading details
- `journalctl -u ollama -f` for Ollama logs

## Lessons Learned

1. **Silent fallback is dangerous** — Ollama doesn't fail loudly when GPU allocation fails. Monitor `size_vram` in the `/api/ps` response.

2. **Multi-GPU spanning is fragile** — Works great when you're the only user. Breaks when multiple apps contend for the same GPUs.

3. **Restart fixes most GPU state issues** — When GPUs get into a weird state, a clean restart of Ollama (or the whole server) usually fixes it. Not elegant, but effective.

4. **Coordination is an unsolved problem** — There's no standard way for multiple local apps to share an LLM server. This is a gap in the local AI tooling ecosystem.

5. **Out-of-band management matters** — When the server is responsive but you can't log in, you need IPMI/iDRAC/ILO to recover. Consumer hardware without this is risky for headless servers.

## What We're Building Next

We're leaning toward option 4 (LLM Proxy) because we need:
- Multiple apps to coexist
- Large models that span both GPUs
- No app-side code changes

The proxy would be a simple queue-based coordinator: accept requests, ensure only one model is loaded at a time, batch requests to the same model when possible.

If you're running into similar issues, I'd love to hear how you're solving multi-app LLM coordination. The local AI ecosystem is still figuring this out.

---

*This post was written after a real debugging session at 8 AM when our GPU server decided fans at 100% was a reasonable operating mode. The server has since been forgiven.*
