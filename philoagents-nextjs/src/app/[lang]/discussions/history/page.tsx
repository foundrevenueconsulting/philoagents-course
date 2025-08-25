import ConversationHistoryContent from '@/components/discussions/ConversationHistoryContent';
import { getDictionary, Locale } from '@/lib/dictionaries';

interface Props {
  params: Promise<{ lang: Locale }>;
}

export default async function ConversationHistory({ params }: Props) {
  const { lang } = await params;
  const dict = await getDictionary(lang);

  return <ConversationHistoryContent dict={dict} locale={lang} />;
}
