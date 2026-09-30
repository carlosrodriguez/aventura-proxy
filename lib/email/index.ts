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
        to: process.env.EMAIL_RECIPIENT_OVERRIDE || to,
        subject: process.env.PROXY_TEST_MODE === "true" ? `[DEV TEST] ${subject}` : subject,
        text,
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
  return `Submission ID: ${id}\nFinalized: ${date.toISOString()}\nSHA-256: ${hash}\n\n${authorityNotice}\nContact the site operator for correction or revocation-request instructions. A request to this website does not itself legally revoke a proxy.`;
}
