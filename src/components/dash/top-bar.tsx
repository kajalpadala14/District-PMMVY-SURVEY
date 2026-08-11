import { RefreshCw, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useFilters } from "./filters-context";

export function TopBar() {
  const { filters, setFilter, rows, isLoading } = useFilters();

  return (
    <header className="sticky top-0 z-30">
      <div className="gov-header-bg flex flex-wrap items-center gap-3 px-3 py-2.5 text-primary-foreground sm:px-5">
        <div className="min-w-0">
          <h1 className="truncate font-display text-base leading-tight font-semibold uppercase sm:text-lg">
            PMMVY - SURVEY Portal
          </h1>
          <p className="truncate text-[11px] text-primary-foreground/70">
            {isLoading ? "Loading sheet data..." : `${rows.length.toLocaleString("en-IN")} records in current selection`}
          </p>
        </div>

        <div className="ml-auto flex flex-1 items-center justify-end gap-2">
          <div className="relative hidden min-w-[190px] max-w-xs flex-1 md:block">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-primary-foreground/60" />
            <Input
              value={filters.q ?? ""}
              onChange={(e) => setFilter("q", e.target.value)}
              placeholder="Search name / application ID / mobile / village"
              className="h-9 border-primary-foreground/25 bg-primary-foreground/10 pl-8 text-primary-foreground placeholder:text-primary-foreground/55 focus-visible:ring-primary-foreground/40"
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground hover:bg-primary-foreground/10"
            onClick={() => window.location.reload()}
            aria-label="Refresh dashboard"
          >
            <RefreshCw className="size-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
