import { createFileRoute } from "@tanstack/react-router";
import { Landmark } from "lucide-react";
import { FilterPanel } from "@/components/dash/filter-panel";
import { useFilters } from "@/components/dash/filters-context";
import { Bar, Panel, PageTitle, StatusPill } from "@/components/dash/panel";
import { VBar } from "@/components/dash/charts";
import { gpStats } from "@/data/district";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export const Route = createFileRoute("/gram-panchayats")({
  head: () => ({
    meta: [
      { title: "Gram Panchayat Monitoring | MVY - SURVEY Portal" },
      {
        name: "description",
        content: "GP-wise pending beneficiaries, issue break-up, survey completion and high priority cases.",
      },
      { property: "og:title", content: "Gram Panchayat Monitoring | MVY - SURVEY Portal" },
      { property: "og:description", content: "GP-level pending load, survey completion and intervention priority." },
    ],
  }),
  component: GramPanchayats,
});

const PAGE = 12;

function GramPanchayats() {
  const { rows, setFilter } = useFilters();
  const gs = gpStats(rows);
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(gs.length / PAGE));
  const view = gs.slice(page * PAGE, page * PAGE + PAGE);

  return (
    <>
      <PageTitle title="Gram Panchayat Monitoring" subtitle="Identify GPs where survey work has stalled and payments are held up" />
      <FilterPanel />

      <Panel title="Top 12 GPs by Pending" subtitle="Immediate intervention list" className="mb-3">
        <VBar data={gs.slice(0, 12)} nameKey="gp" valueKey="pending" height={280} />
      </Panel>

      <Panel title="Gram Panchayat Scorecard" subtitle={`${gs.length} Gram Panchayats in current selection`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-xs">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                <th className="px-2 py-2">Gram Panchayat</th>
                <th className="px-2 py-2">Project</th>
                <th className="px-2 py-2">Block</th>
                <th className="px-2 py-2">Villages</th>
                <th className="px-2 py-2">Pending</th>
                <th className="px-2 py-2">Completed</th>
                <th className="px-2 py-2">Survey Pending</th>
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
              {view.map((g) => (
                <tr key={`${g.block}-${g.gp}`} className="border-b border-border/70 hover:bg-secondary/60">
                  <td className="px-2 py-2 font-semibold">{g.gp}</td>
                  <td className="px-2 py-2">{g.project}</td>
                  <td className="px-2 py-2">{g.block}</td>
                  <td className="num px-2 py-2">{g.villages}</td>
                  <td className="num px-2 py-2 font-semibold text-gov-red">{g.pending}</td>
                  <td className="num px-2 py-2">{g.completed}</td>
                  <td className="num px-2 py-2">{g.surveyPending}</td>
                  <td className="num px-2 py-2">{g.mcp}</td>
                  <td className="num px-2 py-2">{g.bank}</td>
                  <td className="num px-2 py-2">{g.aadhaar}</td>
                  <td className="num px-2 py-2">{g.link}</td>
                  <td className="num px-2 py-2">{g.other}</td>
                  <td className="px-2 py-2">
                    <div className="flex items-center gap-2">
                      <Bar value={g.surveyPct} tone={g.surveyPct >= 70 ? "green" : "red"} />
                      <StatusPill value={g.surveyPct} />
                    </div>
                  </td>
                  <td className="num px-2 py-2">{g.high}</td>
                  <td className="px-2 py-2">
                    <Button size="sm" variant="outline" onClick={() => setFilter("gp", g.gp)}>
                      <Landmark className="size-3.5" /> Villages
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Page {page + 1} of {pages}
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button size="sm" variant="outline" disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      </Panel>
    </>
  );
}
