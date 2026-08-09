import { useCallback, useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Check, ChevronsUpDown, Save } from "lucide-react";
import { toast } from "sonner";
import { useFilters } from "@/components/dash/filters-context";
import { Panel, PageTitle } from "@/components/dash/panel";
import { REGISTRATION_ISSUES } from "@/data/district";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface TimelineItem {
  date: string;
  time?: string;
  text: string;
  detail?: string;
  officer?: string;
  status?: string;
}

type YesNo = "Yes" | "No" | "";

export const Route = createFileRoute("/beneficiaries/$id")({
  loader: ({ params }) => {
    return { id: params.id };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Beneficiary not found | MVY" }, { name: "robots", content: "noindex" }] };
    }
    const title = "Beneficiary Profile | MVY";
    return {
      meta: [
        { title },
        { name: "description", content: "Sheet-backed beneficiary survey record." },
        { property: "og:title", content: title },
        { property: "og:description", content: "Sheet-backed beneficiary survey record." },
        { name: "robots", content: "noindex" },
      ],
    };
  },
  component: Detail,
});

function Detail() {
  const { id } = Route.useLoaderData();
  const { allRows, isLoading, isSheetConfigured, error, updateSurvey } = useFilters();
  const row = allRows.find((item) => item.id === id);
  const [registrationStatus, setRegistrationStatus] = useState<YesNo>("");
  const [reasonKnown, setReasonKnown] = useState<YesNo>("");
  const [issues, setIssues] = useState<string[]>([]);
  const [surveyDate, setSurveyDate] = useState(new Date().toISOString().slice(0, 10));
  const [remark, setRemark] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [isTimelineLoading, setIsTimelineLoading] = useState(false);
  const [timelineError, setTimelineError] = useState<string | null>(null);

  useEffect(() => {
    const savedRegistrationStatus = row?.registrationStatus === "Yes" || row?.registrationStatus === "No" ? row.registrationStatus : "";
    const inferredRegistrationStatus =
      savedRegistrationStatus || (row?.surveyStatus === "In Progress" ? "Yes" : row?.surveyStatus === "Reason Pending" || row?.issue ? "No" : "");
    const savedReasonKnown = row?.reasonKnown === "Yes" || row?.reasonKnown === "No" ? row.reasonKnown : "";

    setRegistrationStatus(inferredRegistrationStatus);
    setReasonKnown(savedReasonKnown || (inferredRegistrationStatus === "No" && row?.issue ? "Yes" : ""));
    setIssues(parseSavedIssues(row?.issue));
    setSurveyDate(row?.lastSurvey ?? new Date().toISOString().slice(0, 10));
    setRemark(row?.remark ?? "");
  }, [row]);

  const loadTimeline = useCallback(
    async (beneficiaryId: string) => {
      if (!isSheetConfigured) {
        setTimelineItems([]);
        setTimelineError(null);
        return;
      }

      setIsTimelineLoading(true);
      setTimelineError(null);
      try {
        const params = new URLSearchParams({ action: "timeline", id: beneficiaryId });
        const response = await fetch(`/api/sheet?${params.toString()}`);
        const payload = await response.json();
        if (!response.ok || !payload.ok || !Array.isArray(payload.data)) {
          throw new Error(payload.error || "Unable to load timeline.");
        }
        setTimelineItems(payload.data.filter(hasTimelineContent));
      } catch (error) {
        setTimelineItems([]);
        setTimelineError(error instanceof Error ? error.message : "Unable to load timeline.");
      } finally {
        setIsTimelineLoading(false);
      }
    },
    [isSheetConfigured],
  );

  useEffect(() => {
    if (!row) {
      setTimelineItems([]);
      setTimelineError(null);
      return;
    }
    void loadTimeline(row.id);
  }, [row, loadTimeline]);

  const saveSurvey = async (caseStatus?: "Pending" | "Resolved") => {
    if (!row) return;

    if (!registrationStatus) {
      toast.error("Registration verification required", {
        description: "Select whether the beneficiary is registered.",
      });
      return;
    }

    if (registrationStatus === "No" && !reasonKnown) {
      toast.error("Reason status required", {
        description: "Select whether the reason is known.",
      });
      return;
    }

    if (registrationStatus === "No" && reasonKnown === "Yes" && issues.length === 0) {
      toast.error("Issue required", {
        description: "Select at least one issue before submitting the survey.",
      });
      return;
    }

    const nextSurveyStatus = getWorkflowStatus(registrationStatus, reasonKnown);
    const selectedIssues = registrationStatus === "No" && reasonKnown === "Yes" ? issues : [];
    const reasons = selectedIssues.map(issueToPendingReason);

    setIsSaving(true);
    try {
      await updateSurvey({
        id: row.id,
        reason: reasons[0],
        reasons,
        remark,
        surveyDate,
        caseStatus,
        surveyStatus: nextSurveyStatus,
        registrationStatus,
        reasonKnown: registrationStatus === "No" ? reasonKnown : undefined,
        registrationReason: "",
        issue: selectedIssues,
      });
      toast.success(caseStatus === "Resolved" ? "Case marked resolved" : "Survey saved", {
        description: `${row.name} · ${row.village}`,
      });
      await loadTimeline(row.id);
    } catch (error) {
      toast.error("Survey not saved", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!row) {
    return (
      <>
        <Button variant="ghost" size="sm" asChild className="mb-2">
          <Link to="/beneficiaries">
            <ArrowLeft className="size-4" /> Back to register
          </Link>
        </Button>
        <Panel
          title={isLoading ? "Loading beneficiary" : "Beneficiary not available"}
          subtitle={
            error ||
            (isSheetConfigured
              ? "Sheet data is loading or this record was not found in the connected sheet."
              : "Add VITE_GOOGLE_APPS_SCRIPT_URL in .env to load data from your Google Sheet.")
          }
        >
          <p className="text-sm text-muted-foreground">No beneficiary record is available.</p>
        </Panel>
      </>
    );
  }

  const workflowStatus = getWorkflowStatus(registrationStatus, reasonKnown);
  const submitEnabled = canSubmit(registrationStatus, reasonKnown, issues);
  const isExistingSurvey = row.surveyStatus !== "Pending" || timelineItems.length > 0;
  const primaryActionText = isExistingSurvey && registrationStatus !== "Yes" ? "Save Changes" : "Submit Survey";
  const visibleTimelineItems = timelineItems.length > 0 ? timelineItems : buildFallbackTimeline(row);

  return (
    <>
      <Button variant="ghost" size="sm" asChild className="mb-2">
        <Link to="/beneficiaries">
          <ArrowLeft className="size-4" /> Back to register
        </Link>
      </Button>
      <PageTitle title={row.name} subtitle={`${row.appId} · ${row.village}, GP ${row.gp}, Block ${row.block}`} />

      <div className="grid gap-3 xl:grid-cols-3">
        <Panel title="Beneficiary Record" subtitle="Read only - sourced from scheme master">
          <dl className="grid grid-cols-2 gap-x-3 gap-y-2.5 text-xs">
            <Field label="Beneficiary ID" value={row.id} />
            <Field label="Application ID" value={row.appId} />
            {row.project ? <Field label="Project" value={row.project} /> : null}
            <Field label="Mobile" value={row.mobile} />
            <Field label="Aadhaar" value={row.aadhaar} />
            <Field label="Village" value={row.village} />
            <Field label="Gram Panchayat" value={row.gp} />
            <Field label="Block" value={row.block} />
            <Field label="Pending Reason" value={row.reason} />
            <Field label="Pending Since" value={`${row.pendingDays} days`} />
            <Field label="Priority" value={row.priority} />
          </dl>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge
              variant="outline"
              className={
                row.caseStatus === "Resolved"
                  ? "border-gov-green/40 bg-gov-green-soft text-gov-green"
                  : "border-gov-red/40 bg-gov-red-soft text-gov-red"
              }
            >
              Case: {row.caseStatus}
            </Badge>
            <Badge variant="outline" className={getSurveyBadgeClass(row.surveyStatus)}>
              Survey: {row.surveyStatus}
            </Badge>
          </div>
        </Panel>

        <Panel title="Survey Form" subtitle="Field verification entry" className="xl:col-span-2">
          <Tabs defaultValue="verify">
            <TabsList className="mb-3">
              <TabsTrigger value="verify">Verification</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>

            <TabsContent value="verify">
              <form
                className="grid gap-3 sm:grid-cols-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  void saveSurvey();
                }}
              >
                <div className="grid gap-2 sm:col-span-2">
                  <Label className="text-xs font-semibold">Is the beneficiary registered?</Label>
                  <RadioGroup
                    value={registrationStatus}
                    onValueChange={(value) => {
                      setRegistrationStatus(value as YesNo);
                      setReasonKnown("");
                      setIssues([]);
                    }}
                    className="grid gap-2 sm:grid-cols-2"
                  >
                    {["Yes", "No"].map((value) => (
                      <label key={value} className="flex h-10 items-center gap-2 rounded-md border border-border px-3 text-sm">
                        <RadioGroupItem value={value} />
                        {value}
                      </label>
                    ))}
                  </RadioGroup>
                </div>

                {registrationStatus ? (
                  <div className="grid gap-1.5 sm:col-span-2">
                    <Label className="text-xs">Status</Label>
                    <Input value={workflowStatus} readOnly className="h-9 bg-muted/40 font-medium" />
                  </div>
                ) : null}

                {registrationStatus === "No" ? (
                  <div className="grid gap-2 sm:col-span-2">
                    <Label className="text-xs font-semibold">Do you know the reason?</Label>
                    <RadioGroup
                      value={reasonKnown}
                      onValueChange={(value) => {
                        const next = value as YesNo;
                        setReasonKnown(next);
                        if (next === "No") {
                          setIssues([]);
                        }
                      }}
                      className="grid gap-2 sm:grid-cols-2"
                    >
                      {["Yes", "No"].map((value) => (
                        <label key={value} className="flex h-10 items-center gap-2 rounded-md border border-border px-3 text-sm">
                          <RadioGroupItem value={value} />
                          {value}
                        </label>
                      ))}
                    </RadioGroup>
                  </div>
                ) : null}

                {registrationStatus === "No" && reasonKnown === "Yes" ? (
                  <div className="grid gap-1.5">
                    <Label className="text-xs">Issue</Label>
                    <IssueMultiSelect value={issues} onChange={setIssues} />
                  </div>
                ) : null}

                {registrationStatus !== "Yes" ? (
                  <div className="grid gap-1.5">
                    <Label className="text-xs">Survey date</Label>
                    <Input type="date" value={surveyDate} onChange={(e) => setSurveyDate(e.target.value)} className="h-9" />
                  </div>
                ) : null}

                <div className="grid gap-1.5 sm:col-span-2">
                  <Label className="text-xs">Remarks</Label>
                  <Textarea
                    rows={3}
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    placeholder="Field observation, action taken, expected closure date"
                  />
                </div>

                <div className="flex gap-2 sm:col-span-2">
                  <Button type="submit" disabled={isSaving || !submitEnabled}>
                    <Save className="size-4" /> {primaryActionText}
                  </Button>
                  {registrationStatus !== "Yes" ? (
                    <Button type="button" variant="secondary" disabled={isSaving || !submitEnabled} onClick={() => void saveSurvey("Resolved")}>
                      Mark resolved
                    </Button>
                  ) : null}
                </div>
              </form>
            </TabsContent>

            <TabsContent value="timeline">
              {isTimelineLoading ? (
                <p className="text-sm text-muted-foreground">Loading timeline...</p>
              ) : timelineError ? (
                <p className="text-sm text-gov-red">{timelineError}</p>
              ) : visibleTimelineItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">No timeline activity recorded yet.</p>
              ) : (
                <ol className="relative ml-1 space-y-4 border-l-2 border-gov-blue/30 py-1 pl-5">
                  {visibleTimelineItems.map((item, index) => (
                    <li key={`${item.time || item.date}-${item.text}-${index}`} className="relative">
                      <span className="absolute -left-[29px] top-1 size-3 rounded-full bg-gov-blue ring-4 ring-background" />
                      <div className="grid gap-1 rounded-md border border-border/70 bg-background p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          {item.date || item.time ? (
                            <time className="num text-[11px] font-medium text-muted-foreground">{formatDisplayDateTime(item.date, item.time)}</time>
                          ) : null}
                          {item.status ? (
                            <Badge variant="outline" className={getSurveyBadgeClass(item.status)}>
                              {item.status}
                            </Badge>
                          ) : null}
                        </div>
                        <p className="text-sm font-semibold leading-snug text-foreground">{item.text}</p>
                        {item.detail ? <p className="text-xs leading-snug text-muted-foreground">{item.detail}</p> : null}
                        {item.date || item.time ? (
                          <div className="grid gap-1 border-t border-border/60 pt-2 text-xs leading-snug text-muted-foreground sm:grid-cols-2">
                            {item.date ? <span>Date: {formatTimelineDate(item.date, item.time)}</span> : null}
                            {item.time ? <span>Time: {formatTimelineTime(item.time)}</span> : null}
                          </div>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </TabsContent>
          </Tabs>
        </Panel>
      </div>
    </>
  );
}

function getWorkflowStatus(registrationStatus: YesNo, reasonKnown: YesNo) {
  if (registrationStatus === "Yes") return "In Progress";
  if (registrationStatus === "No" && reasonKnown === "No") return "Reason Pending";
  if (registrationStatus === "No" && reasonKnown === "Yes") return "Completed";
  return "Pending";
}

function canSubmit(registrationStatus: YesNo, reasonKnown: YesNo, issues: string[]) {
  if (registrationStatus === "Yes") return true;
  if (registrationStatus === "No" && reasonKnown === "No") return true;
  if (registrationStatus === "No" && reasonKnown === "Yes") return issues.length > 0;
  return false;
}

function IssueMultiSelect({ value, onChange }: { value: string[]; onChange: (value: string[]) => void }) {
  const selectedText = value.length ? value.join(", ") : "Select issue";

  const toggleIssue = (issue: string) => {
    onChange(value.includes(issue) ? value.filter((item) => item !== issue) : [...value, issue]);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" type="button" className="h-9 w-full justify-between overflow-hidden px-3 font-normal">
          <span className={cn("truncate", !value.length && "text-muted-foreground")}>{selectedText}</span>
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[--radix-popover-trigger-width] p-1">
        <div className="grid max-h-64 gap-1 overflow-y-auto">
          {REGISTRATION_ISSUES.map((issue) => {
            const checked = value.includes(issue);
            return (
              <div
                key={issue}
                role="button"
                tabIndex={0}
                className="flex min-h-9 w-full cursor-pointer items-center gap-2 rounded-sm px-2 text-left text-sm hover:bg-accent"
                onClick={() => toggleIssue(issue)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    toggleIssue(issue);
                  }
                }}
              >
                <Checkbox checked={checked} onCheckedChange={() => toggleIssue(issue)} onClick={(event) => event.stopPropagation()} />
                <span className="flex-1">{issue}</span>
                {checked ? <Check className="size-4 text-gov-blue" /> : null}
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function parseSavedIssues(value?: string) {
  return String(value || "")
    .split(/[,;|]/)
    .map((item) => item.trim())
    .map((item) => (item === "Other / Document" ? "Document Missing" : item))
    .filter((item): item is (typeof REGISTRATION_ISSUES)[number] => REGISTRATION_ISSUES.includes(item as (typeof REGISTRATION_ISSUES)[number]));
}

function issueToPendingReason(issue: string) {
  if (issue === "Document Missing" || issue === "Other") return "Other / Document";
  return issue;
}

function hasTimelineContent(item: TimelineItem) {
  return Boolean(
    String(item.text || "").trim() ||
      String(item.detail || "").trim() ||
      String(item.status || "").trim() ||
      String(item.date || "").trim() ||
      String(item.time || "").trim(),
  );
}

function buildFallbackTimeline(row: { surveyStatus: string; registrationStatus?: string; registrationReason?: string; issue?: string; remark?: string; lastSurvey?: string | null }) {
  const items: TimelineItem[] = [];
  const date = row.lastSurvey || "";

  if (row.registrationStatus) {
    items.push({
      date,
      text: `Registration Verified = ${row.registrationStatus}`,
      status: row.surveyStatus,
    });
  }

  if (row.registrationReason) {
    items.push({
      date,
      text: "Reason Added",
      detail: row.registrationReason,
      status: row.surveyStatus,
    });
  }

  if (row.issue) {
    items.push({
      date,
      text: "Issue Added",
      detail: row.issue,
      status: row.surveyStatus,
    });
  }

  if (row.surveyStatus !== "Pending") {
    items.push({
      date,
      text: row.surveyStatus === "Completed" ? "Survey Completed" : `Status changed to ${row.surveyStatus}`,
      detail: row.remark || "",
      status: row.surveyStatus,
    });
  }

  return items;
}

function getSurveyBadgeClass(status: string) {
  if (status === "Completed" || status === "In Progress") return "border-gov-green/40 bg-gov-green-soft text-gov-green";
  return "border-gov-amber/40 bg-gov-amber-soft text-gov-amber";
}

function formatDisplayDateTime(date: string, time?: string) {
  if (!date && !time) return "";
  const source = time || `${date}T00:00:00`;
  const parsed = new Date(source.includes("T") ? source : source.replace(" ", "T"));
  const fallbackDate = date ? new Date(`${date}T00:00:00`) : parsed;
  const displayDate = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(Number.isNaN(fallbackDate.getTime()) ? new Date() : fallbackDate);
  const displayTime = Number.isNaN(parsed.getTime())
    ? ""
    : new Intl.DateTimeFormat("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(parsed);
  return displayTime ? `${displayDate} • ${displayTime}` : displayDate;
}

function formatTimelineDate(date: string, time?: string) {
  if (!date && !time) return "";
  const source = date ? `${date}T00:00:00` : String(time).replace(" ", "T");
  const parsed = new Date(source);
  if (Number.isNaN(parsed.getTime())) return date || "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

function formatTimelineTime(time?: string) {
  if (!time) return "";
  const parsed = new Date(time.includes("T") ? time : time.replace(" ", "T"));
  if (Number.isNaN(parsed.getTime())) return "";
  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="font-semibold text-foreground">{value}</dd>
    </div>
  );
}
