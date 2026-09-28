/**
 * Suggested credit for a dispute.
 *
 * Never suggest more credit than the catalog plan price
 * ($49 / $99 / $249 in cents). Do not invent a price.
 */
export function suggestDisputeCredit(input: {
  disputedAmountCents: number;
  planPriceCents: number;
}): number {
  if (input.disputedAmountCents < 0 || input.planPriceCents < 0) {
    throw new Error("Credit inputs must be non-negative cents.");
  }

  const result = Math.min(input.disputedAmountCents, input.planPriceCents);
  // #region agent log
  {
    const payload = {
      sessionId: "c78e33",
      runId: "post-fix",
      hypothesisId: "A",
      location: "lib/dispute-credit.ts:suggestDisputeCredit",
      message: "suggestDisputeCredit inputs and return",
      data: {
        disputedAmountCents: input.disputedAmountCents,
        planPriceCents: input.planPriceCents,
        result,
        catalogCapWouldBe: Math.min(input.disputedAmountCents, input.planPriceCents),
        exceededPlan: result > input.planPriceCents,
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
  return result;
}
