/**
 * Phaser-specific type definitions for PhiloAgents
 * Provides type safety for Phaser game objects and interactions
 */

import * as Phaser from 'phaser';

// Character Configuration
export interface CharacterConfig {
  id: string;
  name: string;
  spawnPoint: { x: number; y: number };
  atlas: string;
  defaultDirection?: 'front' | 'back' | 'left' | 'right';
  defaultMessage?: string;
  canRoam?: boolean;
  moveSpeed?: number;
  roamRadius?: number;
  pauseChance?: number;
  directionChangeChance?: number;
  worldLayer?: Phaser.Tilemaps.TilemapLayer | null;
}

// Game Scene Data
export interface GameSceneData {
  multiplayerMode?: boolean;
  userName?: string;
  userId?: string;
  isAuthenticated?: boolean;
  characterType?: string;
  playerName?: string;
}

// Conversation System Types
export interface ConversationConfig {
  philosopher: {
    key: string;
    name: string;
  };
  userId?: string;
  userName?: string;
  isAuthenticated?: boolean;
}

export interface DialogueState {
  isActive: boolean;
  currentPhilosopher?: string;
  currentMessage?: string;
  isWaitingForResponse: boolean;
}

// Movement and Animation Types
export interface MovementState {
  isMoving: boolean;
  direction: 'front' | 'back' | 'left' | 'right';
  velocity: { x: number; y: number };
}

export interface AnimationFrame {
  key: string;
  frame: string;
}

// Game Registry Types
export interface GameRegistry {
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar: string;
  isAuthenticated: boolean;
  apiUrl: string;
  multiplayerUrl: string;
}

// Tilemap Types
export interface TilesetConfig {
  name: string;
  imageKey: string;
  tilesetImage?: Phaser.Tilemaps.Tileset | null;
}

export interface LayerConfig {
  name: string;
  tilesets: Phaser.Tilemaps.Tileset[];
  x?: number;
  y?: number;
}

// UI Element Types
export interface ButtonConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  style?: Phaser.Types.GameObjects.Text.TextStyle;
  onClick: () => void;
}

export interface TextConfig {
  x: number;
  y: number;
  text: string;
  style: Phaser.Types.GameObjects.Text.TextStyle;
  origin?: { x: number; y: number };
}

// Type Guards for Phaser Objects
export function isPhaserSprite(obj: unknown): obj is Phaser.Physics.Arcade.Sprite {
  return obj instanceof Phaser.Physics.Arcade.Sprite;
}

export function isPhaserText(obj: unknown): obj is Phaser.GameObjects.Text {
  return obj instanceof Phaser.GameObjects.Text;
}

export function hasPhaserBody(sprite: Phaser.GameObjects.GameObject): sprite is Phaser.Physics.Arcade.Sprite {
  return 'body' in sprite && sprite.body !== null;
}

// Scene State Management
export interface SceneState {
  name: string;
  isActive: boolean;
  isPaused: boolean;
  data: Record<string, unknown>;
}

// Input Types
export interface InputState {
  cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  keys: {
    space?: Phaser.Input.Keyboard.Key;
    escape?: Phaser.Input.Keyboard.Key;
    enter?: Phaser.Input.Keyboard.Key;
  };
}

// Asset Loading Types
export interface AssetConfig {
  key: string;
  path: string;
  type: 'image' | 'atlas' | 'tilemapTiledJSON' | 'audio';
  atlasData?: string;
}

// Philosopher Definition
export interface PhilosopherDefinition {
  id: string;
  name: string;
  displayName: string;
  spawnName: string;
  biotype: 'sanguine' | 'choleric' | 'melancholic' | 'phlegmatic';
  emoji: string;
  defaultDirection: 'front' | 'back' | 'left' | 'right';
  roamRadius: number;
  defaultMessage?: string;
}

// Game Constants
export const GAME_CONFIG = {
  WORLD_WIDTH: 1600,
  WORLD_HEIGHT: 1200,
  PLAYER_SPEED: 160,
  INTERACTION_DISTANCE: 60,
  CAMERA_ZOOM: 1,
  PHYSICS_DEBUG: false
} as const;

export const BIOTYPE_EMOJIS = {
  sanguine: "🜁",     // Air
  choleric: "🜂",     // Fire
  melancholic: "🜃",  // Water
  phlegmatic: "🜄"    // Earth
} as const;

// Utility Functions
export class PhaserUtils {
  static getDistance(obj1: { x: number; y: number }, obj2: { x: number; y: number }): number {
    return Math.sqrt(Math.pow(obj2.x - obj1.x, 2) + Math.pow(obj2.y - obj1.y, 2));
  }

  static isNearby(obj1: { x: number; y: number }, obj2: { x: number; y: number }, distance: number): boolean {
    return this.getDistance(obj1, obj2) <= distance;
  }

  static clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }
}