import "server-only";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { sha256 } from "./crypto";
import { HttpError } from "./http";
export function adminAllowed(email: string): boolean {
  return (process.env.ADMIN_EMAIL ?? "")
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean)
    .includes(email.toLowerCase());
}
export async function requireAdmin() {
  if (process.env.ENABLE_ADMIN !== "true")
    throw new HttpError(404, "Unavailable");
  const token = (await cookies()).get("admin_session")?.value;
  if (!token) throw new HttpError(401, "Access unavailable");
  const session = await db().adminSession.findUnique({
    where: { tokenHash: sha256(token) },
  });
  if (
    !session ||
    session.expiresAt <= new Date() ||
    !adminAllowed(session.email)
  )
    throw new HttpError(401, "Access unavailable");
  return session;
}
