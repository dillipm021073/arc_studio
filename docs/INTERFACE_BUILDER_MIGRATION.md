# Interface Builder JSONB Migration Guide

## Overview
This migration converts the Interface Builder's storage from TEXT to JSONB, allowing storage of larger data including base64-encoded images.

## Why This Migration?
- **Problem**: 80KB PNG images couldn't be stored due to TEXT field limitations
- **Solution**: JSONB has no practical size limits and better performance
- **Benefits**: 
  - Store images up to 50MB+
  - Better query performance
  - Native JSON operations
  - Automatic compression

## Running the Migration

### Prerequisites
1. Ensure your `.env` file has the correct `DATABASE_URL`
2. Back up your database (important!)

### Execute Migration
```bash
npm run db:migrate:jsonb
```

### What the Migration Does
1. Checks current column types
2. Converts `nodes`, `edges`, and `metadata` columns from TEXT to JSONB
3. Creates GIN indexes for performance
4. Creates an optional `interface_builder_assets` table for future binary storage
5. Verifies the migration was successful

### Sample Output
```
🔄 Starting migration to JSONB for interface_builder_projects...
📋 Current column types:
  - nodes: text
  - edges: text
  - metadata: text
🔧 Converting nodes column to JSONB...
🔧 Converting edges column to JSONB...
🔧 Converting metadata column to JSONB...
📊 Creating GIN indexes for better JSONB performance...
✅ Migration completed successfully!

📋 New column types:
  - nodes: jsonb
  - edges: jsonb
  - metadata: jsonb

📊 Total projects in database: 15
🔧 Creating interface_builder_assets table for future binary storage...
✅ Assets table created successfully!
✅ Database connection closed
🎉 Migration completed successfully!
```

## Rollback
If something goes wrong, the migration automatically rolls back. To manually revert:

```sql
-- Revert to TEXT (not recommended)
ALTER TABLE interface_builder_projects 
  ALTER COLUMN nodes TYPE TEXT USING nodes::TEXT,
  ALTER COLUMN edges TYPE TEXT USING edges::TEXT,
  ALTER COLUMN metadata TYPE TEXT USING metadata::TEXT;

-- Drop indexes
DROP INDEX IF EXISTS idx_interface_builder_projects_nodes;
DROP INDEX IF EXISTS idx_interface_builder_projects_edges;
```

## Verification
After migration, test by:
1. Creating a new interface with an image
2. Loading existing interfaces
3. Saving and updating interfaces

## Notes
- The migration is safe and preserves all existing data
- It's backward compatible - no code changes needed
- The API routes have been updated to work with JSONB natively