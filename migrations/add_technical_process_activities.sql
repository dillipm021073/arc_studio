-- Add new tables for technical process internal activities and diagrams

-- Technical Process Internal Activity Dependencies (NEW)
CREATE TABLE IF NOT EXISTS technical_process_internal_activities (
  id SERIAL PRIMARY KEY,
  technical_process_id INTEGER REFERENCES technical_processes(id) ON DELETE CASCADE,
  internal_activity_id INTEGER REFERENCES internal_activities(id) ON DELETE CASCADE,
  sequence_number INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Technical Process Sequences (supports ordering of internal activities and interface calls)
CREATE TABLE IF NOT EXISTS technical_process_sequences (
  id SERIAL PRIMARY KEY,
  technical_process_id INTEGER NOT NULL REFERENCES technical_processes(id) ON DELETE CASCADE,
  sequence_number INTEGER NOT NULL,
  sequence_type TEXT NOT NULL CHECK (sequence_type IN ('internal_activity', 'interface_call')),
  reference_id INTEGER NOT NULL,
  condition TEXT CHECK (condition IN ('always', 'on_success', 'on_failure', NULL)),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(technical_process_id, sequence_number)
);

-- Technical Process Diagrams
CREATE TABLE IF NOT EXISTS technical_process_diagrams (
  id SERIAL PRIMARY KEY,
  technical_process_id INTEGER REFERENCES technical_processes(id) ON DELETE CASCADE,
  diagram_data TEXT NOT NULL,
  notes TEXT,
  created_by TEXT,
  last_modified_by TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_tp_internal_activities_process ON technical_process_internal_activities(technical_process_id);
CREATE INDEX idx_tp_internal_activities_activity ON technical_process_internal_activities(internal_activity_id);
CREATE INDEX idx_tp_sequences_process ON technical_process_sequences(technical_process_id);
CREATE INDEX idx_tp_sequences_type_ref ON technical_process_sequences(sequence_type, reference_id);
CREATE INDEX idx_tp_diagrams_process ON technical_process_diagrams(technical_process_id);