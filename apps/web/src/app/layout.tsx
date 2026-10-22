import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Watchtower — Private beta",
  description: "Your systems. One command center.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
