import type { Metadata } from "next";
import { Inter, Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";
import { AppLayout } from "@/components/layout/AppLayout";
import { Providers } from "@/components/Providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const devanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  weight: ["400", "500", "700"],
  variable: "--font-devanagari",
});

export const metadata: Metadata = {
  title: "Contentsathi — India's AI Content Partner for Real Estate",
  description: "Roz Dikhte Raho. Baaki Hum Sambhalenge. ContentSathi generates, schedules and publishes content in 10 Indian languages for real estate solopreneurs.",
  keywords: [
    "AI content creator India",
    "Marathi content creator",
    "real estate social media posts",
    "Hindi content generator",
    "Hinglish posts",
    "social media scheduler India",
    "real estate content Nagpur",
    "Contentsathi"
  ],
  authors: [{ name: "Contentsathi" }],
  openGraph: {
    title: "Contentsathi — India's AI Content Partner for Real Estate",
    description: "Roz Dikhte Raho. Baaki Hum Sambhalenge. ContentSathi generates, schedules and publishes content in 10 Indian languages for real estate solopreneurs.",
    siteName: "Contentsathi",
    images: ["/og-image.png"],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contentsathi — India's AI Content Partner for Real Estate",
    description: "Roz Dikhte Raho. Baaki Hum Sambhalenge. ContentSathi generates, schedules and publishes content in 10 Indian languages for real estate solopreneurs.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/icon-192.png",
  }
};

import { Toaster } from 'react-hot-toast';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${devanagari.variable}`}>
      <body className={inter.className}>
        <Providers>
          <AppLayout>{children}</AppLayout>
        </Providers>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}

