import type { Metadata, Viewport } from "next";
import "./globals.css";

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
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
