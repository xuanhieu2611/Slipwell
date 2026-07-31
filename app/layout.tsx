import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Slipwell — Capture what matters",
  description:
    "A private capture and attention system for recurring client work.",
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
