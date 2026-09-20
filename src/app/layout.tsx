import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { SessionProviderWrapper } from "@/components/session-provider";
import { ThemeProvider } from "next-themes";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Euro Voice — Radio online multi-emisora 24/7",
  description: "Sintoniza emisoras en vivo y escucha música en distintos idiomas, 24/7, cuando quieras y donde quieras.",
  keywords: ["radio online", "radio 24/7", "emisoras", "streaming", "música", "euro voice"],
  authors: [{ name: "Euro Voice" }],
  openGraph: { title: "Euro Voice", description: "Radio online multi-emisora 24/7", type: "website" },
  twitter: { card: "summary_large_image", title: "Euro Voice", description: "Radio online multi-emisora 24/7" },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180' },
    ],
  },
};

const googleTranslateInit = `
  function googleTranslateElementInit() {
    new google.translate.TranslateElement({
      pageLanguage: 'es',
      includedLanguages: 'en,fr,de,it,pt,lv,pl,lt,et,ru,uk,nl,sv,no,da,fi,cs,tr,ar,zh-CN,ja,ko,hi,es',
      layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
      autoDisplay: false,
    }, 'google_translate_element');
  }
`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: googleTranslateInit }} />
        <script src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit" async />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}>
        <div id="google_translate_element" style={{ display: 'none' }} />
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange={false}>
          <SessionProviderWrapper>{children}</SessionProviderWrapper>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
