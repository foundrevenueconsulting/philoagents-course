'use client';

import { useAuth } from '@clerk/nextjs';
import { useEffect, useMemo } from 'react';
import { multiWayApiService } from '@/lib/services/MultiWayApiService';

/**
 * Hook that provides an authenticated MultiWayApiService instance
 */
export function useMultiWayApi() {
  const { getToken } = useAuth();

  // Configure the API service with the token getter
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
  }, [getToken]);

  return multiWayApiService;
}