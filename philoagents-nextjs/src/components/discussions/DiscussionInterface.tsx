'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Users, Clock, MessageSquare, Pause, Play, Square } from 'lucide-react';
import { ConversationConfig, DialogueState, Message, StreamEvent } from '@/types/api';
import { multiWayApiService } from '@/lib/services/MultiWayApiService';
import { AgentMessage } from './AgentMessage';
import { ParticipantsList } from './ParticipantsList';
import { ConversationControls } from './ConversationControls';

interface DiscussionInterfaceProps {
  config: ConversationConfig;
  sessionId: string;
  onBack: () => void;
}

export function DiscussionInterface({ config, sessionId, onBack }: DiscussionInterfaceProps) {
  const [dialogueState, setDialogueState] = useState<DialogueState | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentSpeaker, setCurrentSpeaker] = useState<string | null>(null);
  const [streamingMessage, setStreamingMessage] = useState<string>('');
  const [streamingAgent, setStreamingAgent] = useState<string | null>(null);
  const [userFeedbackPrompt, setUserFeedbackPrompt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingState, setIsLoadingState] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const streamCleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    loadInitialState();
    return () => {
      // Cleanup stream on unmount
      if (streamCleanupRef.current) {
        streamCleanupRef.current();
      }
    };
  }, [sessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadInitialState = async () => {
    try {
      setIsLoadingState(true);
      const response = await multiWayApiService.getConversationState(sessionId);
      setDialogueState(response.dialogue_state);
      setMessages(response.dialogue_state.messages);
      setUserFeedbackPrompt(response.dialogue_state.user_feedback_prompt || null);
    } catch (err) {
      console.error('Failed to load conversation state:', err);
      setError('Failed to load conversation state');
    } finally {
      setIsLoadingState(false);
    }
  };

  const handleSendMessage = async () => {
    if (!userInput.trim() || isStreaming) return;

    const message = userInput.trim();
    setUserInput('');
    setError(null);

    try {
      // Send the message
      const response = await multiWayApiService.sendMessage(sessionId, message);
      setDialogueState(response.dialogue_state || null);
      
      if (response.dialogue_state) {
        setMessages(response.dialogue_state.messages);
        setUserFeedbackPrompt(null); // Clear any pending feedback prompt
      }

      // Start streaming the next response
      startStreaming();
    } catch (err) {
      console.error('Failed to send message:', err);
      setError('Failed to send message. Please try again.');
    }
  };

  const startStreaming = async () => {
    if (isStreaming) return;

    setIsStreaming(true);
    setStreamingMessage('');
    setStreamingAgent(null);
    setCurrentSpeaker(null);

    try {
      const cleanup = await multiWayApiService.streamConversation(
        sessionId,
        handleStreamEvent,
        handleStreamError,
        handleStreamComplete
      );
      
      streamCleanupRef.current = cleanup;
    } catch (err) {
      console.error('Failed to start streaming:', err);
      setError('Failed to start conversation stream');
      setIsStreaming(false);
    }
  };

  const handleStreamEvent = (event: StreamEvent) => {
    switch (event.type) {
      case 'speaker_info':
        setCurrentSpeaker(event.agent_name || null);
        setStreamingAgent(event.agent_name || null);
        setStreamingMessage('');
        break;

      case 'agent_response':
        if (event.content) {
          setStreamingMessage(prev => prev + event.content);
        }
        break;

      case 'user_input_requested':
        if (event.questions && event.questions.length > 0) {
          setUserFeedbackPrompt(event.questions.join('; '));
        }
        break;

      case 'turn_complete':
        // Finalize the streaming message
        if (streamingMessage && streamingAgent) {
          const newMessage: Message = {
            id: `stream-${Date.now()}`,
            role: 'agent',
            content: streamingMessage,
            agent_name: streamingAgent,
            timestamp: new Date().toISOString(),
            metadata: {}
          };
          setMessages(prev => [...prev, newMessage]);
        }
        setStreamingMessage('');
        setStreamingAgent(null);
        setCurrentSpeaker(null);
        
        // Auto-continue after a brief pause to show the "Continue Discussion" button
        setTimeout(() => {
          if (!userFeedbackPrompt && dialogueState?.status === 'in_progress') {
            // Only auto-continue if no user feedback needed
            // startStreaming(); // Commented out to let user control the flow
          }
        }, 2000);
        break;

      case 'system':
        if (event.message) {
          const systemMessage: Message = {
            id: `system-${Date.now()}`,
            role: 'system',
            content: event.message,
            timestamp: new Date().toISOString(),
            metadata: {}
          };
          setMessages(prev => [...prev, systemMessage]);
        }
        break;

      case 'error':
        setError(event.message || 'An error occurred during streaming');
        break;
    }
  };

  const handleStreamError = (error: Error) => {
    console.error('Stream error:', error);
    setError('Connection error during streaming');
    setIsStreaming(false);
  };

  const handleStreamComplete = () => {
    setIsStreaming(false);
    setCurrentSpeaker(null);
    // Refresh conversation state
    loadInitialState();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getAgentConfig = (agentName: string) => {
    return config.agents.find(agent => agent.name === agentName);
  };

  const getNextAgentName = () => {
    if (!dialogueState?.turn_info?.next_agent_id) return null;
    const nextAgent = config.agents.find(agent => agent.id === dialogueState.turn_info.next_agent_id);
    return nextAgent?.name || null;
  };

  if (isLoadingState) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading conversation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Configurations
            </button>
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {config.name}
            </h2>
          </div>
          <ConversationControls
            isStreaming={isStreaming}
            sessionId={sessionId}
            onRefresh={loadInitialState}
            conversationStatus={dialogueState?.status}
          />
        </div>

        {dialogueState?.topic && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Discussion Topic</span>
            </div>
            <p className="text-blue-900 dark:text-blue-100">{dialogueState.topic}</p>
          </div>
        )}

        {error && (
          <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Participants List */}
        <div className="lg:col-span-1">
          <ParticipantsList
            agents={config.agents}
            currentSpeaker={currentSpeaker}
            dialogueState={dialogueState}
          />
        </div>

        {/* Main Conversation */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 flex flex-col h-[600px]">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 && !dialogueState?.topic ? (
                <div className="text-center py-12">
                  <MessageSquare className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Ready to Start Discussion
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Provide a topic or question to begin the multi-way conversation.
                  </p>
                </div>
              ) : (
                <>
                  {messages.map((message) => (
                    <AgentMessage
                      key={message.id}
                      message={message}
                      agentConfig={message.agent_name ? getAgentConfig(message.agent_name) : undefined}
                    />
                  ))}
                  
                  {/* Streaming message */}
                  {isStreaming && streamingMessage && streamingAgent && (
                    <AgentMessage
                      message={{
                        id: 'streaming',
                        role: 'agent',
                        content: streamingMessage,
                        agent_name: streamingAgent,
                        timestamp: new Date().toISOString(),
                        metadata: {}
                      }}
                      agentConfig={getAgentConfig(streamingAgent)}
                      isStreaming={true}
                    />
                  )}

                  {/* Current speaker indicator */}
                  {isStreaming && currentSpeaker && !streamingMessage && (
                    <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        <span className="text-sm text-blue-700 dark:text-blue-300">
                          {currentSpeaker} is thinking...
                        </span>
                      </div>
                    </div>
                  )}
                </>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* User Input */}
            <div className="border-t border-gray-200 dark:border-slate-600 p-4">
              {userFeedbackPrompt && (
                <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
                    <strong>Agents are asking:</strong>
                  </p>
                  <p className="text-yellow-900 dark:text-yellow-100">{userFeedbackPrompt}</p>
                </div>
              )}

              {/* Conversation Completed Message */}
              {dialogueState?.status === 'completed' && (
                <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      Discussion Complete
                    </span>
                  </div>
                  <p className="text-blue-900 dark:text-blue-100 text-sm">
                    This conversation has reached its maximum number of rounds ({dialogueState.round_count} rounds completed). 
                    You can review the discussion above, but no new responses can be generated.
                  </p>
                  <div className="mt-3 flex items-center gap-4 text-xs text-blue-700 dark:text-blue-300">
                    <span>📊 {dialogueState.messages.length} total messages</span>
                    <span>🔄 {dialogueState.round_count} rounds completed</span>
                    <span>👥 {config.agents.length} participants</span>
                  </div>
                </div>
              )}

              {/* Continue Discussion Button */}
              {!isStreaming && !userFeedbackPrompt && dialogueState?.topic && dialogueState?.status === 'in_progress' && (
                <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-green-800 dark:text-green-200">
                        {dialogueState.turn_info?.next_agent_id 
                          ? `${getNextAgentName()} is ready to speak next`
                          : 'Agents are ready to continue the discussion'
                        }
                      </span>
                    </div>
                    <button
                      onClick={startStreaming}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Continue Discussion
                    </button>
                  </div>
                </div>
              )}
              
              <div className="flex gap-3">
                <div className="flex-1">
                  <textarea
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={
                      !dialogueState?.topic 
                        ? "Enter a topic or question to start the discussion..."
                        : dialogueState?.status === 'completed'
                          ? "This discussion has ended. You can start a new one from the dashboard."
                        : userFeedbackPrompt 
                          ? "Respond to the agents' question..."
                          : "Add your input to the discussion (optional)..."
                    }
                    className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={2}
                    disabled={isStreaming || dialogueState?.status === 'completed'}
                  />
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={!userInput.trim() || isStreaming || dialogueState?.status === 'completed'}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {!dialogueState?.topic ? 'Start' : 'Send'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}