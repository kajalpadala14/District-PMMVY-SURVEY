import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

export type Tone = "blue" | "green" | "amber" | "red" | "navy";

const toneMap: Record<Tone, { text: string; bg: string; ring: string; stroke: string }> = {
  blue: { text: "text-gov-blue", bg: "bg-gov-blue-soft", ring: "ring-gov-blue/15", stroke: "var(--gov-blue)" },
  green: { text: "text-gov-green", bg: "bg-gov-green-soft", ring: "ring-gov-green/15", stroke: "var(--gov-green)" },
  amber: { text: "text-gov-amber", bg: "bg-gov-amber-soft", ring: "ring-gov-amber/15", stroke: "var(--gov-amber)" },
  red: { text: "text-gov-red", bg: "bg-gov-red-soft", ring: "ring-gov-red/15", stroke: "var(--gov-red)" },
  navy: { text: "text-gov-navy", bg: "bg-secondary", ring: "ring-gov-navy/15", stroke: "var(--gov-navy)" },
};

export interface KpiCardProps {
  label: string;
  value: string | number;
  suffix?: string;
  icon: LucideIcon;
  tone?: Tone;
  delta?: number;
  hint?: string;
  spark?: number[];
}

export function KpiCard({ label, value, suffix, icon: Icon, tone = "blue", delta, hint, spark }: KpiCardProps) {
  const t = toneMap[tone];
  const DeltaIcon = delta === 0 ? Minus : delta && delta > 0 ? ArrowUpRight : ArrowDownRight;
  const data = (spark ?? []).map((v, i) => ({ i, v }));

  return (
    <div className="kpi-surface group gov-panel relative overflow-hidden p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-raised)]">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <span className={cn("flex size-8 items-center justify-center rounded-md ring-1", t.bg, t.ring, t.text)}>
          <Icon className="size-4" />
        </span>
      </div>

      <div className="mt-2 flex items-end gap-1.5">
        <span className="num text-2xl leading-none font-semibold text-foreground">{value}</span>
        {suffix ? <span className="pb-0.5 text-xs font-medium text-muted-foreground">{suffix}</span> : null}
      </div>

      {delta !== undefined || hint ? (
        <div className="mt-2 flex items-center justify-between gap-2">
          {delta !== undefined ? (
            <span
              className={cn(
                "flex items-center gap-0.5 text-[11px] font-semibold",
                delta === 0 ? "text-muted-foreground" : delta > 0 ? "text-gov-green" : "text-gov-red",
              )}
            >
              <DeltaIcon className="size-3" />
              {`${Math.abs(delta)}%`}
            </span>
          ) : (
            <span />
          )}
          {hint ? <span className="truncate text-[11px] text-muted-foreground">{hint}</span> : null}
        </div>
      ) : null}

      {data.length > 1 ? (
        <div className="mt-2 h-8 opacity-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id={`spark-${label.replace(/\W/g, "")}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={t.stroke} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={t.stroke} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke={t.stroke}
                strokeWidth={1.6}
                fill={`url(#spark-${label.replace(/\W/g, "")})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : null}
    </div>
  );
}
