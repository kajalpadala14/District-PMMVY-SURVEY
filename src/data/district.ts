export const PENDING_REASONS = [
  "MCP Card Missing",
  "Bank Account Issue",
  "Aadhaar Mismatch",
  "Aadhaar-Bank Link",
  "Other / Document",
] as const;
export type PendingReason = (typeof PENDING_REASONS)[number];

export const REGISTRATION_REASONS = [
  "Beneficiary not registered",
  "Aadhaar unavailable",
  "Bank account unavailable",
  "Mobile number unavailable",
  "Documents pending",
  "Other",
] as const;
export type RegistrationReason = (typeof REGISTRATION_REASONS)[number];

export const REGISTRATION_ISSUES = [
  "Aadhaar Mismatch",
  "Aadhaar-Bank Link",
  "Bank Account Issue",
  "MCP Card Missing",
  "Document Missing",
  "Other",
] as const;
export type RegistrationIssue = (typeof REGISTRATION_ISSUES)[number];

export type SurveyStatus = "Completed" | "Pending" | "In Progress" | "Reason Pending";
export type CaseStatus = "Pending" | "Resolved";

const PROJECT_ALIASES: Record<string, string> = {
  KATAKALYAN: "Katekalyan",
};

export interface Beneficiary {
  id: string;
  appId: string;
  serialNo?: string;
  project?: string;
  name: string;
  age?: string;
  gender?: string;
  guardian?: string;
  mobile: string;
  aadhaar: string;
  village: string;
  gp: string;
  block: string;
  rawBlock?: string;
  reason: string;
  reasons?: string[];
  caseStatus: CaseStatus;
  surveyStatus: SurveyStatus;
  registrationStatus?: "Yes" | "No" | "";
  reasonKnown?: "Yes" | "No" | "";
  registrationReason?: string;
  issue?: string;
  officer: string;
  pendingDays: number;
  lastSurvey: string | null;
  priority: "High" | "Medium" | "Low";
  remark?: string;
  issueFlags?: Record<string, boolean>;
}

export interface Filters {
  project?: string;
  block?: string;
  gp?: string;
  village?: string;
  reason?: string;
  officer?: string;
  survey?: string;
  status?: string;
  q?: string;
}

export function applyFilters(rows: Beneficiary[], f: Filters) {
  const q = f.q?.trim().toLowerCase();
  return rows.filter(
    (r) =>
      (!f.project || r.project === f.project) &&
      (!f.block || r.block === f.block) &&
      (!f.gp || r.gp === f.gp) &&
      (!f.village || r.village === f.village) &&
      (!f.reason || r.reason === f.reason || r.reasons?.includes(f.reason)) &&
      (!f.officer || r.officer === f.officer) &&
      (!f.survey || r.surveyStatus === f.survey) &&
      (!f.status || r.caseStatus === f.status) &&
      (!q ||
        r.name.toLowerCase().includes(q) ||
        r.appId.toLowerCase().includes(q) ||
        r.mobile.includes(q) ||
        (r.project ?? "").toLowerCase().includes(q) ||
        r.village.toLowerCase().includes(q) ||
        r.gp.toLowerCase().includes(q) ||
        r.block.toLowerCase().includes(q)),
  );
}

export function normalizeProjectName(value?: string) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return PROJECT_ALIASES[text.toUpperCase()] || text;
}

export function kpis(rows: Beneficiary[]) {
  const total = rows.length;
  const pending = rows.filter((r) => r.caseStatus === "Pending");
  const resolved = total - pending.length;
  const surveyDone = rows.filter((r) => r.surveyStatus === "Completed").length;
  const over30 = pending.filter((r) => r.pendingDays >= 30).length;
  const over7 = pending.filter((r) => r.pendingDays >= 7).length;
  const high = pending.filter((r) => r.priority === "High").length;
  const issueNoCount = PENDING_REASONS.reduce((sum, reason) => sum + reasonCount(pending, reason), 0);
  return {
    total,
    pending: pending.length,
    resolved,
    surveyDone,
    surveyPending: total - surveyDone,
    issueNoCount,
    surveyProgress: total ? Math.round((surveyDone / total) * 1000) / 10 : 0,
    pendingPct: total ? Math.round((pending.length / total) * 1000) / 10 : 0,
    over7,
    over30,
    high,
  };
}

export interface BlockStat {
  projectSummary: string;
  block: string;
  blockLabel: string;
  total: number;
  pending: number;
  completed: number;
  resolved: number;
  surveyPct: number;
  mcp: number;
  bank: number;
  aadhaar: number;
  link: number;
  other: number;
  officers: number;
  score: number;
}

