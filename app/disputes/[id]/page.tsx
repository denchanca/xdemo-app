import Link from "next/link";
import { notFound } from "next/navigation";
import { DisputeResolutionActions } from "@/components/dispute-resolution-actions";
import { PageHeader } from "@/components/page-header";
import { DisputeStatusBadge, InvoiceStatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDispute } from "@/lib/data";
import { formatDate } from "@/lib/dates";
import { suggestDisputeCredit } from "@/lib/dispute-credit";
import { formatUsd } from "@/lib/money";
import { isPlanId, planLabel, planPriceCents } from "@/lib/plans";
import { cn } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const dispute = await getDispute(id);
  return { title: dispute ? `Dispute ${dispute.id}` : "Dispute" };
}

export default async function DisputeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const dispute = await getDispute(id);
  if (!dispute) notFound();
  if (!isPlanId(dispute.invoice.plan)) notFound();

  const catalogPrice = planPriceCents(dispute.invoice.plan);
  // Recomputed on every render so the panel tracks lib/dispute-credit.ts
  // rather than whatever was stored when the dispute was opened.
  const suggestedCredit = suggestDisputeCredit({
    disputedAmountCents: dispute.disputedAmountCents,
    planPriceCents: catalogPrice,
  });
  const overCatalog = suggestedCredit > catalogPrice;
  // #region agent log
  {const payload={sessionId:'f8c635',runId:'post-fix',hypothesisId:'B',location:'app/disputes/[id]/page.tsx:DisputeDetailPage',message:'dispute page credit vs invoice',data:{disputeId:dispute.id,invoiceId:dispute.invoice.id,invoiceNumber:dispute.invoice.number,plan:dispute.invoice.plan,invoiceTotalCents:dispute.invoice.totalCents,catalogPrice,disputedAmountCents:dispute.disputedAmountCents,liveSuggestedCredit:suggestedCredit,storedSuggestedCreditCents:dispute.suggestedCreditCents,overCatalog,liveExceedsInvoice:suggestedCredit>dispute.invoice.totalCents,storedExceedsInvoice:dispute.suggestedCreditCents>dispute.invoice.totalCents,catalogMatchesInvoice:catalogPrice===dispute.invoice.totalCents},timestamp:Date.now()};try{require('fs').appendFileSync('/mnt/d/xdemo-app/.cursor/debug-f8c635.log',JSON.stringify(payload)+'\n');}catch{}await fetch('http://127.0.0.1:7480/ingest/56795edd-30ac-4aa4-8e93-cfa4d2e2433b',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'f8c635'},body:JSON.stringify(payload)}).catch(()=>{});}
  // #endregion

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <PageHeader
        eyebrow="Dispute"
        title={dispute.invoice.customer.name}
        description={`${dispute.invoice.number} · opened ${formatDate(dispute.openedOn)}`}
        actions={<DisputeStatusBadge status={dispute.status} />}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Why it was opened</CardTitle>
            <CardDescription>Seeded language. Do not replace this with a real customer story.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-relaxed">
            <p>{dispute.reason}</p>
            <p className="text-muted-foreground">
              Disputed {formatUsd(dispute.disputedAmountCents)} against a {planLabel(dispute.invoice.plan)}{" "}
              invoice priced at {formatUsd(catalogPrice)}.
            </p>
            {dispute.reviewerNote ? (
              <p className="rounded-md bg-indigo-soft px-3 py-2 text-foreground">{dispute.reviewerNote}</p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Linked invoice</CardTitle>
            <CardDescription className="flex items-center gap-2">
              <InvoiceStatusBadge status={dispute.invoice.status} />
              <span>{formatUsd(dispute.invoice.totalCents)}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>{dispute.invoice.memo}</p>
            <Button asChild variant="outline" size="sm">
              <Link href={`/invoices/${dispute.invoice.id}`}>Open {dispute.invoice.number}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/*
        MULTI-FILE AGENT STUB
        Complete together:
          1. lib/disputes/resolve.ts
          2. app/api/disputes/[id]/resolve/route.ts
          3. this panel — enable Accept / Decline and persist a reviewer note
        Suggested credit must use the catalog cap. See tests/dispute-credit.test.ts.
      */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>Resolution</CardTitle>
          <CardDescription>
            Accept or decline against the {planLabel(dispute.invoice.plan)} catalog price of{" "}
            {formatUsd(catalogPrice)}. Do not invent a credit above that amount.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div
            className={cn(
              "rounded-md px-3 py-2",
              overCatalog ? "bg-danger-soft" : "bg-indigo-soft",
            )}
          >
            <p
              className={cn(
                "text-lg font-semibold tracking-tight",
                overCatalog ? "text-danger" : "text-foreground",
              )}
            >
              Suggested credit {formatUsd(suggestedCredit)}
            </p>
            <p className={cn("text-xs", overCatalog ? "text-danger" : "text-muted-foreground")}>
              {overCatalog
                ? `Above the ${planLabel(dispute.invoice.plan)} catalog price of ${formatUsd(catalogPrice)}. Ledgerly must never credit more than it charged.`
                : `Within the ${planLabel(dispute.invoice.plan)} catalog price of ${formatUsd(catalogPrice)}.`}
            </p>
          </div>

          <DisputeResolutionActions
            disputeId={dispute.id}
            initialNote={dispute.reviewerNote ?? ""}
            locked={dispute.status === "ACCEPTED" || dispute.status === "DECLINED"}
          />
          <p className="text-xs text-muted-foreground">
            Recorded when this dispute was opened: {formatUsd(dispute.suggestedCreditCents)}.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
