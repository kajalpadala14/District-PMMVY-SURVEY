import { REGISTRATION_ISSUES, type Beneficiary } from "@/data/district";

export const ISSUE_REPORT_OPTIONS = [...REGISTRATION_ISSUES];

export const ISSUE_DETAIL_HEADERS = [
  "Application ID",
  "Beneficiary ID",
  "Name",
  "Project",
  "Block",
  "Gram Panchayat",
  "Village",
  "Mobile",
  "Aadhaar",
  "Selected Issue",
  "Pending Reason",
  "All Reasons",
  "Registered",
  "Reason Known",
  "Survey Status",
  "Case Status",
  "Pending Days",
  "Priority",
  "Officer",
  "Last Survey",
  "Remark",
];

export function issueDetailRows(rows: Beneficiary[], issue?: string) {
  return rows.filter((row) => hasIssueDetail(row) && (!issue || beneficiaryHasIssue(row, issue))).map((row) => [
    row.appId,
    row.id,
    row.name,
    row.project ?? "",
    row.block,
    row.gp,
    row.village,
    row.mobile,
    row.aadhaar,
    getIssueText(row),
    row.reason,
    row.reasons?.join(", ") ?? "",
    row.registrationStatus ?? "",
    row.reasonKnown ?? "",
    row.surveyStatus,
    row.caseStatus,
    row.pendingDays,
    row.priority,
    row.officer,
    row.lastSurvey ?? "",
    row.remark ?? "",
  ]);
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
  if (row.issueFlags?.[issue]) return true;

  const pendingReason = issue === "Document Missing" || issue === "Other" ? "Other / Document" : issue;
  return row.reason === pendingReason || Boolean(row.reasons?.includes(pendingReason));
}
