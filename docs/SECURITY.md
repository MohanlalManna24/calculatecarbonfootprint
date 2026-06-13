# Security Checklist (client-only app)

Because CarbonWise has **no backend**, classic server threats (SQLi, auth,
RBAC, secure cookies, server-side logging) do not apply. We replace them
with client-side guarantees:

- [x] **Strict TypeScript** (`strict: true`) on the entire codebase
- [x] **Zod validation on every form** (`track`, `goals`, profile) via `@hookform/resolvers/zod`
- [x] **Schema validation at storage boundary** — `loadStore` re-parses every payload with Zod and quarantines corrupted blobs under a timestamped key
- [x] **Versioned data model** (`STORAGE_VERSION`) with forward migration hook
- [x] **No `dangerouslySetInnerHTML`** anywhere in the codebase
- [x] **All user text rendered as React children** (auto-escaped) — no `innerHTML`, no `eval`, no `Function()`
- [x] **Input length caps** on every text field (name 60, note 280, title 80, amount ≤ 100 000)
- [x] **No third-party analytics or trackers**
- [x] **Service Worker scope locked to same-origin** and skips non-GET / cross-origin
- [x] **Preview guard** on `registerServiceWorker` prevents stale caches in Lovable preview iframes
- [x] **Error boundaries** at the route root (`errorComponent` + `notFoundComponent`)
- [x] **CSP-friendly**: no inline scripts, no `eval`, fonts loaded over HTTPS from Google Fonts

## Suggested production CSP

```
default-src 'self';
img-src 'self' data:;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com;
script-src 'self';
connect-src 'self';
manifest-src 'self';
worker-src 'self';
```
