---
name: No compound shell commands
description: User requires avoiding cd && command compound shell commands - run commands directly
type: feedback
---

Never use compound `cd && command` in Bash tool calls.

**Why:** User explicitly corrected this pattern. The working directory is already set correctly, so `cd` is unnecessary and compound commands are unwanted.

**How to apply:** Always run git and other shell commands directly without `cd` prefixes. Use absolute paths if needed instead.
