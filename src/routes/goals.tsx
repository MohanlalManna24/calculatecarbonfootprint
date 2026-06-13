import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Trash2 } from "lucide-react";
import { AppShell } from "@/components/carbonwise/AppShell";
import { useStore } from "@/lib/carbonwise/store";
import { goalProgress } from "@/lib/carbonwise/engine";
import { categoryEnum } from "@/lib/carbonwise/schemas";

export const Route = createFileRoute("/goals")({
  head: () => ({
    meta: [
      { title: "Goals · CarbonWise" },
      { name: "description", content: "Set weekly carbon targets and track your progress." },
    ],
  }),
  component: Goals,
});

const schema = z.object({
  title: z.string().trim().min(1).max(80),
  category: z.union([categoryEnum, z.literal("all")]),
  targetKgPerWeek: z.coerce.number().min(0).max(10000),
});
type FormValues = z.infer<typeof schema>;

function Goals() {
  const { store, addGoal, removeGoal } = useStore();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "Lower transport emissions",
      category: "transport",
      targetKgPerWeek: 30,
    },
  });

  function onSubmit(v: FormValues) {
    addGoal(v);
    reset();
  }

  return (
    <AppShell>
      <h1 className="font-display text-4xl">Sustainability goals</h1>
      <p className="mt-2 text-muted-foreground">
        Set a weekly carbon budget by category. We'll track progress automatically.
      </p>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-8 grid gap-4 rounded-3xl border border-border bg-card p-6 md:grid-cols-[1.4fr_1fr_1fr_auto]"
      >
        <div>
          <label htmlFor="title" className="text-sm font-medium">
            Goal
          </label>
          <input
            id="title"
            {...register("title")}
            maxLength={80}
            className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          {errors.title && (
            <p role="alert" className="text-sm text-destructive">
              {errors.title.message}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="category" className="text-sm font-medium">
            Category
          </label>
          <select
            id="category"
            {...register("category")}
            className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">All</option>
            {(["transport", "energy", "food", "shopping", "waste"] as const).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="target" className="text-sm font-medium">
            Target (kg/week)
          </label>
          <input
            id="target"
            type="number"
            step="0.1"
            min="0"
            {...register("targetKgPerWeek")}
            className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            className="w-full rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Add goal
          </button>
        </div>
      </form>

      <section className="mt-10 space-y-3">
        {store.goals.length === 0 ? (
          <p className="text-muted-foreground">No goals yet. Add one above.</p>
        ) : (
          store.goals.map((g) => {
            const p = goalProgress(g, store.entries);
            const pct = Math.min(100, Math.round(p.ratio * 100));
            return (
              <article key={g.id} className="rounded-2xl border border-border bg-card p-5">
                <header className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">
                      {g.category}
                    </p>
                    <h3 className="font-display text-xl">{g.title}</h3>
                  </div>
                  <button
                    onClick={() => removeGoal(g.id)}
                    aria-label={`Delete goal ${g.title}`}
                    className="grid size-9 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </header>
                <div className="mt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {p.currentKg.toFixed(1)} / {p.targetKg} kg this week
                    </span>
                    <span className={p.onTrack ? "text-success" : "text-destructive"}>
                      {p.onTrack ? "On track" : "Over budget"}
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full ${p.onTrack ? "bg-success" : "bg-destructive"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </article>
            );
          })
        )}
      </section>
    </AppShell>
  );
}
