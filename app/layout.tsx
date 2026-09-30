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
          <nav
            className="nav"
            aria-label={es ? "Navegación principal" : "Main navigation"}
          >
            <Link className="header-proxy-link" href="/sign">
              {es ? "Completar poder NO" : "Complete NO proxy"}
            </Link>
            <Link href="/how-it-works">
              {es ? "Cómo funciona" : "How it works"}
            </Link>
            <Link href="/verification">
              {es ? "Verificación" : "Verification"}
            </Link>
            <Link href="/contact">{es ? "Contacto" : "Contact"}</Link>
          </nav>
          <LanguageSelect locale={locale} />
        </header>
        <main id="main">{children}</main>
        <footer className="container footer">
          <nav aria-label={es ? "Pie de página" : "Footer"}>
            <Link href="/how-it-works">
              {es ? "Cómo funciona" : "How it works"}
            </Link>
            <Link href="/privacy">{es ? "Privacidad" : "Privacy"}</Link>
            <Link href="/verification">
              {es ? "Seguridad y verificación" : "Security & verification"}
            </Link>
            <Link href="/proxy-language">
              {es ? "Ver el texto del poder" : "View proxy language"}
            </Link>
            <Link href="/contact">{es ? "Contacto" : "Contact"}</Link>
          </nav>
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
