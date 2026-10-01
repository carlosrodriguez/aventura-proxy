"use client";
import { useState } from "react";
export function AdminLogin() {
  const [email, setEmail] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          const res = await fetch("/api/admin/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          });
          const data = (await res.json()) as {
            message?: string;
            error?: string;
          };
          setMessage(data.message ?? data.error ?? "Access unavailable");
        } catch {
          setMessage("Access unavailable");
        } finally {
          setBusy(false);
        }
      }}
    >
      <label htmlFor="adminEmail">Administrator email</label>
      <input
        id="adminEmail"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <div className="actions">
        <button disabled={busy}>Send sign-in link</button>
      </div>
      <p role="status">{message}</p>
    </form>
  );
}
