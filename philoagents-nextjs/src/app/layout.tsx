import type { Metadata } from "next";
import localFont from "next/font/local";
import { ClerkProvider } from '@clerk/nextjs';
import { clerkAppearance } from '@/lib/clerk';
import { Toaster } from "@/components/ui/toaster";
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
  title: "PhiloAgents - AI Philosophy Game",
  description: "Engage in philosophical conversations with AI-powered historical philosophers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const hasClerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && 
                     process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== 'pk_test_temp';

  const content = (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );

  if (hasClerkKey) {
    return (
      <ClerkProvider appearance={clerkAppearance}>
        {content}
      </ClerkProvider>
    );
  }

  return content;
}
