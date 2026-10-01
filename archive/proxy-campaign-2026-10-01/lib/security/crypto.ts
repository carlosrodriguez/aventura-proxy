import {
  createHash,
  createHmac,
  randomBytes,
  randomInt,
  timingSafeEqual,
} from "node:crypto";
export const sha256 = (value: string | Uint8Array) =>
  createHash("sha256").update(value).digest("hex");
export const randomToken = () => randomBytes(32).toString("base64url");
export const generateOtp = () =>
  randomInt(0, 1000000).toString().padStart(6, "0");
export function otpHash(
  code: string,
  scope: string,
  secret = process.env.OTP_PEPPER,
): string {
  if (!secret || secret.length < 32)
    throw new Error("OTP_PEPPER must be at least 32 characters");
  return createHmac("sha256", secret).update(`${scope}:${code}`).digest("hex");
}
export function checkOtp(
  code: string,
  scope: string,
  hash: string,
  secret?: string,
): boolean {
  const a = Buffer.from(otpHash(code, scope, secret), "hex"),
    b = Buffer.from(hash, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}
export function otpUsable(
  expiresAt: Date,
  attempts: number,
  now = new Date(),
): boolean {
  return expiresAt.getTime() > now.getTime() && attempts < 5;
}
export function transitionAllowed(from: string, to: string): boolean {
  return (
    (from === "SIGNED" && to === "VERIFIED") ||
    (from === "VERIFIED" && to === "FINALIZED")
  );
}
export function duplicateKey(house: string, street: string): string {
  return `${house.trim().toLowerCase()}|${street.trim().toLowerCase()}`;
}
