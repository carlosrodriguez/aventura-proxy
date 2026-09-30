import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { adminAllowed } from "@/lib/security/admin";
import {
  clientIp,
  cookieOptions,
  failure,
  HttpError,
  jsonBody,
  originCheck,
  rateLimit,
} from "@/lib/security/http";
import { randomToken, sha256 } from "@/lib/security/crypto";
export async function POST(req: NextRequest) {
  try {
    if (process.env.ENABLE_ADMIN !== "true")
      throw new HttpError(404, "Unavailable");
    originCheck(req);
    await rateLimit(`admin-confirm:${clientIp(req)}`, 10, 600);
    const p = z
        .object({ token: z.string().min(40).max(128) })
        .strict()
        .safeParse(await jsonBody(req, 1024)),
      browser = req.cookies.get("admin_challenge")?.value;
    if (!p.success || !browser) throw new HttpError(401, "Access unavailable");
    const hash = sha256(`${p.data.token}:${browser}`),
      token = randomToken();
    await db().$transaction(async (tx) => {
      const c = await tx.adminChallenge.findUnique({
        where: { tokenHash: hash },
      });
      if (!c || !adminAllowed(c.email))
        throw new HttpError(401, "Access unavailable");
      const result = await tx.adminChallenge.updateMany({
        where: { id: c.id, consumedAt: null, expiresAt: { gt: new Date() } },
        data: { consumedAt: new Date() },
      });
      if (result.count !== 1) throw new HttpError(401, "Access unavailable");
      await tx.adminSession.create({
        data: {
          tokenHash: sha256(token),
          email: c.email,
          expiresAt: new Date(Date.now() + 3600000),
        },
      });
    });
    const res = NextResponse.json({ ok: true });
    res.cookies.set("admin_session", token, cookieOptions);
    res.cookies.delete("admin_challenge");
    return res;
  } catch (e) {
    return failure(e);
  }
}
export async function DELETE(req: NextRequest) {
  try {
    originCheck(req);
    const token = req.cookies.get("admin_session")?.value;
    if (token)
      await db().adminSession.deleteMany({
        where: { tokenHash: sha256(token) },
      });
    const res = NextResponse.json({ ok: true });
    res.cookies.delete("admin_session");
    return res;
  } catch (e) {
    return failure(e);
  }
}
