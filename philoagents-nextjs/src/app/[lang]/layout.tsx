import type { Metadata } from "next";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/next";
import { ClerkProvider } from '@clerk/nextjs';
import { clerkAppearance } from '@/lib/clerk';
import { Toaster } from "@/components/ui/toaster";
import NavigationHeader from '@/components/NavigationHeader';
import { isClerkConfigured } from '@/lib/auth';
import { getDictionary, Locale } from '@/lib/dictionaries';
import "../globals.css";

const geistSans = localFont({
  src: "../fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "../fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

interface Props {
  children: React.ReactNode;
  params: Promise<{ lang: Locale }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  
  return {
    title: dict.meta.site_title,
    description: dict.meta.site_description,
    alternates: {
      languages: {
        'en': '/en',
        'es': '/es',
      },
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: Props) {
  const { lang } = await params;
  const dict = await getDictionary(lang);

  const content = (
    <html lang={lang}>
      <head>
        {/* Hreflang tags for SEO */}
        <link rel="alternate" hrefLang="en" href="https://philoagents.com/en" />
        <link rel="alternate" hrefLang="es" href="https://philoagents.com/es" />
        <link rel="alternate" hrefLang="x-default" href="https://philoagents.com/en" />
        
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
        <NavigationHeader dict={dict} locale={lang} />
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

export async function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'es' }];
}