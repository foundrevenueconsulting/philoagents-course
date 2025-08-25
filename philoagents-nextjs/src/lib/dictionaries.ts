import 'server-only';

const dictionaries = {
  en: () => import('./dictionaries/en.json').then((module) => module.default),
  es: () => import('./dictionaries/es.json').then((module) => module.default),
};

export type Locale = keyof typeof dictionaries;

export const getDictionary = async (locale: Locale) => 
  dictionaries[locale]?.() || dictionaries.en();

// Type-safe translation function
export type Dictionary = Awaited<ReturnType<typeof getDictionary>>;