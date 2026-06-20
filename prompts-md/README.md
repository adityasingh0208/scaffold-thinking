# Raw Prompt Files

These are the stage prompts as plain Markdown — no TypeScript required.

Use them by copy-pasting into your AI assistant configuration:
- **CLAUDE.md / AGENTS.md** (Claude Code)
- **`.cursorrules`** (Cursor)
- **`.github/copilot-instructions.md`** (GitHub Copilot)
- Any LLM chat interface

Each file uses `{{PLACEHOLDER}}` notation. Replace each placeholder with the actual value before sending to the model.

| File | Stage | When to use |
|------|-------|-------------|
| `clarify.md` | Clarify | After collecting the five Frame fields — generates decision-relevant questions |
| `diverge.md` | Diverge | After answering clarifications — generates 1-4 genuinely different options |
| `decide.md` | Decide | After picking an option — generates the Markdown decision brief |

The JSON schemas for structured output are embedded in `clarify.md` and `diverge.md`.
`decide.md` produces free-form Markdown and needs no schema.
