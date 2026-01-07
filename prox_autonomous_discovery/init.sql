-- Combined database initialization script for Railway deployment
-- This script creates the schema and populates critical data

-- First run schema.sql to create tables
\i schema.sql

-- Then run data.sql to populate with products and solutions
\i data.sql

-- Create any missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_solution_id ON products(solution_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);
CREATE INDEX IF NOT EXISTS idx_products_trend_score ON products(trend_score);
CREATE INDEX IF NOT EXISTS idx_solutions_problem_id ON solutions(problem_id);
CREATE INDEX IF NOT EXISTS idx_problems_active ON problems(active);

-- Ensure affiliate partners table has Amazon Associates
INSERT INTO affiliate_partners (partner_name, partner_url, commission_rate, active, created_at)
VALUES ('Amazon Associates', 'https://amazon.com', 5.0, true, NOW())
ON CONFLICT (partner_name) DO NOTHING;

-- Grant permissions (Railway handles this automatically)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO railway;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO railway;