import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Doktor Reçete Paneli",
  description: "İlaç etkileşimlerini analiz eden doktor reçete yönetim sistemi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