export interface ProjectStat {
  project: string;
  total: number;
  pending: number;
  completed: number;
  resolved: number;
  surveyPct: number;
  blocks: number;
  gps: number;
  villages: number;
  mcp: number;
  bank: number;
  aadhaar: number;
  link: number;
  other: number;
  score: number;
}

export function projectStats(rows: Beneficiary[]): ProjectStat[] {
  const map = groupBy(rows.filter((r) => r.project), (r) => r.project || "");
  return [...map.entries()]
    .map(([project, rs]) => {
      const pending = rs.filter((r) => r.caseStatus === "Pending").length;
      const completed = rs.filter((r) => r.surveyStatus === "Completed").length;
      const surveyPct = rs.length ? Math.round((completed / rs.length) * 1000) / 10 : 0;
      return {
        project,
        total: rs.length,
        pending,
        completed,
        resolved: rs.length - pending,
        surveyPct,
        blocks: new Set(rs.map((r) => r.block).filter(Boolean)).size,
        gps: new Set(rs.map((r) => `${r.block}|${r.gp}`).filter(Boolean)).size,
        villages: new Set(rs.map((r) => `${r.block}|${r.gp}|${r.village}`).filter(Boolean)).size,
        mcp: reasonCount(rs, "MCP Card Missing"),
        bank: reasonCount(rs, "Bank Account Issue"),
        aadhaar: reasonCount(rs, "Aadhaar Mismatch"),
        link: reasonCount(rs, "Aadhaar-Bank Link"),
        other: reasonCount(rs, "Other / Document"),
        score: Math.round(surveyPct * 0.7 + (rs.length ? ((rs.length - pending) / rs.length) * 100 * 0.3 : 0)),
      };
    })
    .sort((a, b) => b.pending - a.pending);
}

export function blockStats(rows: Beneficiary[]): BlockStat[] {
  const map = groupBy(rows, (r) => r.block);
  return [...map.entries()]
    .map(([block, rs]) => {
      const pending = rs.filter((r) => r.caseStatus === "Pending").length;
      const completed = rs.filter((r) => r.surveyStatus === "Completed").length;
      const surveyPct = rs.length ? Math.round((completed / rs.length) * 1000) / 10 : 0;
      return {
        projectSummary: "",
        block,
        blockLabel: block,
        total: rs.length,
        pending,
        completed,
        resolved: rs.length - pending,
        surveyPct,
        mcp: reasonCount(rs, "MCP Card Missing"),
        bank: reasonCount(rs, "Bank Account Issue"),
        aadhaar: reasonCount(rs, "Aadhaar Mismatch"),
        link: reasonCount(rs, "Aadhaar-Bank Link"),
        other: reasonCount(rs, "Other / Document"),
        officers: new Set(rs.map((r) => r.officer).filter(Boolean)).size,
        score: Math.round(surveyPct * 0.7 + (rs.length ? ((rs.length - pending) / rs.length) * 100 * 0.3 : 0)),
      };
    })
    .sort((a, b) => b.pending - a.pending);
}

export function gpStats(rows: Beneficiary[]) {
  return [...groupBy(rows, (r) => `${r.project || ""}|${r.block}|${r.gp}`).entries()]
    .map(([key, rs]) => {
      const [project = "", block = "", gp = ""] = key.split("|");
      const pending = rs.filter((r) => r.caseStatus === "Pending").length;
      const completed = rs.filter((r) => r.surveyStatus === "Completed").length;
      return {
        project,
        block,
        gp,
        villages: new Set(rs.map((r) => r.village)).size,
        total: rs.length,
        pending,
        completed,
        surveyPending: rs.length - completed,
        mcp: reasonCount(rs, "MCP Card Missing"),
        bank: reasonCount(rs, "Bank Account Issue"),
        aadhaar: reasonCount(rs, "Aadhaar Mismatch"),
        link: reasonCount(rs, "Aadhaar-Bank Link"),
        other: reasonCount(rs, "Other / Document"),
        surveyPct: rs.length ? Math.round((completed / rs.length) * 1000) / 10 : 0,
        high: rs.filter((r) => r.priority === "High" && r.caseStatus === "Pending").length,
      };
    })
    .sort((a, b) => b.pending - a.pending);
}

