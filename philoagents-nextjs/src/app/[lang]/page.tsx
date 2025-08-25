import { getDictionary, Locale } from '@/lib/dictionaries';
import { redirect } from 'next/navigation';
import { getAuthInfo } from '@/lib/auth';

interface Props {
  params: Promise<{ lang: Locale }>;
}

export default async function LocaleHome({ params }: Props) {
  const { lang } = await params;
  const { userId } = await getAuthInfo();
  
  if (userId) {
    redirect(`/${lang}/dashboard`);
  } else {
    // Redirect non-authenticated users to sign up
    redirect('/sign-up');
  }
}