import type { Metadata } from "next";
import localFont from "next/font/local";
import Script from "next/script";
import { ClerkProvider } from '@clerk/nextjs';
import { clerkAppearance } from '@/lib/clerk';
import { Toaster } from "@/components/ui/toaster";
import NavigationHeader from '@/components/NavigationHeader';
import { isClerkConfigured } from '@/lib/auth';
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "BioTypes Arena - AI Experiential Training Platform",
  description: "Learn and train with AI-powered BioType agents",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const content = (
    <html lang="en">
      <head>
        {/* Humblytics Tracking Code */}
        {process.env.NEXT_PUBLIC_HUMBLYTICS_ID && (
          <Script
            src={`https://app.humblytics.com/hmbl.min.js?id=${process.env.NEXT_PUBLIC_HUMBLYTICS_ID}`}
            strategy="beforeInteractive"
          />
        )}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NavigationHeader />
        {children}
        <Toaster />
      </body>
    </html>
  );

  if (isClerkConfigured()) {
    return (
      <ClerkProvider appearance={clerkAppearance}>
        {content}
      </ClerkProvider>
    );
  }

  return content;
}
