import type { Metadata, Viewport } from "next";
import { Playfair_Display } from "next/font/google";
import "./globals.css";

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-display",
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
    <html lang="en" suppressHydrationWarning className={playfairDisplay.variable}>
      <body className="font-sans antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
