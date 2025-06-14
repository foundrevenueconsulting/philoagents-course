import { currentUser } from '@clerk/nextjs/server';
import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import GameClient from './GameClient';

export default async function GamePage() {
  // Only use auth if Clerk keys are configured
  const hasClerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && 
                     process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== 'pk_test_temp';
  
  if (hasClerkKey) {
    await currentUser(); // Load user for auth context, but don't store locally since it's unused
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <nav className="bg-black/50 backdrop-blur-sm absolute top-0 left-0 right-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link 
            href="/dashboard"
            className="text-white hover:text-gray-300 transition-colors"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-xl font-bold text-white">
            PhiloAgents Game
          </h1>
          {hasClerkKey && <UserButton />}
        </div>
      </nav>

      <GameClient />
    </div>
  );
}