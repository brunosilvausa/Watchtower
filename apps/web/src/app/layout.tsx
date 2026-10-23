import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Watchtower — Private beta",
  description: "Conheça a proposta do Watchtower para acompanhar seus sites e APIs. Beta privada por convite.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className="dark h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
