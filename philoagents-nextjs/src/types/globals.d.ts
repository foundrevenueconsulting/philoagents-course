/**
 * Global type definitions for PhiloAgents
 * Extends global objects and provides ambient declarations
 */

// Extend Window interface for third-party integrations
declare global {
  interface Window {
    Sentry?: {
      captureException: (error: unknown, options?: {
        tags?: Record<string, string>;
        extra?: Record<string, unknown>;
      }) => void;
      addBreadcrumb: (breadcrumb: {
        message: string;
        category?: string;
        level?: 'error' | 'warning' | 'info' | 'debug';
      }) => void;
    };
    
    // Analytics integrations
    gtag?: (command: string, targetId: string, config?: Record<string, unknown>) => void;
    
    // Development tools
    __DEV__?: boolean;
  }
}

// Clerk types extension (for additional properties)
declare module '@clerk/nextjs' {
  interface UserResource {
    publicMetadata?: {
      role?: 'admin' | 'user' | 'moderator';
      subscription?: 'free' | 'premium' | 'enterprise';
    };
    privateMetadata?: {
      gamePreferences?: import('./api').UserPreferences;
      conversationHistory?: string[];
    };
  }
}

// Environment variables with strict typing
declare global {
  namespace NodeJS {
  interface ProcessEnv {
    // Clerk
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: string;
    CLERK_SECRET_KEY: string;
    CLERK_WEBHOOK_SECRET?: string;
    
    // Database
    MONGO_URI: string;
    
    // API
    NEXT_PUBLIC_API_URL: string;
    NEXT_PUBLIC_MULTIPLAYER_URL: string;
    
    // Analytics
    NEXT_PUBLIC_GA_ID?: string;
    COMET_API_KEY?: string;
    
    // Development
    NODE_ENV: 'development' | 'production' | 'test';
    VERCEL_ENV?: 'production' | 'preview' | 'development';
    }
  }
}

// Extend CSS properties for custom properties
declare module 'react' {
  interface CSSProperties {
    '--custom-primary'?: string;
    '--custom-secondary'?: string;
    '--custom-accent'?: string;
  }
}

// Utility types for the application
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export type NonEmptyArray<T> = [T, ...T[]];

export type Brand<T, TBrand> = T & { __brand: TBrand };

// Branded types for IDs
export type UserId = Brand<string, 'UserId'>;
export type PhilosopherId = Brand<string, 'PhilosopherId'>;
export type ConversationId = Brand<string, 'ConversationId'>;
export type RoomId = Brand<string, 'RoomId'>;

// Constants
export const APP_NAME = 'PhiloAgents' as const;
export const APP_VERSION = '1.0.0' as const;

// Error types
export interface AppError extends Error {
  code?: string;
  status?: number;
  context?: Record<string, unknown>;
}

export class TypedError extends Error implements AppError {
  constructor(
    message: string,
    public code?: string,
    public status?: number,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'TypedError';
  }
}

// Type assertion helpers
export function assertIsString(value: unknown): asserts value is string {
  if (typeof value !== 'string') {
    throw new TypedError(`Expected string, got ${typeof value}`, 'TYPE_ASSERTION_ERROR');
  }
}

export function assertIsNumber(value: unknown): asserts value is number {
  if (typeof value !== 'number') {
    throw new TypedError(`Expected number, got ${typeof value}`, 'TYPE_ASSERTION_ERROR');
  }
}

export function assertIsArray<T>(value: unknown, itemValidator?: (item: unknown) => item is T): asserts value is T[] {
  if (!Array.isArray(value)) {
    throw new TypedError(`Expected array, got ${typeof value}`, 'TYPE_ASSERTION_ERROR');
  }
  
  if (itemValidator) {
    for (let i = 0; i < value.length; i++) {
      if (!itemValidator(value[i])) {
        throw new TypedError(`Array item at index ${i} failed validation`, 'TYPE_ASSERTION_ERROR');
      }
    }
  }
}

// Export empty object to make this a module
export {};