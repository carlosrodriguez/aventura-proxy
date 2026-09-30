"use client";
import { useState } from "react";
export function Revocation({ enabled }: { enabled: boolean }) {
  const [reason, setReason] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <>
      <p>
        This records a request for the submission authorized by this browser
        session. It does not itself legally revoke a proxy. Contact the
        Association for its required procedure.
      </p>
      <label htmlFor="reason">Reason for your request</label>
      <textarea
        id="reason"
        value={reason}
        maxLength={1000}
        onChange={(e) => setReason(e.target.value)}
      />
      <div className="actions">
        <button
          disabled={!enabled || busy || !reason.trim()}
          onClick={async () => {
            setBusy(true);
            try {
              const res = await fetch("/api/proxy/revocation", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reason }),
              });
              const data = (await res.json()) as {
                message?: string;
                error?: string;
              };
              setMessage(data.message ?? data.error ?? "Request unavailable");
            } catch {
              setMessage("Request unavailable");
            } finally {
              setBusy(false);
            }
          }}
        >
          Record revocation request
        </button>
      </div>
      {!enabled && (
        <p className="preview">Requests are disabled in preview mode.</p>
      )}
      <p role="status">{message}</p>
      <p>
        If your browser session has expired, use the{" "}
        <a href="/contact">contact page</a> and provide your submission ID.
      </p>
    </>
  );
}
