// Demo dataset for the Matru Vandana Yojana survey and monitoring dashboard.
// Deterministic (seeded) so numbers stay stable across renders/SSR.

export const DISTRICT = "Dantewada";
export const STATE = "Chhattisgarh";
export const SCHEME = "मातृ वंदना योजना";
export const AS_OF = "05 Aug 2026, 09:30 IST";

export const PENDING_REASONS = [
  "MCP Card Missing",
  "Bank Account Issue",
  "Aadhaar Mismatch",
  "Aadhaar-Bank Link",
  "Other / Document",
] as const;
export type PendingReason = (typeof PENDING_REASONS)[number];

export type SurveyStatus = "Completed" | "Pending";
export type CaseStatus = "Pending" | "Resolved";

export interface Beneficiary {
  id: string;
  appId: string;
  name: string;
  mobile: string;
  aadhaar: string;
  village: string;
  gp: string;
  block: string;
  reason: PendingReason;
  caseStatus: CaseStatus;
  surveyStatus: SurveyStatus;
  officer: string;
  pendingDays: number;
  lastSurvey: string | null;
  priority: "High" | "Medium" | "Low";
}

const BLOCKS = [
  "Dantewada",
  "Geedam",
  "Katekalyan",
  "Kuakonda",
] as const;

const GP_NAMES: Record<string, string[]> = {
  Dantewada: ["Bade Bacheli", "Balood", "Bhansi", "Chitalanka", "Gadapal", "Kamaloor", "Kumharras", "Teknar"],
  Geedam: ["Bade Karli", "Bade Paneda", "Hiranar", "Javanga", "Kasoli", "Pharaspal", "Samalur", "Tumrigunda"],
  Katekalyan: ["Bade Gudra", "Benglur", "Chikpal", "Gatam", "Katekalyan", "Mokhpal", "Parcheli", "Telam"],
  Kuakonda: ["Aranpur", "Burgum", "Cholnar", "Hiroli", "Kuwakonda", "Nakulnar", "Palnar", "Sameli"],
};

const FIRST = ["Sunita", "Phulwanti", "Kamla", "Radhika", "Savitri", "Anita", "Dhaneshwari", "Lakshmi", "Bhagwati", "Sushila", "Rukmani", "Gayatri", "Chandrakala", "Yashoda", "Parvati", "Meena"];
const LAST = ["Sahu", "Verma", "Yadav", "Dhruw", "Nishad", "Bareth", "Patel", "Kaushik", "Tandon", "Ratre", "Sonwani", "Markam"];

export const OFFICER_NAMES = [
  "R. K. Sahu",
  "S. Verma",
  "P. Dhruw",
  "M. Tandon",
  "A. Nishad",
  "K. Bareth",
  "D. Yadav",
  "J. Patel",
  "N. Sonwani",
  "V. Markam",
  "L. Kaushik",
  "T. Ratre",
];

function mulberry(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function build(): Beneficiary[] {
  const rand = mulberry(20260805);
  const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)]!;
  const rows: Beneficiary[] = [];
  const TOTAL = 1284; // 947 pending + 337 resolved
  const targetPending = 947;
  let pending = 0;

  // Block weights so ranking is meaningful
  const weight: Record<string, number> = {
    Kuakonda: 1.8,
    Geedam: 1.4,
    Dantewada: 1.1,
    Katekalyan: 0.9,
  };
  const pool: string[] = [];
  BLOCKS.forEach((b) => {
    for (let i = 0; i < Math.round(weight[b]! * 10); i++) pool.push(b);
  });

  for (let i = 0; i < TOTAL; i++) {
    const block = pool[Math.floor(rand() * pool.length)]!;
    const gp = pick(GP_NAMES[block]!);
    const village = `${gp} ${pick(["", "Kalan", "Khurd", "Para", "Basti"])}`.trim();
    const isPending = pending < targetPending && (rand() < 0.75 || TOTAL - i <= targetPending - pending);
    if (isPending) pending++;
    const days = Math.floor(rand() * 62);
    const surveyDone = isPending ? rand() < 0.58 : true;
    rows.push({
      id: `BEN${(10000 + i).toString()}`,
      appId: `MVY/${block.slice(0, 3).toUpperCase()}/${20000 + i}`,
      name: `${pick(FIRST)} ${pick(LAST)}`,
      mobile: `9${Math.floor(100000000 + rand() * 899999999)}`,
      aadhaar: `XXXX XXXX ${Math.floor(1000 + rand() * 8999)}`,
      village,
      gp,
      block,
      reason: pick(PENDING_REASONS),
      caseStatus: isPending ? "Pending" : "Resolved",
      surveyStatus: surveyDone ? "Completed" : "Pending",
      officer: pick(OFFICER_NAMES),
      pendingDays: isPending ? days : Math.floor(rand() * 20),
      lastSurvey: surveyDone ? isoDaysAgo(Math.floor(rand() * 21)) : null,
      priority: days > 30 ? "High" : days > 14 ? "Medium" : "Low",
    });
  }
  return rows;
}

