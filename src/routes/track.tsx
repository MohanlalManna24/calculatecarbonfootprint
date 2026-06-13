import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { AppShell } from "@/components/carbonwise/AppShell";
import { useStore } from "@/lib/carbonwise/store";
import { ACTIVITIES, computeCo2e, findActivity } from "@/lib/carbonwise/engine";
import { categoryEnum } from "@/lib/carbonwise/schemas";
import { toast } from "sonner";

export const Route = createFileRoute("/track")({
  head: () => ({
    meta: [
      { title: "Track · CarbonWise" },
      { name: "description", content: "Log activities and see their carbon impact instantly." },
    ],
  }),
  component: Track,
});

const formSchema = z.object({
  category: categoryEnum,
  activityKey: z.string().min(1, "Pick an activity"),
  amount: z.coerce.number().min(0.01, "Enter a positive amount").max(100000),
  note: z.string().trim().max(280).optional(),
});
type FormValues = z.infer<typeof formSchema>;

function Track() {
  const { store, addEntry, removeEntry } = useStore();
  const [preview, setPreview] = useState(0);

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { category: "transport", activityKey: "car_petrol_km", amount: 0 },
  });

  const category = watch("category");
  const activityKey = watch("activityKey");
  const amount = watch("amount");

  useMemo(() => {
    setPreview(computeCo2e(category, activityKey, Number(amount) || 0));
  }, [category, activityKey, amount]);

  const list = ACTIVITIES[category] ?? [];
  const unit = findActivity(category, activityKey)?.unit ?? "";

  function onSubmit(values: FormValues) {
    const def = findActivity(values.category, values.activityKey);
    if (!def) return;
    addEntry({
      date: new Date().toISOString(),
      category: values.category,
      activity: def.label,
      amount: values.amount,
      unit: def.unit,
      co2e: computeCo2e(values.category, values.activityKey, values.amount),
      note: values.note,
    });
    toast.success(`Logged ${def.label} — ${computeCo2e(values.category, values.activityKey, values.amount)} kg CO₂e`);
    reset({ category: values.category, activityKey: values.activityKey, amount: 0, note: "" });
  }

  return (
    <AppShell>
      <h1 className="font-display text-4xl">Track an activity</h1>
      <p className="mt-2 text-muted-foreground">Pick a category, choose what you did, and see the impact instantly.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 grid gap-6 rounded-3xl border border-border bg-card p-6 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="category" className="text-sm font-medium">Category</label>
          <select id="category" {...register("category")} className="w-full rounded-xl border border-input bg-background px-3 py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            {(["transport", "energy", "food", "shopping", "waste"] as const).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="activityKey" className="text-sm font-medium">Activity</label>
          <select id="activityKey" {...register("activityKey")} className="w-full rounded-xl border border-input bg-background px-3 py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            {list.map((a) => <option key={a.key} value={a.key}>{a.label}</option>)}
          </select>
          {errors.activityKey && <p role="alert" className="text-sm text-destructive">{errors.activityKey.message}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="amount" className="text-sm font-medium">Amount {unit && <span className="text-muted-foreground">({unit})</span>}</label>
          <input id="amount" type="number" step="0.01" min="0" {...register("amount")} className="w-full rounded-xl border border-input bg-background px-3 py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          {errors.amount && <p role="alert" className="text-sm text-destructive">{errors.amount.message}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="note" className="text-sm font-medium">Note <span className="text-muted-foreground">(optional)</span></label>
          <input id="note" type="text" maxLength={280} {...register("note")} className="w-full rounded-xl border border-input bg-background px-3 py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        </div>

        <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4">
          <p className="text-sm text-muted-foreground">
            Estimated impact: <span className="font-display text-2xl text-foreground">{preview.toFixed(2)}</span> kg CO₂e
          </p>
          <button type="submit" className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Save entry
          </button>
        </div>
      </form>

      <section className="mt-10">
        <h2 className="font-display text-2xl">Recent entries</h2>
        {store.entries.length === 0 ? (
          <p className="mt-3 text-muted-foreground">No entries yet. Log something above to get started.</p>
        ) : (
          <ul className="mt-4 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
            {store.entries.slice(0, 20).map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-medium">{e.activity}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(e.date).toLocaleDateString()} · {e.amount} {e.unit} · {e.category}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-display text-lg">{e.co2e.toFixed(2)} <span className="text-xs text-muted-foreground">kg</span></span>
                  <button onClick={() => removeEntry(e.id)} aria-label={`Delete ${e.activity}`} className="grid size-9 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-destructive">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppShell>
  );
}
