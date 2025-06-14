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

### 🎨 Current Features
- **Landing Page**: Marketing page with feature overview
- **Authentication Pages**: Sign-in/sign-up with Clerk integration
- **Dashboard**: User dashboard with navigation to game and features
- **Game Page**: Placeholder for Phaser.js game integration
- **Responsive Design**: Mobile-friendly UI with dark mode support

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

### Phase 2: Game Integration
- [ ] Create Phaser.js game component with user context
- [ ] Migrate game scenes from original project
- [ ] Integrate user data with game state
- [ ] Add conversation history persistence

### Phase 3: Enhanced Features
- [ ] User conversation history
- [ ] Philosopher selection and preferences
- [ ] Multiplayer integration with user accounts
- [ ] Social features and conversation sharing

### Phase 4: Database Integration
- [ ] User sync with PostgreSQL and MongoDB
- [ ] Conversation history API
- [ ] User preferences and settings
- [ ] Analytics and insights

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