function isoDaysAgo(d: number) {
  const base = Date.UTC(2026, 7, 5);
  return new Date(base - d * 86400000).toISOString().slice(0, 10);
}

export const beneficiaries: Beneficiary[] = build();

export const blockList = [...BLOCKS] as string[];
export const gpList = Object.entries(GP_NAMES).flatMap(([b, gs]) => gs.map((g) => ({ block: b, gp: g })));

/* ---------------- Aggregations ---------------- */

export interface Filters {
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
      (!f.block || r.block === f.block) &&
      (!f.gp || r.gp === f.gp) &&
      (!f.village || r.village === f.village) &&
      (!f.reason || r.reason === f.reason) &&
      (!f.officer || r.officer === f.officer) &&
      (!f.survey || r.surveyStatus === f.survey) &&
      (!f.status || r.caseStatus === f.status) &&
      (!q ||
        r.name.toLowerCase().includes(q) ||
        r.appId.toLowerCase().includes(q) ||
        r.mobile.includes(q) ||
        r.village.toLowerCase().includes(q) ||
        r.gp.toLowerCase().includes(q)),
  );
}

export function kpis(rows: Beneficiary[]) {
  const total = rows.length;
  const pending = rows.filter((r) => r.caseStatus === "Pending");
  const resolved = total - pending.length;
  const surveyDone = rows.filter((r) => r.surveyStatus === "Completed").length;
  const over30 = pending.filter((r) => r.pendingDays >= 30).length;
  const over7 = pending.filter((r) => r.pendingDays >= 7).length;
  const high = pending.filter((r) => r.priority === "High").length;
  return {
    total,
    pending: pending.length,
    resolved,
    surveyDone,
    surveyPending: total - surveyDone,
    surveyProgress: total ? Math.round((surveyDone / total) * 1000) / 10 : 0,
    pendingPct: total ? Math.round((pending.length / total) * 1000) / 10 : 0,
    todaySurveys: 63,
    todayResolved: 21,
    avgResolutionDays: 11.4,
    over7,
    over30,
    high,
  };
}

export interface BlockStat {
  block: string;
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
  avgRes: number;
  officers: number;
  score: number;
}

export function blockStats(rows: Beneficiary[]): BlockStat[] {
  const map = new Map<string, Beneficiary[]>();
  rows.forEach((r) => map.set(r.block, [...(map.get(r.block) ?? []), r]));
  const out = [...map.entries()].map(([block, rs]) => {
    const pending = rs.filter((r) => r.caseStatus === "Pending").length;
    const completed = rs.filter((r) => r.surveyStatus === "Completed").length;
    const by = (reason: PendingReason) => rs.filter((r) => r.caseStatus === "Pending" && r.reason === reason).length;
    const surveyPct = Math.round((completed / rs.length) * 1000) / 10;
    return {
      block,
      total: rs.length,
      pending,
      completed,
      resolved: rs.length - pending,
      surveyPct,
      mcp: by("MCP Card Missing"),
      bank: by("Bank Account Issue"),
      aadhaar: by("Aadhaar Mismatch"),
      link: by("Aadhaar-Bank Link"),
      other: by("Other / Document"),
      avgRes: Math.round((8 + (pending % 9)) * 10) / 10,
      officers: new Set(rs.map((r) => r.officer)).size,
      score: Math.round(surveyPct * 0.7 + ((rs.length - pending) / rs.length) * 100 * 0.3),
    };
  });
  return out.sort((a, b) => b.pending - a.pending);
}

export function gpStats(rows: Beneficiary[]) {
  const map = new Map<string, Beneficiary[]>();
  rows.forEach((r) => map.set(`${r.block}|${r.gp}`, [...(map.get(`${r.block}|${r.gp}`) ?? []), r]));
  return [...map.entries()]
    .map(([key, rs]) => {
      const [block, gp] = key.split("|") as [string, string];
      const pending = rs.filter((r) => r.caseStatus === "Pending").length;
      const completed = rs.filter((r) => r.surveyStatus === "Completed").length;
      const by = (reason: PendingReason) => rs.filter((r) => r.caseStatus === "Pending" && r.reason === reason).length;
      return {
        block,
        gp,
        villages: new Set(rs.map((r) => r.village)).size,
        total: rs.length,
        pending,
        completed,
        surveyPending: rs.length - completed,
        mcp: by("MCP Card Missing"),
        bank: by("Bank Account Issue"),
        aadhaar: by("Aadhaar Mismatch"),
        link: by("Aadhaar-Bank Link"),
        other: by("Other / Document"),
        surveyPct: Math.round((completed / rs.length) * 1000) / 10,
        high: rs.filter((r) => r.priority === "High" && r.caseStatus === "Pending").length,
      };
    })
    .sort((a, b) => b.pending - a.pending);
}

