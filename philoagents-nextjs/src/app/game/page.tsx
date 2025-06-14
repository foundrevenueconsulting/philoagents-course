import { currentUser } from '@clerk/nextjs/server';
import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// Dynamically import the Phaser game component to avoid SSR issues
const PhaserGame = dynamic(() => import('@/components/game/PhaserGame'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen bg-gray-900">
      <div className="text-white text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p>Loading PhiloAgents...</p>
      </div>
    </div>
  )
});

export default async function GamePage() {
  let user = null;
  
  // Only use auth if Clerk keys are configured
  const hasClerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && 
                     process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== 'pk_test_temp';
  
  if (hasClerkKey) {
    user = await currentUser();
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
          {hasClerkKey && <UserButton afterSignOutUrl="/" />}
        </div>
      </nav>

      <div className="pt-16 h-screen">
        <PhaserGame className="w-full h-full" />
      </div>
    </div>
  );
}