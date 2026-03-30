@AGENTS.md

# Shell Usage

- Never use compound `cd && command` in Bash tool calls. Run commands directly since the working directory is already correct.
- NEVER use `git -C <path>` to specify the working directory. You are already in the correct working directory, so just run `git` commands directly.
