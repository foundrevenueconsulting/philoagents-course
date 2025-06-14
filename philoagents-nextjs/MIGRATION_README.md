# PhiloAgents Next.js Migration

This is the Next.js migration of the PhiloAgents application, implementing modern web authentication and user management capabilities while preserving the core game functionality.

## 🎯 Project Overview

PhiloAgents is being migrated from a vanilla JavaScript Phaser.js game to a full-stack Next.js application with:

- **User Authentication**: Clerk.com integration for secure user management
- **Modern UI**: React components with Tailwind CSS and shadcn/ui
- **Game Integration**: Embedded Phaser.js game with user context
- **Persistent Data**: User-specific conversation history and preferences
- **Multiplayer Support**: Enhanced multiplayer experience with user accounts

## 🏗️ Architecture

### Technology Stack
- **Framework**: Next.js 14 (App Router)
- **Authentication**: Clerk
- **Styling**: Tailwind CSS + shadcn/ui
- **Game Engine**: Phaser.js (embedded)
- **Database**: MongoDB (AI conversations) + PostgreSQL (multiplayer)
- **State Management**: Zustand
- **Language**: TypeScript

### Project Structure
```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication pages
│   │   ├── sign-in/[[...sign-in]]/
│   │   └── sign-up/[[...sign-up]]/
│   ├── dashboard/                # User dashboard
│   ├── game/                     # Game container
│   └── api/                      # API routes (future)
├── components/                   # Reusable components
│   ├── auth/                     # Auth components
│   ├── game/                     # Game components
│   ├── layout/                   # Layout components
│   └── ui/                       # UI primitives
├── lib/                          # Utilities and config
│   ├── clerk.ts                  # Clerk configuration
│   └── utils.ts                  # Utility functions
public/                           # Static assets (migrated from original)
├── assets/                       # Game assets
│   ├── characters/               # Philosopher character sprites
│   ├── tilemaps/                 # Game world maps
│   └── tilesets/                 # Game world tiles
```

## 🚀 Current Status

### ✅ Phase 1 Complete: Foundation Setup
- [x] Next.js 14 project created with App Router
- [x] Clerk authentication integration (conditional)
- [x] Tailwind CSS and shadcn/ui setup
- [x] Basic page structure (landing, dashboard, game, auth)
- [x] Game assets migrated from original project
- [x] TypeScript configuration
- [x] Build system working

### ✅ Phase 2 Complete: Game Integration
- [x] PhaserGame React component with user context
- [x] TypeScript game scenes (Preloader, MainMenu, Game, PauseMenu)
- [x] User data integration from Clerk to Phaser registry
- [x] API service classes for AI conversations and multiplayer
- [x] Enhanced conversation system with real AI integration
- [x] Multiplayer service with Colyseus integration
- [x] Dynamic game loading to avoid SSR issues

### 🎨 Current Features
- **Landing Page**: Marketing page with feature overview
- **Authentication Pages**: Sign-in/sign-up with Clerk integration
- **Dashboard**: User dashboard with navigation to game and features
- **Fully Integrated Game**: Working Phaser.js game with:
  - User context (name, authentication status)
  - Real AI conversations with philosophers
  - Multiplayer support (when enabled)
  - Interactive philosophy world with multiple characters
  - Conversation history (for authenticated users)
  - Responsive design and proper asset loading

### 🔧 Development Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Setup**:
   Copy `.env.local.example` to `.env.local` and add your Clerk keys:
   ```bash
   cp .env.local.example .env.local
   ```

3. **Run Development Server**:
   ```bash
   npm run dev
   ```
   Visit http://localhost:3000

4. **Build for Production**:
   ```bash
   npm run build
   ```

### 🔐 Authentication Configuration

The application uses conditional Clerk integration:

- **With Clerk Keys**: Full authentication with user management
- **Without Clerk Keys**: Development mode with placeholder functionality

To enable authentication:
1. Create a Clerk account at https://clerk.com
2. Get your publishable and secret keys
3. Update `.env.local` with real Clerk credentials

## 🗺️ Next Steps

### ✅ Phase 3 Complete: Enhanced Features
- [x] User conversation history dashboard
- [x] Conversation history API integration
- [x] ~~Philosopher selection and preferences~~ (Cancelled - moved to Phase 5)
- [x] ~~Advanced multiplayer features~~ (Cancelled - moved to Phase 5)
- [x] ~~Social features and conversation sharing~~ (Cancelled - moved to Phase 5)
- [x] ~~Real-time streaming conversations~~ (Already implemented in Phase 2)

### ✅ Phase 4 Complete: Optimized MongoDB Architecture
- [x] **Eliminated Data Duplication**: Single MongoDB instance, no PostgreSQL
- [x] **Smart Architecture Decision**: Use existing AI API for conversations (no binary decoding needed)
- [x] **User Management**: MongoDB for users, preferences, and analytics only
- [x] **Conversation History**: Via existing `/conversations/{user_id}` API endpoint
- [x] **User Settings**: Full preferences system with game, UI, and privacy options
- [x] **Optional Clerk Integration**: Webhook for user sync
- [x] **Cost & Complexity Reduction**: Simplified infrastructure, single data source

#### Final Architecture
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Next.js UI   │───▶│   API Service    │───▶│  Python Backend │
│ - Preferences   │    │  (HTTP calls)    │    │  (LangGraph)    │
│ - Analytics     │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                                               │
         ▼                                               ▼
┌─────────────────┐                              ┌─────────────────┐
│   MongoDB       │                              │   MongoDB       │
│ - users         │◀────── Single Instance ─────▶│ - checkpoints   │
│ - analytics     │                              │ - writes        │  
│ (web features)  │                              │ (AI optimized)  │
└─────────────────┘                              └─────────────────┘
```

**Key Benefits:**
- ✅ No data duplication (conversation data lives only in LangGraph format)
- ✅ Optimal performance (each system uses appropriate storage format)  
- ✅ Simple maintenance (conversation logic stays in AI backend)
- ✅ Web-friendly features (user prefs, analytics in simple MongoDB docs)
- ✅ Future-proof (can add conversation tagging without duplicating content)

### Phase 5: Production Features
- [ ] Performance optimizations
- [ ] Error monitoring and logging
- [ ] SEO enhancements
- [ ] Mobile responsiveness improvements
- [ ] Accessibility features

## 📁 Migration Notes

### From Original Project
The following assets and functionality have been preserved:
- All character sprites and animations
- Game world tilemaps and tilesets
- Core game mechanics (to be integrated)
- Multiplayer infrastructure (to be enhanced)

### New Capabilities
- URL-based routing and navigation
- User authentication and session management
- Server-side rendering for SEO
- Modern React component architecture
- TypeScript for better development experience

## 🤝 Contributing

This migration follows the plan outlined in `.prompts/nextjs_ui_clerk.md`. Each phase builds upon the previous one while maintaining backward compatibility with the existing system.

## 🔗 Related Projects

- **philoagents-api**: Python FastAPI backend with AI conversations
- **philoagents-multiplayer**: Colyseus multiplayer server
- **philoagents-ui**: Original Phaser.js game (being migrated)

---

*This migration preserves the sophisticated AI conversation system and multiplayer capabilities while adding modern web application features for user management and enhanced experience.*