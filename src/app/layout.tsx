import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Neón Radio — Radio online multi-emisora 24/7",
  description: "Plataforma de radio online con múltiples emisoras transmitiendo música en distintos idiomas, 24/7. Administra tus propias emisoras y playlists.",
  keywords: ["radio online", "radio 24/7", "emisoras", "streaming", "música", "neón radio"],
  authors: [{ name: "Neón Radio" }],
  openGraph: {
    title: "Neón Radio",
    description: "Radio online multi-emisora 24/7",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Neón Radio",
    description: "Radio online multi-emisora 24/7",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
