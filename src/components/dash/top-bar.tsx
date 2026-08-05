import { Bell, RefreshCw, Search, Download, CalendarClock } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AS_OF, DISTRICT, SCHEME, STATE } from "@/data/district";
import { useFilters } from "./filters-context";
import { toast } from "sonner";

export function TopBar() {
  const { filters, setFilter } = useFilters();

  return (
    <header className="sticky top-0 z-30">
      <div className="gov-header-bg flex flex-wrap items-center gap-3 px-3 py-2.5 text-primary-foreground sm:px-5">
        <SidebarTrigger className="text-primary-foreground hover:bg-primary-foreground/10" />
        <div className="min-w-0">
          <h1 className="truncate font-display text-base leading-tight font-semibold uppercase sm:text-lg">
            मातृ वंदन योजना सर्वेक्षण एवं मॉनिटरिंग डैशबोर्ड
          </h1>
          <p className="truncate text-[11px] text-primary-foreground/70">
            {SCHEME} · {DISTRICT}, {STATE}
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
            onClick={() => toast.success("Dashboard refreshed", { description: `Data as of ${AS_OF}` })}
          >
            <RefreshCw className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="relative text-primary-foreground hover:bg-primary-foreground/10"
            onClick={() => toast.warning("6 critical alerts require attention")}
          >
            <Bell className="size-4" />
            <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-gov-saffron" />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="hidden sm:inline-flex"
            onClick={() => toast.success("Export queued", { description: "Dashboard PDF will download shortly." })}
          >
            <Download className="size-4" /> Export
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-b border-border bg-surface px-3 py-2 text-xs sm:px-5">
        <InfoBit label="District" value={DISTRICT} />
        <InfoBit label="Blocks" value="4" />
        <InfoBit label="Gram Panchayats" value="169" />
        <InfoBit label="Survey Officers" value="12" />
        <Badge variant="outline" className="border-gov-green/40 bg-gov-green-soft text-gov-green">
          Live · auto refresh 60s
        </Badge>
        <span className="ml-auto flex items-center gap-1.5 text-muted-foreground">
          <CalendarClock className="size-3.5" /> Data as of {AS_OF}
        </span>
      </div>
    </header>
  );
}

function InfoBit({ label, value }: { label: string; value: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-semibold text-foreground">{value}</span>
    </span>
  );
}
