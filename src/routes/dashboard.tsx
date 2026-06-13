import { createFileRoute, Link } from "@tanstack/react-router";
import { lazy, Suspense, useMemo } from "react";
import { AppShell } from "@/components/carbonwise/AppShell";
import { useStore } from "@/lib/carbonwise/store";
import { byCategory, dailySeries, recommend, totalCo2e, withinDays } from "@/lib/carbonwise/engine";
import { TrendingDown, TrendingUp, Sparkles, PlusCircle } from "lucide-react";

const TrendChart = lazy(() => import("@/components/carbonwise/TrendChart"));
const CategoryDonut = lazy(() => import("@/components/carbonwise/CategoryDonut"));

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard · CarbonWise" },
      { name: "description", content: "Your weekly carbon footprint at a glance." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { store } = useStore();
  const week = useMemo(() => withinDays(store.entries, 7), [store.entries]);
  const prev = useMemo(() => withinDays(store.entries, 14).filter((e) => new Date(e.date).getTime() < Date.now() - 7 * 86400000), [store.entries]);
  const weekTotal = totalCo2e(week);
  const prevTotal = totalCo2e(prev);
  const delta = prevTotal === 0 ? 0 : Math.round(((weekTotal - prevTotal) / prevTotal) * 100);
  const mix = useMemo(() => byCategory(withinDays(store.entries, 30)), [store.entries]);
  const series = useMemo(() => dailySeries(store.entries, 30), [store.entries]);
  const recs = useMemo(() => recommend(store.entries), [store.entries]);

  return (
    <AppShell>
      <section className="mb-8">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">This week</p>
        <h1 className="mt-1 font-display text-5xl">
          {weekTotal.toFixed(1)} <span className="text-xl text-muted-foreground">kg CO₂e</span>
        </h1>
        <p className={`mt-1 inline-flex items-center gap-1 text-sm ${delta <= 0 ? "text-success" : "text-destructive"}`}>
          {delta <= 0 ? <TrendingDown className="size-4" /> : <TrendingUp className="size-4" />}
          {delta === 0 ? "No change" : `${Math.abs(delta)}% vs last week`}
        </p>
      </section>

      <div className="grid gap-6 md:grid-cols-3">
        <article className="rounded-3xl border border-border bg-card p-6 md:col-span-2">
          <header className="mb-4 flex items-baseline justify-between">
            <h2 className="font-display text-xl">30-day trend</h2>
            <span className="text-xs text-muted-foreground">kg CO₂e / day</span>
          </header>
          <Suspense fallback={<div className="h-56 animate-pulse rounded-xl bg-muted" />}>
            <TrendChart data={series} />
          </Suspense>
        </article>

        <article className="rounded-3xl border border-border bg-card p-6">
          <h2 className="mb-4 font-display text-xl">Where it comes from</h2>
          {totalCo2e(Object.entries(mix).map(([k, v]) => ({ id: k, date: new Date().toISOString(), category: "energy" as const, activity: k, amount: 0, unit: "", co2e: v }))) === 0 ? (
            <p className="text-sm text-muted-foreground">No data yet. <Link to="/track" className="text-primary underline-offset-2 hover:underline">Log your first activity →</Link></p>
          ) : (
            <Suspense fallback={<div className="h-56 animate-pulse rounded-xl bg-muted" />}>
              <CategoryDonut data={mix} />
            </Suspense>
          )}
        </article>
      </div>

      <section className="mt-8 rounded-3xl border border-border bg-card p-6">
        <header className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display text-xl">
            <Sparkles className="size-5 text-accent" aria-hidden /> Personalized for you
          </h2>
          <Link to="/insights" className="text-sm text-primary hover:underline">All insights →</Link>
        </header>
        <ul className="grid gap-3 sm:grid-cols-2">
          {recs.map((r) => (
            <li key={r.id} className="rounded-2xl border border-border bg-background p-4">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">{r.category}</p>
              <p className="mt-1 font-medium">{r.title}</p>
              {r.impactKg > 0 && <p className="mt-2 text-sm text-success">~ saves {r.impactKg} kg CO₂e / month</p>}
            </li>
          ))}
        </ul>
      </section>

      <Link to="/track" className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90">
        <PlusCircle className="size-4" /> Log an activity
      </Link>
    </AppShell>
  );
}
