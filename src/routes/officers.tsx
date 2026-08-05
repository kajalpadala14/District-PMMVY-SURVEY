import { createFileRoute } from "@tanstack/react-router";
import { FilterPanel } from "@/components/dash/filter-panel";
import { useFilters } from "@/components/dash/filters-context";
import { Bar, Panel, PageTitle } from "@/components/dash/panel";
import { OfficerStack, HBar } from "@/components/dash/charts";
import { officerStats } from "@/data/district";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/officers")({
  head: () => ({
    meta: [
      { title: "Officer Performance | MVY District Command Centre" },
      {
        name: "description",
        content: "Survey officer performance ranking: assigned cases, completion percentage, last activity and inactivity alerts.",
      },
      { property: "og:title", content: "Officer Performance | MVY District Command Centre" },
      { property: "og:description", content: "Identify non-performing survey officers instantly with ranking and activity tracking." },
    ],
  }),
  component: Officers,
});

function Officers() {
  const { rows, setFilter } = useFilters();
  const os = officerStats(rows);

  return (
    <>
      <PageTitle title="Officer Performance Dashboard" subtitle="Rank officers, spot inactivity and reassign workload" />
      <FilterPanel />

      <div className="grid gap-3 xl:grid-cols-2">
        <Panel title="Workload Split" subtitle="Completed vs pending surveys per officer">
          <OfficerStack data={os} height={340} />
        </Panel>
        <Panel title="Performance Score" subtitle="Completion weighted with recent activity">
          <HBar data={[...os].sort((a, b) => a.score - b.score)} nameKey="officer" valueKey="score" height={340} />
        </Panel>
      </div>

      <Panel title="Officer Scorecard" subtitle={`${os.length} survey officers`} className="mt-3">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-xs">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                <th className="px-2 py-2">Rank</th>
                <th className="px-2 py-2">Officer</th>
                <th className="px-2 py-2">Primary Block</th>
                <th className="px-2 py-2">Assigned</th>
                <th className="px-2 py-2">Completed</th>
                <th className="px-2 py-2">Pending</th>
                <th className="px-2 py-2">Today</th>
                <th className="px-2 py-2">Avg Completion</th>
                <th className="px-2 py-2">Last Activity</th>
                <th className="px-2 py-2">Completion %</th>
                <th className="px-2 py-2">Score</th>
                <th className="px-2 py-2" />
              </tr>
            </thead>
            <tbody>
              {os.map((o) => (
                <tr key={o.officer} className="border-b border-border/70 hover:bg-secondary/60">
                  <td className="num px-2 py-2 font-semibold">{o.rank}</td>
                  <td className="px-2 py-2 font-semibold">{o.officer}</td>
                  <td className="px-2 py-2">{o.block}</td>
                  <td className="num px-2 py-2">{o.assigned}</td>
                  <td className="num px-2 py-2 text-gov-green">{o.completed}</td>
                  <td className="num px-2 py-2 text-gov-red">{o.pending}</td>
                  <td className="num px-2 py-2">{o.today}</td>
                  <td className="num px-2 py-2">{o.avgDays}d</td>
                  <td className="px-2 py-2">
                    <span className={cn("num", o.inactiveDays >= 5 && "font-semibold text-gov-red")}>{o.lastActivity}</span>
                    {o.inactiveDays >= 5 ? (
                      <Badge variant="outline" className="ml-1.5 border-gov-red/40 bg-gov-red-soft text-[10px] text-gov-red">
                        Inactive {o.inactiveDays}d
                      </Badge>
                    ) : null}
                  </td>
                  <td className="px-2 py-2">
                    <Bar value={o.pct} tone={o.pct >= 70 ? "green" : "red"} />
                  </td>
                  <td className="num px-2 py-2 font-semibold">{o.score}</td>
                  <td className="px-2 py-2">
                    <Button size="sm" variant="outline" onClick={() => setFilter("officer", o.officer)}>
                      Cases
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
