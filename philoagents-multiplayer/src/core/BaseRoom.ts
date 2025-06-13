import { Room, Client } from "colyseus";
import { Schema } from "@colyseus/schema";
import { GameConfig } from "../config/game.config";
import { PlayerJoinOptions, PlayerMovement, SpawnPosition, WorldBounds, PlayerEvents } from "../types/Player";

export abstract class BaseRoom<T extends Schema> extends Room<T> {
  protected gameConfig: GameConfig;
  protected worldBounds: WorldBounds;
  protected activePlugins: Map<string, any> = new Map();

  constructor() {
    super();
    this.gameConfig = this.getGameConfig();
    this.worldBounds = {
      minX: 0,
      maxX: this.gameConfig.worldBounds.width,
      minY: 0,
      maxY: this.gameConfig.worldBounds.height
    };
  }

  // Abstract methods that subclasses must implement
  protected abstract getGameConfig(): GameConfig;
  protected abstract createInitialState(): T;
  protected abstract handlePlayerJoin(client: Client, options: PlayerJoinOptions): void;
  protected abstract handlePlayerLeave(client: Client, consented: boolean): void;

  // Template methods with default implementations
  onCreate(options: any) {
    this.setState(this.createInitialState());
    this.setupMessageHandlers();
    this.setupGameLoop();
    
    console.log(`Room created: ${this.roomId} (${this.constructor.name})`);
  }

  onJoin(client: Client, options: PlayerJoinOptions) {
    console.log(`Player joining: ${client.sessionId}`);
    this.handlePlayerJoin(client, options);
    this.sendWelcomeMessage(client, options);
  }

  onLeave(client: Client, consented: boolean) {
    console.log(`Player leaving: ${client.sessionId}`);
    this.handlePlayerLeave(client, consented);
  }

  onDispose() {
    console.log(`Room disposed: ${this.roomId}`);
    this.cleanup();
  }

  // Default message handlers (can be overridden)
  protected setupMessageHandlers() {
    this.onMessage("player_move", (client, message: PlayerMovement) => {
      this.handlePlayerMove(client, message);
    });

    this.onMessage("player_chat", (client, message) => {
      this.handlePlayerChat(client, message);
    });

    this.onMessage("player_interact", (client, message) => {
      this.handlePlayerInteract(client, message);
    });

    this.onMessage("heartbeat", (client) => {
      this.handleHeartbeat(client);
    });
  }

  // Movement validation and handling
  protected handlePlayerMove(client: Client, movement: PlayerMovement) {
    if (!this.validateMovement(movement)) {
      console.warn(`Invalid movement from ${client.sessionId}:`, movement);
      return;
    }

    this.updatePlayerPosition(client.sessionId, movement);
  }

  protected validateMovement(movement: PlayerMovement): boolean {
    return (
      movement.x >= this.worldBounds.minX &&
      movement.x <= this.worldBounds.maxX &&
      movement.y >= this.worldBounds.minY &&
      movement.y <= this.worldBounds.maxY &&
      typeof movement.direction === 'string' &&
      ['front', 'back', 'left', 'right'].includes(movement.direction)
    );
  }

  // Spawn position generation with collision avoidance
  protected getSpawnPosition(): SpawnPosition {
    const centerX = this.gameConfig.worldBounds.width / 2;
    const centerY = this.gameConfig.worldBounds.height / 2;
    const radius = this.gameConfig.spawnRadius;

    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * radius;
      
      const x = Math.round(centerX + Math.cos(angle) * distance);
      const y = Math.round(centerY + Math.sin(angle) * distance);

      // Check if position is valid and not too close to other players
      if (this.isValidSpawnPosition({ x, y })) {
        return { x, y };
      }
      attempts++;
    }

    // Fallback to center if no valid position found
    return { x: centerX, y: centerY };
  }

  protected isValidSpawnPosition(position: SpawnPosition): boolean {
    const minDistance = 50; // Minimum distance between players
    
    // Check bounds
    if (position.x < this.worldBounds.minX || position.x > this.worldBounds.maxX ||
        position.y < this.worldBounds.minY || position.y > this.worldBounds.maxY) {
      return false;
    }

    // Check distance from other players (to be implemented by subclass)
    return this.checkDistanceFromOtherPlayers(position, minDistance);
  }

  // Game loop for periodic updates
  protected setupGameLoop() {
    if (this.gameConfig.updateRate > 0) {
      this.setSimulationInterval((deltaTime) => {
        this.gameUpdate(deltaTime);
      }, 1000 / this.gameConfig.updateRate);
    }

    // Cleanup inactive players
    this.setSimulationInterval(() => {
      this.cleanupInactivePlayers();
    }, 30000); // Every 30 seconds
  }

  protected gameUpdate(deltaTime: number) {
    // Override in subclasses for custom game logic
  }

  protected cleanupInactivePlayers() {
    const now = Date.now();
    const timeout = this.gameConfig.inactiveTimeout;

    // To be implemented by subclass based on their state structure
    this.performInactivePlayerCleanup(now, timeout);
  }

  // Utility methods for subclasses
  protected sendWelcomeMessage(client: Client, options: PlayerJoinOptions) {
    client.send("welcome", {
      playerId: client.sessionId,
      playerName: options.playerName || `Player_${client.sessionId.slice(0, 6)}`,
      roomId: this.roomId,
      totalPlayers: this.clients.length,
      worldBounds: this.worldBounds,
      gameConfig: {
        maxPlayers: this.gameConfig.maxPlayers,
        worldBounds: this.gameConfig.worldBounds
      }
    });
  }

  protected broadcastToOthers(client: Client, type: string, message: any) {
    this.clients.forEach(c => {
      if (c.sessionId !== client.sessionId) {
        c.send(type, message);
      }
    });
  }

  // Plugin system for extensibility
  protected loadPlugin(name: string, plugin: any) {
    this.activePlugins.set(name, plugin);
    if (plugin.onLoad) {
      plugin.onLoad(this);
    }
  }

  protected getPlugin(name: string) {
    return this.activePlugins.get(name);
  }

  // Abstract methods that subclasses should implement
  protected abstract updatePlayerPosition(sessionId: string, movement: PlayerMovement): void;
  protected abstract checkDistanceFromOtherPlayers(position: SpawnPosition, minDistance: number): boolean;
  protected abstract performInactivePlayerCleanup(now: number, timeout: number): void;
  
  // Optional event handlers (can be overridden)
  protected handlePlayerChat(client: Client, message: any) {
    // Default: broadcast chat to all players
    this.broadcast("player_chat", {
      playerId: client.sessionId,
      message: message.text,
      timestamp: Date.now()
    });
  }

  protected handlePlayerInteract(client: Client, message: any) {
    // Override in subclasses for custom interaction logic
    console.log(`Player ${client.sessionId} interacted:`, message);
  }

  protected handleHeartbeat(client: Client) {
    // Update last seen timestamp
    client.send("heartbeat_ack", { timestamp: Date.now() });
  }

  protected cleanup() {
    // Override in subclasses for custom cleanup
  }
}