import { Suspense } from 'react';
import { getDictionary, Locale } from '@/lib/dictionaries';
import { DiscussionsContent } from '@/components/discussions/DiscussionsContent';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ lang: Locale }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  
  return {
    title: dict.meta.discussions.title,
    description: dict.meta.discussions.description,
    alternates: {
      languages: {
        'en': '/en/discussions',
        'es': '/es/discussions',
      },
    },
  };
}

export default async function DiscussionsPage({ params }: Props) {
  const { lang } = await params;
  const dict = await getDictionary(lang);

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderBottomColor: '#B8623F' }}></div>
          <p className="text-gray-600 dark:text-gray-300">{dict.discussions.loading_discussions}</p>
        </div>
      </div>
    }>
      <DiscussionsContent dict={dict} locale={lang} />
    </Suspense>
  );
}

export async function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'es' }];
}