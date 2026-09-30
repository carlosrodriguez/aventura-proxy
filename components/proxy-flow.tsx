"use client";
import { useEffect, useRef, useState } from "react";
import SignaturePad from "signature_pad";
import { messages } from "@/lib/i18n/en";
import Link from "next/link";
import { authorityNotice, certification, proxyConfig } from "@/lib/config";
import { propertySchema, signerSchema } from "@/lib/validation/submission";
import { Turnstile } from "@/components/turnstile";
const steps = messages.steps;
const initial = {
  houseNumber: "",
  street: "",
  firstName: "",
  lastName: "",
  email: "",
  ownershipType: "Individual" as
    | "Individual"
    | "Joint ownership"
    | "Trust"
    | "LLC"
    | "Corporation"
    | "Other",
  entityName: "",
  signerTitle: "",
};
export function ProxyFlow({
  enabled,
  siteKey,
  nonce,
}: {
  enabled: boolean;
  siteKey: string;
  nonce: string;
}) {
  const [step, setStep] = useState(0),
    [data, setData] = useState(initial),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [certified, setCertified] = useState(false),
    [token, setToken] = useState(""),
    [code, setCode] = useState(""),
    [id, setId] = useState(""),
    [signed, setSigned] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null),
    pad = useRef<SignaturePad | null>(null);
  useEffect(() => {
    if (step !== 3 || !canvas.current) return;
    const el = canvas.current;
    const ratio = Math.min(window.devicePixelRatio || 1, 3);
    el.width = el.offsetWidth * ratio;
    el.height = 210 * ratio;
    el.getContext("2d")?.scale(ratio, ratio);
    const signature = new SignaturePad(el, {
      penColor: "#183b3a",
      minWidth: 1,
      maxWidth: 2.5,
    });
    pad.current = signature;
    signature.addEventListener("endStroke", () =>
      setSigned(!signature.isEmpty()),
    );
    return () => {
      signature.off();
      pad.current = null;
    };
  }, [step]);
  function update(key: keyof typeof initial, value: string) {
    setData((v) => ({ ...v, [key]: value }));
  }
  async function call(
    path: string,
    body: unknown,
  ): Promise<{ id?: string; url?: string; codeSent?: boolean }> {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = (await res.json()) as {
      error?: string;
      id?: string;
      url?: string;
      codeSent?: boolean;
    };
    if (!res.ok) throw new Error(json.error ?? "Request failed");
    return json;
  }
  async function next() {
    setError("");
    if (step === 0) {
      const result = propertySchema.safeParse({
        houseNumber: data.houseNumber,
        street: data.street,
      });
      if (!result.success) {
        setError(result.error.issues[0].message);
        return;
      }
    }
    if (step === 1) {
      const result = signerSchema.safeParse({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        ownershipType: data.ownershipType,
        entityName: data.entityName,
        signerTitle: data.signerTitle,
      });
      if (!result.success) {
        setError(result.error.issues[0].message);
        return;
      }
    }
    if (step === 3) {
      if (!certified || !pad.current || pad.current.isEmpty()) {
        setError("Draw your signature and confirm the certification");
        return;
      }
      if (enabled) {
        if (!token) {
          setError("Complete bot verification");
          return;
        }
        setBusy(true);
        try {
          const result = await call("/api/submissions", {
            ...data,
            signature: pad.current.toDataURL(),
            certified: true,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            turnstileToken: token,
          });
          setId(result.id ?? "");
          setStep(4);
          if (result.codeSent === false)
            setError(
              "Your signature was saved, but the verification email could not be sent. Wait 60 seconds and use Resend code.",
            );
        } catch (e) {
          setError(e instanceof Error ? e.message : "Request failed");
        } finally {
          setBusy(false);
        }
        return;
      }
    }
    setStep((v) => v + 1);
  }
  async function verify() {
    setError("");
    if (!enabled) {
      setStep(5);
      return;
    }
    setBusy(true);
    try {
      await call("/api/proxy/verify", { code });
      setStep(5);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verification unsuccessful");
    } finally {
      setBusy(false);
    }
  }
  const entity = ["Trust", "LLC", "Corporation", "Other"].includes(
    data.ownershipType,
  );
  return (
    <div className="form-shell">
      <Link href="/">← Back to overview</Link>
      <h1 className="step-title">Your limited proxy</h1>
      {!enabled && (
        <p className="preview">
          Preview mode · Entries stay in this browser tab. No submission, code,
          or PDF is sent.
        </p>
      )}
      <p className="note" aria-live="polite">
        Step {step + 1} of 6 · {steps[step]}
      </p>
      <div className="progress" aria-hidden="true">
        {steps.map((s, i) => (
          <span key={s} className={i <= step ? "active" : ""} />
        ))}
      </div>
      <div className="form-card">
        <h2 className="step-title">{steps[step]}</h2>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {step === 0 && (
          <>
            <p>Identify your property. This checks address format only.</p>
            <div className="field">
              <label htmlFor="houseNumber">House number</label>
              <input
                id="houseNumber"
                value={data.houseNumber}
                inputMode="text"
                autoComplete="off"
                maxLength={7}
                onChange={(e) => update("houseNumber", e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="street">Street</label>
              <select
                id="street"
                value={data.street}
                onChange={(e) => update("street", e.target.value)}
              >
                <option value="">Select your street</option>
                {proxyConfig.allowedStreets.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <p className="note">
              We do not look up owners or access the Association’s member
              database.
            </p>
          </>
        )}
        {step === 1 && (
          <>
            <div className="split">
              {(["firstName", "lastName"] as const).map((k) => (
                <div className="field" key={k}>
                  <label htmlFor={k}>
                    {k === "firstName" ? "First name" : "Last name"}
                  </label>
                  <input
                    id={k}
                    value={data[k]}
                    autoComplete={
                      k === "firstName" ? "given-name" : "family-name"
                    }
                    maxLength={100}
                    onChange={(e) => update(k, e.target.value)}
                  />
                </div>
              ))}
            </div>
            <div className="field">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={data.email}
                maxLength={254}
                onChange={(e) => update("email", e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="ownershipType">
                Property ownership type (optional)
              </label>
              <select
                id="ownershipType"
                value={data.ownershipType}
                onChange={(e) => update("ownershipType", e.target.value)}
              >
                {[
                  "Individual",
                  "Joint ownership",
                  "Trust",
                  "LLC",
                  "Corporation",
                  "Other",
                ].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            {entity &&
              (["entityName", "signerTitle"] as const).map((k) => (
                <div className="field" key={k}>
                  <label htmlFor={k}>
                    {k === "entityName"
                      ? "Entity name"
                      : "Signer title / capacity"}
                  </label>
                  <input
                    id={k}
                    value={data[k]}
                    onChange={(e) => update(k, e.target.value)}
                  />
                </div>
              ))}
            <p className="note">
              The Association will independently determine whether the signer is
              authorized to vote for this property.
            </p>
          </>
        )}
        {step === 2 && (
          <>
            <p>
              This limited proxy directs a NO vote on all three proposals. These
              instructions are fixed.
            </p>
            {proxyConfig.proposals.map((p) => (
              <div className="card" key={p.label}>
                <h3>
                  {p.label} — {p.vote}
                </h3>
                <p className="note">{p.language}</p>
              </div>
            ))}
            <p>
              <Link href="/proxy-language" target="_blank">
                View the complete proxy template
              </Link>
            </p>
          </>
        )}
        {step === 3 && (
          <>
            <p>
              <strong>
                {data.firstName} {data.lastName}
              </strong>
              <br />
              {data.houseNumber} {data.street}
              <br />
              {data.email}
            </p>
            <label htmlFor="signature">Draw your signature</label>
            <p className="note">
              Use a finger, stylus, or mouse. Typed signatures are not accepted.
            </p>
            <canvas
              id="signature"
              className="signature"
              ref={canvas}
              aria-label="Draw your handwritten signature"
            />
            <button
              className="secondary"
              type="button"
              onClick={() => {
                pad.current?.clear();
                setSigned(false);
              }}
            >
              Clear signature
            </button>
            <span className="sr-only" aria-live="polite">
              {signed ? "Signature captured" : "Signature empty"}
            </span>
            <div className="check">
              <input
                id="certified"
                type="checkbox"
                checked={certified}
                onChange={(e) => setCertified(e.target.checked)}
              />
              <label htmlFor="certified">{certification}</label>
            </div>
            {enabled && (
              <Turnstile siteKey={siteKey} nonce={nonce} onToken={setToken} />
            )}
            <p className="note">
              {enabled
                ? "Continuing submits your signature and sends an email verification code."
                : "This signature is a local preview and will not be saved or submitted."}
            </p>
          </>
        )}
        {step === 4 && (
          <>
            <p>{authorityNotice}</p>
            {enabled ? (
              <>
                <p>
                  Enter the six-digit code sent to {data.email}. It expires in
                  10 minutes.
                </p>
                <div className="field">
                  <label htmlFor="code">Verification code</label>
                  <input
                    id="code"
                    value={code}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  />
                </div>
                <button
                  className="secondary"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    try {
                      await call("/api/proxy/resend", {});
                      setError("");
                    } catch (e) {
                      setError(
                        e instanceof Error ? e.message : "Request failed",
                      );
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  Resend code
                </button>
              </>
            ) : (
              <p className="preview">
                No verification code was sent. Continue to preview the
                completion screen.
              </p>
            )}
            <div className="actions">
              <button disabled={busy} onClick={verify}>
                {busy
                  ? "Verifying…"
                  : enabled
                    ? "Verify & finalize"
                    : "Preview completion"}
              </button>
            </div>
          </>
        )}
        {step === 5 && (
          <>
            <h3>
              {enabled ? "Your proxy has been finalized" : "Preview complete"}
            </h3>
            <p>
              {enabled
                ? `Submission ID: ${id}. A copy will arrive by email. Association validation is still required.`
                : "No proxy was finalized, emailed, or delivered. Submissions remain disabled until the official template is complete and reviewed."}
            </p>
            <p>{authorityNotice}</p>
            {enabled && (
              <button
                onClick={async () => {
                  try {
                    const result = await call("/api/proxy/download", {});
                    if (result.url) window.location.assign(result.url);
                  } catch (e) {
                    setError(
                      e instanceof Error ? e.message : "Download unavailable",
                    );
                  }
                }}
              >
                Download signed proxy
              </button>
            )}
            <p>
              <Link href="/revocation">Correction or revocation request</Link>
            </p>
            <Link className="button secondary" href="/">
              Return to overview
            </Link>
          </>
        )}
        {step < 4 && (
          <div className="actions">
            {step > 0 && (
              <button
                className="secondary"
                disabled={busy}
                onClick={() => {
                  setError("");
                  setStep((v) => v - 1);
                }}
              >
                Back
              </button>
            )}
            <button disabled={busy} onClick={next}>
              {busy
                ? "Submitting…"
                : step === 3
                  ? enabled
                    ? "Send verification code"
                    : "Continue preview"
                  : "Continue"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
