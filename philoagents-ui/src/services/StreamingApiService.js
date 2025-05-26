class StreamingApiService {
  constructor() {
    // Use global variable defined by webpack
    this.apiUrl = API_URL;
  }

  async sendMessage(philosopher, message, callbacks = {}) {
    try {
      // Try streaming first
      return await this.sendStreamingMessage(philosopher, message, callbacks);
    } catch (error) {
      console.warn('Streaming failed, falling back to regular API:', error);
      // Fallback to regular API
      return await this.sendRegularMessage(philosopher, message);
    }
  }

  async sendStreamingMessage(philosopher, message, callbacks = {}) {
    const url = `${this.apiUrl}/api/chat/stream`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message,
        philosopher_id: philosopher.id
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let isStreaming = false;
    let fullResponse = '';
    let currentEventType = null;

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEventType = line.substring(7).trim();
            continue;
          }
          
          if (line.startsWith('data: ')) {
            const data = line.substring(6);
            
            if (currentEventType === 'streaming') {
              const streaming = data === 'true';
              isStreaming = streaming;
              
              if (streaming && callbacks.onStreamingStart) {
                callbacks.onStreamingStart();
              } else if (!streaming && callbacks.onStreamingEnd) {
                callbacks.onStreamingEnd();
              }
            } else if (currentEventType === 'chunk') {
              fullResponse += data;
              if (callbacks.onChunk) {
                callbacks.onChunk(data);
              }
            } else if (currentEventType === 'complete') {
              if (callbacks.onMessage) {
                callbacks.onMessage();
              }
              break;
            } else if (currentEventType === 'error') {
              throw new Error(data);
            }
          }
        }
      }
      
      return fullResponse;
      
    } finally {
      reader.releaseLock();
    }
  }

  async sendRegularMessage(philosopher, message) {
    const url = `${this.apiUrl}/api/chat`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message,
        philosopher_id: philosopher.id
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.response;
  }

  getFallbackResponse(philosopher) {
    return `I'm sorry, ${philosopher.name || 'the philosopher'} is unavailable at the moment. Please try again later.`;
  }

  async resetMemory() {
    try {
      const response = await fetch(`${this.apiUrl}/api/reset-memory`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to reset memory');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error resetting memory:', error);
      throw error;
    }
  }
}

export default new StreamingApiService();