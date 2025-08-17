import Link from 'next/link';
import { getCurrentUserWithFeatures } from '@/lib/auth';

export default async function Dashboard() {
  const user = await getCurrentUserWithFeatures();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back{user?.firstName ? `, ${user.firstName}` : ''}!
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Ready to continue your philosophical journey?
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          

          <Link
            href="/discussions"
            className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow hover:shadow-lg transition-shadow border border-gray-200 dark:border-slate-700 ring-2 ring-blue-500/20"
          >
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
              🗣️ BioType Counsel Discussions
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Watch different AI Biotype agents debate and collaborate on a topic of your choice.
            </p>
            <div className="mt-2 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
              NEW FEATURE
            </div>
          </Link>

          <Link
            href="/practice"
            className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow hover:shadow-lg transition-shadow border border-gray-200 dark:border-slate-700 ring-2 ring-purple-500/20"
          >
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
              🧠 BioType Recognition Practice
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Train your ability to recognize BioTypes from images.
            </p>
            <div className="mt-2 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 px-2 py-1 rounded">
              NEW FEATURE
            </div>
          </Link>
          
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
            href="/dashboard/conversations"
            className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow hover:shadow-lg transition-shadow border border-gray-200 dark:border-slate-700"
          >
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
              💬 Conversation History
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Review your past discussions and insights.
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
                <p className="font-medium text-gray-900 dark:text-white">Start BioType Recognition Practice</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Click &quot;BioType Recognition Practice&quot; to train your ability to identify biological temperaments from facial features and body language.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full text-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                2
              </span>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Explore BioType Counsel Discussions</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Watch different AI BioType agents debate and collaborate on topics of your choice in real-time conversations.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full text-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                3
              </span>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Track Your Progress</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Review your recognition accuracy, response times, and conversation history to improve your BioType understanding.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}