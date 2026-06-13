# Accessibility Checklist

- [x] Single `<main>` per route (via `AppShell`)
- [x] Semantic landmarks: `<header>`, `<nav aria-label>`, `<main>`, `<footer>`
- [x] All interactive controls keyboard reachable with visible focus ring (`focus-visible:ring-2 focus-visible:ring-ring`)
- [x] Icon-only buttons have `aria-label`
- [x] Form inputs paired with `<label htmlFor>`; errors use `role="alert"`
- [x] Color is never the only signal (icons + text accompany status colors)
- [x] Tap targets ≥ 44 × 44 px on mobile bottom nav
- [x] `min-h-dvh` instead of `min-h-screen`
- [x] `lang="en"` on `<html>`
- [x] No `dangerouslySetInnerHTML`
- [x] Charts have surrounding text alternatives (numeric summary + category list)
- [x] Respects system dark mode via `.dark` variant
