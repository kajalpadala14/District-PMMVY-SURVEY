import { createFileRoute } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { useMemo, useState } from "react";
import { FilterPanel } from "@/components/dash/filter-panel";
import { useFilters } from "@/components/dash/filters-context";
import { Panel, PageTitle } from "@/components/dash/panel";
import { PortalNavCard } from "@/components/dash/portal-nav-card";
import { ReportPreview, type ReportPreviewData } from "@/components/dash/report-preview";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { REGISTRATION_ISSUES } from "@/data/district";
import { blockStats, gpStats, projectStats, villageStats } from "@/data/district";
import { beneficiaryHasIssue, ISSUE_DETAIL_HEADERS, ISSUE_REPORT_OPTIONS, issueDetailRows } from "@/lib/issue-report";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Reports & Export | PMMVY - SURVEY Portal" },
      {
        name: "description",
        content: "Download filter-aware district, GP, village and issue reports.",
      },
      { property: "og:title", content: "Reports & Export | PMMVY - SURVEY Portal" },
      { property: "og:description", content: "Filter-aware report views for district review and monitoring." },
    ],
  }),
  component: Reports,
});

const REPORTS = [
  ["Project Wise Report", "Project level pending load, survey completion and issue break-up"],
  ["Block Wise Report", "Block level pending load, survey completion and issue break-up"],
  ["Gram Panchayat Report", "GP level pending load with high priority cases"],
  ["Village Wise Report", "Village level pending load, survey completion and issue break-up"],
  ["Issue Detail Report", "Beneficiary-wise issue details with field verification status"],
] as const;

const ALL = "__all__";

