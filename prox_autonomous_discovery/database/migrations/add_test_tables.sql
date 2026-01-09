-- Create tables for E2E test results

CREATE TABLE IF NOT EXISTS test_runs (
    id SERIAL PRIMARY KEY,
    run_id VARCHAR(50) UNIQUE NOT NULL,
    total_tests INT DEFAULT 0,
    passed INT DEFAULT 0,
    failed INT DEFAULT 0,
    skipped INT DEFAULT 0,
    duration_seconds FLOAT,
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    triggered_by VARCHAR(50) DEFAULT 'manual'
);

CREATE TABLE IF NOT EXISTS test_results (
    id SERIAL PRIMARY KEY,
    test_run_id VARCHAR(50) NOT NULL,
    test_name VARCHAR(200) NOT NULL,
    test_category VARCHAR(50),
    status VARCHAR(20) NOT NULL,
    duration_seconds FLOAT,
    error_message TEXT,
    details JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    
    FOREIGN KEY (test_run_id) REFERENCES test_runs(run_id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_test_runs_time ON test_runs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_test_results_run ON test_results(test_run_id);
CREATE INDEX IF NOT EXISTS idx_test_results_status ON test_results(status);

COMMENT ON TABLE test_runs IS 'Store metadata for each test execution run';
COMMENT ON TABLE test_results IS 'Store individual test results for each run';