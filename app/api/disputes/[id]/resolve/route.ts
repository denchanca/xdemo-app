import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { DisputeResolveError, resolveDispute } from "@/lib/disputes/resolve";

/**
 * Accept { action: "accept" | "decline", reviewerNote?: string }
 * and persist via resolveDispute.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let body: { action?: string; reviewerNote?: string } = {};
  try {
    body = (await request.json()) as { action?: string; reviewerNote?: string };
  } catch {
    body = {};
  }

  if (body.action !== "accept" && body.action !== "decline") {
    // #region agent log
    {const payload={sessionId:'f8c635',runId:'post-fix',hypothesisId:'C',location:'app/api/disputes/[id]/resolve/route.ts:POST',message:'resolve API rejected action',data:{id,action:body.action??null},timestamp:Date.now()};try{require('fs').appendFileSync('/mnt/d/xdemo-app/.cursor/debug-f8c635.log',JSON.stringify(payload)+'\n');}catch{}await fetch('http://127.0.0.1:7480/ingest/56795edd-30ac-4aa4-8e93-cfa4d2e2433b',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'f8c635'},body:JSON.stringify(payload)}).catch(()=>{});}
    // #endregion
    return NextResponse.json(
      { error: "action must be accept or decline" },
      { status: 400 },
    );
  }

  try {
    // #region agent log
    {const payload={sessionId:'f8c635',runId:'post-fix',hypothesisId:'C',location:'app/api/disputes/[id]/resolve/route.ts:POST',message:'resolve API calling helper',data:{id,action:body.action,hasReviewerNote:Boolean(body.reviewerNote)},timestamp:Date.now()};try{require('fs').appendFileSync('/mnt/d/xdemo-app/.cursor/debug-f8c635.log',JSON.stringify(payload)+'\n');}catch{}await fetch('http://127.0.0.1:7480/ingest/56795edd-30ac-4aa4-8e93-cfa4d2e2433b',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'f8c635'},body:JSON.stringify(payload)}).catch(()=>{});}
    // #endregion
    const dispute = await resolveDispute({
      disputeId: id,
      action: body.action,
      reviewerNote: body.reviewerNote,
    });
    revalidatePath(`/disputes/${id}`);
    revalidatePath("/disputes");
    return NextResponse.json({ ok: true, dispute });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to resolve dispute";
    const status = error instanceof DisputeResolveError ? error.status : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
