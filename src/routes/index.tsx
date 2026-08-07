import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BadgeCheck,
  Boxes,
  CheckCircle2,
  ClipboardList,
  Download,
  FileSpreadsheet,
  Layers3,
  Landmark,
  Printer,
  Users,
} from "lucide-react";
import { useState } from "react";

import { useFilters } from "@/components/dash/filters-context";
import { FilterPanel } from "@/components/dash/filter-panel";
import { KpiCard } from "@/components/dash/kpi-card";
import { Bar, Panel, StatusPill } from "@/components/dash/panel";
import { HBar, ProgressDonut, ReasonPie, VBar } from "@/components/dash/charts";
import { blockStats, gpStats, kpis, projectStats, reasonStats } from "@/data/district";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Single Page Command Centre | MVY District Dashboard" },
      {
        name: "description",
        content:
          "Single-page MVY district command centre for KPIs, blocks, Gram Panchayats, villages, beneficiaries, alerts and reports.",
      },
    ],
  }),
  component: SinglePageDashboard,
});

const dashboardSections = [
  ["overview", "Overview"],
  ["projects", "Projects"],
  ["blocks", "Blocks"],
  ["gps", "Gram Panchayats"],
] as const;

function SinglePageDashboard() {
  const { rows, setFilter, activeCount, isLoading, error, isSheetConfigured } = useFilters();
  const [tab, setTab] = useState("dashboard");
  const k = kpis(rows);
  const ps = projectStats(rows);
  const bs = blockStats(rows);
  const gs = gpStats(rows);
  const hasProjectData = ps.length > 0;

  return (
    <Tabs value={tab} onValueChange={setTab} className="space-y-4">
      <section className="rounded-lg border border-border bg-surface px-4 py-4 shadow-[var(--shadow-card)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gov-blue">District command centre</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="num">
              {rows.length.toLocaleString("en-IN")} records
            </Badge>
            <Badge variant="outline">{activeCount} filters active</Badge>
            {!isSheetConfigured ? <Badge variant="outline">Sheet URL not configured</Badge> : null}
          </div>
        </div>

        {isLoading ? <p className="mt-3 text-xs text-muted-foreground">Loading sheet data...</p> : null}
        {error ? <p className="mt-3 text-xs font-medium text-gov-red">{error}</p> : null}

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="beneficiaries">Beneficiaries</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          {tab === "dashboard" ? (
            <nav className="flex gap-2 overflow-x-auto pb-1">
              {dashboardSections.map(([id, label]) => (
                <Button key={id} variant="outline" size="sm" asChild>
                  <a href={`#${id}`}>{label}</a>
                </Button>
              ))}
            </nav>
          ) : null}
        </div>
      </section>

      <TabsContent value="dashboard" className="mt-0 space-y-4">
        <section id="overview" className="scroll-mt-32 space-y-4">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-6">
          <KpiCard label="Total Beneficiaries" value={k.total.toLocaleString("en-IN")} icon={Users} tone="navy" />
          <KpiCard label="Projects" value={ps.length.toLocaleString("en-IN")} icon={Boxes} tone="blue" />
          <KpiCard label="Blocks" value={new Set(rows.map((row) => row.block).filter(Boolean)).size.toLocaleString("en-IN")} icon={Layers3} tone="blue" />
          <KpiCard label="Survey Completed" value={k.surveyDone.toLocaleString("en-IN")} icon={CheckCircle2} tone="green" />
          <KpiCard label="Survey Pending" value={k.surveyPending.toLocaleString("en-IN")} icon={ClipboardList} tone="amber" />
          <KpiCard label="Resolved Cases" value={k.resolved.toLocaleString("en-IN")} icon={BadgeCheck} tone="green" />
          <KpiCard label="Pending Cases" value={k.pending.toLocaleString("en-IN")} icon={ClipboardList} tone="red" />
          <KpiCard label="Issue No Count" value={k.issueNoCount.toLocaleString("en-IN")} icon={ClipboardList} tone="red" />
        </div>

        <div className="grid gap-3 xl:grid-cols-3">
          <Panel title="Block Wise Pending" subtitle="Pending beneficiaries by block">
            <HBar data={bs} nameKey="blockLabel" valueKey="pending" tone="var(--gov-red)" />
          </Panel>
          <Panel title="Survey Progress" subtitle="Completed vs pending surveys">
            <ProgressDonut done={k.surveyDone} pending={k.surveyPending} />
          </Panel>
          <Panel title="Pending Reason Distribution" subtitle="Why payments are stuck">
            <ReasonPie data={reasonStats(rows)} />
          </Panel>
        </div>
      </section>

      <section id="projects" className="scroll-mt-32">
        <Panel title="Project Scorecard" subtitle="Click a project to filter the entire page">
          {hasProjectData ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1160px] text-xs">
                <thead>
                  <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                    <th className="px-2 py-2">Project</th>
                    <th className="px-2 py-2">Total</th>
                    <th className="px-2 py-2">Pending</th>
                    <th className="px-2 py-2">Survey Done</th>
                    <th className="px-2 py-2">Resolved</th>
                    <th className="px-2 py-2">Survey %</th>
                    <th className="px-2 py-2">Blocks</th>
                    <th className="px-2 py-2">GPs</th>
                    <th className="px-2 py-2">Villages</th>
                    <th className="px-2 py-2">MCP No</th>
                    <th className="px-2 py-2">Bank No</th>
                    <th className="px-2 py-2">Aadhaar No</th>
                    <th className="px-2 py-2">Adr-Bank No</th>
                    <th className="px-2 py-2">Other No</th>
                    <th className="px-2 py-2">Score</th>
                    <th className="px-2 py-2">Status</th>
                    <th className="px-2 py-2" />
                  </tr>
                </thead>
                <tbody>{ps.map((p) => <ProjectRow key={p.project} p={p} onSelect={() => setFilter("project", p.project)} />)}</tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Project data is not loaded from the sheet backend yet. Redeploy the Apps Script after adding the PROJECT column.
            </p>
          )}
        </Panel>
      </section>

      <section id="blocks" className="scroll-mt-32">
        <Panel title="Block Scorecard" subtitle="Click a block to filter the entire page">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] text-xs">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                  <th className="px-2 py-2">Block</th>
                  <th className="px-2 py-2">Total</th>
                  <th className="px-2 py-2">Pending</th>
                  <th className="px-2 py-2">Survey Done</th>
                  <th className="px-2 py-2">Resolved</th>
                  <th className="px-2 py-2">Survey %</th>
                  <th className="px-2 py-2">MCP No</th>
                  <th className="px-2 py-2">Bank No</th>
                  <th className="px-2 py-2">Aadhaar No</th>
                  <th className="px-2 py-2">Adr-Bank No</th>
                  <th className="px-2 py-2">Other No</th>
                  <th className="px-2 py-2">Score</th>
                  <th className="px-2 py-2">Status</th>
                  <th className="px-2 py-2" />
                </tr>
              </thead>
              <tbody>{bs.map((b) => <BlockRow key={b.block} b={b} onSelect={() => setFilter("block", b.block)} />)}</tbody>
            </table>
          </div>
        </Panel>
      </section>

      <section id="gps" className="grid scroll-mt-32 gap-3 xl:grid-cols-[420px_1fr]">
        <Panel title="Top GPs by Pending" subtitle="Immediate intervention list">
          <VBar data={gs.slice(0, 10)} nameKey="gp" valueKey="pending" height={280} />
        </Panel>
        <Panel title="Gram Panchayat Queue" subtitle={`${gs.length} Gram Panchayats in current selection`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] text-xs">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                  <th className="px-2 py-2">Gram Panchayat</th>
                  <th className="px-2 py-2">Block</th>
                  <th className="px-2 py-2">Villages</th>
                  <th className="px-2 py-2">Pending</th>
                  <th className="px-2 py-2">Completed</th>
                  <th className="px-2 py-2">MCP No</th>
                  <th className="px-2 py-2">Bank No</th>
                  <th className="px-2 py-2">Aadhaar No</th>
                  <th className="px-2 py-2">Adr-Bank No</th>
                  <th className="px-2 py-2">Other No</th>
                  <th className="px-2 py-2">Survey %</th>
                  <th className="px-2 py-2">High Priority</th>
                  <th className="px-2 py-2" />
                </tr>
              </thead>
              <tbody>
                {gs.slice(0, 12).map((g) => (
                  <tr key={`${g.block}-${g.gp}`} className="border-b border-border/70 hover:bg-secondary/60">
                    <td className="px-2 py-2 font-semibold">{g.gp}</td>
                    <td className="px-2 py-2">{g.block}</td>
                    <td className="num px-2 py-2">{g.villages}</td>
                    <td className="num px-2 py-2 font-semibold text-gov-red">{g.pending}</td>
                    <td className="num px-2 py-2">{g.completed}</td>
                    <td className="num px-2 py-2">{g.mcp}</td>
                    <td className="num px-2 py-2">{g.bank}</td>
                    <td className="num px-2 py-2">{g.aadhaar}</td>
                    <td className="num px-2 py-2">{g.link}</td>
                    <td className="num px-2 py-2">{g.other}</td>
                    <td className="px-2 py-2"><Bar value={g.surveyPct} tone={g.surveyPct >= 70 ? "green" : "red"} /></td>
                    <td className="num px-2 py-2">{g.high}</td>
                    <td className="px-2 py-2">
                      <Button size="sm" variant="outline" onClick={() => setFilter("gp", g.gp)}>
                        <Landmark className="size-3.5" /> Focus
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </section>

      </TabsContent>

      <TabsContent value="beneficiaries" className="mt-0">
      <FilterPanel />
      <section id="beneficiaries" className="scroll-mt-32">
        <Panel title="Beneficiary Register" subtitle={`${rows.length.toLocaleString("en-IN")} records in current selection`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-xs">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                  <th className="px-2 py-2">Application ID</th>
                  <th className="px-2 py-2">Project</th>
                  <th className="px-2 py-2">Name</th>
                  <th className="px-2 py-2">Village</th>
                  <th className="px-2 py-2">GP</th>
                  <th className="px-2 py-2">Block</th>
                  <th className="px-2 py-2">Reason</th>
                  <th className="px-2 py-2">Survey</th>
                  <th className="px-2 py-2">Status</th>
                  <th className="px-2 py-2">Pending Days</th>
                  <th className="px-2 py-2" />
                </tr>
              </thead>
              <tbody>
                {rows.map((b) => (
                  <tr key={b.id} className="border-b border-border/70 hover:bg-secondary/60">
                    <td className="num px-2 py-2">{b.appId}</td>
                    <td className="px-2 py-2">{b.project}</td>
                    <td className="px-2 py-2 font-semibold">{b.name}</td>
                    <td className="px-2 py-2">{b.village}</td>
                    <td className="px-2 py-2">{b.gp}</td>
                    <td className="px-2 py-2">{b.block}</td>
                    <td className="px-2 py-2">{b.reason}</td>
                    <td className="px-2 py-2"><StatusBadge value={b.surveyStatus} good="Completed" /></td>
                    <td className="px-2 py-2"><StatusBadge value={b.caseStatus} good="Resolved" /></td>
                    <td className={cn("num px-2 py-2", b.pendingDays >= 30 && "font-semibold text-gov-red")}>
                      {b.pendingDays}
                    </td>
                    <td className="px-2 py-2">
                      <Button size="sm" variant="outline" asChild>
                        <Link to="/beneficiaries/$id" params={{ id: b.id }}>
                          Open
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </section>
      </TabsContent>

      <TabsContent value="reports" className="mt-0">
      <section id="reports" className="scroll-mt-32">
        <Panel title="Report Actions" subtitle="Filter-aware exports" action={<Download className="size-4 text-muted-foreground" />}>
          <div className="grid gap-2">
            {["District Summary", "Project Wise Report", "Block Wise Report", "GP Report", "Village Report", "Pending Beneficiaries"].map((name) => (
              <div key={name} className="flex items-center gap-2 rounded-md border border-border p-3">
                <FileSpreadsheet className="size-4 text-gov-green" />
                <span className="min-w-0 flex-1 text-sm font-semibold">{name}</span>
                <Button size="sm" variant="outline" onClick={() => window.print()}>
                  Print
                </Button>
              </div>
            ))}
            <Button className="mt-2" onClick={() => window.print()}>
              <Printer className="size-4" /> Print current view
            </Button>
          </div>
        </Panel>
      </section>
      </TabsContent>
    </Tabs>
  );
}

function ProjectRow({ p, onSelect }: { p: ReturnType<typeof projectStats>[number]; onSelect: () => void }) {
  return (
    <tr className="border-b border-border/70 hover:bg-secondary/60">
      <td className="px-2 py-2 font-semibold">{p.project}</td>
      <td className="num px-2 py-2">{p.total}</td>
      <td className="num px-2 py-2 font-semibold text-gov-red">{p.pending}</td>
      <td className="num px-2 py-2">{p.completed}</td>
      <td className="num px-2 py-2 text-gov-green">{p.resolved}</td>
      <td className="px-2 py-2"><Bar value={p.surveyPct} tone={p.surveyPct >= 70 ? "green" : "red"} /></td>
      <td className="num px-2 py-2">{p.blocks}</td>
      <td className="num px-2 py-2">{p.gps}</td>
      <td className="num px-2 py-2">{p.villages}</td>
      <td className="num px-2 py-2">{p.mcp}</td>
      <td className="num px-2 py-2">{p.bank}</td>
      <td className="num px-2 py-2">{p.aadhaar}</td>
      <td className="num px-2 py-2">{p.link}</td>
      <td className="num px-2 py-2">{p.other}</td>
      <td className="num px-2 py-2 font-semibold">{p.score}</td>
      <td className="px-2 py-2"><StatusPill value={p.surveyPct} /></td>
      <td className="px-2 py-2">
        <Button size="sm" variant="outline" onClick={onSelect}>
          <Layers3 className="size-3.5" /> Focus
        </Button>
      </td>
    </tr>
  );
}

function BlockRow({ b, onSelect }: { b: ReturnType<typeof blockStats>[number]; onSelect: () => void }) {
  return (
    <tr className="border-b border-border/70 hover:bg-secondary/60">
      <td className="px-2 py-2 font-semibold">{b.block}</td>
      <td className="num px-2 py-2">{b.total}</td>
      <td className="num px-2 py-2 font-semibold text-gov-red">{b.pending}</td>
      <td className="num px-2 py-2">{b.completed}</td>
      <td className="num px-2 py-2 text-gov-green">{b.resolved}</td>
      <td className="px-2 py-2"><Bar value={b.surveyPct} tone={b.surveyPct >= 70 ? "green" : "red"} /></td>
      <td className="num px-2 py-2">{b.mcp}</td>
      <td className="num px-2 py-2">{b.bank}</td>
      <td className="num px-2 py-2">{b.aadhaar}</td>
      <td className="num px-2 py-2">{b.link}</td>
      <td className="num px-2 py-2">{b.other}</td>
      <td className="num px-2 py-2 font-semibold">{b.score}</td>
      <td className="px-2 py-2"><StatusPill value={b.surveyPct} /></td>
      <td className="px-2 py-2">
        <Button size="sm" variant="outline" onClick={onSelect}>
          <Layers3 className="size-3.5" /> Focus
        </Button>
      </td>
    </tr>
  );
}

function StatusBadge({ value, good }: { value: string; good: string }) {
  const isGood = value === good;
  return (
    <Badge
      variant="outline"
      className={cn(
        isGood ? "border-gov-green/40 bg-gov-green-soft text-gov-green" : "border-gov-amber/40 bg-gov-amber-soft text-gov-amber",
      )}
    >
      {value}
    </Badge>
  );
}
