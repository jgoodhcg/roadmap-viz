# Decision: SSR Data Injection Strategy

**Status:** accepted
**Date:** 2026-02-01
**Author:** Gemini (gemini-2.0-flash-thinking-exp-01-21)

## Context

The `roadmap-viz` tool needs to display a lightweight Kanban board of roadmap items, but also allow users to click a card to see the full, rendered Markdown body (Detail View).

Since we are using Server-Side Rendering (SSR) with Bun (no client-side fetching/API for details), we must send *all* content to the client in the initial HTML payload.

We needed to decide how to deliver this "heavy" Markdown content (HTML) to the client without degrading performance.

## Options

### Option A: Hidden DOM Elements
Render every work unit's full body into the HTML as hidden `<div>` elements.
```html
<div id="detail-1" style="display:none"><h1>Full Content...</h1></div>
```
- **Pros:** Simple to implement; SEO friendly; no JS serialization needed.
- **Cons:** **High DOM Cost.** The browser must parse, create, and style (even if hidden) thousands of DOM nodes on load. For 100+ items, this creates significant memory overhead and layout thrashing.

### Option B: JSON Data Injection (Selected)
Serialize the rendered HTML bodies into a single JSON object, injected into a `<script type="application/json">` tag.
```html
<script type="application/json" id="server-data">{"item-1": "<h1>Full Content...</h1>"}</script>
```
- **Pros:** **Lazy DOM Creation.** The browser treats the content as a single text string until accessed. DOM nodes for the modal are only created when the user clicks a card.
- **Cons:** Slightly more complex serialization (requires `JSON.stringify`); requires client-side `JSON.parse`.

## Decision

We chose **Option B (JSON Data Injection)**.

## Rationale

Performance (Browser CPU/Memory) is the deciding factor. While the *network payload size* is identical for both options, the **DOM Tax** of Option A is too high.

Roadmap items often contain complex Markdown (tables, lists, code blocks). Creating thousands of these elements invisible on page load is wasteful. Option B allows us to transfer the data efficiently (as text) and only incur the DOM creation cost for the single item the user is currently viewing.

## Consequences

- We must ensure safe serialization using `JSON.stringify` on the server and `JSON.parse` on the client to avoid syntax errors (handled via the `<script type="application/json">` pattern).
- The client-side script is responsible for "hydrating" the modal from this data store.
