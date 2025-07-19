-- Add API Test Collections Tables

-- Collections table
CREATE TABLE IF NOT EXISTS "api_test_collections" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "created_by" VARCHAR(255) NOT NULL,
  "shared_with" TEXT[], -- Array of usernames who can access this collection
  "folder_structure" JSONB DEFAULT '{}', -- JSON structure for organizing requests
  "variables" JSONB DEFAULT '{}', -- Collection-level variables
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Requests table
CREATE TABLE IF NOT EXISTS "api_test_requests" (
  "id" SERIAL PRIMARY KEY,
  "collection_id" INTEGER REFERENCES "api_test_collections"("id") ON DELETE CASCADE,
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "method" VARCHAR(10) NOT NULL, -- GET, POST, PUT, DELETE, etc.
  "url" TEXT NOT NULL,
  "headers" JSONB DEFAULT '{}',
  "query_params" JSONB DEFAULT '[]',
  "body" TEXT,
  "body_type" VARCHAR(50) DEFAULT 'raw', -- raw, form-data, x-www-form-urlencoded, binary
  "auth_type" VARCHAR(50) DEFAULT 'none', -- none, basic, bearer, api-key
  "auth_config" JSONB DEFAULT '{}',
  "pre_request_script" TEXT,
  "test_script" TEXT,
  "variables" JSONB DEFAULT '{}',
  "folder_path" VARCHAR(500),
  "sort_order" INTEGER DEFAULT 0,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Test history table
CREATE TABLE IF NOT EXISTS "api_test_history" (
  "id" SERIAL PRIMARY KEY,
  "request_id" INTEGER REFERENCES "api_test_requests"("id") ON DELETE CASCADE,
  "collection_id" INTEGER REFERENCES "api_test_collections"("id") ON DELETE CASCADE,
  "executed_by" VARCHAR(255) NOT NULL,
  "request_snapshot" JSONB NOT NULL, -- Snapshot of request at time of execution
  "response_status" INTEGER,
  "response_status_text" VARCHAR(255),
  "response_time" INTEGER, -- in milliseconds
  "response_size" INTEGER, -- in bytes
  "response_headers" JSONB,
  "response_body" TEXT,
  "test_results" JSONB, -- Results of test scripts if any
  "error" TEXT,
  "executed_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS "idx_api_test_collections_created_by" ON "api_test_collections"("created_by");
CREATE INDEX IF NOT EXISTS "idx_api_test_requests_collection_id" ON "api_test_requests"("collection_id");
CREATE INDEX IF NOT EXISTS "idx_api_test_history_request_id" ON "api_test_history"("request_id");
CREATE INDEX IF NOT EXISTS "idx_api_test_history_executed_at" ON "api_test_history"("executed_at");

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_api_test_collections_updated_at BEFORE UPDATE ON "api_test_collections"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_test_requests_updated_at BEFORE UPDATE ON "api_test_requests"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();