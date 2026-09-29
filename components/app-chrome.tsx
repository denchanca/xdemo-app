"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import {
  BarChart3,
  FileText,
  Inbox,
  LayoutDashboard,
  Menu,
  Scale,
  Search,
  Settings,
  Sparkles,
  X,
} from "lucide-react";
import { ContrastToggle } from "@/components/contrast-toggle";
import { NoticeBell, type OpenDisputeNotice } from "@/components/notice-bell";
import { Wordmark } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { DEMO_OPERATOR } from "@/lib/demo-session";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/collections", label: "Collections", icon: Inbox },
  { href: "/disputes", label: "Disputes", icon: Scale },
  { href: "/analysis", label: "Analysis", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppChrome({
  openDisputeCount,
  openDisputes,
  children,
}: {
  openDisputeCount: number;
  openDisputes: OpenDisputeNotice[];
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  function searchBook(next: string) {
    const trimmed = next.trim();
    startTransition(() => {
      if (/^dsp_/i.test(trimmed)) {
        router.push(`/disputes/${trimmed}`);
        return;
      }
      if (/^inv_/i.test(trimmed)) {
        router.push(`/invoices/${trimmed}`);
        return;
      }
      const params = new URLSearchParams();
      if (trimmed) params.set("q", trimmed);
      if (typeof window !== "undefined" && pathname === "/invoices") {
        const status = new URLSearchParams(window.location.search).get("status");
        if (status) params.set("status", status);
      }
      router.push(params.toString() ? `/invoices?${params}` : "/invoices");
    });
  }

  return (
    <div className="min-h-full lg:grid lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-[240px] border-r border-border bg-sidebar transition-transform lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-full flex-col px-4 py-5">
          <div className="flex items-center justify-between">
            <Link href="/" onClick={() => setOpen(false)} aria-label="Ledgerly home">
              <Wordmark />
            </Link>
            <button
              type="button"
              className="rounded-md p-1 text-muted-foreground lg:hidden"
              onClick={() => setOpen(false)}
              aria-label="Close navigation"
            >
              <X className="size-5" />
            </button>
          </div>

          <nav className="mt-8 flex flex-1 flex-col gap-1">
            {NAV.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-indigo-soft text-indigo"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className="size-4" />
                    {item.label}
                  </span>
                  {item.href === "/disputes" && openDisputeCount > 0 ? (
                    <span className="rounded-full bg-indigo px-1.5 text-[11px] leading-5 text-primary-foreground">
                      {openDisputeCount}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>

          <div className="rounded-xl bg-indigo-soft px-3.5 py-3.5">
            <div className="flex items-start gap-2">
              <Sparkles className="mt-0.5 size-4 text-indigo" />
              <div>
                <p className="text-sm font-semibold text-foreground">Collections 4.2</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Overdue folios and dunning notes sit in the collections queue. Catalog stays $49 / $99 / $249.
                </p>
                <Link
                  href="/collections"
                  onClick={() => setOpen(false)}
                  className="mt-2 inline-block text-xs font-medium text-indigo hover:underline"
                >
                  Open collections →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-ink/30 lg:hidden"
          aria-label="Dismiss navigation"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-card/90 px-4 backdrop-blur-md sm:px-6">
          <button
            type="button"
            className="rounded-md border border-border bg-card p-1.5 lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open navigation"
          >
            <Menu className="size-4" />
          </button>

          <form
            className="relative mx-auto min-w-0 flex-1 max-w-xl"
            onSubmit={(event) => {
              event.preventDefault();
              searchBook(query);
            }}
          >
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              name="q"
              value={query}
              placeholder="Search invoices, customers, dsp_… or inv_…"
              className="h-10 w-full rounded-lg border border-transparent bg-muted pr-3 pl-10 text-sm outline-none placeholder:text-muted-foreground focus:border-ring focus:bg-card focus:ring-[3px] focus:ring-ring/20"
              aria-label="Search the book"
              onChange={(event) => {
                const next = event.target.value;
                setQuery(next);
                if (searchTimer.current) clearTimeout(searchTimer.current);
                searchTimer.current = setTimeout(() => searchBook(next), 220);
              }}
            />
          </form>

          <div className="flex items-center gap-1 sm:gap-2">
            <ContrastToggle />
            <ThemeToggle />
            <NoticeBell openDisputeCount={openDisputeCount} openDisputes={openDisputes} />
            <div
              className="flex size-9 items-center justify-center rounded-full bg-indigo-soft text-xs font-semibold text-indigo"
              title={`${DEMO_OPERATOR.name} · ${DEMO_OPERATOR.role}`}
            >
              {DEMO_OPERATOR.initials}
            </div>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
