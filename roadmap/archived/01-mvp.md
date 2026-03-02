---
title: "MVP: CLI Scanner & Kanban Board"
status: done
description: "Implement the core CLI to scan projects and serve a web-based Kanban board."
tags: [type/feature, area/cli, area/frontend]
priority: high
created: 2026-02-01
updated: 2026-03-02
---

# MVP: CLI Scanner & Kanban Board

## Intent

Aggregate roadmap data from multiple local projects (`~/projects`, `~/projects/games`) and visualize them in a unified Kanban board.

## Specification

1.  **CLI Entrypoint (`src/index.ts`)**:
    - Use `bun` to run.
    - Accept optional args for custom paths (default to `~/projects`, `~/projects/games`).
    - Use `readdir` to scan directories.

2.  **Scanner Logic (`src/scanner.ts`)**:
    - Recursively (limit depth) check directories for `roadmap/index.md`.
    - Parse frontmatter from `index.md` and `*.md` in `roadmap/`.
    - Return a typed structure: `Project[]`.

3.  **Server (`src/server.ts`)**:
    - `Bun.serve` to host static assets and API.
    - Endpoint `/api/roadmaps` returns aggregated JSON.
    - Route `/` serves the `index.html`.

4.  **Frontend (`public/index.html`)**:
    - Use `<script src="https://unpkg.com/htmx.org"></script>`.
    - CSS variables from Design System.
    - **Kanban Layout**:
        - Columns: Backlog (Idea/Planned), In Progress (Active/Paused), Done.
        - Grouped by Project.

## Validation

- [x] Scanner finds projects with `roadmap/index.md`
- [x] Frontmatter parsed correctly via `gray-matter`
- [x] `/api/roadmaps` returns aggregated JSON
- [x] Kanban board renders with correct columns and grouping

## Scope

- **Runtime:** Bun
- **Frontend:** No-build JS, HTMX
- **Design:** Precision & Density (System fonts, Slate colors, Borders)
- **Input:** Local file system scanning for `roadmap/index.md`

## Context

- Uses `gray-matter` for frontmatter parsing.
- Key files: `src/scanner.ts`, `src/server.ts`, `src/index.ts`, `public/index.html`.
