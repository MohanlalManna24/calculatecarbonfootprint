import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { AppShell } from "@/components/carbonwise/AppShell";
import { useStore } from "@/lib/carbonwise/store";
import { byCategory, recommend, totalCo2e, withinDays } from "@/lib/carbonwise/engine";

export const Route = createFileRoute("/insights")({
  head: () => ({
    meta: [
      { title: "Insights · CarbonWise" },
      { name: "description", content: "Personalized analysis of your carbon habits." },
    ],
  }),
  component: Insights,
});

function Insights() {
  const { store } = useStore();
  const recs = useMemo(() => recommend(store.entries), [store.entries]);
  const mix = useMemo(() => byCategory(withinDays(store.entries, 30)), [store.entries]);
  const monthly = totalCo2e(withinDays(store.entries, 30));
  const annualised = Math.round(monthly * 12);

  return (
    <AppShell>
      <h1 className="font-display text-4xl">Insights</h1>
      <p className="mt-2 text-muted-foreground">A monthly view of your habits and where to focus next.</p>

      <section className="mt-8 grid gap-6 md:grid-cols-3">
        <article className="rounded-3xl border border-border bg-card p-6">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Last 30 days</p>
          <p className="mt-1 font-display text-4xl">{monthly.toFixed(1)} <span className="text-base text-muted-foreground">kg</span></p>
        </article>
        <article className="rounded-3xl border border-border bg-card p-6">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Annualised pace</p>
          <p className="mt-1 font-display text-4xl">{annualised.toLocaleString()} <span className="text-base text-muted-foreground">kg / yr</span></p>
        </article>
        <article className="rounded-3xl border border-border bg-card p-6">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Top category</p>
          <p className="mt-1 font-display text-4xl capitalize">
            {Object.entries(mix).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—"}
          </p>
        </article>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl">Recommendations</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {recs.map((r) => (
            <li key={r.id} className="rounded-2xl border border-border bg-card p-5">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">{r.category}</p>
              <p className="mt-1 font-medium">{r.title}</p>
              {r.impactKg > 0 && <p className="mt-2 text-sm text-success">~ saves {r.impactKg} kg CO₂e / month</p>}
            </li>
          ))}
        </ul>
      </section>
    </AppShell>
  );
}
