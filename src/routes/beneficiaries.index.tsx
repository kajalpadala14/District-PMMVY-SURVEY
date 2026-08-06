import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { FilterPanel } from "@/components/dash/filter-panel";
import { useFilters } from "@/components/dash/filters-context";
import { Panel, PageTitle } from "@/components/dash/panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/beneficiaries/")({
  head: () => ({
    meta: [
      { title: "Pending Beneficiaries | MVY District Command Centre" },
      {
        name: "description",
        content: "Search and drill into pending Mahtari Vandan Yojana beneficiaries by name, application ID, village, GP or block.",
      },
      { property: "og:title", content: "Pending Beneficiaries | MVY District Command Centre" },
      { property: "og:description", content: "Instant search across district beneficiaries with survey and pending status." },
    ],
  }),
  component: Beneficiaries,
});

const PAGE = 20;

function Beneficiaries() {
  const { rows } = useFilters();
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const safePage = Math.min(page, pages - 1);
  const view = rows.slice(safePage * PAGE, safePage * PAGE + PAGE);

  return (
    <>
      <PageTitle title="Beneficiary Register" subtitle="Instant search by name, application ID, mobile, village, GP or block" />
      <FilterPanel />

      <Panel title="Beneficiaries" subtitle={`${rows.length.toLocaleString("en-IN")} records in current selection`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-xs">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                <th className="px-2 py-2">Application ID</th>
                <th className="px-2 py-2">Name</th>
                <th className="px-2 py-2">Village</th>
                <th className="px-2 py-2">GP</th>
                <th className="px-2 py-2">Block</th>
                <th className="px-2 py-2">Pending Reason</th>
                <th className="px-2 py-2">Survey</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">Pending Days</th>
                <th className="px-2 py-2" />
              </tr>
            </thead>
            <tbody>
              {view.map((b) => (
                <tr key={b.id} className="border-b border-border/70 hover:bg-secondary/60">
                  <td className="num px-2 py-2">{b.appId}</td>
                  <td className="px-2 py-2 font-semibold">{b.name}</td>
                  <td className="px-2 py-2">{b.village}</td>
                  <td className="px-2 py-2">{b.gp}</td>
                  <td className="px-2 py-2">{b.block}</td>
                  <td className="px-2 py-2">{b.reason}</td>
                  <td className="px-2 py-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        b.surveyStatus === "Completed"
                          ? "border-gov-green/40 bg-gov-green-soft text-gov-green"
                          : "border-gov-amber/40 bg-gov-amber-soft text-gov-amber",
                      )}
                    >
                      {b.surveyStatus}
                    </Badge>
                  </td>
                  <td className="px-2 py-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        b.caseStatus === "Resolved"
                          ? "border-gov-green/40 bg-gov-green-soft text-gov-green"
                          : "border-gov-red/40 bg-gov-red-soft text-gov-red",
                      )}
                    >
                      {b.caseStatus}
                    </Badge>
                  </td>
                  <td className={cn("num px-2 py-2", b.pendingDays >= 30 && "font-semibold text-gov-red")}>{b.pendingDays}</td>
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

        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Page {safePage + 1} of {pages}
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>
              Previous
            </Button>
            <Button size="sm" variant="outline" disabled={safePage >= pages - 1} onClick={() => setPage(safePage + 1)}>
              Next
            </Button>
          </div>
        </div>
      </Panel>
    </>
  );
}
