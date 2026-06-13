# Performance Checklist

- [x] **Static SSR shell** via TanStack Start — first paint is HTML, not a spinner
- [x] **Automatic code splitting** per route (TanStack Router Vite plugin)
- [x] **Lazy charts** — `TrendChart` and `CategoryDonut` are `React.lazy`, Recharts is not in the critical bundle
- [x] **Memoized derived state** (`useMemo`) for series, mix, recommendations
- [x] **System fonts as fallback**, web fonts loaded with `display=swap`
- [x] **Theme tokens** avoid runtime CSS-in-JS; Tailwind v4 emits one CSS file
- [x] **Service worker** caches the app shell — repeat loads are instant and work offline
- [x] **NetworkFirst HTML** prevents stale pages after deploy
- [x] **CacheFirst hashed assets** for sub-50 ms repeat loads
- [x] **No blocking third-party scripts**
- [x] **Images**: SVG icons via `lucide-react`, single PNG app icon, no hero photo on the dashboard
- [x] **Bundle hygiene**: no moment.js, no lodash; `date-fns` only used incidentally

## Targets

| Metric | Target |
| ------ | ------ |
| LCP    | ≤ 1.8s on mid-range mobile |
| TBT    | ≤ 150ms |
| CLS    | ≤ 0.05 |
| INP    | ≤ 100ms |
| Lighthouse Performance | 95+ |
