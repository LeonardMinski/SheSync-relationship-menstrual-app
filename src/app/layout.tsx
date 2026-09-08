import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import "./globals.css";

// Inter for body/sans (--font-family). Playfair Display, italic, for
// editorial serif headings (--font-display) — the Relationship Experience
// V1 design set (Home, Relationship Hub, Weekly Us, etc.) restores this
// two-font pairing; see src/styles/tokens.css. Everything OTHER than the
// shared Sidebar and Vault's own content still uses this pairing — there
// is no approved Figma redesign for Home/Cycle/Coach/Connect's content,
// so their typography is untouched.
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-inter",
  display: "swap",
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["italic", "normal"],
  variable: "--font-playfair",
  display: "swap",
});

// Geist (--font-geist) and Instrument Serif Italic (--font-instrument-serif,
// loaded via the Google Fonts CSS API in the <head> below since this
// project's installed next/font/google version doesn't bundle it) are the
// EXACT fonts specified by the approved Vault Figma design — used by the
// shared Sidebar (now the canonical desktop shell, see
// src/components/layout/Sidebar.tsx) and by Vault's own content. Geist is
// loaded via Vercel's own official `geist` npm package (SIL Open Font
// License), the legitimate production-safe distribution for Next.js —
// not approximated with Inter.

export const metadata: Metadata = {
  title: "SheSync+ | Cycle-Powered Wellbeing & Intimacy",
  description:
    "The ultimate cycle-powered wellbeing, connection & intimacy app — for women and their partners.",
  keywords: [
    "menstrual cycle",
    "wellness",
    "intimacy",
    "relationships",
    "women health",
  ],
  authors: [{ name: "SheSync+ Team" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${playfairDisplay.variable} ${GeistSans.variable}`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap"
        />
      </head>
      <body className="font-sans antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
