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
  const footer =
    "This message relates to a limited proxy requested at aventuraislesproxy.com for the November 17, 2026 meeting. If you did not request this, contact the site operator. This is not an official Association website. Independent website operated by SAPSLAB SERVICES LLC.";
  const body = `${text}\n\n${footer}`;
  const verification = text.match(/^Your verification code is (\d{6})\./);
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
  const paragraphs = (value: string) =>
    value
      .split("\n\n")
      .map((paragraph) => `<p>${escape(paragraph).replace(/\n/g, "<br>")}</p>`)
      .join("");
  const content = verification
    ? `<p style="margin:0 0 8px">Your verification code</p><p style="font-size:36px;font-weight:700;line-height:1.3;margin:0 0 24px">${verification[1]}</p>${paragraphs(text.slice(verification[0].length).trim())}`
    : paragraphs(text);
  return {
    text: body,
    html: `<!doctype html><html lang="en"><body style="font-family:Arial,sans-serif;color:#183b3a;line-height:1.6"><div style="display:none;max-height:0;overflow:hidden;mso-hide:all">${escape(text.split(". ")[0])}.</div><main style="max-width:600px;margin:24px auto;padding:24px">${content}<p style="font-size:12px;line-height:1.5;color:#65736e;margin-top:32px">${escape(footer)}</p></main></body></html>`,
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
