CREATE TABLE "api_endpoints" (
	"id" serial PRIMARY KEY NOT NULL,
	"method" text NOT NULL,
	"path" text NOT NULL,
	"resource" text NOT NULL,
	"action" text NOT NULL,
	"description" text,
	"requires_auth" boolean DEFAULT true,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "application_capabilities" (
	"id" serial PRIMARY KEY NOT NULL,
	"application_id" integer NOT NULL,
	"capability_name" text NOT NULL,
	"capability_type" text NOT NULL,
	"area" text,
	"description" text,
	"interface_type" text,
	"protocol" text,
	"data_format" text,
	"is_active" boolean DEFAULT false,
	"status" text DEFAULT 'available' NOT NULL,
	"endpoint" text,
	"sample_request" text,
	"sample_response" text,
	"documentation" text,
	"mapped_iml_id" integer,
	"extracted_from" text,
	"extracted_date" timestamp,
	"extracted_by" text,
	"confidence" numeric(3, 2),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"aml_number" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"lob" text,
	"os" text,
	"deployment" text,
	"uptime" numeric(5, 2),
	"purpose" text,
	"provides_ext_interface" boolean DEFAULT false,
	"prov_interface_type" text,
	"consumes_ext_interfaces" boolean DEFAULT false,
	"cons_interface_type" text,
	"status" text DEFAULT 'active' NOT NULL,
	"first_active_date" timestamp,
	"last_change_date" timestamp DEFAULT now(),
	"decommission_date" timestamp,
	"decommission_reason" text,
	"decommissioned_by" text,
	"x_position" numeric,
	"y_position" numeric,
	"layer" text,
	"criticality" text,
	"team" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "applications_aml_number_unique" UNIQUE("aml_number")
);
--> statement-breakpoint
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
--> statement-breakpoint
CREATE TABLE "business_process_interfaces" (
	"id" serial PRIMARY KEY NOT NULL,
	"business_process_id" integer,
	"interface_id" integer,
	"sequence_number" integer NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "business_process_relationships" (
	"id" serial PRIMARY KEY NOT NULL,
	"parent_process_id" integer NOT NULL,
	"child_process_id" integer NOT NULL,
	"relationship_type" text DEFAULT 'contains',
	"sequence_number" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "business_process_sequences" (
	"id" serial PRIMARY KEY NOT NULL,
	"business_process_id" integer NOT NULL,
	"sequence_number" integer NOT NULL,
	"sequence_type" text NOT NULL,
	"reference_id" integer NOT NULL,
	"condition" text,
	"condition_expression" text,
	"next_sequence_on_success" integer,
	"next_sequence_on_failure" integer,
	"next_sequence_on_timeout" integer,
	"description" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "business_processes" (
	"id" serial PRIMARY KEY NOT NULL,
	"business_process" text NOT NULL,
	"lob" text NOT NULL,
	"product" text NOT NULL,
	"version" text DEFAULT '1.0' NOT NULL,
	"level" text DEFAULT 'A' NOT NULL,
	"domain_owner" text,
	"it_owner" text,
	"vendor_focal" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "capabilities" (
	"id" serial PRIMARY KEY NOT NULL,
	"application_id" integer NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"protocol" text,
	"direction" text,
	"data_format" text,
	"authentication" text,
	"third_party_service" text,
	"endpoints" text[],
	"description" text,
	"extraction_history_id" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "capability_extraction_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"filename" text NOT NULL,
	"file_type" text NOT NULL,
	"application_id" integer,
	"task_id" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"started_at" timestamp NOT NULL,
	"completed_at" timestamp,
	"user_id" integer,
	"error" text,
	"result_summary" jsonb,
	"extracted_data" jsonb,
	"autox_filename" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "change_request_applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"change_request_id" integer,
	"application_id" integer,
	"impact_type" text,
	"impact_description" text
);
--> statement-breakpoint
CREATE TABLE "change_request_interfaces" (
	"id" serial PRIMARY KEY NOT NULL,
	"change_request_id" integer,
	"interface_id" integer,
	"impact_type" text,
	"impact_description" text
);
--> statement-breakpoint
CREATE TABLE "change_request_internal_activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"change_request_id" integer,
	"internal_activity_id" integer,
	"impact_type" text,
	"impact_description" text
);
--> statement-breakpoint
CREATE TABLE "change_request_technical_processes" (
	"id" serial PRIMARY KEY NOT NULL,
	"change_request_id" integer,
	"technical_process_id" integer,
	"impact_type" text,
	"impact_description" text
);
--> statement-breakpoint
CREATE TABLE "change_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"cr_number" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"reason" text,
	"benefit" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"priority" text DEFAULT 'medium',
	"owner" text,
	"requested_by" text,
	"approved_by" text,
	"target_date" timestamp,
	"completed_date" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "change_requests_cr_number_unique" UNIQUE("cr_number")
);
--> statement-breakpoint
CREATE TABLE "communication_attachments" (
	"id" serial PRIMARY KEY NOT NULL,
	"comment_id" integer,
	"file_name" text NOT NULL,
	"file_type" text NOT NULL,
	"file_size" integer NOT NULL,
	"file_url" text NOT NULL,
	"uploaded_by" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "communication_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer,
	"parent_id" integer,
	"content" text NOT NULL,
	"author" text NOT NULL,
	"is_edited" boolean DEFAULT false,
	"edited_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "communication_mentions" (
	"id" serial PRIMARY KEY NOT NULL,
	"comment_id" integer,
	"mentioned_user" text NOT NULL,
	"notified" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "conversation_links" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer,
	"entity_type" text NOT NULL,
	"entity_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "conversation_participants" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer,
	"participant_name" text NOT NULL,
	"participant_role" text,
	"is_active" boolean DEFAULT true,
	"added_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'open' NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"created_by" text NOT NULL,
	"assigned_to" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"resolved_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "decision_points" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"decision_type" text NOT NULL,
	"evaluation_logic" text,
	"possible_outcomes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "iml_diagrams" (
	"id" serial PRIMARY KEY NOT NULL,
	"business_process_id" integer,
	"diagram_data" text NOT NULL,
	"notes" text,
	"created_by" text,
	"last_modified_by" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "interface_builder_projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"nodes" text NOT NULL,
	"edges" text NOT NULL,
	"metadata" text,
	"version" text DEFAULT '1.0' NOT NULL,
	"author" text NOT NULL,
	"is_team_project" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "interface_builder_projects_project_id_unique" UNIQUE("project_id")
);
--> statement-breakpoint
CREATE TABLE "interface_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"interface_id" integer,
	"comment" text NOT NULL,
	"author" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "interface_consumer_descriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"interface_id" integer,
	"consumer_application_id" integer,
	"description" text,
	"response_format" text,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "interface_response_scenarios" (
	"id" serial PRIMARY KEY NOT NULL,
	"interface_id" integer NOT NULL,
	"scenario_type" text NOT NULL,
	"response_code" text,
	"response_description" text,
	"next_action" text NOT NULL,
	"next_sequence_number" integer,
	"retry_policy" text,
	"max_retries" integer DEFAULT 3,
	"retry_delay_ms" integer DEFAULT 1000,
	"timeout_ms" integer DEFAULT 30000,
	"fallback_interface_id" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "interface_versions" (
	"id" serial PRIMARY KEY NOT NULL,
	"interface_id" integer,
	"version" text NOT NULL,
	"change_description" text,
	"sample_code" text,
	"connectivity_steps" text,
	"interface_test_steps" text,
	"created_by" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "interfaces" (
	"id" serial PRIMARY KEY NOT NULL,
	"iml_number" text NOT NULL,
	"description" text,
	"provider_application_id" integer,
	"consumer_application_id" integer,
	"interface_type" text NOT NULL,
	"middleware" text DEFAULT 'None',
	"version" text DEFAULT '1.0' NOT NULL,
	"lob" text,
	"last_change_date" timestamp DEFAULT now(),
	"business_process_name" text,
	"customer_focal" text,
	"provider_owner" text,
	"consumer_owner" text,
	"status" text DEFAULT 'active' NOT NULL,
	"sample_code" text,
	"connectivity_steps" text,
	"interface_test_steps" text,
	"data_flow" text,
	"protocol" text,
	"frequency" text,
	"data_volume" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "interfaces_iml_number_unique" UNIQUE("iml_number")
);
--> statement-breakpoint
CREATE TABLE "internal_activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"application_id" integer NOT NULL,
	"activity_name" text NOT NULL,
	"activity_type" text NOT NULL,
	"description" text,
	"sequence_number" integer,
	"business_process_id" integer,
	"pre_condition" text,
	"post_condition" text,
	"estimated_duration_ms" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "permission_audit_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"action_type" text NOT NULL,
	"role_id" integer,
	"permission_id" integer,
	"user_id" integer,
	"details" text,
	"changed_by" text NOT NULL,
	"changed_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"resource" text NOT NULL,
	"action" text NOT NULL,
	"api_endpoint" text,
	"description" text,
	"is_system" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"role_id" integer NOT NULL,
	"permission_id" integer NOT NULL,
	"granted" boolean DEFAULT true,
	"granted_by" text,
	"granted_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_system" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_by" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "technical_process_dependencies" (
	"id" serial PRIMARY KEY NOT NULL,
	"technical_process_id" integer,
	"depends_on_process_id" integer,
	"dependency_type" text DEFAULT 'requires' NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "technical_process_diagrams" (
	"id" serial PRIMARY KEY NOT NULL,
	"technical_process_id" integer,
	"diagram_data" text NOT NULL,
	"notes" text,
	"created_by" text,
	"last_modified_by" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "technical_process_interfaces" (
	"id" serial PRIMARY KEY NOT NULL,
	"technical_process_id" integer,
	"interface_id" integer,
	"usage_type" text DEFAULT 'consumes' NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "technical_process_internal_activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"technical_process_id" integer,
	"internal_activity_id" integer,
	"sequence_number" integer NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "technical_process_sequences" (
	"id" serial PRIMARY KEY NOT NULL,
	"technical_process_id" integer NOT NULL,
	"sequence_number" integer NOT NULL,
	"sequence_type" text NOT NULL,
	"reference_id" integer NOT NULL,
	"condition" text,
	"description" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "technical_processes" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"job_name" text NOT NULL,
	"application_id" integer,
	"description" text,
	"frequency" text DEFAULT 'on-demand' NOT NULL,
	"schedule" text,
	"criticality" text DEFAULT 'medium' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"owner" text,
	"technical_owner" text,
	"last_run_date" timestamp,
	"next_run_date" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "uploaded_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"application_id" integer NOT NULL,
	"file_name" text NOT NULL,
	"file_type" text NOT NULL,
	"file_size" integer NOT NULL,
	"file_path" text NOT NULL,
	"uploaded_by" text NOT NULL,
	"processed_status" text DEFAULT 'pending' NOT NULL,
	"extraction_method" text,
	"extraction_start_time" timestamp,
	"extraction_end_time" timestamp,
	"extraction_notes" text,
	"capabilities_extracted" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_activity_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"username" text NOT NULL,
	"activity_type" text NOT NULL,
	"method" text,
	"endpoint" text,
	"resource" text,
	"resource_id" integer,
	"action" text,
	"status_code" integer,
	"error_message" text,
	"request_body" text,
	"response_time" integer,
	"ip_address" text,
	"user_agent" text,
	"metadata" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"role_id" integer NOT NULL,
	"assigned_by" text,
	"assigned_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"name" text NOT NULL,
	"role" text DEFAULT 'user' NOT NULL,
	"autox_api_key" text,
	"autox_username" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "application_capabilities" ADD CONSTRAINT "application_capabilities_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_capabilities" ADD CONSTRAINT "application_capabilities_mapped_iml_id_interfaces_id_fk" FOREIGN KEY ("mapped_iml_id") REFERENCES "public"."interfaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_process_interfaces" ADD CONSTRAINT "business_process_interfaces_business_process_id_business_processes_id_fk" FOREIGN KEY ("business_process_id") REFERENCES "public"."business_processes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_process_interfaces" ADD CONSTRAINT "business_process_interfaces_interface_id_interfaces_id_fk" FOREIGN KEY ("interface_id") REFERENCES "public"."interfaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_process_relationships" ADD CONSTRAINT "business_process_relationships_parent_process_id_business_processes_id_fk" FOREIGN KEY ("parent_process_id") REFERENCES "public"."business_processes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_process_relationships" ADD CONSTRAINT "business_process_relationships_child_process_id_business_processes_id_fk" FOREIGN KEY ("child_process_id") REFERENCES "public"."business_processes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_process_sequences" ADD CONSTRAINT "business_process_sequences_business_process_id_business_processes_id_fk" FOREIGN KEY ("business_process_id") REFERENCES "public"."business_processes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "capabilities" ADD CONSTRAINT "capabilities_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "capabilities" ADD CONSTRAINT "capabilities_extraction_history_id_capability_extraction_history_id_fk" FOREIGN KEY ("extraction_history_id") REFERENCES "public"."capability_extraction_history"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "capability_extraction_history" ADD CONSTRAINT "capability_extraction_history_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "capability_extraction_history" ADD CONSTRAINT "capability_extraction_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "change_request_applications" ADD CONSTRAINT "change_request_applications_change_request_id_change_requests_id_fk" FOREIGN KEY ("change_request_id") REFERENCES "public"."change_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "change_request_applications" ADD CONSTRAINT "change_request_applications_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "change_request_interfaces" ADD CONSTRAINT "change_request_interfaces_change_request_id_change_requests_id_fk" FOREIGN KEY ("change_request_id") REFERENCES "public"."change_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "change_request_interfaces" ADD CONSTRAINT "change_request_interfaces_interface_id_interfaces_id_fk" FOREIGN KEY ("interface_id") REFERENCES "public"."interfaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "change_request_internal_activities" ADD CONSTRAINT "change_request_internal_activities_change_request_id_change_requests_id_fk" FOREIGN KEY ("change_request_id") REFERENCES "public"."change_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "change_request_internal_activities" ADD CONSTRAINT "change_request_internal_activities_internal_activity_id_internal_activities_id_fk" FOREIGN KEY ("internal_activity_id") REFERENCES "public"."internal_activities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "change_request_technical_processes" ADD CONSTRAINT "change_request_technical_processes_change_request_id_change_requests_id_fk" FOREIGN KEY ("change_request_id") REFERENCES "public"."change_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "change_request_technical_processes" ADD CONSTRAINT "change_request_technical_processes_technical_process_id_technical_processes_id_fk" FOREIGN KEY ("technical_process_id") REFERENCES "public"."technical_processes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication_attachments" ADD CONSTRAINT "communication_attachments_comment_id_communication_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."communication_comments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication_comments" ADD CONSTRAINT "communication_comments_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication_mentions" ADD CONSTRAINT "communication_mentions_comment_id_communication_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."communication_comments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_links" ADD CONSTRAINT "conversation_links_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "iml_diagrams" ADD CONSTRAINT "iml_diagrams_business_process_id_business_processes_id_fk" FOREIGN KEY ("business_process_id") REFERENCES "public"."business_processes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interface_comments" ADD CONSTRAINT "interface_comments_interface_id_interfaces_id_fk" FOREIGN KEY ("interface_id") REFERENCES "public"."interfaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interface_consumer_descriptions" ADD CONSTRAINT "interface_consumer_descriptions_interface_id_interfaces_id_fk" FOREIGN KEY ("interface_id") REFERENCES "public"."interfaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interface_consumer_descriptions" ADD CONSTRAINT "interface_consumer_descriptions_consumer_application_id_applications_id_fk" FOREIGN KEY ("consumer_application_id") REFERENCES "public"."applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interface_response_scenarios" ADD CONSTRAINT "interface_response_scenarios_interface_id_interfaces_id_fk" FOREIGN KEY ("interface_id") REFERENCES "public"."interfaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interface_response_scenarios" ADD CONSTRAINT "interface_response_scenarios_fallback_interface_id_interfaces_id_fk" FOREIGN KEY ("fallback_interface_id") REFERENCES "public"."interfaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interface_versions" ADD CONSTRAINT "interface_versions_interface_id_interfaces_id_fk" FOREIGN KEY ("interface_id") REFERENCES "public"."interfaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interfaces" ADD CONSTRAINT "interfaces_provider_application_id_applications_id_fk" FOREIGN KEY ("provider_application_id") REFERENCES "public"."applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interfaces" ADD CONSTRAINT "interfaces_consumer_application_id_applications_id_fk" FOREIGN KEY ("consumer_application_id") REFERENCES "public"."applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "internal_activities" ADD CONSTRAINT "internal_activities_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "internal_activities" ADD CONSTRAINT "internal_activities_business_process_id_business_processes_id_fk" FOREIGN KEY ("business_process_id") REFERENCES "public"."business_processes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permission_audit_log" ADD CONSTRAINT "permission_audit_log_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permission_audit_log" ADD CONSTRAINT "permission_audit_log_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permission_audit_log" ADD CONSTRAINT "permission_audit_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "technical_process_dependencies" ADD CONSTRAINT "technical_process_dependencies_technical_process_id_technical_processes_id_fk" FOREIGN KEY ("technical_process_id") REFERENCES "public"."technical_processes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "technical_process_dependencies" ADD CONSTRAINT "technical_process_dependencies_depends_on_process_id_technical_processes_id_fk" FOREIGN KEY ("depends_on_process_id") REFERENCES "public"."technical_processes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "technical_process_diagrams" ADD CONSTRAINT "technical_process_diagrams_technical_process_id_technical_processes_id_fk" FOREIGN KEY ("technical_process_id") REFERENCES "public"."technical_processes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "technical_process_interfaces" ADD CONSTRAINT "technical_process_interfaces_technical_process_id_technical_processes_id_fk" FOREIGN KEY ("technical_process_id") REFERENCES "public"."technical_processes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "technical_process_interfaces" ADD CONSTRAINT "technical_process_interfaces_interface_id_interfaces_id_fk" FOREIGN KEY ("interface_id") REFERENCES "public"."interfaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "technical_process_internal_activities" ADD CONSTRAINT "technical_process_internal_activities_technical_process_id_technical_processes_id_fk" FOREIGN KEY ("technical_process_id") REFERENCES "public"."technical_processes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "technical_process_internal_activities" ADD CONSTRAINT "technical_process_internal_activities_internal_activity_id_internal_activities_id_fk" FOREIGN KEY ("internal_activity_id") REFERENCES "public"."internal_activities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "technical_process_sequences" ADD CONSTRAINT "technical_process_sequences_technical_process_id_technical_processes_id_fk" FOREIGN KEY ("technical_process_id") REFERENCES "public"."technical_processes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "technical_processes" ADD CONSTRAINT "technical_processes_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uploaded_documents" ADD CONSTRAINT "uploaded_documents_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_activity_log" ADD CONSTRAINT "user_activity_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;