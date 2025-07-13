-- Add new fields to applications table
ALTER TABLE applications 
ADD COLUMN IF NOT EXISTS artifact_state TEXT NOT NULL DEFAULT 'active',
ADD COLUMN IF NOT EXISTS planned_activation_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS initiative_origin TEXT;

-- Add new fields to interfaces table  
ALTER TABLE interfaces
ADD COLUMN IF NOT EXISTS artifact_state TEXT NOT NULL DEFAULT 'active',
ADD COLUMN IF NOT EXISTS planned_activation_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS initiative_origin TEXT;