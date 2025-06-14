-- Database initialization script for PhiloAgents Multiplayer Server
-- This script sets up the basic schema for local development

-- Create necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Player sessions table
CREATE TABLE IF NOT EXISTS player_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR(255) UNIQUE NOT NULL,
    player_name VARCHAR(100) NOT NULL,
    character_type VARCHAR(50),
    room_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Game rooms table
CREATE TABLE IF NOT EXISTS game_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id VARCHAR(255) UNIQUE NOT NULL,
    room_type VARCHAR(50) NOT NULL,
    max_players INTEGER DEFAULT 10,
    current_players INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Chat messages table (for persistence)
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id VARCHAR(255) NOT NULL,
    player_session_id UUID REFERENCES player_sessions(id),
    message_type VARCHAR(50) DEFAULT 'chat',
    content TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Player positions table (for persistence across reconnections)
CREATE TABLE IF NOT EXISTS player_positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR(255) UNIQUE NOT NULL,
    x FLOAT NOT NULL DEFAULT 0,
    y FLOAT NOT NULL DEFAULT 0,
    direction VARCHAR(20) DEFAULT 'down',
    is_moving BOOLEAN DEFAULT false,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Game statistics table
CREATE TABLE IF NOT EXISTS game_statistics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id VARCHAR(255) NOT NULL,
    stat_type VARCHAR(50) NOT NULL,
    stat_value JSONB,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_player_sessions_session_id ON player_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_player_sessions_room_id ON player_sessions(room_id);
CREATE INDEX IF NOT EXISTS idx_game_rooms_room_id ON game_rooms(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_player_positions_session_id ON player_positions(session_id);
CREATE INDEX IF NOT EXISTS idx_game_statistics_room_id ON game_statistics(room_id);

-- Insert default room configuration
INSERT INTO game_rooms (room_id, room_type, max_players, current_players)
VALUES ('philosophy_room_1', 'philosophy', 10, 0)
ON CONFLICT (room_id) DO NOTHING;