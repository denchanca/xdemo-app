"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ResolutionPanel({
  disputeId,
  defaultNote,
  canResolve,
}: {
  disputeId: string;
  defaultNote: string;
  canResolve: boolean;
}) {
  const router = useRouter();
  const [note, setNote] = useState(defaultNote);
  const [pending, setPending] = useState<"accept" | "decline" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(action: "accept" | "decline") {
    if (!canResolve || pending) return;
    setError(null);
    setPending(action);
    // #region agent log
    fetch("http://127.0.0.1:7557/ingest/672075b8-288d-4b34-ab66-5baf9d745e5c", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "c78e33" },
      body: JSON.stringify({
        sessionId: "c78e33",
        runId: "post-fix",
        hypothesisId: "F-G",
        location: "app/disputes/[id]/resolution-panel.tsx:submit",
        message: "resolution submit",
        data: { disputeId, action, hasNote: Boolean(note.trim()), canResolve },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    try {
      const response = await fetch(`/api/disputes/${disputeId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reviewerNote: note }),
      });
      const payload = (await response.json()) as { error?: string; status?: string };
      // #region agent log
      fetch("http://127.0.0.1:7557/ingest/672075b8-288d-4b34-ab66-5baf9d745e5c", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "c78e33" },
        body: JSON.stringify({
          sessionId: "c78e33",
          runId: "post-fix",
          hypothesisId: "H",
          location: "app/disputes/[id]/resolution-panel.tsx:response",
          message: "resolution API response",
          data: { disputeId, action, httpStatus: response.status, ok: response.ok, status: payload.status ?? null },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      if (!response.ok) {
        setError(payload.error ?? "Unable to resolve this dispute.");
        return;
      }
      router.refresh();
    } catch {
      setError("Unable to reach the resolve API.");
    } finally {
      setPending(null);
    }
  }

  return (
    <>
      <Label htmlFor="reviewer-note">Reviewer note</Label>
      <Textarea
        id="reviewer-note"
        placeholder="Why this credit is accepted or declined. Stay inside the catalog price."
        value={note}
        onChange={(event) => setNote(event.target.value)}
        disabled={!canResolve || pending !== null}
      />
      <div
        className="flex flex-wrap gap-2"
        onPointerDown={(event) => {
          const target = event.target as HTMLElement;
          const button = target.closest("button");
          // #region agent log
          fetch("http://127.0.0.1:7557/ingest/672075b8-288d-4b34-ab66-5baf9d745e5c", {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "c78e33" },
            body: JSON.stringify({
              sessionId: "c78e33",
              runId: "post-fix",
              hypothesisId: "F-G",
              location: "app/disputes/[id]/resolution-panel.tsx:pointerdown",
              message: "resolution button pointerdown",
              data: {
                disputeId,
                buttonText: button?.textContent?.trim() ?? null,
                buttonDisabled: button?.disabled ?? null,
                canResolve,
              },
              timestamp: Date.now(),
            }),
          }).catch(() => {});
          // #endregion
        }}
      >
        <Button
          type="button"
          disabled={!canResolve || pending !== null}
          onClick={() => submit("accept")}
        >
          {pending === "accept" ? "Accepting…" : "Accept credit"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={!canResolve || pending !== null}
          onClick={() => submit("decline")}
        >
          {pending === "decline" ? "Declining…" : "Decline"}
        </Button>
      </div>
      {error ? <p className="text-xs text-danger">{error}</p> : null}
      {!canResolve ? (
        <p className="text-xs text-muted-foreground">This dispute is already resolved.</p>
      ) : null}
    </>
  );
}
