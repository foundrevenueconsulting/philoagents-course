'use client';

import { Message, AgentConfig } from '@/types/api';
import { User, Bot, System, Crown, Lightbulb, AlertCircle, Scale } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface AgentMessageProps {
  message: Message;
  agentConfig?: AgentConfig;
  isStreaming?: boolean;
}

const roleIcons = {
  lead: Crown,
  contributor: Lightbulb,
  skeptic: AlertCircle,
  moderator: Scale
};

const roleDescriptions = {
  lead: 'Leading the discussion',
  contributor: 'Contributing insights',
  skeptic: 'Questioning assumptions',
  moderator: 'Facilitating dialogue'
};

export function AgentMessage({ message, agentConfig, isStreaming = false }: AgentMessageProps) {
  const formatTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return 'just now';
    }
  };

  // User message
  if (message.role === 'user') {
    return (
      <div className="flex gap-3 justify-end">
        <div className="max-w-2xl">
          <div className="bg-blue-600 text-white rounded-lg rounded-br-sm p-4">
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
          <div className="flex items-center justify-end gap-2 mt-1 px-2">
            <User className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-500">You • {formatTime(message.timestamp)}</span>
          </div>
        </div>
      </div>
    );
  }

  // System message
  if (message.role === 'system') {
    return (
      <div className="flex justify-center">
        <div className="bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg p-3 max-w-2xl">
          <div className="flex items-center gap-2 mb-1">
            <System className="w-4 h-4" />
            <span className="text-xs font-medium">System</span>
          </div>
          <p className="text-sm">{message.content}</p>
        </div>
      </div>
    );
  }

  // Agent message
  if (!agentConfig) {
    // Fallback for agent messages without config
    return (
      <div className="flex gap-3">
        <div className="w-8 h-8 bg-gray-200 dark:bg-slate-600 rounded-full flex items-center justify-center">
          <Bot className="w-4 h-4 text-gray-500" />
        </div>
        <div className="flex-1 max-w-2xl">
          <div className="bg-gray-100 dark:bg-slate-700 rounded-lg rounded-tl-sm p-4">
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
          <div className="flex items-center gap-2 mt-1 px-2">
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {message.agent_name || 'Agent'}
            </span>
            <span className="text-xs text-gray-500">• {formatTime(message.timestamp)}</span>
          </div>
        </div>
      </div>
    );
  }

  // Agent message with full styling
  const RoleIcon = roleIcons[agentConfig.role] || Bot;
  
  const agentStyles = {
    avatar: {
      backgroundColor: agentConfig.primary_color,
      color: 'white'
    },
    message: {
      backgroundColor: `${agentConfig.primary_color}10`,
      borderLeftColor: agentConfig.primary_color
    },
    accent: {
      color: agentConfig.primary_color
    }
  };

  return (
    <div className="flex gap-3">
      {/* Agent Avatar */}
      <div className="relative">
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold shadow-sm"
          style={agentStyles.avatar}
        >
          {agentConfig.name.charAt(0)}
        </div>
        <div 
          className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800"
          style={agentStyles.avatar}
        >
          <RoleIcon className="w-2.5 h-2.5" />
        </div>
      </div>

      {/* Message Content */}
      <div className="flex-1 max-w-3xl">
        {/* Agent Info */}
        <div className="flex items-center gap-2 mb-2">
          <span className="font-semibold text-gray-900 dark:text-white">
            {agentConfig.name}
          </span>
          <span 
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{ 
              backgroundColor: `${agentConfig.primary_color}20`,
              color: agentConfig.primary_color 
            }}
          >
            {roleDescriptions[agentConfig.role]}
          </span>
          {isStreaming && (
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-blue-600 dark:text-blue-400">streaming...</span>
            </div>
          )}
        </div>

        {/* Message Bubble */}
        <div 
          className="rounded-lg rounded-tl-sm p-4 border-l-4"
          style={agentStyles.message}
        >
          <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">
            {agentConfig.domain_expertise}
          </div>
          <p className="text-gray-900 dark:text-white whitespace-pre-wrap leading-relaxed">
            {message.content}
            {isStreaming && <span className="animate-pulse">▌</span>}
          </p>
        </div>

        {/* Timestamp */}
        <div className="flex items-center gap-2 mt-1 px-2">
          <span className="text-xs text-gray-500">
            {formatTime(message.timestamp)}
          </span>
        </div>
      </div>
    </div>
  );
}