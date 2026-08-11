import { beneficiaryMatchesReason, formatBeneficiaryReasons, REGISTRATION_ISSUES, type Beneficiary } from "@/data/district";
import { getSurveyStatusLabel } from "@/lib/survey-status";

export const ISSUE_REPORT_OPTIONS = [...REGISTRATION_ISSUES];

export const ISSUE_DETAIL_HEADERS = [
  "Application ID",
  "Name",
  "Project",
  "Location",
  "Issue",
  "Registration",
  "Status",
  "Last Survey",
  "Remark",
];

export function issueDetailRows(rows: Beneficiary[], issue?: string) {
  return rows.filter((row) => hasIssueDetail(row) && (!issue || beneficiaryHasIssue(row, issue))).map((row) => {
    const selectedIssue = issue || getIssueText(row);
    return [
      row.appId,
      row.name,
      row.project ?? "",
      formatLocation(row),
      selectedIssue || formatBeneficiaryReasons(row),
      formatRegistration(row),
      formatStatus(row),
      row.lastSurvey ?? "",
      row.remark ?? "",
    ];
  });
}

function formatLocation(row: Pick<Beneficiary, "block" | "gp" | "village">) {
  return [row.block, row.gp, row.village].filter(Boolean).join(" / ");
}

function formatRegistration(row: Pick<Beneficiary, "registrationStatus" | "reasonKnown">) {
  if (row.registrationStatus === "No" && row.reasonKnown) return `No, reason ${row.reasonKnown === "Yes" ? "known" : "pending"}`;
  return row.registrationStatus || "";
}

function formatStatus(row: Pick<Beneficiary, "surveyStatus" | "caseStatus">) {
  return [getSurveyStatusLabel(row.surveyStatus), row.caseStatus].filter(Boolean).join(" + ");
}

function hasIssueDetail(row: Beneficiary) {
  return Boolean(getIssueText(row) || row.reason || row.reasons?.length);
}

function getIssueText(row: Beneficiary) {
  const selectedIssue = String(row.issue || "").trim();
  if (selectedIssue) return selectedIssue;

  const flaggedIssues = Object.entries(row.issueFlags ?? {})
    .filter(([, selected]) => selected)
    .map(([issue]) => issue);
  return flaggedIssues.join(", ");
}

export function beneficiaryHasIssue(row: Beneficiary, issue: string) {
  const selectedIssues = getIssueText(row)
    .split(/[,;|]/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (selectedIssues.includes(issue)) return true;
  if (selectedIssues.length && (issue === "Document Missing" || issue === "Other")) return false;
  if (row.issueFlags?.[issue]) return true;

  return beneficiaryMatchesReason(row, issue);
}
