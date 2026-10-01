import "server-only";
import { after } from "next/server";
import { Resend } from "resend";
import { submissionsEnabled, authorityNotice } from "@/lib/config";
export type EmailDispatcher = (task: () => Promise<void>) => Promise<void>;
// Keep background work in the Next.js request lifecycle.
export const deferEmail: EmailDispatcher = async (task) => {
  after(async () => {
    try {
      await task();
    } catch {
      console.error("transactional_email_background_failed");
    }
  });
};
export async function sendEmail(
  to: string,
  subject: string,
  text: string,
  key: string,
  attachment?: Uint8Array,
) {
  if (!submissionsEnabled()) throw new Error("Submissions disabled");
  await transactionalEmail(to, subject, text, key, attachment);
}
export function emailContent(text: string) {
  const body = `Aventura Isles Proxy\nIndependent website operated by SAPSLAB SERVICES LLC\n\n${text}\n\nThis message relates to a limited proxy requested at aventuraislesproxy.com for the October 6, 2026 meeting. If you did not request this, contact the site operator. This is not an official Association website.`;
  const escape = (value: string) =>
    value.replace(
      /[&<>"']/g,
      (character) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[character]!,
    );
  return {
    text: body,
    html: `<!doctype html><html lang="en"><body style="font-family:Arial,sans-serif;color:#183b3a;line-height:1.6"><main style="max-width:600px;margin:24px auto;padding:24px"><h1 style="font-size:22px">Aventura Isles Proxy</h1>${body
      .split("\n\n")
      .map((paragraph) => `<p>${escape(paragraph).replace(/\n/g, "<br>")}</p>`)
      .join("")}</main></body></html>`,
  };
}
export async function transactionalEmail(
  to: string,
  subject: string,
  text: string,
  key: string,
  attachment?: Uint8Array,
) {
  try {
    if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM)
      throw new Error("Email unavailable");
    const result = await new Resend(process.env.RESEND_API_KEY).emails.send(
      {
        from: process.env.EMAIL_FROM,
        to,
        subject:
          process.env.PROXY_TEST_MODE === "true"
            ? `[DEV TEST] ${subject}`
            : subject,
        ...emailContent(text),
        replyTo: process.env.CONTACT_EMAIL || undefined,
        attachments: attachment
          ? [
              {
                filename: "limited-proxy.pdf",
                content: Buffer.from(attachment),
              },
            ]
          : undefined,
      },
      { idempotencyKey: key },
    );
    if (result.error) throw new Error("Email delivery failed");
  } catch {
    console.error("transactional_email_send_failed");
    throw new Error("Email delivery failed");
  }
}
export function receiptText(id: string, date: Date, hash: string) {
  return `Submission ID: ${id}\nFinalized: ${date.toISOString()}\nSHA-256: ${hash}\n\n${authorityNotice}\nContact Jenny Ghetea directly about correcting or withdrawing a proxy you have given her. Contact does not automatically revoke a proxy; this website does not cancel proxies.`;
}
