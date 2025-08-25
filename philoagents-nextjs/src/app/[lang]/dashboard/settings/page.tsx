import { auth } from "@clerk/nextjs/server";
import SettingsClientContent from "@/components/settings/SettingsClientContent";
import { getDictionary, Locale } from '@/lib/dictionaries';

interface Props {
  params: Promise<{ lang: Locale }>;
}

export default async function SettingsPage({ params }: Props) {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  const { userId } = await auth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          {dict.settings.title}
        </h1>
        
        <SettingsClientContent userId={userId} dict={dict} />
      </div>
    </div>
  );
}