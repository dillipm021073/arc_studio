-- Add Business Process Hierarchy Designs table
-- This table stores hierarchy definitions as JSON without impacting existing data

CREATE TABLE IF NOT EXISTS business_process_hierarchy_designs (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    hierarchy_data TEXT NOT NULL, -- JSON string containing the hierarchy structure
    created_by TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    tags TEXT, -- Comma-separated tags for categorization
    is_template BOOLEAN DEFAULT false, -- Mark as reusable template
    template_category TEXT, -- Category for templates (e.g., "Financial", "Manufacturing")
    version TEXT DEFAULT '1.0',
    status TEXT DEFAULT 'draft' -- draft, published, archived
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_hierarchy_designs_created_by ON business_process_hierarchy_designs(created_by);
CREATE INDEX IF NOT EXISTS idx_hierarchy_designs_template ON business_process_hierarchy_designs(is_template);
CREATE INDEX IF NOT EXISTS idx_hierarchy_designs_category ON business_process_hierarchy_designs(template_category);
CREATE INDEX IF NOT EXISTS idx_hierarchy_designs_status ON business_process_hierarchy_designs(status);
CREATE INDEX IF NOT EXISTS idx_hierarchy_designs_created_at ON business_process_hierarchy_designs(created_at);