import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { SessionProviderWrapper } from "@/components/session-provider";
import { ThemeProvider } from "next-themes";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Euro Voice — Radio online multi-emisora 24/7",
  description: "Sintoniza emisoras en vivo y escucha música en distintos idiomas, 24/7, cuando quieras y donde quieras.",
  keywords: ["radio online", "radio 24/7", "emisoras", "streaming", "música", "euro voice"],
  authors: [{ name: "Euro Voice" }],
  openGraph: {
    title: "Euro Voice",
    description: "Radio online multi-emisora 24/7",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Euro Voice",
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
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange={false}
        >
          <SessionProviderWrapper>{children}</SessionProviderWrapper>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
