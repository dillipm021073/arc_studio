-- Fix Database Schema Script
-- This script will ensure the users table has all required columns

-- First, check if autox columns exist and add them if missing
DO $$ 
BEGIN
    -- Check and add autox_api_key column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' 
                   AND column_name = 'autox_api_key') THEN
        ALTER TABLE users ADD COLUMN autox_api_key TEXT;
        RAISE NOTICE 'Added autox_api_key column';
    ELSE
        RAISE NOTICE 'autox_api_key column already exists';
    END IF;

    -- Check and add autox_username column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' 
                   AND column_name = 'autox_username') THEN
        ALTER TABLE users ADD COLUMN autox_username TEXT;
        RAISE NOTICE 'Added autox_username column';
    ELSE
        RAISE NOTICE 'autox_username column already exists';
    END IF;

    -- Check and add created_at column with default
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' 
                   AND column_name = 'created_at') THEN
        ALTER TABLE users ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE 'Added created_at column';
    ELSE
        RAISE NOTICE 'created_at column already exists';
    END IF;

    -- Check and add updated_at column with default
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' 
                   AND column_name = 'updated_at') THEN
        ALTER TABLE users ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE 'Added updated_at column';
    ELSE
        RAISE NOTICE 'updated_at column already exists';
    END IF;
END $$;

-- Show the current table structure
\d users

-- Count existing rows
SELECT COUNT(*) as user_count FROM users;