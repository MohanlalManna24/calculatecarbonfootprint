import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Leaf, Sparkles, Target, ShieldCheck, WifiOff } from "lucide-react";
import { useStore } from "@/lib/carbonwise/store";
import { makeId } from "@/lib/carbonwise/storage";
import { profileSchema } from "@/lib/carbonwise/schemas";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CarbonWise AI — Personal carbon footprint, demystified" },
      {
        name: "description",
        content:
          "Track, understand, and reduce your carbon footprint. Private by design, works offline, no account required.",
      },
      { property: "og:title", content: "CarbonWise AI" },
      {
        property: "og:description",
        content: "Personal carbon footprint tracking that runs entirely on your device.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { store, setProfile } = useStore();
  const navigate = useNavigate();
  const [name, setName] = useState(store.profile?.name ?? "");
  const [error, setError] = useState<string | null>(null);

  function start(e: React.FormEvent) {
    e.preventDefault();
    const parsed = profileSchema.safeParse({
      id: store.profile?.id ?? makeId(),
      name: name.trim() || "Guest",
      country: "Global",
      householdSize: 1,
      createdAt: store.profile?.createdAt ?? new Date().toISOString(),
      theme: "system",
    });
    if (!parsed.success) {
      setError("Name must be 1–60 characters.");
      return;
    }
    setProfile(parsed.data);
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-full bg-primary text-primary-foreground">
            <Leaf className="size-4" aria-hidden />
          </span>
          <span className="font-display text-lg tracking-tight">CarbonWise</span>
        </div>
        {store.profile && (
          <Link
            to="/dashboard"
            className="rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
          >
            Open dashboard
          </Link>
        )}
      </header>

      <section className="mx-auto grid max-w-6xl gap-12 px-4 pb-16 pt-10 sm:px-6 md:grid-cols-[1.1fr_1fr] md:gap-16 md:pt-20">
        <div>
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
            <span className="size-1.5 rounded-full bg-success" aria-hidden /> Local-first · No
            account
          </p>
          <h1 className="font-display text-5xl leading-[1.05] text-balance md:text-7xl">
            Your carbon, <em className="not-italic text-primary">measured</em>. Your habits,{" "}
            <em className="not-italic text-accent">transformed</em>.
          </h1>
          <p className="mt-6 max-w-xl text-pretty text-lg text-muted-foreground">
            CarbonWise turns everyday choices — a commute, a meal, a flight — into clear numbers,
            personalized recommendations, and goals you can actually keep.
          </p>

          <form onSubmit={start} className="mt-8 flex max-w-md flex-col gap-3 sm:flex-row">
            <label htmlFor="name" className="sr-only">
              Your name
            </label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name (or just 'Guest')"
              maxLength={60}
              className="flex-1 rounded-full border border-input bg-card px-5 py-3 text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <button
              type="submit"
              className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Start tracking
            </button>
          </form>
          {error && (
            <p role="alert" className="mt-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <ul className="mt-10 grid gap-4 sm:grid-cols-2">
            {[
              {
                icon: Sparkles,
                t: "Personalized insights",
                d: "Recommendations tuned to your emission mix.",
              },
              {
                icon: Target,
                t: "Goals that stick",
                d: "Weekly targets per category, with progress.",
              },
              { icon: ShieldCheck, t: "Private by design", d: "Everything stored on your device." },
              { icon: WifiOff, t: "Works offline", d: "Installable PWA, no connection required." },
            ].map(({ icon: Icon, t, d }) => (
              <li key={t} className="flex gap-3 rounded-2xl border border-border bg-card p-4">
                <Icon className="mt-0.5 size-5 text-primary" aria-hidden />
                <div>
                  <p className="font-medium">{t}</p>
                  <p className="text-sm text-muted-foreground">{d}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <aside aria-label="Preview" className="relative">
          <div className="sticky top-10 overflow-hidden rounded-3xl border border-border bg-card shadow-[0_30px_80px_-40px_rgba(31,77,58,0.35)]">
            <div className="border-b border-border bg-secondary/60 px-6 py-4">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">This week</p>
              <p className="font-display text-3xl text-foreground">
                42.8 <span className="text-base text-muted-foreground">kg CO₂e</span>
              </p>
              <p className="mt-1 text-xs text-success">↓ 18% vs last week</p>
            </div>
            <div className="space-y-3 p-6">
              {[
                { c: "Transport", v: 22.1, pct: 52, color: "bg-primary" },
                { c: "Food", v: 10.4, pct: 24, color: "bg-accent" },
                { c: "Energy", v: 7.2, pct: 17, color: "bg-success" },
                { c: "Other", v: 3.1, pct: 7, color: "bg-chart-4" },
              ].map((r) => (
                <div key={r.c}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-muted-foreground">{r.c}</span>
                    <span className="text-foreground">{r.v} kg</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className={`h-full ${r.color}`} style={{ width: `${r.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6 text-xs text-muted-foreground sm:px-6">
          <p>© {new Date().getFullYear()} CarbonWise AI</p>
          <p>Local-first · PWA · Open data</p>
        </div>
      </footer>
    </div>
  );
}