export function villageStats(rows: Beneficiary[]) {
  const map = new Map<string, Beneficiary[]>();
  rows.forEach((r) => map.set(`${r.block}|${r.gp}|${r.village}`, [...(map.get(`${r.block}|${r.gp}|${r.village}`) ?? []), r]));
  return [...map.entries()]
    .map(([key, rs]) => {
      const [block, gp, village] = key.split("|") as [string, string, string];
      const pending = rs.filter((r) => r.caseStatus === "Pending").length;
      const completed = rs.filter((r) => r.surveyStatus === "Completed").length;
      const last = rs.map((r) => r.lastSurvey).filter(Boolean).sort().at(-1) ?? null;
      return {
        block,
        gp,
        village,
        total: rs.length,
        pending,
        completed,
        surveyPct: Math.round((completed / rs.length) * 1000) / 10,
        officer: rs[0]!.officer,
        lastSurvey: last,
        critical: rs.filter((r) => r.priority === "High" && r.caseStatus === "Pending").length,
      };
    })
    .sort((a, b) => b.pending - a.pending);
}

export function officerStats(rows: Beneficiary[]) {
  const map = new Map<string, Beneficiary[]>();
  rows.forEach((r) => map.set(r.officer, [...(map.get(r.officer) ?? []), r]));
  return [...map.entries()]
    .map(([officer, rs], i) => {
      const completed = rs.filter((r) => r.surveyStatus === "Completed").length;
      const pct = Math.round((completed / rs.length) * 1000) / 10;
      const inactiveDays = [0, 1, 1, 2, 3, 4, 6, 7, 0, 2, 9, 1][i % 12]!;
      return {
        officer,
        block: rs[0]!.block,
        assigned: rs.length,
        completed,
        pending: rs.length - completed,
        today: Math.max(0, 9 - inactiveDays - (i % 3)),
        avgDays: Math.round((6 + (i % 7)) * 10) / 10,
        lastActivity: isoDaysAgo(inactiveDays),
        inactiveDays,
        pct,
        score: Math.round(pct * 0.8 + Math.max(0, 20 - inactiveDays * 3)),
      };
    })
    .sort((a, b) => b.score - a.score)
    .map((o, i) => ({ ...o, rank: i + 1 }));
}

export function reasonStats(rows: Beneficiary[]) {
  return PENDING_REASONS.map((reason) => ({
    reason,
    count: rows.filter((r) => r.caseStatus === "Pending" && r.reason === reason).length,
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

export const trend = Array.from({ length: 14 }, (_, i) => {
  const r = mulberry(1000 + i);
  return {
    date: isoDaysAgo(13 - i).slice(5),
    surveys: Math.round(35 + r() * 45),
    resolved: Math.round(10 + r() * 26),
  };
});

export function alerts(rows: Beneficiary[]) {
  const bs = blockStats(rows);
  const gs = gpStats(rows);
  const vs = villageStats(rows);
  const os = officerStats(rows);
  const out: { level: "critical" | "warning" | "info"; title: string; detail: string }[] = [];
  bs.filter((b) => b.pending > 100).forEach((b) =>
    out.push({ level: "critical", title: `${b.block} block: ${b.pending} pending`, detail: `Crossed 100-case threshold · Survey ${b.surveyPct}%` }),
  );
  os.filter((o) => o.inactiveDays >= 5).forEach((o) =>
    out.push({ level: "critical", title: `Officer inactive: ${o.officer}`, detail: `No survey for ${o.inactiveDays} days · ${o.pending} cases open` }),
  );
  const over30 = rows.filter((r) => r.caseStatus === "Pending" && r.pendingDays >= 30).length;
  out.push({ level: "warning", title: `${over30} beneficiaries pending 30+ days`, detail: "Escalate to Block Officers for time-bound closure" });
  if (gs[0]) out.push({ level: "warning", title: `GP ${gs[0].gp} needs intervention`, detail: `${gs[0].pending} pending · survey ${gs[0].surveyPct}%` });
  if (vs[0]) out.push({ level: "info", title: `Highest pending village: ${vs[0].village}`, detail: `${vs[0].pending} pending · officer ${vs[0].officer}` });
  bs.filter((b) => b.surveyPct < 60).forEach((b) =>
    out.push({ level: "warning", title: `${b.block} survey below target`, detail: `${b.surveyPct}% against 75% district target` }),
  );
  return out;
}

export const activity = [
  { time: "09:24", type: "Survey", text: "Survey completed — Sunita Sahu (MVY/KAS/20418) by P. Dhruw" },
  { time: "09:11", type: "Resolved", text: "Case resolved — Bank account corrected, Kharora GP" },
  { time: "08:58", type: "Upload", text: "MCP card uploaded — Phulwanti Verma, Devri" },
  { time: "08:40", type: "Officer", text: "3 beneficiaries reassigned to K. Bareth (Kuakonda)" },
  { time: "08:22", type: "Survey", text: "Survey updated — Aadhaar-Bank link initiated, Suhela" },
  { time: "08:05", type: "Resolved", text: "Case resolved — Aadhaar mismatch rectified, Hathband" },
];
