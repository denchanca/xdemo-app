import { formatUsd } from "@/lib/money";

type Point = {
  id: string;
  name: string;
  revenueCents: number;
  disputeCents: number;
};

export function RevenueDisputeScatter({ points }: { points: readonly Point[] }) {
  const width = 920;
  const height = 300;
  const pad = { top: 28, right: 24, bottom: 48, left: 52 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const rawMax = Math.max(1, ...points.flatMap((point) => [point.revenueCents, point.disputeCents]));
  const stepped = Math.ceil(rawMax / 10000) * 10000;
  const max = stepped === rawMax ? stepped + 10000 : stepped;

  const xOf = (cents: number) => pad.left + (cents / max) * innerW;
  const yOf = (cents: number) => pad.top + innerH - (cents / max) * innerH;
  const ticks = [0, max / 2, max].map((cents) => ({
    cents,
    label: cents === 0 ? "$0" : `$${Math.round(cents / 100).toLocaleString("en-US")}`,
  }));

  const groups = new Map<string, Point[]>();
  for (const point of points) {
    const key = `${point.revenueCents}:${point.disputeCents}`;
    const list = groups.get(key) ?? [];
    list.push(point);
    groups.set(key, list);
  }
  const plotted = [...groups.values()].sort((a, b) => a[0].disputeCents - b[0].disputeCents);
  const disputedAccounts = points.filter((point) => point.disputeCents > 0).length;

  return (
    <div>
      <p className="mb-3 text-sm text-muted-foreground">
        Each point is a customer. Revenue is billed invoices, drafts and voids left out. Disputed is the amount on file.
      </p>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-64 w-full"
        role="img"
        aria-label={`Revenue versus disputes for ${points.length} customers. ${disputedAccounts} have a dispute on file.`}
      >
        {ticks.map((tick) => (
          <g key={tick.label}>
            <line
              x1={pad.left}
              x2={width - pad.right}
              y1={yOf(tick.cents)}
              y2={yOf(tick.cents)}
              stroke="var(--line)"
              strokeDasharray={tick.cents === 0 ? undefined : "3 5"}
            />
            <line
              x1={xOf(tick.cents)}
              x2={xOf(tick.cents)}
              y1={pad.top}
              y2={pad.top + innerH}
              stroke="var(--line)"
              strokeDasharray={tick.cents === 0 ? undefined : "3 5"}
            />
            <text
              x={pad.left - 8}
              y={yOf(tick.cents) + 4}
              textAnchor="end"
              className="fill-muted-foreground"
              fontSize="11"
            >
              {tick.label}
            </text>
            {tick.cents > 0 ? (
              <text
                x={xOf(tick.cents)}
                y={height - 26}
                textAnchor="middle"
                className="fill-muted-foreground"
                fontSize="11"
              >
                {tick.label}
              </text>
            ) : null}
          </g>
        ))}
        <line
          x1={xOf(0)}
          y1={yOf(0)}
          x2={xOf(max)}
          y2={yOf(max)}
          stroke="var(--ink-soft)"
          strokeDasharray="5 4"
        />
        {plotted.map((group) => {
          const point = group[0];
          const disputed = point.disputeCents > 0;
          const cx = xOf(point.revenueCents);
          const cy = yOf(point.disputeCents);
          const names = group.map((entry) => entry.name);
          const shown = names.slice(0, 3).join(", ");
          const extra = names.length > 3 ? ` +${names.length - 3}` : "";
          return (
            <g key={`${point.revenueCents}-${point.disputeCents}`}>
              <title>
                {`${shown}${extra}. Revenue ${formatUsd(point.revenueCents)}. Disputed ${formatUsd(point.disputeCents)}.`}
              </title>
              <circle
                cx={cx}
                cy={cy}
                r={disputed ? 6 : 4.5}
                fill={disputed ? "var(--danger)" : "var(--indigo)"}
                stroke="var(--card)"
                strokeWidth="2"
              />
              {group.length > 1 ? (
                <text x={cx + 10} y={cy + 4} className="fill-foreground" fontSize="11" fontWeight="650">
                  {group.length}
                </text>
              ) : null}
            </g>
          );
        })}
        <text x={pad.left} y={14} className="fill-muted-foreground" fontSize="11">
          Disputed
        </text>
        <text
          x={pad.left + innerW / 2}
          y={height - 8}
          textAnchor="middle"
          className="fill-muted-foreground"
          fontSize="11"
        >
          Revenue
        </text>
      </svg>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <li className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-indigo" />
          No dispute
        </li>
        <li className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-danger" />
          Dispute on file
        </li>
        <li className="flex items-center gap-1.5">
          <span className="h-px w-4 border-t border-dashed border-muted-foreground" />
          Disputed equals revenue
        </li>
      </ul>
    </div>
  );
}
