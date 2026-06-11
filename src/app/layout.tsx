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
  title: "TradingView Analyzer — Real-time Trading Analysis Tool",
  description: "Professional trading analysis tool powered by TradingView. Analyze Even/Odd, Differs, Over/Under, Multipliers, Higher/Lower, and Turbo markets across crypto, forex, stocks, and indices.",
  keywords: ["trading analysis", "tradingview", "crypto analysis", "forex analysis", "even odd", "differs", "over under", "multipliers", "turbo", "technical analysis", "market analysis"],
  authors: [{ name: "Market Analyzer" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "TradingView Analyzer",
    description: "Professional trading analysis powered by TradingView",
    url: "https://chat.z.ai",
    siteName: "TradingView Analyzer",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TradingView Analyzer",
    description: "Professional trading analysis powered by TradingView",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
