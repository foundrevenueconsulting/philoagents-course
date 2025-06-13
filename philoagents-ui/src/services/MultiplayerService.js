import { Client } from 'colyseus.js';

export class MultiplayerService {
    constructor() {
        this.client = null;
        this.room = null;
        this.isConnected = false;
        this.localPlayerId = null;
        this.gameCallbacks = {
            onPlayerJoined: null,
            onPlayerLeft: null,
            onPlayerMoved: null,
            onGameEvent: null,
            onStateChange: null,
            onError: null
        };
        
        this.serverUrl = process.env.COLYSEUS_SERVER_URL || 'ws://localhost:2567';
    }

    async connect() {
        try {
            console.log(`🔌 MultiplayerService: Creating client for ${this.serverUrl}`);
            console.log(`   └─ Server URL type: ${typeof this.serverUrl}`);
            console.log(`   └─ Server URL value: ${JSON.stringify(this.serverUrl)}`);
            
            // Ensure we have a valid string URL
            if (typeof this.serverUrl !== 'string') {
                throw new Error(`Invalid server URL type: ${typeof this.serverUrl}`);
            }
            
            this.client = new Client(this.serverUrl);
            console.log('✅ MultiplayerService: Client created successfully');
            console.log(`   └─ Client type: ${typeof this.client}`);
            return true;
        } catch (error) {
            console.error('❌ Failed to create Colyseus client:', error);
            console.error('   └─ Error type:', typeof error);
            console.error('   └─ Error message:', error.message);
            this.handleError('Failed to create client', error);
            return false;
        }
    }

    async joinRoom(playerName, characterType = 'sophia') {
        if (!this.client) {
            console.log('🔗 No client exists, creating new connection...');
            const connected = await this.connect();
            if (!connected) return false;
        }

        try {
            console.log(`🚪 Attempting to join room 'philosophy_room'`);
            console.log(`   └─ Player: ${playerName}`);
            console.log(`   └─ Character: ${characterType}`);
            console.log(`   └─ Server: ${this.serverUrl}`);
            
            // Add error catching for the join operation itself
            this.room = await this.client.joinOrCreate('philosophy_room', {
                playerName: playerName,
                characterType: characterType
            });

            this.localPlayerId = this.room.sessionId;
            this.isConnected = true;
            
            console.log(`✅ Successfully joined room!`);
            console.log(`   └─ Session ID: ${this.localPlayerId}`);
            console.log(`   └─ Room ID: ${this.room.id}`);
            console.log(`   └─ Room name: ${this.room.name}`);
            console.log(`   └─ Room state available:`, !!this.room.state);
            
            // Add a global error handler for the room
            this.addGlobalErrorHandlers();
            
            this.setupRoomEventHandlers();
            return true;
            
        } catch (error) {
            console.error('❌ Failed to join room:', error);
            console.error('   └─ Error details:', error.message);
            console.error('   └─ Stack:', error.stack);
            this.handleError('Failed to join room', error);
            return false;
        }
    }

    addGlobalErrorHandlers() {
        // Add error handling for WebSocket-level issues
        if (this.room && this.room.connection) {
            const originalOnError = this.room.connection.onerror;
            this.room.connection.onerror = (event) => {
                console.error('🔥 WebSocket error detected:', event);
                if (originalOnError) originalOnError.call(this.room.connection, event);
            };

            const originalOnMessage = this.room.connection.onmessage;
            this.room.connection.onmessage = (event) => {
                try {
                    console.log('📡 Raw WebSocket message received:', event.data);
                    if (originalOnMessage) originalOnMessage.call(this.room.connection, event);
                } catch (error) {
                    console.error('🔥 Error processing WebSocket message:', error);
                    console.error('   └─ Message data:', event.data);
                    throw error;
                }
            };
        }

        // Add global error handler for uncaught exceptions during schema decode
        const originalOnError = window.onerror;
        window.onerror = (message, source, lineno, colno, error) => {
            if (message && message.includes && message.includes('refId')) {
                console.error('🔥 Schema decode error caught globally:', {
                    message, source, lineno, colno, error
                });
            }
            if (originalOnError) originalOnError(message, source, lineno, colno, error);
        };
    }

    setupRoomEventHandlers() {
        if (!this.room) {
            console.log('⚠️ Cannot setup handlers: no room available');
            return;
        }

        console.log('🎯 Setting up room event handlers...');

        // Handle state changes - set up player handlers when state is first received
        this.room.onStateChange.once((state) => {
            console.log('🎊 Initial room state received!');
            console.log('   └─ State type:', typeof state);
            console.log('   └─ State keys:', state ? Object.keys(state) : 'null');
            console.log('   └─ Players available:', state && state.players ? 'YES' : 'NO');
            console.log('   └─ Full state:', state);
            
            this.setupPlayerEventHandlers(state);
            if (this.gameCallbacks.onStateChange) {
                this.gameCallbacks.onStateChange(state);
            }
        });

        // Handle subsequent state changes
        this.room.onStateChange((state) => {
            console.log('🔄 Room state updated');
            if (this.gameCallbacks.onStateChange) {
                this.gameCallbacks.onStateChange(state);
            }
        });

        // Handle custom game events
        this.room.onMessage('game_event', (message) => {
            console.log('📨 Received game event:', message);
            if (this.gameCallbacks.onGameEvent) {
                this.gameCallbacks.onGameEvent(message);
            }
        });

        // Handle room errors
        this.room.onError((code, message) => {
            console.error(`💥 Room error ${code}: ${message}`);
            this.handleError('Room error', { code, message });
        });

        // Handle disconnection
        this.room.onLeave((code) => {
            console.log(`👋 Left room with code: ${code}`);
            this.isConnected = false;
            this.room = null;
        });

        console.log('✅ Room event handlers setup complete');
    }

