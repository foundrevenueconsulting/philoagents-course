import { Client } from "colyseus";
import { BaseRoom } from "../core/BaseRoom";
import { GameState, Player } from "../schema/GameState";
import { GameConfig, philosophyGameConfig } from "../config/game.config";
import { PlayerJoinOptions, PlayerMovement, SpawnPosition } from "../types/Player";

export class PhilosophyRoom extends BaseRoom<GameState> {
  
  protected getGameConfig(): GameConfig {
    return philosophyGameConfig;
  }

  protected createInitialState(): GameState {
    return new GameState("Philosophy Town", this.gameConfig.maxPlayers);
  }

  protected handlePlayerJoin(client: Client, options: PlayerJoinOptions): void {
    const playerName = options.playerName || `Philosopher_${client.sessionId.slice(0, 6)}`;
    const spawnPosition = this.getSpawnPosition();
    
    const player = new Player(
      client.sessionId,
      playerName,
      spawnPosition.x,
      spawnPosition.y
    );

    // Set avatar if provided
    if (options.avatar) {
      player.avatar = options.avatar;
    }

    // Add player to game state
    const success = this.state.addPlayer(player);
    
    if (!success) {
      client.error(1000, "Room is full");
      return;
    }

    console.log(`${playerName} joined Philosophy Town (${this.state.players.size}/${this.gameConfig.maxPlayers})`);
    
    // Notify other players
    this.broadcastToOthers(client, "player_joined", {
      playerId: client.sessionId,
      playerName: playerName,
      x: spawnPosition.x,
      y: spawnPosition.y,
      totalPlayers: this.state.players.size
    });
  }

  protected handlePlayerLeave(client: Client, consented: boolean): void {
    const player = this.state.getPlayer(client.sessionId);
    if (player) {
      const playerName = player.name;
      this.state.removePlayer(client.sessionId);
      
      console.log(`${playerName} left Philosophy Town`);
      
      // Notify remaining players
      this.broadcast("player_left", {
        playerId: client.sessionId,
        playerName: playerName,
        totalPlayers: this.state.players.size
      });
    }
  }

  protected updatePlayerPosition(sessionId: string, movement: PlayerMovement): void {
    const player = this.state.getPlayer(sessionId);
    if (!player) return;

    player.updatePosition(
      movement.x,
      movement.y,
      movement.direction,
      movement.isMoving
    );

    this.state.updateActivity();
  }

  protected checkDistanceFromOtherPlayers(position: SpawnPosition, minDistance: number): boolean {
    const players = Array.from(this.state.players.values());
    
    for (const player of players) {
      const distance = Math.sqrt(
        Math.pow(position.x - player.x, 2) + 
        Math.pow(position.y - player.y, 2)
      );
      
      if (distance < minDistance) {
        return false;
      }
    }
    
    return true;
  }

  protected performInactivePlayerCleanup(now: number, timeout: number): void {
    const playersToRemove: string[] = [];
    
    this.state.players.forEach((player, sessionId) => {
      if (now - player.lastUpdate > timeout) {
        playersToRemove.push(sessionId);
      }
    });

    playersToRemove.forEach(sessionId => {
      const player = this.state.getPlayer(sessionId);
      if (player) {
        console.log(`Cleaning up inactive player: ${player.name}`);
        this.state.removePlayer(sessionId);
        
        // Find the client and disconnect them
        const client = this.clients.find(c => c.sessionId === sessionId);
        if (client) {
          client.leave(1000, "Inactive timeout");
        }
      }
    });
  }

  // Philosophy-specific message handlers
  protected setupMessageHandlers(): void {
    // Call parent to setup base handlers
    super.setupMessageHandlers();

    // Add philosophy-specific handlers
    this.onMessage("philosopher_interact", (client, message) => {
      this.handlePhilosopherInteraction(client, message);
    });

    this.onMessage("thought_share", (client, message) => {
      this.handleThoughtShare(client, message);
    });

    this.onMessage("debate_request", (client, message) => {
      this.handleDebateRequest(client, message);
    });
  }

