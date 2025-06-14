import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { UserService } from '@/lib/services/mongodb/userService';
import ProfileForm from '@/components/profile/ProfileForm';
import SubscriptionCard from '@/components/profile/SubscriptionCard';

export default async function ProfilePage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }

  const user = await UserService.getOrCreateUser();
  
  if (!user) {
    redirect('/sign-in');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Link 
            href="/dashboard"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
        </div>

        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
            <p className="text-gray-600 mt-2">
              Manage your account information and preferences
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
                <ProfileForm user={user} />
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Subscription</h2>
                {user.subscription ? (
                  <SubscriptionCard subscription={user.subscription} />
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    Setting up your subscription...
                  </div>
                )}
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Account Statistics</h2>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Conversations</span>
                    <span className="font-medium">{user.stats.totalConversations}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Member Since</span>
                    <span className="font-medium">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Active</span>
                    <span className="font-medium">
                      {new Date(user.stats.lastActive).toLocaleDateString()}
                    </span>
                  </div>
                  {user.stats.favoritePhilosophers.length > 0 && (
                    <div>
                      <span className="text-gray-600">Favorite Philosophers</span>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {user.stats.favoritePhilosophers.map((philosopher) => (
                          <span
                            key={philosopher}
                            className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                          >
                            {philosopher}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}