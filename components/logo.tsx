import { cn } from "@/lib/utils";

/**
 * Folded-ledger L. Keep this geometry in sync with public/logo.svg,
 * public/favicon.svg, and public/images/logo-mark.svg.
 */
export function LogoMark({
  className,
  variant = "onIndigo",
}: {
  className?: string;
  variant?: "onIndigo" | "onLight";
}) {
  const onIndigo = variant === "onIndigo";
  const bar = onIndigo ? "var(--logo-bar, #ffffff)" : "#4F46E5";
  const seam = onIndigo ? "var(--logo-seam, #4F46E5)" : "#ffffff";
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect width="64" height="64" rx="16" fill={onIndigo ? "var(--logo-ground, #4F46E5)" : "#ffffff"} />
      <path d="M36 40.5V21.8c0-1.9 1-3.6 2.7-4.4l6.3-3.2v26.3H36Z" fill="var(--logo-fold, #8B85F0)" />
      <path d="M44 40.5V17.4c0-1.9 1-3.6 2.7-4.4l5.3-2.7v30.2H44Z" fill="var(--logo-fold-soft, #CDC9F9)" />
      <rect x="14" y="11" width="13" height="34" rx="6.5" fill={bar} />
      <rect
        x="13.25"
        y="37.25"
        width="40.5"
        height="13.5"
        rx="6.75"
        fill={bar}
        stroke={seam}
        strokeWidth="2.5"
      />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark className="size-8 shrink-0" />
      <span className="text-[17px] font-semibold tracking-tight text-foreground">Ledgerly</span>
    </span>
  );
}
