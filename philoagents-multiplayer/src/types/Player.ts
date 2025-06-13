export interface PlayerData {
  id: string;
  name: string;
  x: number;
  y: number;
  direction: PlayerDirection;
  isMoving: boolean;
  lastUpdate: number;
  metadata?: Record<string, any>;
}

export type PlayerDirection = 'front' | 'back' | 'left' | 'right';

export interface PlayerMovement {
  x: number;
  y: number;
  direction: PlayerDirection;
  isMoving: boolean;
  timestamp?: number;
}

export interface PlayerJoinOptions {
  playerName?: string;
  avatar?: string;
  metadata?: Record<string, any>;
}

export interface SpawnPosition {
  x: number;
  y: number;
}

export interface WorldBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

// Events that players can emit
export type PlayerEvents = 
  | 'player_move'
  | 'player_chat'
  | 'player_interact'
  | 'player_ready';

// Server events sent to players
export type ServerEvents = 
  | 'welcome'
  | 'player_joined'
  | 'player_left'
  | 'player_moved'
  | 'game_state_update'
  | 'error';