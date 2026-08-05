import { cn } from "@/lib/utils";

export function Panel({
  title,
  subtitle,
  action,
  className,
  children,
}: {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("gov-panel flex flex-col overflow-hidden", className)}>
      {title ? (
        <header className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
          <div>
            <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-foreground">{title}</h2>
            {subtitle ? <p className="mt-0.5 text-[11px] text-muted-foreground">{subtitle}</p> : null}
          </div>
          {action}
        </header>
      ) : null}
      <div className="flex-1 p-4">{children}</div>
    </section>
  );
}

export function PageTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-4">
      <h1 className="font-display text-xl font-semibold uppercase tracking-wide text-foreground">{title}</h1>
      <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}

export function StatusPill({ value }: { value: number }) {
  const tone =
    value >= 75
      ? "bg-gov-green-soft text-gov-green ring-gov-green/25"
      : value >= 60
        ? "bg-gov-amber-soft text-gov-amber ring-gov-amber/25"
        : "bg-gov-red-soft text-gov-red ring-gov-red/25";
  const label = value >= 75 ? "On Track" : value >= 60 ? "Watch" : "Critical";
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1", tone)}>{label}</span>
  );
}

export function Bar({ value, tone = "blue" }: { value: number; tone?: "blue" | "green" | "red" }) {
  const color = tone === "green" ? "bg-gov-green" : tone === "red" ? "bg-gov-red" : "bg-gov-blue";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${Math.min(100, value)}%` }} />
      </div>
      <span className="num text-xs text-muted-foreground">{value}%</span>
    </div>
  );
}
