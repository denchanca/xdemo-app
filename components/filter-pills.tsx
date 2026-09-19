import Link from "next/link";
import { cn } from "@/lib/utils";

export function FilterPills({
  pathname,
  value,
  extra,
  items,
}: {
  pathname: string;
  value: string;
  extra?: Record<string, string | undefined>;
  items: { id: string; label: string }[];
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => {
        const params = new URLSearchParams();
        if (item.id !== "ALL") params.set("status", item.id);
        if (extra?.q) params.set("q", extra.q);
        const href = params.toString() ? `${pathname}?${params}` : pathname;
        const active = value === item.id;
        return (
          <Link
            key={item.id}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-full border px-3 py-1 text-xs transition-colors",
              active
                ? "border-indigo bg-indigo text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:border-foreground/20 hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
