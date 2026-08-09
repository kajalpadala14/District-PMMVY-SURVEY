import { createFileRoute } from "@tanstack/react-router";
import { Download, Printer } from "lucide-react";
import { useMemo, useState } from "react";
import { FilterPanel } from "@/components/dash/filter-panel";
import { useFilters } from "@/components/dash/filters-context";
import { Panel, PageTitle } from "@/components/dash/panel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { REGISTRATION_ISSUES } from "@/data/district";
import { blockStats, gpStats, projectStats } from "@/data/district";
import { downloadExcelReport } from "@/lib/export-excel";
import { beneficiaryHasIssue, ISSUE_DETAIL_HEADERS, ISSUE_REPORT_OPTIONS, issueDetailRows } from "@/lib/issue-report";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Reports & Export | MVY - SURVEY Portal" },
      {
        name: "description",
        content: "Print filter-aware district, GP, pending and resolved reports.",
      },
      { property: "og:title", content: "Reports & Export | MVY - SURVEY Portal" },
      { property: "og:description", content: "Filter-aware report views for district review and monitoring." },
    ],
  }),
  component: Reports,
});

const REPORTS = [
  ["Project Wise Report", "Project level pending load, survey completion and issue break-up"],
  ["Block Wise Report", "Block level pending load, survey completion and issue break-up"],
  ["Gram Panchayat Report", "GP level pending load with high priority cases"],
  ["Issue Detail Report", "Beneficiary-wise issue details with field verification status"],
  ["Resolved Cases Report", "Closed cases"],
  ["Survey Progress Report", "Survey completion status from current records"],
] as const;

const ALL = "__all__";

function Reports() {
  const { rows, allRows } = useFilters();
  const [customBlock, setCustomBlock] = useState("");
  const [customGp, setCustomGp] = useState("");
  const [customVillage, setCustomVillage] = useState("");
  const [customIssue, setCustomIssue] = useState("");
  const gps = gpStats(rows);
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
    downloadExcelReport(
      "mvy-project-wise-report.xls",
      "Project Wise Report",
      ["Project", "Total", "Pending", "Survey Done", "Resolved", "Survey %", "Blocks", "GPs", "Villages", "MCP No", "Bank No", "Aadhaar No", "Aadhaar-Bank No", "Other No", "Score"],
      projects.map((p) => [p.project, p.total, p.pending, p.completed, p.resolved, `${p.surveyPct}%`, p.blocks, p.gps, p.villages, p.mcp, p.bank, p.aadhaar, p.link, p.other, p.score]),
    );
  };

  const downloadBlockReport = () => {
    downloadExcelReport(
      "mvy-block-wise-report.xls",
      "Block Wise Report",
      ["Block", "Total", "Pending", "Survey Done", "Resolved", "Survey %", "MCP No", "Bank No", "Aadhaar No", "Aadhaar-Bank No", "Other No", "Officers", "Score"],
      blocks.map((b) => [b.block, b.total, b.pending, b.completed, b.resolved, `${b.surveyPct}%`, b.mcp, b.bank, b.aadhaar, b.link, b.other, b.officers, b.score]),
    );
  };

  const downloadGpReport = () => {
    downloadExcelReport(
      "mvy-gp-wise-report.xls",
      "GP Wise Report",
      ["Block", "Gram Panchayat", "Villages", "Pending", "Completed", "Survey Pending", "MCP No", "Bank No", "Aadhaar No", "Aadhaar-Bank No", "Other No", "Survey %", "High Priority"],
      gps.map((g) => [g.block, g.gp, g.villages, g.pending, g.completed, g.surveyPending, g.mcp, g.bank, g.aadhaar, g.link, g.other, `${g.surveyPct}%`, g.high]),
    );
  };

  const downloadIssueDetailReport = (issue: string) => {
    downloadExcelReport(
      `mvy-${slugify(issue)}-issue-detail-report.xls`,
      `${issue} Issue Detail Report`,
      ISSUE_DETAIL_HEADERS,
      issueDetailRows(rows, issue),
    );
  };

  const downloadCustomReport = () => {
    const suffix = [customBlock, customGp, customVillage, customIssue].filter(Boolean).map(slugify).join("-");
    downloadExcelReport(
      `mvy-custom-filtered-report${suffix ? `-${suffix}` : ""}.xls`,
      "Custom Filtered Report",
      ISSUE_DETAIL_HEADERS,
      issueDetailRows(customRows, customIssue || undefined),
    );
  };

  return (
    <>
      <PageTitle title="Reports & Export" subtitle="Every report honours the filters currently applied on the dashboard" />
      <FilterPanel />

      <Panel
        title="Available Reports"
        subtitle="Print-ready report views"
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
                    <Button size="sm" variant="outline" onClick={() => window.print()}>
                      <Printer className="size-3.5" /> Print
                    </Button>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {ISSUE_REPORT_OPTIONS.map((issue) => (
                      <Button key={issue} size="sm" variant="outline" className="justify-start" onClick={() => downloadIssueDetailReport(issue)}>
                        <Download className="size-3.5" /> {issue}
                      </Button>
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
                  {name === "Block Wise Report" ? (
                    <Button size="sm" variant="outline" onClick={downloadBlockReport}>
                      <Download className="size-3.5" /> Excel
                    </Button>
                  ) : null}
                  {name === "Gram Panchayat Report" ? (
                    <Button size="sm" variant="outline" onClick={downloadGpReport}>
                      <Download className="size-3.5" /> Excel
                    </Button>
                  ) : null}
                  <Button size="sm" variant="outline" onClick={() => window.print()}>
                    <Printer className="size-3.5" /> Print
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="size-4" /> Print view
          </Button>
        </div>
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
