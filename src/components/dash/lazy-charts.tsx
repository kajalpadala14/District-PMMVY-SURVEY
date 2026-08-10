import { lazy, Suspense, type ComponentProps } from "react";

import { Skeleton } from "@/components/ui/skeleton";

type ChartsModule = typeof import("./charts");

const LazyHBar = lazy(async () => ({ default: (await import("./charts")).HBar }));
const LazyVBar = lazy(async () => ({ default: (await import("./charts")).VBar }));
const LazyReasonPie = lazy(async () => ({ default: (await import("./charts")).ReasonPie }));
const LazyProgressDonut = lazy(async () => ({ default: (await import("./charts")).ProgressDonut }));

type ChartHostProps =
  | ({ kind: "HBar" } & ComponentProps<ChartsModule["HBar"]>)
  | ({ kind: "VBar" } & ComponentProps<ChartsModule["VBar"]>)
  | ({ kind: "ReasonPie" } & ComponentProps<ChartsModule["ReasonPie"]>)
  | ({ kind: "ProgressDonut" } & ComponentProps<ChartsModule["ProgressDonut"]>);

export function LazyChart(props: ChartHostProps) {
  const height = "height" in props && typeof props.height === "number" ? props.height : 260;

  return (
    <Suspense fallback={<Skeleton className="w-full rounded-md" style={{ height }} />}>
      <ChartsHost {...props} />
    </Suspense>
  );
}

function ChartsHost(props: ChartHostProps) {
  if (props.kind === "HBar") {
    const { kind, ...chartProps } = props;
    return <LazyHBar {...chartProps} />;
  }
  if (props.kind === "VBar") {
    const { kind, ...chartProps } = props;
    return <LazyVBar {...chartProps} />;
  }
  if (props.kind === "ReasonPie") {
    const { kind, ...chartProps } = props;
    return <LazyReasonPie {...chartProps} />;
  }
  const { kind, ...chartProps } = props;
  return <LazyProgressDonut {...chartProps} />;
}
