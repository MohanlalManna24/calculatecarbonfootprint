import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/carbonwise/AppShell";
import { useStore } from "@/lib/carbonwise/store";
import { ACHIEVEMENTS } from "@/lib/carbonwise/engine";
import { Award, Lock } from "lucide-react";

export const Route = createFileRoute("/achievements")({
  head: () => ({
    meta: [
      { title: "Achievements · CarbonWise" },
      { name: "description", content: "Milestones you've unlocked on your sustainability journey." },
    ],
  }),
  component: AchievementsPage,
});

function AchievementsPage() {
  const { store } = useStore();
  const unlocked = new Map(store.achievements.map((a) => [a.id, a.unlockedAt]));

  return (
    <AppShell>
      <h1 className="font-display text-4xl">Achievements</h1>
      <p className="mt-2 text-muted-foreground">Small wins, real momentum.</p>

      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ACHIEVEMENTS.map((a) => {
          const on = unlocked.get(a.id);
          return (
            <li key={a.id} className={`rounded-2xl border p-5 ${on ? "border-success/40 bg-card" : "border-border bg-card/60"}`}>
              <div className={`mb-3 grid size-10 place-items-center rounded-full ${on ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"}`}>
                {on ? <Award className="size-5" /> : <Lock className="size-5" />}
              </div>
              <h3 className="font-display text-lg">{a.title}</h3>
              <p className="text-sm text-muted-foreground">{a.desc}</p>
              {on && <p className="mt-2 text-xs text-success">Unlocked {new Date(on).toLocaleDateString()}</p>}
            </li>
          );
        })}
      </ul>
    </AppShell>
  );
}
