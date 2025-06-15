import { Client, Room } from 'colyseus.js';
import { WindowUtils } from '@/utils/TypeSafeConverters';

interface GameCallbacks {
  onPlayerJoined?: (playerId: string, playerData: Record<string, unknown>) => void;
  onPlayerLeft?: (playerId: string, playerData: Record<string, unknown>) => void;
  onPlayerMoved?: (playerId: string, playerData: Record<string, unknown>) => void;
  onGameEvent?: (event: Record<string, unknown>) => void;
  onStateChange?: (state: Record<string, unknown>) => void;
  onError?: (error: string) => void;
}

interface JoinRoomOptions {
  playerName: string;
  characterType?: string;
  userId?: string;
}

export class MultiplayerService {
  private client: Client | null = null;
  private room: Room | null = null;
  private isConnected: boolean = false;
  private localPlayerId: string | null = null;
  private gameCallbacks: GameCallbacks = {};
  private serverUrl: string;

  constructor() {
    this.serverUrl = process.env.NEXT_PUBLIC_MULTIPLAYER_URL || 'ws://localhost:2567';
    // console.log('MultiplayerService initialized with URL:', this.serverUrl);
  }

  setCallbacks(callbacks: GameCallbacks) {
    this.gameCallbacks = { ...this.gameCallbacks, ...callbacks };
  }

  async connect(): Promise<boolean> {
    try {
      // console.log('🔌 Connecting to multiplayer server:', this.serverUrl);
      
      if (typeof this.serverUrl !== 'string') {
        throw new Error(`Invalid server URL type: ${typeof this.serverUrl}`);
      }
      
      this.client = new Client(this.serverUrl);
      // console.log('✅ Multiplayer client created successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to create Colyseus client:', error);
      this.handleError('Failed to create client', error);
      return false;
    }
  }

  async joinRoom(options: JoinRoomOptions): Promise<boolean> {
    if (!this.client) {
      // console.log('🔗 No client exists, creating new connection...');
      const connected = await this.connect();
      if (!connected) return false;
    }

    try {
      // console.log('🚪 Attempting to join philosophy room with options:', options);
      
      const roomOptions = {
        playerName: options.playerName,
        characterType: options.characterType || 'sophia',
        userId: options.userId || 'anonymous'
      };

      this.room = await this.client!.joinOrCreate('philosophy_room', roomOptions);
      this.isConnected = true;
      this.localPlayerId = this.room.sessionId;

      // console.log('🎉 Successfully joined room:', {
      //   roomId: this.room.roomId,
      //   sessionId: this.room.sessionId,
      //   playerName: options.playerName
      // });

      this.setupRoomEventHandlers();
      return true;
    } catch (error) {
      console.error('❌ Failed to join room:', error);
      this.handleError('Failed to join room', error);
      return false;
    }
  }

  private setupRoomEventHandlers() {
    if (!this.room) return;

    // Handle state changes
    this.room.onStateChange((state) => {
      // console.log('📊 Room state changed:', state);
      this.gameCallbacks.onStateChange?.(state);
    });

    // Handle player join
    this.room.state.players?.onAdd?.((player: Record<string, unknown>, playerId: string) => {
      // console.log('👋 Player joined:', { playerId, playerData: player });
      
      if (playerId !== this.localPlayerId) {
        this.gameCallbacks.onPlayerJoined?.(playerId, player);
      }
    });

    // Handle player leave
    this.room.state.players?.onRemove?.((player: Record<string, unknown>, playerId: string) => {
      // console.log('👋 Player left:', { playerId, playerData: player });
      this.gameCallbacks.onPlayerLeft?.(playerId, player);
    });

    // Handle player movement
    this.room.state.players?.onChange?.((player: Record<string, unknown>, playerId: string) => {
      if (playerId !== this.localPlayerId) {
        this.gameCallbacks.onPlayerMoved?.(playerId, player);
      }
    });

    // Handle custom game events
    this.room.onMessage('gameEvent', (event) => {
      // console.log('🎮 Game event received:', event);
      this.gameCallbacks.onGameEvent?.(event);
    });

    // Handle room errors
    this.room.onError((code, message) => {
      console.error('🚨 Room error:', { code, message });
      this.handleError(`Room error (${code})`, new Error(message));
    });

    // Handle room leave
    this.room.onLeave((code) => {
      // console.log('🚪 Left room with code:', code);
      this.isConnected = false;
      this.localPlayerId = null;
    });
  }

  sendPlayerMovement(x: number, y: number, direction?: string, isMoving?: boolean) {
    if (!this.room || !this.isConnected) {
      console.warn('⚠️ Cannot send movement: not connected to room');
      return;
    }

    try {
      this.room.send('playerMovement', {
        x,
        y,
        direction: direction || 'front',
        isMoving: isMoving || false,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('❌ Failed to send player movement:', error);
    }
  }

  sendChatMessage(message: string, messageType: string = 'general') {
    if (!this.room || !this.isConnected) {
      console.warn('⚠️ Cannot send chat message: not connected to room');
      return;
    }

    try {
      this.room.send('chatMessage', {
        message,
        messageType,
        timestamp: Date.now()
      });
      
      // console.log('💬 Chat message sent:', { message, messageType });
    } catch (error) {
      console.error('❌ Failed to send chat message:', error);
    }
  }

  sendGameEvent(eventType: string, data: Record<string, unknown> = {}) {
    if (!this.room || !this.isConnected) {
      console.warn('⚠️ Cannot send game event: not connected to room');
      return;
    }

    try {
      this.room.send('gameEvent', {
        eventType,
        data,
        timestamp: Date.now()
      });
      
      // console.log('🎮 Game event sent:', { eventType, data });
    } catch (error) {
      console.error('❌ Failed to send game event:', error);
    }
  }

  async leaveRoom(): Promise<void> {
    if (this.room) {
      try {
        // console.log('🚪 Leaving multiplayer room...');
        await this.room.leave();
        this.room = null;
        this.isConnected = false;
        this.localPlayerId = null;
        // console.log('✅ Successfully left room');
      } catch (error) {
        console.error('❌ Error leaving room:', error);
      }
    }
  }

  disconnect() {
    this.leaveRoom();
    this.client = null;
    this.gameCallbacks = {};
    // console.log('🔌 Disconnected from multiplayer service');
  }

  private handleError(context: string, error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`MultiplayerService Error [${context}]:`, errorMessage);
    
    this.gameCallbacks.onError?.(errorMessage);
    
    // Use type-safe error reporting
    WindowUtils.captureException(error, {
      tags: {
        service: 'MultiplayerService',
        context
      }
    });
  }

  // Getters
  get connected(): boolean {
    return this.isConnected;
  }

  get playerId(): string | null {
    return this.localPlayerId;
  }

  get roomId(): string | null {
    return this.room?.roomId || null;
  }

  get playerCount(): number {
    return this.room?.state?.players?.size || 0;
  }

  getPlayers(): Array<Record<string, unknown> & { playerId: string }> {
    if (!this.room?.state?.players) return [];
    
    const players: Array<Record<string, unknown> & { playerId: string }> = [];
    this.room.state.players.forEach((player: Record<string, unknown>, playerId: string) => {
      players.push({ ...player, playerId });
    });
    
    return players;
  }
}

// Export singleton instance
export const multiplayerService = new MultiplayerService();