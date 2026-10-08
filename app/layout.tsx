import { getLocale } from "@/lib/i18n/locale";
import { LanguageSelect } from "@/components/language-select";
import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { siteOperatorName } from "@/lib/config";
export const metadata: Metadata = {
  title: "Aventura Isles · Independent Homeowner Proxy",
  description:
    "Independent homeowner-operated limited proxy website. Association validation is required.",
  robots: { index: false, follow: false, nosnippet: true },
};
export const dynamic = "force-dynamic";
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const es = locale === "es";
  const closed = process.env.SITE_STATE === "closed";
  if (closed) {
    return (
      <html lang="en">
        <body style={{ margin: 0, background: "#fff", color: "#222" }}>
          <main
            style={{
              minHeight: "100dvh",
              display: "grid",
              placeItems: "center",
            }}
          >
            <p style={{ margin: 0, fontSize: "1.125rem" }}>Thank you.</p>
          </main>
        </body>
      </html>
    );
  }
  return (
    <html lang={locale}>
      <body>
        <a className="sr-only focus:not-sr-only" href="#main">
          {es ? "Ir al contenido" : "Skip to content"}
        </a>
        <header className="container header">
          <Link className="brand" href="/">
            Aventura Isles
            <small>
              {es
                ? "Iniciativa independiente de propietarios"
                : "Independent homeowner initiative"}
            </small>
          </Link>
          {!closed && (
            <nav
              className="nav"
              aria-label={es ? "Navegación principal" : "Main navigation"}
            >
              <Link className="header-proxy-link" href="/sign">
                {es ? "Completar poder NO" : "Complete NO proxy"}
              </Link>
              <Link href="/verification">
                {es ? "Cómo protegemos su poder" : "How we protect your proxy"}
              </Link>
              <Link href="/contact">{es ? "Contacto" : "Contact"}</Link>
            </nav>
          )}
          <LanguageSelect locale={locale} />
        </header>
        <main id="main">{children}</main>
        <footer className="container footer">
          {!closed && (
            <nav aria-label={es ? "Pie de página" : "Footer"}>
              <Link href="/privacy">{es ? "Privacidad" : "Privacy"}</Link>
              <Link href="/verification">
                {es ? "Cómo protegemos su poder" : "How we protect your proxy"}
              </Link>
              <Link href="/proxy-language">
                {es ? "Ver el texto del poder" : "View proxy language"}
              </Link>
              <Link href="/contact">{es ? "Contacto" : "Contact"}</Link>
            </nav>
          )}
          <p>
            {es
              ? `Sitio independiente operado por ${siteOperatorName}. Todos los poderes requieren validación por parte de la Asociación.`
              : `Independent website operated by ${siteOperatorName}. Association validation is required for all proxies.`}
          </p>
        </footer>
      </body>
    </html>
  );
}
