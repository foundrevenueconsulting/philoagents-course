'use client';

import { ConversationConfig } from '@/types/api';
import { Users, Lightbulb, Briefcase, FlaskConical } from 'lucide-react';

interface ConfigurationSelectorProps {
  configurations: Record<string, ConversationConfig>;
  onSelectConfiguration: (config: ConversationConfig) => void;
}

const formatIcons: Record<string, React.ReactNode> = {
  collaborative: <Users className="w-6 h-6" />,
  brainstorming: <Lightbulb className="w-6 h-6" />,
  debate: <FlaskConical className="w-6 h-6" />,
  business: <Briefcase className="w-6 h-6" />
};

const formatColors: Record<string, string> = {
  collaborative: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200',
  brainstorming: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200',
  debate: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200',
  business: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
};

const roleIcons: Record<string, string> = {
  lead: '👑',
  contributor: '💡',
  skeptic: '🤔',
  moderator: '⚖️'
};

const roleColors: Record<string, string> = {
  lead: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200',
  contributor: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200',
  skeptic: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200',
  moderator: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
};

export function ConfigurationSelector({ configurations, onSelectConfiguration }: ConfigurationSelectorProps) {
  const configArray = Object.values(configurations);

  if (configArray.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 dark:text-gray-500 mb-4">
          <Users className="w-16 h-16 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No Configurations Available
        </h3>
        <p className="text-gray-600 dark:text-gray-300">
          Please check your API connection and try again.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Choose a Discussion Format
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Select a conversation configuration to watch AI agents collaborate and debate in real-time.
        </p>
      </div>

      <div className="grid md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {configArray.map((config) => (
          <div
            key={config.id}
            className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer group"
            onClick={() => onSelectConfiguration(config)}
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 dark:bg-slate-700 rounded-lg group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                    {formatIcons[config.format] || <Users className="w-6 h-6" />}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {config.name}
                    </h3>
                    <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${formatColors[config.format] || formatColors.collaborative}`}>
                      {config.format.toUpperCase()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
                {config.description}
              </p>

              {/* Agents */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                  Participants ({config.agents.length})
                </h4>
                <div className="space-y-2">
                  {config.agents.map((agent) => (
                    <div key={agent.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: agent.primary_color }}
                        />
                        <div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {agent.name}
                          </span>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {agent.domain_expertise}
                          </p>
                        </div>
                      </div>
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${roleColors[agent.role]}`}>
                        <span>{roleIcons[agent.role]}</span>
                        {agent.role}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-600">
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>Max {config.max_rounds} rounds</span>
                  {config.allow_human_feedback && (
                    <span className="inline-flex items-center gap-1">
                      💬 Human feedback enabled
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </div>
        ))}
      </div>

      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Click on any configuration to start a new multi-way discussion
        </p>
      </div>
    </div>
  );
}