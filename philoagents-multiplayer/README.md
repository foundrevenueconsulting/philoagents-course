# PhiloAgents Multiplayer Server

A Colyseus-based multiplayer game server designed for the PhiloAgents project. This server provides real-time multiplayer functionality while serving as a reusable template for other multiplayer games.

## Features

- 🎮 **Real-time multiplayer** using Colyseus framework
- 🏗️ **Template-ready architecture** with abstract base classes
- 🐘 **PostgreSQL integration** for persistence and analytics
- 🚂 **Railway deployment ready** with Docker configuration
- 🔧 **Development tools** including monitor and playground
- 📊 **Built-in analytics** for room and player tracking
- 🧪 **Load testing** capabilities with custom scenarios

## Architecture

### Core Components

- **BaseRoom**: Abstract room class for template reusability
- **GameServer**: Main server setup with middleware and monitoring
- **PhilosophyRoom**: Philosophy-specific room implementation
- **GameState**: Colyseus schema for state synchronization
- **Database**: PostgreSQL integration for persistence

### Template Design

The codebase is structured to be easily extracted into a reusable template:

```
src/
├── core/           # Reusable base classes
├── rooms/          # Game-specific room implementations
├── schema/         # Colyseus state schemas
├── config/         # Configuration management
├── database/       # Database connection and models
└── types/          # TypeScript type definitions
```

## Development Setup

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Docker (optional)

### Local Development

1. **Install dependencies:**
   ```bash
   cd philoagents-multiplayer
   npm install
   ```

2. **Setup environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Access development tools:**
   - Server: http://localhost:2567
   - Monitor: http://localhost:2567/colyseus
   - Playground: http://localhost:2567/playground
   - Health: http://localhost:2567/health

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm run start` - Start production server
- `npm run loadtest` - Run load testing scenarios
- `npm run db:migrate` - Run database migrations

## Deployment

### Railway Deployment

This project is configured for Railway deployment:

1. **Build configuration** via `railway.json`
2. **Dockerfile** optimized for production
3. **Health checks** for monitoring
4. **Environment variables** for configuration

### Environment Variables

Required for production:

- `DATABASE_URL` - PostgreSQL connection string
- `NODE_ENV` - Environment (production/development)
- `PORT` - Server port (Railway provides this)

Optional:

- `MAX_PLAYERS_PER_ROOM` - Default: 10
- `WORLD_WIDTH` - Default: 1600
- `WORLD_HEIGHT` - Default: 1200
- `ENABLE_MONITOR` - Enable Colyseus monitor
- `ENABLE_PLAYGROUND` - Enable Colyseus playground

## Game Features

### Philosophy-Specific Features

- **Room-based multiplayer** with up to 10 players
- **Real-time player movement** with collision detection
- **Philosophy chat system** with message types
- **Philosopher NPC interactions** tracking
- **Thought sharing** between nearby players
- **Debate invitations** between players

### Base Template Features

- **Player management** with join/leave events
- **Movement validation** with world bounds
- **Inactive player cleanup** with configurable timeout
- **Chat system** with broadcast capabilities
- **Plugin system** for extensibility
- **Health monitoring** and graceful shutdown

## Database Schema

### Tables

- **game_sessions** - Room persistence and metadata
- **player_sessions** - Player tracking and analytics
- **chat_messages** - Message history and moderation
- **philosopher_interactions** - Philosophy-specific analytics

### Analytics Features

- Room activity tracking
- Player session duration
- Chat message analytics
- Philosopher interaction metrics
- Automatic cleanup of old data

## Load Testing

Test multiplayer scenarios with realistic player behavior:

```bash
# Test with 10 concurrent players
npm run loadtest

# Custom load test
npx colyseus-loadtest loadtest/basic.ts --room philosophy_room --numClients 20
```

The load test simulates:
- Random player movement
- Chat messages
- Philosopher interactions
- Natural disconnect patterns

## Template Extraction

This codebase is designed for easy extraction into a reusable template:

### Reusable Components (Template)

- `src/core/` - Base classes and server setup
- `src/config/` - Configuration management
- `src/database/` - Database integration
- `src/types/` - Common type definitions

### Philosophy-Specific Components

- `src/rooms/PhilosophyRoom.ts` - Philosophy game logic
- Philosophy-specific message handlers
- Custom interaction systems

## API Endpoints

- `GET /health` - Health check for monitoring
- `GET /api/info` - Server and room information
- `GET /metrics` - Production metrics (production only)
- `WS /` - Colyseus WebSocket endpoint

## Contributing

1. Follow the modular architecture
2. Keep template components generic
3. Add philosophy-specific features in dedicated files
4. Include tests for new functionality
5. Update documentation for API changes

## License

MIT License - See LICENSE file for details