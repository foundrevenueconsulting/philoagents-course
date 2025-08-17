'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ConversationConfig } from '@/types/api';
import { useMultiWayApi } from '@/hooks/useMultiWayApi';
import { ConfigurationSelector } from '@/components/discussions/ConfigurationSelector';
import { DiscussionInterface } from '@/components/discussions/DiscussionInterface';

function DiscussionsContent() {
  const [configurations, setConfigurations] = useState<Record<string, ConversationConfig>>({});
  const [selectedConfig, setSelectedConfig] = useState<ConversationConfig | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const multiWayApiService = useMultiWayApi();


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
      setError('Failed to load conversation configurations. Please try again.');
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
      setError('Failed to start conversation. Please try again.');
    }
  };

  const handleBackToSelection = () => {
    setSelectedConfig(null);
    setSessionId(null);
    setError(null);
    // Clear URL params
    window.history.replaceState({}, '', '/discussions');
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
        throw new Error('Configuration not found for this conversation');
      }
      
      setSelectedConfig(config);
      setSessionId(resumeSessionId);
      
    } catch (err) {
      console.error('Failed to resume conversation:', err);
      setError('Failed to resume conversation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading conversation configurations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 dark:from-slate-900 dark:to-slate-800">
      {/* Content */}
      <div className="container mx-auto px-4 py-8">
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
          />
        ) : (
          sessionId && (
            <DiscussionInterface
              config={selectedConfig}
              sessionId={sessionId}
              onBack={handleBackToSelection}
            />
          )
        )}
      </div>
    </div>
  );
}

export default function DiscussionsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderBottomColor: '#B8623F' }}></div>
          <p className="text-gray-600 dark:text-gray-300">Loading discussions...</p>
        </div>
      </div>
    }>
      <DiscussionsContent />
    </Suspense>
  );
}