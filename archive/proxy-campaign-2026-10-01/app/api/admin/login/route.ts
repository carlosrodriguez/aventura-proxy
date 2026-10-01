import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { adminAllowed } from "@/lib/security/admin";
import {
  clientIp,
  failure,
  HttpError,
  jsonBody,
  originCheck,
  rateLimit,
  cookieOptions,
} from "@/lib/security/http";
import { randomToken, sha256 } from "@/lib/security/crypto";
import { transactionalEmail, deferEmail } from "@/lib/email";
export async function POST(req: NextRequest) {
  try {
    if (process.env.ENABLE_ADMIN !== "true")
      throw new HttpError(404, "Unavailable");
    originCheck(req);
    await rateLimit(`admin-login:${clientIp(req)}`, 5, 3600);
    const p = z
      .object({ email: z.email().max(254) })
      .strict()
      .safeParse(await jsonBody(req, 1024));
    if (!p.success) throw new HttpError(400, "Invalid request");
    const email = p.data.email.toLowerCase();
    await rateLimit(`admin-email:${email}`, 3, 3600);
    if (adminAllowed(email)) {
      const token = randomToken(),
        browserToken = randomToken();
      await db().adminChallenge.create({
        data: {
          email,
          tokenHash: sha256(`${token}:${browserToken}`),
          expiresAt: new Date(Date.now() + 600000),
        },
      });
      await deferEmail(async () => {
        await transactionalEmail(
          email,
          "Your administrator sign-in link",
          `${process.env.APP_URL}/admin/confirm#token=${token}\nOpen this link in the browser where you requested it. Expires in 10 minutes.`,
          `admin-${sha256(token)}`,
        );
      });
      const response = NextResponse.json({
        message: "If access is permitted, a sign-in email will arrive shortly.",
      });
      response.cookies.set("admin_challenge", browserToken, {
        ...cookieOptions,
        maxAge: 600,
      });
      return response;
    }
    return NextResponse.json({
      message: "If access is permitted, a sign-in email will arrive shortly.",
    });
  } catch (e) {
    return failure(e);
  }
}
