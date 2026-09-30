import { deferEmail } from "@/lib/email";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  assertEnabled,
  authenticateSubmission,
  event,
  resendOtp,
  verifySubmission,
  finalizeSubmission,
} from "@/lib/submissions";
import {
  clientIp,
  failure,
  HttpError,
  jsonBody,
  originCheck,
  rateLimit,
} from "@/lib/security/http";
import { verifySchema } from "@/lib/validation/submission";
import { db } from "@/lib/db";
import { temporaryUrl } from "@/lib/storage";
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ action: string }> },
) {
  try {
    assertEnabled();
    originCheck(req);
    const s = await authenticateSubmission(
        req.cookies.get("proxy_access")?.value,
      ),
      { action } = await ctx.params;
    await rateLimit(`proxy-ip:${clientIp(req)}`, 40, 600);
    await rateLimit(`proxy:${s.id}`, 20, 600);
    if (action === "verify") {
      const parsed = verifySchema.safeParse(await jsonBody(req, 1024));
      if (!parsed.success)
        throw new HttpError(400, "Code could not be verified");
      return NextResponse.json(
        await verifySubmission(s.id, parsed.data.code, deferEmail),
      );
    }
    if (action === "resend") {
      await rateLimit(`resend:${s.id}`, 5, 3600);
      await resendOtp(s.id, deferEmail);
      return NextResponse.json({ ok: true });
    }
    if (action === "finalize")
      return NextResponse.json(await finalizeSubmission(s.id, deferEmail));
    if (action === "download") {
      if (s.status !== "FINALIZED" || !s.finalPdfRef)
        throw new HttpError(409, "Proxy not finalized");
      await event(s.id, "SIGNER_DOWNLOAD", {});
      return NextResponse.json({ url: await temporaryUrl(s.finalPdfRef) });
    }
    if (action === "revocation") {
      const p = z
        .object({ reason: z.string().trim().min(1).max(1000) })
        .strict()
        .safeParse(await jsonBody(req, 4096));
      if (!p.success) throw new HttpError(400, "Provide a request reason");
      await db().$transaction([
        db().proxySubmission.update({
          where: { id: s.id },
          data: { revocationRequestedAt: new Date() },
        }),
        db().auditEvent.create({
          data: {
            submissionId: s.id,
            eventType: "REVOCATION_REQUESTED",
            metadata: { reason: p.data.reason },
          },
        }),
      ]);
      return NextResponse.json({
        message:
          "Request recorded. Contact the Association to learn the required revocation procedure. This request does not itself legally revoke a proxy.",
      });
    }
    throw new HttpError(404, "Unavailable");
  } catch (e) {
    return failure(e);
  }
}
