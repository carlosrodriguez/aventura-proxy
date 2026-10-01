import { deferEmail } from "@/lib/email";
import { NextRequest, NextResponse } from "next/server";
import {
  assertEnabled,
  authenticateSubmission,
  event,
  resendOtp,
  restartSubmission,
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
  cookieOptions,
} from "@/lib/security/http";
import { verifySchema } from "@/lib/validation/submission";
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
      return NextResponse.json({
        ok: true,
        ...(await resendOtp(s.id, deferEmail)),
      });
    }
    if (action === "restart") {
      await restartSubmission(s.id);
      const response = NextResponse.json({ ok: true });
      response.cookies.set("proxy_access", "", { ...cookieOptions, maxAge: 0 });
      return response;
    }
    if (action === "finalize")
      return NextResponse.json(await finalizeSubmission(s.id, deferEmail));
    if (action === "download") {
      if (s.status !== "FINALIZED" || !s.finalPdfRef)
        throw new HttpError(409, "Proxy not finalized");
      await event(s.id, "SIGNER_DOWNLOAD", {});
      return NextResponse.json({ url: await temporaryUrl(s.finalPdfRef) });
    }
    throw new HttpError(404, "Unavailable");
  } catch (e) {
    return failure(e);
  }
}
