import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ridulian.md",
  description: "Markdown-Driven Lore & World-Building Engine",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body>
        {children}
      </body>
    </html>
  );
}
