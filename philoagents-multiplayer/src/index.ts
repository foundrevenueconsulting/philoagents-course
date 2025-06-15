import { GameServer } from "./core/GameServer";
import { PhilosophyRoom } from "./rooms/PhilosophyRoom";
import { serverConfig } from "./config/game.config";
import { database } from "./database/connection";

async function startServer() {
  try {
    // console.log('🚀 Starting PhiloAgents Multiplayer Server...');
    
    // Initialize database connection
    await database.initialize();
    
    // Create game server instance
    const gameServer = new GameServer(serverConfig);
    
    // Register room types
    gameServer.registerRoom('philosophy_room', PhilosophyRoom);
    
    // Setup development tools (monitor, playground)
    gameServer.setupDevelopmentTools();
    
    // Setup production monitoring
    gameServer.setupProductionMonitoring();
    
    // Setup graceful shutdown
    gameServer.setupGracefulShutdown();
    
    // Start listening
    await gameServer.listen();
    
    // console.log('✅ PhiloAgents Multiplayer Server started successfully!');
    // console.log(`📊 Environment: ${serverConfig.nodeEnv}`);
    // console.log(`🌐 Server: http://localhost:${serverConfig.port}`);
    
    if (serverConfig.nodeEnv !== 'production') {
      // console.log(`🔍 Monitor: http://localhost:${serverConfig.port}/colyseus`);
      // console.log(`🎮 Playground: http://localhost:${serverConfig.port}/playground`);
    }
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Start the server
startServer();