import Link from "next/link";
import { AlertTriangle, CalendarRange, CircleDollarSign, FileText, TrendingUp } from "lucide-react";
import { DisputeDonut } from "@/components/charts/dispute-donut";
import { RevenueDisputeScatter } from "@/components/charts/revenue-dispute-scatter";
import { RevenueChart } from "@/components/charts/revenue-chart";
import { InvoiceTable } from "@/components/invoice-table";
import { KpiCard } from "@/components/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboard } from "@/lib/data";
import { formatUsd } from "@/lib/money";

export const metadata = {
  title: "Dashboard",
};

// Read the seed at request time so `next start` reflects a reseed.
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { invoices, series, breakdown, scatter, kpis } = await getDashboard();
  const recent = invoices.filter((invoice) => invoice.status !== "VOID" && invoice.status !== "DRAFT").slice(0, 5);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Fieldnote Workspace · catalog $49 / $99 / $249 · clock frozen 23 Aug 2026.
          </p>
        </div>
        <p className="inline-flex items-center gap-2 self-start rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium shadow-xs">
          <CalendarRange className="size-4 text-muted-foreground" />
          Jul 24 – Aug 23, 2026
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Monthly Recurring Revenue"
          value={formatUsd(kpis.mrrCents)}
          hint={`${kpis.accountCount} seeded plans · $49 / $99 / $249`}
          icon={TrendingUp}
          tone="indigo"
        />
        <KpiCard
          label="Open Invoices"
          value={formatUsd(kpis.openCents)}
          hint="vs Jun 24 – Jul 23"
          change={kpis.openChange}
          icon={FileText}
          tone="indigo"
        />
        <KpiCard
          label="Disputes"
          value={formatUsd(kpis.disputeCents)}
          hint="vs Jun 24 – Jul 23"
          change={kpis.disputeChange}
          icon={AlertTriangle}
          tone="danger"
        />
        <KpiCard
          label="Collected This Month"
          value={formatUsd(kpis.collectedAugustCents)}
          hint="vs Jun 24 – Jul 23"
          change={kpis.collectedChange}
          icon={CircleDollarSign}
          tone="success"
        />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Revenue vs disputes</CardTitle>
        </CardHeader>
        <CardContent>
          <RevenueDisputeScatter points={scatter} />
        </CardContent>
      </Card>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(260px,0.9fr)]">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart
              series={series}
              totalCents={kpis.collectedAugustCents}
              change={kpis.collectedChange}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Disputes status</CardTitle>
          </CardHeader>
          <CardContent>
            <DisputeDonut slices={breakdown} />
          </CardContent>
        </Card>
      </section>

      <Card className="overflow-hidden py-0">
        <CardHeader className="flex-row items-center justify-between px-5 pt-5">
          <CardTitle>Recent invoices</CardTitle>
          <Link href="/invoices" className="text-sm font-medium text-indigo hover:underline">
            View all invoices →
          </Link>
        </CardHeader>
        <CardContent className="px-0 pb-2">
          <InvoiceTable invoices={recent} />
        </CardContent>
      </Card>
    </div>
  );
}
