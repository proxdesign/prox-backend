-- Prox Trend Discovery Database Schema
-- Run this script to create all necessary tables and indexes

-- Platform content storage
CREATE TABLE IF NOT EXISTS platform_posts (
    id SERIAL PRIMARY KEY,
    post_id VARCHAR(255) UNIQUE NOT NULL,
    platform VARCHAR(50) NOT NULL,
    title TEXT,
    content TEXT,
    author VARCHAR(255),
    url TEXT,
    created_at TIMESTAMP,
    collected_at TIMESTAMP DEFAULT NOW(),
    engagement_data JSONB,
    metadata JSONB,
    processed BOOLEAN DEFAULT FALSE,
    content_hash VARCHAR(64)
);

-- Discovered trends
CREATE TABLE IF NOT EXISTS discovered_trends (
    id SERIAL PRIMARY KEY,
    trend_name VARCHAR(255),
    discovery_date TIMESTAMP DEFAULT NOW(),
    discovery_confidence DECIMAL(3,2),
    current_stage VARCHAR(50),
    platforms_detected TEXT[],
    content_examples INTEGER[],
    trend_characteristics JSONB,
    sustainability_score DECIMAL(3,2),
    last_updated TIMESTAMP DEFAULT NOW(),
    trend_description TEXT,
    keywords TEXT[]
);

-- Prox principle assessments
CREATE TABLE IF NOT EXISTS principle_assessments (
    id SERIAL PRIMARY KEY,
    trend_id INTEGER REFERENCES discovered_trends(id),
    assessment_date TIMESTAMP DEFAULT NOW(),
    everyday_elevation_score DECIMAL(3,2),
    tangible_potential_score DECIMAL(3,2),
    intentional_living_score DECIMAL(3,2),
    overall_prox_fit DECIMAL(3,2),
    business_recommendation TEXT,
    assessment_details JSONB,
    recommended_action VARCHAR(100)
);

-- Analysis results and reports
CREATE TABLE IF NOT EXISTS analysis_reports (
    id SERIAL PRIMARY KEY,
    report_type VARCHAR(50),
    report_date TIMESTAMP DEFAULT NOW(),
    trends_analyzed INTEGER[],
    report_data JSONB,
    human_notes TEXT,
    key_insights TEXT[]
);

-- Claude analysis cache
CREATE TABLE IF NOT EXISTS claude_analysis_cache (
    id SERIAL PRIMARY KEY,
    content_hash VARCHAR(64) UNIQUE,
    analysis_type VARCHAR(50),
    analysis_result JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Historical baseline data
CREATE TABLE IF NOT EXISTS historical_trends (
    id SERIAL PRIMARY KEY,
    trend_name VARCHAR(255),
    data_source VARCHAR(100),
    time_period VARCHAR(50),
    trend_data JSONB,
    collected_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_platform_posts_platform ON platform_posts(platform);
CREATE INDEX IF NOT EXISTS idx_platform_posts_created_at ON platform_posts(created_at);
CREATE INDEX IF NOT EXISTS idx_platform_posts_processed ON platform_posts(processed);
CREATE INDEX IF NOT EXISTS idx_platform_posts_hash ON platform_posts(content_hash);

CREATE INDEX IF NOT EXISTS idx_discovered_trends_stage ON discovered_trends(current_stage);
CREATE INDEX IF NOT EXISTS idx_discovered_trends_discovery_date ON discovered_trends(discovery_date);
CREATE INDEX IF NOT EXISTS idx_discovered_trends_confidence ON discovered_trends(discovery_confidence);

CREATE INDEX IF NOT EXISTS idx_principle_assessments_trend_id ON principle_assessments(trend_id);
CREATE INDEX IF NOT EXISTS idx_principle_assessments_overall_fit ON principle_assessments(overall_prox_fit);

CREATE INDEX IF NOT EXISTS idx_analysis_reports_type ON analysis_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_analysis_reports_date ON analysis_reports(report_date);

CREATE INDEX IF NOT EXISTS idx_claude_cache_hash ON claude_analysis_cache(content_hash);
CREATE INDEX IF NOT EXISTS idx_claude_cache_type ON claude_analysis_cache(analysis_type);

-- Create a view for trend analysis dashboard
CREATE OR REPLACE VIEW trend_dashboard AS
SELECT 
    dt.id,
    dt.trend_name,
    dt.discovery_date,
    dt.current_stage,
    dt.discovery_confidence,
    dt.platforms_detected,
    pa.overall_prox_fit,
    pa.recommended_action,
    array_length(dt.content_examples, 1) as example_count
FROM discovered_trends dt
LEFT JOIN principle_assessments pa ON dt.id = pa.trend_id
ORDER BY dt.discovery_date DESC;

-- Insert initial configuration
INSERT INTO analysis_reports (report_type, report_data, human_notes) VALUES 
('system_init', '{"database_created": true, "version": "1.0"}', 'Initial database setup completed')
ON CONFLICT DO NOTHING;

SELECT 'Database setup completed successfully!' as status;