  // Philosophy-specific interaction handlers
  private handlePhilosopherInteraction(client: Client, message: any) {
    const player = this.state.getPlayer(client.sessionId);
    if (!player) return;

    // Philosophy-specific logic for interacting with NPC philosophers
    console.log(`${player.name} interacting with philosopher: ${message.philosopherId}`);
    
    // Broadcast to other players that someone is talking to a philosopher
    this.broadcastToOthers(client, "philosopher_interaction", {
      playerId: client.sessionId,
      playerName: player.name,
      philosopherId: message.philosopherId,
      x: player.x,
      y: player.y
    });
  }

  private handleThoughtShare(client: Client, message: any) {
    const player = this.state.getPlayer(client.sessionId);
    if (!player) return;

    // Share philosophical thoughts with nearby players
    const nearbyPlayers = this.getNearbyPlayers(player, 150); // 150px radius
    
    nearbyPlayers.forEach(nearbyPlayer => {
      const nearbyClient = this.clients.find(c => c.sessionId === nearbyPlayer.id);
      if (nearbyClient) {
        nearbyClient.send("thought_received", {
          from: player.name,
          thought: message.thought,
          category: message.category || 'general'
        });
      }
    });
  }

  private handleDebateRequest(client: Client, message: any) {
    const player = this.state.getPlayer(client.sessionId);
    if (!player) return;

    const targetPlayer = this.state.getPlayer(message.targetPlayerId);
    if (!targetPlayer) return;

    const targetClient = this.clients.find(c => c.sessionId === message.targetPlayerId);
    if (targetClient) {
      targetClient.send("debate_invitation", {
        from: player.name,
        fromId: client.sessionId,
        topic: message.topic,
        position: message.position
      });
    }
  }

  // Helper methods
  private getNearbyPlayers(centerPlayer: Player, radius: number): Player[] {
    const nearbyPlayers: Player[] = [];
    
    this.state.players.forEach((player, sessionId) => {
      if (sessionId === centerPlayer.id) return;
      
      const distance = Math.sqrt(
        Math.pow(centerPlayer.x - player.x, 2) + 
        Math.pow(centerPlayer.y - player.y, 2)
      );
      
      if (distance <= radius) {
        nearbyPlayers.push(player);
      }
    });
    
    return nearbyPlayers;
  }

  // Custom game loop for philosophy-specific features
  protected gameUpdate(deltaTime: number): void {
    // Update any philosophy-specific game state
    // For example: rotate philosopher NPCs, update thought bubbles, etc.
    
    // Check if room should auto-close (no players for extended period)
    if (this.state.players.size === 0) {
      const timeSinceLastActivity = Date.now() - this.state.lastActivity;
      if (timeSinceLastActivity > 300000) { // 5 minutes
        console.log(`Auto-closing empty Philosophy room: ${this.roomId}`);
        this.disconnect();
      }
    }
  }

  // Override chat handler for philosophy context
  protected handlePlayerChat(client: Client, message: any): void {
    const player = this.state.getPlayer(client.sessionId);
    if (!player) return;

    // Philosophy rooms might have different chat rules
    // e.g., thoughtful discussion, no spam, etc.
    
    const chatMessage = {
      playerId: client.sessionId,
      playerName: player.name,
      message: message.text,
      timestamp: Date.now(),
      type: message.type || 'general', // 'general', 'question', 'insight', etc.
      x: player.x, // Include position for proximity-based chat
      y: player.y
    };

    // Broadcast to all players in the room
    this.broadcast("player_chat", chatMessage);
    
    console.log(`[Philosophy Chat] ${player.name}: ${message.text}`);
  }

  onDispose(): void {
    console.log(`Philosophy room disposed: ${this.roomId}`);
    super.onDispose();
  }
}