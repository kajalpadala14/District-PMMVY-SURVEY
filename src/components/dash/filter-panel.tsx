import { Filter, RotateCcw } from "lucide-react";
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
import { OFFICER_NAMES, PENDING_REASONS, beneficiaries, blockList, gpList } from "@/data/district";
import { useFilters } from "./filters-context";

const ALL = "__all__";

export function FilterPanel() {
  const { filters, setFilter, reset, activeCount, rows } = useFilters();

  const gps = gpList.filter((g) => !filters.block || g.block === filters.block).map((g) => g.gp);
  const villages = [
    ...new Set(
      beneficiaries
        .filter((b) => (!filters.block || b.block === filters.block) && (!filters.gp || b.gp === filters.gp))
        .map((b) => b.village),
    ),
  ].sort();

  return (
    <div className="gov-panel mb-4 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 pr-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <Filter className="size-3.5" /> Filters
        </span>

        <Picker label="Block" value={filters.block} options={blockList} onChange={(v) => setFilter("block", v)} />
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
          options={[...OFFICER_NAMES]}
          onChange={(v) => setFilter("officer", v)}
        />
        <Input
          value={filters.q ?? ""}
          onChange={(e) => setFilter("q", e.target.value)}
          placeholder="Quick search"
          className="h-8 w-[160px] text-xs"
        />

        <div className="ml-auto flex items-center gap-2">
          <Badge variant="secondary" className="num">
            {rows.length.toLocaleString("en-IN")} records
          </Badge>
          <Button variant="ghost" size="sm" onClick={reset} disabled={activeCount === 0}>
            <RotateCcw className="size-3.5" /> Reset
          </Button>
        </div>
      </div>
    </div>
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
  return (
    <Select value={value ?? ALL} onValueChange={(v) => onChange(v === ALL ? "" : v)}>
      <SelectTrigger className="h-8 min-w-[132px] text-xs">
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
  );
}
