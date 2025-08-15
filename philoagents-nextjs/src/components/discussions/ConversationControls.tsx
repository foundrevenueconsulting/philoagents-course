'use client';

import { useState } from 'react';
import { RefreshCw, Download, Square, BarChart3, Settings } from 'lucide-react';
import { useMultiWayApi } from '@/hooks/useMultiWayApi';

interface ConversationControlsProps {
  isStreaming: boolean;
  sessionId: string;
  onRefresh: () => void;
  conversationStatus?: string;
}

export function ConversationControls({ isStreaming, sessionId, onRefresh, conversationStatus }: ConversationControlsProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const multiWayApiService = useMultiWayApi();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExportConversation = async () => {
    setIsExporting(true);
    try {
      const history = await multiWayApiService.getConversationHistory(sessionId);
      
      // Create a formatted text export
      const exportData = {
        session_id: sessionId,
        exported_at: new Date().toISOString(),
        messages: history.messages.map(msg => ({
          timestamp: msg.timestamp,
          speaker: msg.role === 'user' ? 'User' : msg.agent_name || 'System',
          role: msg.role,
          content: msg.content
        }))
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
        type: 'application/json' 
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `conversation-${sessionId.slice(0, 8)}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export conversation:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleGetSummary = async () => {
    try {
      const summary = await multiWayApiService.getConversationSummary(sessionId);
      
      // Create a simple alert with the summary (could be enhanced with a modal)
      const summaryText = Object.entries(summary.summaries)
        .map(([agentId, summary]) => `${agentId.toUpperCase()}:\n${summary}`)
        .join('\n\n');
        
      alert(`Conversation Summary:\n\n${summaryText}`);
    } catch (error) {
      console.error('Failed to get summary:', error);
      alert('Failed to get conversation summary');
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Refresh */}
      <button
        onClick={handleRefresh}
        disabled={isRefreshing || isStreaming}
        className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Refresh conversation state"
      >
        <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
      </button>

      {/* Export */}
      <button
        onClick={handleExportConversation}
        disabled={isExporting || isStreaming}
        className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Export conversation"
      >
        <Download className="w-4 h-4" />
      </button>

      {/* Summary */}
      <button
        onClick={handleGetSummary}
        disabled={isStreaming}
        className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Get conversation summary"
      >
        <BarChart3 className="w-4 h-4" />
      </button>

      {/* Status indicator */}
      <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-slate-700 rounded-lg">
        <div className={`w-2 h-2 rounded-full ${
          conversationStatus === 'completed' 
            ? 'bg-blue-500'
            : isStreaming 
            ? 'bg-green-500 animate-pulse' 
            : 'bg-blue-400 dark:bg-blue-500'
        }`} />
        <span className="text-xs text-gray-600 dark:text-gray-300">
          {conversationStatus === 'completed' 
            ? 'Discussion Complete'
            : isStreaming 
            ? 'Agent Speaking' 
            : 'Ready to Continue'
          }
        </span>
      </div>
    </div>
  );
}