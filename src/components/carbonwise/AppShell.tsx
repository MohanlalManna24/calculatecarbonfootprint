import { Link, useRouterState } from "@tanstack/react-router";
import { Leaf, BarChart3, PlusCircle, Target, Award, Sparkles } from "lucide-react";
import { useStore } from "@/lib/carbonwise/store";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { to: "/track", label: "Track", icon: PlusCircle },
  { to: "/goals", label: "Goals", icon: Target },
  { to: "/achievements", label: "Awards", icon: Award },
  { to: "/insights", label: "Insights", icon: Sparkles },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { store } = useStore();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-full bg-primary text-primary-foreground">
              <Leaf className="size-4" aria-hidden />
            </span>
            <span className="font-display text-lg tracking-tight">CarbonWise</span>
          </Link>
          <nav aria-label="Primary" className="hidden md:block">
            <ul className="flex items-center gap-1">
              {NAV.map((n) => {
                const active = pathname.startsWith(n.to);
                return (
                  <li key={n.to}>
                    <Link
                      to={n.to}
                      className={cn(
                        "rounded-full px-3 py-1.5 text-sm transition-colors",
                        active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                      )}
                    >
                      {n.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <div className="text-sm text-muted-foreground">
            {store.profile ? `Hi, ${store.profile.name}` : "Guest"}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-6 md:pb-12">{children}</main>
      <nav aria-label="Mobile" className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur md:hidden">
        <ul className="mx-auto flex max-w-md items-center justify-around px-2 py-2">
          {NAV.map((n) => {
            const Icon = n.icon;
            const active = pathname.startsWith(n.to);
            return (
              <li key={n.to}>
                <Link
                  to={n.to}
                  aria-label={n.label}
                  className={cn(
                    "flex min-h-11 min-w-11 flex-col items-center justify-center gap-0.5 rounded-lg px-2 py-1 text-[11px]",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <Icon className="size-5" aria-hidden />
                  {n.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
