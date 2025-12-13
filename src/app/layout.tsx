import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { SimpleToastContainer } from "@/components/ui/simple-toast";
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import PageTransition from "@/components/page-transition";

// Meta bilgileri
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: "ButcApp - Kişisel Muhasebe ve Finans Yönetimi",
  description: "ButcApp ile nakit, birikim ve banka hesaplarınızı tek yerden yönetin. Ücretsiz, güvenli ve modern kişisel finans uygulaması. Bütçe takibi, yatırım analizi ve daha fazlası.",
  keywords: ["ButcApp", "kişisel finans", "muhasebe", "bütçe", "finans yönetimi", "para takibi", "yatırım", "birikim", "banka hesabı", "nakit takibi"],
  authors: [{ name: "ButcApp Team" }],
  creator: "ButcApp",
  publisher: "ButcApp",
  category: "finance",
  classification: "Personal Finance Management",
  referrer: "origin-when-cross-origin",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon-16x16.png",
    apple: "/favicon.png",
  },
  openGraph: {
    title: "ButcApp - Modern Kişisel Finans Yönetimi",
    description: "Ücretsiz kişisel finans uygulaması. Nakit, birikim ve banka hesaplarınızı tek yerden yönetin. Bütçe takibi, yatırım analizi ve daha fazlası.",
    url: "https://butcapp.com",
    siteName: "ButcApp",
    type: "website",
    locale: "tr_TR",
    images: [
      {
        url: "https://butcapp.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "ButcApp - Kişisel Finans Yönetimi"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "ButcApp - Modern Kişisel Finans Yönetimi",
    description: "Ücretsiz kişisel finans uygulaması. Nakit, birikim ve banka hesaplarınızı tek yerden yönetin.",
    images: ["https://butcapp.com/og-image.png"],
    creator: "@butcap",
    site: "@butcap"
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'google-site-verification-code-here',
    yandex: 'yandex-verification-code-here',
    yahoo: 'yahoo-site-verification-code-here'
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body
        className="antialiased bg-background text-foreground"
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange={false}
          transitionDuration={300}
        >
          <AuthProvider>
            <LanguageProvider>
              <PageTransition>
                {children}
              </PageTransition>
              <Toaster />
              <SimpleToastContainer />
            </LanguageProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}