import { PracticeContent } from '@/components/practice/PracticeContent';
import { getDictionary, Locale } from '@/lib/dictionaries';

interface Props {
  params: Promise<{ lang: Locale }>;
}

export default async function PracticePage({ params }: Props) {
  const { lang } = await params;
  const dict = await getDictionary(lang);

  return <PracticeContent dict={dict} />;
}