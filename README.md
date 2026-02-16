# roadmap-viz

Build a local context bundle from roadmap files across projects, then use that bundle for prioritization work in Codex.

## Local Config (Not Committed)

Create `roadmap-sources.json` from `roadmap-sources.example.json`:

```json
{
  "scanPaths": [
    "~/projects",
    "~/projects/games"
  ]
}
```

`roadmap-sources.json` is gitignored on purpose.

## Build Context Bundle

```bash
# Uses scan paths from roadmap-sources.json (if present) or defaults
npm run context:build

# Override scan paths ad hoc
npm run context:build -- ~/projects ~/projects/games

# Custom sources file
npm run context:build -- --sources ./roadmap-sources.json

# Override output path (default: .logs/roadmap-context.json)
npm run context:build -- --out ./.logs/roadmap-context.json

# Include full markdown body instead of summaries
npm run context:build -- --full-body
```

Default output is `.logs/roadmap-context.json` (already gitignored).
