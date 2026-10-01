import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Community Voting", robots: { index: false, follow: false } };
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="en"><body><a href="#main" className="skip">Skip to content</a><header>Community Voting</header><main id="main">{children}</main></body></html>; }
