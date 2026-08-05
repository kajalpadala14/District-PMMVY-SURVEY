import { createFileRoute } from "@tanstack/react-router";
import { FileSpreadsheet, FileText, Printer, Table2 } from "lucide-react";
import { toast } from "sonner";
import { FilterPanel } from "@/components/dash/filter-panel";
import { useFilters } from "@/components/dash/filters-context";
import { Panel, PageTitle } from "@/components/dash/panel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Reports & Export | MVY District Command Centre" },
      {
        name: "description",
        content: "Download district, block, GP, pending and resolved reports in Excel, CSV or PDF respecting active filters.",
      },
      { property: "og:title", content: "Reports & Export | MVY District Command Centre" },
      { property: "og:description", content: "Filter-aware report downloads for district review and monitoring." },
    ],
  }),
  component: Reports,
});

const REPORTS = [
  ["District Summary Report", "Consolidated KPIs, block ranking and issue distribution"],
  ["Block Wise Report", "Pending, resolved, survey % and issue split per block"],
  ["Gram Panchayat Report", "GP level pending load with high priority cases"],
  ["Village Report", "Village pending, survey % and assigned officer"],
  ["Pending Beneficiary Report", "All pending cases with reason and ageing"],
  ["Resolved Cases Report", "Closed cases with resolution time"],
  ["Survey Progress Report", "Daily survey and resolution trend"],
] as const;

function Reports() {
  const { rows, activeCount } = useFilters();

  const dl = (name: string, format: string) =>
    toast.success(`${name} — ${format}`, {
      description: `${rows.length.toLocaleString("en-IN")} records · ${activeCount} filter(s) applied`,
    });

  return (
    <>
      <PageTitle title="Reports & Export" subtitle="Every report honours the filters currently applied on the dashboard" />
      <FilterPanel />

      <Panel
        title="Available Reports"
        subtitle="Excel, CSV and PDF formats"
        action={
          <Badge variant="secondary" className="num">
            {rows.length.toLocaleString("en-IN")} records in scope
          </Badge>
        }
      >
        <div className="grid gap-2 lg:grid-cols-2">
          {REPORTS.map(([name, desc]) => (
            <div key={name} className="flex flex-wrap items-center gap-2 rounded-md border border-border p-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">{name}</p>
                <p className="text-[11px] text-muted-foreground">{desc}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => dl(name, "Excel")}>
                <FileSpreadsheet className="size-3.5" /> Excel
              </Button>
              <Button size="sm" variant="outline" onClick={() => dl(name, "CSV")}>
                <Table2 className="size-3.5" /> CSV
              </Button>
              <Button size="sm" variant="outline" onClick={() => dl(name, "PDF")}>
                <FileText className="size-3.5" /> PDF
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
          <Button onClick={() => dl("Current Dashboard", "PDF")}>Export dashboard as PDF</Button>
          <Button variant="outline" onClick={() => dl("Current Dashboard", "Excel")}>
            Export as Excel
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="size-4" /> Print view
          </Button>
        </div>
      </Panel>
    </>
  );
}
