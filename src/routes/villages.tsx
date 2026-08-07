import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FilterPanel } from "@/components/dash/filter-panel";
import { useFilters } from "@/components/dash/filters-context";
import { Bar, Panel, PageTitle, StatusPill } from "@/components/dash/panel";
import { villageStats } from "@/data/district";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/villages")({
  head: () => ({
    meta: [
      { title: "Village Monitoring | MVY District Command Centre" },
      {
        name: "description",
        content: "Village-level pending beneficiaries, survey percentage, assigned officer and last survey date.",
      },
      { property: "og:title", content: "Village Monitoring | MVY District Command Centre" },
      { property: "og:description", content: "Villages demanding attention with critical cases and stale surveys." },
    ],
  }),
  component: Villages,
});

const PAGE = 15;

function Villages() {
  const { rows, setFilter } = useFilters();
  const vs = villageStats(rows);
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(vs.length / PAGE));
  const view = vs.slice(page * PAGE, page * PAGE + PAGE);

  return (
    <>
      <PageTitle title="Village Monitoring" subtitle="Villages demanding attention — stale surveys and critical pending cases" />
      <FilterPanel />

      <Panel title="Village Scorecard" subtitle={`${vs.length} villages in current selection`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-xs">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                <th className="px-2 py-2">Village</th>
                <th className="px-2 py-2">GP</th>
                <th className="px-2 py-2">Block</th>
                <th className="px-2 py-2">Beneficiaries</th>
                <th className="px-2 py-2">Pending</th>
                <th className="px-2 py-2">Completed</th>
                <th className="px-2 py-2">Survey %</th>
                <th className="px-2 py-2">Last Survey</th>
                <th className="px-2 py-2">Critical</th>
                <th className="px-2 py-2" />
              </tr>
            </thead>
            <tbody>
              {view.map((v) => (
                <tr key={`${v.block}-${v.gp}-${v.village}`} className="border-b border-border/70 hover:bg-secondary/60">
                  <td className="px-2 py-2 font-semibold">{v.village}</td>
                  <td className="px-2 py-2">{v.gp}</td>
                  <td className="px-2 py-2">{v.block}</td>
                  <td className="num px-2 py-2">{v.total}</td>
                  <td className="num px-2 py-2 font-semibold text-gov-red">{v.pending}</td>
                  <td className="num px-2 py-2">{v.completed}</td>
                  <td className="px-2 py-2">
                    <div className="flex items-center gap-2">
                      <Bar value={v.surveyPct} tone={v.surveyPct >= 70 ? "green" : "red"} />
                      <StatusPill value={v.surveyPct} />
                    </div>
                  </td>
                  <td className="num px-2 py-2">{v.lastSurvey}</td>
                  <td className="px-2 py-2">
                    {v.critical > 0 ? (
                      <Badge variant="outline" className="border-gov-red/40 bg-gov-red-soft text-gov-red">
                        {v.critical}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </td>
                  <td className="px-2 py-2">
                    <Button size="sm" variant="outline" onClick={() => setFilter("village", v.village)}>
                      Beneficiaries
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
