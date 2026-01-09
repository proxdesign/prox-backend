-- Add agent logs table for tracking autonomous agent activities
-- This table logs all autonomous agent runs for monitoring and debugging

CREATE TABLE IF NOT EXISTS agent_logs (
    id SERIAL PRIMARY KEY,
    agent_name VARCHAR(100) NOT NULL,
    action_type VARCHAR(100),
    details JSONB,
    items_processed INT DEFAULT 0,
    items_affected INT DEFAULT 0,
    errors JSONB,
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    duration_seconds FLOAT,
    success BOOLEAN DEFAULT TRUE
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_agent_logs_agent ON agent_logs(agent_name);
CREATE INDEX IF NOT EXISTS idx_agent_logs_time ON agent_logs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_logs_success ON agent_logs(success);

-- Add comments for documentation
COMMENT ON TABLE agent_logs IS 'Logs for autonomous agent activities';
COMMENT ON COLUMN agent_logs.agent_name IS 'Name of the agent (e.g., link_health_monitor)';
COMMENT ON COLUMN agent_logs.action_type IS 'Type of action performed (e.g., scheduled_run)';
COMMENT ON COLUMN agent_logs.details IS 'JSON details about the agent run results';
COMMENT ON COLUMN agent_logs.items_processed IS 'Number of items the agent processed';
COMMENT ON COLUMN agent_logs.items_affected IS 'Number of items the agent modified/affected';
COMMENT ON COLUMN agent_logs.errors IS 'JSON array of any errors encountered';
COMMENT ON COLUMN agent_logs.duration_seconds IS 'How long the agent run took in seconds';