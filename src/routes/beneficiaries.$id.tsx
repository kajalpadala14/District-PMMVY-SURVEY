import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, FileUp, MapPin, Save, Upload } from "lucide-react";
import { toast } from "sonner";
import { Panel, PageTitle } from "@/components/dash/panel";
import { beneficiaries, OFFICER_NAMES, PENDING_REASONS } from "@/data/district";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/beneficiaries/$id")({
  loader: ({ params }) => {
    const row = beneficiaries.find((b) => b.id === params.id);
    if (!row) throw notFound();
    return { row };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Beneficiary not found | MVY" }, { name: "robots", content: "noindex" }] };
    }
    const title = `${loaderData.row.name} — Beneficiary Profile | MVY`;
    return {
      meta: [
        { title },
        { name: "description", content: `Survey history, pending reason and documents for ${loaderData.row.name}, ${loaderData.row.village}.` },
        { property: "og:title", content: title },
        { property: "og:description", content: `Pending reason: ${loaderData.row.reason} · Block ${loaderData.row.block}` },
        { name: "robots", content: "noindex" },
      ],
    };
  },
  component: Detail,
});

function Detail() {
  const { row } = Route.useLoaderData();

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
            <Field label="District" value="Balodabazar-Bhatapara" />
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
            <TabsList>
              <TabsTrigger value="verify">Verification</TabsTrigger>
              <TabsTrigger value="docs">Documents</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>

            <TabsContent value="verify" className="pt-3">
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
                  <Select defaultValue={row.reason}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PENDING_REASONS.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-1.5">
                  <Label className="text-xs">Survey officer</Label>
                  <Select defaultValue={row.officer}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {OFFICER_NAMES.map((o) => (
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

            <TabsContent value="docs" className="pt-3">
              <div className="grid gap-2 sm:grid-cols-2">
                {["Aadhaar card", "Bank passbook", "Beneficiary photo", "Supporting document"].map((d) => (
                  <div key={d} className="flex items-center justify-between rounded-md border border-dashed border-border p-3">
                    <div>
                      <p className="text-xs font-semibold">{d}</p>
                      <p className="text-[11px] text-muted-foreground">PDF / JPG up to 5 MB</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => toast.success(`${d} uploaded`)}>
                      <Upload className="size-3.5" /> Upload
                    </Button>
                  </div>
                ))}
              </div>
              <p className="mt-3 flex items-center gap-1.5 rounded-md bg-gov-blue-soft p-2 text-[11px] text-gov-navy">
                <FileUp className="size-3.5" /> Uploaded files are linked to the beneficiary record and available in reports.
              </p>
            </TabsContent>

            <TabsContent value="timeline" className="pt-3">
              <ol className="relative ml-2 border-l border-border pl-4 text-xs">
                {[
                  ["05 Aug 2026", `Survey ${row.surveyStatus.toLowerCase()} — officer ${row.officer}`],
                  ["31 Jul 2026", `Pending reason recorded: ${row.reason}`],
                  ["22 Jul 2026", "Officer assigned by Block Officer"],
                  ["14 Jul 2026", "Application flagged pending during payment cycle"],
                ].map(([date, text], i) => (
                  <li key={i} className="mb-4">
                    <span className="absolute -left-1.5 size-3 rounded-full bg-gov-blue" />
                    <p className="num text-[11px] text-muted-foreground">{date}</p>
                    <p className="font-medium text-foreground">{text}</p>
                  </li>
                ))}
              </ol>
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
