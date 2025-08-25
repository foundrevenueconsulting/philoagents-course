'use client';

import { useState, useEffect } from 'react';
import { Dictionary } from '@/lib/dictionaries';

interface UserPreferences {
  favoritePhilosopher?: string;
  gameVolume: number;
  conversationSpeed: string;
  theme: string;
  language: string;
  shareConversations: boolean;
  publicProfile: boolean;
}

interface SettingsClientContentProps {
  userId?: string | null;
  dict: Dictionary;
}

export default function SettingsClientContent({ userId, dict }: SettingsClientContentProps) {
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
      setMessage({ type: 'error', text: dict.settings.sign_in_to_save });
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
        setMessage({ type: 'success', text: dict.settings.preferences_saved });
      } else {
        throw new Error('Failed to save preferences');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      setMessage({ type: 'error', text: dict.settings.preferences_failed });
    } finally {
      setSaving(false);
    }
  };

  const handlePreferenceChange = (key: keyof UserPreferences, value: string | number | boolean) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const getSpeedLabel = (speed: string) => {
    switch (speed) {
      case 'slow':
        return dict.settings.speed_slow;
      case 'normal':
        return dict.settings.speed_normal;
      case 'fast':
        return dict.settings.speed_fast;
      default:
        return speed;
    }
  };

  if (!userId) {
    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <p className="text-blue-700 dark:text-blue-300">
          {dict.settings.sign_in_required}
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderBottomColor: '#B8623F' }}></div>
        <p className="text-gray-600 dark:text-gray-300 mt-2">{dict.settings.loading_preferences}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Game Preferences */}
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-6 shadow-lg border-l-4" style={{ borderLeftColor: '#B8623F' }}>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          {dict.settings.game_preferences}
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {dict.settings.favorite_philosopher}
            </label>
            <select
              value={preferences.favoritePhilosopher || ''}
              onChange={(e) => handlePreferenceChange('favoritePhilosopher', e.target.value || '')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">{dict.settings.no_preference}</option>
              {philosopherOptions.map(philosopher => (
                <option key={philosopher.id} value={philosopher.id}>
                  {philosopher.emoji} {philosopher.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {dict.settings.game_volume.replace('{percentage}', Math.round(preferences.gameVolume * 100).toString())}
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
              {dict.settings.conversation_speed}
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
                  <span className="text-gray-700 dark:text-gray-300">{getSpeedLabel(speed)}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* UI Preferences */}
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-6 shadow-lg border-l-4" style={{ borderLeftColor: '#B8623F' }}>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          {dict.settings.interface_preferences}
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {dict.settings.theme}
            </label>
            <select
              value={preferences.theme}
              onChange={(e) => handlePreferenceChange('theme', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="light">{dict.settings.theme_light}</option>
              <option value="dark">{dict.settings.theme_dark}</option>
              <option value="system">{dict.settings.theme_system}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {dict.settings.language}
            </label>
            <select
              value={preferences.language}
              onChange={(e) => handlePreferenceChange('language', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="en">{dict.settings.language_en}</option>
              <option value="es">{dict.settings.language_es}</option>
              <option value="fr">{dict.settings.language_fr}</option>
              <option value="de">{dict.settings.language_de}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Privacy Settings */}
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-6 shadow-lg border-l-4" style={{ borderLeftColor: '#B8623F' }}>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          {dict.settings.privacy_settings}
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
                {dict.settings.share_conversations}
              </span>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {dict.settings.share_conversations_desc}
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
                {dict.settings.public_profile}
              </span>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {dict.settings.public_profile_desc}
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
          className="px-6 py-2 rounded-md transition-colors text-white disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
          style={{ 
            backgroundColor: saving ? '#9ca3af' : '#B8623F'
          }}
        >
          {saving ? dict.settings.saving : dict.settings.save_preferences}
        </button>
      </div>
    </div>
  );
}