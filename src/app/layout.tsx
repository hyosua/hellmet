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
      <head>
        <script dangerouslySetInnerHTML={{ __html: `try{if(localStorage.getItem('theme')==='light')document.documentElement.classList.add('light')}catch{}` }} />
      </head>
      <body className="min-h-screen bg-bg text-text font-mono antialiased">
        {children}
      </body>
    </html>
  );
}
