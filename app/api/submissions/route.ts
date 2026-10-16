import { requireVerifiedEmail } from "@/lib/email-verification";
import { deferEmail } from "@/lib/email";
import { NextRequest, NextResponse } from "next/server";
import { assertEnabled, createSubmission } from "@/lib/submissions";
import {
  clientIp,
  cookieOptions,
  failure,
  jsonBody,
  originCheck,
  rateLimit,
} from "@/lib/security/http";
import { submissionSchema } from "@/lib/validation/submission";
export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  try {
    assertEnabled();
    originCheck(req);
    const ip = clientIp(req);
    await rateLimit(`create:${ip}`, 5, 3600);
    const parsed = submissionSchema.safeParse(await jsonBody(req));
    if (!parsed.success)
      return NextResponse.json(
        { error: "Check the property, signer, and signature fields" },
        { status: 400 },
      );
    const emailToken = req.cookies.get("proxy_email")?.value;
    await requireVerifiedEmail(emailToken, parsed.data.email);
    const result = await createSubmission(
      parsed.data,
      ip,
      req.headers.get("user-agent")?.slice(0, 512) ?? "unknown",
      deferEmail,
      emailToken,
    );
    const res = NextResponse.json({ id: result.id, codeSent: result.codeSent });
    res.cookies.set("proxy_access", result.token, cookieOptions);
    res.cookies.set("proxy_email", "", { ...cookieOptions, maxAge: 0 });
    return res;
  } catch (e) {
    return failure(e);
  }
}
