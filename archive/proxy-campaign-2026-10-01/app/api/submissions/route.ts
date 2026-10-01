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
  turnstile,
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
    await turnstile(parsed.data.turnstileToken, ip);
    const result = await createSubmission(
      parsed.data,
      ip,
      req.headers.get("user-agent")?.slice(0, 512) ?? "unknown",
      deferEmail,
    );
    const res = NextResponse.json({ id: result.id, codeSent: result.codeSent });
    res.cookies.set("proxy_access", result.token, cookieOptions);
    return res;
  } catch (e) {
    return failure(e);
  }
}
