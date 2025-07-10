-- Safe migration to add business_process_hierarchy_designs table
-- This migration only adds the new table without affecting existing data

-- Check if table already exists before creating
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                  WHERE table_schema = 'public' 
                  AND table_name = 'business_process_hierarchy_designs') THEN
        
        CREATE TABLE "business_process_hierarchy_designs" (
            "id" serial PRIMARY KEY NOT NULL,
            "name" text NOT NULL,
            "description" text,
            "hierarchy_data" text NOT NULL,
            "created_by" text,
            "created_at" timestamp DEFAULT now(),
            "updated_at" timestamp DEFAULT now(),
            "tags" text,
            "is_template" boolean DEFAULT false,
            "template_category" text,
            "version" text DEFAULT '1.0',
            "status" text DEFAULT 'draft'
        );
        
        RAISE NOTICE 'Table business_process_hierarchy_designs created successfully';
    ELSE
        RAISE NOTICE 'Table business_process_hierarchy_designs already exists, skipping creation';
    END IF;
END
$$;

-- Verify the table was created/exists
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'business_process_hierarchy_designs' 
ORDER BY ordinal_position;