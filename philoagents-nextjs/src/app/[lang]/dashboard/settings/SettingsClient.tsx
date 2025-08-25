'use client';

import { useState, useEffect } from 'react';

interface UserPreferences {
  favoritePhilosopher?: string;
  gameVolume: number;
  conversationSpeed: string;
  theme: string;
  language: string;
  shareConversations: boolean;
  publicProfile: boolean;
}

interface SettingsClientProps {
  userId?: string | null;
}

export default function SettingsClient({ userId }: SettingsClientProps) {
  const [preferences, setPreferences] = useState<UserPreferences>({
    gameVolume: 0.5,
    conversationSpeed: 'normal',
    theme: 'light',
    language: 'en',
    shareConversations: false,
    publicProfile: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const philosopherOptions = [
    { id: 'socrates', name: 'Socrates', emoji: '🏛️' },
    { id: 'plato', name: 'Plato', emoji: '📚' },
    { id: 'aristotle', name: 'Aristotle', emoji: '🎭' },
    { id: 'descartes', name: 'René Descartes', emoji: '🤔' },
    { id: 'kant', name: 'Immanuel Kant', emoji: '⚖️' },
    { id: 'nietzsche', name: 'Friedrich Nietzsche', emoji: '⚡' },
    { id: 'wittgenstein', name: 'Ludwig Wittgenstein', emoji: '🗣️' },
    { id: 'heidegger', name: 'Martin Heidegger', emoji: '🌲' },
    { id: 'sartre', name: 'Jean-Paul Sartre', emoji: '🎪' },
    { id: 'beauvoir', name: 'Simone de Beauvoir', emoji: '✊' },
  ];

  useEffect(() => {
    if (userId) {
      loadPreferences();
    } else {
      setLoading(false);
    }
  }, [userId]);

  const loadPreferences = async () => {
    try {
      const response = await fetch('/api/user/preferences');
      if (response.ok) {
        const data = await response.json();
        setPreferences(data.preferences);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!userId) {
      setMessage({ type: 'error', text: 'Please sign in to save preferences' });
      return;
    }

    try {
      setSaving(true);
      setMessage(null);

      const response = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Preferences saved successfully!' });
      } else {
        throw new Error('Failed to save preferences');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      setMessage({ type: 'error', text: 'Failed to save preferences. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handlePreferenceChange = (key: keyof UserPreferences, value: string | number | boolean) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  if (!userId) {
    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <p className="text-blue-700 dark:text-blue-300">
          Please sign in to manage your preferences.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="text-gray-600 dark:text-gray-300 mt-2">Loading preferences...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Game Preferences */}
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-6 shadow">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Game Preferences
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Favorite Philosopher
            </label>
            <select
              value={preferences.favoritePhilosopher || ''}
              onChange={(e) => handlePreferenceChange('favoritePhilosopher', e.target.value || '')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">No preference</option>
              {philosopherOptions.map(philosopher => (
                <option key={philosopher.id} value={philosopher.id}>
                  {philosopher.emoji} {philosopher.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Game Volume: {Math.round(preferences.gameVolume * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={preferences.gameVolume}
              onChange={(e) => handlePreferenceChange('gameVolume', parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Conversation Speed
            </label>
            <div className="flex gap-4">
              {['slow', 'normal', 'fast'].map(speed => (
                <label key={speed} className="flex items-center">
                  <input
                    type="radio"
                    value={speed}
                    checked={preferences.conversationSpeed === speed}
                    onChange={(e) => handlePreferenceChange('conversationSpeed', e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-gray-700 dark:text-gray-300 capitalize">{speed}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* UI Preferences */}
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-6 shadow">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Interface Preferences
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Theme
            </label>
            <select
              value={preferences.theme}
              onChange={(e) => handlePreferenceChange('theme', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Language
            </label>
            <select
              value={preferences.language}
              onChange={(e) => handlePreferenceChange('language', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
            </select>
          </div>
        </div>
      </div>

      {/* Privacy Settings */}
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-6 shadow">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Privacy Settings
        </h2>
        
        <div className="space-y-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={preferences.shareConversations}
              onChange={(e) => handlePreferenceChange('shareConversations', e.target.checked)}
              className="mr-3"
            />
            <div>
              <span className="text-gray-700 dark:text-gray-300 font-medium">
                Share Conversations
              </span>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Allow your conversations to be used for improving the AI
              </p>
            </div>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={preferences.publicProfile}
              onChange={(e) => handlePreferenceChange('publicProfile', e.target.checked)}
              className="mr-3"
            />
            <div>
              <span className="text-gray-700 dark:text-gray-300 font-medium">
                Public Profile
              </span>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Make your philosopher engagement stats visible to others
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
        }`}>
          {message.text}
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={savePreferences}
          disabled={saving}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </div>
  );
}