import * as Sentry from "@sentry/browser";

class WebSocketApiService {
  constructor() {
    // Initialize connection-related properties
    this.initializeConnectionProperties();
    
    // Set up WebSocket URL based on environment
    this.baseUrl = this.determineWebSocketBaseUrl();
  }

  initializeConnectionProperties() {
    this.socket = null;
    this.messageCallbacks = new Map();
    this.connected = false;
    this.connectionPromise = null;
    this.connectionTimeout = 10000;
  }

  determineWebSocketBaseUrl() {
    // Use global variable defined by webpack
    const apiUrl = API_URL;
    
    // Convert HTTP(S) URL to WebSocket URL
    return apiUrl.replace(/^https?:/, apiUrl.startsWith('https:') ? 'wss:' : 'ws:');
  }

  connect() {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        if (this.socket) {
          this.socket.close();
        }
        this.connectionPromise = null;
        reject(new Error('WebSocket connection timeout'));
      }, this.connectionTimeout);

      this.socket = new WebSocket(`${this.baseUrl}/ws/chat`);
      
      this.socket.onopen = () => {
        console.log('WebSocket connection established');
        this.connected = true;
        clearTimeout(timeoutId);
        resolve();
      };

      this.socket.onmessage = this.handleMessage.bind(this);

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        Sentry.captureException(error, {
          tags: {
            service: 'WebSocketApiService',
            method: 'connect'
          }
        });
        clearTimeout(timeoutId);
        this.connectionPromise = null;
        reject(error);
      };

      this.socket.onclose = () => {
        console.log('WebSocket connection closed');
        this.connected = false;
        this.connectionPromise = null;
      };
    });

    return this.connectionPromise;
  }

  handleMessage(event) {
    const data = JSON.parse(event.data);
    
    if (data.error) {
      console.error('WebSocket error:', data.error);
      Sentry.captureMessage(data.error, {
        level: 'error',
        tags: {
          service: 'WebSocketApiService',
          method: 'handleMessage'
        }
      });
      return;
    }
    
    if (data.streaming !== undefined) {
      this.handleStreamingUpdate(data.streaming);
      return;
    }
    
    if (data.chunk) {
      this.triggerCallback('chunk', data.chunk);
      return;
    }
    
    if (data.response) {
      this.triggerCallback('message', data.response);
    }
  }

  handleStreamingUpdate(isStreaming) {
    const streamingCallback = this.messageCallbacks.get('streaming');
    if (streamingCallback) {
      streamingCallback(isStreaming);
    }
  }

  triggerCallback(type, data) {
    const callback = this.messageCallbacks.get(type);
    if (callback) {
      callback(data);
    }
  }

  async sendMessage(philosopher, message, callbacks = {}) {
    try {
      if (!this.connected) {
        await this.connect();
      }

      this.registerCallbacks(callbacks);

      this.socket.send(JSON.stringify({
        message: message,
        philosopher_id: philosopher.id
      }));
    } catch (error) {
      console.error('Error sending message via WebSocket:', error);
      Sentry.captureException(error, {
        tags: {
          service: 'WebSocketApiService',
          method: 'sendMessage'
        },
        extra: {
          philosopher: philosopher.id,
          message: message
        }
      });
      return this.getFallbackResponse();
    }
  }

  registerCallbacks(callbacks) {
    if (callbacks.onMessage) {
      this.messageCallbacks.set('message', callbacks.onMessage);
    }
    
    if (callbacks.onStreamingStart) {
      this.messageCallbacks.set('streaming', (isStreaming) => {
        if (isStreaming) {
          callbacks.onStreamingStart();
        } else if (callbacks.onStreamingEnd) {
          callbacks.onStreamingEnd();
        }
      });
    }
    
    if (callbacks.onChunk) {
      this.messageCallbacks.set('chunk', callbacks.onChunk);
    }
  }

  getFallbackResponse() {
    return "I'm so tired right now, I can't talk. I'm going to sleep now.";
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.connected = false;
      this.connectionPromise = null;
      this.messageCallbacks.clear();
    }
  }
}

export default new WebSocketApiService(); 