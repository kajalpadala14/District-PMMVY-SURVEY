import { Link, useRouterState } from "@tanstack/react-router";
import { RotateCcw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useFilters } from "@/components/dash/filters-context";
import { cn } from "@/lib/utils";

const dashboardSections = [
  ["overview", "Overview"],
  ["projects", "Projects"],
  ["blocks", "Blocks"],
  ["gps", "Gram Panchayats"],
] as const;

export function PortalNavCard() {
  const { rows, activeCount, reset, isLoading, error, isSheetConfigured } = useFilters();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isDashboard = pathname === "/";
  const isBeneficiaries = pathname.startsWith("/beneficiaries");
  const isReports = pathname.startsWith("/reports");

  return (
    <section className="rounded-lg border border-border bg-surface px-4 py-4 shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-gov-blue">MVY - SURVEY Portal</p>
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
        <nav className="flex rounded-lg bg-secondary p-1">
          <Button size="sm" variant={isDashboard ? "outline" : "ghost"} asChild className={cn(isDashboard && "bg-background shadow-sm")}>
            <Link to="/">Dashboard</Link>
          </Button>
          <Button size="sm" variant={isBeneficiaries ? "outline" : "ghost"} asChild className={cn(isBeneficiaries && "bg-background shadow-sm")}>
            <Link to="/beneficiaries">Beneficiaries</Link>
          </Button>
          <Button size="sm" variant={isReports ? "outline" : "ghost"} asChild className={cn(isReports && "bg-background shadow-sm")}>
            <Link to="/reports">Reports</Link>
          </Button>
        </nav>

        <nav className="flex gap-2 overflow-x-auto pb-1">
          {dashboardSections.map(([id, label]) => (
            <Button key={id} variant="outline" size="sm" asChild className={id === "projects" ? "bg-cyan-100 hover:bg-cyan-100" : undefined}>
              <Link to="/" hash={id}>
                {label}
              </Link>
            </Button>
          ))}
        </nav>
      </div>
    </section>
  );
}
