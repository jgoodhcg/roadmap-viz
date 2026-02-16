# AGENTS

Follows AGENT_BLUEPRINT.md

## Project Overview

A CLI utility to visualize roadmaps from other projects, providing a basic web view of the aggregated data.

## Validation Commands

| Level | Command | When |
|-------|---------|------|
| 1 | `npm exec tsc -- --noEmit` | After every change |
| 2 | `npm run context:build -- . --out ./.logs/roadmap-context.json` | After scanner/context-pipeline changes |
| 3 | `bun test` | Before completing work (when tests exist) |
| 4 | `n/a` | E2E test command not implemented yet |

*(Update this table when lint/build/e2e scripts are added.)*

## Allowed Commands

- `ls` - List files
- `cat` - Read files
- `grep` - Search files
- `npm` - Node package manager (if selected)

## Require Confirmation

- `rm` - Deletion is destructive
- `git commit` - User should review commits
- `git push` - User handles remote synchronization

## Never Run

- `rm -rf /` - Obvious safety
- `git reset --hard` - Destructive history rewrite

## Project-Specific Rules

- Adhere to the structure defined in `AGENT_BLUEPRINT.md`.
- Ensure the CLI is user-friendly and provides clear feedback.

## Key Files

- `AGENT_BLUEPRINT.md` - The source of truth for agent policies.
- `roadmap/` - Directory containing the project's own roadmap.
- `DESIGN_SYSTEM_GUIDE.md` - Guide for the web view's design system.
