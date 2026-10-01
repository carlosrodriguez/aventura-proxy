import { NextRequest, NextResponse } from "next/server";
export function proxy(req: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64"),
    dev = process.env.NODE_ENV !== "production";
  const localPreview = /^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/.test(
    req.headers.get("host") ?? "",
  );
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://challenges.cloudflare.com ${dev ? "'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self' https://challenges.cloudflare.com " +
      (dev ? "ws: wss:" : ""),
    "frame-src 'self' blob: https://challenges.cloudflare.com",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'self'",
    ...(dev || localPreview ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
  const headers = new Headers(req.headers);
  const requestedLanguage = req.nextUrl.searchParams.get("lang");
  const language =
    requestedLanguage === "en" || requestedLanguage === "es"
      ? requestedLanguage
      : req.cookies.get("site-language")?.value === "es"
        ? "es"
        : "en";
  headers.set("x-site-language", language);
  headers.set("x-nonce", nonce);
  headers.set("Content-Security-Policy", csp);
  const path = req.nextUrl.pathname;
  const closed = process.env.SITE_STATE === "closed";
  const operational =
    path === "/api/health" ||
    path.startsWith("/admin") ||
    path.startsWith("/api/admin/") ||
    path === "/robots.txt" ||
    path === "/closed";
  const destination = new URL(
    req.nextUrl.pathname + req.nextUrl.search,
    process.env.APP_URL || req.url,
  );
  destination.pathname = "/closed";
  const res =
    closed && !operational
      ? path.startsWith("/api/")
        ? NextResponse.json(
            { error: "Proxy collection is closed" },
            { status: 503 },
          )
        : NextResponse.redirect(destination)
      : NextResponse.next({ request: { headers } });
  if (requestedLanguage === "en" || requestedLanguage === "es") {
    res.cookies.set("site-language", language, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: !dev && !localPreview,
      maxAge: 60 * 60 * 24 * 180,
    });
  }
  res.headers.set("Content-Security-Policy", csp);
  res.headers.set("Cache-Control", "no-store, max-age=0");
  return res;
}
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
