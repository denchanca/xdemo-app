"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function debugLog(hypothesisId: string, location: string, message: string, data: Record<string, unknown>) {
  // #region agent log
  fetch("http://127.0.0.1:7480/ingest/56795edd-30ac-4aa4-8e93-cfa4d2e2433b", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "f8c635" },
    body: JSON.stringify({
      sessionId: "f8c635",
      runId: "post-fix",
      hypothesisId,
      location,
      message,
      data,
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
}

export function DisputeResolutionActions({
  disputeId,
  initialNote,
  locked,
}: {
  disputeId: string;
  initialNote: string;
  locked: boolean;
}) {
  const router = useRouter();
  const [note, setNote] = useState(initialNote);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function resolve(action: "accept" | "decline") {
    setError(null);
    debugLog("B", "components/dispute-resolution-actions.tsx:resolve", "posting resolve action", {
      disputeId,
      action,
      hasReviewerNote: Boolean(note.trim()),
      locked,
    });
    const response = await fetch(`/api/disputes/${disputeId}/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, reviewerNote: note }),
    });
    const payload = (await response.json().catch(() => ({}))) as {
      error?: string;
      dispute?: { status?: string; suggestedCreditCents?: number; reviewerNote?: string | null };
    };
    debugLog("C", "components/dispute-resolution-actions.tsx:response", "resolve API response", {
      disputeId,
      action,
      httpStatus: response.status,
      ok: response.ok,
      error: payload.error ?? null,
      status: payload.dispute?.status ?? null,
      suggestedCreditCents: payload.dispute?.suggestedCreditCents ?? null,
      hasReviewerNote: Boolean(payload.dispute?.reviewerNote),
    });
    if (!response.ok) {
      setError(payload.error ?? "Unable to resolve this dispute.");
      return;
    }
    startTransition(() => {
      router.refresh();
    });
  }

  const disabled = locked || pending;

  return (
    <div className="space-y-3">
      <Label htmlFor="reviewer-note">Reviewer note</Label>
      <Textarea
        id="reviewer-note"
        placeholder="Why this credit is accepted or declined."
        value={note}
        onChange={(event) => setNote(event.target.value)}
        disabled={disabled}
      />
      <div className="flex flex-wrap gap-2">
        <Button type="button" disabled={disabled} onClick={() => void resolve("accept")}>
          Accept credit
        </Button>
        <Button type="button" variant="outline" disabled={disabled} onClick={() => void resolve("decline")}>
          Decline
        </Button>
      </div>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {locked ? (
        <p className="text-xs text-muted-foreground">This dispute is already resolved.</p>
      ) : null}
    </div>
  );
}
