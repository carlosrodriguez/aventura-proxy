import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sha256 } from "./crypto";
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function originCheck(req: NextRequest) {
  const expected = process.env.APP_URL;
  if (!expected || req.headers.get("origin") !== new URL(expected).origin)
    throw new HttpError(403, "Request not permitted");
  if (!req.headers.get("content-type")?.startsWith("application/json"))
    throw new HttpError(415, "JSON required");
}
export function clientIp(req: NextRequest): string {
  const header = process.env.TRUSTED_IP_HEADER;
  return header
    ? req.headers.get(header)?.split(",")[0]?.trim().slice(0, 128) || "unknown"
    : "unknown";
}
export async function jsonBody(
  req: NextRequest,
  max = 200000,
): Promise<unknown> {
  const reader = req.body?.getReader();
  if (!reader) throw new HttpError(400, "Invalid request");
  let size = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > max) {
      await reader.cancel();
      throw new HttpError(413, "Request too large");
    }
    chunks.push(value);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
  } catch {
    throw new HttpError(400, "Invalid request");
  }
}
export async function rateLimit(key: string, limit: number, seconds: number) {
  const hashed = sha256(key);
  const rows = await db().$queryRaw<
    Array<{ count: number }>
  >`INSERT INTO "RateLimit" ("key","count","resetAt") VALUES (${hashed},1,NOW()+${seconds}*INTERVAL '1 second') ON CONFLICT ("key") DO UPDATE SET "count"=CASE WHEN "RateLimit"."resetAt"<=NOW() THEN 1 ELSE "RateLimit"."count"+1 END,"resetAt"=CASE WHEN "RateLimit"."resetAt"<=NOW() THEN NOW()+${seconds}*INTERVAL '1 second' ELSE "RateLimit"."resetAt" END RETURNING "count"`;
  if (rows[0].count > limit) throw new HttpError(429, "Please try again later");
}
export function rateAllowed(count: number, limit: number) {
  return count <= limit;
}
export async function turnstile(token: string, ip: string) {
  if (!process.env.TURNSTILE_SECRET_KEY)
    throw new HttpError(503, "Verification unavailable");
  const form = new URLSearchParams({
    secret: process.env.TURNSTILE_SECRET_KEY,
    response: token,
  });
  if (ip !== "unknown") form.set("remoteip", ip);
  const res = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    { method: "POST", body: form, signal: AbortSignal.timeout(10000) },
  );
  const data = (await res.json()) as {
    success: boolean;
    hostname?: string;
    action?: string;
  };
  if (
    !data.success ||
    data.hostname !== new URL(process.env.APP_URL!).hostname ||
    data.action !== "proxy"
  )
    throw new HttpError(400, "Verification unsuccessful");
}
export function failure(error: unknown) {
  if (error instanceof HttpError)
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  return NextResponse.json(
    { error: "Request could not be completed. Please try again." },
    { status: 503 },
  );
}
export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
  maxAge: 3600,
};
