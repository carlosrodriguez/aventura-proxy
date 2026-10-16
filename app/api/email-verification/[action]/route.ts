import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertEnabled } from "@/lib/submissions";
import { deferEmail } from "@/lib/email";
import {
  startEmailVerification,
  verifyEmailSession,
  resendEmailVerification,
} from "@/lib/email-verification";
import {
  clientIp,
  cookieOptions,
  failure,
  HttpError,
  jsonBody,
  originCheck,
  rateLimit,
  turnstile,
} from "@/lib/security/http";
import { verifySchema } from "@/lib/validation/submission";
const startSchema = z
  .object({
    email: z
      .email()
      .max(254)
      .transform((v) => v.toLowerCase()),
    turnstileToken: z.string().min(1).max(4096),
  })
  .strict();
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ action: string }> },
) {
  try {
    assertEnabled();
    originCheck(req);
    const { action } = await ctx.params,
      ip = clientIp(req),
      token = req.cookies.get("proxy_email")?.value;
    await rateLimit(`email-session-ip:${ip}`, 40, 600);
    if (action === "start") {
      const parsed = startSchema.safeParse(await jsonBody(req, 8192));
      if (!parsed.success) throw new HttpError(400, "Check your email address");
      await rateLimit(`email-start-ip:${ip}`, 5, 3600);
      await rateLimit(`email-start-address:${parsed.data.email}`, 5, 3600);
      await turnstile(parsed.data.turnstileToken, ip);
      const result = await startEmailVerification(
        parsed.data.email,
        deferEmail,
      );
      const res = NextResponse.json({
        ok: true,
        nextResendAt: result.nextResendAt,
      });
      res.cookies.set("proxy_email", result.token, cookieOptions);
      return res;
    }
    if (!token) throw new HttpError(401, "Verify your email before signing");
    await rateLimit(`email-session:${token}`, 20, 600);
    if (action === "verify") {
      const parsed = verifySchema.safeParse(await jsonBody(req, 1024));
      if (!parsed.success)
        throw new HttpError(400, "Code could not be verified");
      return NextResponse.json(
        await verifyEmailSession(token, parsed.data.code),
      );
    }
    if (action === "resend") {
      await rateLimit(`email-resend:${token}`, 5, 3600);
      return NextResponse.json(
        await resendEmailVerification(token, deferEmail),
      );
    }
    throw new HttpError(404, "Unavailable");
  } catch (e) {
    return failure(e);
  }
}
