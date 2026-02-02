# Design System

## Direction

**Personality:** Precision & Density
**Foundation:** Cool (Slate)
**Depth:** Borders-only

## Tokens

### Spacing
Base: 4px
Scale: [4, 8, 12, 16, 24, 32, 48, 64]

### Colors
--foreground: #0f172a (slate-900)
--secondary: #475569 (slate-600)
--muted: #94a3b8 (slate-400)
--faint: #e2e8f0 (slate-200)
--border: #cbd5e1 (slate-300)
--accent: #2563eb (blue-600)
--accent-fg: #ffffff
--bg-app: #f8fafc (slate-50)
--bg-panel: #ffffff

### Radius
Scale: [2px, 4px, 6px]

### Typography
Font: System-ui, sans-serif
Scale: 11, 12, 13 (base), 14, 16, 20
Weights: 400 (regular), 500 (medium), 600 (semibold)

## Patterns

### Kanban Card
- Border: 1px solid var(--border)
- Padding: 8px 12px
- Radius: 4px
- Background: var(--bg-panel)
- Shadow: None

### CLI Output
- Font: Monospace
- Color: var(--secondary)

## Decisions

| Decision | Rationale | Date |
|----------|-----------|------|
| Bun + No-Build | Speed of development and execution. No compilation step for frontend. | 2026-02-01 |
| HTMX | Simple interactions without complex state management. | 2026-02-01 |
| Borders-only | Technical, clean look for a roadmap visualization tool. | 2026-02-01 |
