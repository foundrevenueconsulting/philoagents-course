import { currentUser } from '@clerk/nextjs/server';
import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import ConversationHistoryClient from './ConversationHistoryClient';

export default async function ConversationsPage() {
  let user = null;
  
  // Only use auth if Clerk keys are configured
  const hasClerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && 
                     process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== 'pk_test_temp';
  
  if (hasClerkKey) {
    user = await currentUser();
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <nav className="bg-white dark:bg-slate-800 shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-2xl font-bold text-gray-900 dark:text-white hover:text-primary">
              PhiloAgents
            </Link>
            <span className="text-gray-400">•</span>
            <span className="text-gray-600 dark:text-gray-300">Conversation History</span>
          </div>
          {hasClerkKey && <UserButton afterSignOutUrl="/" />}
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Your Philosophical Conversations
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Review your past discussions with AI philosophers and continue where you left off.
          </p>
        </div>

        <ConversationHistoryClient 
          userId={user?.id} 
          hasAuth={hasClerkKey}
        />
      </div>
    </div>
  );
}