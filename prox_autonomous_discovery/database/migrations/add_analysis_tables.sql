-- Add AI Analysis Tables for Phase 3
-- Run with: psql -U thepollees prox_trends -f database/migrations/add_analysis_tables.sql

-- Problems extracted from social media posts
CREATE TABLE IF NOT EXISTS problems (
    id SERIAL PRIMARY KEY,
    problem_text TEXT NOT NULL,
    problem_category VARCHAR(100),
    platform_mentions INT DEFAULT 1,
    trend_score DECIMAL(4,2) DEFAULT 5.0,
    first_seen TIMESTAMP DEFAULT NOW(),
    last_updated TIMESTAMP DEFAULT NOW(),
    active BOOLEAN DEFAULT TRUE
);

-- Solutions for problems
CREATE TABLE IF NOT EXISTS solutions (
    id SERIAL PRIMARY KEY,
    problem_id INT REFERENCES problems(id) ON DELETE CASCADE,
    solution_description TEXT NOT NULL,
    solution_type VARCHAR(100),
    effectiveness_score DECIMAL(4,2) DEFAULT 5.0,
    mention_count INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Affiliate partners
CREATE TABLE IF NOT EXISTS affiliate_partners (
    id SERIAL PRIMARY KEY,
    partner_name VARCHAR(100) NOT NULL,
    commission_rate DECIMAL(5,2),
    cookie_duration_days INT,
    api_available BOOLEAN DEFAULT FALSE,
    api_endpoint VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Products linked to solutions
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    solution_id INT REFERENCES solutions(id) ON DELETE CASCADE,
    affiliate_partner_id INT REFERENCES affiliate_partners(id),
    product_name VARCHAR(255) NOT NULL,
    brand VARCHAR(100),
    price DECIMAL(10,2),
    dimensions VARCHAR(100),
    style VARCHAR(50),
    material VARCHAR(100),
    affiliate_url TEXT NOT NULL,
    image_url TEXT,
    rating DECIMAL(3,2),
    review_count INT,
    trend_score DECIMAL(4,2) DEFAULT 5.0,
    quality_score DECIMAL(5,2) DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    last_checked TIMESTAMP DEFAULT NOW(),
    specs JSONB
);

-- Editorial content for products
CREATE TABLE IF NOT EXISTS content_snippets (
    id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(id) ON DELETE CASCADE,
    problem_id INT REFERENCES problems(id),
    editorial_content TEXT NOT NULL,
    why_trending TEXT,
    user_quote TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    approved BOOLEAN DEFAULT FALSE,
    quality_score DECIMAL(3,2)
);

-- User conversation sessions
CREATE TABLE IF NOT EXISTS user_sessions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    initial_query TEXT,
    problem_category VARCHAR(100),
    user_preferences JSONB,
    products_shown JSONB,
    clicks INT DEFAULT 0,
    rejections INT DEFAULT 0,
    conversions INT DEFAULT 0,
    user_messages JSONB,
    started_at TIMESTAMP DEFAULT NOW(),
    last_activity TIMESTAMP DEFAULT NOW()
);

-- User feedback
CREATE TABLE IF NOT EXISTS feedback (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) REFERENCES user_sessions(session_id),
    product_id INT REFERENCES products(id),
    problem_id INT REFERENCES problems(id),
    feedback_type VARCHAR(50),
    feedback_text TEXT,
    user_segment VARCHAR(100),
    user_style VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Agent activity logs
CREATE TABLE IF NOT EXISTS agent_logs (
    id SERIAL PRIMARY KEY,
    agent_name VARCHAR(100) NOT NULL,
    action_type VARCHAR(100),
    details JSONB,
    result VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_problems_category ON problems(problem_category);
CREATE INDEX IF NOT EXISTS idx_problems_trend_score ON problems(trend_score DESC);
CREATE INDEX IF NOT EXISTS idx_problems_active ON problems(active);

CREATE INDEX IF NOT EXISTS idx_solutions_problem_id ON solutions(problem_id);
CREATE INDEX IF NOT EXISTS idx_solutions_effectiveness ON solutions(effectiveness_score DESC);

CREATE INDEX IF NOT EXISTS idx_products_solution_id ON products(solution_id);
CREATE INDEX IF NOT EXISTS idx_products_trend_score ON products(trend_score DESC);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);
CREATE INDEX IF NOT EXISTS idx_products_partner ON products(affiliate_partner_id);

CREATE INDEX IF NOT EXISTS idx_content_snippets_product_id ON content_snippets(product_id);
CREATE INDEX IF NOT EXISTS idx_content_snippets_problem_id ON content_snippets(problem_id);

CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON user_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_started_at ON user_sessions(started_at DESC);

CREATE INDEX IF NOT EXISTS idx_feedback_session_id ON feedback(session_id);
CREATE INDEX IF NOT EXISTS idx_feedback_product_id ON feedback(product_id);

CREATE INDEX IF NOT EXISTS idx_agent_logs_agent_name ON agent_logs(agent_name);
CREATE INDEX IF NOT EXISTS idx_agent_logs_created_at ON agent_logs(created_at DESC);

-- Insert default affiliate partners
INSERT INTO affiliate_partners (partner_name, commission_rate, cookie_duration_days, api_available) VALUES
('Amazon Associates', 5.0, 1, TRUE),
('Wayfair', 7.0, 30, TRUE),
('Target', 3.0, 7, TRUE),
('Overstock', 6.0, 14, TRUE),
('Home Depot', 5.0, 7, TRUE)
ON CONFLICT DO NOTHING;

SELECT 'Analysis tables created successfully!' as status;