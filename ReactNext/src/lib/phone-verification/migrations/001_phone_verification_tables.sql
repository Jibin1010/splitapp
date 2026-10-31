-- ====================================================================
-- Production PostgreSQL DDL: Free WhatsApp Phone Verification System
-- Tables: users, verification_challenges, webhook_events
-- ====================================================================

-- Extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table 1: users (Tracks phone verification timestamp)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number VARCHAR(32) NOT NULL UNIQUE,
    phone_verified_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);

-- Table 2: verification_challenges (Ephemeral verification challenges)
CREATE TABLE IF NOT EXISTS verification_challenges (
    id VARCHAR(64) PRIMARY KEY, -- e.g. "8f3a2c91a0b4d6e8"
    user_id UUID NULL REFERENCES users(id) ON DELETE SET NULL,
    phone_number VARCHAR(32) NOT NULL,
    token_hash VARCHAR(128) NOT NULL, -- HMAC-SHA256 digest
    status VARCHAR(24) NOT NULL DEFAULT 'PENDING', -- PENDING, VERIFIED, EXPIRED, CANCELLED
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    verified_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_challenges_phone_status ON verification_challenges(phone_number, status);
CREATE INDEX IF NOT EXISTS idx_challenges_expires ON verification_challenges(expires_at);

-- Table 3: webhook_events (Replay protection & idempotent processing)
CREATE TABLE IF NOT EXISTS webhook_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    whatsapp_message_id VARCHAR(128) NOT NULL UNIQUE,
    sender_number VARCHAR(32) NOT NULL,
    raw_payload JSONB NOT NULL,
    processing_status VARCHAR(24) NOT NULL, -- PROCESSED, DUPLICATE, IGNORED, FAILED
    received_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_msg_id ON webhook_events(whatsapp_message_id);

-- Auto-cleanup trigger function for expired challenges older than 24 hours
CREATE OR REPLACE FUNCTION purge_stale_challenges() RETURNS trigger AS $$
BEGIN
    DELETE FROM verification_challenges 
    WHERE created_at < NOW() - INTERVAL '24 hours';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