    setupPlayerEventHandlers(state) {
        console.log('👥 Setting up player event handlers...');
        
        if (!state) {
            console.error('❌ Cannot setup player handlers: state is null/undefined');
            return;
        }
        
        if (!state.players) {
            console.error('❌ Cannot setup player handlers: state.players is null/undefined');
            console.log('   └─ Available state properties:', Object.keys(state));
            return;
        }

        console.log('✅ State and players available, setting up handlers');
        console.log(`   └─ Current players count: ${state.players.size || 'unknown'}`);

        try {
            // Handle player joining
            state.players.onAdd((player, key) => {
                console.log(`👤 Player joined: ${key}`);
                console.log('   └─ Player data:', player);
                if (this.gameCallbacks.onPlayerJoined) {
                    this.gameCallbacks.onPlayerJoined(key, player);
                }
            });

            // Handle player leaving  
            state.players.onRemove((player, key) => {
                console.log(`👋 Player left: ${key}`);
                console.log('   └─ Player data:', player);
                if (this.gameCallbacks.onPlayerLeft) {
                    this.gameCallbacks.onPlayerLeft(key, player);
                }
            });

            // Handle player changes (movement, etc.)
            state.players.onChange((player, key) => {
                console.log(`🏃 Player moved: ${key}`);
                console.log('   └─ Player data:', player);
                if (key !== this.localPlayerId && this.gameCallbacks.onPlayerMoved) {
                    this.gameCallbacks.onPlayerMoved(key, player);
                }
            });
            
            console.log('✅ Player event handlers setup complete');
            
        } catch (error) {
            console.error('💥 Error setting up player handlers:', error);
            console.error('   └─ Error message:', error.message);
            console.error('   └─ Stack:', error.stack);
        }
    }

    // Send player position update
    sendPlayerUpdate(x, y, animation = null, direction = null) {
        if (!this.room || !this.isConnected) return;

        try {
            this.room.send('player_update', {
                x: x,
                y: y,
                animation: animation,
                direction: direction,
                timestamp: Date.now()
            });
        } catch (error) {
            console.error('Failed to send player update:', error);
        }
    }

    // Send philosopher interaction event
    sendPhilosopherInteraction(philosopherId, action = 'start') {
        if (!this.room || !this.isConnected) return;

        try {
            this.room.send('philosopher_interaction', {
                philosopherId: philosopherId,
                action: action, // 'start', 'end', 'queue'
                timestamp: Date.now()
            });
        } catch (error) {
            console.error('Failed to send philosopher interaction:', error);
        }
    }

    // Send chat message
    sendChatMessage(message) {
        if (!this.room || !this.isConnected) return;

        try {
            this.room.send('chat_message', {
                message: message,
                timestamp: Date.now()
            });
        } catch (error) {
            console.error('Failed to send chat message:', error);
        }
    }

    // Leave the room
    async leaveRoom() {
        if (this.room) {
            try {
                await this.room.leave();
                console.log('Successfully left room');
            } catch (error) {
                console.error('Error leaving room:', error);
            }
        }
        
        this.room = null;
        this.isConnected = false;
        this.localPlayerId = null;
    }

    // Disconnect from server
    disconnect() {
        this.leaveRoom();
        if (this.client) {
            this.client = null;
        }
    }

    // Event callback setters
    onPlayerJoined(callback) {
        this.gameCallbacks.onPlayerJoined = callback;
    }

    onPlayerLeft(callback) {
        this.gameCallbacks.onPlayerLeft = callback;
    }

    onPlayerMoved(callback) {
        this.gameCallbacks.onPlayerMoved = callback;
    }

    onGameEvent(callback) {
        this.gameCallbacks.onGameEvent = callback;
    }

    onStateChange(callback) {
        this.gameCallbacks.onStateChange = callback;
    }

    onError(callback) {
        this.gameCallbacks.onError = callback;
    }

    // Error handling
    handleError(context, error) {
        const errorInfo = {
            context: context,
            error: error,
            timestamp: Date.now()
        };
        
        console.error('MultiplayerService Error:', errorInfo);
        
        if (this.gameCallbacks.onError) {
            this.gameCallbacks.onError(errorInfo);
        }
    }

    // Utility methods
    isInRoom() {
        return this.isConnected && this.room !== null;
    }

    getLocalPlayerId() {
        return this.localPlayerId;
    }

    getRoomState() {
        return this.room ? this.room.state : null;
    }

    getPlayerCount() {
        if (!this.room || !this.room.state) return 0;
        return Object.keys(this.room.state.players).length;
    }

    // Get list of available characters (could be extended later)
    getAvailableCharacters() {
        return [
            'sophia', 'aristotle', 'socrates', 'plato', 'descartes',
            'ada', 'turing', 'chomsky', 'dennett'
        ];
    }
}

// Export singleton instance
export const multiplayerService = new MultiplayerService();