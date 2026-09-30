"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
type Row = {
  id: string;
  property: string;
  signer: string;
  status: string;
  associationStatus: string;
  likelyDuplicate: boolean;
  deliveredAt: string | null;
  revocationRequestedAt: string | null;
  events: Array<{
    id: string;
    eventType: string;
    timestamp: string;
    metadata: unknown;
  }>;
};
export function AdminPanel() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]),
    [error, setError] = useState(""),
    [cursor, setCursor] = useState<string | null>(null);
  async function load(after?: string) {
    const res = await fetch(
      `/api/admin/submissions${after ? `?after=${after}` : ""}`,
    );
    const data = (await res.json()) as {
      submissions?: Row[];
      nextCursor?: string | null;
      error?: string;
    };
    if (res.ok) {
      setRows(data.submissions ?? []);
      setCursor(data.nextCursor ?? null);
    } else setError(data.error ?? "Access unavailable");
  }
  useEffect(() => {
    void load();
  }, []);
  async function action(id: string, action: string, status?: string) {
    const res = await fetch("/api/admin/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action, status }),
    });
    const data = (await res.json()) as { url?: string; error?: string };
    if (!res.ok) setError(data.error ?? "Request failed");
    else if (data.url) window.location.assign(data.url);
    else await load();
  }
  return (
    <>
      <div className="actions">
        <a
          className="button secondary"
          href="/api/admin/submissions?format=csv"
        >
          Export complete CSV manifest
        </a>
        <button
          className="secondary"
          onClick={async () => {
            await fetch("/api/admin/session", {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
            });
            router.push("/");
          }}
        >
          Sign out
        </button>
      </div>
      <p role="alert">{error}</p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Property / signer</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id}>
                <td>
                  {s.property}
                  <br />
                  {s.signer}
                  <br />
                  <small>{s.id}</small>
                  {s.likelyDuplicate && (
                    <p>Likely duplicate — independent review required</p>
                  )}
                  {s.revocationRequestedAt && <p>Revocation requested</p>}
                </td>
                <td>
                  {s.status}
                  <br />
                  Association: {s.associationStatus}
                  <label htmlFor={`status-${s.id}`}>
                    Record Association decision
                  </label>
                  <select
                    id={`status-${s.id}`}
                    value={s.associationStatus}
                    onChange={(e) =>
                      void action(s.id, "validation", e.target.value)
                    }
                  >
                    {[
                      "pending",
                      "accepted",
                      "rejected",
                      "duplicate",
                      "revoked",
                    ].map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                  <details>
                    <summary>Audit timeline</summary>
                    {s.events.map((e) => (
                      <p key={e.id}>
                        {e.timestamp} · {e.eventType}
                        <br />
                        <small>{JSON.stringify(e.metadata)}</small>
                      </p>
                    ))}
                  </details>
                </td>
                <td>
                  <button
                    disabled={s.status !== "FINALIZED"}
                    onClick={() => void action(s.id, "download")}
                  >
                    Download
                  </button>
                  <button
                    className="secondary"
                    disabled={s.status !== "FINALIZED"}
                    onClick={() => void action(s.id, "delivered")}
                  >
                    {s.deliveredAt ? "Delivered" : "Mark delivered"}
                  </button>
                  <button
                    className="secondary"
                    disabled={s.status !== "FINALIZED"}
                    onClick={() => void action(s.id, "retry-email")}
                  >
                    Retry receipt / delivery
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {cursor && (
        <div className="actions">
          <button onClick={() => void load(cursor)}>Next 100 records</button>
          <a href={`/api/admin/submissions?format=csv&after=${cursor}`}>
            Export next page
          </a>
        </div>
      )}
    </>
  );
}
