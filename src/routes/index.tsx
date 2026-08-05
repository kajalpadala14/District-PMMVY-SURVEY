import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  BadgeCheck,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  Clock,
  Flame,
  Percent,
  TrendingUp,
  Users,
  Timer,
  MapPin,
} from "lucide-react";

import { FilterPanel } from "@/components/dash/filter-panel";
import { useFilters } from "@/components/dash/filters-context";
import { KpiCard } from "@/components/dash/kpi-card";
import { Bar, Panel, StatusPill } from "@/components/dash/panel";
import {
  Gauge,
  HBar,
  ProgressDonut,
  ReasonPie,
  ResolutionArea,
  TrendLine,
  VBar,
} from "@/components/dash/charts";
import {
  ageBuckets,
  activity,
  alerts,
  blockStats,
  gpStats,
  kpis,
  reasonStats,
  trend,
  villageStats,
} from "@/data/district";
import { Badge } from "@/components/ui/badge";
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
  const { rows } = useFilters();
  const k = kpis(rows);
  const bs = blockStats(rows);
  const gs = gpStats(rows);
  const vs = villageStats(rows);
  const worst = bs[0];
  const best = [...bs].sort((a, b) => b.score - a.score)[0];
  const al = alerts(rows);

  return (
    <>
      <FilterPanel />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-6">
        <KpiCard label="Total Beneficiaries" value={k.total.toLocaleString("en-IN")} icon={Users} tone="navy" delta={2} hint="Registered" />
        <KpiCard label="Total Pending" value={k.pending.toLocaleString("en-IN")} icon={Clock} tone="red" delta={-4} hint="Awaiting closure" spark={[980, 972, 968, 961, 955, 950, 947]} />
        <KpiCard label="Survey Completed" value={k.surveyDone.toLocaleString("en-IN")} icon={CheckCircle2} tone="green" delta={6} spark={[610, 640, 668, 700, 728, 752, 781]} />
        <KpiCard label="Survey Pending" value={k.surveyPending.toLocaleString("en-IN")} icon={ClipboardList} tone="amber" delta={-5} />
        <KpiCard label="Resolved Cases" value={k.resolved.toLocaleString("en-IN")} icon={BadgeCheck} tone="green" delta={8} spark={[240, 258, 271, 290, 305, 322, 337]} />
        <KpiCard label="Today's Surveys" value={k.todaySurveys} icon={CalendarCheck} tone="blue" delta={11} hint="Against target 70" />
        <KpiCard label="Today's Resolved" value={k.todayResolved} icon={TrendingUp} tone="green" delta={3} />
        <KpiCard label="Pending %" value={k.pendingPct} suffix="%" icon={Percent} tone="red" delta={-2} />
        <KpiCard label="Survey Progress" value={k.surveyProgress} suffix="%" icon={Percent} tone="blue" delta={5} hint="Target 75%" />
        <KpiCard label="Avg Resolution" value={k.avgResolutionDays} suffix="days" icon={Timer} tone="navy" delta={-6} />
        <KpiCard label="Pending 7+ Days" value={k.over7} icon={Clock} tone="amber" delta={-3} />
        <KpiCard label="Pending 30+ Days" value={k.over30} icon={Flame} tone="red" delta={4} hint="Escalate" />
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-3">
        <Panel title="District Snapshot" subtitle="Best and worst performing units" className="xl:col-span-1">
          <div className="space-y-3">
            <SnapRow
              tone="red"
              label="Worst performing block"
              value={worst ? worst.block : "--"}
              meta={worst ? `${worst.pending} pending · survey ${worst.surveyPct}%` : ""}
            />
            <SnapRow
              tone="green"
              label="Best performing block"
              value={best ? best.block : "--"}
              meta={best ? `Score ${best.score} · survey ${best.surveyPct}%` : ""}
            />
            <SnapRow
              tone="amber"
              label="GP needing intervention"
              value={gs[0] ? `${gs[0].gp} (${gs[0].block})` : "--"}
              meta={gs[0] ? `${gs[0].pending} pending · ${gs[0].high} high priority` : ""}
            />
            <SnapRow
              tone="amber"
              label="Highest pending village"
              value={vs[0] ? vs[0].village : "--"}
              meta={vs[0] ? `${vs[0].pending} pending · officer ${vs[0].officer}` : ""}
            />
          </div>
        </Panel>

        <Panel title="Block Wise Pending" subtitle="Pending beneficiaries by block" className="xl:col-span-1">
          <HBar data={bs} nameKey="block" valueKey="pending" tone="var(--gov-red)" />
        </Panel>

        <Panel title="Survey Progress" subtitle="Completed vs pending surveys" className="xl:col-span-1">
          <ProgressDonut done={k.surveyDone} pending={k.surveyPending} />
        </Panel>
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-3">
        <Panel title="Pending Reason Distribution" subtitle="Why payments are stuck">
          <ReasonPie data={reasonStats(rows)} />
        </Panel>
        <Panel title="Daily Survey & Resolution Trend" subtitle="Last 14 days" className="xl:col-span-2">
          <TrendLine data={trend} />
        </Panel>
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-3">
        <Panel title="Block Performance Ranking" subtitle="Composite performance score" className="xl:col-span-2">
          <HBar data={[...bs].sort((a, b) => a.score - b.score)} nameKey="block" valueKey="score" tone="var(--gov-blue)" />
        </Panel>
        <div className="grid gap-3">
          <Panel title="Resolved vs Pending" subtitle="District resolution gauge">
            <Gauge percent={Math.round((k.resolved / k.total) * 100)} />
          </Panel>
          <Panel title="Pending Age Analysis" subtitle="Ageing of pending cases">
            <VBar data={ageBuckets(rows)} nameKey="bucket" valueKey="count" height={200} />
          </Panel>
        </div>
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-3">
        <Panel title="Gram Panchayat Wise Pending" subtitle="Top 10 GPs by pending load" className="xl:col-span-2">
          <VBar data={gs.slice(0, 10)} nameKey="gp" valueKey="pending" height={280} />
        </Panel>
        <Panel title="Daily Resolution Trend" subtitle="Cases closed per day">
          <ResolutionArea data={trend} height={280} />
        </Panel>
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-3">
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

        <Panel
          title="Block Monitoring"
          subtitle="Live block scorecard"
          className="xl:col-span-1"
          action={
            <Link to="/blocks" className="text-xs font-semibold text-gov-blue hover:underline">
              Full table
            </Link>
          }
        >
          <div className="space-y-2">
            {bs.map((b) => (
              <div key={b.block} className="flex items-center justify-between gap-2 rounded-md border border-border px-2.5 py-2">
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold">{b.block}</p>
                  <p className="num text-[11px] text-muted-foreground">
                    {b.pending} pending · {b.total} total
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Bar value={b.surveyPct} tone={b.surveyPct >= 70 ? "green" : "red"} />
                  <StatusPill value={b.surveyPct} />
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Recent Activity" subtitle="Field updates in last hour">
          <ul className="space-y-2.5">
            {activity.map((a, i) => (
              <li key={i} className="flex gap-2.5">
                <span className="num w-10 shrink-0 text-[11px] text-muted-foreground">{a.time}</span>
                <div className="min-w-0">
                  <Badge variant="outline" className="mb-1 h-4 px-1.5 text-[10px]">
                    {a.type}
                  </Badge>
                  <p className="text-xs text-foreground">{a.text}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-center gap-1.5 rounded-md bg-gov-blue-soft p-2 text-[11px] text-gov-navy">
            <MapPin className="size-3.5" /> GIS pending-density map integration slot (optional)
          </div>
        </Panel>
      </div>
    </>
  );
}

function SnapRow({
  tone,
  label,
  value,
  meta,
}: {
  tone: "red" | "green" | "amber";
  label: string;
  value: string;
  meta: string;
}) {
  const bar = tone === "red" ? "bg-gov-red" : tone === "green" ? "bg-gov-green" : "bg-gov-amber";
  return (
    <div className="flex gap-2.5 rounded-md border border-border p-2.5">
      <span className={cn("w-1 shrink-0 rounded-full", bar)} />
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-semibold text-foreground">{value}</p>
        <p className="truncate text-[11px] text-muted-foreground">{meta}</p>
      </div>
    </div>
  );
}
