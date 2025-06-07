import * as Sentry from "@sentry/browser";

class ApiService {
  constructor() {
    // Use global variable defined by webpack
    this.apiUrl = API_URL;
  }

  async request(endpoint, method, data) {
    const url = `${this.apiUrl}${endpoint}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    };

    const response = await fetch(url, options);
    
    if (!response.ok) {
      const error = new Error(`API error: ${response.status} ${response.statusText}`);
      Sentry.captureException(error, {
        tags: {
          service: 'ApiService',
          method: 'request'
        },
        extra: {
          url: url,
          status: response.status,
          statusText: response.statusText
        }
      });
      throw error;
    }
    
    return response.json();
  }

  async sendMessage(philosopher, message) {
    try {
      const data = await this.request('/api/chat', 'POST', {
        message,
        philosopher_id: philosopher.id
      });
      
      return data.response;
    } catch (error) {
      console.error('Error sending message to API:', error);
      Sentry.captureException(error, {
        tags: {
          service: 'ApiService',
          method: 'sendMessage'
        },
        extra: {
          philosopher: philosopher.id,
          message: message
        }
      });
      return this.getFallbackResponse(philosopher);
    }
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
      Sentry.captureException(error, {
        tags: {
          service: 'ApiService',
          method: 'resetMemory'
        }
      });
      throw error;
    }
  }
}

export default new ApiService(); 