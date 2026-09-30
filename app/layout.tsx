import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { siteOperatorName } from "@/lib/config";
export const metadata: Metadata = {
  title: "Aventura Isles · Independent Homeowner Proxy",
  description:
    "Independent homeowner-operated limited proxy website. Association validation is required.",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <a className="sr-only focus:not-sr-only" href="#main">
          Skip to content
        </a>
        <header className="container header">
          <Link className="brand" href="/">
            Aventura Isles<small>Independent homeowner initiative</small>
          </Link>
          <nav className="nav" aria-label="Main navigation">
            <Link href="/how-it-works">How it works</Link>
            <Link href="/verification">Verification</Link>
            <Link href="/contact">Contact</Link>
          </nav>
        </header>
        <main id="main">{children}</main>
        <footer className="container footer">
          <nav aria-label="Footer">
            <Link href="/how-it-works">How it works</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/verification">Security & verification</Link>
            <Link href="/proxy-language">View proxy language</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/revocation">Request revocation</Link>
          </nav>
          <p>
            Independent website operated by {siteOperatorName}. Association
            validation is required for all proxies.
          </p>
        </footer>
      </body>
    </html>
  );
}
