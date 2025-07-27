'use client';

import { useState, useEffect } from 'react';
import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ConversationConfig } from '@/types/api';
import { multiWayApiService } from '@/lib/services/MultiWayApiService';
import { ConfigurationSelector } from '@/components/discussions/ConfigurationSelector';
import { DiscussionInterface } from '@/components/discussions/DiscussionInterface';

export default function DiscussionsPage() {
  const [configurations, setConfigurations] = useState<Record<string, ConversationConfig>>({});
  const [selectedConfig, setSelectedConfig] = useState<ConversationConfig | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if Clerk is configured
  const hasClerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && 
                     process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== 'pk_test_temp';

  useEffect(() => {
    loadConfigurations();
  }, []);

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
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Navigation */}
      <nav className="bg-white dark:bg-slate-800 shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              🗣️ Multi-Way Discussions
            </h1>
          </div>
          {hasClerkKey && <UserButton afterSignOutUrl="/" />}
        </div>
      </nav>

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