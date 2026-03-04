import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hellmet",
  description: "Transform coding intentions into OWASP-hardened prompts",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-[--color-bg] text-[--color-text] font-mono antialiased">
        {children}
      </body>
    </html>
  );
}
