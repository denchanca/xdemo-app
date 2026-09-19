import type { LucideIcon } from "lucide-react";
import { Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  hint,
  change,
  icon: Icon,
  tone = "indigo",
}: {
  label: string;
  value: string;
  hint: string;
  change?: number | null;
  icon: LucideIcon;
  tone?: "indigo" | "success" | "danger";
}) {
  return (
    <Card className="gap-3 py-5">
      <CardContent className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <p
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground"
            title={hint}
          >
            {label}
            <Info className="size-3.5 shrink-0 opacity-60" aria-hidden="true" />
          </p>
          <span
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-lg",
              tone === "indigo" && "bg-indigo-soft text-indigo",
              tone === "success" && "bg-success-soft text-success",
              tone === "danger" && "bg-danger-soft text-danger",
            )}
          >
            <Icon className="size-4" />
          </span>
        </div>
        <p className="text-[26px] leading-none font-semibold tracking-tight">{value}</p>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {change === undefined ? hint : <Growth change={change} suffix={hint} />}
        </p>
      </CardContent>
    </Card>
  );
}

function Growth({ change, suffix }: { change: number | null; suffix: string }) {
  if (change === null) {
    return <span>{suffix}</span>;
  }
  const rounded = Math.round(change * 10) / 10;
  // A 10-invoice book produces wild lifts. Don't put 351% on stage.
  if (Math.abs(rounded) > 80) {
    return <span>{suffix}</span>;
  }
  const up = rounded >= 0;
  return (
    <span>
      <span className={cn("font-medium", up ? "text-success" : "text-danger")}>
        {up ? "↗" : "↘"} {up ? "+" : "−"}
        {Math.abs(rounded)}%
      </span>{" "}
      {suffix}
    </span>
  );
}
