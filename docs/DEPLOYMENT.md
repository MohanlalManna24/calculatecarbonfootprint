# Deployment Guide

CarbonWise is a fully static front-end. Any modern static host works.

## Build

```bash
bun install
bun run build
```

The output lives in `.output/public` (TanStack Start's static build target).

## Hosts

### Cloudflare Pages / Vercel / Netlify

1. Connect the repository.
2. Build command: `bun run build`
3. Output directory: `.output/public`
4. No environment variables required.

### Self-host

Serve the output directory with any static server (nginx, Caddy, `npx serve`).
Make sure these files are reachable at the site root:

- `/sw.js`
- `/manifest.webmanifest`
- `/icon-512.png`

## PWA install

After deploying to HTTPS, visit the site once in Chrome/Edge/Safari — the
browser will offer "Install app" / "Add to Home Screen". The app then works
fully offline.

## Suggested headers

```
Cache-Control: public, max-age=31536000, immutable  # hashed assets
Cache-Control: no-cache                              # /index.html, /sw.js
Content-Security-Policy: (see docs/SECURITY.md)
```
