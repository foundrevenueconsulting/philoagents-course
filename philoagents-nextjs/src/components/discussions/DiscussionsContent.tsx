'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { ConversationConfig } from '@/types/api';
import { useMultiWayApi } from '@/hooks/useMultiWayApi';
import { ConfigurationSelector } from '@/components/discussions/ConfigurationSelector';
import { DiscussionInterface } from '@/components/discussions/DiscussionInterface';
import { Dictionary, Locale } from '@/lib/dictionaries';

interface DiscussionsContentProps {
  dict: Dictionary;
  locale: Locale;
}

export function DiscussionsContent({ dict, locale }: DiscussionsContentProps) {
  const [configurations, setConfigurations] = useState<Record<string, ConversationConfig>>({});
  const [selectedConfig, setSelectedConfig] = useState<ConversationConfig | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const multiWayApiService = useMultiWayApi(locale);

  useEffect(() => {
    loadConfigurations();
    
    // Check if we should resume a conversation from URL params
    const resumeSessionId = searchParams.get('session');
    if (resumeSessionId) {
      resumeConversation(resumeSessionId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const loadConfigurations = async () => {
    try {
      setLoading(true);
      const configs = await multiWayApiService.getConfigurations();
      setConfigurations(configs);
    } catch (err) {
      console.error('Failed to load configurations:', err);
      setError(dict.errors.failed_load_configs);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigSelect = async (config: ConversationConfig) => {
    try {
      setError(null);
      const response = await multiWayApiService.startConversation(config.id);
      setSelectedConfig(config);
      setSessionId(response.session_id);
    } catch (err) {
      console.error('Failed to start conversation:', err);
      setError(dict.errors.failed_start_conversation);
    }
  };

  const handleBackToSelection = () => {
    setSelectedConfig(null);
    setSessionId(null);
    setError(null);
    // Clear URL params and preserve locale
    window.history.replaceState({}, '', `/${locale}/discussions`);
  };

  const resumeConversation = async (resumeSessionId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Load the conversation from the database
      const loadedConversation = await multiWayApiService.loadConversation(resumeSessionId);
      
      // Find the matching configuration
      const configId = loadedConversation.dialogue_state.config_id;
      const config = Object.values(configurations).find(c => c.id === configId);
      
      if (!config) {
        throw new Error(dict.errors.config_not_found);
      }
      
      setSelectedConfig(config);
      setSessionId(resumeSessionId);
      
    } catch (err) {
      console.error('Failed to resume conversation:', err);
      setError(dict.errors.failed_resume_conversation);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">{dict.discussions.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {!selectedConfig ? (
        <ConfigurationSelector
          configurations={configurations}
          onSelectConfiguration={handleConfigSelect}
          onResumeConversation={resumeConversation}
          dict={dict}
          locale={locale}
        />
      ) : (
        sessionId && (
          <DiscussionInterface
            config={selectedConfig}
            sessionId={sessionId}
            onBack={handleBackToSelection}
            dict={dict}
            locale={locale}
          />
        )
      )}
    </div>
  );
}