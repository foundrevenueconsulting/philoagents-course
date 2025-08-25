import Link from 'next/link';
import { getCurrentUserWithFeatures } from '@/lib/auth';
import { getDictionary, Locale } from '@/lib/dictionaries';

interface Props {
  params: Promise<{ lang: Locale }>;
}

export default async function Dashboard({ params }: Props) {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  const user = await getCurrentUserWithFeatures();

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            🧠 {dict.dashboard.welcome_back}{user?.firstName ? `, ${user.firstName}` : ''}!
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            {dict.dashboard.welcome_subtitle}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          

          <Link
            href={`/${lang}/discussions`}
            className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 border-l-4"
            style={{ borderLeftColor: '#B8623F' }}
          >
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
              {dict.dashboard.biotype_discussions}
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              {dict.dashboard.biotype_discussions_desc}
            </p>
            <div className="mt-3 text-xs font-semibold px-3 py-1 rounded-full" style={{ backgroundColor: '#B8623F', color: 'white' }}>
              {dict.dashboard.new_feature}
            </div>
          </Link>

          <Link
            href={`/${lang}/practice`}
            className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 border-l-4"
            style={{ borderLeftColor: '#B8623F' }}
          >
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
              {dict.dashboard.biotype_recognition}
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              {dict.dashboard.biotype_recognition_desc}
            </p>
            <div className="mt-3 text-xs font-semibold px-3 py-1 rounded-full" style={{ backgroundColor: '#B8623F', color: 'white' }}>
              {dict.dashboard.new_feature}
            </div>
          </Link>
          
          <Link
            href={`/${lang}/game`}
            className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 border-l-4"
            style={{ borderLeftColor: '#B8623F' }}
          >
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
              {dict.dashboard.enter_game}
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              {dict.dashboard.enter_game_desc}
            </p>
          </Link>

          <Link
            href={`/${lang}/dashboard/conversations`}
            className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 border-l-4"
            style={{ borderLeftColor: '#B8623F' }}
          >
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
              {dict.dashboard.conversation_history}
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              {dict.dashboard.conversation_history_desc}
            </p>
          </Link>

          <Link
            href={`/${lang}/profile`}
            className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 border-l-4"
            style={{ borderLeftColor: '#B8623F' }}
          >
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
              {dict.dashboard.profile_settings}
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              {dict.dashboard.profile_settings_desc}
            </p>
          </Link>
        </div>

        <div className="mt-16 bg-white dark:bg-slate-800 p-8 rounded-xl shadow-xl border-t-4" style={{ borderTopColor: '#B8623F' }}>
          <h3 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white text-center">
            {dict.dashboard.quick_start}
          </h3>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <span className="w-8 h-8 rounded-full text-white font-semibold flex items-center justify-center flex-shrink-0 mt-1" style={{ backgroundColor: '#B8623F' }}>
                1
              </span>
              <div>
                <p className="font-semibold text-lg text-gray-900 dark:text-white">{dict.dashboard.step_1_title}</p>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  {dict.dashboard.step_1_desc}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <span className="w-8 h-8 rounded-full text-white font-semibold flex items-center justify-center flex-shrink-0 mt-1" style={{ backgroundColor: '#B8623F' }}>
                2
              </span>
              <div>
                <p className="font-semibold text-lg text-gray-900 dark:text-white">{dict.dashboard.step_2_title}</p>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  {dict.dashboard.step_2_desc}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <span className="w-8 h-8 rounded-full text-white font-semibold flex items-center justify-center flex-shrink-0 mt-1" style={{ backgroundColor: '#B8623F' }}>
                3
              </span>
              <div>
                <p className="font-semibold text-lg text-gray-900 dark:text-white">{dict.dashboard.step_3_title}</p>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  {dict.dashboard.step_3_desc}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}