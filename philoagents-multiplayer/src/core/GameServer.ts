import { Server } from "colyseus";
import { createServer } from "http";
import express from "express";
import cors from "cors";
import { monitor } from "@colyseus/monitor";
import { playground } from "@colyseus/playground";
import { ServerConfig } from "../config/game.config";

export class GameServer {
  private app: express.Application;
  private server: any;
  private gameServer: Server;
  private config: ServerConfig;

  constructor(config: ServerConfig) {
    this.config = config;
    this.app = express();
    this.setupMiddleware();
    this.server = createServer(this.app);
    this.gameServer = new Server({
      server: this.server,
    });
  }

  private setupMiddleware() {
    // Enable CORS
    this.app.use(cors({
      origin: this.config.corsOrigin,
      credentials: true
    }));

    // Parse JSON bodies
    this.app.use(express.json());

    // Health check endpoint for Railway
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        rooms: 0, // TODO: Implement room counting
      });
    });

    // API info endpoint
    this.app.get('/api/info', (req, res) => {
      res.json({
        name: 'BioTypes Arena Multiplayer Server',
        version: '1.0.0',
        colyseus: "0.15.0", // TODO: Get actual version
        rooms: [], // TODO: Implement room listing
        config: {
          maxRooms: 100, // Configurable
          environment: this.config.nodeEnv
        }
      });
    });
  }

  // Register room types
  public registerRoom(name: string, roomClass: any, options?: any) {
    this.gameServer.define(name, roomClass, options);
    // console.log(`Registered room type: ${name}`);
  }

  // Setup development tools
  public setupDevelopmentTools() {
    if (this.config.nodeEnv !== 'production') {
      if (this.config.enableMonitor) {
        this.app.use("/colyseus", monitor());
        // console.log(`Monitor available at: http://localhost:${this.config.port}/colyseus`);
      }

      if (this.config.enablePlayground) {
        this.app.use("/playground", playground);
        // console.log(`Playground available at: http://localhost:${this.config.port}/playground`);
      }
    }
  }

  // Setup production monitoring and metrics
  public setupProductionMonitoring() {
    if (this.config.nodeEnv === 'production') {
      // Add production monitoring endpoints
      this.app.get('/metrics', (req, res) => {
        const metrics = {
          rooms: 0, // TODO: Implement room counting,
          connections: this.getTotalConnections(),
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          timestamp: Date.now()
        };
        res.json(metrics);
      });

      // Error handling middleware
      this.app.use((err: any, req: any, res: any, next: any) => {
        console.error('Express error:', err);
        res.status(500).json({ error: 'Internal server error' });
      });
    }
  }

  private getTotalConnections(): number {
    // TODO: Implement proper connection counting
    return 0;
  }

  // Graceful shutdown handling
  public setupGracefulShutdown() {
    const gracefulShutdown = async (signal: string) => {
      // console.log(`Received ${signal}. Starting graceful shutdown...`);
      
      try {
        // Stop accepting new connections
        this.server.close(() => {
          // console.log('HTTP server closed');
        });

        // Give existing connections time to finish
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // console.log('Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        console.error('Error during graceful shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  }

  // Start the server
  public async listen(): Promise<void> {
    return new Promise((resolve) => {
      this.gameServer.listen(this.config.port);
      // console.log(`🎮 Colyseus game server listening on port ${this.config.port}`);
      // console.log(`Environment: ${this.config.nodeEnv}`);
      resolve();
    });
  }

  // Getters for external access
  public getGameServer(): Server {
    return this.gameServer;
  }

  public getExpressApp(): express.Application {
    return this.app;
  }
}