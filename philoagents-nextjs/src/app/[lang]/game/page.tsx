import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import GameClient from './GameClient';
import { getCurrentUserWithFeatures, isClerkConfigured } from '@/lib/auth';
import { getDictionary, Locale } from '@/lib/dictionaries';

interface Props {
  params: Promise<{ lang: Locale }>;
}

export default async function GamePage({ params }: Props) {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  
  // Load user for auth context if configured
  if (isClerkConfigured()) {
    await getCurrentUserWithFeatures();
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <nav className="bg-black/50 backdrop-blur-sm absolute top-0 left-0 right-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link 
            href={`/${lang}/dashboard`}
            className="text-white hover:text-gray-300 transition-colors"
          >
            {dict.game.back_to_dashboard}
          </Link>
          <h1 className="text-xl font-bold text-white">
            {dict.game.title}
          </h1>
          {isClerkConfigured() && <UserButton />}
        </div>
      </nav>

      <GameClient dict={dict} />
    </div>
  );
}