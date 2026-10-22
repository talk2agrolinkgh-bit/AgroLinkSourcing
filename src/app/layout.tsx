// src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

// Root layout intentionally has no header/footer/nav — the (public) route
// group adds its own chrome, and /admin has its own gated layout. Keeping
// this file to fonts + metadata means neither surface accidentally inherits
// the other's navigation.

const display = Space_Grotesk({ subsets: ["latin"], variable: "--font-display", weight: ["400", "500", "600", "700"] });
const body = Inter({ subsets: ["latin"], variable: "--font-body", weight: ["400", "500", "600", "700", "800"] });
const mono = IBM_Plex_Mono({ subsets: ["latin"], variable: "--font-mono", weight: ["400", "500"] });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://agrolinksourcing.com";
const SITE_DESCRIPTION =
  "AgroLink connects African agricultural products, producers, suppliers and global markets — through sourcing, trade and professionally coordinated farming projects.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "AgroLink — Africa Produces. AgroLink Connects.",
    template: "%s",
  },
  description: SITE_DESCRIPTION,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AgroLink",
  },
  openGraph: {
    title: "AgroLink — Africa Produces. AgroLink Connects.",
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: "AgroLink",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AgroLink — Africa Produces. AgroLink Connects.",
    description: SITE_DESCRIPTION,
  },
};

// themeColor and viewport are a separate export from `metadata` as of
// Next.js 14 — putting them inside `metadata` still works but logs a
// deprecation warning.
export const viewport: Viewport = {
  themeColor: "#1F4E2B",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="font-body">
        {children}
        <RegisterServiceWorker />
      </body>
    </html>
  );
}

// Inline, dependency-free SW registration — kept in this file rather than a
// separate client component since it's this small and only runs once.
function RegisterServiceWorker() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
              navigator.serviceWorker.register('/sw.js').catch(() => {});
            });
          }
        `,
      }}
    />
  );
}
