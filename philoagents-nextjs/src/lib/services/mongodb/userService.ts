import { getDatabase, COLLECTIONS } from '@/lib/mongodb';
import { auth, currentUser } from '@clerk/nextjs/server';

export interface User {
  _id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  // Profile fields
  displayName?: string;
  username?: string;
  bio?: string;
  // Subscription fields
  subscription: UserSubscription;
  // System fields
  createdAt: Date;
  updatedAt: Date;
  preferences: UserPreferences;
  stats: UserStats;
}

export interface UserPreferences {
  favoritePhilosopher?: string;
  gameVolume: number;
  conversationSpeed: 'slow' | 'normal' | 'fast';
  theme: 'light' | 'dark' | 'system';
  language: string;
  shareConversations: boolean;
  publicProfile: boolean;
}

export interface UserStats {
  totalConversations: number;
  favoritePhilosophers: string[];
  lastActive: Date;
}

export interface UserSubscription {
  plan: 'free' | 'pro' | 'premium';
  status: 'active' | 'inactive' | 'canceled' | 'past_due';
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  // Clerk Plans integration
  clerkPlanId?: string;
  // Usage limits
  monthlyConversations: number;
  conversationsUsed: number;
  resetDate: Date;
}

export class UserService {
  /**
   * Get or create a user from Clerk auth
   */
  static async getOrCreateUser(): Promise<User | null> {
    const { userId } = await auth();
    
    if (!userId) {
      return null;
    }

    const db = await getDatabase();
    const usersCollection = db.collection<User>(COLLECTIONS.USERS);

    // Check if user exists
    let user = await usersCollection.findOne({ _id: userId });

    if (!user) {
      // Fetch user data from Clerk
      const clerkUser = await currentUser();
      
      if (!clerkUser || !clerkUser.primaryEmailAddress) {
        throw new Error('Unable to fetch user data from Clerk');
      }

      // Create new user with default preferences and subscription
      const newUser: User = {
        _id: userId,
        email: clerkUser.primaryEmailAddress.emailAddress,
        firstName: clerkUser.firstName || undefined,
        lastName: clerkUser.lastName || undefined,
        imageUrl: clerkUser.imageUrl || undefined,
        // Profile defaults
        displayName: clerkUser.firstName ? `${clerkUser.firstName} ${clerkUser.lastName || ''}`.trim() : undefined,
        username: clerkUser.username || undefined,
        bio: undefined,
        // Subscription defaults (free tier)
        subscription: {
          plan: 'free',
          status: 'active',
          cancelAtPeriodEnd: false,
          monthlyConversations: 10, // Free tier limit
          conversationsUsed: 0,
          resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1), // Next month
        },
        // System fields
        createdAt: new Date(),
        updatedAt: new Date(),
        preferences: {
          gameVolume: 0.5,
          conversationSpeed: 'normal',
          theme: 'light',
          language: 'en',
          shareConversations: false,
          publicProfile: false,
        },
        stats: {
          totalConversations: 0,
          favoritePhilosophers: [],
          lastActive: new Date(),
        },
      };

      await usersCollection.insertOne(newUser);
      user = newUser;
    } else {
      // Migrate existing user if missing subscription field
      if (!user.subscription) {
        const defaultSubscription: UserSubscription = {
          plan: 'free',
          status: 'active',
          cancelAtPeriodEnd: false,
          monthlyConversations: 10,
          conversationsUsed: 0,
          resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
        };

        await usersCollection.updateOne(
          { _id: userId },
          { 
            $set: { 
              subscription: defaultSubscription,
              updatedAt: new Date()
            }
          }
        );

        user.subscription = defaultSubscription;
      }

      // Migrate other missing fields
      const updates: Partial<User> = {};
      if (user.preferences === undefined) {
        updates.preferences = {
          gameVolume: 0.5,
          conversationSpeed: 'normal',
          theme: 'light',
          language: 'en',
          shareConversations: false,
          publicProfile: false,
        };
      }
      if (user.stats === undefined) {
        updates.stats = {
          totalConversations: 0,
          favoritePhilosophers: [],
          lastActive: new Date(),
        };
      }

      if (Object.keys(updates).length > 0) {
        await usersCollection.updateOne(
          { _id: userId },
          { 
            $set: { 
              ...updates,
              updatedAt: new Date()
            }
          }
        );

        // Update the user object
        Object.assign(user, updates);
      }
    }

