Next.js Migration Plan with Clerk Authentication

  Project Overview

  Migrate the existing philoagents-ui (Phaser.js game) to a
  Next.js application with Clerk authentication while
  preserving the sophisticated game functionality and
  integrating with the existing AI conversation system.

  ---
  Phase 1: Foundation Setup (Week 1)

  1.1 Next.js Project Structure

  philoagents-nextjs/
  ├── app/                          # App Router directory
  │   ├── layout.tsx               # Root layout with Clerk
  provider
  │   ├── page.tsx                 # Landing/marketing page
  │   ├── (auth)/                  # Auth routes group
  │   │   ├── sign-in/[[...sign-in]]/page.tsx
  │   │   ├── sign-up/[[...sign-up]]/page.tsx
  │   │   └── layout.tsx
  │   ├── dashboard/               # User dashboard
  │   │   ├── page.tsx            # Main dashboard
  │   │   ├── conversations/      # Conversation history
  │   │   └── settings/           # User preferences
  │   ├── game/                   # Game container
  │   │   └── page.tsx            # Phaser game component
  │   └── api/                    # API routes
  │       ├── auth/               # Clerk webhooks
  │       └── sync-user/          # User data sync
  ├── components/                 # Reusable components
  │   ├── auth/                   # Auth components
  │   ├── game/                   # Game-related components
  │   ├── layout/                 # Layout components
  │   └── ui/                     # UI primitives
  ├── lib/                        # Utilities and config
  │   ├── clerk.ts               # Clerk configuration
  │   ├── database.ts            # Database connections
  │   └── phaser/                # Phaser game files
  (migrated)
  ├── public/                     # Static assets (migrated)
  └── middleware.ts              # Clerk route protection

  1.2 Technology Stack

  - Framework: Next.js 14 (App Router)
  - Authentication: Clerk
  - Styling: Tailwind CSS + shadcn/ui
  - Game Engine: Phaser.js (embedded)
  - Database: Existing MongoDB + PostgreSQL
  - State Management: Zustand (for app state)
  - WebSocket: Maintain existing connections

  1.3 Dependencies Migration

  {
    "dependencies": {
      "@clerk/nextjs": "^4.29.9",
      "next": "14.2.0",
      "react": "^18.2.0",
      "react-dom": "^18.2.0",
      "phaser": "^3.88.2",
      "colyseus.js": "^0.15.28",
      "@sentry/nextjs": "^9.29.0",
      "tailwindcss": "^3.4.0",
      "shadcn/ui": "latest",
      "zustand": "^4.5.0"
    }
  }

  ---
  Phase 2: Core Authentication Setup (Week 2)

  2.1 Clerk Configuration

  // lib/clerk.ts
  import { ClerkProvider } from '@clerk/nextjs'

  export const clerkConfig = {
    publishableKey:
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!,
    signInUrl: '/sign-in',
    signUpUrl: '/sign-up',
    afterSignInUrl: '/dashboard',
    afterSignUpUrl: '/dashboard'
  }

  2.2 Route Protection

  // middleware.ts
  import { authMiddleware } from "@clerk/nextjs";

  export default authMiddleware({
    publicRoutes: ["/", "/sign-in", "/sign-up"],
    ignoredRoutes: ["/api/webhooks/clerk"]
  });

  2.3 User Sync System

  // app/api/webhooks/clerk/route.ts
  import { NextRequest } from 'next/server'
  import { headers } from 'next/headers'
  import { Webhook } from 'svix'

  export async function POST(req: NextRequest) {
    const payload = await req.text()
    const headerPayload = headers()

    const webhook = new
  Webhook(process.env.CLERK_WEBHOOK_SECRET!)
    const evt = webhook.verify(payload, {
      'svix-id': headerPayload.get('svix-id')!,
      'svix-timestamp':
  headerPayload.get('svix-timestamp')!,
      'svix-signature':
  headerPayload.get('svix-signature')!,
    })

    // Sync user to PostgreSQL and MongoDB
    await syncUserToDatabase(evt)
  }

  ---
  Phase 3: Game Integration (Week 3)

  3.1 Phaser Game Component

  // components/game/PhaserGame.tsx
  'use client'
  import { useEffect, useRef } from 'react'
  import { useUser } from '@clerk/nextjs'
  import Phaser from 'phaser'

  export default function PhaserGame() {
    const gameRef = useRef<HTMLDivElement>(null)
    const { user } = useUser()

    useEffect(() => {
      if (!user || !gameRef.current) return

      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        width: 1024,
        height: 768,
        parent: gameRef.current,
        scene: [Preloader, MainMenu, Game, PauseMenu],
        // Pass user context to game
        callbacks: {
          preBoot: (game) => {
            game.registry.set('userId', user.id)
            game.registry.set('userName', user.fullName)
            game.registry.set('userAvatar', user.imageUrl)
          }
        }
      }

      const game = new Phaser.Game(config)
      return () => game.destroy(true)
    }, [user])

    return <div ref={gameRef} className="w-full h-full" />
  }

  3.2 Enhanced Game Scenes

  // lib/phaser/scenes/Game.ts (migrated and enhanced)
  export class Game extends Phaser.Scene {
    init(data: any) {
      // Get user context from game registry
      this.userId = this.game.registry.get('userId')
      this.userName = this.game.registry.get('userName')
      this.userAvatar = this.game.registry.get('userAvatar')

      // Initialize with user-specific data
      this.gameConfig = {
        ...data,
        userId: this.userId,
        playerName: this.userName
      }
    }

    // Enhanced multiplayer joining
    async startMultiplayerGame() {
      const room = await
  this.multiplayerService.joinRoom('philosophy_room', {
        userId: this.userId,
        playerName: this.userName,
        avatar: this.userAvatar
      })
    }
  }

  ---
  Phase 4: User Experience Enhancement (Week 4)

  4.1 User Dashboard

  // app/dashboard/page.tsx
  import { currentUser } from '@clerk/nextjs/server'
  import ConversationHistory from
  '@/components/dashboard/ConversationHistory'
  import GameStats from '@/components/dashboard/GameStats'

  export default async function Dashboard() {
    const user = await currentUser()

    return (
      <div className="container mx-auto p-6">
        <h1>Welcome back, {user?.firstName}!</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 
  gap-6">
          <ConversationHistory userId={user?.id} />
          <GameStats userId={user?.id} />
        </div>

        <div className="mt-8">
          <Link href="/game" className="btn-primary">
            Continue Philosophical Journey
          </Link>
        </div>
      </div>
    )
  }

  4.2 Conversation History Integration

  // components/dashboard/ConversationHistory.tsx
  import { getConversationsByUserId } from '@/lib/database'

  export default async function ConversationHistory({ userId
   }: { userId: string }) {
    const conversations = await
  getConversationsByUserId(userId)

    return (
      <div className="card">
        <h2>Your Philosophical Conversations</h2>
        {conversations.map(conv => (
          <div key={conv.id} className="conversation-item">
            <h3>{conv.philosopher_name}</h3>
            <p>{conv.last_message}</p>
            <button onClick={() =>
  resumeConversation(conv.id)}>
              Continue Conversation
            </button>
          </div>
        ))}
      </div>
    )
  }

  ---
  Phase 5: Database Integration (Week 5)

  5.1 Enhanced Database Schema

  -- PostgreSQL enhancements
  ALTER TABLE game_sessions ADD COLUMN user_id VARCHAR;
  ALTER TABLE player_sessions ADD COLUMN user_id VARCHAR;
  ALTER TABLE chat_messages ADD COLUMN user_id VARCHAR;

  -- New user management tables
  CREATE TABLE users (
    id VARCHAR PRIMARY KEY,
    clerk_user_id VARCHAR UNIQUE NOT NULL,
    email VARCHAR NOT NULL,
    full_name VARCHAR,
    avatar_url VARCHAR,
    created_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP,
    preferences JSONB DEFAULT '{}'
  );

  CREATE TABLE user_conversations (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR REFERENCES users(clerk_user_id),
    philosopher_id VARCHAR NOT NULL,
    thread_id VARCHAR NOT NULL,
    last_message_at TIMESTAMP,
    message_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    summary TEXT
  );

  5.2 MongoDB Schema Updates

  // Update MongoDB collections to include user_id
  interface PhilosopherState extends MessagesState {
    user_id: string            // New field
    philosopher_context: string
    philosopher_name: string
    // ... existing fields
  }

  // Enhanced long-term memory with user context
  interface UserMemoryDocument {
    user_id: string
    philosopher_id: string
    conversation_summary: string
    key_insights: string[]
    created_at: Date
    embedding: number[]
  }

  ---
  Phase 6: Advanced Features (Week 6)

  6.1 Personalized AI Conversations

  // Enhanced conversation service
  export async function generatePersonalizedResponse(
    userId: string,
    philosopherId: string,
    message: string
  ) {
    // Get user conversation history
    const userHistory = await
  getUserConversationHistory(userId, philosopherId)

    // Get user preferences
    const userPrefs = await getUserPreferences(userId)

    // Enhanced prompt with user context
    const personalizedPrompt = `
      User Context:
      - Previous conversations: ${userHistory.summary}
      - Preferred discussion style: 
  ${userPrefs.discussionStyle}
      - Areas of interest: ${userPrefs.interests}
      
      Continue the philosophical discussion with this 
  context in mind.
    `

    return await generateResponse(personalizedPrompt +
  message)
  }

  ---
  Phase 7: Deployment & Optimization (Week 7)

  7.1 Environment Configuration

  # .env.local
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
  CLERK_SECRET_KEY=sk_test_...
  CLERK_WEBHOOK_SECRET=whsec_...

  # Database connections (existing)
  MONGO_URI=mongodb://...
  DATABASE_URL=postgresql://...

  # API endpoints
  NEXT_PUBLIC_API_URL=http://localhost:8000
  NEXT_PUBLIC_MULTIPLAYER_URL=ws://localhost:2567

  7.2 Performance Optimizations

  - Code Splitting: Lazy load Phaser game component
  - Image Optimization: Next.js Image component for game
  assets
  - Caching: Redis for conversation summaries
  - CDN: Static asset optimization

  7.3 Docker Configuration

  # Dockerfile
  FROM node:18-alpine
  WORKDIR /app

  COPY package*.json ./
  RUN npm ci --only=production

  COPY . .
  RUN npm run build

  EXPOSE 3000
  CMD ["npm", "start"]

  ---
  Migration Strategy

  Parallel Development Approach

  1. Keep Current System Running: No downtime during
  migration
  2. Feature Flag System: Gradual rollout to users
  3. Data Migration Scripts: Sync existing anonymous
  sessions to user accounts
  4. Backward Compatibility: Support both systems during
  transition

  Rollback Plan

  - Maintain current webpack build alongside Next.js
  - Feature flags to switch between systems
  - Database rollback scripts
  - Monitoring and alerting for issues

  ---
  Success Metrics

  Technical Metrics

  - Page Load Time: < 3 seconds for game initialization
  - Authentication Flow: < 5 seconds for complete sign-up
  - Game Performance: Maintain 60fps in Phaser.js
  - API Response Time: < 500ms for conversation APIs

  User Experience Metrics

  - Conversion Rate: Anonymous → Registered users
  - Retention: 7-day and 30-day user retention
  - Engagement: Average session duration and conversation
  length
  - Satisfaction: User feedback scores