export function villageStats(rows: Beneficiary[]) {
  return [...groupBy(rows, (r) => `${r.project || ""}|${r.block}|${r.gp}|${r.village}`).entries()]
    .map(([key, rs]) => {
      const [project = "", block = "", gp = "", village = ""] = key.split("|");
      const pending = rs.filter((r) => r.caseStatus === "Pending").length;
      const completed = rs.filter((r) => r.surveyStatus === "Completed").length;
      const last = rs.map((r) => r.lastSurvey).filter(Boolean).sort().at(-1) ?? null;
      return {
        project,
        block,
        gp,
        village,
        total: rs.length,
        pending,
        completed,
        surveyPct: rs.length ? Math.round((completed / rs.length) * 1000) / 10 : 0,
        officer: rs[0]?.officer ?? "",
        lastSurvey: last,
        mcp: reasonCount(rs, "MCP Card Missing"),
        bank: reasonCount(rs, "Bank Account Issue"),
        aadhaar: reasonCount(rs, "Aadhaar Mismatch"),
        link: reasonCount(rs, "Aadhaar-Bank Link"),
        other: reasonCount(rs, "Other / Document"),
        critical: rs.filter((r) => r.priority === "High" && r.caseStatus === "Pending").length,
      };
    })
    .sort((a, b) => b.pending - a.pending);
}

export function officerStats(rows: Beneficiary[]) {
  return [...groupBy(rows, (r) => r.officer).entries()]
    .map(([officer, rs], i) => {
      const completed = rs.filter((r) => r.surveyStatus === "Completed").length;
      const pct = rs.length ? Math.round((completed / rs.length) * 1000) / 10 : 0;
      return {
        officer,
        block: rs[0]?.block ?? "",
        assigned: rs.length,
        completed,
        pending: rs.length - completed,
        today: 0,
        avgDays: 0,
        lastActivity: rs.map((r) => r.lastSurvey).filter(Boolean).sort().at(-1) ?? null,
        inactiveDays: 0,
        pct,
        score: Math.round(pct),
        rank: i + 1,
      };
    })
    .sort((a, b) => b.score - a.score)
    .map((o, i) => ({ ...o, rank: i + 1 }));
}

export function reasonStats(rows: Beneficiary[]) {
  return PENDING_REASONS.map((reason) => ({
    reason,
    count: reasonCount(rows.filter((r) => r.caseStatus === "Pending"), reason),
  })).sort((a, b) => b.count - a.count);
}

export function ageBuckets(rows: Beneficiary[]) {
  const p = rows.filter((r) => r.caseStatus === "Pending");
  return [
    { bucket: "Today", count: p.filter((r) => r.pendingDays < 1).length },
    { bucket: "7+ days", count: p.filter((r) => r.pendingDays >= 7 && r.pendingDays < 15).length },
    { bucket: "15+ days", count: p.filter((r) => r.pendingDays >= 15 && r.pendingDays < 30).length },
    { bucket: "30+ days", count: p.filter((r) => r.pendingDays >= 30).length },
  ];
}

export function alerts(rows: Beneficiary[]) {
  const bs = blockStats(rows);
  const gs = gpStats(rows);
  const vs = villageStats(rows);
  const out: { level: "critical" | "warning" | "info"; title: string; detail: string }[] = [];
  bs.filter((b) => b.pending > 100).forEach((b) =>
    out.push({ level: "critical", title: `${b.block} block: ${b.pending} pending`, detail: `Crossed 100-case threshold · Survey ${b.surveyPct}%` }),
  );
  const over30 = rows.filter((r) => r.caseStatus === "Pending" && r.pendingDays >= 30).length;
  if (over30) out.push({ level: "warning", title: `${over30} beneficiaries pending 30+ days`, detail: "Escalate to Block Officers for time-bound closure" });
  if (gs[0]) out.push({ level: "warning", title: `GP ${gs[0].gp} needs intervention`, detail: `${gs[0].pending} pending · survey ${gs[0].surveyPct}%` });
  if (vs[0]) out.push({ level: "info", title: `Highest pending village: ${vs[0].village}`, detail: `${vs[0].pending} pending · officer ${vs[0].officer}` });
  bs.filter((b) => b.surveyPct < 60).forEach((b) =>
    out.push({ level: "warning", title: `${b.block} survey below target`, detail: `${b.surveyPct}% against 75% district target` }),
  );
  return out;
}

function reasonCount(rows: Beneficiary[], reason: PendingReason) {
  return rows.filter((r) => r.issueFlags?.[reason] || r.reason === reason || r.reasons?.includes(reason)).length;
}

function groupBy<T>(rows: T[], getKey: (row: T) => string) {
  const map = new Map<string, T[]>();
  rows.forEach((row) => {
    const key = getKey(row);
    if (!key) return;
    map.set(key, [...(map.get(key) ?? []), row]);
  });
  return map;
}
