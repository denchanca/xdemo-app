import { prisma } from "@/lib/prisma";
import { suggestDisputeCredit } from "@/lib/dispute-credit";
import { isPlanId, planPriceCents } from "@/lib/plans";

export type ResolveDisputeInput = {
  disputeId: string;
  action: "accept" | "decline";
  reviewerNote?: string;
};

export class ResolveDisputeError extends Error {
  constructor(
    message: string,
    readonly httpStatus: number,
  ) {
    super(message);
    this.name = "ResolveDisputeError";
  }
}

/**
 * Persist ACCEPTED or DECLINED with the reviewer note.
 * Accepted credit is capped at the catalog plan price. Never invent a number.
 */
export async function resolveDispute(input: ResolveDisputeInput) {
  // #region agent log
  {
    const payload = {
      sessionId: "c78e33",
      runId: "post-fix",
      hypothesisId: "H-I",
      location: "lib/disputes/resolve.ts:resolveDispute",
      message: "resolveDispute called",
      data: { disputeId: input.disputeId, action: input.action, hasNote: Boolean(input.reviewerNote) },
      timestamp: Date.now(),
    };
    try {
      require("node:fs").appendFileSync(
        "/mnt/d/xdemo-app/.cursor/debug-c78e33.log",
        JSON.stringify(payload) + "\n",
      );
    } catch {
      /* ignore */
    }
    fetch("http://127.0.0.1:7557/ingest/672075b8-288d-4b34-ab66-5baf9d745e5c", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "c78e33" },
      body: JSON.stringify(payload),
    }).catch(() => {});
  }
  // #endregion

  const dispute = await prisma.dispute.findUnique({
    where: { id: input.disputeId },
    include: { invoice: true },
  });
  if (!dispute) {
    throw new ResolveDisputeError("Dispute not found", 404);
  }
  if (dispute.status === "ACCEPTED" || dispute.status === "DECLINED") {
    throw new ResolveDisputeError("Dispute is already resolved", 409);
  }
  if (!isPlanId(dispute.invoice.plan)) {
    throw new ResolveDisputeError(
      `Unknown plan "${dispute.invoice.plan}". Catalog is Starter $49, Growth $99, Scale $249.`,
      400,
    );
  }

  const catalogPrice = planPriceCents(dispute.invoice.plan);
  const creditCents = suggestDisputeCredit({
    disputedAmountCents: dispute.disputedAmountCents,
    planPriceCents: catalogPrice,
  });
  const status = input.action === "accept" ? "ACCEPTED" : "DECLINED";
  const reviewerNote = input.reviewerNote?.trim() ? input.reviewerNote.trim() : null;

  const updated = await prisma.dispute.update({
    where: { id: input.disputeId },
    data: {
      status,
      reviewerNote,
      ...(input.action === "accept" ? { suggestedCreditCents: creditCents } : {}),
    },
  });

  // #region agent log
  {
    const payload = {
      sessionId: "c78e33",
      runId: "post-fix",
      hypothesisId: "I",
      location: "lib/disputes/resolve.ts:resolveDispute:persist",
      message: "resolveDispute persisted",
      data: {
        disputeId: updated.id,
        status: updated.status,
        suggestedCreditCents: updated.suggestedCreditCents,
        catalogPrice,
        creditCents,
        hasNote: Boolean(updated.reviewerNote),
      },
      timestamp: Date.now(),
    };
    try {
      require("node:fs").appendFileSync(
        "/mnt/d/xdemo-app/.cursor/debug-c78e33.log",
        JSON.stringify(payload) + "\n",
      );
    } catch {
      /* ignore */
    }
    fetch("http://127.0.0.1:7557/ingest/672075b8-288d-4b34-ab66-5baf9d745e5c", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "c78e33" },
      body: JSON.stringify(payload),
    }).catch(() => {});
  }
  // #endregion

  return updated;
}
