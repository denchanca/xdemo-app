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

  // Cap at the catalog plan price. Seeded dispute dsp_1043 claims $400 against a
  // $249 Scale invoice; suggestion must be $249 — money Ledgerly actually charged.
  const result = Math.min(input.disputedAmountCents, input.planPriceCents);
  // #region agent log
  {const payload={sessionId:'f8c635',runId:'post-fix',hypothesisId:'A',location:'lib/dispute-credit.ts:suggestDisputeCredit',message:'suggestDisputeCredit result vs catalog cap',data:{disputedAmountCents:input.disputedAmountCents,planPriceCents:input.planPriceCents,result,exceedsPlan:result>input.planPriceCents,wouldCapTo:Math.min(input.disputedAmountCents,input.planPriceCents)},timestamp:Date.now()};try{require('fs').appendFileSync('/mnt/d/xdemo-app/.cursor/debug-f8c635.log',JSON.stringify(payload)+'\n');}catch{}fetch('http://127.0.0.1:7480/ingest/56795edd-30ac-4aa4-8e93-cfa4d2e2433b',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'f8c635'},body:JSON.stringify(payload)}).catch(()=>{});}
  // #endregion
  return result;
}
