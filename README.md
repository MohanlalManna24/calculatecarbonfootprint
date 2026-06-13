# CarbonWise AI

Personal carbon-footprint tracking that runs entirely on your device. No account,
no backend, no telemetry. Built as a fast, accessible PWA you can install on any
phone or desktop and use offline.

## Highlights

- **Local-first**: every entry, goal, and achievement is stored in `localStorage`
  with Zod-validated schemas and corruption recovery.
- **Personalized**: 30-day emission mix drives recommendation and goal feedback.
- **Installable PWA**: manifest + service worker (network-first HTML,
  cache-first static assets), guarded against Lovable preview origins.
- **Accessible**: semantic HTML, focus rings, mobile tap targets ≥ 44 px,
  `min-h-dvh`, reduced-motion friendly, no `dangerouslySetInnerHTML`.

## Stack

TanStack Start + React 19 · TypeScript (strict) · Tailwind v4 · Zod ·
React Hook Form · Recharts · Vitest · jsdom · Testing Library.

> The brief originally asked for Next.js 15; this Lovable workspace runs on
> TanStack Start. All requested capabilities (typed routing, file-based routes,
> SSR, code splitting, PWA) are equivalent.

## Scripts

```bash
bun install        # install
bun run dev        # start dev server
bun run build      # production build
bunx vitest run    # run tests
```

## Project layout

```
src/
  components/carbonwise/   AppShell, lazy charts
  lib/carbonwise/
    schemas.ts             Zod schemas + types (versioned Store)
    storage.ts             Safe local/session wrappers (validate, migrate, recover)
    engine.ts              Emission factors, aggregation, recommendations, achievements
    store.tsx              React context + reducer over the storage layer
    pwa.ts                 Service-worker registration (preview-guarded)
  routes/                  index, dashboard, track, goals, achievements, insights
public/
  sw.js                    Service worker (NetworkFirst HTML, CacheFirst assets)
  manifest.webmanifest     PWA manifest
  icon-512.png             Maskable icon
tests/                     Vitest unit tests (engine, storage, schemas)
```

## Deployment

Any static host works (Vercel, Netlify, Cloudflare Pages, GitHub Pages):

1. `bun run build`
2. Serve the generated `.output/public` (or `dist`) directory.
3. Ensure `/manifest.webmanifest` and `/sw.js` are served from the site root.

See `docs/` for the accessibility, security, and performance checklists.
