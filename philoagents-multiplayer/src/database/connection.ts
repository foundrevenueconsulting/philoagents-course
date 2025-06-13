import { Pool, Client } from 'pg';
import { databaseConfig } from '../config/game.config';

class DatabaseConnection {
  private pool: Pool;
  private isConnected: boolean = false;

  constructor() {
    this.pool = new Pool({
      connectionString: databaseConfig.url,
      max: databaseConfig.maxConnections,
      idleTimeoutMillis: databaseConfig.idleTimeout,
      connectionTimeoutMillis: 2000,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.pool.on('connect', () => {
      console.log('📦 PostgreSQL client connected');
      this.isConnected = true;
    });

    this.pool.on('error', (err) => {
      console.error('💥 PostgreSQL pool error:', err);
      this.isConnected = false;
    });

    this.pool.on('remove', () => {
      console.log('📦 PostgreSQL client removed');
    });
  }

  async initialize(): Promise<void> {
    try {
      // Test the connection
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      
      console.log('✅ PostgreSQL database connected successfully');
      
      // Run migrations if needed
      await this.runMigrations();
      
    } catch (error) {
      console.error('❌ Failed to connect to PostgreSQL:', error);
      throw error;
    }
  }

  private async runMigrations(): Promise<void> {
    try {
      // Create tables if they don't exist
      await this.createTables();
      console.log('✅ Database migrations completed');
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      // Game sessions table for room persistence
      await client.query(`
        CREATE TABLE IF NOT EXISTS game_sessions (
          id SERIAL PRIMARY KEY,
          room_id VARCHAR(255) UNIQUE NOT NULL,
          room_name VARCHAR(255) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          player_count INTEGER DEFAULT 0,
          max_players INTEGER DEFAULT 10,
          is_active BOOLEAN DEFAULT true,
          metadata JSONB DEFAULT '{}'
        )
      `);

      // Player sessions for analytics and reconnection
      await client.query(`
        CREATE TABLE IF NOT EXISTS player_sessions (
          id SERIAL PRIMARY KEY,
          session_id VARCHAR(255) NOT NULL,
          room_id VARCHAR(255) REFERENCES game_sessions(room_id) ON DELETE CASCADE,
          player_name VARCHAR(255) NOT NULL,
          joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          left_at TIMESTAMP WITH TIME ZONE,
          duration_seconds INTEGER,
          last_x FLOAT DEFAULT 0,
          last_y FLOAT DEFAULT 0,
          metadata JSONB DEFAULT '{}'
        )
      `);

      // Chat messages for moderation and analytics
      await client.query(`
        CREATE TABLE IF NOT EXISTS chat_messages (
          id SERIAL PRIMARY KEY,
          room_id VARCHAR(255) REFERENCES game_sessions(room_id) ON DELETE CASCADE,
          player_session_id INTEGER REFERENCES player_sessions(id) ON DELETE CASCADE,
          message_type VARCHAR(50) DEFAULT 'general',
          content TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          metadata JSONB DEFAULT '{}'
        )
      `);

      // Philosopher interactions for analytics
      await client.query(`
        CREATE TABLE IF NOT EXISTS philosopher_interactions (
          id SERIAL PRIMARY KEY,
          room_id VARCHAR(255) REFERENCES game_sessions(room_id) ON DELETE CASCADE,
          player_session_id INTEGER REFERENCES player_sessions(id) ON DELETE CASCADE,
          philosopher_id VARCHAR(255) NOT NULL,
          interaction_type VARCHAR(50) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          metadata JSONB DEFAULT '{}'
        )
      `);

      // Create indexes for performance
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_game_sessions_room_id ON game_sessions(room_id);
        CREATE INDEX IF NOT EXISTS idx_game_sessions_active ON game_sessions(is_active, last_activity);
        CREATE INDEX IF NOT EXISTS idx_player_sessions_room_id ON player_sessions(room_id);
        CREATE INDEX IF NOT EXISTS idx_player_sessions_session_id ON player_sessions(session_id);
        CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON chat_messages(room_id, created_at);
        CREATE INDEX IF NOT EXISTS idx_philosopher_interactions_room_id ON philosopher_interactions(room_id, created_at);
      `);

    } finally {
      client.release();
    }
  }

  // Helper methods for room persistence
  async saveGameSession(roomId: string, roomName: string, maxPlayers: number): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        INSERT INTO game_sessions (room_id, room_name, max_players)
        VALUES ($1, $2, $3)
        ON CONFLICT (room_id) DO UPDATE SET
          last_activity = NOW(),
          is_active = true
      `, [roomId, roomName, maxPlayers]);
    } finally {
      client.release();
    }
  }

  async updateGameSession(roomId: string, playerCount: number): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        UPDATE game_sessions 
        SET player_count = $1, last_activity = NOW()
        WHERE room_id = $2
      `, [playerCount, roomId]);
    } finally {
      client.release();
    }
  }

  async closeGameSession(roomId: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        UPDATE game_sessions 
        SET is_active = false, last_activity = NOW()
        WHERE room_id = $1
      `, [roomId]);
    } finally {
      client.release();
    }
  }

  // Helper methods for player tracking
  async savePlayerSession(sessionId: string, roomId: string, playerName: string): Promise<number> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        INSERT INTO player_sessions (session_id, room_id, player_name)
        VALUES ($1, $2, $3)
        RETURNING id
      `, [sessionId, roomId, playerName]);
      
      return result.rows[0].id;
    } finally {
      client.release();
    }
  }

  async updatePlayerPosition(sessionId: string, x: number, y: number): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        UPDATE player_sessions 
        SET last_x = $1, last_y = $2
        WHERE session_id = $3 AND left_at IS NULL
      `, [x, y, sessionId]);
    } finally {
      client.release();
    }
  }

  async closePlayerSession(sessionId: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        UPDATE player_sessions 
        SET left_at = NOW(),
            duration_seconds = EXTRACT(EPOCH FROM (NOW() - joined_at))
        WHERE session_id = $1 AND left_at IS NULL
      `, [sessionId]);
    } finally {
      client.release();
    }
  }

  // Analytics methods
  async getActiveRooms(): Promise<any[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT room_id, room_name, player_count, created_at, last_activity
        FROM game_sessions 
        WHERE is_active = true
        ORDER BY last_activity DESC
      `);
      
      return result.rows;
    } finally {
      client.release();
    }
  }

  async getRoomStats(roomId: string): Promise<any> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT 
          gs.*,
          COUNT(ps.id) as total_players_joined,
          AVG(ps.duration_seconds) as avg_session_duration,
          COUNT(cm.id) as total_messages
        FROM game_sessions gs
        LEFT JOIN player_sessions ps ON gs.room_id = ps.room_id
        LEFT JOIN chat_messages cm ON gs.room_id = cm.room_id
        WHERE gs.room_id = $1
        GROUP BY gs.id
      `, [roomId]);
      
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  // Cleanup methods
  async cleanupOldSessions(): Promise<void> {
    const client = await this.pool.connect();
    try {
      // Mark sessions as inactive if no activity for 1 hour
      await client.query(`
        UPDATE game_sessions 
        SET is_active = false
        WHERE is_active = true 
        AND last_activity < NOW() - INTERVAL '1 hour'
      `);

      // Delete old sessions and related data (older than 30 days)
      await client.query(`
        DELETE FROM game_sessions 
        WHERE created_at < NOW() - INTERVAL '30 days'
      `);
      
      console.log('🧹 Database cleanup completed');
    } finally {
      client.release();
    }
  }

  getPool(): Pool {
    return this.pool;
  }

  isHealthy(): boolean {
    return this.isConnected && !this.pool.ended;
  }

  async close(): Promise<void> {
    await this.pool.end();
    console.log('📦 PostgreSQL connection pool closed');
  }
}

// Export singleton instance
export const database = new DatabaseConnection();