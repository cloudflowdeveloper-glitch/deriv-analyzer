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
  title: "Market Analyzer — Live Market Analysis Tool",
  description: "Real-time market analysis across Even/Odd, Differs, Over/Under, Accumulators, Multipliers, Higher/Lower, and Turbo markets.",
  keywords: ["market analyzer", "betting analysis", "even odd", "differs", "over under", "accumulators", "multipliers", "turbo", "live market"],
  authors: [{ name: "Market Analyzer" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "Market Analyzer",
    description: "Real-time market analysis across all market types",
    url: "https://chat.z.ai",
    siteName: "Market Analyzer",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Market Analyzer",
    description: "Real-time market analysis across all market types",
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
