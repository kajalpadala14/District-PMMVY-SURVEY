import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CheckCircle2,
  ClipboardList,
  Download,
  FileSpreadsheet,
  Layers3,
  Landmark,
  RotateCcw,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";

import { useFilters } from "@/components/dash/filters-context";
import { FilterPanel } from "@/components/dash/filter-panel";
import { KpiCard } from "@/components/dash/kpi-card";
import { Bar, Panel, StatusPill } from "@/components/dash/panel";
import { ReportPreview, type ReportPreviewData } from "@/components/dash/report-preview";
import { LazyChart } from "@/components/dash/lazy-charts";
import { blockStats, formatBeneficiaryReasons, gpStats, kpis, projectStats, reasonStats, villageStats } from "@/data/district";
import { REGISTRATION_ISSUES } from "@/data/district";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { beneficiaryHasIssue, ISSUE_DETAIL_HEADERS, ISSUE_REPORT_OPTIONS, issueDetailRows } from "@/lib/issue-report";
import { getSurveyStatusClass, getSurveyStatusLabel } from "@/lib/survey-status";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PMMVY - SURVEY Portal" },
      {
        name: "description",
        content:
          "PMMVY survey portal for KPIs, Gram Panchayats, villages, beneficiaries, alerts and reports.",
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
const ALL = "__all__";
const GP_QUEUE_PAGE_SIZE = 10;

function SinglePageDashboard() {
  const { rows, setFilter, reset, activeCount, isLoading, error, isSheetConfigured } = useFilters();
  const [tab, setTab] = useState("dashboard");
  const [gpQueuePage, setGpQueuePage] = useState(0);
  const [customBlock, setCustomBlock] = useState("");
  const [customGp, setCustomGp] = useState("");
  const [customVillage, setCustomVillage] = useState("");
  const [customIssue, setCustomIssue] = useState("");
  const [preview, setPreview] = useState<ReportPreviewData | null>(null);
  const k = kpis(rows);
  const ps = projectStats(rows);
  const bs = blockStats(rows);
  const gs = gpStats(rows);
  const vs = villageStats(rows);
  const hasProjectData = ps.length > 0;
  const gpQueuePages = Math.max(1, Math.ceil(gs.length / GP_QUEUE_PAGE_SIZE));
  const gpQueuePageIndex = Math.min(gpQueuePage, gpQueuePages - 1);
  const gpQueueRows = gs.slice(gpQueuePageIndex * GP_QUEUE_PAGE_SIZE, gpQueuePageIndex * GP_QUEUE_PAGE_SIZE + GP_QUEUE_PAGE_SIZE);
  const customOptions = useMemo(() => {
    const blockRows = rows.filter((row) => !customBlock || row.block === customBlock);
    const gpRows = blockRows.filter((row) => !customGp || row.gp === customGp);
    return {
      blocks: unique(rows.map((row) => row.block)),
      gps: unique(blockRows.map((row) => row.gp)),
      villages: unique(gpRows.map((row) => row.village)),
    };
  }, [customBlock, customGp, rows]);
  const customRows = useMemo(
    () =>
      rows.filter(
        (row) =>
          (!customBlock || row.block === customBlock) &&
          (!customGp || row.gp === customGp) &&
          (!customVillage || row.village === customVillage) &&
          (!customIssue || beneficiaryHasIssue(row, customIssue)),
      ),
    [customBlock, customGp, customIssue, customVillage, rows],
  );
  const downloadProjectReport = () => {
    const headers = ["Project", "Total", "Pending", "Survey Done", "Survey %", "Blocks", "GPs", "Villages", "MCP No", "Bank No", "Aadhaar No", "Aadhaar-Bank No", "Other No"];
    const reportRows = ps.map((p) => [p.project, p.total, p.pending, p.completed, `${p.surveyPct}%`, p.blocks, p.gps, p.villages, p.mcp, p.bank, p.aadhaar, p.link, p.other]);
    setPreview({ title: "Project Wise Report", filename: "mvy-project-wise-report.xls", format: "excel", headers, rows: reportRows });
  };
  const viewProjectReport = () => {
    const headers = ["Project", "Total", "Pending", "Survey Done", "Survey %", "Blocks", "GPs", "Villages", "MCP No", "Bank No", "Aadhaar No", "Aadhaar-Bank No", "Other No"];
    const reportRows = ps.map((p) => [p.project, p.total, p.pending, p.completed, `${p.surveyPct}%`, p.blocks, p.gps, p.villages, p.mcp, p.bank, p.aadhaar, p.link, p.other]);
    setPreview({ title: "Project Wise Report", filename: "mvy-project-wise-report.pdf", headers, rows: reportRows });
  };
  const downloadProjectPdf = () => {
    const headers = ["Project", "Total", "Pending", "Survey Done", "Survey %", "Blocks", "GPs", "Villages", "MCP No", "Bank No", "Aadhaar No", "Aadhaar-Bank No", "Other No"];
    const reportRows = ps.map((p) => [p.project, p.total, p.pending, p.completed, `${p.surveyPct}%`, p.blocks, p.gps, p.villages, p.mcp, p.bank, p.aadhaar, p.link, p.other]);
    setPreview({ title: "Project Wise Report", filename: "mvy-project-wise-report.pdf", headers, rows: reportRows });
  };
  const downloadBlockReport = () => {
    const headers = ["Block", "Total", "Pending", "Survey Done", "Survey %", "MCP No", "Bank No", "Aadhaar No", "Aadhaar-Bank No", "Other No", "Officers"];
    const reportRows = bs.map((b) => [b.block, b.total, b.pending, b.completed, `${b.surveyPct}%`, b.mcp, b.bank, b.aadhaar, b.link, b.other, b.officers]);
    setPreview({ title: "Block Wise Report", filename: "mvy-block-wise-report.xls", format: "excel", headers, rows: reportRows });
  };
  const viewBlockReport = () => {
    const headers = ["Block", "Total", "Pending", "Survey Done", "Survey %", "MCP No", "Bank No", "Aadhaar No", "Aadhaar-Bank No", "Other No", "Officers"];
    const reportRows = bs.map((b) => [b.block, b.total, b.pending, b.completed, `${b.surveyPct}%`, b.mcp, b.bank, b.aadhaar, b.link, b.other, b.officers]);
    setPreview({ title: "Block Wise Report", filename: "mvy-block-wise-report.pdf", headers, rows: reportRows });
  };
  const downloadBlockPdf = () => {
    const headers = ["Block", "Total", "Pending", "Survey Done", "Survey %", "MCP No", "Bank No", "Aadhaar No", "Aadhaar-Bank No", "Other No", "Officers"];
    const reportRows = bs.map((b) => [b.block, b.total, b.pending, b.completed, `${b.surveyPct}%`, b.mcp, b.bank, b.aadhaar, b.link, b.other, b.officers]);
    setPreview({ title: "Block Wise Report", filename: "mvy-block-wise-report.pdf", headers, rows: reportRows });
  };
  const downloadGpReport = () => {
    const headers = ["Block", "Gram Panchayat", "Villages", "Pending", "Completed", "Survey Pending", "MCP No", "Bank No", "Aadhaar No", "Aadhaar-Bank No", "Other No", "Survey %", "High Priority"];
    const reportRows = gs.map((g) => [g.block, g.gp, g.villages, g.pending, g.completed, g.surveyPending, g.mcp, g.bank, g.aadhaar, g.link, g.other, `${g.surveyPct}%`, g.high]);
    setPreview({ title: "GP Wise Report", filename: "mvy-gp-wise-report.xls", format: "excel", headers, rows: reportRows });
  };
  const viewGpReport = () => {
    const headers = ["Block", "Gram Panchayat", "Villages", "Pending", "Completed", "Survey Pending", "MCP No", "Bank No", "Aadhaar No", "Aadhaar-Bank No", "Other No", "Survey %", "High Priority"];
    const reportRows = gs.map((g) => [g.block, g.gp, g.villages, g.pending, g.completed, g.surveyPending, g.mcp, g.bank, g.aadhaar, g.link, g.other, `${g.surveyPct}%`, g.high]);
    setPreview({ title: "GP Wise Report", filename: "mvy-gp-wise-report.pdf", headers, rows: reportRows });
  };
  const downloadGpPdf = () => {
    const headers = ["Block", "Gram Panchayat", "Villages", "Pending", "Completed", "Survey Pending", "MCP No", "Bank No", "Aadhaar No", "Aadhaar-Bank No", "Other No", "Survey %", "High Priority"];
    const reportRows = gs.map((g) => [g.block, g.gp, g.villages, g.pending, g.completed, g.surveyPending, g.mcp, g.bank, g.aadhaar, g.link, g.other, `${g.surveyPct}%`, g.high]);
    setPreview({ title: "GP Wise Report", filename: "mvy-gp-wise-report.pdf", headers, rows: reportRows });
  };
  const downloadVillageReport = () => {
    const headers = ["Project", "Block", "Gram Panchayat", "Village", "Total", "Pending", "Survey Done", "Survey %", "MCP No", "Bank No", "Aadhaar No", "Aadhaar-Bank No", "Other No", "High Priority", "Officer", "Last Survey"];
    const reportRows = vs.map((v) => [v.project, v.block, v.gp, v.village, v.total, v.pending, v.completed, `${v.surveyPct}%`, v.mcp, v.bank, v.aadhaar, v.link, v.other, v.critical, v.officer, v.lastSurvey ?? ""]);
    setPreview({ title: "Village Wise Report", filename: "mvy-village-wise-report.xls", format: "excel", headers, rows: reportRows });
  };
  const downloadVillagePdf = () => {
    const headers = ["Project", "Block", "Gram Panchayat", "Village", "Total", "Pending", "Survey Done", "Survey %", "MCP No", "Bank No", "Aadhaar No", "Aadhaar-Bank No", "Other No", "High Priority", "Officer", "Last Survey"];
    const reportRows = vs.map((v) => [v.project, v.block, v.gp, v.village, v.total, v.pending, v.completed, `${v.surveyPct}%`, v.mcp, v.bank, v.aadhaar, v.link, v.other, v.critical, v.officer, v.lastSurvey ?? ""]);
    setPreview({ title: "Village Wise Report", filename: "mvy-village-wise-report.pdf", headers, rows: reportRows });
  };
  const downloadIssueDetailReport = (issue: string) => {
    setPreview({
      title: `${issue} Issue Detail Report`,
      filename: `mvy-${slugify(issue)}-issue-detail-report.xls`,
      format: "excel",
      headers: ISSUE_DETAIL_HEADERS,
      rows: issueDetailRows(rows, issue),
    });
  };
  const viewIssueDetailReport = (issue?: string) => {
    setPreview({
      title: issue ? `${issue} Issue Detail Report` : "Issue Detail Report",
      filename: issue ? `mvy-${slugify(issue)}-issue-detail-report.pdf` : "mvy-issue-detail-report.pdf",
      headers: ISSUE_DETAIL_HEADERS,
      rows: issueDetailRows(rows, issue),
    });
  };
  const downloadIssueDetailPdf = () => {
    setPreview({ title: "Issue Detail Report", filename: "mvy-issue-detail-report.pdf", headers: ISSUE_DETAIL_HEADERS, rows: issueDetailRows(rows) });
  };
  const downloadCustomReport = () => {
    const suffix = [customBlock, customGp, customVillage, customIssue].filter(Boolean).map(slugify).join("-");
    setPreview({
      title: "Custom Filtered Report",
      filename: `mvy-custom-filtered-report${suffix ? `-${suffix}` : ""}.xls`,
      format: "excel",
      headers: ISSUE_DETAIL_HEADERS,
      rows: issueDetailRows(customRows, customIssue || undefined),
    });
  };
  const viewCustomReport = () => {
    setPreview({
      title: "Custom Filtered Report",
      filename: `mvy-custom-filtered-report${[customBlock, customGp, customVillage, customIssue].filter(Boolean).map(slugify).join("-") ? `-${[customBlock, customGp, customVillage, customIssue].filter(Boolean).map(slugify).join("-")}` : ""}.pdf`,
      headers: ISSUE_DETAIL_HEADERS,
      rows: issueDetailRows(customRows, customIssue || undefined),
    });
  };
  const downloadCustomPdf = () => {
    const suffix = [customBlock, customGp, customVillage, customIssue].filter(Boolean).map(slugify).join("-");
    setPreview({
      title: "Custom Filtered Report",
      filename: `mvy-custom-filtered-report${suffix ? `-${suffix}` : ""}.pdf`,
      headers: ISSUE_DETAIL_HEADERS,
      rows: issueDetailRows(customRows, customIssue || undefined),
    });
  };

  return (
    <Tabs value={tab} onValueChange={setTab} className="space-y-4">
      <section className="rounded-lg border border-border bg-surface px-4 py-4 shadow-[var(--shadow-card)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gov-blue">PMMVY - SURVEY Portal</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="num">
              {rows.length.toLocaleString("en-IN")} records
            </Badge>
            <Badge variant="outline">{activeCount} filters active</Badge>
            {activeCount > 0 ? (
              <Button size="sm" variant="outline" onClick={reset}>
                <RotateCcw className="size-3.5" /> Back
              </Button>
            ) : null}
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
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <KpiCard label="Total Beneficiaries" value={k.total.toLocaleString("en-IN")} icon={Users} tone="navy" />
          <KpiCard label="Survey Completed" value={k.surveyDone.toLocaleString("en-IN")} icon={CheckCircle2} tone="green" />
          <KpiCard label="Registered" value={k.surveyRegistered.toLocaleString("en-IN")} icon={ClipboardList} tone="navy" />
          <KpiCard label="Reason Verification Pending" value={k.surveyReasonPending.toLocaleString("en-IN")} icon={ClipboardList} tone="red" />
          <KpiCard label="Survey Pending" value={k.surveyPending.toLocaleString("en-IN")} icon={ClipboardList} tone="amber" />
        </div>

        <div className="grid gap-3 xl:grid-cols-3">
          <Panel title="Block Wise Pending" subtitle="Pending beneficiaries by block">
            <LazyChart kind="HBar" data={bs} nameKey="blockLabel" valueKey="pending" tone="var(--gov-red)" />
          </Panel>
          <Panel title="Survey Progress" subtitle="Completed vs pending surveys">
            <LazyChart kind="ProgressDonut" done={k.surveyDone} pending={k.surveyPending} height={250} />
          </Panel>
          <Panel title="Pending Reason Distribution" subtitle="Why payments are stuck">
            <LazyChart kind="ReasonPie" data={reasonStats(rows)} height={250} onSelect={(reason) => setFilter("reason", reason)} />
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
                    <th className="px-2 py-2">Survey %</th>
                    <th className="px-2 py-2">Blocks</th>
                    <th className="px-2 py-2">GPs</th>
                    <th className="px-2 py-2">Villages</th>
                    <th className="px-2 py-2">MCP No</th>
                    <th className="px-2 py-2">Bank No</th>
                    <th className="px-2 py-2">Aadhaar No</th>
                    <th className="px-2 py-2">Adr-Bank No</th>
                    <th className="px-2 py-2">Other No</th>
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
                  <th className="px-2 py-2">Survey %</th>
                  <th className="px-2 py-2">MCP No</th>
                  <th className="px-2 py-2">Bank No</th>
                  <th className="px-2 py-2">Aadhaar No</th>
                  <th className="px-2 py-2">Adr-Bank No</th>
                  <th className="px-2 py-2">Other No</th>
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
          <LazyChart kind="VBar" data={gs.slice(0, 10)} nameKey="gp" valueKey="pending" height={280} />
        </Panel>
        <Panel
          title="Gram Panchayat Queue"
          subtitle={`${gs.length} Gram Panchayats in current selection`}
          action={
            activeCount > 0 ? (
              <Button size="sm" variant="outline" onClick={reset}>
                <RotateCcw className="size-3.5" /> Clear Focus
              </Button>
            ) : null
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] text-xs">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                  <th className="px-2 py-2">Gram Panchayat</th>
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
                {gpQueueRows.map((g) => (
                  <tr key={`${g.block}-${g.gp}`} className="border-b border-border/70 hover:bg-secondary/60">
                    <td className="px-2 py-2 font-semibold">{g.gp}</td>
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
          <div className="mt-3 flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>
              Showing {gpQueuePageIndex * GP_QUEUE_PAGE_SIZE + 1}-{Math.min((gpQueuePageIndex + 1) * GP_QUEUE_PAGE_SIZE, gs.length)} of {gs.length}
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={gpQueuePageIndex === 0} onClick={() => setGpQueuePage(Math.max(0, gpQueuePageIndex - 1))}>
                Previous
              </Button>
              <Button size="sm" variant="outline" disabled={gpQueuePageIndex >= gpQueuePages - 1} onClick={() => setGpQueuePage(Math.min(gpQueuePages - 1, gpQueuePageIndex + 1))}>
                Next
              </Button>
            </div>
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
                  <th className="px-2 py-2">Name</th>
                  <th className="px-2 py-2">Village</th>
                  <th className="px-2 py-2">GP</th>
                  <th className="px-2 py-2">Reason</th>
                  <th className="px-2 py-2">Survey</th>
                  <th className="px-2 py-2">Pending Days</th>
                  <th className="px-2 py-2" />
                </tr>
              </thead>
              <tbody>
                {rows.map((b) => (
                  <tr key={b.id} className="border-b border-border/70 hover:bg-secondary/60">
                    <td className="num px-2 py-2">{b.appId}</td>
                    <td className="px-2 py-2 font-semibold">{b.name}</td>
                    <td className="px-2 py-2">{b.village}</td>
                    <td className="px-2 py-2">{b.gp}</td>
                    <td className="px-2 py-2">{formatBeneficiaryReasons(b)}</td>
                    <td className="px-2 py-2"><StatusBadge value={b.surveyStatus} good="Completed" /></td>
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
            <div className="grid gap-3 rounded-md border border-border bg-secondary/30 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-foreground">Custom Filtered Report</p>
                  <p className="text-[11px] text-muted-foreground">Block, GP, village aur issue select karke exact report download karein.</p>
                </div>
                <Badge variant="secondary" className="num">
                  {customRows.length.toLocaleString("en-IN")} matched
                </Badge>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <ReportPicker
                  label="Block"
                  value={customBlock}
                  options={customOptions.blocks}
                  onChange={(value) => {
                    setCustomBlock(value);
                    setCustomGp("");
                    setCustomVillage("");
                  }}
                />
                <ReportPicker
                  label="Gram Panchayat"
                  value={customGp}
                  options={customOptions.gps}
                  onChange={(value) => {
                    setCustomGp(value);
                    setCustomVillage("");
                  }}
                />
                <ReportPicker label="Village" value={customVillage} options={customOptions.villages} onChange={setCustomVillage} />
                <ReportPicker label="Issue" value={customIssue} options={[...REGISTRATION_ISSUES]} onChange={setCustomIssue} />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={downloadCustomReport}>
                  <Download className="size-3.5" /> Download Excel
                </Button>
                <Button size="sm" variant="outline" onClick={downloadCustomPdf}>
                  <Download className="size-3.5" /> Download PDF
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setCustomBlock("");
                    setCustomGp("");
                    setCustomVillage("");
                    setCustomIssue("");
                  }}
                >
                  Reset
                </Button>
              </div>
            </div>
            {["Project Wise Report", "Block Wise Report", "GP Report", "Village Wise Report", "Issue Detail Report"].map((name) => (
              <div key={name} className="rounded-md border border-border p-3">
                {name === "Issue Detail Report" ? (
                  <div className="grid gap-3">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="size-4 text-gov-green" />
                      <span className="min-w-0 flex-1 text-sm font-semibold">{name}</span>
                      <Button size="sm" variant="outline" onClick={downloadIssueDetailPdf}>
                        PDF
                      </Button>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {ISSUE_REPORT_OPTIONS.map((issue) => (
                        <div key={issue} className="flex gap-2 rounded-md border border-border p-2">
                          <span className="min-w-0 flex-1 self-center text-xs font-medium">{issue}</span>
                          <Button size="sm" variant="outline" onClick={() => downloadIssueDetailReport(issue)}>
                            <Download className="size-3.5" /> Excel
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="size-4 text-gov-green" />
                    <span className="min-w-0 flex-1 text-sm font-semibold">{name}</span>
                    {name === "Project Wise Report" ? (
                      <Button size="sm" variant="outline" onClick={downloadProjectReport}>
                        Excel
                      </Button>
                    ) : null}
                    {name === "Project Wise Report" ? (
                      <Button size="sm" variant="outline" onClick={downloadProjectPdf}>
                        PDF
                      </Button>
                    ) : null}
                    {name === "Block Wise Report" ? (
                      <Button size="sm" variant="outline" onClick={downloadBlockReport}>
                        Excel
                      </Button>
                    ) : null}
                    {name === "Block Wise Report" ? (
                      <Button size="sm" variant="outline" onClick={downloadBlockPdf}>
                        PDF
                      </Button>
                    ) : null}
                    {name === "GP Report" ? (
                      <Button size="sm" variant="outline" onClick={downloadGpReport}>
                        Excel
                      </Button>
                    ) : null}
                    {name === "GP Report" ? (
                      <Button size="sm" variant="outline" onClick={downloadGpPdf}>
                        PDF
                      </Button>
                    ) : null}
                    {name === "Village Wise Report" ? (
                      <Button size="sm" variant="outline" onClick={downloadVillageReport}>
                        Excel
                      </Button>
                    ) : null}
                    {name === "Village Wise Report" ? (
                      <Button size="sm" variant="outline" onClick={downloadVillagePdf}>
                        PDF
                      </Button>
                    ) : null}
                  </div>
                )}
              </div>
            ))}
            <ReportPreview report={preview} onClose={() => setPreview(null)} />
          </div>
        </Panel>
      </section>
      </TabsContent>
    </Tabs>
  );
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function ReportPicker({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label>
      <span className="mb-1 block text-[11px] font-medium text-muted-foreground">{label}</span>
      <Select value={value || ALL} onValueChange={(next) => onChange(next === ALL ? "" : next)}>
        <SelectTrigger className="h-9 bg-background text-xs shadow-none">
          <SelectValue placeholder={label} />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          <SelectItem value={ALL}>All {label}</SelectItem>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
}

function ProjectRow({ p, onSelect }: { p: ReturnType<typeof projectStats>[number]; onSelect: () => void }) {
  return (
    <tr className="border-b border-border/70 hover:bg-secondary/60">
      <td className="px-2 py-2 font-semibold">{p.project}</td>
      <td className="num px-2 py-2">{p.total}</td>
      <td className="num px-2 py-2 font-semibold text-gov-red">{p.pending}</td>
      <td className="num px-2 py-2">{p.completed}</td>
      <td className="px-2 py-2"><Bar value={p.surveyPct} tone={p.surveyPct >= 70 ? "green" : "red"} /></td>
      <td className="num px-2 py-2">{p.blocks}</td>
      <td className="num px-2 py-2">{p.gps}</td>
      <td className="num px-2 py-2">{p.villages}</td>
      <td className="num px-2 py-2">{p.mcp}</td>
      <td className="num px-2 py-2">{p.bank}</td>
      <td className="num px-2 py-2">{p.aadhaar}</td>
      <td className="num px-2 py-2">{p.link}</td>
      <td className="num px-2 py-2">{p.other}</td>
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
      <td className="px-2 py-2"><Bar value={b.surveyPct} tone={b.surveyPct >= 70 ? "green" : "red"} /></td>
      <td className="num px-2 py-2">{b.mcp}</td>
      <td className="num px-2 py-2">{b.bank}</td>
      <td className="num px-2 py-2">{b.aadhaar}</td>
      <td className="num px-2 py-2">{b.link}</td>
      <td className="num px-2 py-2">{b.other}</td>
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
  const isSurveyStatus = ["Completed", "Registered", "In Progress", "Reason Verification Pending", "Reason Pending", "Pending"].includes(value);
  return (
    <Badge
      variant="outline"
      className={cn(
        isSurveyStatus
          ? getSurveyStatusClass(value)
          : isGood
            ? "border-gov-green/40 bg-gov-green-soft text-gov-green"
            : "border-gov-red/40 bg-gov-red-soft text-gov-red",
      )}
    >
      {isSurveyStatus ? getSurveyStatusLabel(value) : value}
    </Badge>
  );
}
