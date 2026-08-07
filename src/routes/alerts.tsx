import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, ShieldAlert, Info } from "lucide-react";
import { FilterPanel } from "@/components/dash/filter-panel";
import { useFilters } from "@/components/dash/filters-context";
import { Panel, PageTitle } from "@/components/dash/panel";
import { alerts } from "@/data/district";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/alerts")({
  head: () => ({
    meta: [
      { title: "Alerts & Escalation | MVY District Command Centre" },
      {
        name: "description",
        content: "Automatic escalation triggers for blocks crossing thresholds, inactive officers and long pending beneficiaries.",
      },
      { property: "og:title", content: "Alerts & Escalation | MVY District Command Centre" },
      { property: "og:description", content: "Red, orange and green escalation indicators for district review meetings." },
    ],
  }),
  component: Alerts,
});

function Alerts() {
  const { rows } = useFilters();
  const list = alerts(rows);
  const counts = {
    critical: list.filter((a) => a.level === "critical").length,
    warning: list.filter((a) => a.level === "warning").length,
    info: list.filter((a) => a.level === "info").length,
  };

  return (
    <>
      <PageTitle title="Alerts & Escalation" subtitle="Auto-generated triggers for the Collector's weekly review" />
      <FilterPanel />

      <div className="mb-3 grid gap-3 sm:grid-cols-3">
        <Tile tone="red" icon={ShieldAlert} label="Critical" value={counts.critical} hint="Immediate intervention" />
        <Tile tone="amber" icon={AlertTriangle} label="Warning" value={counts.warning} hint="Review this week" />
        <Tile tone="blue" icon={Info} label="Advisory" value={counts.info} hint="Monitor" />
      </div>

      <Panel title="Escalation Queue" subtitle="Sorted by severity">
        <ul className="space-y-2">
          {[...list]
            .sort((a, b) => (a.level === "critical" ? -1 : b.level === "critical" ? 1 : 0))
            .map((a, i) => (
              <li key={i} className="flex flex-wrap items-center gap-3 rounded-md border border-border p-3">
                <span
                  className={cn(
                    "size-2.5 shrink-0 rounded-full",
                    a.level === "critical" ? "bg-gov-red" : a.level === "warning" ? "bg-gov-amber" : "bg-gov-green",
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">{a.title}</p>
                  <p className="text-xs text-muted-foreground">{a.detail}</p>
                </div>
                <Badge variant="outline" className="uppercase">
                  {a.level}
                </Badge>
              </li>
            ))}
        </ul>
      </Panel>
    </>
  );
}

function Tile({
  tone,
  icon: Icon,
  label,
  value,
  hint,
}: {
  tone: "red" | "amber" | "blue";
  icon: typeof Info;
  label: string;
  value: number;
  hint: string;
}) {
  const map = {
    red: "bg-gov-red-soft text-gov-red",
    amber: "bg-gov-amber-soft text-gov-amber",
    blue: "bg-gov-blue-soft text-gov-blue",
  } as const;
  return (
    <div className="gov-panel flex items-center gap-3 p-4">
      <span className={cn("flex size-10 items-center justify-center rounded-md", map[tone])}>
        <Icon className="size-5" />
      </span>
      <div>
        <p className="num text-xl font-semibold">{value}</p>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-[11px] text-muted-foreground">{hint}</p>
      </div>
    </div>
  );
}
