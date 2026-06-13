import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import type { Category } from "@/lib/carbonwise/schemas";

const COLORS: Record<Category, string> = {
  transport: "var(--color-primary)",
  energy: "var(--color-chart-3)",
  food: "var(--color-accent)",
  shopping: "var(--color-chart-4)",
  waste: "var(--color-chart-5)",
};

export default function CategoryDonut({ data }: { data: Record<Category, number> }) {
  const arr = (Object.entries(data) as Array<[Category, number]>)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }));
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={arr} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
            {arr.map((d) => <Cell key={d.name} fill={COLORS[d.name as Category]} stroke="var(--color-card)" />)}
          </Pie>
          <Tooltip
            contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }}
            formatter={(v: number, n: string) => [`${v.toFixed(1)} kg`, n]}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
