import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Inter, exclusively, across all weights — see src/styles/tokens.css, which
// points both --font-family (body) and --font-display (headings) at this
// same loaded font. Previously headings used Playfair Display (a serif);
// the SheSync Cycle design system replaces that with Inter everywhere.
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-inter",
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
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className="font-sans antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
