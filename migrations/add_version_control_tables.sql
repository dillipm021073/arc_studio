-- Initiative Management Tables for Version Control System

-- Initiative Management - Core table for managing business initiatives
CREATE TABLE IF NOT EXISTS initiatives (
  id SERIAL PRIMARY KEY,
  initiative_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  business_justification TEXT,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, active, review, completed, cancelled
  priority TEXT DEFAULT 'medium', -- low, medium, high, critical
  start_date TIMESTAMP NOT NULL DEFAULT NOW(),
  target_completion_date TIMESTAMP,
  actual_completion_date TIMESTAMP,
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_by INTEGER REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB
);

CREATE INDEX idx_initiatives_status ON initiatives(status);
CREATE INDEX idx_initiatives_created_by ON initiatives(created_by);

-- Artifact Versions - Stores all versions of all artifact types
CREATE TABLE IF NOT EXISTS artifact_versions (
  id SERIAL PRIMARY KEY,
  artifact_type TEXT NOT NULL, -- 'application', 'interface', 'business_process', 'internal_process', 'technical_process'
  artifact_id INTEGER NOT NULL,
  version_number INTEGER NOT NULL,
  initiative_id TEXT REFERENCES initiatives(initiative_id),
  is_baseline BOOLEAN DEFAULT FALSE,
  baseline_date TIMESTAMP,
  baselined_by INTEGER REFERENCES users(id),
  artifact_data JSONB NOT NULL, -- Complete artifact state
  changed_fields JSONB, -- List of fields that changed from previous version
  change_type TEXT, -- 'create', 'update', 'delete'
  change_reason TEXT,
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_by INTEGER REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_unique_artifact_version ON artifact_versions(artifact_type, artifact_id, version_number);
CREATE INDEX idx_artifact_versions_baseline ON artifact_versions(is_baseline);
CREATE INDEX idx_artifact_versions_initiative ON artifact_versions(initiative_id);
CREATE INDEX idx_artifact_versions_artifact ON artifact_versions(artifact_type, artifact_id);

-- Version Conflicts - Tracks conflicts between initiatives
CREATE TABLE IF NOT EXISTS version_conflicts (
  id SERIAL PRIMARY KEY,
  initiative_id TEXT NOT NULL REFERENCES initiatives(initiative_id),
  artifact_type TEXT NOT NULL,
  artifact_id INTEGER NOT NULL,
  baseline_version_id INTEGER NOT NULL REFERENCES artifact_versions(id),
  initiative_version_id INTEGER NOT NULL REFERENCES artifact_versions(id),
  conflicting_version_id INTEGER REFERENCES artifact_versions(id),
  conflicting_fields JSONB NOT NULL, -- Array of field names with conflicts
  conflict_details JSONB, -- Detailed comparison of conflicting values
  resolution_status TEXT DEFAULT 'pending', -- pending, resolved, ignored, escalated
  resolution_strategy TEXT, -- 'accept_baseline', 'keep_initiative', 'manual_merge', 'custom'
  resolved_data JSONB, -- Final resolved artifact data
  resolved_by INTEGER REFERENCES users(id),
  resolved_at TIMESTAMP,
  resolution_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_conflicts_initiative ON version_conflicts(initiative_id);
CREATE INDEX idx_conflicts_status ON version_conflicts(resolution_status);

-- Initiative Participants - Team members working on an initiative
CREATE TABLE IF NOT EXISTS initiative_participants (
  id SERIAL PRIMARY KEY,
  initiative_id TEXT NOT NULL REFERENCES initiatives(initiative_id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  role TEXT NOT NULL, -- 'lead', 'architect', 'project_manager', 'tester', 'reviewer', 'viewer'
  permissions JSONB, -- Specific permissions within the initiative
  joined_at TIMESTAMP DEFAULT NOW(),
  left_at TIMESTAMP,
  added_by INTEGER REFERENCES users(id)
);

CREATE UNIQUE INDEX idx_unique_participant ON initiative_participants(initiative_id, user_id);
CREATE INDEX idx_participants_user ON initiative_participants(user_id);

-- Artifact Locks - Prevents concurrent editing
CREATE TABLE IF NOT EXISTS artifact_locks (
  id SERIAL PRIMARY KEY,
  artifact_type TEXT NOT NULL,
  artifact_id INTEGER NOT NULL,
  initiative_id TEXT NOT NULL REFERENCES initiatives(initiative_id),
  locked_by INTEGER NOT NULL REFERENCES users(id),
  locked_at TIMESTAMP DEFAULT NOW(),
  lock_expiry TIMESTAMP, -- Auto-release after timeout
  lock_reason TEXT
);

CREATE UNIQUE INDEX idx_unique_lock ON artifact_locks(artifact_type, artifact_id, initiative_id);
CREATE INDEX idx_locks_expiry ON artifact_locks(lock_expiry);

-- Version Dependencies - Track dependencies between artifacts
CREATE TABLE IF NOT EXISTS version_dependencies (
  id SERIAL PRIMARY KEY,
  from_version_id INTEGER NOT NULL REFERENCES artifact_versions(id),
  to_version_id INTEGER NOT NULL REFERENCES artifact_versions(id),
  dependency_type TEXT NOT NULL, -- 'requires', 'impacts', 'related_to'
  dependency_strength TEXT, -- 'strong', 'weak', 'optional'
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_dependencies_from ON version_dependencies(from_version_id);
CREATE INDEX idx_dependencies_to ON version_dependencies(to_version_id);

-- Initiative Comments - Discussion and notes on initiatives
CREATE TABLE IF NOT EXISTS initiative_comments (
  id SERIAL PRIMARY KEY,
  initiative_id TEXT NOT NULL REFERENCES initiatives(initiative_id),
  artifact_type TEXT,
  artifact_id INTEGER,
  version_id INTEGER REFERENCES artifact_versions(id),
  comment TEXT NOT NULL,
  comment_type TEXT, -- 'general', 'review', 'conflict', 'resolution'
  user_id INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  parent_comment_id INTEGER
);

CREATE INDEX idx_comments_initiative ON initiative_comments(initiative_id);
CREATE INDEX idx_comments_version ON initiative_comments(version_id);

-- Baseline History - Track baseline changes over time
CREATE TABLE IF NOT EXISTS baseline_history (
  id SERIAL PRIMARY KEY,
  artifact_type TEXT NOT NULL,
  artifact_id INTEGER NOT NULL,
  from_version_id INTEGER REFERENCES artifact_versions(id),
  to_version_id INTEGER NOT NULL REFERENCES artifact_versions(id),
  initiative_id TEXT REFERENCES initiatives(initiative_id),
  baselined_at TIMESTAMP DEFAULT NOW(),
  baselined_by INTEGER NOT NULL REFERENCES users(id),
  baseline_reason TEXT,
  rollback_of INTEGER -- If this baseline is a rollback
);

CREATE INDEX idx_baseline_history_artifact ON baseline_history(artifact_type, artifact_id);
CREATE INDEX idx_baseline_history_date ON baseline_history(baselined_at);

-- Initiative Approval Workflow
CREATE TABLE IF NOT EXISTS initiative_approvals (
  id SERIAL PRIMARY KEY,
  initiative_id TEXT NOT NULL REFERENCES initiatives(initiative_id),
  approval_level INTEGER NOT NULL, -- 1, 2, 3 etc for multi-level approval
  approver_role TEXT NOT NULL, -- 'architect_lead', 'business_owner', 'it_director'
  approver_id INTEGER REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected, delegated
  decision TEXT,
  decision_notes TEXT,
  decided_at TIMESTAMP,
  delegated_to INTEGER REFERENCES users(id),
  due_date TIMESTAMP
);

CREATE INDEX idx_approvals_initiative ON initiative_approvals(initiative_id);
CREATE INDEX idx_approvals_status ON initiative_approvals(status);

-- Add audit fields to existing tables
ALTER TABLE applications ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id);
ALTER TABLE applications ADD COLUMN IF NOT EXISTS updated_by INTEGER REFERENCES users(id);
ALTER TABLE interfaces ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id);
ALTER TABLE interfaces ADD COLUMN IF NOT EXISTS updated_by INTEGER REFERENCES users(id);
ALTER TABLE business_processes ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id);
ALTER TABLE business_processes ADD COLUMN IF NOT EXISTS updated_by INTEGER REFERENCES users(id);

-- Create initial baseline versions for existing data
INSERT INTO artifact_versions (artifact_type, artifact_id, version_number, is_baseline, baseline_date, artifact_data, created_by)
SELECT 
  'application' as artifact_type,
  id as artifact_id,
  1 as version_number,
  true as is_baseline,
  NOW() as baseline_date,
  row_to_json(applications.*) as artifact_data,
  1 as created_by -- Default to admin user
FROM applications
WHERE NOT EXISTS (
  SELECT 1 FROM artifact_versions av 
  WHERE av.artifact_type = 'application' 
  AND av.artifact_id = applications.id
);

INSERT INTO artifact_versions (artifact_type, artifact_id, version_number, is_baseline, baseline_date, artifact_data, created_by)
SELECT 
  'interface' as artifact_type,
  id as artifact_id,
  1 as version_number,
  true as is_baseline,
  NOW() as baseline_date,
  row_to_json(interfaces.*) as artifact_data,
  1 as created_by
FROM interfaces
WHERE NOT EXISTS (
  SELECT 1 FROM artifact_versions av 
  WHERE av.artifact_type = 'interface' 
  AND av.artifact_id = interfaces.id
);

INSERT INTO artifact_versions (artifact_type, artifact_id, version_number, is_baseline, baseline_date, artifact_data, created_by)
SELECT 
  'business_process' as artifact_type,
  id as artifact_id,
  1 as version_number,
  true as is_baseline,
  NOW() as baseline_date,
  row_to_json(business_processes.*) as artifact_data,
  1 as created_by
FROM business_processes
WHERE NOT EXISTS (
  SELECT 1 FROM artifact_versions av 
  WHERE av.artifact_type = 'business_process' 
  AND av.artifact_id = business_processes.id
);