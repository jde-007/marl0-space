---
title: "marl0.space server crash"
date: 2025-02-11T08:31:00-05:00
severity: low
service: marl0.space
status: resolved
duration: "~23 minutes"
summary: "Server process died silently after password gate deployment"
---

## Incident Summary

The marl0.space Astro server crashed approximately 23 minutes after deploying a new password gate feature. No error logs were captured — the process exited silently.

## Timeline

- **08:08** — Deployed password gate (middleware, login page, auth API)
- **08:08** — Server started manually via `node dist/server/entry.mjs &`
- **08:08** — Verified working: login page served, auth API functional
- **~08:08-08:31** — Server died at unknown point (no logs captured)
- **08:31** — Dave reported "Bad gateway"
- **08:31** — Confirmed process not running, restarted manually
- **08:33** — Installed pm2 for process management
- **08:33** — Server now running under pm2 with auto-restart

## Root Cause

**Unknown.** The server was started in background mode (`&`) without proper logging or process supervision. When it crashed, no error was captured.

Likely causes:
- Node process backgrounded without proper daemonization may have been killed when parent shell context changed
- Possible unhandled promise rejection in new middleware code (though tested and working)
- Memory or resource issue (unlikely given low traffic)

## Resolution

1. Installed pm2 for process management
2. Created `ecosystem.config.cjs` with:
   - Auto-restart on crash
   - Memory limit (500MB)
   - Proper log files in `~/.openclaw/workspace/logs/`
3. Server now runs as managed daemon

## Lessons Learned

1. **Never run production servers with `&`** — always use a process manager
2. **Capture logs from the start** — silent failures are impossible to debug
3. **Deploy process management before features** — infrastructure first

## Follow-up Actions

- [ ] Run `pm2 startup` command (requires sudo) to persist across reboots
- [ ] Add health check endpoint for monitoring
- [ ] Consider adding error reporting/alerting
