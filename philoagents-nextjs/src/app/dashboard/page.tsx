import { currentUser } from '@clerk/nextjs/server';
import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';

export default async function Dashboard() {
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            The Great Game of Life
          </h1>
          {hasClerkKey && <UserButton afterSignOutUrl="/" />}
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back{user?.firstName ? `, ${user.firstName}` : ''}!
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Ready to continue your philosophical journey?
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link
            href="/game"
            className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow hover:shadow-lg transition-shadow border border-gray-200 dark:border-slate-700"
          >
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
              🎮 Enter Game World
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Join the interactive philosophy world and chat with AI philosophers.
            </p>
          </Link>

          <Link
            href="/discussions"
            className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow hover:shadow-lg transition-shadow border border-gray-200 dark:border-slate-700 ring-2 ring-blue-500/20"
          >
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
              🗣️ Multi-Way Discussions
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Watch AI agents debate and collaborate in real-time conversations.
            </p>
            <div className="mt-2 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
              NEW FEATURE
            </div>
          </Link>

          <Link
            href="/dashboard/conversations"
            className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow hover:shadow-lg transition-shadow border border-gray-200 dark:border-slate-700"
          >
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
              💬 Conversation History
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Review your past philosophical discussions and insights.
            </p>
          </Link>

          <Link
            href="/profile"
            className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow hover:shadow-lg transition-shadow border border-gray-200 dark:border-slate-700"
          >
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
              👤 Profile & Settings
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Manage your profile, subscription, and preferences.
            </p>
          </Link>
        </div>

        <div className="mt-12 bg-white dark:bg-slate-800 p-6 rounded-lg shadow border border-gray-200 dark:border-slate-700">
          <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Quick Start Guide
          </h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full text-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                1
              </span>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Enter the Game World</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Click &quot;Enter Game World&quot; to join the interactive philosophy environment.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full text-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                2
              </span>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Choose Your Philosopher</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Walk up to any philosopher in the world to start a conversation.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full text-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                3
              </span>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Engage in Deep Discussion</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Ask questions about consciousness, ethics, reality, and existence.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}