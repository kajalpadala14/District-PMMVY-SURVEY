import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const AXIS = { fontSize: 11, fill: "var(--muted-foreground)" };
const PALETTE = ["var(--gov-blue)", "var(--gov-green)", "var(--gov-amber)", "var(--gov-red)", "var(--gov-navy)"];

const tooltipStyle = {
  contentStyle: {
    borderRadius: 8,
    border: "1px solid var(--border)",
    background: "var(--surface)",
    fontSize: 12,
    boxShadow: "var(--shadow-card)",
  },
} as const;

export function HBar({
  data,
  nameKey,
  valueKey,
  height = 260,
  tone = "var(--gov-blue)",
}: {
  data: object[];
  nameKey: string;
  valueKey: string;
  height?: number;
  tone?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
        <CartesianGrid horizontal={false} stroke="var(--border)" />
        <XAxis type="number" tick={AXIS} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey={nameKey} width={96} tick={AXIS} axisLine={false} tickLine={false} />
        <Tooltip {...tooltipStyle} />
        <Bar dataKey={valueKey} radius={[0, 4, 4, 0]} fill={tone} barSize={16} animationDuration={700} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function VBar({
  data,
  nameKey,
  valueKey,
  height = 260,
}: {
  data: object[];
  nameKey: string;
  valueKey: string;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ left: 0, right: 8, top: 4, bottom: 4 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis dataKey={nameKey} tick={{ ...AXIS, fontSize: 10 }} axisLine={false} tickLine={false} interval={0} angle={-35} textAnchor="end" height={56} />
        <YAxis tick={AXIS} axisLine={false} tickLine={false} />
        <Tooltip {...tooltipStyle} />
        <Bar dataKey={valueKey} radius={[4, 4, 0, 0]} fill="var(--gov-blue)" animationDuration={700} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ReasonPie({
  data,
  height = 250,
  onSelect,
}: {
  data: { reason: string; count: number; filterValue?: string }[];
  height?: number;
  onSelect?: (reason: string) => void;
}) {
  const visibleData = data.filter((item) => item.count > 0);
  const total = visibleData.reduce((sum, item) => sum + item.count, 0);

  if (!total) {
    return (
      <div className="flex items-center justify-center text-center text-sm text-muted-foreground" style={{ height }}>
        No pending reason data available
      </div>
    );
  }

  return (
    <div className="grid gap-2" style={{ minHeight: height }}>
      <ResponsiveContainer width="100%" height={Math.max(170, height - 72)}>
        <PieChart>
          <Pie
            data={visibleData}
            dataKey="count"
            nameKey="reason"
            innerRadius={44}
            outerRadius={78}
            paddingAngle={2}
            animationDuration={700}
            onClick={(item) => onSelect?.(String(item.filterValue || item.reason))}
            className={onSelect ? "cursor-pointer" : undefined}
          >
            {visibleData.map((_, i) => (
              <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
            ))}
          </Pie>
          <Tooltip {...tooltipStyle} />
        </PieChart>
      </ResponsiveContainer>
      <div className="grid gap-1 px-2 text-[11px] text-muted-foreground sm:grid-cols-2">
        {visibleData.map((item, i) => (
          <button
            key={item.reason}
            type="button"
            className="flex min-w-0 items-center gap-2 rounded-sm text-left hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => onSelect?.(item.filterValue || item.reason)}
            disabled={!onSelect}
          >
            <span className="size-2.5 shrink-0 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} />
            <span className="min-w-0 flex-1 truncate">{item.reason}</span>
            <span className="num font-semibold text-foreground">{item.count}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function ProgressDonut({
  done,
  pending,
  height = 250,
}: {
  done: number;
  pending: number;
  height?: number;
}) {
  const data = [
    { name: "Survey Completed", value: done },
    { name: "Survey Pending", value: pending },
  ];
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={58} outerRadius={82} animationDuration={700}>
          <Cell fill="var(--gov-green)" />
          <Cell fill="var(--gov-amber)" />
        </Pie>
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Tooltip {...tooltipStyle} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function TrendLine({ data, height = 250 }: { data: { date: string; surveys: number; resolved: number }[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ left: 0, right: 8, top: 4, bottom: 4 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis dataKey="date" tick={AXIS} axisLine={false} tickLine={false} />
        <YAxis tick={AXIS} axisLine={false} tickLine={false} />
        <Tooltip {...tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Line type="monotone" dataKey="surveys" name="Surveys" stroke="var(--gov-blue)" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="resolved" name="Resolved" stroke="var(--gov-green)" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function ResolutionArea({ data, height = 250 }: { data: { date: string; resolved: number }[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ left: 0, right: 8, top: 4, bottom: 4 }}>
        <defs>
          <linearGradient id="resArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--gov-green)" stopOpacity={0.45} />
            <stop offset="100%" stopColor="var(--gov-green)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis dataKey="date" tick={AXIS} axisLine={false} tickLine={false} />
        <YAxis tick={AXIS} axisLine={false} tickLine={false} />
        <Tooltip {...tooltipStyle} />
        <Area type="monotone" dataKey="resolved" stroke="var(--gov-green)" strokeWidth={2} fill="url(#resArea)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function OfficerStack({
  data,
  height = 300,
}: {
  data: { officer: string; completed: number; pending: number }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
        <CartesianGrid horizontal={false} stroke="var(--border)" />
        <XAxis type="number" tick={AXIS} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="officer" width={86} tick={AXIS} axisLine={false} tickLine={false} />
        <Tooltip {...tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="completed" name="Completed" stackId="a" fill="var(--gov-green)" barSize={14} />
        <Bar dataKey="pending" name="Pending" stackId="a" fill="var(--gov-red)" radius={[0, 4, 4, 0]} barSize={14} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function Gauge({ percent, height = 200 }: { percent: number; height?: number }) {
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={height}>
        <RadialBarChart
          data={[{ name: "resolved", value: percent, fill: "var(--gov-green)" }]}
          innerRadius="70%"
          outerRadius="100%"
          startAngle={210}
          endAngle={-30}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar dataKey="value" cornerRadius={8} background={{ fill: "var(--muted)" }} animationDuration={800} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pt-4">
        <span className="num text-2xl font-semibold text-foreground">{percent}%</span>
        <span className="text-[11px] text-muted-foreground">Resolved of total</span>
      </div>
    </div>
  );
}
