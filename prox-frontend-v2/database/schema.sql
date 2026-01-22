-- User Profiles & Saved Products Database Schema
-- Created: 2026-01-09
-- This schema supports user authentication, product saving, and feedback collection

-- Users table for basic authentication
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP,
  preferences JSONB DEFAULT '{}'
);

-- Index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Saved/favorited products
-- Using JSONB to store product data for flexibility when external APIs change
CREATE TABLE IF NOT EXISTS saved_products (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  product_id VARCHAR(255) NOT NULL, -- Can be ASIN, URL hash, or any unique identifier
  product_data JSONB NOT NULL, -- Store product info: title, price, image, link, etc.
  saved_at TIMESTAMP DEFAULT NOW(),
  notes TEXT,
  list_name VARCHAR(100) DEFAULT 'Favorites',
  UNIQUE(user_id, product_id, list_name)
);

-- Indexes for saved products
CREATE INDEX IF NOT EXISTS idx_saved_products_user_id ON saved_products(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_products_saved_at ON saved_products(saved_at DESC);

-- Product feedback for improving recommendations
CREATE TABLE IF NOT EXISTS product_feedback (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE SET NULL, -- Allow anonymous feedback
  product_id VARCHAR(255) NOT NULL,
  session_id VARCHAR(255), -- Track anonymous sessions
  feedback_type VARCHAR(50) NOT NULL, -- 'helpful', 'not_helpful', 'too_expensive', 'wrong_style', 'wrong_size', 'purchased'
  feedback_text TEXT,
  product_data JSONB, -- Store product context when feedback was given
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for product feedback
CREATE INDEX IF NOT EXISTS idx_product_feedback_product_id ON product_feedback(product_id);
CREATE INDEX IF NOT EXISTS idx_product_feedback_type ON product_feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_product_feedback_created_at ON product_feedback(created_at DESC);

-- Conversation feedback for overall experience
CREATE TABLE IF NOT EXISTS conversation_feedback (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL,
  user_id INT REFERENCES users(id) ON DELETE SET NULL, -- Allow anonymous feedback
  rating INT CHECK (rating >= 1 AND rating <= 5),
  feedback_text TEXT,
  conversation_data JSONB, -- Store conversation context
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for conversation feedback
CREATE INDEX IF NOT EXISTS idx_conversation_feedback_session_id ON conversation_feedback(session_id);
CREATE INDEX IF NOT EXISTS idx_conversation_feedback_rating ON conversation_feedback(rating);

-- User sessions for authentication (optional, can use JWT only)
CREATE TABLE IF NOT EXISTS user_sessions (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP DEFAULT NOW()
);

-- Index for session lookups
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

-- Sample data for development (optional)
-- INSERT INTO users (email, name) VALUES 
--   ('test@example.com', 'Test User'),
--   ('demo@prox.com', 'Demo User');

-- Clean up expired sessions (run periodically)
-- DELETE FROM user_sessions WHERE expires_at < NOW();

-- Analytics views (optional)
-- CREATE VIEW user_stats AS
-- SELECT 
--   u.id,
--   u.name,
--   u.email,
--   u.created_at,
--   COUNT(sp.id) as saved_products_count,
--   COUNT(pf.id) as feedback_count,
--   MAX(u.last_login) as last_activity
-- FROM users u
-- LEFT JOIN saved_products sp ON u.id = sp.user_id
-- LEFT JOIN product_feedback pf ON u.id = pf.user_id
-- GROUP BY u.id, u.name, u.email, u.created_at;