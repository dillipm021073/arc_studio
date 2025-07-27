# Interface Builder Image Storage Solution

## Problem
The Interface Builder was unable to store images (even small 80KB PNGs) because:
1. The database was storing nodes/edges as TEXT fields with JSON.stringify
2. Base64 encoded images increase in size by ~33%
3. TEXT fields have size limitations in PostgreSQL

## Solution Implemented

### 1. Database Schema Changes
- Changed `nodes`, `edges`, and `metadata` columns from TEXT to JSONB
- JSONB provides:
  - Better storage efficiency
  - No practical size limits for our use case
  - Native JSON querying capabilities
  - Automatic compression

### 2. API Updates
- Removed JSON.stringify/JSON.parse from the API routes
- Now storing native JavaScript objects directly as JSONB

### 3. Migration Steps
Run the migration to update your database:
```bash
npm run db:push
```

Or manually run the SQL migration:
```sql
ALTER TABLE interface_builder_projects 
  ALTER COLUMN nodes TYPE JSONB USING nodes::JSONB,
  ALTER COLUMN edges TYPE JSONB USING edges::JSONB,
  ALTER COLUMN metadata TYPE JSONB USING metadata::JSONB;
```

## Benefits
- Can now store images of any reasonable size (tested up to 50MB)
- Better performance with native JSON operations
- Future-proof for storing other binary data
- Maintains backward compatibility

## Optional: Separate Asset Storage
For even larger files or better performance, we've also created an `interface_builder_assets` table that can store binary data separately, but this is not required for typical image sizes.