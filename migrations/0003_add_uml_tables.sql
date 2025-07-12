-- Create diagram_type enum
CREATE TYPE "diagram_type" AS ENUM ('sequence', 'activity', 'class', 'usecase', 'component', 'state', 'deployment', 'object', 'package', 'timing', 'custom');

-- Create uml_folders table
CREATE TABLE IF NOT EXISTS "uml_folders" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"parent_id" integer,
	"path" text NOT NULL,
	"created_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

-- Create uml_diagrams table
CREATE TABLE IF NOT EXISTS "uml_diagrams" (
	"id" serial PRIMARY KEY NOT NULL,
	"folder_id" integer NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"content" text NOT NULL,
	"diagram_type" "diagram_type" DEFAULT 'sequence' NOT NULL,
	"rendered_svg" text,
	"rendered_png" text,
	"metadata" jsonb,
	"version" integer DEFAULT 1,
	"is_public" boolean DEFAULT false,
	"created_by" integer NOT NULL,
	"updated_by" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

-- Add foreign key constraints
DO $$ BEGIN
 ALTER TABLE "uml_folders" ADD CONSTRAINT "uml_folders_parent_id_uml_folders_id_fk" FOREIGN KEY ("parent_id") REFERENCES "uml_folders"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "uml_folders" ADD CONSTRAINT "uml_folders_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "uml_diagrams" ADD CONSTRAINT "uml_diagrams_folder_id_uml_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "uml_folders"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "uml_diagrams" ADD CONSTRAINT "uml_diagrams_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "uml_diagrams" ADD CONSTRAINT "uml_diagrams_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_uml_folders_parent_id" ON "uml_folders" ("parent_id");
CREATE INDEX IF NOT EXISTS "idx_uml_folders_path" ON "uml_folders" ("path");
CREATE INDEX IF NOT EXISTS "idx_uml_folders_created_by" ON "uml_folders" ("created_by");

CREATE INDEX IF NOT EXISTS "idx_uml_diagrams_folder_id" ON "uml_diagrams" ("folder_id");
CREATE INDEX IF NOT EXISTS "idx_uml_diagrams_diagram_type" ON "uml_diagrams" ("diagram_type");
CREATE INDEX IF NOT EXISTS "idx_uml_diagrams_created_by" ON "uml_diagrams" ("created_by");
CREATE INDEX IF NOT EXISTS "idx_uml_diagrams_name" ON "uml_diagrams" ("name");

-- Add trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_uml_folders_updated_at BEFORE UPDATE ON "uml_folders"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_uml_diagrams_updated_at BEFORE UPDATE ON "uml_diagrams"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();