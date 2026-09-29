import { formatUsd } from "@/lib/money";

export function RevenueChart({
  series,
  totalCents,
  change,
}: {
  series: { date: string; cents: number }[];
  totalCents: number;
  change: number | null;
}) {
  const width = 640;
  const height = 230;
  const pad = { top: 12, right: 16, bottom: 28, left: 44 };
  const rawMax = Math.max(...series.map((point) => point.cents), 1);
  const max = Math.ceil(rawMax / 20000) * 20000 || 20000;
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  const coords = series.map((point, index) => {
    const x = pad.left + (index / Math.max(series.length - 1, 1)) * innerW;
    const y = pad.top + innerH - (point.cents / max) * innerH;
    return { x, y, ...point };
  });

  const line = smoothPath(coords);
  const last = coords[coords.length - 1];
  const area = `${line} L${last?.x ?? pad.left} ${pad.top + innerH} L${pad.left} ${pad.top + innerH} Z`;

  const yTicks = [0, max / 2, max].map((cents) => ({
    y: pad.top + innerH - (cents / max) * innerH,
    label: cents === 0 ? "$0" : `$${Math.round(cents / 100).toLocaleString("en-US")}`,
  }));
  const xTicks = [0, 0.25, 0.5, 0.75, 1]
    .map((fraction) => Math.round(fraction * (series.length - 1)))
    .filter((index, i, all) => all.indexOf(index) === i && series[index])
    .map((index) => ({
      x: coords[index].x,
      label: new Date(`${series[index].date}T12:00:00.000Z`).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      }),
    }));

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <p className="text-[26px] leading-none font-semibold tracking-tight">
            {formatUsd(totalCents)}
          </p>
          <ChangeChip change={change} />
        </div>
        <span className="rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-muted-foreground shadow-xs">
          Last 30 days
        </span>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-52 w-full"
        role="img"
        aria-label="Collected revenue over the last 30 days"
      >
        <defs>
          <linearGradient id="ledgerlyRevenue" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--indigo)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--indigo)" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {yTicks.map((tick) => (
          <g key={tick.label}>
            <line
              x1={pad.left}
              x2={width - pad.right}
              y1={tick.y}
              y2={tick.y}
              stroke="var(--line)"
              strokeDasharray={tick.label === "$0" ? undefined : "3 5"}
            />
            <text
              x={pad.left - 8}
              y={tick.y + 3.5}
              textAnchor="end"
              className="fill-muted-foreground"
              fontSize="11"
            >
              {tick.label}
            </text>
          </g>
        ))}
        <path className="revenue-area" d={area} fill="url(#ledgerlyRevenue)" />
        <path className="revenue-line" d={line} fill="none" stroke="var(--indigo)" strokeWidth="2.5" strokeLinejoin="round" />
        {last ? (
          <g className="revenue-dot">
            <circle cx={last.x} cy={last.y} r="7" fill="var(--indigo)" opacity="0.18" />
            <circle cx={last.x} cy={last.y} r="4" fill="var(--indigo)" stroke="var(--card)" strokeWidth="2" />
          </g>
        ) : null}
        {xTicks.map((tick) => (
          <text
            key={tick.label}
            x={tick.x}
            y={height - 8}
            textAnchor="middle"
            className="fill-muted-foreground"
            fontSize="11"
          >
            {tick.label}
          </text>
        ))}
      </svg>
    </div>
  );
}

function ChangeChip({ change }: { change: number | null }) {
  if (change === null) return null;
  const rounded = Math.round(change * 10) / 10;
  if (Math.abs(rounded) > 80) return null;
  const up = rounded >= 0;
  return (
    <span className={up ? "text-sm font-medium text-success" : "text-sm font-medium text-danger"}>
      {up ? "↗" : "↘"} {up ? "+" : "−"}
      {Math.abs(rounded)}%
    </span>
  );
}

/** Catmull-Rom → cubic bezier so the seed's step-y payments read as a smooth trend. */
function smoothPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return "";
  const path: string[] = [`M${points[0].x} ${points[0].y}`];
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[Math.max(i - 1, 0)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(i + 2, points.length - 1)];
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    path.push(`C${c1x} ${c1y} ${c2x} ${c2y} ${p2.x} ${p2.y}`);
  }
  return path.join(" ");
}