    return user;
  }

  /**
   * Update user from Clerk webhook
   */
  static async upsertFromClerk(clerkData: {
    id: string;
    email_addresses: Array<{ email_address: string; primary: boolean }>;
    first_name?: string;
    last_name?: string;
    image_url?: string;
  }): Promise<void> {
    const { id, email_addresses, first_name, last_name, image_url } = clerkData;
    
    const primaryEmail = email_addresses.find((email) => email.primary)?.email_address;
    
    if (!primaryEmail) {
      console.error('No primary email found for user:', id);
      return;
    }

    const db = await getDatabase();
    const usersCollection = db.collection<User>(COLLECTIONS.USERS);

    await usersCollection.updateOne(
      { _id: id },
      {
        $set: {
          email: primaryEmail,
          firstName: first_name || undefined,
          lastName: last_name || undefined,
          imageUrl: image_url || undefined,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          _id: id,
          displayName: first_name ? `${first_name} ${last_name || ''}`.trim() : undefined,
          username: undefined,
          bio: undefined,
          subscription: {
            plan: 'free',
            status: 'active',
            cancelAtPeriodEnd: false,
            monthlyConversations: 10,
            conversationsUsed: 0,
            resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
          },
          createdAt: new Date(),
          preferences: {
            gameVolume: 0.5,
            conversationSpeed: 'normal',
            theme: 'light',
            language: 'en',
            shareConversations: false,
            publicProfile: false,
          },
          stats: {
            totalConversations: 0,
            favoritePhilosophers: [],
            lastActive: new Date(),
          },
        },
      },
      { upsert: true }
    );
  }

  /**
   * Delete user
   */
  static async deleteUser(userId: string): Promise<void> {
    const db = await getDatabase();
    
    // Delete user and all related data
    await Promise.all([
      db.collection(COLLECTIONS.USERS).deleteOne({ clerk_user_id: userId }),
      db.collection(COLLECTIONS.ANALYTICS).deleteMany({ userId }),
    ]);
  }

  /**
   * Update user preferences
   */
  static async updatePreferences(userId: string, preferences: Partial<UserPreferences>): Promise<User | null> {
    const db = await getDatabase();
    const usersCollection = db.collection<User>(COLLECTIONS.USERS);

    const result = await usersCollection.findOneAndUpdate(
      { _id: userId },
      { 
        $set: { 
          ...Object.keys(preferences).reduce((acc, key) => {
            acc[`preferences.${key}`] = preferences[key as keyof UserPreferences];
            return acc;
          }, {} as Record<string, unknown>),
          updatedAt: new Date(),
        },
      },
      { returnDocument: 'after' }
    );

    return result;
  }

  /**
   * Update user profile
   */
  static async updateProfile(userId: string, profile: {
    displayName?: string;
    username?: string;
    bio?: string;
  }): Promise<User | null> {
    const db = await getDatabase();
    const usersCollection = db.collection<User>(COLLECTIONS.USERS);

    // Check if username is already taken (if provided)
    if (profile.username) {
      const existingUser = await usersCollection.findOne({ 
        username: profile.username, 
        _id: { $ne: userId } 
      });
      if (existingUser) {
        throw new Error('Username is already taken');
      }
    }

    const result = await usersCollection.findOneAndUpdate(
      { _id: userId },
      { 
        $set: {
          ...profile,
          updatedAt: new Date(),
        },
      },
      { returnDocument: 'after' }
    );

    return result;
  }

  /**
   * Update user subscription
   */
  static async updateSubscription(userId: string, subscription: Partial<UserSubscription>): Promise<User | null> {
    const db = await getDatabase();
    const usersCollection = db.collection<User>(COLLECTIONS.USERS);

    const setUpdates = Object.keys(subscription).reduce((acc, key) => {
      acc[`subscription.${key}`] = subscription[key as keyof UserSubscription];
      return acc;
    }, {} as Record<string, unknown>);

    const result = await usersCollection.findOneAndUpdate(
      { _id: userId },
      { 
        $set: {
          ...setUpdates,
          updatedAt: new Date(),
        },
      },
      { returnDocument: 'after' }
    );

    return result;
  }

  /**
   * Increment conversation usage
   */
  static async incrementConversationUsage(userId: string): Promise<boolean> {
    const db = await getDatabase();
    const usersCollection = db.collection<User>(COLLECTIONS.USERS);

    const user = await usersCollection.findOne({ _id: userId });
    if (!user) return false;

    // Check if user has exceeded their limit
    if (user.subscription.conversationsUsed >= user.subscription.monthlyConversations) {
      return false;
    }

    await usersCollection.updateOne(
      { _id: userId },
      { 
        $inc: { 'subscription.conversationsUsed': 1 },
        $set: { updatedAt: new Date() }
      }
    );

    return true;
  }

  /**
   * Reset monthly usage (to be called by cron job)
   */
  static async resetMonthlyUsage(): Promise<void> {
    const db = await getDatabase();
    const usersCollection = db.collection<User>(COLLECTIONS.USERS);

    const now = new Date();
    await usersCollection.updateMany(
      { 'subscription.resetDate': { $lte: now } },
      { 
        $set: { 
          'subscription.conversationsUsed': 0,
          'subscription.resetDate': new Date(now.getFullYear(), now.getMonth() + 1, 1),
          updatedAt: new Date()
        }
      }
    );
  }

  /**
   * Update user stats
   */
  static async updateStats(userId: string, updates: Partial<UserStats>): Promise<void> {
    const db = await getDatabase();
    const usersCollection = db.collection<User>(COLLECTIONS.USERS);

    const setUpdates = Object.keys(updates).reduce((acc, key) => {
      acc[`stats.${key}`] = updates[key as keyof UserStats];
      return acc;
    }, {} as Record<string, unknown>);

    await usersCollection.updateOne(
      { _id: userId },
      { 
        $set: {
          ...setUpdates,
          'stats.lastActive': new Date(),
          updatedAt: new Date(),
        },
      }
    );
  }

  /**
   * Track analytics event
   */
  static async trackEvent(
    userId: string,
    eventType: string,
    eventData?: Record<string, unknown>
  ): Promise<void> {
    const db = await getDatabase();
    const analyticsCollection = db.collection(COLLECTIONS.ANALYTICS);

    await analyticsCollection.insertOne({
      userId,
      eventType,
      eventData,
      timestamp: new Date(),
    });
  }
}