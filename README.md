# roadmap-viz

A personal tool that scans local projects for roadmap files and renders them as a Kanban board in the browser.

I use [Agent Blueprint](AGENT_BLUEPRINT.md) across my projects — each one has a `roadmap/` directory with structured work units in Markdown. This tool aggregates those roadmaps and gives me a single view of everything in flight.

This isn't intended for mass adoption. It's a personal utility that happens to be public.

## Run the web server

```bash
bun run src/index.ts
```

Opens a local Kanban board at `http://localhost:3000` showing all discovered projects grouped by tabs.

## Build a context bundle

```bash
npm run context:build
```

Exports roadmap data as JSON for use with external tools (e.g. feeding context to Codex for prioritization). See `npm run context:build -- --help` for options.

## Local config

Create `roadmap-sources.json` (gitignored) to configure which directories to scan:

```json
{
  "scanPaths": ["~/projects", "~/projects/games"]
}
```

If absent, defaults to `~/projects` and `~/projects/games`.
