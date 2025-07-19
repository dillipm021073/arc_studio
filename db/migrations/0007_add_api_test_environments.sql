-- Add Environment Management for API Testing

-- Environments table (Dev, SIT, UAT, PROD, etc.)
CREATE TABLE IF NOT EXISTS "api_test_environments" (
  "id" SERIAL PRIMARY KEY,
  "collection_id" INTEGER NOT NULL REFERENCES "api_test_collections"("id") ON DELETE CASCADE,
  "name" VARCHAR(50) NOT NULL, -- Dev, SIT, UAT, PROD, Custom
  "display_name" VARCHAR(100) NOT NULL, -- User-friendly name
  "description" TEXT,
  "is_active" BOOLEAN DEFAULT true,
  "is_default" BOOLEAN DEFAULT false,
  "color" VARCHAR(7), -- Hex color for UI
  "sort_order" INTEGER DEFAULT 0,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("collection_id", "name")
);

-- Environment Variables table
CREATE TABLE IF NOT EXISTS "api_test_environment_variables" (
  "id" SERIAL PRIMARY KEY,
  "environment_id" INTEGER NOT NULL REFERENCES "api_test_environments"("id") ON DELETE CASCADE,
  "key" VARCHAR(255) NOT NULL,
  "value" TEXT NOT NULL,
  "type" VARCHAR(50) DEFAULT 'string', -- string, number, boolean, secret
  "is_secret" BOOLEAN DEFAULT false, -- If true, value should be encrypted/masked
  "description" TEXT,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("environment_id", "key")
);

-- Global Variables (shared across all environments in a collection)
CREATE TABLE IF NOT EXISTS "api_test_global_variables" (
  "id" SERIAL PRIMARY KEY,
  "collection_id" INTEGER NOT NULL REFERENCES "api_test_collections"("id") ON DELETE CASCADE,
  "key" VARCHAR(255) NOT NULL,
  "value" TEXT NOT NULL,
  "type" VARCHAR(50) DEFAULT 'string',
  "is_secret" BOOLEAN DEFAULT false,
  "description" TEXT,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("collection_id", "key")
);

-- Add environment_id to requests table (to track which environment was used)
ALTER TABLE "api_test_requests" 
ADD COLUMN IF NOT EXISTS "last_used_environment_id" INTEGER REFERENCES "api_test_environments"("id") ON DELETE SET NULL;

-- Add environment_id to history table
ALTER TABLE "api_test_history" 
ADD COLUMN IF NOT EXISTS "environment_id" INTEGER REFERENCES "api_test_environments"("id") ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS "resolved_variables" JSONB; -- Store resolved variable values at execution time

-- Add current_environment_id to collections table
ALTER TABLE "api_test_collections"
ADD COLUMN IF NOT EXISTS "current_environment_id" INTEGER REFERENCES "api_test_environments"("id") ON DELETE SET NULL;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS "idx_api_test_environments_collection_id" ON "api_test_environments"("collection_id");
CREATE INDEX IF NOT EXISTS "idx_api_test_environment_variables_environment_id" ON "api_test_environment_variables"("environment_id");
CREATE INDEX IF NOT EXISTS "idx_api_test_global_variables_collection_id" ON "api_test_global_variables"("collection_id");

-- Function to create default environments when a collection is created
CREATE OR REPLACE FUNCTION create_default_environments()
RETURNS TRIGGER AS $$
BEGIN
  -- Create default environments for new collection
  INSERT INTO "api_test_environments" ("collection_id", "name", "display_name", "color", "sort_order", "is_default")
  VALUES 
    (NEW.id, 'dev', 'Development', '#4CAF50', 1, true),
    (NEW.id, 'sit', 'SIT', '#2196F3', 2, false),
    (NEW.id, 'uat', 'UAT', '#FF9800', 3, false),
    (NEW.id, 'prod', 'Production', '#F44336', 4, false);
    
  -- Set the dev environment as current
  UPDATE "api_test_collections" 
  SET "current_environment_id" = (
    SELECT id FROM "api_test_environments" 
    WHERE "collection_id" = NEW.id AND "name" = 'dev'
    LIMIT 1
  )
  WHERE "id" = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new collections
CREATE TRIGGER create_default_environments_trigger
AFTER INSERT ON "api_test_collections"
FOR EACH ROW
EXECUTE FUNCTION create_default_environments();

-- Add some common environment variables for existing collections
DO $$
DECLARE
  collection RECORD;
  env RECORD;
BEGIN
  -- For each existing collection
  FOR collection IN SELECT id FROM "api_test_collections" LOOP
    -- Create default environments if they don't exist
    INSERT INTO "api_test_environments" ("collection_id", "name", "display_name", "color", "sort_order", "is_default")
    VALUES 
      (collection.id, 'dev', 'Development', '#4CAF50', 1, true),
      (collection.id, 'sit', 'SIT', '#2196F3', 2, false),
      (collection.id, 'uat', 'UAT', '#FF9800', 3, false),
      (collection.id, 'prod', 'Production', '#F44336', 4, false)
    ON CONFLICT DO NOTHING;
    
    -- Set current environment if not set
    UPDATE "api_test_collections" 
    SET "current_environment_id" = (
      SELECT id FROM "api_test_environments" 
      WHERE "collection_id" = collection.id AND "name" = 'dev'
      LIMIT 1
    )
    WHERE "id" = collection.id AND "current_environment_id" IS NULL;
    
    -- Add sample environment variables for each environment
    FOR env IN SELECT id, name FROM "api_test_environments" WHERE "collection_id" = collection.id LOOP
      INSERT INTO "api_test_environment_variables" ("environment_id", "key", "value", "type", "description")
      VALUES 
        (env.id, 'BASE_URL', 
         CASE env.name 
           WHEN 'dev' THEN 'https://api.dev.example.com'
           WHEN 'sit' THEN 'https://api.sit.example.com'
           WHEN 'uat' THEN 'https://api.uat.example.com'
           WHEN 'prod' THEN 'https://api.example.com'
         END, 
         'string', 'Base API URL'),
        (env.id, 'API_VERSION', 'v1', 'string', 'API Version'),
        (env.id, 'TIMEOUT', '30000', 'number', 'Request timeout in milliseconds')
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END $$;