import { auth, currentUser } from '@clerk/nextjs/server';
import { User } from '@clerk/nextjs/server';

export interface AuthConfig {
  isConfigured: boolean;
  requireAuth: boolean;
}

export interface UserWithFeatures extends User {
  accessTier?: 'free' | 'pro' | 'enterprise';
  featureFlags?: {
    multiWayDiscussions?: boolean;
    imageRecognition?: boolean;
    advancedAnalytics?: boolean;
    customPhilosophers?: boolean;
  };
}

/**
 * Centralized authentication utility for the application.
 * Handles Clerk configuration detection and future feature flag capabilities.
 */
export class AuthService {
  private static _instance: AuthService;
  
  private constructor() {}
  
  static getInstance(): AuthService {
    if (!AuthService._instance) {
      AuthService._instance = new AuthService();
    }
    return AuthService._instance;
  }

  /**
   * Check if Clerk is properly configured
   */
  isClerkConfigured(): boolean {
    return !!(
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && 
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== 'pk_test_temp'
    );
  }

  /**
   * Get authentication configuration
   */
  getAuthConfig(): AuthConfig {
    const isConfigured = this.isClerkConfigured();
    return {
      isConfigured,
      requireAuth: isConfigured
    };
  }

  /**
   * Get current user with enhanced metadata for feature flags
   */
  async getCurrentUserWithFeatures(): Promise<UserWithFeatures | null> {
    if (!this.isClerkConfigured()) {
      return null;
    }

    const user = await currentUser();
    if (!user) {
      return null;
    }

    // Extract access tier from user metadata
    const accessTier = this.extractAccessTier(user);
    
    // Generate feature flags based on access tier and user metadata
    const featureFlags = this.generateFeatureFlags(user, accessTier);

    return {
      ...user,
      accessTier,
      featureFlags
    } as UserWithFeatures;
  }

  /**
   * Get basic auth information (userId only)
   */
  async getAuthInfo(): Promise<{ userId: string | null }> {
    if (!this.isClerkConfigured()) {
      return { userId: null };
    }

    const authResult = await auth();
    return { userId: authResult.userId };
  }

  /**
   * Check if user has access to a specific feature
   */
  async hasFeatureAccess(featureName: keyof UserWithFeatures['featureFlags']): Promise<boolean> {
    const user = await this.getCurrentUserWithFeatures();
    if (!user) return false;

    return user.featureFlags?.[featureName] || false;
  }

  /**
   * Extract access tier from user metadata
   * This can be expanded to read from Clerk's user metadata
   */
  private extractAccessTier(user: User): 'free' | 'pro' | 'enterprise' {
    // Check user's public metadata for subscription tier
    const publicMetadata = user.publicMetadata as Record<string, unknown>;
    const subscriptionTier = publicMetadata?.subscriptionTier;

    if (subscriptionTier === 'enterprise') return 'enterprise';
    if (subscriptionTier === 'pro') return 'pro';
    return 'free';
  }

  /**
   * Generate feature flags based on access tier and user metadata
   * This supports Clerk-governed feature flag capabilities
   */
  private generateFeatureFlags(user: User, accessTier: string): UserWithFeatures['featureFlags'] {
    const privateMetadata = user.privateMetadata as Record<string, unknown>;

    // Default feature access based on tier
    const tierBasedFeatures = {
      free: {
        multiWayDiscussions: true,
        imageRecognition: true,
        advancedAnalytics: false,
        customPhilosophers: false
      },
      pro: {
        multiWayDiscussions: true,
        imageRecognition: true,
        advancedAnalytics: true,
        customPhilosophers: true
      },
      enterprise: {
        multiWayDiscussions: true,
        imageRecognition: true,
        advancedAnalytics: true,
        customPhilosophers: true
      }
    };

    const baseFeatures = tierBasedFeatures[accessTier as keyof typeof tierBasedFeatures] || tierBasedFeatures.free;

    // Override with explicit feature flags from Clerk metadata
    const featureFlags = privateMetadata?.featureFlags as Record<string, boolean> | undefined;
    return {
      multiWayDiscussions: featureFlags?.multiWayDiscussions ?? baseFeatures.multiWayDiscussions,
      imageRecognition: featureFlags?.imageRecognition ?? baseFeatures.imageRecognition,
      advancedAnalytics: featureFlags?.advancedAnalytics ?? baseFeatures.advancedAnalytics,
      customPhilosophers: featureFlags?.customPhilosophers ?? baseFeatures.customPhilosophers
    };
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();

// Convenience functions
export async function getCurrentUserWithFeatures(): Promise<UserWithFeatures | null> {
  return authService.getCurrentUserWithFeatures();
}

export async function getAuthInfo(): Promise<{ userId: string | null }> {
  return authService.getAuthInfo();
}

export function isClerkConfigured(): boolean {
  return authService.isClerkConfigured();
}

export async function hasFeatureAccess(featureName: keyof UserWithFeatures['featureFlags']): Promise<boolean> {
  return authService.hasFeatureAccess(featureName);
}