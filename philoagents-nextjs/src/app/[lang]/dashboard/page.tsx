import Link from 'next/link';
import { getCurrentUserWithFeatures } from '@/lib/auth';

export default async function Dashboard() {
  const user = await getCurrentUserWithFeatures();

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            🧠 Welcome back{user?.firstName ? `, ${user.firstName}` : ''}!
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Ready to continue your BioType training journey? Choose your next learning adventure.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          

          <Link
            href="/discussions"
            className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 border-l-4"
            style={{ borderLeftColor: '#B8623F' }}
          >
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
              🗣️ BioType Counsel Discussions
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Watch different AI Biotype agents debate and collaborate on a topic of your choice.
            </p>
            <div className="mt-3 text-xs font-semibold px-3 py-1 rounded-full" style={{ backgroundColor: '#B8623F', color: 'white' }}>
              NEW FEATURE
            </div>
          </Link>

          <Link
            href="/practice"
            className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 border-l-4"
            style={{ borderLeftColor: '#B8623F' }}
          >
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
              🧠 BioType Recognition Practice
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Train your ability to recognize BioTypes from images.
            </p>
            <div className="mt-3 text-xs font-semibold px-3 py-1 rounded-full" style={{ backgroundColor: '#B8623F', color: 'white' }}>
              NEW FEATURE
            </div>
          </Link>
          
          <Link
            href="/game"
            className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 border-l-4"
            style={{ borderLeftColor: '#B8623F' }}
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
            className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 border-l-4"
            style={{ borderLeftColor: '#B8623F' }}
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
            className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 border-l-4"
            style={{ borderLeftColor: '#B8623F' }}
          >
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
              👤 Profile & Settings
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Manage your profile, subscription, and preferences.
            </p>
          </Link>
        </div>

        <div className="mt-16 bg-white dark:bg-slate-800 p-8 rounded-xl shadow-xl border-t-4" style={{ borderTopColor: '#B8623F' }}>
          <h3 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white text-center">
            🚀 Quick Start Guide
          </h3>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <span className="w-8 h-8 rounded-full text-white font-semibold flex items-center justify-center flex-shrink-0 mt-1" style={{ backgroundColor: '#B8623F' }}>
                1
              </span>
              <div>
                <p className="font-semibold text-lg text-gray-900 dark:text-white">Start BioType Recognition Practice</p>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  Click &quot;BioType Recognition Practice&quot; to train your ability to identify biological temperaments from facial features and body language.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <span className="w-8 h-8 rounded-full text-white font-semibold flex items-center justify-center flex-shrink-0 mt-1" style={{ backgroundColor: '#B8623F' }}>
                2
              </span>
              <div>
                <p className="font-semibold text-lg text-gray-900 dark:text-white">Explore BioType Counsel Discussions</p>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  Watch different AI BioType agents debate and collaborate on topics of your choice in real-time conversations.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <span className="w-8 h-8 rounded-full text-white font-semibold flex items-center justify-center flex-shrink-0 mt-1" style={{ backgroundColor: '#B8623F' }}>
                3
              </span>
              <div>
                <p className="font-semibold text-lg text-gray-900 dark:text-white">Track Your Progress</p>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
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