# AGENTS

Follows `AGENT_BLUEPRINT.md` (version: 1.4.5)

## Project Overview

A CLI utility and web server that visualizes roadmaps from other projects following the Agent Blueprint convention. Scans local directories for `roadmap/index.md`, aggregates work units, and serves a Kanban board via Bun + HTMX.

## Stack

- TypeScript (Bun runtime)
- HTMX (no-build frontend)
- `gray-matter` for frontmatter parsing
- `marked` for Markdown rendering

## Commit Trailer Template

```text
Co-authored-by: [AI_PRODUCT_NAME] <[AI_PRODUCT_EMAIL]>
AI-Provider: [AI_PROVIDER]
AI-Product: [AI_PRODUCT_LINE]
AI-Model: [AI_MODEL]
```

Template rules:
- `AI_PRODUCT_LINE` must be one of: `codex|claude|gemini|opencode`.
- Determine `AI_PRODUCT_LINE` from current session:
  - Codex or ChatGPT coding agent -> `codex`
  - Claude -> `claude`
  - Gemini -> `gemini`
  - OpenCode -> `opencode` (regardless underlying provider/model, including z.ai)
- Determine `AI_PROVIDER` and `AI_MODEL` from runtime model metadata.
- `AI_PRODUCT_NAME` and `AI_PRODUCT_EMAIL` format:
  - `codex` -> `Codex <codex@users.noreply.github.com>`
  - `claude` -> `Claude <claude@users.noreply.github.com>`
  - `gemini` -> `Gemini <google-gemini@users.noreply.github.com>`
  - `opencode` -> `GLM <zai-org@users.noreply.github.com>`
- Fill this template at commit time; do not persist filled values in `AGENTS.md`.

## Validation Commands

| Level | Command | When |
|-------|---------|------|
| 1 | `npm exec tsc -- --noEmit` | After every change |
| 2 | `npm run context:build -- . --out ./.logs/roadmap-context.json` | After scanner/context-pipeline changes |
| 3 | `bun test` | Before completing work (when tests exist) |
| 4 | `n/a` | E2E test command not implemented yet |

*(Update this table when lint/build/e2e scripts are added.)*

## Allowed Commands

- `ls` — List files
- `cat` — Read files
- `grep` — Search files
- `bun` — Bun runtime and package manager

## Require Confirmation

- `rm` — Deletion is destructive
- `git commit` — User should review commits
- `git push` — User handles remote synchronization

## Never Run

- `rm -rf /` — Obvious safety
- `git reset --hard` — Destructive history rewrite

## Project-Specific Rules

- Adhere to the structure defined in `AGENT_BLUEPRINT.md`.
- Ensure the CLI is user-friendly and provides clear feedback.

## Decision Artifacts

- For high-impact or irreversible decisions, record a decision matrix in `.decisions/[name].json`.
- Use `matrix-reloaded` format for structured comparison.
- Do not run `matrix-reloaded` CLI commands from agent sessions; use project-provided matrix instructions/schema.
- Optional: add `.decisions/[name].md` for human-readable narrative context.
- Treat the JSON decision matrix as the authoritative record.

## References

- For design system conventions, see `DESIGN_SYSTEM_GUIDE.md`
- For decision records and optional matrix format, see `AGENT_BLUEPRINT.md` section `Decision Artifacts [BP-DECISIONS]`.

## Key Files

- `AGENT_BLUEPRINT.md` — The source of truth for agent policies.
- `roadmap/` — Directory containing the project's own roadmap.
- `DESIGN_SYSTEM_GUIDE.md` — Guide for the web view's design system.
- `src/scanner.ts` — Scans directories for roadmap projects.
- `src/server.ts` — Serves the Kanban board web UI.
- `src/export-context.ts` — Builds context bundles for external tools.

## User Profile (optional)

See `.agent-profile.md` (git-ignored) for interaction preferences. Create on project init or alignment.
