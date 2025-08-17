'use client';

import { AgentConfig, DialogueState } from '@/types/api';
import { Crown, Lightbulb, AlertCircle, Scale, Bot, Activity } from 'lucide-react';

interface ParticipantsListProps {
  agents: AgentConfig[];
  currentSpeaker?: string | null;
  dialogueState?: DialogueState | null;
}

const roleIcons = {
  lead: Crown,
  contributor: Lightbulb,
  skeptic: AlertCircle,
  moderator: Scale
};

export function ParticipantsList({ agents, currentSpeaker, dialogueState }: ParticipantsListProps) {
  const getAgentMessageCount = (agentId: string) => {
    if (!dialogueState) return 0;
    return dialogueState.messages.filter(msg => msg.agent_id === agentId).length;
  };

  const isNextSpeaker = (agentName: string) => {
    return dialogueState?.turn_info.next_agent_id && 
           agents.find(a => a.id === dialogueState.turn_info.next_agent_id)?.name === agentName;
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Bot className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        <h3 className="font-semibold text-gray-900 dark:text-white">
          Participants
        </h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          ({agents.length})
        </span>
      </div>

      <div className="space-y-3">
        {agents.map((agent) => {
          const RoleIcon = roleIcons[agent.role] || Bot;
          const messageCount = getAgentMessageCount(agent.id);
          const isCurrentlyActive = currentSpeaker === agent.name;
          const isUpNext = isNextSpeaker(agent.name);

          return (
            <div
              key={agent.id}
              className={`p-3 rounded-lg border transition-all ${
                isCurrentlyActive
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : isUpNext
                  ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                  : 'border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="relative">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                    style={{ backgroundColor: agent.primary_color }}
                  >
                    {agent.name.charAt(0)}
                  </div>
                  <div
                    className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center border border-white dark:border-slate-800"
                    style={{ backgroundColor: agent.primary_color }}
                  >
                    <RoleIcon className="w-2 h-2" />
                  </div>
                </div>

                {/* Agent Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-gray-900 dark:text-white truncate">
                      {agent.name}
                    </h4>
                    {isCurrentlyActive && (
                      <div className="flex items-center gap-1">
                        <Activity className="w-3 h-3 text-blue-500 animate-pulse" />
                        <span className="text-xs text-blue-600 dark:text-blue-400">speaking</span>
                      </div>
                    )}
                    {isUpNext && !isCurrentlyActive && (
                      <span className="text-xs text-yellow-600 dark:text-yellow-400">up next</span>
                    )}
                  </div>

                  <div
                    className="text-xs font-medium px-2 py-1 rounded mb-2 inline-block"
                    style={{
                      backgroundColor: `${agent.primary_color}20`,
                      color: agent.primary_color
                    }}
                  >
                    {agent.role.toUpperCase()}
                  </div>

                  <p className="text-xs text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">
                    {agent.domain_expertise}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>{messageCount} messages</span>
                    {dialogueState && (
                      <span className="text-xs">
                        Round {dialogueState.round_count}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Conversation Stats */}
      {dialogueState && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-600">
          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <div className="flex justify-between">
              <span>Status:</span>
              <span className="capitalize">{dialogueState.status.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between">
              <span>Total messages:</span>
              <span>{dialogueState.messages.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Rounds:</span>
              <span>{dialogueState.round_count}</span>
            </div>
            {dialogueState.turn_info.turn_number > 0 && (
              <div className="flex justify-between">
                <span>Turn:</span>
                <span>{dialogueState.turn_info.turn_number}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}