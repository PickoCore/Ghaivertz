import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ghaivert — Minecraft Pack Converter",
  description: "Free browser-based converter for Minecraft resource packs. Convert between ItemsAdder, Nexo, and Oraxen instantly — no server needed.",
  keywords: ["itemsadder", "nexo", "oraxen", "minecraft", "resource pack", "converter"],
  openGraph: {
    title: "Ghaivert — Minecraft Pack Converter",
    description: "Convert ItemsAdder, Nexo, and Oraxen packs for free",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      </head>
      <body className="noise-overlay">
        {children}
      </body>
    </html>
  );
}
