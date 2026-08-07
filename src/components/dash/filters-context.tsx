import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  applyFilters,
  normalizeProjectName,
  type Beneficiary,
  type Filters,
} from "@/data/district";

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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL;
    if (!apiUrl) return;

    setIsLoading(true);
    setError(null);
    const params = new URLSearchParams({
      action: "beneficiaries",
    });

    fetch(`/api/sheet?${params.toString()}`)
      .then((response) => {
        if (!response.ok) throw new Error(`Sheet API failed: ${response.status}`);
        return response.json();
      })
      .then((payload) => {
        if (!payload.ok || !Array.isArray(payload.data)) throw new Error(payload.error || "Invalid sheet API response");
        setSourceRows(payload.data.map(normalizeBeneficiarySurveyStatus));
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
      const apiUrl = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL;
      if (!apiUrl) throw new Error("VITE_GOOGLE_APPS_SCRIPT_URL is not configured.");

      const response = await fetch("/api/sheet", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "updateSurvey", ...payload }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok || !result.data) {
        throw new Error(result.error || "Unable to save survey.");
      }

      const updated = normalizeBeneficiarySurveyStatus(result.data);
      setSourceRows((current) => current.map((row) => (row.id === updated.id ? updated : row)));
      return updated;
    };

    return {
      filters,
      setFilter,
      reset: () => setFilters({}),
      rows: applyFilters(sourceRows, filters),
      allRows: sourceRows,
      activeCount: Object.values(filters).filter(Boolean).length,
      isSheetConfigured: Boolean(import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL),
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
