import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shift Scheduler SaaS",
  description: "Multi-tenant shift scheduling platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
