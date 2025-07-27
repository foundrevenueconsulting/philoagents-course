import { 
  ConversationConfig,
  StartConversationRequest,
  ConversationMessageRequest,
  MultiWayConversationResponse,
  DialogueState,
  Message,
  StreamEvent
} from '@/types/api';

export class MultiWayApiService {
  private apiUrl: string;

  constructor() {
    this.apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  }

  private async request<T>(
    endpoint: string, 
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', 
    data?: Record<string, unknown>
  ): Promise<T> {
    const url = `${this.apiUrl}${endpoint}`;
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    };

    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Multi-way API request failed:', { url, method, error });
      throw error;
    }
  }

  /**
   * Get all available conversation configurations
   */
  async getConfigurations(): Promise<Record<string, ConversationConfig>> {
    const response = await this.request<{ configurations: Record<string, ConversationConfig> }>('/api/multi-way/configurations');
    return response.configurations;
  }

  /**
   * Start a new multi-way conversation
   */
  async startConversation(configId: string, sessionId?: string): Promise<MultiWayConversationResponse> {
    const requestData: StartConversationRequest = {
      config_id: configId,
      session_id: sessionId
    };

    return await this.request<MultiWayConversationResponse>('/api/multi-way/start', 'POST', requestData);
  }

  /**
   * Send a message to the conversation
   */
  async sendMessage(sessionId: string, message: string): Promise<MultiWayConversationResponse> {
    const requestData: ConversationMessageRequest = {
      session_id: sessionId,
      message
    };

    return await this.request<MultiWayConversationResponse>('/api/multi-way/message', 'POST', requestData);
  }

  /**
   * Get current conversation state
   */
  async getConversationState(sessionId: string): Promise<{ session_id: string; dialogue_state: DialogueState }> {
    return await this.request<{ session_id: string; dialogue_state: DialogueState }>(`/api/multi-way/${sessionId}`);
  }

  /**
   * Get conversation history
   */
  async getConversationHistory(sessionId: string, limit?: number): Promise<{ session_id: string; messages: Message[] }> {
    const endpoint = `/api/multi-way/${sessionId}/history${limit ? `?limit=${limit}` : ''}`;
    return await this.request<{ session_id: string; messages: Message[] }>(endpoint);
  }

  /**
   * End a conversation
   */
  async endConversation(sessionId: string): Promise<MultiWayConversationResponse> {
    return await this.request<MultiWayConversationResponse>(`/api/multi-way/${sessionId}`, 'DELETE');
  }

  /**
   * Get conversation summary
   */
  async getConversationSummary(sessionId: string): Promise<{ session_id: string; summaries: Record<string, string> }> {
    return await this.request<{ session_id: string; summaries: Record<string, string> }>(`/api/multi-way/${sessionId}/summary`);
  }

  /**
   * Stream conversation responses using Server-Sent Events
   */
  async streamConversation(
    sessionId: string, 
    onEvent: (event: StreamEvent) => void,
    onError?: (error: Error) => void,
    onComplete?: () => void
  ): Promise<() => void> {
    const url = `${this.apiUrl}/api/multi-way/${sessionId}/stream`;
    
    const eventSource = new EventSource(url);
    
    eventSource.onmessage = (event) => {
      try {
        // Handle different event types
        if (event.type === 'message') {
          // Default message type - might be generic
          onEvent({ type: 'system', message: event.data });
        }
      } catch (error) {
        console.error('Error parsing SSE message:', error);
        onError?.(error as Error);
      }
    };

    // Handle specific event types
    eventSource.addEventListener('speaker', (event) => {
      const [agentName, agentRole] = event.data.split(' (');
      onEvent({
        type: 'speaker_info',
        agent_name: agentName,
        agent_role: agentRole?.replace(')', '')
      });
    });

    eventSource.addEventListener('response_start', (event) => {
      onEvent({
        type: 'agent_response',
        agent_name: event.data,
        content: '' // Will be built up from chunks
      });
    });

    eventSource.addEventListener('chunk', (event) => {
      onEvent({
        type: 'agent_response',
        content: event.data
      });
    });

    eventSource.addEventListener('response_end', (event) => {
      onEvent({
        type: 'turn_complete',
        message: 'Response complete'
      });
    });

    eventSource.addEventListener('user_input', (event) => {
      onEvent({
        type: 'user_input_requested',
        questions: [event.data]
      });
    });

    eventSource.addEventListener('turn_complete', (event) => {
      onEvent({
        type: 'turn_complete',
        next_speaker_id: event.data
      });
    });

    eventSource.addEventListener('system', (event) => {
      onEvent({
        type: 'system',
        message: event.data
      });
    });

    eventSource.addEventListener('error', (event) => {
      onEvent({
        type: 'error',
        message: event.data
      });
    });

    eventSource.addEventListener('done', (event) => {
      eventSource.close();
      onComplete?.();
    });

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      onError?.(new Error('Connection error'));
    };

    // Return cleanup function
    return () => {
      eventSource.close();
    };
  }

  /**
   * Simple streaming method that returns an async iterator
   */
  async* streamConversationIterator(sessionId: string): AsyncGenerator<StreamEvent, void, unknown> {
    const url = `${this.apiUrl}/api/multi-way/${sessionId}/stream`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Failed to get response reader');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        // Process complete lines
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer
        
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            const eventType = line.substring(7);
            continue;
          }
          
          if (line.startsWith('data: ')) {
            const data = line.substring(6);
            
            // Create appropriate event based on the data
            if (data.includes('(') && data.includes(')')) {
              // Speaker info
              const [agentName, agentRole] = data.split(' (');
              yield {
                type: 'speaker_info',
                agent_name: agentName,
                agent_role: agentRole?.replace(')', '')
              };
            } else {
              // Chunk or other data
              yield {
                type: 'agent_response',
                content: data
              };
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}

// Export singleton instance
export const multiWayApiService = new MultiWayApiService();