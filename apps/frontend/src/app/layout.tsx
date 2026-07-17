import type { Metadata } from "next";
import {Caveat, Plus_Jakarta_Sans, Outfit, Geist } from "next/font/google";

import { Toaster } from "sonner";
import AppShell from "@/components/AppShell";
import GlobalAuthHandler from "@/components/GlobalAuthHandler";
import { SocketInitializer } from "@/components/SocketInitializer";

import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta",
});

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-outfit",
});

const caveat = Caveat({
    subsets: ["latin"],
    variable: "--font-caveat",
});

export const metadata: Metadata = {
  title: "Samadhan",
  description: "Support System Dashboard",
  icons: {
    icon: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", plusJakarta.variable, outfit.variable, caveat.variable, "font-sans", geist.variable)}
    >
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Outfit:wght@500;600;700&display=swap" rel="stylesheet"/>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
      </head>
      <body className="h-full">
        <Toaster position="bottom-right" richColors/>
        <GlobalAuthHandler />
        <SocketInitializer />
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
