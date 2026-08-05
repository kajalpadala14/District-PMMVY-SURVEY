import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import {
  applyFilters,
  beneficiaries,
  type Filters,
} from "@/data/district";

interface Ctx {
  filters: Filters;
  setFilter: (key: keyof Filters, value: string) => void;
  reset: () => void;
  rows: ReturnType<typeof applyFilters>;
  activeCount: number;
}

const FiltersContext = createContext<Ctx | null>(null);

export function FiltersProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<Filters>({});

  const value = useMemo<Ctx>(() => {
    const setFilter = (key: keyof Filters, v: string) =>
      setFilters((prev) => {
        const next: Filters = { ...prev, [key]: v || undefined };
        if (key === "block") {
          next.gp = undefined;
          next.village = undefined;
        }
        if (key === "gp") next.village = undefined;
        return next;
      });
    return {
      filters,
      setFilter,
      reset: () => setFilters({}),
      rows: applyFilters(beneficiaries, filters),
      activeCount: Object.values(filters).filter(Boolean).length,
    };
  }, [filters]);

  return <FiltersContext.Provider value={value}>{children}</FiltersContext.Provider>;
}

export function useFilters() {
  const ctx = useContext(FiltersContext);
  if (!ctx) throw new Error("useFilters must be used inside FiltersProvider");
  return ctx;
}
