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
  associationSentAt: string | null;
  holderReceivedAt: string | null;
  printedAt: string | null;
  filedAt: string | null;
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
    [cursor, setCursor] = useState<string | null>(null),
    [search, setSearch] = useState(""),
    [filter, setFilter] = useState("all"),
    [busy, setBusy] = useState(""),
    [testTools, setTestTools] = useState(false),
    [confirmation, setConfirmation] = useState(""),
    [backup, setBackup] = useState<{
      url: string;
      sha256: string;
      count: number;
      cleared: boolean;
      filesRemaining: number;
    } | null>(null);
  async function load(after?: string) {
    const res = await fetch(
      `/api/admin/submissions${after ? `?after=${after}` : ""}`,
    );
    const data = await res.json();
    if (res.ok) {
      setRows(data.submissions ?? []);
      setCursor(data.nextCursor ?? null);
    } else setError(data.error ?? "Access unavailable");
  }
  useEffect(() => {
    void load();
    void fetch("/api/admin/test-data")
      .then((r) => r.json())
      .then((data) => setTestTools(data.enabled === true));
  }, []);
  async function action(
    id: string,
    action: string,
    status?: string,
    confirmed?: boolean,
  ) {
    setBusy(id);
    setError("");
    try {
      const res = await fetch("/api/admin/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action, status, confirmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      if (data.url) window.location.assign(data.url);
      else await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setBusy("");
    }
  }
  async function manageTests(clear: boolean) {
    setBusy("tests");
    setError("");
    try {
      const res = await fetch("/api/admin/test-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: clear ? "clear" : "backup",
          confirmation,
        }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(
          data.error ??
            "Backup or reset failed; records were not confirmed cleared",
        );
      setBackup(data);
      setConfirmation("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setBusy("");
    }
  }
  const visible = rows.filter(
    (s) =>
      `${s.property} ${s.signer} ${s.id}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (filter === "all" ||
        (filter === "unprinted" && s.status === "FINALIZED" && !s.printedAt) ||
        (filter === "duplicates" && s.likelyDuplicate) ||
        (filter === "unfiled" && s.status === "FINALIZED" && !s.filedAt)),
  );
  return (
    <>
      <div className="admin-toolbar">
        <a
          className="button secondary"
          href="/api/admin/submissions?format=csv"
        >
          Export all submissions
        </a>
        <button className="secondary" onClick={() => void load()}>
          Refresh
        </button>
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
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div className="admin-stats">
        {[
          ["Finalized", rows.filter((s) => s.status === "FINALIZED").length],
          ["Jenny received", rows.filter((s) => s.holderReceivedAt).length],
          ["Printed", rows.filter((s) => s.printedAt).length],
          ["Filed", rows.filter((s) => s.filedAt).length],
        ].map(([label, count]) => (
          <div key={label}>
            <strong>{count}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <p className="note">
        Counts and filters cover the current page. Export all submissions to
        reconcile the complete collection. Email sending does not confirm
        receipt or acceptance.
      </p>
      <div className="admin-filters">
        <label>
          Find a submission
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Property, signer, or submission ID"
          />
        </label>
        <label>
          Show
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All submissions</option>
            <option value="unprinted">Finalized, not printed</option>
            <option value="unfiled">Finalized, not filed</option>
            <option value="duplicates">Possible duplicates</option>
          </select>
        </label>
      </div>
      <div className="admin-records">
        {visible.map((s) => (
          <section className="admin-record" key={s.id}>
            <div className="admin-property">
              <h2>{s.property}</h2>
              <p>{s.signer}</p>
              <span className="admin-badge">{s.status.toLowerCase()}</span>
              {s.likelyDuplicate && (
                <span className="admin-badge warning">Review duplicate</span>
              )}
              <small>{s.id}</small>
            </div>
            <div className="admin-progress">
              <h3>Paper copy checklist</h3>
              <div className="admin-checks">
                {(
                  [
                    ["received", "Jenny received", s.holderReceivedAt],
                    ["printed", "Printed", s.printedAt],
                    ["filed", "Filed", s.filedAt],
                  ] as const
                ).map(([key, label, timestamp]) => (
                  <label key={key}>
                    <input
                      type="checkbox"
                      checked={Boolean(timestamp)}
                      disabled={s.status !== "FINALIZED" || busy === s.id}
                      onChange={(e) =>
                        void action(s.id, key, undefined, e.target.checked)
                      }
                    />
                    <span>
                      {label}
                      {timestamp && (
                        <small>{new Date(timestamp).toLocaleString()}</small>
                      )}
                    </span>
                  </label>
                ))}
              </div>
              <p className="note">
                Confirm with Jenny before checking an item.
              </p>
            </div>
            <div className="admin-decision">
              <label htmlFor={`status-${s.id}`}>Association decision</label>
              <select
                id={`status-${s.id}`}
                value={s.associationStatus}
                disabled={busy === s.id}
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
              <button
                disabled={s.status !== "FINALIZED" || busy === s.id}
                onClick={() => void action(s.id, "download")}
              >
                Download PDF
              </button>
            </div>
            <details className="admin-record-details">
              <summary>Email and audit history</summary>
              <p className="note">
                Delivery copy:{" "}
                {s.associationSentAt ? "Sent to email provider" : "Not sent"}
              </p>
              <button
                className="secondary"
                disabled={s.status !== "FINALIZED" || busy === s.id}
                onClick={() => void action(s.id, "retry-email")}
              >
                Retry unsent emails
              </button>
              <div className="admin-audit">
                {s.events.map((e) => (
                  <p key={e.id}>
                    <strong>{e.eventType}</strong> ·{" "}
                    {new Date(e.timestamp).toLocaleString()}
                    <small>{JSON.stringify(e.metadata)}</small>
                  </p>
                ))}
              </div>
            </details>
          </section>
        ))}
      </div>
      {!visible.length && <p>No submissions match this view.</p>}
      {cursor && (
        <div className="admin-toolbar">
          <button onClick={() => void load(cursor)}>Next 100 records</button>
          <button className="secondary" onClick={() => void load()}>
            First page
          </button>
        </div>
      )}
      {testTools && (
        <details className="admin-test-tools">
          <summary>Dev test data: backup and reset</summary>
          <p>
            This tool is available only on dev. A private backup includes the
            database and test PDF/signature files. Clearing removes test
            submissions and their original private files; it keeps the backup,
            audit ledger, and administrator access. Production cannot use this
            tool.
          </p>
          <div className="admin-toolbar">
            <button
              className="secondary"
              disabled={Boolean(busy)}
              onClick={() => void manageTests(false)}
            >
              {busy === "tests" ? "Working…" : "Create backup"}
            </button>
          </div>
          <label>
            To clear test submissions, type CLEAR DEV TESTS
            <input
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              autoComplete="off"
            />
          </label>
          <button
            className="admin-danger"
            disabled={Boolean(busy) || confirmation !== "CLEAR DEV TESTS"}
            onClick={() => void manageTests(true)}
          >
            Back up and clear dev tests
          </button>
          {backup && (
            <p role="status">
              {backup.count} records backed up.
              {backup.cleared
                ? " Test submissions cleared."
                : " No records cleared."}{" "}
              {backup.filesRemaining > 0 &&
                `${backup.filesRemaining} original files still need operator cleanup.`}
              <br />
              <a href={backup.url}>Download private backup</a>
              <small className="admin-backup-hash">
                SHA-256: {backup.sha256}
              </small>
              <span className="note">
                Download link expires after one minute; the private backup
                remains stored.
              </span>
            </p>
          )}
        </details>
      )}
    </>
  );
}
