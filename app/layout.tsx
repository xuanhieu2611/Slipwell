import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Slipwell — Capture what matters",
  description: "Interactive Capture → Review → Today prototype for SLIP-003.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
