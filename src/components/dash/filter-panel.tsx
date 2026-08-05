import { Filter, RotateCcw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PENDING_REASONS } from "@/data/district";
import { useFilters } from "./filters-context";

const ALL = "__all__";

export function FilterPanel() {
  const { filters, setFilter, reset, activeCount, rows, allRows } = useFilters();

  const blocks = unique(allRows.map((b) => b.block));
  const gps = unique(allRows.filter((b) => !filters.block || b.block === filters.block).map((b) => b.gp));
  const villages = [
    ...new Set(
      allRows
        .filter((b) => (!filters.block || b.block === filters.block) && (!filters.gp || b.gp === filters.gp))
        .map((b) => b.village),
    ),
  ].sort();
  const officers = unique(allRows.map((b) => b.officer).filter((officer) => officer && officer !== "Unassigned"));

  return (
    <div className="gov-panel mb-4 p-3.5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-md bg-gov-blue-soft text-gov-blue">
            <Filter className="size-3.5" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground">Filters</p>
            <p className="num text-[11px] text-muted-foreground">{activeCount} active</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="num">
            {rows.length.toLocaleString("en-IN")} records
          </Badge>
          <Button variant="ghost" size="sm" onClick={reset} disabled={activeCount === 0}>
            <RotateCcw className="size-3.5" /> Reset
          </Button>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        <SearchBox value={filters.q ?? ""} onChange={(v) => setFilter("q", v)} />
        <Picker label="Block" value={filters.block} options={blocks} onChange={(v) => setFilter("block", v)} />
        <Picker label="Gram Panchayat" value={filters.gp} options={gps} onChange={(v) => setFilter("gp", v)} />
        <Picker label="Village" value={filters.village} options={villages} onChange={(v) => setFilter("village", v)} />
        <Picker
          label="Pending Reason"
          value={filters.reason}
          options={[...PENDING_REASONS]}
          onChange={(v) => setFilter("reason", v)}
        />
        <Picker
          label="Survey Status"
          value={filters.survey}
          options={["Completed", "Pending"]}
          onChange={(v) => setFilter("survey", v)}
        />
        <Picker
          label="Case Status"
          value={filters.status}
          options={["Pending", "Resolved"]}
          onChange={(v) => setFilter("status", v)}
        />
        <Picker
          label="Survey Officer"
          value={filters.officer}
          options={officers}
          onChange={(v) => setFilter("officer", v)}
        />
      </div>
    </div>
  );
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function SearchBox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <label className="group relative lg:col-span-2 xl:col-span-1">
      <span className="mb-1 block text-[11px] font-medium text-muted-foreground">Search</span>
      <Search className="pointer-events-none absolute bottom-2.5 left-3 size-3.5 text-muted-foreground transition-colors group-focus-within:text-gov-blue" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Name / ID / mobile"
        className="h-9 bg-background pl-8 text-xs shadow-none"
      />
    </label>
  );
}

function Picker({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string | undefined;
  options: string[];
  onChange: (v: string) => void;
}) {
  const hasValue = Boolean(value);

  return (
    <label>
      <span className="mb-1 block text-[11px] font-medium text-muted-foreground">{label}</span>
      <Select value={value ?? ALL} onValueChange={(v) => onChange(v === ALL ? "" : v)}>
        <SelectTrigger
          className={`h-9 min-w-0 bg-background text-xs shadow-none ${
            hasValue ? "border-gov-blue/40 bg-gov-blue-soft/50 text-gov-navy" : ""
          }`}
        >
          <SelectValue placeholder={label} />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          <SelectItem value={ALL}>All {label}</SelectItem>
          {options.map((o) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
}
