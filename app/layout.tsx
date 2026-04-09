import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Client Onboarding Extractor",
  description: "Prototype AI assistant for business onboarding preparation."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
