/**
 * Type-safe conversion utilities for PhiloAgents
 * Replaces unsafe type casting with validated conversions
 */

import { 
  ConversationHistoryItem, 
  PlayerData, 
  ApiError,
  isApiError
} from '@/types/api';
// TypedError class definition (moved from globals.d.ts for importing)
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

/**
 * Safe conversion utilities with runtime validation
 */
export class TypeSafeConverter {
  /**
   * Safely converts unknown data to string with fallback
   */
  static toString(value: unknown, fallback: string = ''): string {
    if (value === null || value === undefined) {
      return fallback;
    }
    
    if (typeof value === 'string') {
      return value;
    }
    
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    
    return fallback;
  }

  /**
   * Safely converts unknown data to number with validation
   */
  static toNumber(value: unknown, fallback?: number): number {
    if (value === null || value === undefined) {
      if (fallback !== undefined) {
        return fallback;
      }
      throw new TypedError('Cannot convert null/undefined to number without fallback', 'CONVERSION_ERROR');
    }
    
    if (typeof value === 'number' && !isNaN(value)) {
      return value;
    }
    
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      if (!isNaN(parsed)) {
        return parsed;
      }
    }
    
    if (fallback !== undefined) {
      return fallback;
    }
    
    throw new TypedError(`Cannot convert ${typeof value} to number: ${value}`, 'CONVERSION_ERROR');
  }

  /**
   * Safely converts unknown data to boolean
   */
  static toBoolean(value: unknown, fallback: boolean = false): boolean {
    if (value === null || value === undefined) {
      return fallback;
    }
    
    if (typeof value === 'boolean') {
      return value;
    }
    
    if (typeof value === 'string') {
      const lower = value.toLowerCase();
      if (lower === 'true' || lower === '1' || lower === 'yes') {
        return true;
      }
      if (lower === 'false' || lower === '0' || lower === 'no') {
        return false;
      }
    }
    
    if (typeof value === 'number') {
      return value !== 0;
    }
    
    return fallback;
  }

  /**
   * Validates and converts API response to ConversationHistoryItem
   */
  static toConversationHistoryItem(data: unknown): ConversationHistoryItem {
    if (!data || typeof data !== 'object') {
      throw new TypedError('Invalid conversation data: not an object', 'VALIDATION_ERROR');
    }

    const record = data as Record<string, unknown>;
    
    // Validate required fields
    const philosopherId = TypeSafeConverter.toString(record.philosopher_id);
    const timestamp = TypeSafeConverter.toString(record.timestamp);
    
    if (!philosopherId) {
      throw new TypedError('Missing required field: philosopher_id', 'VALIDATION_ERROR');
    }
    
    if (!timestamp) {
      throw new TypedError('Missing required field: timestamp', 'VALIDATION_ERROR');
    }

    return {
      id: TypeSafeConverter.toString(record.id, `${philosopherId}-${timestamp}`),
      philosopher_id: philosopherId,
      philosopher_name: TypeSafeConverter.toString(record.philosopher_name, philosopherId),
      message: TypeSafeConverter.toString(record.message || record.user_message),
      response: TypeSafeConverter.toString(record.response || record.ai_response),
      timestamp,
      user_id: record.user_id ? TypeSafeConverter.toString(record.user_id) : undefined,
    };
  }

  /**
   * Validates and converts data to PlayerData
   */
  static toPlayerData(data: unknown): PlayerData {
    if (!data || typeof data !== 'object') {
      throw new TypedError('Invalid player data: not an object', 'VALIDATION_ERROR');
    }

    const record = data as Record<string, unknown>;
    
    // Validate required fields
    const id = TypeSafeConverter.toString(record.id);
    const name = TypeSafeConverter.toString(record.name);
    const characterType = TypeSafeConverter.toString(record.characterType);
    
    if (!id || !name || !characterType) {
      throw new TypedError('Missing required player fields: id, name, or characterType', 'VALIDATION_ERROR');
    }

    return {
      id,
      name,
      characterType,
      x: TypeSafeConverter.toNumber(record.x, 0),
      y: TypeSafeConverter.toNumber(record.y, 0),
      direction: TypeSafeConverter.toDirection(record.direction),
      isMoving: TypeSafeConverter.toBoolean(record.isMoving),
      isAuthenticated: TypeSafeConverter.toBoolean(record.isAuthenticated),
    };
  }

  /**
   * Validates direction string
   */
  static toDirection(value: unknown): 'front' | 'back' | 'left' | 'right' {
    const direction = TypeSafeConverter.toString(value, 'front');
    
    if (['front', 'back', 'left', 'right'].includes(direction)) {
      return direction as 'front' | 'back' | 'left' | 'right';
    }
    
    return 'front';
  }

  /**
   * Safely converts array of unknown data to typed array
   */
  static toTypedArray<T>(
    data: unknown,
    converter: (item: unknown) => T,
    context: string = 'array conversion'
  ): T[] {
    if (!Array.isArray(data)) {
      throw new TypedError(`Expected array for ${context}, got ${typeof data}`, 'VALIDATION_ERROR');
    }

    const result: T[] = [];
    
    for (let i = 0; i < data.length; i++) {
      try {
        result.push(converter(data[i]));
      } catch (error) {
        throw new TypedError(
          `Failed to convert array item at index ${i} for ${context}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'VALIDATION_ERROR',
          undefined,
          { index: i, item: data[i] }
        );
      }
    }
    
    return result;
  }
}

/**
 * Window object utilities with type safety
 */
export class WindowUtils {
  /**
   * Type-safe access to Sentry
   */
  static getSentry(): Window['Sentry'] | null {
    if (typeof window === 'undefined') {
      return null;
    }
    
    return window.Sentry || null;
  }

  /**
   * Safely capture exception with Sentry
   */
  static captureException(
    error: unknown,
    context?: {
      tags?: Record<string, string>;
      extra?: Record<string, unknown>;
    }
  ): void {
    const sentry = this.getSentry();
    
    if (sentry && sentry.captureException) {
      try {
        sentry.captureException(error, context);
      } catch (sentryError) {
        console.error('Failed to send error to Sentry:', sentryError);
      }
    }
    
    // Always log to console as fallback
    console.error('Application error:', error, context);
  }

  /**
   * Type-safe window.open
   */
  static openUrl(url: string, target: string = '_blank'): Window | null {
    if (typeof window === 'undefined') {
      console.warn('Cannot open URL in non-browser environment:', url);
      return null;
    }
    
    try {
      return window.open(url, target);
    } catch (error) {
      console.error('Failed to open URL:', url, error);
      return null;
    }
  }
}

/**
 * Form data validation utilities
 */
export class FormValidator {
  /**
   * Validates email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validates required string field
   */
  static validateRequired(value: unknown, fieldName: string): string {
    const stringValue = TypeSafeConverter.toString(value);
    
    if (!stringValue.trim()) {
      throw new TypedError(`${fieldName} is required`, 'VALIDATION_ERROR');
    }
    
    return stringValue;
  }

  /**
   * Validates optional string field with max length
   */
  static validateOptionalString(value: unknown, maxLength?: number): string | undefined {
    if (value === null || value === undefined) {
      return undefined;
    }
    
    const stringValue = TypeSafeConverter.toString(value);
    
    if (maxLength && stringValue.length > maxLength) {
      throw new TypedError(`String exceeds maximum length of ${maxLength}`, 'VALIDATION_ERROR');
    }
    
    return stringValue || undefined;
  }
}

/**
 * API response handling utilities
 */
export class ApiResponseHandler {
  /**
   * Safely handles API response with type validation
   */
  static async handleResponse<T>(
    response: Response,
    dataValidator?: (data: unknown) => T
  ): Promise<T> {
    if (!response.ok) {
      const errorData = await this.parseErrorResponse(response);
      throw new TypedError(
        errorData.error || `HTTP ${response.status}: ${response.statusText}`,
        'API_ERROR',
        response.status,
        { url: response.url, status: response.status }
      );
    }

    const rawData = await response.json();
    
    if (dataValidator) {
      return dataValidator(rawData);
    }
    
    return rawData as T;
  }

  /**
   * Parses error response safely
   */
  private static async parseErrorResponse(response: Response): Promise<ApiError> {
    try {
      const data = await response.json();
      
      if (isApiError(data)) {
        return data;
      }
      
      return {
        error: TypeSafeConverter.toString(data.error || data.message, 'Unknown API error'),
        details: TypeSafeConverter.toString(data.details),
      };
    } catch {
      return {
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }
  }
}