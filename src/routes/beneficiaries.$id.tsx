import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ChevronDown, MapPin, Save } from "lucide-react";
import { toast } from "sonner";
import { useFilters } from "@/components/dash/filters-context";
import { Panel, PageTitle } from "@/components/dash/panel";
import { PENDING_REASONS } from "@/data/district";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent } from "@/components/ui/tabs";

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
  const { allRows, isLoading, isSheetConfigured, error } = useFilters();
  const row = allRows.find((item) => item.id === id);
  const officers = [...new Set(allRows.map((item) => item.officer).filter((officer) => officer && officer !== "Unassigned"))].sort();
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);

  useEffect(() => {
    setSelectedReasons(row ? [row.reason] : []);
  }, [row]);

  const toggleReason = (reason: string, checked: boolean) => {
    setSelectedReasons((current) => {
      if (checked) return current.includes(reason) ? current : [...current, reason];
      return current.filter((item) => item !== reason);
    });
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
          <p className="text-sm text-muted-foreground">No dummy beneficiary data is being shown.</p>
        </Panel>
      </>
    );
  }

  return (
    <>
      <Button variant="ghost" size="sm" asChild className="mb-2">
        <Link to="/beneficiaries">
          <ArrowLeft className="size-4" /> Back to register
        </Link>
      </Button>
      <PageTitle title={row.name} subtitle={`${row.appId} · ${row.village}, GP ${row.gp}, Block ${row.block}`} />

      <div className="grid gap-3 xl:grid-cols-3">
        <Panel title="Beneficiary Record" subtitle="Read only — sourced from scheme master">
          <dl className="grid grid-cols-2 gap-x-3 gap-y-2.5 text-xs">
            <Field label="Beneficiary ID" value={row.id} />
            <Field label="Application ID" value={row.appId} />
            <Field label="Mobile" value={row.mobile} />
            <Field label="Aadhaar" value={row.aadhaar} />
            <Field label="Village" value={row.village} />
            <Field label="Gram Panchayat" value={row.gp} />
            <Field label="Block" value={row.block} />
            <Field label="District" value="Dantewada" />
            <Field label="Pending Reason" value={row.reason} />
            <Field label="Pending Since" value={`${row.pendingDays} days`} />
            <Field label="Assigned Officer" value={row.officer} />
            <Field label="Priority" value={row.priority} />
          </dl>
          <div className="mt-3 flex gap-2">
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
            <Badge
              variant="outline"
              className={
                row.surveyStatus === "Completed"
                  ? "border-gov-green/40 bg-gov-green-soft text-gov-green"
                  : "border-gov-amber/40 bg-gov-amber-soft text-gov-amber"
              }
            >
              Survey: {row.surveyStatus}
            </Badge>
          </div>
        </Panel>

        <Panel title="Survey Form" subtitle="Field verification entry" className="xl:col-span-2">
          <Tabs defaultValue="verify">
            <TabsContent value="verify">
              <form
                className="grid gap-3 sm:grid-cols-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  toast.success("Survey saved", { description: `${row.name} · ${row.village}` });
                }}
              >
                <fieldset className="sm:col-span-2 rounded-md border border-border p-3">
                  <legend className="px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Issue verification
                  </legend>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {["MCP Card verified", "Bank account verified", "Aadhaar verified", "Aadhaar-Bank link done", "Other issue present"].map(
                      (c) => (
                        <label key={c} className="flex items-center gap-2 text-xs">
                          <Checkbox /> {c}
                        </label>
                      ),
                    )}
                  </div>
                </fieldset>

                <div className="grid gap-1.5">
                  <Label className="text-xs">Pending reason (updated)</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button type="button" variant="outline" className="h-auto min-h-9 justify-between px-3 text-left font-normal">
                        <span className="line-clamp-2">
                          {selectedReasons.length > 0 ? selectedReasons.join(", ") : "Select pending reasons"}
                        </span>
                        <ChevronDown className="ml-2 size-4 shrink-0 opacity-60" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)]">
                      {PENDING_REASONS.map((r) => (
                        <DropdownMenuCheckboxItem
                          key={r}
                          checked={selectedReasons.includes(r)}
                          onCheckedChange={(checked) => toggleReason(r, Boolean(checked))}
                          onSelect={(e) => e.preventDefault()}
                        >
                          {r}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="grid gap-1.5">
                  <Label className="text-xs">Survey officer</Label>
                  <Select defaultValue={row.officer}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {officers.map((o) => (
                        <SelectItem key={o} value={o}>
                          {o}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-1.5">
                  <Label className="text-xs">Survey date</Label>
                  <Input type="date" defaultValue="2026-08-05" className="h-9" />
                </div>

                <div className="grid gap-1.5">
                  <Label className="text-xs">GPS location (optional)</Label>
                  <div className="flex gap-2">
                    <Input placeholder="21.6597, 82.1600" className="h-9" />
                    <Button type="button" variant="outline" size="icon" onClick={() => toast.info("Location captured")}>
                      <MapPin className="size-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid gap-1.5 sm:col-span-2">
                  <Label className="text-xs">Remarks</Label>
                  <Textarea rows={3} placeholder="Field observation, action taken, expected closure date" />
                </div>

                <div className="flex gap-2 sm:col-span-2">
                  <Button type="submit">
                    <Save className="size-4" /> Submit survey
                  </Button>
                  <Button type="button" variant="outline" onClick={() => toast.success("Draft saved")}>
                    Save draft
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => toast.success("Case marked resolved", { description: row.appId })}
                  >
                    Mark resolved
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </Panel>
      </div>
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="font-semibold text-foreground">{value}</dd>
    </div>
  );
}
