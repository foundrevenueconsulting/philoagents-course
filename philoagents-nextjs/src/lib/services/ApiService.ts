import { 
  ConversationRequest, 
  ConversationResponse, 
  ConversationHistoryItem
} from '@/types/api';
import { WindowUtils, ApiResponseHandler, TypeSafeConverter } from '@/utils/TypeSafeConverters';

export class ApiService {
  private apiUrl: string;

  constructor() {
    this.apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  }

  private async request<T>(
    endpoint: string, 
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', 
    data?: Record<string, unknown>,
    dataValidator?: (data: unknown) => T
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
      return await ApiResponseHandler.handleResponse(response, dataValidator);
    } catch (error) {
      console.error('API request failed:', { url, method, error });
      
      // Use type-safe error reporting
      WindowUtils.captureException(error, {
        tags: {
          service: 'ApiService',
          method: 'request'
        },
        extra: {
          url,
          method,
          endpoint
        }
      });
      
      throw error;
    }
  }

  async sendMessage(
    philosopher: { id: string; name: string }, 
    message: string,
    userId?: string
  ): Promise<string> {
    try {
      console.log('Sending message to philosopher:', {
        philosopher: philosopher.id,
        message: message.substring(0, 50) + '...',
        userId
      });

      const requestData: ConversationRequest = {
        message,
        philosopher_id: philosopher.id,
        user_id: userId
      };

      const data = await this.request<ConversationResponse>('/chat', 'POST', requestData as unknown as Record<string, unknown>);
      
      console.log('Received response from API:', {
        philosopher: data.philosopher_id,
        responseLength: data.response.length,
        timestamp: data.timestamp
      });
      
      return data.response;
    } catch (error) {
      console.error('Error sending message to API:', error);
      
      // Use type-safe error reporting
      WindowUtils.captureException(error, {
        tags: {
          service: 'ApiService',
          method: 'sendMessage'
        },
        extra: {
          philosopher: philosopher.id,
          message: message.substring(0, 100),
          userId
        }
      });
      
      return this.getFallbackResponse(philosopher);
    }
  }

  async sendStreamingMessage(
    philosopher: { id: string; name: string },
    message: string,
    userId?: string,
    onChunk?: (chunk: string) => void
  ): Promise<string> {
    try {
      const url = `${this.apiUrl}/chat/stream`;
      const requestData: ConversationRequest = {
        message,
        philosopher_id: philosopher.id,
        user_id: userId
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Failed to get response reader');
      }

      let fullResponse = '';
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          fullResponse += chunk;
          
          if (onChunk) {
            onChunk(chunk);
          }
        }
      } finally {
        reader.releaseLock();
      }

      return fullResponse;
    } catch (error) {
      console.error('Error with streaming message:', error);
      // Fall back to regular message if streaming fails
      return this.sendMessage(philosopher, message, userId);
    }
  }

  private getFallbackResponse(philosopher: { name: string }): string {
    const fallbackResponses = [
      `I apologize, but I'm having trouble connecting right now. Please try again in a moment.`,
      `It seems there's a temporary issue with our conversation. Let's try again shortly.`,
      `I'm experiencing some difficulties at the moment. Please be patient and try again.`
    ];
    
    const randomResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    return `${philosopher.name}: ${randomResponse}`;
  }

  async resetMemory(userId?: string): Promise<{ success: boolean; message: string }> {
    try {
      const data = await this.request<{ success: boolean; message: string }>(
        '/reset-memory', 
        'POST', 
        userId ? { user_id: userId } : undefined
      );
      
      console.log('Memory reset successful:', data);
      return data;
    } catch (error) {
      console.error('Error resetting memory:', error);
      
      WindowUtils.captureException(error, {
        tags: {
          service: 'ApiService',
          method: 'resetMemory'
        },
        extra: { userId }
      });
      
      throw error;
    }
  }

  async getConversationHistory(userId: string, philosopherId?: string): Promise<ConversationHistoryItem[]> {
    try {
      // Construct endpoint with query parameter for philosopher_id if provided
      let endpoint = `/conversations/${userId}`;
      if (philosopherId) {
        endpoint += `?philosopher_id=${encodeURIComponent(philosopherId)}`;
      }
        
      const rawData = await this.request<unknown[]>(endpoint, 'GET');
      return TypeSafeConverter.toTypedArray(
        rawData, 
        TypeSafeConverter.toConversationHistoryItem,
        'conversation history'
      );
    } catch (error) {
      console.error('Error getting conversation history:', error);
      return [];
    }
  }

  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      return await this.request<{ status: string; timestamp: string }>('/health', 'GET');
    } catch (error) {
      console.error('API health check failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const apiService = new ApiService();