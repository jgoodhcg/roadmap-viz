---
title: "Interactive Kanban (Drag & Drop)"
status: planned
description: "Enable drag-and-drop support to move cards between columns and update their status/tags on disk."
tags: [type/feature, area/frontend, area/backend]
priority: high
effort: L
created: 2026-02-01
updated: 2026-02-01
depends-on: ["01-mvp.md"]
---

# Interactive Kanban (Drag & Drop)

## Problem / Intent

Currently, the Kanban board is read-only. To manage work effectively, users need to prioritize and track progress by moving cards between columns (Backlog -> Queue -> Focus -> Done).

## Constraints

- **Persistence:** Changes must be written back to the source Markdown files.
- **Safety:** Must handle file moves (archiving) and frontmatter updates without data loss.
- **UX:** Instant feedback in the UI.

## Proposed Approach

1.  **Frontend (SortableJS)**:
    - Use `SortableJS` to make `.column` elements interactive.
    - Connect all columns into a shared group.
    - On `onEnd` event, trigger an API call.

2.  **API (`POST /api/move`)**:
    - Accepts: `project`, `file`, `targetColumn`.
    - Logic:
        - **Backlog**: Set `status: planned`, remove `focus` tag.
        - **Queue**: Set `status: active`, remove `focus` tag.
        - **Focus**: Set `status: active`, **add** `focus` tag.
        - **Done**: Set `status: done`, remove `focus` tag. **Move file to `archived/`**.

3.  **Backend (File Operations)**:
    - Use `gray-matter` to read/modify/write frontmatter.
    - Use `fs.rename` for archiving/un-archiving.

## Open Questions

- **Concurrency:** Simple file locking or just hope for the best? (Start with "hope", add locking if needed).
- **Undo:** Should we support undo? (Not for MVP).

## Notes

- Moving out of "Done" requires checking `archived/` and moving the file back to `roadmap/`.
