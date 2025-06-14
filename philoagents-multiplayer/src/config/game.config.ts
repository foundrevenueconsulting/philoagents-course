import { config } from 'dotenv';
config();

export interface GameConfig {
  maxPlayers: number;
  worldBounds: { width: number; height: number };
  spawnRadius: number;
  inactiveTimeout: number;
  updateRate: number;
  enabledPlugins: string[];
}

export interface ServerConfig {
  port: number;
  corsOrigin: string;
  enableMonitor: boolean;
  enablePlayground: boolean;
  nodeEnv: string;
}

export interface DatabaseConfig {
  url: string;
  maxConnections: number;
  idleTimeout: number;
}

// Template-ready base configuration
export const baseGameConfig: GameConfig = {
  maxPlayers: parseInt(process.env.MAX_PLAYERS_PER_ROOM || '10'),
  worldBounds: {
    width: parseInt(process.env.WORLD_WIDTH || '1600'),
    height: parseInt(process.env.WORLD_HEIGHT || '1200')
  },
  spawnRadius: parseInt(process.env.SPAWN_RADIUS || '200'),
  inactiveTimeout: parseInt(process.env.INACTIVE_TIMEOUT_MS || '300000'),
  updateRate: 60, // FPS for game loop
  enabledPlugins: ['movement', 'chat'] // Extendable plugin system
};

export const serverConfig: ServerConfig = {
  port: parseInt(process.env.PORT || '2567'),
  corsOrigin: process.env.CORS_ORIGIN || '*',
  enableMonitor: process.env.ENABLE_MONITOR === 'true',
  enablePlayground: process.env.ENABLE_PLAYGROUND === 'true',
  nodeEnv: process.env.NODE_ENV || 'development'
};

export const databaseConfig: DatabaseConfig = {
  url: process.env.DATABASE_URL || 'postgresql://localhost:5432/philoagents_multiplayer',
  maxConnections: 20,
  idleTimeout: 30000
};

// Philosophy-specific configuration (extends base)
export const philosophyGameConfig: GameConfig = {
  ...baseGameConfig,
  maxPlayers: 10, // Philosophy discussions work better with smaller groups
  enabledPlugins: ['movement', 'philosophy-interaction'], // Custom plugin for philosopher NPCs
};