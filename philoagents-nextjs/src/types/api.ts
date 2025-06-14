/**
 * Structured API type definitions for PhiloAgents
 * Replaces generic Record<string, unknown> with proper interfaces
 */

// Base API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  error: string;
  details?: string;
  code?: number;
}

// Conversation Types
export interface ConversationRequest {
  message: string;
  philosopher_id: string;
  user_id?: string;
}

export interface ConversationResponse {
  response: string;
  philosopher_id: string;
  timestamp: string;
}

export interface ConversationHistoryItem {
  id: string;
  philosopher_id: string;
  philosopher_name: string;
  message: string;
  response: string;
  timestamp: string;
  user_id?: string;
}

// User Types
export interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  imageUrl?: string;
  lastSignInAt?: string;
  createdAt: string;
}

export interface UserPreferences {
  favoritePhilosopher?: string;
  gameVolume?: number;
  conversationSpeed?: number;
  theme?: 'light' | 'dark' | 'system';
  language?: string;
  shareConversations?: boolean;
  publicProfile?: boolean;
}

// Multiplayer Types
export interface PlayerData {
  id: string;
  name: string;
  characterType: string;
  x: number;
  y: number;
  direction: 'front' | 'back' | 'left' | 'right';
  isMoving: boolean;
  isAuthenticated: boolean;
}

export interface GameRoomState {
  players: Map<string, PlayerData>;
  roomId: string;
  maxPlayers: number;
  isActive: boolean;
}

export interface GameEvent {
  eventType: string;
  data: Record<string, unknown>;
  timestamp: number;
  playerId?: string;
}

// Form Data Types
export interface ProfileFormData {
  firstName: string;
  lastName: string;
  email: string;
}

export interface PreferencesFormData extends UserPreferences {
  lastUpdated?: string;
}

// Utility type for nullable fields
export type Nullable<T> = T | null;

// Type guards
export function isApiError(response: unknown): response is ApiError {
  return typeof response === 'object' && 
         response !== null && 
         'error' in response;
}

export function isConversationHistoryItem(item: unknown): item is ConversationHistoryItem {
  return typeof item === 'object' && 
         item !== null &&
         'philosopher_id' in item &&
         'message' in item &&
         'response' in item &&
         'timestamp' in item;
}

export function isPlayerData(data: unknown): data is PlayerData {
  return typeof data === 'object' && 
         data !== null &&
         'id' in data &&
         'name' in data &&
         'characterType' in data &&
         'x' in data &&
         'y' in data;
}