function Reports() {
  const { rows, allRows } = useFilters();
  const [customBlock, setCustomBlock] = useState("");
  const [customGp, setCustomGp] = useState("");
  const [customVillage, setCustomVillage] = useState("");
  const [customIssue, setCustomIssue] = useState("");
  const [preview, setPreview] = useState<ReportPreviewData | null>(null);
  const gps = gpStats(rows);
  const villages = villageStats(rows);
  const projects = projectStats(rows);
  const blocks = blockStats(rows);
  const customBaseRows = rows.length ? rows : allRows;

  const customOptions = useMemo(() => {
    const blockRows = customBaseRows.filter((row) => !customBlock || row.block === customBlock);
    const gpRows = blockRows.filter((row) => !customGp || row.gp === customGp);
    return {
      blocks: unique(customBaseRows.map((row) => row.block)),
      gps: unique(blockRows.map((row) => row.gp)),
      villages: unique(gpRows.map((row) => row.village)),
    };
  }, [customBaseRows, customBlock, customGp]);

  const customRows = useMemo(
    () =>
      customBaseRows.filter(
        (row) =>
          (!customBlock || row.block === customBlock) &&
          (!customGp || row.gp === customGp) &&
          (!customVillage || row.village === customVillage) &&
          (!customIssue || beneficiaryHasIssue(row, customIssue)),
      ),
    [customBaseRows, customBlock, customGp, customIssue, customVillage],
  );

  const downloadProjectReport = () => {
    const headers = ["Project", "Total", "Pending", "Survey Done", "Survey %", "Blocks", "GPs", "Villages", "MCP No", "Bank No", "Aadhaar No", "Aadhaar-Bank No", "Other No"];
    const reportRows = projects.map((p) => [p.project, p.total, p.pending, p.completed, `${p.surveyPct}%`, p.blocks, p.gps, p.villages, p.mcp, p.bank, p.aadhaar, p.link, p.other]);
    setPreview({ title: "Project Wise Report", filename: "mvy-project-wise-report.xls", format: "excel", headers, rows: reportRows });
  };
  const viewProjectReport = () => {
    const headers = ["Project", "Total", "Pending", "Survey Done", "Survey %", "Blocks", "GPs", "Villages", "MCP No", "Bank No", "Aadhaar No", "Aadhaar-Bank No", "Other No"];
    const reportRows = projects.map((p) => [p.project, p.total, p.pending, p.completed, `${p.surveyPct}%`, p.blocks, p.gps, p.villages, p.mcp, p.bank, p.aadhaar, p.link, p.other]);
    setPreview({ title: "Project Wise Report", filename: "mvy-project-wise-report.pdf", headers, rows: reportRows });
  };
  const downloadProjectPdf = () => {
    const headers = ["Project", "Total", "Pending", "Survey Done", "Survey %", "Blocks", "GPs", "Villages", "MCP No", "Bank No", "Aadhaar No", "Aadhaar-Bank No", "Other No"];
    const reportRows = projects.map((p) => [p.project, p.total, p.pending, p.completed, `${p.surveyPct}%`, p.blocks, p.gps, p.villages, p.mcp, p.bank, p.aadhaar, p.link, p.other]);
    setPreview({ title: "Project Wise Report", filename: "mvy-project-wise-report.pdf", headers, rows: reportRows });
  };

  const downloadBlockReport = () => {
    const headers = ["Block", "Total", "Pending", "Survey Done", "Survey %", "MCP No", "Bank No", "Aadhaar No", "Aadhaar-Bank No", "Other No", "Officers"];
    const reportRows = blocks.map((b) => [b.block, b.total, b.pending, b.completed, `${b.surveyPct}%`, b.mcp, b.bank, b.aadhaar, b.link, b.other, b.officers]);
    setPreview({ title: "Block Wise Report", filename: "mvy-block-wise-report.xls", format: "excel", headers, rows: reportRows });
  };
  const viewBlockReport = () => {
    const headers = ["Block", "Total", "Pending", "Survey Done", "Survey %", "MCP No", "Bank No", "Aadhaar No", "Aadhaar-Bank No", "Other No", "Officers"];
    const reportRows = blocks.map((b) => [b.block, b.total, b.pending, b.completed, `${b.surveyPct}%`, b.mcp, b.bank, b.aadhaar, b.link, b.other, b.officers]);
    setPreview({ title: "Block Wise Report", filename: "mvy-block-wise-report.pdf", headers, rows: reportRows });
  };
  const downloadBlockPdf = () => {
    const headers = ["Block", "Total", "Pending", "Survey Done", "Survey %", "MCP No", "Bank No", "Aadhaar No", "Aadhaar-Bank No", "Other No", "Officers"];
    const reportRows = blocks.map((b) => [b.block, b.total, b.pending, b.completed, `${b.surveyPct}%`, b.mcp, b.bank, b.aadhaar, b.link, b.other, b.officers]);
    setPreview({ title: "Block Wise Report", filename: "mvy-block-wise-report.pdf", headers, rows: reportRows });
  };

  const downloadGpReport = () => {
    const headers = ["Block", "Gram Panchayat", "Villages", "Pending", "Completed", "Survey Pending", "MCP No", "Bank No", "Aadhaar No", "Aadhaar-Bank No", "Other No", "Survey %", "High Priority"];
    const reportRows = gps.map((g) => [g.block, g.gp, g.villages, g.pending, g.completed, g.surveyPending, g.mcp, g.bank, g.aadhaar, g.link, g.other, `${g.surveyPct}%`, g.high]);
    setPreview({ title: "GP Wise Report", filename: "mvy-gp-wise-report.xls", format: "excel", headers, rows: reportRows });
  };
  const viewGpReport = () => {
    const headers = ["Block", "Gram Panchayat", "Villages", "Pending", "Completed", "Survey Pending", "MCP No", "Bank No", "Aadhaar No", "Aadhaar-Bank No", "Other No", "Survey %", "High Priority"];
    const reportRows = gps.map((g) => [g.block, g.gp, g.villages, g.pending, g.completed, g.surveyPending, g.mcp, g.bank, g.aadhaar, g.link, g.other, `${g.surveyPct}%`, g.high]);
    setPreview({ title: "GP Wise Report", filename: "mvy-gp-wise-report.pdf", headers, rows: reportRows });
  };
  const downloadGpPdf = () => {
    const headers = ["Block", "Gram Panchayat", "Villages", "Pending", "Completed", "Survey Pending", "MCP No", "Bank No", "Aadhaar No", "Aadhaar-Bank No", "Other No", "Survey %", "High Priority"];
    const reportRows = gps.map((g) => [g.block, g.gp, g.villages, g.pending, g.completed, g.surveyPending, g.mcp, g.bank, g.aadhaar, g.link, g.other, `${g.surveyPct}%`, g.high]);
    setPreview({ title: "GP Wise Report", filename: "mvy-gp-wise-report.pdf", headers, rows: reportRows });
  };

  const downloadVillageReport = () => {
    const headers = ["Project", "Block", "Gram Panchayat", "Village", "Total", "Pending", "Survey Done", "Survey %", "MCP No", "Bank No", "Aadhaar No", "Aadhaar-Bank No", "Other No", "High Priority", "Officer", "Last Survey"];
    const reportRows = villages.map((v) => [v.project, v.block, v.gp, v.village, v.total, v.pending, v.completed, `${v.surveyPct}%`, v.mcp, v.bank, v.aadhaar, v.link, v.other, v.critical, v.officer, v.lastSurvey ?? ""]);
    setPreview({ title: "Village Wise Report", filename: "mvy-village-wise-report.xls", format: "excel", headers, rows: reportRows });
  };
  const downloadVillagePdf = () => {
    const headers = ["Project", "Block", "Gram Panchayat", "Village", "Total", "Pending", "Survey Done", "Survey %", "MCP No", "Bank No", "Aadhaar No", "Aadhaar-Bank No", "Other No", "High Priority", "Officer", "Last Survey"];
    const reportRows = villages.map((v) => [v.project, v.block, v.gp, v.village, v.total, v.pending, v.completed, `${v.surveyPct}%`, v.mcp, v.bank, v.aadhaar, v.link, v.other, v.critical, v.officer, v.lastSurvey ?? ""]);
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
    <>
      <PortalNavCard />
      <PageTitle title="Reports & Export" subtitle="Every report honours the filters currently applied on the dashboard" />
      <FilterPanel />

      <Panel
        title="Available Reports"
        subtitle="PDF and Excel report views"
        action={
          <Badge variant="secondary" className="num">
            {rows.length.toLocaleString("en-IN")} records in scope
          </Badge>
        }
      >
        <div className="mb-4 grid gap-3 rounded-md border border-border bg-secondary/30 p-3">
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

        <div className="grid gap-2 lg:grid-cols-2">
          {REPORTS.map(([name, desc]) => (
            <div key={name} className={`rounded-md border border-border p-3 ${name === "Issue Detail Report" ? "lg:col-span-2" : ""}`}>
              {name === "Issue Detail Report" ? (
                <div className="grid gap-3">
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground">{name}</p>
                      <p className="text-[11px] text-muted-foreground">{desc}</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={downloadIssueDetailPdf}>
                      <Download className="size-3.5" /> PDF
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
                <div className="flex flex-wrap items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">{name}</p>
                    <p className="text-[11px] text-muted-foreground">{desc}</p>
                  </div>
                  {name === "Project Wise Report" ? (
                    <Button size="sm" variant="outline" onClick={downloadProjectReport}>
                      <Download className="size-3.5" /> Excel
                    </Button>
                  ) : null}
                  {name === "Project Wise Report" ? (
                    <Button size="sm" variant="outline" onClick={downloadProjectPdf}>
                      <Download className="size-3.5" /> PDF
                    </Button>
                  ) : null}
                  {name === "Block Wise Report" ? (
                    <Button size="sm" variant="outline" onClick={downloadBlockReport}>
                      <Download className="size-3.5" /> Excel
                    </Button>
                  ) : null}
                  {name === "Block Wise Report" ? (
                    <Button size="sm" variant="outline" onClick={downloadBlockPdf}>
                      <Download className="size-3.5" /> PDF
                    </Button>
                  ) : null}
                  {name === "Gram Panchayat Report" ? (
                    <Button size="sm" variant="outline" onClick={downloadGpReport}>
                      <Download className="size-3.5" /> Excel
                    </Button>
                  ) : null}
                  {name === "Gram Panchayat Report" ? (
                    <Button size="sm" variant="outline" onClick={downloadGpPdf}>
                      <Download className="size-3.5" /> PDF
                    </Button>
                  ) : null}
                  {name === "Village Wise Report" ? (
                    <Button size="sm" variant="outline" onClick={downloadVillageReport}>
                      <Download className="size-3.5" /> Excel
                    </Button>
                  ) : null}
                  {name === "Village Wise Report" ? (
                    <Button size="sm" variant="outline" onClick={downloadVillagePdf}>
                      <Download className="size-3.5" /> PDF
                    </Button>
                  ) : null}
                </div>
              )}
            </div>
          ))}
        </div>

        <ReportPreview report={preview} onClose={() => setPreview(null)} />
      </Panel>
    </>
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
