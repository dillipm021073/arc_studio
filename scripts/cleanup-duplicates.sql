-- Script to clean up duplicate artifact versions and add unique constraint

-- First, let's see what duplicates we have
SELECT 
    artifact_type,
    artifact_id,
    version_number,
    COUNT(*) as count,
    ARRAY_AGG(id ORDER BY created_at DESC) as ids
FROM artifact_versions 
GROUP BY artifact_type, artifact_id, version_number 
HAVING COUNT(*) > 1
ORDER BY artifact_type, artifact_id, version_number;

-- Create a temporary table to store IDs to delete
CREATE TEMP TABLE duplicate_ids AS
WITH duplicates AS (
    SELECT 
        artifact_type,
        artifact_id,
        version_number,
        id,
        ROW_NUMBER() OVER (
            PARTITION BY artifact_type, artifact_id, version_number 
            ORDER BY created_at DESC
        ) as rn
    FROM artifact_versions
)
SELECT id FROM duplicates WHERE rn > 1;

-- Show how many records will be deleted
SELECT COUNT(*) as records_to_delete FROM duplicate_ids;

-- Delete the duplicate records (keeping the most recent one)
DELETE FROM artifact_versions 
WHERE id IN (SELECT id FROM duplicate_ids);

-- Add unique constraint to prevent future duplicates
ALTER TABLE artifact_versions 
ADD CONSTRAINT unique_artifact_version 
UNIQUE (artifact_type, artifact_id, version_number);

-- Verify no duplicates remain
SELECT 
    artifact_type,
    artifact_id,
    version_number,
    COUNT(*) as count
FROM artifact_versions 
GROUP BY artifact_type, artifact_id, version_number 
HAVING COUNT(*) > 1;

-- Show final count
SELECT COUNT(*) as total_records FROM artifact_versions;