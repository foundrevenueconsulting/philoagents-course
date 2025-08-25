import type { Metadata } from "next";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/next";
import { ClerkProvider } from '@clerk/nextjs';
import { clerkAppearance } from '@/lib/clerk';
import { Toaster } from "@/components/ui/toaster";
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
          <script
            async
            src={`https://app.humblytics.com/hmbl.min.js?id=${process.env.NEXT_PUBLIC_HUMBLYTICS_ID}`}
          />
        )}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
{/* Navigation is handled in [lang] routes */}
        {children}
        <Toaster />
        <Analytics />
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
