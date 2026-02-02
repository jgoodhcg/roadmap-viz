---
title: "MVP: CLI Scanner & Kanban Board"
status: active
description: "Implement the core CLI to scan projects and serve a web-based Kanban board."
tags: [type/feature, area/cli, area/frontend]
priority: high
created: 2026-02-01
updated: 2026-02-01
---

# MVP: CLI Scanner & Kanban Board

## Problem / Intent

We need a way to aggregate roadmap data from multiple local projects (`~/projects`, `~/projects/games`) and visualize them in a unified Kanban board.

## Constraints

- **Runtime:** Bun
- **Frontend:** No-build JS, HTMX
- **Design:** Precision & Density (System fonts, Slate colors, Borders)
- **Input:** Local file system scanning for `roadmap/index.md`

## Proposed Approach

1.  **Initialize Project**:
    - `bun init` to create `package.json`.
    - Install `gray-matter` for parsing frontmatter.
    - Set up `.gitignore`.

2.  **CLI Entrypoint (`src/index.ts`)**:
    - Use `bun` to run.
    - Accept optional args for custom paths (default to `~/projects`, `~/projects/games`).
    - Use `readdir` to scan directories.

3.  **Scanner Logic (`src/scanner.ts`)**:
    - Recursively (limit depth) check directories for `roadmap/index.md`.
    - Parse frontmatter from `index.md` and `*.md` in `roadmap/`.
    - Return a typed structure: `Project[]`.

4.  **Server (`src/server.ts`)**:
    - `Bun.serve` to host static assets and API.
    - Endpoint `/api/roadmaps` returns aggregated JSON.
    - Route `/` serves the `index.html`.

5.  **Frontend (`public/index.html`)**:
    - Use `<script src="https://unpkg.com/htmx.org"></script>`.
    - CSS variables from Design System.
    - **Kanban Layout**:
        - Columns: Backlog (Idea/Planned), In Progress (Active/Paused), Done.
        - Grouped by Project.

## Open Questions

- Depth of scanning? (Assume immediate children of the target folders for now).
- Handling large numbers of projects?

## Notes

- Uses `gray-matter` or similar for frontmatter parsing (or a simple regex if we want zero deps, but a library is safer).
