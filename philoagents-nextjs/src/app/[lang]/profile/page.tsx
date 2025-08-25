import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { UserService } from '@/lib/services/mongodb/userService';
import ProfileFormContent from '@/components/profile/ProfileFormContent';
import SubscriptionCardContent from '@/components/profile/SubscriptionCardContent';
import { getDictionary, Locale } from '@/lib/dictionaries';

interface Props {
  params: Promise<{ lang: Locale }>;
}

export default async function ProfilePage({ params }: Props) {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }

  const user = await UserService.getOrCreateUser();
  
  if (!user) {
    redirect('/sign-in');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Link 
            href={`/${lang}/dashboard`}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {dict.profile.back_to_dashboard}
          </Link>
        </div>

        <div className="space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">🧠 {dict.profile.profile_settings}</h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mt-2 max-w-2xl mx-auto">
              {dict.profile.profile_subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border-l-4 p-6" style={{ borderLeftColor: '#B8623F' }}>
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">{dict.profile.profile_information}</h2>
                <ProfileFormContent user={user} dict={dict} />
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border-l-4 p-6" style={{ borderLeftColor: '#B8623F' }}>
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">{dict.profile.subscription}</h2>
                {user.subscription ? (
                  <SubscriptionCardContent subscription={user.subscription} dict={dict} locale={lang} />
                ) : (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                    {dict.profile.setting_up_subscription}
                  </div>
                )}
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border-l-4 p-6" style={{ borderLeftColor: '#B8623F' }}>
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">{dict.profile.account_statistics}</h2>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">{dict.profile.total_conversations}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{user.stats.totalConversations}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">{dict.profile.member_since}</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {new Date(user.createdAt).toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">{dict.profile.last_active}</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {new Date(user.stats.lastActive).toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US')}
                    </span>
                  </div>
                  {user.stats.favoritePhilosophers.length > 0 && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-300">{dict.profile.favorite_philosophers}</span>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {user.stats.favoritePhilosophers.map((philosopher) => (
                          <span
                            key={philosopher}
                            className="px-2 py-1 rounded-full text-sm text-white"
                            style={{ backgroundColor: '#B8623F' }}
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