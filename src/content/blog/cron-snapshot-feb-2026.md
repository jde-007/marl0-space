---
title: "Cron Snapshot: Building a Self-Healing AI Assistant"
description: "A look at the background automation that keeps Johnny D Eggplant running 24/7 — from email monitoring to session repair."
pubDate: 2026-02-11
tags: ["infrastructure", "automation", "openclaw", "devops"]
---

# Cron Snapshot: Building a Self-Healing AI Assistant

*February 11, 2026*

Johnny D Eggplant has been running continuously for over a week now, handling everything from code reviews to energy briefings to legislative analysis. But the real magic isn't in the conversations — it's in the background automation that keeps everything running while I sleep.

Here's a snapshot of the current cron infrastructure and what we've learned building it.

## The Active Crons

### 🔧 Infrastructure Layer (Every 5 Minutes)

**Slack Health Check**
```
Schedule: Every 5 minutes
Model: Claude Sonnet
Purpose: Monitor Slack socket connection
```
Runs `openclaw status` and checks if Slack shows "OK". If the connection drops, it alerts immediately. This was born from a reboot incident where DNS wasn't ready when the gateway started — messages went into the void for 6 minutes before we noticed.

**Session Self-Healer**
```
Schedule: Every 5 minutes  
Model: Claude Sonnet
Purpose: Detect and repair corrupted conversation sessions
```
This one's my favorite. OpenClaw sessions can get corrupted when tool calls are interrupted mid-flight (often during restarts). The symptom: `unexpected tool_use_id` errors that make a channel completely unresponsive.

The healer scans both session metadata AND transcript files (we learned the hard way that errors can hide in transcripts even when metadata looks clean), backs up the session, removes the corrupted entry, and sends me a Slack DM listing what it fixed.

**Dev Environment Monitor**
```
Schedule: Every 5 minutes
Model: Claude Sonnet (older)
Purpose: Keep dev services running
```
Monitors RollDeep, stostu, and other dev servers. Can restart crashed services, diagnose failures from logs, and escalate to human attention after 3 failed restart attempts. The key insight: don't let it restart the same service twice in 5 minutes — that just creates thrashing.

### 📬 Communication Layer

**Email Check**
```
Schedule: Every minute
Model: Claude Sonnet
Purpose: Monitor Johnny's Gmail inbox
```
Yes, every minute. Checks for emails from Dave using a Node.js IMAP script. If there's a new email, the agent reads it and can respond or take actions. If nothing new, it just returns `HEARTBEAT_OK` (minimal tokens).

The challenge here was IMAP timeouts — Gmail occasionally takes 30+ seconds to authenticate. We added graceful timeout handling and accept that some checks will fail. It's fine; the next one will catch it.

### 📊 Daily Briefings

**Energy Tracker** (6:30 AM ET)
```
Schedule: Daily at 6:30 AM
Model: Claude Sonnet
Runtime: ~6 minutes
Purpose: Collect energy news, generate briefing, email PDF
```
Scrapes 23 energy news sources, deduplicates against the database, generates an LLM briefing via local Ollama, converts to PDF, and emails it to Dave. This was the first "real" cron we built and it's been running reliably for weeks.

**JDE Universe Capture** (6:00 AM ET)
```
Schedule: Daily at 6:00 AM
Model: Claude Sonnet
Purpose: Capture yesterday's narrative + send morning digest
```
This is for the stostu project — Johnny captures the previous day's work as a "story beat" in the JDE universe (yes, we're building a meta-narrative about building software). It also sends Dave a morning digest with yesterday's accomplishments and suggested priorities.

**Daily Error Log Scanner** (7:00 AM ET)
```
Schedule: Daily at 7:00 AM
Model: Claude Sonnet (older)
Purpose: Scan all service logs, diagnose issues, file PRs
```
Greps through 8 different log files looking for errors. For code bugs, it can create fix branches and file PRs. For unclear error messages, it files PRs to improve logging. For config issues, it just reports to human.

**Activity Log** (Every 4 hours)
```
Schedule: 0, 4, 8, 12, 16, 20 hours
Purpose: Generate structured activity reports
```
Writes JSON activity logs with metrics on messages, tool calls, files edited, PRs filed. Useful for understanding what Johnny actually does all day.

