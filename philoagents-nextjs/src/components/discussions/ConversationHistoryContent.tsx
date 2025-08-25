'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MessageSquare, Users, Clock, Filter, Search } from 'lucide-react';
import { useMultiWayApi } from '@/hooks/useMultiWayApi';
import { ConversationSummary } from '@/types/api';
import { Dictionary, Locale } from '@/lib/dictionaries';

interface ConversationHistoryContentProps {
  dict: Dictionary;
  locale: Locale;
}

export default function ConversationHistoryContent({ dict, locale }: ConversationHistoryContentProps) {
  const router = useRouter();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const multiWayApiService = useMultiWayApi(locale);
  const [filters, setFilters] = useState({
    status: '',
    config_id: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    limit: 20,
    offset: 0,
    hasMore: true
  });

  const loadConversations = async (reset: boolean = false) => {
    try {
      setLoading(true);
      const params = {
        limit: pagination.limit,
        offset: reset ? 0 : pagination.offset,
        sort_by: 'updated_at',
        sort_order: 'desc',
        ...(filters.status && { status: filters.status }),
        ...(filters.config_id && { config_id: filters.config_id })
      };

      const response = await multiWayApiService.listConversations(params);
      
      if (reset) {
        setConversations(response.conversations);
        setPagination(prev => ({ ...prev, offset: 0 }));
      } else {
        setConversations(prev => [...prev, ...response.conversations]);
      }
      
      setPagination(prev => ({
        ...prev,
        hasMore: response.conversations.length === pagination.limit,
        offset: reset ? response.conversations.length : prev.offset + response.conversations.length
      }));
      
    } catch (err) {
      console.error('Failed to load conversations:', err);
      setError(dict.history.failed_load_history);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversations(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleResumeConversation = (sessionId: string) => {
    router.push(`/${locale}/discussions?session=${sessionId}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return dict.history.just_now;
    } else if (diffInHours < 24) {
      return dict.history.hours_ago.replace('{hours}', Math.floor(diffInHours).toString());
    } else if (diffInHours < 168) {
      return dict.history.days_ago.replace('{days}', Math.floor(diffInHours / 24).toString());
    } else {
      return date.toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200';
      case 'in_progress':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200';
      case 'waiting_for_user':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'in_progress':
        return dict.history.in_progress;
      case 'completed':
        return dict.history.completed;
      case 'waiting_for_user':
        return dict.history.waiting_for_user;
      default:
        return status.replace('_', ' ');
    }
  };

  const filteredConversations = conversations.filter(conv => 
    !filters.search || 
    conv.title.toLowerCase().includes(filters.search.toLowerCase()) ||
    conv.config_name.toLowerCase().includes(filters.search.toLowerCase())
  );

  const getConversationsCount = (count: number) => {
    const plural = count !== 1 ? 's' : '';
    return dict.history.conversations_count
      .replace('{count}', count.toString())
      .replace('{plural}', plural);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link
              href={`/${locale}/discussions`}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {dict.history.back_to_discussions}
            </Link>
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {dict.history.conversation_history}
            </h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6 mb-6 shadow-lg">
          <div className="grid md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder={dict.history.search_placeholder}
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">{dict.history.all_statuses}</option>
              <option value="in_progress">{dict.history.in_progress}</option>
              <option value="completed">{dict.history.completed}</option>
              <option value="waiting_for_user">{dict.history.waiting_for_user}</option>
            </select>

            {/* Config Filter */}
            <select
              value={filters.config_id}
              onChange={(e) => handleFilterChange('config_id', e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">{dict.history.all_types}</option>
              <option value="business_strategy">{dict.history.business_strategy}</option>
              <option value="research_team">{dict.history.research_team}</option>
              <option value="creative_team">{dict.history.creative_team}</option>
              <option value="wellness_council">{dict.history.wellness_council}</option>
            </select>

            {/* Results Count */}
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <Filter className="w-4 h-4 mr-2" />
              {getConversationsCount(filteredConversations.length)}
            </div>
          </div>
        </div>

        {/* Conversation List */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {loading && filteredConversations.length === 0 ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4" style={{ borderBottomColor: '#B8623F' }}></div>
            <p className="text-gray-600 dark:text-gray-300">{dict.history.loading_conversations}</p>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {dict.history.no_conversations_found}
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              {dict.history.no_conversations_desc}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6 hover:shadow-lg transition-shadow cursor-pointer border-l-4"
                style={{ borderLeftColor: '#B8623F' }}
                onClick={() => handleResumeConversation(conversation.session_id)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 truncate">
                      {conversation.title}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {conversation.config_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatDate(conversation.updated_at)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(conversation.status)}`}>
                      {getStatusText(conversation.status)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                  <span>{conversation.total_messages} {dict.history.messages}</span>
                  <span>{conversation.total_rounds} {dict.history.rounds}</span>
                  <span>{conversation.participant_names.join(', ')}</span>
                </div>

                {conversation.status === 'in_progress' && (
                  <div className="mt-4 flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-green-600 dark:text-green-400">
                      {dict.history.ready_to_continue}
                    </span>
                  </div>
                )}
              </div>
            ))}

            {/* Load More Button */}
            {pagination.hasMore && (
              <div className="text-center py-6">
                <button
                  onClick={() => loadConversations(false)}
                  disabled={loading}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  {loading ? dict.history.loading : dict.history.load_more}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}