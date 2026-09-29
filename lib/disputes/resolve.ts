import { suggestDisputeCredit } from "@/lib/dispute-credit";
import { prisma } from "@/lib/prisma";
import { isPlanId, planPriceCents } from "@/lib/plans";

export type ResolveDisputeInput = {
  disputeId: string;
  action: "accept" | "decline";
  reviewerNote?: string;
};

export class DisputeResolveError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "DisputeResolveError";
  }
}

/**
 * Persist Accept / Decline. Accepting a credit is capped at the catalog
 * plan price ($49 / $99 / $249). Never invent a number.
 */
export async function resolveDispute(input: ResolveDisputeInput) {
  // #region agent log
  {const payload={sessionId:'f8c635',runId:'post-fix',hypothesisId:'C',location:'lib/disputes/resolve.ts:resolveDispute',message:'resolveDispute called',data:{disputeId:input.disputeId,action:input.action,hasReviewerNote:Boolean(input.reviewerNote),noteLength:input.reviewerNote?.length??0},timestamp:Date.now()};try{require('fs').appendFileSync('/mnt/d/xdemo-app/.cursor/debug-f8c635.log',JSON.stringify(payload)+'\n');}catch{}await fetch('http://127.0.0.1:7480/ingest/56795edd-30ac-4aa4-8e93-cfa4d2e2433b',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'f8c635'},body:JSON.stringify(payload)}).catch(()=>{});}
  // #endregion

  const dispute = await prisma.dispute.findUnique({
    where: { id: input.disputeId },
    include: { invoice: true },
  });
  if (!dispute) {
    throw new DisputeResolveError("Dispute not found", 404);
  }
  if (dispute.status === "ACCEPTED" || dispute.status === "DECLINED") {
    throw new DisputeResolveError("Dispute is already resolved", 409);
  }
  if (!isPlanId(dispute.invoice.plan)) {
    throw new DisputeResolveError(
      `Unknown plan "${dispute.invoice.plan}". Catalog is Starter $49, Growth $99, Scale $249.`,
      400,
    );
  }

  const catalogPrice = planPriceCents(dispute.invoice.plan);
  const suggestedCreditCents = suggestDisputeCredit({
    disputedAmountCents: dispute.disputedAmountCents,
    planPriceCents: catalogPrice,
  });
  const reviewerNote = input.reviewerNote?.trim() ? input.reviewerNote.trim() : null;

  const updated = await prisma.dispute.update({
    where: { id: dispute.id },
    data:
      input.action === "accept"
        ? { status: "ACCEPTED", suggestedCreditCents, reviewerNote }
        : { status: "DECLINED", reviewerNote },
  });

  // #region agent log
  {const payload={sessionId:'f8c635',runId:'post-fix',hypothesisId:'C',location:'lib/disputes/resolve.ts:persisted',message:'dispute resolved',data:{disputeId:updated.id,action:input.action,status:updated.status,suggestedCreditCents:updated.suggestedCreditCents,catalogPrice,capped:suggestedCreditCents<=catalogPrice,hasReviewerNote:Boolean(updated.reviewerNote)},timestamp:Date.now()};try{require('fs').appendFileSync('/mnt/d/xdemo-app/.cursor/debug-f8c635.log',JSON.stringify(payload)+'\n');}catch{}await fetch('http://127.0.0.1:7480/ingest/56795edd-30ac-4aa4-8e93-cfa4d2e2433b',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'f8c635'},body:JSON.stringify(payload)}).catch(()=>{});}
  // #endregion

  return updated;
}
