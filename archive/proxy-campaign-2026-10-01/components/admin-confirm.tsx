"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
export function AdminConfirm() {
  const router = useRouter();
  const token = useRef(""),
    [error, setError] = useState("");
  useEffect(() => {
    token.current =
      new URLSearchParams(window.location.hash.slice(1)).get("token") ?? "";
    history.replaceState(null, "", "/admin/confirm");
  }, []);
  return (
    <>
      <p>Confirm sign-in in the browser where you requested the link.</p>
      <button
        onClick={async () => {
          try {
            const res = await fetch("/api/admin/session", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ token: token.current }),
            });
            if (res.ok) router.push("/admin");
            else setError("Access unavailable. Request a new link.");
          } catch {
            setError("Access unavailable");
          }
        }}
      >
        Confirm sign-in
      </button>
      <p role="alert">{error}</p>
    </>
  );
}
