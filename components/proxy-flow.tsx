"use client";
import { useEffect, useRef, useState } from "react";
import SignaturePad from "signature_pad";
import { messages } from "@/lib/i18n/en";
import Link from "next/link";
import {
  authorityNotice,
  certification,
  proxyConfig,
  disclaimer,
  siteOperatorName,
} from "@/lib/config";
import { propertySchema, signerSchema } from "@/lib/validation/submission";
import { Turnstile } from "@/components/turnstile";
import { spanishSign } from "@/lib/i18n/sign";
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
  locale = "en",
  proxyholder,
  testMode = false,
}: {
  enabled: boolean;
  siteKey: string;
  nonce: string;
  locale?: "en" | "es";
  proxyholder: string;
  testMode?: boolean;
}) {
  const t = (value: string) =>
    locale === "es"
      ? `${value.startsWith(" ") ? " " : ""}${spanishSign[value.trim()] ?? value.trim()}${value.endsWith(" ") ? " " : ""}`
      : value;
  const steps = messages.steps.map(t);
  const [step, setStep] = useState(0),
    [data, setData] = useState(initial),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [certified, setCertified] = useState(false),
    [token, setToken] = useState(""),
    [code, setCode] = useState(""),
    [id, setId] = useState(""),
    [signed, setSigned] = useState(false);
  const [resendAt, setResendAt] = useState(0);
  const [now, setNow] = useState(0);
  const [notice, setNotice] = useState("");
  const [editingReview, setEditingReview] = useState(false);
  const [editingBeforeSign, setEditingBeforeSign] = useState(false);
  const stepHeading = useRef<HTMLHeadingElement>(null);
  const previousStep = useRef(step);
  useEffect(() => {
    if (previousStep.current === step) return;
    previousStep.current = step;
    stepHeading.current?.focus({ preventScroll: true });
    stepHeading.current?.scrollIntoView({
      block: "start",
      behavior: "instant",
    });
  }, [step]);
  const signatureImage = useRef("");
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
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
    if (signatureImage.current)
      void signature.fromDataURL(signatureImage.current);
    signature.addEventListener("endStroke", () => {
      setSigned(!signature.isEmpty());
      signatureImage.current = signature.toDataURL();
    });
    return () => {
      signature.off();
      pad.current = null;
    };
  }, [step]);
  function update(key: keyof typeof initial, value: string) {
    setData((v) => ({ ...v, [key]: value }));
    signatureImage.current = "";
    pad.current?.clear();
    setSigned(false);
    setCertified(false);
  }
  async function call(
    path: string,
    body: unknown,
  ): Promise<{
    id?: string;
    url?: string;
    nextResendAt?: number;
    codeSent?: boolean;
  }> {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = (await res.json()) as {
      error?: string;
      id?: string;
      url?: string;
      nextResendAt?: number;
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
      const details = propertySchema.safeParse(data);
      const person = signerSchema.safeParse(data);
      if (!details.success || !person.success) {
        setError(
          !details.success
            ? details.error.issues[0].message
            : !person.success
              ? person.error.issues[0].message
              : "Request failed",
        );
        return;
      }
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
          setResendAt(Date.now() + 30000);
          setStep(4);
          if (result.codeSent === false)
            setError(
              "Your signature was saved, but the verification email could not be sent. Please use Resend code when available.",
            );
        } catch (e) {
          setError(e instanceof Error ? e.message : t("Request failed"));
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
    if (editingReview) return;
    if (!enabled) {
      setStep(5);
      return;
    }
    setBusy(true);
    try {
      await call("/api/proxy/verify", { code });
      setStep(5);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("Verification unsuccessful"));
    } finally {
      setBusy(false);
    }
  }
  const entity = ["Trust", "LLC", "Corporation", "Other"].includes(
    data.ownershipType,
  );
  const detailsSummary = (edit: () => void) => (
    <div className="proxy-details-summary">
      <p>
        <strong>
          {data.firstName} {data.lastName}
        </strong>
        <br />
        {data.houseNumber} {data.street}
        <br />
        Miami, FL 33179
      </p>
      <button
        type="button"
        className="secondary proxy-details-edit"
        disabled={busy}
        onClick={edit}
        aria-label={
          locale === "es" ? "Editar nombre o dirección" : "Edit name or address"
        }
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M16 3l5 5L8 21H3v-5L16 3z" />
          <path d="M14 5l5 5" />
        </svg>
      </button>
    </div>
  );
  const reviewFields = (
    <>
      <div className="split">
        {(["firstName", "lastName"] as const).map((key) => (
          <div className="field" key={key}>
            <label htmlFor={`review-${key}`}>
              {t(key === "firstName" ? "First name" : "Last name")}
            </label>
            <input
              id={`review-${key}`}
              value={data[key]}
              maxLength={100}
              onChange={(e) => update(key, e.target.value)}
            />
          </div>
        ))}
      </div>
      <div className="split">
        <div className="field">
          <label htmlFor="review-house">{t("House number")}</label>
          <input
            id="review-house"
            value={data.houseNumber}
            maxLength={7}
            onChange={(e) => update("houseNumber", e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="review-street">{t("Street")}</label>
          <select
            id="review-street"
            value={data.street}
            onChange={(e) => update("street", e.target.value)}
          >
            <option value="">{t("Select your street")}</option>
            {proxyConfig.allowedStreets.map((street) => (
              <option key={street} value={street}>
                {street}
              </option>
            ))}
          </select>
        </div>
      </div>
    </>
  );
  return (
    <div className="form-shell" lang={locale}>
      <Link href={locale === "es" ? "/?lang=es" : "/"}>
        {t("← Back to overview")}
      </Link>
      <h1 className="step-title">{t("Your limited proxy")}</h1>
      {testMode && (
        <p className="preview">
          {locale === "es"
            ? "PRUEBA DE DESARROLLO · Este poder no se enviará a la Asociación."
            : "DEV TEST · This proxy will not be sent to the Association."}
        </p>
      )}
      <p className="note">
        {locale === "es"
          ? `Usted designa a ${proxyholder} para representarle y votar NO a los anexos A, B y C.`
          : `You appoint ${proxyholder} to represent you and vote NO on Exhibits A, B, and C.`}
      </p>
      {!enabled && (
        <p className="preview">
          {t(
            " Preview mode · Entries stay in this browser tab. No submission, code, or PDF is sent. ",
          )}
        </p>
      )}
      <p className="note" aria-live="polite">
        {t(" Step ")}
        {step + 1}
        {t(" of 6 · ")}
        {steps[step]}
      </p>
      <div className="progress" aria-hidden="true">
        {steps.map((s, i) => (
          <span key={s} className={i <= step ? t("active") : t("")} />
        ))}
      </div>
      <div className="form-card">
        <h2
          ref={stepHeading}
          tabIndex={-1}
          className="step-title signing-step-heading"
        >
          {steps[step]}
        </h2>
        {error && (
          <p className="error" role="alert">
            {t(error)}
          </p>
        )}
        {step === 0 && (
          <>
            <p>
              {locale === "es" ? (
                <>
                  Al completar y firmar este poder limitado, usted designa a{" "}
                  <strong>Jenny Ghetea</strong> para representar su vivienda y
                  votar <strong>NO a los Exhibits A, B y C</strong> en la
                  reunión del 6 de octubre.
                </>
              ) : (
                <>
                  By completing and signing this limited proxy, you appoint{" "}
                  <strong>Jenny Ghetea</strong> to represent your home and vote{" "}
                  <strong>NO on Exhibits A, B, and C</strong> at the October 6
                  meeting.
                </>
              )}
            </p>
            <p className="note signing-disclosure">
              {locale === "es"
                ? `Este sitio independiente es operado por ${siteOperatorName}. No es un sitio oficial de Aventura Isles Master Homeowners’ Association ni es operado por la Asociación o su empresa administradora.`
                : disclaimer}
            </p>
            <div className="field">
              <label htmlFor="houseNumber">{t("House number")}</label>
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
              <label htmlFor="street">{t("Street")}</label>
              <select
                id="street"
                value={data.street}
                onChange={(e) => update("street", e.target.value)}
              >
                <option value="">{t("Select your street")}</option>
                {proxyConfig.allowedStreets.map((s) => (
                  <option key={s} value={s}>
                    {t(s)}
                  </option>
                ))}
              </select>
            </div>
            <p className="note">
              {t(
                " We do not look up owners or access the Association’s member database. ",
              )}
            </p>
          </>
        )}
        {step === 1 && (
          <>
            <p>
              {locale === "es"
                ? "Introduzca el nombre de la persona que completa y firma este formulario. Debe estar autorizada para votar por esta propiedad."
                : "Enter the name of the person completing and signing this form. This person must be authorized to vote for this property."}
            </p>
            <div className="split">
              {(["firstName", "lastName"] as const).map((k) => (
                <div className="field" key={k}>
                  <label htmlFor={k}>
                    {k === "firstName" ? t("First name") : t("Last name")}
                  </label>
                  <input
                    id={k}
                    value={data[k]}
                    autoComplete={
                      k === "firstName" ? t("given-name") : t("family-name")
                    }
                    maxLength={100}
                    onChange={(e) => update(k, e.target.value)}
                  />
                </div>
              ))}
            </div>
            <div className="field">
              <label htmlFor="email">{t("Email address")}</label>
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
                {t(" Property ownership type (optional) ")}
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
                  <option key={s} value={s}>
                    {t(s)}
                  </option>
                ))}
              </select>
            </div>
            {entity &&
              (["entityName", "signerTitle"] as const).map((k) => (
                <div className="field" key={k}>
                  <label htmlFor={k}>
                    {k === "entityName"
                      ? t("Entity name")
                      : t("Signer title / capacity")}
                  </label>
                  <input
                    id={k}
                    value={data[k]}
                    onChange={(e) => update(k, e.target.value)}
                  />
                </div>
              ))}
            <p className="note">
              {t(
                " The Association will independently determine whether the signer is authorized to vote for this property. ",
              )}
            </p>
          </>
        )}
        {step === 2 && (
          <>
            <p>
              {t(
                " This limited proxy directs a NO vote on all three proposals. These instructions are fixed. ",
              )}
            </p>
            <p>
              {locale === "es"
                ? `Reunión del 6 de octubre de 2026. Usted designa a ${proxyholder} y le indica votar NO a los anexos A, B y C.`
                : `October 6, 2026 meeting. You appoint ${proxyholder} and instruct NO on Exhibits A, B, and C.`}
            </p>
            {proxyConfig.proposals.map((p) => (
              <div className="card" key={p.label}>
                <h3>
                  {p.label}
                  {t(" — ")}
                  {p.vote}
                </h3>
                <p className="note" lang="en">
                  {p.language}
                </p>
              </div>
            ))}
            <p>
              <Link href="/proxy-language" target="_blank">
                {t(" View the complete proxy template ")}
              </Link>
            </p>
          </>
        )}
        {step === 3 && (
          <>
            <h3>
              {locale === "es"
                ? "Revise su nombre y dirección"
                : "Review your name and address"}
            </h3>
            <p>
              {locale === "es"
                ? "Si necesita corregir algún dato, pulse el icono del lápiz y haga los cambios antes de firmar."
                : "If you need to make corrections, click the pencil icon to make the needed edits before signing."}
            </p>
            {!editingBeforeSign ? (
              detailsSummary(() => setEditingBeforeSign(true))
            ) : (
              <>
                {reviewFields}
                <button
                  type="button"
                  className="secondary"
                  onClick={() => {
                    const property = propertySchema.safeParse(data);
                    const signer = signerSchema.safeParse(data);
                    if (!property.success || !signer.success) {
                      setError(
                        !property.success
                          ? property.error.issues[0].message
                          : !signer.success
                            ? signer.error.issues[0].message
                            : "Request failed",
                      );
                      return;
                    }
                    setError("");
                    setEditingBeforeSign(false);
                  }}
                >
                  {locale === "es" ? "Guardar cambios" : "Save changes"}
                </button>
              </>
            )}
            <p>{data.email}</p>
            <label htmlFor="signature">{t("Draw your signature")}</label>
            <p className="note">
              {t(
                " Use a finger, stylus, or mouse. Typed signatures are not accepted. ",
              )}
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
                signatureImage.current = "";
                setSigned(false);
              }}
            >
              {t(" Clear signature ")}
            </button>
            <span className="sr-only" aria-live="polite">
              {signed ? t("Signature captured") : t("Signature empty")}
            </span>
            <div className="check">
              <input
                id="certified"
                type="checkbox"
                checked={certified}
                onChange={(e) => setCertified(e.target.checked)}
              />
              <label htmlFor="certified">{t(certification)}</label>
            </div>
            {enabled && (
              <Turnstile siteKey={siteKey} nonce={nonce} onToken={setToken} />
            )}
            <p className="note">
              {enabled
                ? t(
                    "Continuing submits your signature and sends an email verification code.",
                  )
                : t(
                    "This signature is a local preview and will not be saved or submitted.",
                  )}
            </p>
          </>
        )}
        {step === 4 && (
          <>
            <h3>
              {locale === "es"
                ? "Revise los datos de su poder"
                : "Review your proxy details"}
            </h3>
            {!editingReview ? (
              <>
                {detailsSummary(() => setEditingReview(true))}
                <p className="note">
                  {locale === "es"
                    ? "Pulse el lápiz para corregir su nombre o dirección. Si hace cambios, deberá firmar de nuevo antes de generar el PDF."
                    : "Click the pencil to correct your name or address. If you make changes, you will sign again before the PDF is generated."}
                </p>
              </>
            ) : (
              <>
                {reviewFields}
                <p className="note">
                  {locale === "es"
                    ? "Después de guardar los cambios, deberá firmar de nuevo y confirmar un nuevo código de correo."
                    : "After saving changes, you will sign again and confirm a new email code."}
                </p>
                <button
                  disabled={busy}
                  onClick={async () => {
                    const property = propertySchema.safeParse(data);
                    const signer = signerSchema.safeParse(data);
                    if (!property.success || !signer.success) {
                      setError(
                        !property.success
                          ? property.error.issues[0].message
                          : !signer.success
                            ? signer.error.issues[0].message
                            : "Request failed",
                      );
                      return;
                    }
                    setBusy(true);
                    try {
                      if (enabled) await call("/api/proxy/restart", {});
                      setId("");
                      setCode("");
                      setToken("");
                      setCertified(false);
                      setSigned(false);
                      signatureImage.current = "";
                      setNotice("");
                      setError("");
                      setEditingReview(false);
                      setStep(3);
                    } catch (e) {
                      setError(
                        e instanceof Error ? e.message : "Request failed",
                      );
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  {locale === "es"
                    ? "Guardar cambios y firmar de nuevo"
                    : "Save changes and sign again"}
                </button>
              </>
            )}

            {enabled ? (
              <>
                <p>
                  {locale === "es"
                    ? `Revise su correo ${data.email} e introduzca el código de seis dígitos. Caduca en 10 minutos.`
                    : `Please check ${data.email} for your six-digit code. The code expires in 10 minutes.`}
                </p>
                <div className="field">
                  <label htmlFor="code">{t("Verification code")}</label>
                  <input
                    id="code"
                    value={code}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  />
                </div>
                <p className="note">
                  {t("Didn't get your code? Check your junk or spam folder.")}
                </p>
                {notice && <p role="status">{t(notice)}</p>}
                <button
                  className="secondary"
                  disabled={busy || now < resendAt}
                  onClick={async () => {
                    setBusy(true);
                    try {
                      const result = await call("/api/proxy/resend", {});
                      setResendAt(result.nextResendAt ?? Date.now() + 120000);
                      setCode("");
                      setNotice(
                        "A new code has been requested. Use the most recent email.",
                      );
                      setError("");
                    } catch (e) {
                      setError(
                        e instanceof Error ? e.message : t("Request failed"),
                      );
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  {t("Resend code")}
                  {now < resendAt
                    ? ` (${Math.ceil((resendAt - now) / 1000)}s)`
                    : ""}
                </button>
                <p className="verification-footnote">
                  {t(
                    "Email verification confirms access to this email address. It does not establish property ownership or voting authority. The Association must independently validate the proxy.",
                  )}
                </p>
              </>
            ) : (
              <p className="preview">
                {t(
                  " No verification code was sent. Continue to preview the completion screen. ",
                )}
              </p>
            )}
            <div className="actions proxy-flow-actions">
              <button
                className="secondary"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  setError("");
                  try {
                    if (enabled) await call("/api/proxy/restart", {});
                    setId("");
                    setCode("");
                    setToken("");
                    setCertified(false);
                    setSigned(false);
                    signatureImage.current = "";
                    setNotice("");
                    setEditingReview(false);
                    setStep(3);
                  } catch (e) {
                    setError(e instanceof Error ? e.message : "Request failed");
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {t("Back to edit")}
              </button>
              <button disabled={busy || editingReview} onClick={verify}>
                {busy
                  ? t("Verifying…")
                  : enabled
                    ? t("Verify & finalize")
                    : t("Preview completion")}
              </button>
            </div>
          </>
        )}
        {step === 5 && (
          <>
            <h3>
              {enabled
                ? t("Your proxy has been finalized")
                : t("Preview complete")}
            </h3>
            <p>
              {enabled
                ? locale === "es"
                  ? `ID de envío: ${id}. Recibirá una copia por correo. La Asociación debe validar el poder.`
                  : `Submission ID: ${id}. A copy will arrive by email. Association validation is still required.`
                : t(
                    "No proxy was finalized, emailed, or delivered. Submissions remain disabled until the official template is complete and reviewed.",
                  )}
            </p>
            <p>{t(authorityNotice)}</p>
            {enabled && (
              <button
                onClick={async () => {
                  try {
                    const result = await call("/api/proxy/download", {});
                    if (result.url) window.location.assign(result.url);
                  } catch (e) {
                    setError(
                      e instanceof Error
                        ? e.message
                        : t("Download unavailable"),
                    );
                  }
                }}
              >
                {t(" Download signed proxy ")}
              </button>
            )}
            <p>
              {t(
                " Contact Jenny Ghetea directly about correcting or withdrawing a proxy you have given her. Contact does not automatically revoke a proxy. ",
              )}
              <Link href={locale === "es" ? "/contact?lang=es" : "/contact"}>
                {t("Contact information")}
              </Link>
            </p>
            <Link
              className="button secondary"
              href={locale === "es" ? "/?lang=es" : "/"}
            >
              {t(" Return to overview ")}
            </Link>
          </>
        )}
        {step < 4 && (
          <div className="actions proxy-flow-actions">
            {step > 0 && (
              <button
                className="secondary"
                disabled={busy}
                onClick={() => {
                  setError("");
                  setStep((v) => v - 1);
                }}
              >
                {t(" Back ")}
              </button>
            )}
            <button
              disabled={busy || (step === 3 && editingBeforeSign)}
              onClick={next}
            >
              {busy
                ? t("Submitting…")
                : step === 3
                  ? enabled
                    ? t("Send verification code")
                    : t("Continue preview")
                  : t("Continue")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
