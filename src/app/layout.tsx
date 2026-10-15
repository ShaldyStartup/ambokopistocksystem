import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: { default: "Ambo Coffee — Persediaan", template: "%s | Ambo Coffee" },
  description: "Pencatatan dan pemantauan persediaan Ambo Coffee.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