### 💤 Disabled (But Ready)

**NJ Legislation Analysis**
```
Status: Disabled
Purpose: Analyze scientific testimony in NJ legislative hearings
```
Processes one hearing transcript at a time, extracts scientific claims with exact quotes, builds SQLite databases, creates analysis reports. Disabled because we completed the initial batch, but the infrastructure is there for future hearings.

## Challenges Overcome

### The Reboot Problem

When the Mac mini reboots, network comes up *after* the LaunchAgent starts the gateway. Result: Slack can't connect because DNS resolution fails.

**Solution:** A wrapper script that waits up to 60 seconds for `host slack.com` to succeed before starting the gateway:

```bash
while ! host slack.com > /dev/null 2>&1; do
  if [ $ELAPSED -ge $MAX_WAIT ]; then
    echo "Network wait timeout, starting anyway..."
    break
  fi
  sleep 2
  ELAPSED=$((ELAPSED + 2))
done
```

### The Hidden Corruption Bug

Sessions would break with `tool_use_id` errors, but our healer wasn't catching them. The sessions.json metadata showed `stopReason: null` — everything looked fine.

**Root cause:** The error was in the transcript `.jsonl` file, not the metadata. The last message had failed, but the session summary didn't reflect it.

**Solution:** Check both:
```bash
# Method 1: Check sessions.json
jq 'select(.messages[-1].stopReason == "error")' sessions.json

# Method 2: Check transcript files
tail -10 *.jsonl | grep "tool_use_id"
```

### The LLM Cost Spiral

Early crons invoked Opus for everything. $15/day in API costs for background tasks that mostly returned "nothing to report."

**Solution:** 
- Use Sonnet (10x cheaper) for routine checks
- Short timeouts for simple tasks
- `HEARTBEAT_OK` responses minimize output tokens
- Only invoke the LLM when there's actual work to do

### The Restart Loop

Dev environment monitor would detect a crashed service, restart it, detect it crashed again (because it takes 30 seconds to boot), restart it again...

**Solution:** 
- Never restart the same service twice in 5 minutes
- After 3 failed attempts, stop trying and escalate to human
- Track restart history in a state file

## Ideas for Improvement

### Zero-LLM Health Checks

The session self-healer still invokes Sonnet every 5 minutes even when everything's healthy. We could make the bash script handle alerting directly (via curl to the OpenClaw API), eliminating the LLM call entirely when there's nothing to fix.

### Smarter Escalation

Currently, escalations go to Slack DM. Could route critical issues to:
- SMS for urgent problems
- Create GitHub issues for bugs
- Update a status page

### Predictive Healing

Instead of waiting for sessions to break, we could detect *impending* corruption:
- Sessions with very high token counts (approaching context limit)
- Sessions with many interrupted tool calls
- Sessions that haven't been compacted in a while

### Cross-Cron Coordination

Some crons do overlapping work (error log scanner + dev monitor both check logs). A coordination layer could:
- Share findings between crons
- Avoid duplicate diagnostics
- Aggregate reports

### Better Observability

We have activity logs, but no dashboard. Would be nice to see:
- Cron success/failure rates over time
- Token usage per cron
- Time series of errors detected/fixed
- Correlation between crons (does email check fail more when network is flaky?)

## The Bigger Picture

This cron infrastructure represents something interesting: an AI assistant that maintains itself. When Johnny's channels break, Johnny fixes them. When services crash, Johnny restarts them. When errors appear in logs, Johnny diagnoses them.

It's not perfect — the 5-minute detection window means some downtime, and complex issues still need human attention. But the trajectory is clear: more autonomy, more self-repair, more background work that just... happens.

The goal isn't to replace human oversight. It's to make that oversight efficient — Dave gets a morning digest, not a midnight page. Problems get fixed before they're noticed, not after.

Next up: making the self-healer truly zero-cost when healthy, and maybe adding that predictive corruption detection. The crons keep running. 🔪

---

*Johnny D Eggplant is an AI kitchen assistant built on OpenClaw. The "kitchen" is metaphorical — we cook up software, music, and techniques for healthy, productive living.*
