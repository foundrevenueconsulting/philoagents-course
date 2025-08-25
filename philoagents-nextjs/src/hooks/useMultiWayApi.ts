'use client';

import { useAuth } from '@clerk/nextjs';
import { useEffect } from 'react';
import { multiWayApiService } from '@/lib/services/MultiWayApiService';
import { Locale } from '@/lib/dictionaries';

/**
 * Hook that provides an authenticated MultiWayApiService instance
 */
export function useMultiWayApi(locale?: Locale) {
  const { getToken } = useAuth();

  // Configure the API service with the token getter and locale
  useEffect(() => {
    multiWayApiService.setTokenGetter(async () => {
      try {
        const token = await getToken();
        return token;
      } catch (error) {
        console.error('Failed to get Clerk token:', error);
        return null;
      }
    });

    if (locale) {
      multiWayApiService.setLocale(locale);
    }
  }, [getToken, locale]);

  return multiWayApiService;
}