import { currentUser } from '@clerk/nextjs/server';
import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';

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

      <div className="pt-16 h-screen flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-4xl font-bold mb-4">Game Coming Soon</h2>
          <p className="text-gray-300 mb-8 max-w-md">
            Welcome{user?.firstName ? ` ${user.firstName}` : ''}! The Phaser.js game integration is currently in development. 
            This page will soon house the full interactive philosophy world.
          </p>
          
          <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg border border-white/20">
            <h3 className="text-xl font-semibold mb-4">What&apos;s Coming:</h3>
            <ul className="text-left space-y-2 text-gray-300">
              <li>• Interactive 2D world with multiple philosophers</li>
              <li>• Real-time AI conversations</li>
              <li>• Multiplayer support with other users</li>
              <li>• Persistent conversation history</li>
              <li>• Character customization</li>
            </ul>
          </div>

          <Link
            href="/dashboard"
            className="mt-8 inline-block bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}