import { Schema, MapSchema, type } from "@colyseus/schema";
import { PlayerDirection } from "../types/Player";

export class Player extends Schema {
  @type("string") id: string;
  @type("string") name: string;
  @type("number") x: number;
  @type("number") y: number;
  @type("string") direction: PlayerDirection = "front";
  @type("boolean") isMoving: boolean = false;
  @type("number") lastUpdate: number;
  @type("string") avatar?: string;

  constructor(id: string, name: string, x: number = 400, y: number = 400) {
    super();
    this.id = id;
    this.name = name;
    this.x = x;
    this.y = y;
    this.lastUpdate = Date.now();
  }

  updatePosition(x: number, y: number, direction: PlayerDirection, isMoving: boolean) {
    this.x = x;
    this.y = y;
    this.direction = direction;
    this.isMoving = isMoving;
    this.lastUpdate = Date.now();
  }
}

export class GameState extends Schema {
  @type({ map: Player }) players = new MapSchema<Player>();
  @type("number") maxPlayers: number = 10;
  @type("string") roomName: string = "Game Room";
  @type("number") createdAt: number;
  @type("boolean") isActive: boolean = true;
  @type("number") lastActivity: number;

  constructor(roomName: string = "Game Room", maxPlayers: number = 10) {
    super();
    this.roomName = roomName;
    this.maxPlayers = maxPlayers;
    this.createdAt = Date.now();
    this.lastActivity = Date.now();
  }

  addPlayer(player: Player): boolean {
    if (this.players.size >= this.maxPlayers) {
      return false;
    }
    
    this.players.set(player.id, player);
    this.updateActivity();
    return true;
  }

  removePlayer(playerId: string): boolean {
    const removed = this.players.delete(playerId);
    if (removed) {
      this.updateActivity();
    }
    return removed;
  }

  getPlayer(playerId: string): Player | undefined {
    return this.players.get(playerId);
  }

  updateActivity() {
    this.lastActivity = Date.now();
  }

  getActivePlayers(): Player[] {
    const now = Date.now();
    const activeThreshold = 60000; // 1 minute
    
    const activePlayers: Player[] = [];
    this.players.forEach((player) => {
      if (now - player.lastUpdate < activeThreshold) {
        activePlayers.push(player);
      }
    });
    
    return activePlayers;
  }
}