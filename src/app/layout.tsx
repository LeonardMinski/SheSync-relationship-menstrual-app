import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

// Inter for body/sans (--font-family). Playfair Display, italic, for
// editorial serif headings (--font-display) — the Relationship Experience
// V1 design set (Home, Relationship Hub, Weekly Us, etc.) restores this
// two-font pairing; see src/styles/tokens.css.
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
      className={`${inter.variable} ${playfairDisplay.variable}`}
    >
      <body className="font-sans antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
