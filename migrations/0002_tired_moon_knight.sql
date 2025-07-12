CREATE TABLE "interface_builder_folders" (
	"id" serial PRIMARY KEY NOT NULL,
	"path" text NOT NULL,
	"name" text NOT NULL,
	"parent_path" text,
	"description" text,
	"created_by" text NOT NULL,
	"is_team_folder" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "interface_builder_folders_path_unique" UNIQUE("path")
);
--> statement-breakpoint
CREATE TABLE "artifact_locks" (
	"id" serial PRIMARY KEY NOT NULL,
	"artifact_type" text NOT NULL,
	"artifact_id" integer NOT NULL,
	"initiative_id" text NOT NULL,
	"locked_by" integer NOT NULL,
	"locked_at" timestamp DEFAULT now(),
	"lock_expiry" timestamp,
	"lock_reason" text,
	CONSTRAINT "idx_unique_lock" UNIQUE("artifact_type","artifact_id","initiative_id")
);
--> statement-breakpoint
CREATE TABLE "artifact_versions" (
	"id" serial PRIMARY KEY NOT NULL,
	"artifact_type" text NOT NULL,
	"artifact_id" integer NOT NULL,
	"version_number" integer NOT NULL,
	"initiative_id" text,
	"is_baseline" boolean DEFAULT false,
	"baseline_date" timestamp,
	"baselined_by" integer,
	"artifact_data" jsonb NOT NULL,
	"changed_fields" jsonb,
	"change_type" text,
	"change_reason" text,
	"created_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_by" integer,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "baseline_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"artifact_type" text NOT NULL,
	"artifact_id" integer NOT NULL,
	"from_version_id" integer,
	"to_version_id" integer NOT NULL,
	"initiative_id" text,
	"baselined_at" timestamp DEFAULT now(),
	"baselined_by" integer NOT NULL,
	"baseline_reason" text,
	"rollback_of" integer
);
--> statement-breakpoint
CREATE TABLE "initiative_approvals" (
	"id" serial PRIMARY KEY NOT NULL,
	"initiative_id" text NOT NULL,
	"approval_level" integer NOT NULL,
	"approver_role" text NOT NULL,
	"approver_id" integer,
	"status" text DEFAULT 'pending' NOT NULL,
	"decision" text,
	"decision_notes" text,
	"decided_at" timestamp,
	"delegated_to" integer,
	"due_date" timestamp
);
--> statement-breakpoint
CREATE TABLE "initiative_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"initiative_id" text NOT NULL,
	"artifact_type" text,
	"artifact_id" integer,
	"version_id" integer,
	"comment" text NOT NULL,
	"comment_type" text,
	"user_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"parent_comment_id" integer
);
--> statement-breakpoint
CREATE TABLE "initiative_participants" (
	"id" serial PRIMARY KEY NOT NULL,
	"initiative_id" text NOT NULL,
	"user_id" integer NOT NULL,
	"role" text NOT NULL,
	"permissions" jsonb,
	"joined_at" timestamp DEFAULT now(),
	"left_at" timestamp,
	"added_by" integer
);
--> statement-breakpoint
CREATE TABLE "initiatives" (
	"id" serial PRIMARY KEY NOT NULL,
	"initiative_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"business_justification" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"priority" text DEFAULT 'medium',
	"start_date" timestamp DEFAULT now() NOT NULL,
	"target_completion_date" timestamp,
	"actual_completion_date" timestamp,
	"created_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_by" integer,
	"updated_at" timestamp DEFAULT now(),
	"metadata" jsonb,
	CONSTRAINT "initiatives_initiative_id_unique" UNIQUE("initiative_id")
);
--> statement-breakpoint
CREATE TABLE "version_conflicts" (
	"id" serial PRIMARY KEY NOT NULL,
	"initiative_id" text NOT NULL,
	"artifact_type" text NOT NULL,
	"artifact_id" integer NOT NULL,
	"baseline_version_id" integer NOT NULL,
	"initiative_version_id" integer NOT NULL,
	"conflicting_version_id" integer,
	"conflicting_fields" jsonb NOT NULL,
	"conflict_details" jsonb,
	"resolution_status" text DEFAULT 'pending',
	"resolution_strategy" text,
	"resolved_data" jsonb,
	"resolved_by" integer,
	"resolved_at" timestamp,
	"resolution_notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "version_dependencies" (
	"id" serial PRIMARY KEY NOT NULL,
	"from_version_id" integer NOT NULL,
	"to_version_id" integer NOT NULL,
	"dependency_type" text NOT NULL,
	"dependency_strength" text,
	"description" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "interface_builder_projects" ADD COLUMN "folder_path" text DEFAULT '/';--> statement-breakpoint
ALTER TABLE "artifact_locks" ADD CONSTRAINT "artifact_locks_initiative_id_initiatives_initiative_id_fk" FOREIGN KEY ("initiative_id") REFERENCES "public"."initiatives"("initiative_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artifact_locks" ADD CONSTRAINT "artifact_locks_locked_by_users_id_fk" FOREIGN KEY ("locked_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artifact_versions" ADD CONSTRAINT "artifact_versions_initiative_id_initiatives_initiative_id_fk" FOREIGN KEY ("initiative_id") REFERENCES "public"."initiatives"("initiative_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artifact_versions" ADD CONSTRAINT "artifact_versions_baselined_by_users_id_fk" FOREIGN KEY ("baselined_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artifact_versions" ADD CONSTRAINT "artifact_versions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artifact_versions" ADD CONSTRAINT "artifact_versions_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "baseline_history" ADD CONSTRAINT "baseline_history_from_version_id_artifact_versions_id_fk" FOREIGN KEY ("from_version_id") REFERENCES "public"."artifact_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "baseline_history" ADD CONSTRAINT "baseline_history_to_version_id_artifact_versions_id_fk" FOREIGN KEY ("to_version_id") REFERENCES "public"."artifact_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "baseline_history" ADD CONSTRAINT "baseline_history_initiative_id_initiatives_initiative_id_fk" FOREIGN KEY ("initiative_id") REFERENCES "public"."initiatives"("initiative_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "baseline_history" ADD CONSTRAINT "baseline_history_baselined_by_users_id_fk" FOREIGN KEY ("baselined_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "initiative_approvals" ADD CONSTRAINT "initiative_approvals_initiative_id_initiatives_initiative_id_fk" FOREIGN KEY ("initiative_id") REFERENCES "public"."initiatives"("initiative_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "initiative_approvals" ADD CONSTRAINT "initiative_approvals_approver_id_users_id_fk" FOREIGN KEY ("approver_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "initiative_approvals" ADD CONSTRAINT "initiative_approvals_delegated_to_users_id_fk" FOREIGN KEY ("delegated_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "initiative_comments" ADD CONSTRAINT "initiative_comments_initiative_id_initiatives_initiative_id_fk" FOREIGN KEY ("initiative_id") REFERENCES "public"."initiatives"("initiative_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "initiative_comments" ADD CONSTRAINT "initiative_comments_version_id_artifact_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."artifact_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "initiative_comments" ADD CONSTRAINT "initiative_comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "initiative_participants" ADD CONSTRAINT "initiative_participants_initiative_id_initiatives_initiative_id_fk" FOREIGN KEY ("initiative_id") REFERENCES "public"."initiatives"("initiative_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "initiative_participants" ADD CONSTRAINT "initiative_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "initiative_participants" ADD CONSTRAINT "initiative_participants_added_by_users_id_fk" FOREIGN KEY ("added_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "initiatives" ADD CONSTRAINT "initiatives_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "initiatives" ADD CONSTRAINT "initiatives_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "version_conflicts" ADD CONSTRAINT "version_conflicts_initiative_id_initiatives_initiative_id_fk" FOREIGN KEY ("initiative_id") REFERENCES "public"."initiatives"("initiative_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "version_conflicts" ADD CONSTRAINT "version_conflicts_baseline_version_id_artifact_versions_id_fk" FOREIGN KEY ("baseline_version_id") REFERENCES "public"."artifact_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "version_conflicts" ADD CONSTRAINT "version_conflicts_initiative_version_id_artifact_versions_id_fk" FOREIGN KEY ("initiative_version_id") REFERENCES "public"."artifact_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "version_conflicts" ADD CONSTRAINT "version_conflicts_conflicting_version_id_artifact_versions_id_fk" FOREIGN KEY ("conflicting_version_id") REFERENCES "public"."artifact_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "version_conflicts" ADD CONSTRAINT "version_conflicts_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "version_dependencies" ADD CONSTRAINT "version_dependencies_from_version_id_artifact_versions_id_fk" FOREIGN KEY ("from_version_id") REFERENCES "public"."artifact_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "version_dependencies" ADD CONSTRAINT "version_dependencies_to_version_id_artifact_versions_id_fk" FOREIGN KEY ("to_version_id") REFERENCES "public"."artifact_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_locks_expiry" ON "artifact_locks" USING btree ("lock_expiry");--> statement-breakpoint
CREATE INDEX "idx_unique_artifact_version" ON "artifact_versions" USING btree ("artifact_type","artifact_id","version_number");--> statement-breakpoint
CREATE INDEX "idx_artifact_versions_baseline" ON "artifact_versions" USING btree ("is_baseline");--> statement-breakpoint
CREATE INDEX "idx_artifact_versions_initiative" ON "artifact_versions" USING btree ("initiative_id");--> statement-breakpoint
CREATE INDEX "idx_artifact_versions_artifact" ON "artifact_versions" USING btree ("artifact_type","artifact_id");--> statement-breakpoint
CREATE INDEX "idx_baseline_history_artifact" ON "baseline_history" USING btree ("artifact_type","artifact_id");--> statement-breakpoint
CREATE INDEX "idx_baseline_history_date" ON "baseline_history" USING btree ("baselined_at");--> statement-breakpoint
CREATE INDEX "idx_approvals_initiative" ON "initiative_approvals" USING btree ("initiative_id");--> statement-breakpoint
CREATE INDEX "idx_approvals_status" ON "initiative_approvals" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_comments_initiative" ON "initiative_comments" USING btree ("initiative_id");--> statement-breakpoint
CREATE INDEX "idx_comments_version" ON "initiative_comments" USING btree ("version_id");--> statement-breakpoint
CREATE INDEX "idx_unique_participant" ON "initiative_participants" USING btree ("initiative_id","user_id");--> statement-breakpoint
CREATE INDEX "idx_participants_user" ON "initiative_participants" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_initiatives_status" ON "initiatives" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_initiatives_created_by" ON "initiatives" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "idx_conflicts_initiative" ON "version_conflicts" USING btree ("initiative_id");--> statement-breakpoint
CREATE INDEX "idx_conflicts_status" ON "version_conflicts" USING btree ("resolution_status");--> statement-breakpoint
CREATE INDEX "idx_dependencies_from" ON "version_dependencies" USING btree ("from_version_id");--> statement-breakpoint
CREATE INDEX "idx_dependencies_to" ON "version_dependencies" USING btree ("to_version_id");