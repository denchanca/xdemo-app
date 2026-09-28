import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { ResolveDisputeError, resolveDispute } from "@/lib/disputes/resolve";

/**
 * Accept { action: "accept" | "decline", reviewerNote?: string }
 * and persist via resolveDispute.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // #region agent log
  fetch("http://127.0.0.1:7557/ingest/672075b8-288d-4b34-ab66-5baf9d745e5c", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "c78e33" },
    body: JSON.stringify({
      sessionId: "c78e33",
      runId: "post-fix",
      hypothesisId: "H",
      location: "app/api/disputes/[id]/resolve/route.ts:POST",
      message: "resolve API invoked",
      data: { disputeId: id },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  try {
    require("node:fs").appendFileSync(
      "/mnt/d/xdemo-app/.cursor/debug-c78e33.log",
      JSON.stringify({
        sessionId: "c78e33",
        runId: "post-fix",
        hypothesisId: "H",
        location: "app/api/disputes/[id]/resolve/route.ts:POST",
        message: "resolve API invoked",
        data: { disputeId: id },
        timestamp: Date.now(),
      }) + "\n",
    );
  } catch {
    /* ignore */
  }
  // #endregion

  let body: { action?: string; reviewerNote?: string } = {};
  try {
    body = (await request.json()) as { action?: string; reviewerNote?: string };
  } catch {
    body = {};
  }

  if (body.action !== "accept" && body.action !== "decline") {
    return NextResponse.json(
      { error: "action must be accept or decline" },
      { status: 400 },
    );
  }

  try {
    const dispute = await resolveDispute({
      disputeId: id,
      action: body.action,
      reviewerNote: body.reviewerNote,
    });
    revalidatePath(`/disputes/${id}`);
    revalidatePath("/disputes");
    revalidatePath("/");
    return NextResponse.json({ ok: true, status: dispute.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to resolve dispute";
    const status = error instanceof ResolveDisputeError ? error.httpStatus : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
