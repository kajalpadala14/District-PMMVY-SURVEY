import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  applyFilters,
  normalizeProjectName,
  type Beneficiary,
  type Filters,
} from "@/data/district";
import { fetchSheetGet, fetchSheetPost, isSheetApiConfigured } from "@/lib/sheet-api";

const SHEET_ROWS_CACHE_KEY = "mvy.sheet.rows.v1";

interface Ctx {
  filters: Filters;
  setFilter: (key: keyof Filters, value: string) => void;
  reset: () => void;
  rows: ReturnType<typeof applyFilters>;
  allRows: Beneficiary[];
  activeCount: number;
  isSheetConfigured: boolean;
  isLoading: boolean;
  error: string | null;
  updateSurvey: (payload: {
    id: string;
    reason?: string;
    reasons: string[];
    remark?: string;
    officer?: string;
    surveyDate?: string;
    caseStatus?: string;
    surveyStatus?: string;
    registrationStatus?: "Yes" | "No";
    reasonKnown?: "Yes" | "No";
    registrationReason?: string;
    issue?: string;
  }) => Promise<Beneficiary>;
}

const FiltersContext = createContext<Ctx | null>(null);

export function FiltersProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<Filters>({});
  const [sourceRows, setSourceRows] = useState<Beneficiary[]>([]);
  const [isLoading, setIsLoading] = useState(() => isSheetApiConfigured());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSheetApiConfigured()) return;

    const cachedRows = readCachedRows();
    if (cachedRows.length) {
      setSourceRows(cachedRows);
    }

    setIsLoading(true);
    setError(null);
    const params = new URLSearchParams({
      action: "beneficiaries",
    });

    fetchSheetGet<Beneficiary[]>(params)
      .then((payload) => {
        if (!payload.ok || !Array.isArray(payload.data)) throw new Error(payload.error || "Invalid sheet API response");
        const rows = payload.data.map(normalizeBeneficiarySurveyStatus);
        setSourceRows(rows);
        writeCachedRows(rows);
      })
      .catch((error) => {
        console.error(error);
        setError(error instanceof Error ? error.message : "Unable to load sheet data");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const value = useMemo<Ctx>(() => {
    const setFilter = (key: keyof Filters, v: string) =>
      setFilters((prev) => {
        const next: Record<string, string | undefined> = { ...prev, [key]: v || undefined };
        if (key === "project") {
          delete next["block"];
          delete next["gp"];
          delete next["village"];
        }
        if (key === "block") {
          delete next["gp"];
          delete next["village"];
        }
        if (key === "gp") delete next["village"];
        Object.keys(next).forEach((k) => next[k] === undefined && delete next[k]);
        return next as Filters;
      });

    const updateSurvey: Ctx["updateSurvey"] = async (payload) => {
      if (!isSheetApiConfigured()) throw new Error("VITE_GOOGLE_APPS_SCRIPT_URL is not configured.");

      const result = await fetchSheetPost<Beneficiary>({ action: "updateSurvey", ...payload });
      if (!result.ok || !result.data) {
        throw new Error(result.error || "Unable to save survey.");
      }

      const updated = normalizeBeneficiarySurveyStatus(result.data);
      setSourceRows((current) => {
        const next = current.map((row) => (row.id === updated.id ? updated : row));
        writeCachedRows(next);
        return next;
      });
      return updated;
    };

    return {
      filters,
      setFilter,
      reset: () => setFilters({}),
      rows: applyFilters(sourceRows, filters),
      allRows: sourceRows,
      activeCount: Object.values(filters).filter(Boolean).length,
      isSheetConfigured: isSheetApiConfigured(),
      isLoading,
      error,
      updateSurvey,
    };
  }, [filters, sourceRows, isLoading, error]);

  return <FiltersContext.Provider value={value}>{children}</FiltersContext.Provider>;
}

export function useFilters() {
  const ctx = useContext(FiltersContext);
  if (!ctx) throw new Error("useFilters must be used inside FiltersProvider");
  return ctx;
}

function normalizeBeneficiarySurveyStatus(row: Beneficiary): Beneficiary {
  const project = normalizeProjectName(row.project);
  const hasRegistrationWorkflow = Boolean(row.registrationStatus || row.reasonKnown || row.registrationReason || row.issue);
  const normalized = project !== row.project ? { ...row, project } : row;
  if (row.surveyStatus === "Completed" && !hasRegistrationWorkflow && row.caseStatus !== "Resolved") {
    return { ...normalized, surveyStatus: "Pending" };
  }
  return normalized;
}

function readCachedRows() {
  if (typeof window === "undefined") return [];

  try {
    const text = window.localStorage.getItem(SHEET_ROWS_CACHE_KEY);
    if (!text) return [];
    const payload = JSON.parse(text) as { rows?: Beneficiary[] };
    return Array.isArray(payload.rows) ? payload.rows.map(normalizeBeneficiarySurveyStatus) : [];
  } catch {
    return [];
  }
}

function writeCachedRows(rows: Beneficiary[]) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      SHEET_ROWS_CACHE_KEY,
      JSON.stringify({
        cachedAt: new Date().toISOString(),
        rows,
      }),
    );
  } catch {
    // Storage can be full or disabled; live sheet data still works.
  }
}
