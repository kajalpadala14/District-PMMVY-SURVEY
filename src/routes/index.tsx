import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  BadgeCheck,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  Layers3,
  Users,
} from "lucide-react";

import { useFilters } from "@/components/dash/filters-context";
import { KpiCard } from "@/components/dash/kpi-card";
import { Bar, Panel, StatusPill } from "@/components/dash/panel";
import { HBar, ProgressDonut, ReasonPie } from "@/components/dash/charts";
import { alerts, blockStats, kpis, reasonStats } from "@/data/district";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Executive Dashboard | MVY District Command Centre" },
      {
        name: "description",
        content:
          "Single-screen district view of pending beneficiaries, block ranking and survey progress for Mahtari Vandan Yojana.",
      },
      { property: "og:title", content: "Executive Dashboard | MVY District Command Centre" },
      {
        property: "og:description",
        content: "Collector's real-time view of pending beneficiaries, blocks needing intervention and survey progress.",
      },
    ],
  }),
  component: Executive,
});

function Executive() {
  const { rows, setFilter } = useFilters();
  const k = kpis(rows);
  const bs = blockStats(rows);
  const al = alerts(rows);

  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-6">
        <KpiCard label="Total Beneficiaries" value={k.total.toLocaleString("en-IN")} icon={Users} tone="navy" delta={2} hint="Registered" />
        <KpiCard label="Survey Completed" value={k.surveyDone.toLocaleString("en-IN")} icon={CheckCircle2} tone="green" delta={6} spark={[610, 640, 668, 700, 728, 752, 781]} />
        <KpiCard label="Survey Pending" value={k.surveyPending.toLocaleString("en-IN")} icon={ClipboardList} tone="amber" delta={-5} />
        <KpiCard label="Resolved Cases" value={k.resolved.toLocaleString("en-IN")} icon={BadgeCheck} tone="green" delta={8} spark={[240, 258, 271, 290, 305, 322, 337]} />
        <KpiCard label="Today's Surveys" value={k.todaySurveys} icon={CalendarCheck} tone="blue" delta={11} hint="Against target 70" />
      </div>

      <Panel title="Block Scorecard" subtitle="Click a block to drill down into its Gram Panchayats" className="mt-4">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-xs">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                <th className="px-2 py-2">Block</th>
                <th className="px-2 py-2">Total</th>
                <th className="px-2 py-2">Pending</th>
                <th className="px-2 py-2">Survey Done</th>
                <th className="px-2 py-2">Resolved</th>
                <th className="px-2 py-2">Survey %</th>
                <th className="px-2 py-2">MCP</th>
                <th className="px-2 py-2">Bank</th>
                <th className="px-2 py-2">Aadhaar</th>
                <th className="px-2 py-2">Adr-Bank</th>
                <th className="px-2 py-2">Other</th>
                <th className="px-2 py-2">Avg Res.</th>
                <th className="px-2 py-2">Officers</th>
                <th className="px-2 py-2">Score</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2" />
              </tr>
            </thead>
            <tbody>
              {bs.map((b) => (
                <tr key={b.block} className="border-b border-border/70 hover:bg-secondary/60">
                  <td className="px-2 py-2 font-semibold">{b.block}</td>
                  <td className="num px-2 py-2">{b.total}</td>
                  <td className="num px-2 py-2 font-semibold text-gov-red">{b.pending}</td>
                  <td className="num px-2 py-2">{b.completed}</td>
                  <td className="num px-2 py-2 text-gov-green">{b.resolved}</td>
                  <td className="px-2 py-2">
                    <Bar value={b.surveyPct} tone={b.surveyPct >= 70 ? "green" : "red"} />
                  </td>
                  <td className="num px-2 py-2">{b.mcp}</td>
                  <td className="num px-2 py-2">{b.bank}</td>
                  <td className="num px-2 py-2">{b.aadhaar}</td>
                  <td className="num px-2 py-2">{b.link}</td>
                  <td className="num px-2 py-2">{b.other}</td>
                  <td className="num px-2 py-2">{b.avgRes}d</td>
                  <td className="num px-2 py-2">{b.officers}</td>
                  <td className="num px-2 py-2 font-semibold">{b.score}</td>
                  <td className="px-2 py-2">
                    <StatusPill value={b.surveyPct} />
                  </td>
                  <td className="px-2 py-2">
                    <Button size="sm" variant="outline" onClick={() => setFilter("block", b.block)}>
                      <Layers3 className="size-3.5" /> Drill down
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="mt-4 grid gap-3 xl:grid-cols-3">
        <Panel title="Block Wise Pending" subtitle="Pending beneficiaries by block">
          <HBar data={bs} nameKey="block" valueKey="pending" tone="var(--gov-red)" />
        </Panel>

        <Panel title="Survey Progress" subtitle="Completed vs pending surveys">
          <ProgressDonut done={k.surveyDone} pending={k.surveyPending} />
        </Panel>

        <Panel title="Pending Reason Distribution" subtitle="Why payments are stuck">
          <ReasonPie data={reasonStats(rows)} />
        </Panel>
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-2">
        <Panel
          title="Critical Alerts"
          subtitle="Automatic escalation triggers"
          action={
            <Link to="/alerts" className="text-xs font-semibold text-gov-blue hover:underline">
              View all
            </Link>
          }
        >
          <ul className="space-y-2">
            {al.slice(0, 6).map((a, i) => (
              <li key={i} className="flex gap-2 rounded-md border border-border p-2.5">
                <AlertTriangle
                  className={cn(
                    "mt-0.5 size-4 shrink-0",
                    a.level === "critical" ? "text-gov-red" : a.level === "warning" ? "text-gov-amber" : "text-gov-blue",
                  )}
                />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground">{a.title}</p>
                  <p className="text-[11px] text-muted-foreground">{a.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </Panel>

      </div>
    </>
  );
}
