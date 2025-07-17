import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User table (basic user management)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("user"),
  // AutoX settings
  autoXApiKey: text("autox_api_key"),
  autoXUsername: text("autox_username"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Applications Master List (AML)
export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),
  amlNumber: text("aml_number").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  lob: text("lob"), // Line of Business
  os: text("os"),
  deployment: text("deployment"), // cloud/on-premise
  uptime: decimal("uptime", { precision: 5, scale: 2 }),
  purpose: text("purpose"),
  providesExtInterface: boolean("provides_ext_interface").default(false),
  provInterfaceType: text("prov_interface_type"),
  consumesExtInterfaces: boolean("consumes_ext_interfaces").default(false),
  consInterfaceType: text("cons_interface_type"),
  status: text("status").notNull().default("active"), // active, inactive, maintenance, deprecated, decommissioned
  artifactState: text("artifact_state").notNull().default("active"), // active, inactive, pending, draft
  plannedActivationDate: timestamp("planned_activation_date"), // When pending artifact will go live
  initiativeOrigin: text("initiative_origin"), // Initiative ID that created this artifact
  firstActiveDate: timestamp("first_active_date"),
  lastChangeDate: timestamp("last_change_date").defaultNow(),
  decommissionDate: timestamp("decommission_date"), // Planned decommission date
  decommissionReason: text("decommission_reason"), // Reason for decommissioning
  decommissionedBy: text("decommissioned_by"), // User who approved decommissioning
  // Visualization fields for Interface Builder
  xPosition: decimal("x_position"), // X coordinate for diagram positioning
  yPosition: decimal("y_position"), // Y coordinate for diagram positioning
  layer: text("layer"), // presentation, application, data, integration
  criticality: text("criticality"), // low, medium, high, critical
  team: text("team"), // Team responsible for the application
  // TM Forum domain fields
  tmfDomain: text("tmf_domain"), // product, customer, service, resource, partner, enterprise
  tmfSubDomain: text("tmf_sub_domain"), // More specific sub-domain classification
  tmfProcessArea: text("tmf_process_area"), // eTOM process area mapping
  tmfCapability: text("tmf_capability"), // Specific capability within the domain
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Interfaces Master List (IML)
export const interfaces = pgTable("interfaces", {
  id: serial("id").primaryKey(),
  imlNumber: text("iml_number").notNull().unique(),
  description: text("description"), // Interface description
  providerApplicationId: integer("provider_application_id").references(() => applications.id),
  consumerApplicationId: integer("consumer_application_id").references(() => applications.id),
  interfaceType: text("interface_type").notNull(), // REST, SOAP, GraphQL, messaging, database
  middleware: text("middleware").default("None"), // None, Apache Kafka, RabbitMQ, IBM MQ, Redis, WSO2, MuleSoft, PSB, PCE, Custom
  version: text("version").notNull().default("1.0"),
  lob: text("lob"), // Line of Business
  lastChangeDate: timestamp("last_change_date").defaultNow(),
  businessProcessName: text("business_process_name"),
  customerFocal: text("customer_focal"),
  providerOwner: text("provider_owner"),
  consumerOwner: text("consumer_owner"),
  status: text("status").notNull().default("active"), // active, inactive, deprecated, under_review
  artifactState: text("artifact_state").notNull().default("active"), // active, inactive, pending, draft
  plannedActivationDate: timestamp("planned_activation_date"), // When pending artifact will go live
  initiativeOrigin: text("initiative_origin"), // Initiative ID that created this artifact
  sampleCode: text("sample_code"), // Sample code for connectivity test
  connectivitySteps: text("connectivity_steps"), // Steps for connectivity test
  interfaceTestSteps: text("interface_test_steps"), // Steps for interface test
  // Visualization fields for Interface Builder
  dataFlow: text("data_flow"), // bidirectional, provider_to_consumer, consumer_to_provider
  protocol: text("protocol"), // HTTP, HTTPS, JMS, TCP, FTP, etc.
  frequency: text("frequency"), // real-time, batch, scheduled, on-demand
  dataVolume: text("data_volume"), // low, medium, high, very-high
  // TM Forum domain fields
  tmfIntegrationPattern: text("tmf_integration_pattern"), // Standard TM Forum integration pattern
  tmfDomainInteraction: text("tmf_domain_interaction"), // e.g., "service-to-resource", "product-to-service"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Change Requests
export const changeRequests = pgTable("change_requests", {
  id: serial("id").primaryKey(),
  crNumber: text("cr_number").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  reason: text("reason"),
  benefit: text("benefit"),
  status: text("status").notNull().default("draft"), // draft, submitted, under_review, approved, in_progress, completed, rejected
  priority: text("priority").default("medium"), // low, medium, high, critical
  owner: text("owner"),
  requestedBy: text("requested_by"),
  approvedBy: text("approved_by"),
  targetDate: timestamp("target_date"),
  completedDate: timestamp("completed_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Change Request Application Impacts
export const changeRequestApplications = pgTable("change_request_applications", {
  id: serial("id").primaryKey(),
  changeRequestId: integer("change_request_id").references(() => changeRequests.id),
  applicationId: integer("application_id").references(() => applications.id),
  impactType: text("impact_type"), // modification, dependency, testing
  impactDescription: text("impact_description")
});

// Change Request Interface Impacts
export const changeRequestInterfaces = pgTable("change_request_interfaces", {
  id: serial("id").primaryKey(),
  changeRequestId: integer("change_request_id").references(() => changeRequests.id),
  interfaceId: integer("interface_id").references(() => interfaces.id),
  impactType: text("impact_type"), // modification, version_change, deprecation
  impactDescription: text("impact_description")
});

// Change Request Internal Activities Impacts
export const changeRequestInternalActivities = pgTable("change_request_internal_activities", {
  id: serial("id").primaryKey(),
  changeRequestId: integer("change_request_id").references(() => changeRequests.id),
  internalActivityId: integer("internal_activity_id").references(() => internalActivities.id),
  impactType: text("impact_type"), // modification, dependency, testing, configuration, sequence_change
  impactDescription: text("impact_description")
});

// Interface Comments/History
export const interfaceComments = pgTable("interface_comments", {
  id: serial("id").primaryKey(),
  interfaceId: integer("interface_id").references(() => interfaces.id),
  comment: text("comment").notNull(),
  author: text("author").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

// Business Processes
export const businessProcesses = pgTable("business_processes", {
  id: serial("id").primaryKey(),
  businessProcess: text("business_process").notNull(),
  lob: text("lob").notNull(), // Line of Business
  product: text("product").notNull(),
  version: text("version").notNull().default("1.0"),
  level: text("level").notNull().default("A"), // A, B, or C
  domainOwner: text("domain_owner"),
  itOwner: text("it_owner"),
  vendorFocal: text("vendor_focal"),
  status: text("status").notNull().default("active"),
  // TM Forum eTOM fields
  tmfEtomL1: text("tmf_etom_l1"), // Level 1 eTOM process (e.g., "Operations")
  tmfEtomL2: text("tmf_etom_l2"), // Level 2 eTOM process (e.g., "Service Management & Operations")
  tmfEtomL3: text("tmf_etom_l3"), // Level 3 eTOM process (e.g., "Service Configuration & Activation")
  tmfEtomL4: text("tmf_etom_l4"), // Level 4 eTOM process (specific activity)
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Business Process Interface Mapping (with sequence)
export const businessProcessInterfaces = pgTable("business_process_interfaces", {
  id: serial("id").primaryKey(),
  businessProcessId: integer("business_process_id").references(() => businessProcesses.id),
  interfaceId: integer("interface_id").references(() => interfaces.id),
  sequenceNumber: integer("sequence_number").notNull(),
  description: text("description"), // BP-specific description for this interface
  createdAt: timestamp("created_at").defaultNow()
});

// Business Process Relationships (parent-child hierarchy)
export const businessProcessRelationships = pgTable("business_process_relationships", {
  id: serial("id").primaryKey(),
  parentProcessId: integer("parent_process_id").references(() => businessProcesses.id).notNull(),
  childProcessId: integer("child_process_id").references(() => businessProcesses.id).notNull(),
  relationshipType: text("relationship_type").default("contains"), // contains, includes, etc.
  sequenceNumber: integer("sequence_number").notNull().default(1), // Sequence within parent process
  createdAt: timestamp("created_at").defaultNow()
});

// Interface Versions
export const interfaceVersions = pgTable("interface_versions", {
  id: serial("id").primaryKey(),
  interfaceId: integer("interface_id").references(() => interfaces.id),
  version: text("version").notNull(),
  changeDescription: text("change_description"),
  sampleCode: text("sample_code"), // Sample code for connectivity test
  connectivitySteps: text("connectivity_steps"), // Steps for connectivity test
  interfaceTestSteps: text("interface_test_steps"), // Steps for interface test
  createdBy: text("created_by"),
  createdAt: timestamp("created_at").defaultNow()
});

// Internal Activities (for self-referential operations within applications)
export const internalActivities = pgTable("internal_activities", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").references(() => applications.id).notNull(),
  activityName: text("activity_name").notNull(),
  activityType: text("activity_type").notNull(), // check, validate, transform, compute, decide
  description: text("description"),
  sequenceNumber: integer("sequence_number"),
  businessProcessId: integer("business_process_id").references(() => businessProcesses.id),
  preCondition: text("pre_condition"), // Condition that must be true before execution
  postCondition: text("post_condition"), // Expected state after execution
  estimatedDurationMs: integer("estimated_duration_ms"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Enhanced Business Process Sequences (supports both internal activities and interface calls)
export const businessProcessSequences = pgTable("business_process_sequences", {
  id: serial("id").primaryKey(),
  businessProcessId: integer("business_process_id").references(() => businessProcesses.id).notNull(),
  sequenceNumber: integer("sequence_number").notNull(),
  sequenceType: text("sequence_type").notNull(), // internal_activity, interface_call, decision_point
  referenceId: integer("reference_id").notNull(), // ID of internal_activity, interface, or decision_point
  condition: text("condition"), // always, if_exists, if_not_exists, on_success, on_failure, on_timeout
  conditionExpression: text("condition_expression"), // Actual condition logic
  nextSequenceOnSuccess: integer("next_sequence_on_success"),
  nextSequenceOnFailure: integer("next_sequence_on_failure"),
  nextSequenceOnTimeout: integer("next_sequence_on_timeout"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow()
});

// Interface Response Scenarios
export const interfaceResponseScenarios = pgTable("interface_response_scenarios", {
  id: serial("id").primaryKey(),
  interfaceId: integer("interface_id").references(() => interfaces.id).notNull(),
  scenarioType: text("scenario_type").notNull(), // success, failure, timeout, partial_success
  responseCode: text("response_code"), // HTTP codes, error codes, etc.
  responseDescription: text("response_description"),
  nextAction: text("next_action").notNull(), // continue, retry, abort, fallback, compensate
  nextSequenceNumber: integer("next_sequence_number"),
  retryPolicy: text("retry_policy"), // immediate, exponential_backoff, fixed_delay
  maxRetries: integer("max_retries").default(3),
  retryDelayMs: integer("retry_delay_ms").default(1000),
  timeoutMs: integer("timeout_ms").default(30000),
  fallbackInterfaceId: integer("fallback_interface_id").references(() => interfaces.id),
  createdAt: timestamp("created_at").defaultNow()
});

// Decision Points for conditional flows
export const decisionPoints = pgTable("decision_points", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  decisionType: text("decision_type").notNull(), // data_check, business_rule, technical_check
  evaluationLogic: text("evaluation_logic"), // Expression or rule to evaluate
  possibleOutcomes: text("possible_outcomes"), // JSON array of possible outcomes
  createdAt: timestamp("created_at").defaultNow()
});

// Interface Consumer Descriptions
export const interfaceConsumerDescriptions = pgTable("interface_consumer_descriptions", {
  id: serial("id").primaryKey(),
  interfaceId: integer("interface_id").references(() => interfaces.id),
  consumerApplicationId: integer("consumer_application_id").references(() => applications.id),
  description: text("description"),
  responseFormat: text("response_format"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// IML Diagrams
export const imlDiagrams = pgTable("iml_diagrams", {
  id: serial("id").primaryKey(),
  businessProcessId: integer("business_process_id").references(() => businessProcesses.id),
  diagramData: text("diagram_data").notNull(), // JSON string of diagram data
  notes: text("notes"),
  createdBy: text("created_by"),
  lastModifiedBy: text("last_modified_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Interface Builder Folders
export const interfaceBuilderFolders = pgTable("interface_builder_folders", {
  id: serial("id").primaryKey(),
  path: text("path").notNull().unique(), // Full folder path (e.g., "/folder/subfolder")
  name: text("name").notNull(), // Folder name (just the last part of the path)
  parentPath: text("parent_path"), // Parent folder path (null for root folders)
  description: text("description"),
  createdBy: text("created_by").notNull(),
  isTeamFolder: boolean("is_team_folder").notNull().default(false), // Whether this folder is visible to all users
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Interface Builder Projects
export const interfaceBuilderProjects = pgTable("interface_builder_projects", {
  id: serial("id").primaryKey(),
  projectId: text("project_id").notNull().unique(), // Client-generated project ID
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(), // microservices, enterprise, data-pipeline, frontend-backend, iot-edge, legacy-integration
  folderPath: text("folder_path").default("/"), // Folder path for organization (e.g., "/folder/subfolder/")
  nodes: text("nodes").notNull(), // JSON string of React Flow nodes
  edges: text("edges").notNull(), // JSON string of React Flow edges
  metadata: text("metadata"), // JSON string of project metadata
  version: text("version").notNull().default("1.0"),
  author: text("author").notNull(),
  isTeamProject: boolean("is_team_project").notNull().default(false), // Whether this is a team project visible to all users
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Communication Conversations
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("open"), // open, resolved, pending, closed
  priority: text("priority").notNull().default("medium"), // low, medium, high, critical
  createdBy: text("created_by").notNull(),
  assignedTo: text("assigned_to"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  resolvedAt: timestamp("resolved_at")
});

// Communication Entity Links (links conversations to AML/IML/BP/CR)
export const conversationLinks = pgTable("conversation_links", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").references(() => conversations.id),
  entityType: text("entity_type").notNull(), // application, interface, business_process, change_request
  entityId: integer("entity_id").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

// Communication Comments
export const communicationComments = pgTable("communication_comments", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").references(() => conversations.id),
  parentId: integer("parent_id"), // For nested replies
  content: text("content").notNull(),
  author: text("author").notNull(),
  isEdited: boolean("is_edited").default(false),
  editedAt: timestamp("edited_at"),
  createdAt: timestamp("created_at").defaultNow()
});

// Communication Attachments
export const communicationAttachments = pgTable("communication_attachments", {
  id: serial("id").primaryKey(),
  commentId: integer("comment_id").references(() => communicationComments.id),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(),
  fileSize: integer("file_size").notNull(),
  fileUrl: text("file_url").notNull(),
  uploadedBy: text("uploaded_by").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

// Communication Participants
export const conversationParticipants = pgTable("conversation_participants", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").references(() => conversations.id),
  participantName: text("participant_name").notNull(),
  participantRole: text("participant_role"), // customer, vendor, architect, pm, tester
  isActive: boolean("is_active").default(true),
  addedAt: timestamp("added_at").defaultNow()
});

// Communication Mentions
export const communicationMentions = pgTable("communication_mentions", {
  id: serial("id").primaryKey(),
  commentId: integer("comment_id").references(() => communicationComments.id),
  mentionedUser: text("mentioned_user").notNull(),
  notified: boolean("notified").default(false),
  createdAt: timestamp("created_at").defaultNow()
});

// Technical Processes
export const technicalProcesses = pgTable("technical_processes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  jobName: text("job_name").notNull(),
  applicationId: integer("application_id").references(() => applications.id),
  description: text("description"),
  frequency: text("frequency").notNull().default("on-demand"), // scheduled, on-demand, real-time, batch
  schedule: text("schedule"), // cron expression or schedule details
  criticality: text("criticality").notNull().default("medium"), // low, medium, high, critical
  status: text("status").notNull().default("active"), // active, inactive, deprecated
  owner: text("owner"),
  technicalOwner: text("technical_owner"),
  lastRunDate: timestamp("last_run_date"),
  nextRunDate: timestamp("next_run_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Technical Process Interface Mapping
export const technicalProcessInterfaces = pgTable("technical_process_interfaces", {
  id: serial("id").primaryKey(),
  technicalProcessId: integer("technical_process_id").references(() => technicalProcesses.id),
  interfaceId: integer("interface_id").references(() => interfaces.id),
  sequenceNumber: integer("sequence_number").notNull().default(0),
  usageType: text("usage_type").notNull().default("consumes"), // consumes, provides
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow()
});

// Technical Process Dependencies (DEPRECATED - kept for backwards compatibility)
export const technicalProcessDependencies = pgTable("technical_process_dependencies", {
  id: serial("id").primaryKey(),
  technicalProcessId: integer("technical_process_id").references(() => technicalProcesses.id),
  dependsOnProcessId: integer("depends_on_process_id").references(() => technicalProcesses.id),
  dependencyType: text("dependency_type").notNull().default("requires"), // requires, triggers, optional
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow()
});

// Technical Process Internal Activity Dependencies (NEW)
export const technicalProcessInternalActivities = pgTable("technical_process_internal_activities", {
  id: serial("id").primaryKey(),
  technicalProcessId: integer("technical_process_id").references(() => technicalProcesses.id),
  internalActivityId: integer("internal_activity_id").references(() => internalActivities.id),
  sequenceNumber: integer("sequence_number").notNull(),
  description: text("description"), // Technical process specific description
  createdAt: timestamp("created_at").defaultNow()
});

// Technical Process Sequences (supports ordering of internal activities and interface calls)
export const technicalProcessSequences = pgTable("technical_process_sequences", {
  id: serial("id").primaryKey(),
  technicalProcessId: integer("technical_process_id").references(() => technicalProcesses.id).notNull(),
  sequenceNumber: integer("sequence_number").notNull(),
  sequenceType: text("sequence_type").notNull(), // internal_activity, interface_call
  referenceId: integer("reference_id").notNull(), // ID of internal_activity or interface
  condition: text("condition"), // always, on_success, on_failure
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow()
});

// Technical Process Diagrams
export const technicalProcessDiagrams = pgTable("technical_process_diagrams", {
  id: serial("id").primaryKey(),
  technicalProcessId: integer("technical_process_id").references(() => technicalProcesses.id),
  diagramData: text("diagram_data").notNull(), // JSON string of diagram data
  notes: text("notes"),
  createdBy: text("created_by"),
  lastModifiedBy: text("last_modified_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Business Process Hierarchy Designs
export const businessProcessHierarchyDesigns = pgTable("business_process_hierarchy_designs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  hierarchyData: text("hierarchy_data").notNull(), // JSON string containing the hierarchy structure
  createdBy: text("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  tags: text("tags"), // Comma-separated tags for categorization
  isTemplate: boolean("is_template").default(false), // Mark as reusable template
  templateCategory: text("template_category"), // Category for templates (e.g., "Financial", "Manufacturing")
  version: text("version").default("1.0"),
  status: text("status").default("draft") // draft, published, archived
});

// Change Request Technical Process Impacts
export const changeRequestTechnicalProcesses = pgTable("change_request_technical_processes", {
  id: serial("id").primaryKey(),
  changeRequestId: integer("change_request_id").references(() => changeRequests.id),
  technicalProcessId: integer("technical_process_id").references(() => technicalProcesses.id),
  impactType: text("impact_type"), // modification, dependency, testing, schedule_change
  impactDescription: text("impact_description")
});

// RBAC Tables

// Roles table
export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  isSystem: boolean("is_system").default(false), // System roles cannot be deleted
  isActive: boolean("is_active").default(true),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Permissions table
export const permissions = pgTable("permissions", {
  id: serial("id").primaryKey(),
  resource: text("resource").notNull(), // e.g., "applications", "interfaces", "change_requests"
  action: text("action").notNull(), // e.g., "read", "create", "update", "delete"
  apiEndpoint: text("api_endpoint"), // e.g., "GET /api/applications"
  description: text("description"),
  isSystem: boolean("is_system").default(false),
  createdAt: timestamp("created_at").defaultNow()
});

// Role-Permission mapping
export const rolePermissions = pgTable("role_permissions", {
  id: serial("id").primaryKey(),
  roleId: integer("role_id").references(() => roles.id).notNull(),
  permissionId: integer("permission_id").references(() => permissions.id).notNull(),
  granted: boolean("granted").default(true), // Can be used to explicitly deny permissions
  grantedBy: text("granted_by"),
  grantedAt: timestamp("granted_at").defaultNow()
});

// User-Role mapping (supports multiple roles per user)
export const userRoles = pgTable("user_roles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  roleId: integer("role_id").references(() => roles.id).notNull(),
  assignedBy: text("assigned_by"),
  assignedAt: timestamp("assigned_at").defaultNow()
});

// API Endpoints catalog
export const apiEndpoints = pgTable("api_endpoints", {
  id: serial("id").primaryKey(),
  method: text("method").notNull(), // GET, POST, PUT, DELETE
  path: text("path").notNull(), // /api/applications/:id
  resource: text("resource").notNull(), // applications
  action: text("action").notNull(), // read, create, update, delete
  description: text("description"),
  requiresAuth: boolean("requires_auth").default(true),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow()
});

// Permission Audit Log
export const permissionAuditLog = pgTable("permission_audit_log", {
  id: serial("id").primaryKey(),
  actionType: text("action_type").notNull(), // role_created, role_updated, permission_granted, permission_revoked, user_role_assigned, user_role_removed
  roleId: integer("role_id").references(() => roles.id),
  permissionId: integer("permission_id").references(() => permissions.id),
  userId: integer("user_id").references(() => users.id),
  details: text("details"), // JSON string with additional details
  changedBy: text("changed_by").notNull(),
  changedAt: timestamp("changed_at").defaultNow()
});

// User Activity Log
export const userActivityLog = pgTable("user_activity_log", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  username: text("username").notNull(),
  activityType: text("activity_type").notNull(), // api_call, login, logout, data_export, data_import, permission_denied
  method: text("method"), // GET, POST, PUT, DELETE
  endpoint: text("endpoint"), // API endpoint accessed
  resource: text("resource"), // Resource type (applications, interfaces, etc.)
  resourceId: integer("resource_id"), // ID of the resource accessed
  action: text("action"), // read, create, update, delete
  statusCode: integer("status_code"), // HTTP status code
  errorMessage: text("error_message"), // Error message if any
  requestBody: text("request_body"), // JSON string of request body (sanitized)
  responseTime: integer("response_time"), // Response time in milliseconds
  ipAddress: text("ip_address"), // User's IP address
  userAgent: text("user_agent"), // User agent string
  metadata: text("metadata"), // Additional metadata as JSON
  createdAt: timestamp("created_at").defaultNow()
});

// RBAC Insert Schemas
export const insertRoleSchema = createInsertSchema(roles).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertPermissionSchema = createInsertSchema(permissions).omit({
  id: true,
  createdAt: true
});

export const insertRolePermissionSchema = createInsertSchema(rolePermissions).omit({
  id: true,
  grantedAt: true
});

export const insertUserRoleSchema = createInsertSchema(userRoles).omit({
  id: true,
  assignedAt: true
});

export const insertApiEndpointSchema = createInsertSchema(apiEndpoints).omit({
  id: true,
  createdAt: true
});

export const insertPermissionAuditLogSchema = createInsertSchema(permissionAuditLog).omit({
  id: true,
  changedAt: true
});

export const insertUserActivityLogSchema = createInsertSchema(userActivityLog).omit({
  id: true,
  createdAt: true
});

// Insert Schemas
export const insertApplicationSchema = createInsertSchema(applications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastChangeDate: true,
  firstActiveDate: true,
  decommissionDate: true
}).extend({
  firstActiveDate: z.union([z.string(), z.date()]).optional().transform((val) => {
    if (!val) return undefined;
    return typeof val === 'string' ? new Date(val) : val;
  }),
  decommissionDate: z.union([z.string(), z.date()]).optional().transform((val) => {
    if (!val) return undefined;
    return typeof val === 'string' ? new Date(val) : val;
  })
});

export const insertInterfaceSchema = createInsertSchema(interfaces).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastChangeDate: true
});

export const insertChangeRequestSchema = createInsertSchema(changeRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  targetDate: true,
  completedDate: true
}).extend({
  targetDate: z.union([z.string(), z.date()]).optional().transform((val) => {
    if (!val) return undefined;
    return typeof val === 'string' ? new Date(val) : val;
  }),
  completedDate: z.union([z.string(), z.date()]).optional().transform((val) => {
    if (!val) return undefined;
    return typeof val === 'string' ? new Date(val) : val;
  })
});

export const insertInterfaceCommentSchema = createInsertSchema(interfaceComments).omit({
  id: true,
  createdAt: true
});

export const insertChangeRequestApplicationSchema = createInsertSchema(changeRequestApplications).omit({
  id: true
});

export const insertChangeRequestInterfaceSchema = createInsertSchema(changeRequestInterfaces).omit({
  id: true
});

export const insertChangeRequestInternalActivitySchema = createInsertSchema(changeRequestInternalActivities).omit({
  id: true
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertBusinessProcessSchema = createInsertSchema(businessProcesses).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertBusinessProcessInterfaceSchema = createInsertSchema(businessProcessInterfaces).omit({
  id: true,
  createdAt: true
});

export const insertBusinessProcessRelationshipSchema = createInsertSchema(businessProcessRelationships).omit({
  id: true,
  createdAt: true
});

export const insertInterfaceVersionSchema = createInsertSchema(interfaceVersions).omit({
  id: true,
  createdAt: true
});

export const insertInternalActivitySchema = createInsertSchema(internalActivities).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertBusinessProcessSequenceSchema = createInsertSchema(businessProcessSequences).omit({
  id: true,
  createdAt: true
});

export const insertInterfaceResponseScenarioSchema = createInsertSchema(interfaceResponseScenarios).omit({
  id: true,
  createdAt: true
});

export const insertDecisionPointSchema = createInsertSchema(decisionPoints).omit({
  id: true,
  createdAt: true
});

export const insertInterfaceConsumerDescriptionSchema = createInsertSchema(interfaceConsumerDescriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertImlDiagramSchema = createInsertSchema(imlDiagrams).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertInterfaceBuilderFolderSchema = createInsertSchema(interfaceBuilderFolders).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertInterfaceBuilderProjectSchema = createInsertSchema(interfaceBuilderProjects).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  resolvedAt: true
}).extend({
  resolvedAt: z.union([z.string(), z.date()]).optional().transform((val) => {
    if (!val) return undefined;
    return typeof val === 'string' ? new Date(val) : val;
  })
});

export const insertConversationLinkSchema = createInsertSchema(conversationLinks).omit({
  id: true,
  createdAt: true
});

export const insertCommunicationCommentSchema = createInsertSchema(communicationComments).omit({
  id: true,
  createdAt: true,
  editedAt: true
});

export const insertCommunicationAttachmentSchema = createInsertSchema(communicationAttachments).omit({
  id: true,
  createdAt: true
});

export const insertConversationParticipantSchema = createInsertSchema(conversationParticipants).omit({
  id: true,
  addedAt: true
});

export const insertCommunicationMentionSchema = createInsertSchema(communicationMentions).omit({
  id: true,
  createdAt: true
});

export const insertTechnicalProcessSchema = createInsertSchema(technicalProcesses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastRunDate: true,
  nextRunDate: true
}).extend({
  lastRunDate: z.union([z.string(), z.date()]).optional().transform((val) => {
    if (!val) return undefined;
    return typeof val === 'string' ? new Date(val) : val;
  }),
  nextRunDate: z.union([z.string(), z.date()]).optional().transform((val) => {
    if (!val) return undefined;
    return typeof val === 'string' ? new Date(val) : val;
  })
});

export const insertTechnicalProcessInterfaceSchema = createInsertSchema(technicalProcessInterfaces).omit({
  id: true,
  createdAt: true
});

export const insertTechnicalProcessDependencySchema = createInsertSchema(technicalProcessDependencies).omit({
  id: true,
  createdAt: true
});

export const insertChangeRequestTechnicalProcessSchema = createInsertSchema(changeRequestTechnicalProcesses).omit({
  id: true
});

// Types
export type Application = typeof applications.$inferSelect;
export type InsertApplication = z.infer<typeof insertApplicationSchema>;

export type Interface = typeof interfaces.$inferSelect;
export type InsertInterface = z.infer<typeof insertInterfaceSchema>;

export type ChangeRequest = typeof changeRequests.$inferSelect;
export type InsertChangeRequest = z.infer<typeof insertChangeRequestSchema>;

export type InterfaceComment = typeof interfaceComments.$inferSelect;
export type InsertInterfaceComment = z.infer<typeof insertInterfaceCommentSchema>;

export type ChangeRequestApplication = typeof changeRequestApplications.$inferSelect;
export type InsertChangeRequestApplication = z.infer<typeof insertChangeRequestApplicationSchema>;

export type ChangeRequestInterface = typeof changeRequestInterfaces.$inferSelect;
export type InsertChangeRequestInterface = z.infer<typeof insertChangeRequestInterfaceSchema>;

export type ChangeRequestInternalActivity = typeof changeRequestInternalActivities.$inferSelect;
export type InsertChangeRequestInternalActivity = z.infer<typeof insertChangeRequestInternalActivitySchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type BusinessProcess = typeof businessProcesses.$inferSelect;
export type InsertBusinessProcess = z.infer<typeof insertBusinessProcessSchema>;

export type BusinessProcessInterface = typeof businessProcessInterfaces.$inferSelect;
export type BusinessProcessRelationship = typeof businessProcessRelationships.$inferSelect;
export type InsertBusinessProcessRelationship = z.infer<typeof insertBusinessProcessRelationshipSchema>;
export type InsertBusinessProcessInterface = z.infer<typeof insertBusinessProcessInterfaceSchema>;

export type InterfaceVersion = typeof interfaceVersions.$inferSelect;
export type InsertInterfaceVersion = z.infer<typeof insertInterfaceVersionSchema>;

export type InternalActivity = typeof internalActivities.$inferSelect;
export type InsertInternalActivity = z.infer<typeof insertInternalActivitySchema>;

export type BusinessProcessSequence = typeof businessProcessSequences.$inferSelect;
export type InsertBusinessProcessSequence = z.infer<typeof insertBusinessProcessSequenceSchema>;

export type InterfaceResponseScenario = typeof interfaceResponseScenarios.$inferSelect;
export type InsertInterfaceResponseScenario = z.infer<typeof insertInterfaceResponseScenarioSchema>;

export type DecisionPoint = typeof decisionPoints.$inferSelect;
export type InsertDecisionPoint = z.infer<typeof insertDecisionPointSchema>;

export type InterfaceConsumerDescription = typeof interfaceConsumerDescriptions.$inferSelect;
export type InsertInterfaceConsumerDescription = z.infer<typeof insertInterfaceConsumerDescriptionSchema>;

export type ImlDiagram = typeof imlDiagrams.$inferSelect;
export type InsertImlDiagram = z.infer<typeof insertImlDiagramSchema>;

export type InterfaceBuilderFolder = typeof interfaceBuilderFolders.$inferSelect;
export type InsertInterfaceBuilderFolder = z.infer<typeof insertInterfaceBuilderFolderSchema>;

export type InterfaceBuilderProject = typeof interfaceBuilderProjects.$inferSelect;
export type InsertInterfaceBuilderProject = z.infer<typeof insertInterfaceBuilderProjectSchema>;

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;

export type ConversationLink = typeof conversationLinks.$inferSelect;
export type InsertConversationLink = z.infer<typeof insertConversationLinkSchema>;

export type CommunicationComment = typeof communicationComments.$inferSelect;
export type InsertCommunicationComment = z.infer<typeof insertCommunicationCommentSchema>;

export type CommunicationAttachment = typeof communicationAttachments.$inferSelect;
export type InsertCommunicationAttachment = z.infer<typeof insertCommunicationAttachmentSchema>;

export type ConversationParticipant = typeof conversationParticipants.$inferSelect;
export type InsertConversationParticipant = z.infer<typeof insertConversationParticipantSchema>;

export type CommunicationMention = typeof communicationMentions.$inferSelect;
export type InsertCommunicationMention = z.infer<typeof insertCommunicationMentionSchema>;

export type TechnicalProcess = typeof technicalProcesses.$inferSelect;
export type InsertTechnicalProcess = z.infer<typeof insertTechnicalProcessSchema>;

export type TechnicalProcessInterface = typeof technicalProcessInterfaces.$inferSelect;
export type InsertTechnicalProcessInterface = z.infer<typeof insertTechnicalProcessInterfaceSchema>;

export type TechnicalProcessDependency = typeof technicalProcessDependencies.$inferSelect;
export type InsertTechnicalProcessDependency = z.infer<typeof insertTechnicalProcessDependencySchema>;

export type ChangeRequestTechnicalProcess = typeof changeRequestTechnicalProcesses.$inferSelect;
export type InsertChangeRequestTechnicalProcess = z.infer<typeof insertChangeRequestTechnicalProcessSchema>;

// Application Capabilities table - stores all capabilities of an application
export const applicationCapabilities = pgTable("application_capabilities", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").references(() => applications.id).notNull(),
  capabilityName: text("capability_name").notNull(),
  capabilityType: text("capability_type").notNull(), // interface, api, service, function, integration
  area: text("area"), // Functional area or module (e.g., Authentication, Payment Processing, Data Export, etc.)
  description: text("description"),
  interfaceType: text("interface_type"), // REST, SOAP, GraphQL, messaging, database, file
  protocol: text("protocol"), // HTTP, HTTPS, JMS, TCP, FTP, SFTP, etc.
  dataFormat: text("data_format"), // JSON, XML, CSV, Fixed-width, Binary
  isActive: boolean("is_active").default(false), // Whether this capability is currently in use
  status: text("status").notNull().default("available"), // available, in_use, deprecated, planned
  endpoint: text("endpoint"), // API endpoint or service URL
  sampleRequest: text("sample_request"), // Sample request format
  sampleResponse: text("sample_response"), // Sample response format
  documentation: text("documentation"), // Additional documentation
  mappedImlId: integer("mapped_iml_id").references(() => interfaces.id), // Link to existing IML if matched
  extractedFrom: text("extracted_from"), // Document name/source
  extractedDate: timestamp("extracted_date"),
  extractedBy: text("extracted_by"), // User or AI
  confidence: decimal("confidence", { precision: 3, scale: 2 }), // AI extraction confidence (0.00-1.00)
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Uploaded Documents table - tracks documents uploaded for capability extraction
export const uploadedDocuments = pgTable("uploaded_documents", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").references(() => applications.id).notNull(),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(), // pdf, docx, txt, xlsx
  fileSize: integer("file_size").notNull(), // Size in bytes
  filePath: text("file_path").notNull(), // Local storage path
  uploadedBy: text("uploaded_by").notNull(),
  processedStatus: text("processed_status").notNull().default("pending"), // pending, processing, completed, failed
  extractionMethod: text("extraction_method"), // claude_cli, manual, other_ai
  extractionStartTime: timestamp("extraction_start_time"),
  extractionEndTime: timestamp("extraction_end_time"),
  extractionNotes: text("extraction_notes"), // Notes about the extraction process
  capabilitiesExtracted: integer("capabilities_extracted").default(0), // Number of capabilities extracted
  createdAt: timestamp("created_at").defaultNow()
});

// Capability Extraction History - tracks each extraction attempt
export const capabilityExtractionHistory = pgTable("capability_extraction_history", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  fileType: text("file_type").notNull(),
  applicationId: integer("application_id").references(() => applications.id),
  taskId: text("task_id"), // AutoX API task ID
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  startedAt: timestamp("started_at").notNull(),
  completedAt: timestamp("completed_at"),
  userId: integer("user_id").references(() => users.id),
  error: text("error"),
  resultSummary: jsonb("result_summary"), // Summary of extraction results
  extractedData: jsonb("extracted_data"), // Full extracted capabilities data
  autoXFileName: text("autox_filename"), // Filename as stored in AutoX
  createdAt: timestamp("created_at").defaultNow()
});

// Capabilities table - stores extracted capabilities
export const capabilities = pgTable("capabilities", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").references(() => applications.id).notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(), // REST, SOAP, GraphQL, Database, File, etc.
  protocol: text("protocol"), // HTTP, HTTPS, SFTP, etc.
  direction: text("direction").$type<'inbound' | 'outbound' | 'bidirectional'>(),
  dataFormat: text("data_format"), // JSON, XML, CSV, etc.
  authentication: text("authentication"),
  thirdPartyService: text("third_party_service"),
  endpoints: text("endpoints").array(),
  description: text("description"),
  extractionHistoryId: integer("extraction_history_id").references(() => capabilityExtractionHistory.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow()
});

// Insert Schemas for new tables
export const insertApplicationCapabilitySchema = createInsertSchema(applicationCapabilities).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  extractedDate: true
}).extend({
  extractedDate: z.union([z.string(), z.date()]).optional().transform((val) => {
    if (!val) return undefined;
    return typeof val === 'string' ? new Date(val) : val;
  })
});

export const insertUploadedDocumentSchema = createInsertSchema(uploadedDocuments).omit({
  id: true,
  createdAt: true,
  extractionStartTime: true,
  extractionEndTime: true
}).extend({
  extractionStartTime: z.union([z.string(), z.date()]).optional().transform((val) => {
    if (!val) return undefined;
    return typeof val === 'string' ? new Date(val) : val;
  }),
  extractionEndTime: z.union([z.string(), z.date()]).optional().transform((val) => {
    if (!val) return undefined;
    return typeof val === 'string' ? new Date(val) : val;
  })
});

export const insertCapabilityExtractionHistorySchema = createInsertSchema(capabilityExtractionHistory).omit({
  id: true,
  createdAt: true,
  startedAt: true,
  completedAt: true
}).extend({
  startedAt: z.union([z.string(), z.date()]).transform((val) => {
    return typeof val === 'string' ? new Date(val) : val;
  }),
  completedAt: z.union([z.string(), z.date()]).optional().transform((val) => {
    if (!val) return undefined;
    return typeof val === 'string' ? new Date(val) : val;
  })
});

export const insertCapabilitySchema = createInsertSchema(capabilities).omit({
  id: true,
  createdAt: true
});

// Types for new tables
export type ApplicationCapability = typeof applicationCapabilities.$inferSelect;
export type InsertApplicationCapability = z.infer<typeof insertApplicationCapabilitySchema>;

export type UploadedDocument = typeof uploadedDocuments.$inferSelect;
export type InsertUploadedDocument = z.infer<typeof insertUploadedDocumentSchema>;

export type CapabilityExtractionHistory = typeof capabilityExtractionHistory.$inferSelect;
export type InsertCapabilityExtractionHistory = z.infer<typeof insertCapabilityExtractionHistorySchema>;

export type Capability = typeof capabilities.$inferSelect;
export type InsertCapability = z.infer<typeof insertCapabilitySchema>;

// RBAC Types
export type Role = typeof roles.$inferSelect;
export type InsertRole = z.infer<typeof insertRoleSchema>;

export type Permission = typeof permissions.$inferSelect;
export type InsertPermission = z.infer<typeof insertPermissionSchema>;

export type RolePermission = typeof rolePermissions.$inferSelect;
export type InsertRolePermission = z.infer<typeof insertRolePermissionSchema>;

export type UserRole = typeof userRoles.$inferSelect;
export type InsertUserRole = z.infer<typeof insertUserRoleSchema>;

export type ApiEndpoint = typeof apiEndpoints.$inferSelect;
export type InsertApiEndpoint = z.infer<typeof insertApiEndpointSchema>;

export type PermissionAuditLog = typeof permissionAuditLog.$inferSelect;
export type InsertPermissionAuditLog = z.infer<typeof insertPermissionAuditLogSchema>;

export type UserActivityLog = typeof userActivityLog.$inferSelect;

// Re-export version control schema
export * from './schema-version-control';
export type InsertUserActivityLog = z.infer<typeof insertUserActivityLogSchema>;
