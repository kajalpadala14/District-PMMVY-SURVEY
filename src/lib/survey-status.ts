export function getSurveyStatusClass(status: string) {
  if (status === "Completed") return "border-gov-green/40 bg-gov-green-soft text-gov-green";
  if (status === "In Progress") return "border-gov-blue/40 bg-gov-blue-soft text-gov-blue";
  if (status === "Reason Pending") return "border-violet-300 bg-violet-50 text-violet-700";
  if (status === "Pending") return "border-gov-red/40 bg-gov-red-soft text-gov-red";
  return "border-border bg-secondary text-muted-foreground";
}
