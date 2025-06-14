import { Scene } from 'phaser';
import { apiService } from '@/lib/services/ApiService';

interface ConversationConfig {
  philosopher: {
    key: string;
    name: string;
  };
  userId?: string;
  userName?: string;
  isAuthenticated?: boolean;
}

export class ConversationSystem {
  private scene: Scene;
  private modal: Phaser.GameObjects.Container | null = null;
  private isActive: boolean = false;
  private messageHistory: string[] = [];
  private currentInput: string = '';
  private inputText: Phaser.GameObjects.Text | null = null;
  private responseText: Phaser.GameObjects.Text | null = null;
  private isLoading: boolean = false;

  constructor(scene: Scene) {
    this.scene = scene;
    this.setupKeyboardEvents();
  }

  private setupKeyboardEvents() {
    // Handle typing when conversation is active
    this.scene.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      if (!this.isActive || this.isLoading) return;

      if (event.key === 'Enter') {
        this.sendMessage();
      } else if (event.key === 'Backspace') {
        this.currentInput = this.currentInput.slice(0, -1);
        this.updateInputDisplay();
      } else if (event.key === 'Escape') {
        this.closeConversation();
      } else if (event.key.length === 1 && this.currentInput.length < 200) {
        // Add character to input
        this.currentInput += event.key;
        this.updateInputDisplay();
      }
    });
  }

  async startConversation(config: ConversationConfig) {
    if (this.isActive) return;

    this.isActive = true;
    this.currentInput = '';
    this.createConversationModal(config);
    
    // Show welcome message
    this.showPhilosopherResponse(
      `Hello ${config.userName || 'friend'}! I am ${config.philosopher.name}. What philosophical question would you like to explore together?`
    );
  }

  private createConversationModal(config: ConversationConfig) {
    const { width, height } = this.scene.cameras.main;
    
    this.modal = this.scene.add.container(width / 2, height / 2);
    this.modal.setScrollFactor(0);
    this.modal.setDepth(1000);

    // Semi-transparent background
    const overlay = this.scene.add.rectangle(0, 0, width, height, 0x000000, 0.8);
    overlay.setOrigin(0.5);

    // Main conversation panel
    const panelWidth = Math.min(800, width - 40);
    const panelHeight = Math.min(600, height - 40);
    
    const panel = this.scene.add.rectangle(0, 0, panelWidth, panelHeight, 0x2c3e50);
    const border = this.scene.add.rectangle(0, 0, panelWidth, panelHeight, 0xffffff, 0)
      .setStrokeStyle(3, 0x3498db);

    // Header with philosopher info
    const header = this.scene.add.rectangle(0, -panelHeight/2 + 40, panelWidth, 80, 0x34495e);
    const philosopherName = this.scene.add.text(0, -panelHeight/2 + 40, config.philosopher.name, {
      fontSize: '28px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5);

    const subtitle = this.scene.add.text(0, -panelHeight/2 + 65, 'Philosophical Conversation', {
      fontSize: '14px',
      color: '#bdc3c7',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5);

    // Response area
    const responseArea = this.scene.add.rectangle(0, -100, panelWidth - 40, 300, 0x34495e, 0.5)
      .setStrokeStyle(1, 0x7f8c8d);

    this.responseText = this.scene.add.text(0, -100, '', {
      fontSize: '16px',
      color: '#ecf0f1',
      fontFamily: 'Arial, sans-serif',
      align: 'left',
      wordWrap: { width: panelWidth - 80, useAdvancedWrap: true }
    }).setOrigin(0.5);

    // Input area
    const inputArea = this.scene.add.rectangle(0, 150, panelWidth - 40, 80, 0x34495e)
      .setStrokeStyle(2, 0x3498db);

    const inputLabel = this.scene.add.text(-panelWidth/2 + 30, 120, 'Your question:', {
      fontSize: '14px',
      color: '#bdc3c7',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0);

    this.inputText = this.scene.add.text(0, 150, '', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      align: 'center',
      wordWrap: { width: panelWidth - 80, useAdvancedWrap: true }
    }).setOrigin(0.5);

    // Instructions
    const instructions = this.scene.add.text(0, 220, 'Type your question and press ENTER to send | ESC to close', {
      fontSize: '12px',
      color: '#95a5a6',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5);

    // Status indicator
    const statusText = config.isAuthenticated 
      ? 'Conversation will be saved to your history'
      : 'Guest mode - conversation will not be saved';
    
    const status = this.scene.add.text(0, 240, statusText, {
      fontSize: '11px',
      color: config.isAuthenticated ? '#2ecc71' : '#f39c12',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5);

    // Add all elements to modal
    this.modal.add([
      overlay, panel, border, header, philosopherName, subtitle,
      responseArea, this.responseText, inputArea, inputLabel, 
      this.inputText, instructions, status
    ]);

    // Store config for later use
    this.modal.setData('config', config);
  }

  private updateInputDisplay() {
    if (!this.inputText) return;
    
    const displayText = this.currentInput + (this.currentInput.length < 200 ? '|' : '');
    this.inputText.setText(displayText);
  }

  private async sendMessage() {
    if (!this.currentInput.trim() || this.isLoading || !this.modal) return;

    const config = this.modal.getData('config') as ConversationConfig;
    const message = this.currentInput.trim();
    
    // Clear input
    this.currentInput = '';
    this.updateInputDisplay();
    
    // Show loading state
    this.isLoading = true;
    this.showPhilosopherResponse('Thinking...');

    try {
      // Send message to API
      const response = await apiService.sendMessage(
        { id: config.philosopher.key, name: config.philosopher.name },
        message,
        config.userId
      );

      // Show response
      this.showPhilosopherResponse(response);
      
      // Add to history
      this.messageHistory.push(`You: ${message}`);
      this.messageHistory.push(`${config.philosopher.name}: ${response}`);
      
      console.log('Conversation exchanged:', {
        philosopher: config.philosopher.name,
        userMessage: message.substring(0, 50) + '...',
        responseLength: response.length,
        isAuthenticated: config.isAuthenticated
      });
      
    } catch (error) {
      console.error('Failed to get response:', error);
      this.showPhilosopherResponse(
        `I apologize, but I'm having trouble connecting right now. Please try again in a moment.`
      );
    } finally {
      this.isLoading = false;
    }
  }

  private showPhilosopherResponse(response: string) {
    if (!this.responseText) return;
    
    // Simple typewriter effect
    this.responseText.setText('');
    let currentText = '';
    let charIndex = 0;
    
    const typewriterTimer = this.scene.time.addEvent({
      delay: 30,
      callback: () => {
        if (charIndex < response.length) {
          currentText += response[charIndex];
          this.responseText!.setText(currentText);
          charIndex++;
        } else {
          typewriterTimer.destroy();
        }
      },
      repeat: response.length - 1
    });
  }

  closeConversation() {
    if (!this.isActive || !this.modal) return;

    this.isActive = false;
    this.modal.destroy();
    this.modal = null;
    this.currentInput = '';
    this.inputText = null;
    this.responseText = null;
    this.isLoading = false;
    
    console.log('Conversation closed. History length:', this.messageHistory.length);
  }

  getConversationHistory(): string[] {
    return [...this.messageHistory];
  }

  isConversationActive(): boolean {
    return this.isActive;
  }
}