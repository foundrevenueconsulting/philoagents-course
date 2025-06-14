# PhiloAgents Multiplayer Server - Deployment Guide

This guide covers local development setup and production deployment conventions for the PhiloAgents multiplayer game server built with Colyseus.

## 🏗️ Architecture Overview

The multiplayer server provides:
- **Real-time multiplayer game rooms** for philosophical conversations
- **WebSocket connections** for instant player interactions
- **PostgreSQL database** for session persistence
- **Redis caching** for session storage (optional)
- **Colyseus framework** for game state management

## 🚀 Quick Start - Local Development

### Prerequisites
- Node.js 18+
- Docker and Docker Compose
- PostgreSQL (if not using Docker)

### 1. Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Configure your environment variables
nano .env
```

### 2. Start with Docker (Recommended)
```bash
# Start complete local environment
make docker-dev

# Or run in background
make docker-dev-bg

# View logs
make docker-logs
```

### 3. Start without Docker
```bash
# Install dependencies
make install

# Start PostgreSQL locally (or use Docker)
# Configure DATABASE_URL in .env

# Start development server
make dev
```

### 4. Verify Setup
```bash
# Check server health
make health

# Open monitor dashboard
make monitor

# Run load tests
make loadtest
```

## 🐳 Docker Deployment Conventions

### Local Development
- **File**: `docker-compose.local.yml`
- **Services**: PostgreSQL, Redis, Multiplayer Server
- **Features**: Hot reload, debug tools, monitor enabled
- **Ports**: 2567 (server), 5433 (postgres), 6380 (redis)

### Production Build
- **File**: `Dockerfile`
- **Optimization**: Multi-stage build, non-root user, health checks
- **Size**: ~50MB Alpine-based image
- **Security**: Minimal attack surface, proper user permissions

## 🌐 Production Deployment

### Railway Platform (Recommended)

#### 1. Setup Railway Project
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway link
railway deploy
```

#### 2. Configure Environment Variables
Required variables for production:
```bash
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:port/db
CORS_ORIGIN=https://your-frontend-domain.com
ENABLE_MONITOR=false
ENABLE_PLAYGROUND=false
```

#### 3. Railway Configuration
- **File**: `railway.json`
- **Build**: Dockerfile-based
- **Health Check**: `/health` endpoint
- **Auto-deploy**: On git push to main branch
- **Scaling**: 1 replica (can be increased)

### Alternative Platforms

#### Vercel (Functions)
- Limited to serverless functions
- Not recommended for real-time WebSocket connections
- Better suited for REST API endpoints

#### AWS/GCP/Azure
- Use container deployment services
- Configure load balancer for WebSocket support
- Set up managed PostgreSQL database

## 📊 Environment Configurations

### Local Development
```bash
NODE_ENV=development
PORT=2567
CORS_ORIGIN=http://localhost:3000,http://localhost:8080
ENABLE_MONITOR=true
ENABLE_PLAYGROUND=true
MAX_PLAYERS_PER_ROOM=10
DATABASE_URL=postgresql://localhost:5432/philoagents_multiplayer
```

### Production
```bash
NODE_ENV=production
PORT=${PORT}  # Railway provides dynamic port
CORS_ORIGIN=https://your-app.vercel.app
ENABLE_MONITOR=false
ENABLE_PLAYGROUND=false
MAX_PLAYERS_PER_ROOM=10
DATABASE_URL=${DATABASE_URL}  # Railway provides PostgreSQL
```

### Development/Staging
```bash
NODE_ENV=development
CORS_ORIGIN=https://your-preview.vercel.app
ENABLE_MONITOR=true
ENABLE_PLAYGROUND=true
MAX_PLAYERS_PER_ROOM=5
```

## 🔧 Integration with PhiloAgents Stack

### Frontend Integration
Update your Next.js environment:
```bash
# .env.local
NEXT_PUBLIC_MULTIPLAYER_URL=ws://localhost:2567  # Local
NEXT_PUBLIC_MULTIPLAYER_URL=wss://your-app.railway.app  # Production
```

### API Integration
Configure API endpoints:
```bash
# Multiplayer .env
PHILOAGENTS_API_URL=http://localhost:8000  # Local
PHILOAGENTS_API_URL=https://your-api.railway.app  # Production
```

### Database Integration
```bash
# For philosopher data access
MONGO_URI=mongodb://localhost:27017/philoagents
```

## 🛠️ Development Workflow

### Daily Development
```bash
# Start development environment
make docker-dev

# Make changes to src/ files (auto-reload enabled)
# View logs
make docker-logs

# Run tests
make test

# Check code quality
make lint && make format
```

### Deployment Process
```bash
# 1. Test locally
make test

# 2. Build production image
make build-prod

# 3. Deploy to Railway
make deploy-railway

# 4. Verify deployment
curl -f https://your-app.railway.app/health
```

## 📈 Monitoring and Debugging

### Local Monitoring
- **Colyseus Monitor**: http://localhost:2567/colyseus
- **Health Check**: http://localhost:2567/health
- **Playground**: http://localhost:2567
- **Logs**: `make docker-logs`

### Production Monitoring
- **Railway Dashboard**: Monitor resources and logs
- **Health Endpoint**: `/health` for uptime monitoring
- **Error Tracking**: Configure Sentry or similar service

### Performance Testing
```bash
# Load test with 10 concurrent players
make loadtest

# Custom load test
npm run loadtest -- --numClients 20 --duration 60
```

## 🔒 Security Considerations

### Development
- Monitor and playground endpoints enabled
- Permissive CORS settings
- Database exposed on local network

### Production
- Monitor and playground disabled
- Strict CORS configuration
- Environment variables for secrets
- Non-root container user
- Health check timeout protection

## 🚨 Troubleshooting

### Common Issues
1. **WebSocket Connection Failed**
   - Check CORS_ORIGIN configuration
   - Verify firewall/proxy settings
   - Ensure WebSocket support in load balancer

2. **Database Connection Error**
   - Verify DATABASE_URL format
   - Check network connectivity
   - Confirm database exists and is accessible

3. **Memory/Performance Issues**
   - Monitor player count per room
   - Check for memory leaks in game logic
   - Scale horizontally if needed

### Debug Commands
```bash
# Check container status
make docker-logs

# Connect to database
make db-connect

# Test server health
make health

# View container resources
docker stats philoagents-multiplayer-local
```

## 📝 Deployment Checklist

### Before Deployment
- [ ] Environment variables configured
- [ ] Database schema migrated
- [ ] Tests passing
- [ ] Load testing completed
- [ ] CORS origins updated
- [ ] Health check endpoint working

### After Deployment
- [ ] Verify health endpoint
- [ ] Test WebSocket connections
- [ ] Monitor resource usage
- [ ] Check error logs
- [ ] Update frontend environment variables

## 🔄 CI/CD Integration

### GitHub Actions Example
```yaml
name: Deploy Multiplayer Server
on:
  push:
    branches: [main]
    paths: ['philoagents-multiplayer/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: railway deploy
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

This deployment guide ensures consistent development and production environments while maintaining security and performance best practices.