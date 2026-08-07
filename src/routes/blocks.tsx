import { createFileRoute } from "@tanstack/react-router";
import { Layers3 } from "lucide-react";
import { FilterPanel } from "@/components/dash/filter-panel";
import { useFilters } from "@/components/dash/filters-context";
import { Bar, Panel, PageTitle, StatusPill } from "@/components/dash/panel";
import { HBar } from "@/components/dash/charts";
import { blockStats } from "@/data/district";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/blocks")({
  head: () => ({
    meta: [
      { title: "Block Monitoring | MVY District Command Centre" },
      {
        name: "description",
        content: "Block-wise scorecard of pending beneficiaries, issue split, survey percentage and performance score.",
      },
      { property: "og:title", content: "Block Monitoring | MVY District Command Centre" },
      { property: "og:description", content: "Block-wise pending load, issue split and performance ranking." },
    ],
  }),
  component: Blocks,
});

function Blocks() {
  const { rows, setFilter } = useFilters();
  const bs = blockStats(rows);

  return (
    <>
      <PageTitle title="Block Monitoring" subtitle="Compare all blocks on pending load, issue mix and survey performance" />
      <FilterPanel />

      <div className="grid gap-3 xl:grid-cols-3">
        <Panel title="Pending by Block" subtitle="Highest first">
          <HBar data={bs} nameKey="blockLabel" valueKey="pending" tone="var(--gov-red)" />
        </Panel>
        <Panel title="Survey % by Block" subtitle="District target 75%">
          <HBar data={bs} nameKey="blockLabel" valueKey="surveyPct" tone="var(--gov-green)" />
        </Panel>
        <Panel title="Performance Score" subtitle="Survey weightage 70% · resolution 30%">
          <HBar data={[...bs].sort((a, b) => a.score - b.score)} nameKey="blockLabel" valueKey="score" />
        </Panel>
      </div>

      <Panel title="Block Scorecard" subtitle="Click a block to drill down into its Gram Panchayats" className="mt-3">
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
    </>
  );
}
