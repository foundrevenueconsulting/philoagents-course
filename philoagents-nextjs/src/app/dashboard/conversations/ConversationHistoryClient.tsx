'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { apiService } from '@/lib/services/ApiService';

interface Conversation {
  id: string;
  philosopher_id: string;
  philosopher_name: string;
  message: string;
  response: string;
  timestamp: string;
  user_id?: string;
}

interface ConversationHistoryClientProps {
  userId?: string;
  hasAuth: boolean;
}

export default function ConversationHistoryClient({ userId, hasAuth }: ConversationHistoryClientProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhilosopher, setSelectedPhilosopher] = useState<string>('all');

  const philosopherNames = {
    socrates: 'Socrates',
    plato: 'Plato',
    aristotle: 'Aristotle',
    descartes: 'René Descartes',
    kant: 'Immanuel Kant',
    nietzsche: 'Friedrich Nietzsche',
    wittgenstein: 'Ludwig Wittgenstein',
    heidegger: 'Martin Heidegger',
    sartre: 'Jean-Paul Sartre',
    beauvoir: 'Simone de Beauvoir'
  };

  const loadConversations = useCallback(async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const data = await apiService.getConversationHistory(
        userId, 
        selectedPhilosopher === 'all' ? undefined : selectedPhilosopher
      );
      
      // Transform the data to match our interface
      const formattedConversations: Conversation[] = data.map((conv: Record<string, string>) => ({
        id: conv.id || `${conv.philosopher_id}-${conv.timestamp}`,
        philosopher_id: conv.philosopher_id,
        philosopher_name: philosopherNames[conv.philosopher_id as keyof typeof philosopherNames] || conv.philosopher_id,
        message: conv.message || conv.user_message,
        response: conv.response || conv.ai_response,
        timestamp: conv.timestamp,
        user_id: conv.user_id
      }));
      
      // Sort by timestamp (newest first)
      formattedConversations.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      setConversations(formattedConversations);
    } catch (err) {
      console.error('Error loading conversation history:', err);
      setError('Failed to load conversation history. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [userId, selectedPhilosopher]);

  useEffect(() => {
    if (hasAuth && userId) {
      loadConversations();
    } else {
      setLoading(false);
    }
  }, [userId, hasAuth, selectedPhilosopher, loadConversations]);

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return timestamp;
    }
  };

  const getPhilosopherEmoji = (philosopherId: string) => {
    const emojiMap: { [key: string]: string } = {
      socrates: '🏛️',
      plato: '📚',
      aristotle: '🎭',
      descartes: '🤔',
      kant: '⚖️',
      nietzsche: '⚡',
      wittgenstein: '🗣️',
      heidegger: '🌲',
      sartre: '🎪',
      beauvoir: '✊'
    };
    return emojiMap[philosopherId] || '🧠';
  };

  if (!hasAuth) {
    return (
      <div className="text-center py-12">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 max-w-md mx-auto">
          <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
            Authentication Required
          </h3>
          <p className="text-yellow-700 dark:text-yellow-300">
            Please configure Clerk authentication to view conversation history.
          </p>
        </div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="text-center py-12">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 max-w-md mx-auto">
          <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
            Please Sign In
          </h3>
          <p className="text-blue-700 dark:text-blue-300">
            Sign in to view your conversation history.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Controls */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow border border-gray-200 dark:border-slate-700">
        <div className="flex flex-wrap gap-4 items-center">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Filter by Philosopher:
          </label>
          <select
            value={selectedPhilosopher}
            onChange={(e) => setSelectedPhilosopher(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="all">All Philosophers</option>
            {Object.entries(philosopherNames).map(([id, name]) => (
              <option key={id} value={id}>
                {getPhilosopherEmoji(id)} {name}
              </option>
            ))}
          </select>
          <button
            onClick={loadConversations}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-300 mt-2">Loading conversations...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Error Loading Conversations
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Conversations List */}
      {!loading && !error && (
        <>
          {conversations.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-8 max-w-md mx-auto">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No Conversations Yet
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Start your philosophical journey by entering the game world and talking to philosophers.
                </p>
                <Link
                  href="/game"
                  className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  Enter Game World
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Showing {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
              </div>
              
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-6 shadow hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {getPhilosopherEmoji(conversation.philosopher_id)}
                      </span>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {conversation.philosopher_name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {formatTimestamp(conversation.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 p-4 rounded-r-lg">
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                        Your Question:
                      </p>
                      <p className="text-blue-700 dark:text-blue-300">
                        {conversation.message}
                      </p>
                    </div>

                    <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-400 p-4 rounded-r-lg">
                      <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">
                        {conversation.philosopher_name}&apos;s Response:
                      </p>
                      <p className="text-green-700 dark:text-green-300 whitespace-pre-wrap">
                        {conversation.response}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}