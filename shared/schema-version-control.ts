import { pgTable, text, serial, integer, boolean, timestamp, jsonb, decimal, index, primaryKey, foreignKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { applications, interfaces, businessProcesses, users } from "./schema";

// Initiative Management - Core table for managing business initiatives
export const initiatives = pgTable("initiatives", {
  id: serial("id").primaryKey(),
  initiativeId: text("initiative_id").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  businessJustification: text("business_justification"),
  status: text("status").notNull().default("draft"), // draft, active, review, completed, cancelled
  priority: text("priority").default("medium"), // low, medium, high, critical
  startDate: timestamp("start_date").notNull().defaultNow(),
  targetCompletionDate: timestamp("target_completion_date"),
  actualCompletionDate: timestamp("actual_completion_date"),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedBy: integer("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow(),
  metadata: jsonb("metadata"), // Additional flexible data
}, (table) => ({
  statusIdx: index("idx_initiatives_status").on(table.status),
  createdByIdx: index("idx_initiatives_created_by").on(table.createdBy),
}));

// Artifact Versions - Stores all versions of all artifact types
export const artifactVersions = pgTable("artifact_versions", {
  id: serial("id").primaryKey(),
  artifactType: text("artifact_type").notNull(), // 'application', 'interface', 'business_process', 'internal_process', 'technical_process'
  artifactId: integer("artifact_id").notNull(),
  versionNumber: integer("version_number").notNull(),
  initiativeId: text("initiative_id").references(() => initiatives.initiativeId),
  isBaseline: boolean("is_baseline").default(false),
  baselineDate: timestamp("baseline_date"),
  baselinedBy: integer("baselined_by").references(() => users.id),
  artifactData: jsonb("artifact_data").notNull(), // Complete artifact state
  changedFields: jsonb("changed_fields"), // List of fields that changed from previous version
  changeType: text("change_type"), // 'create', 'update', 'delete'
  changeReason: text("change_reason"),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedBy: integer("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueVersion: index("idx_unique_artifact_version").on(table.artifactType, table.artifactId, table.versionNumber),
  baselineIdx: index("idx_artifact_versions_baseline").on(table.isBaseline),
  initiativeIdx: index("idx_artifact_versions_initiative").on(table.initiativeId),
  artifactIdx: index("idx_artifact_versions_artifact").on(table.artifactType, table.artifactId),
}));

// Version Conflicts - Tracks conflicts between initiatives
export const versionConflicts = pgTable("version_conflicts", {
  id: serial("id").primaryKey(),
  initiativeId: text("initiative_id").notNull().references(() => initiatives.initiativeId),
  artifactType: text("artifact_type").notNull(),
  artifactId: integer("artifact_id").notNull(),
  baselineVersionId: integer("baseline_version_id").notNull().references(() => artifactVersions.id),
  initiativeVersionId: integer("initiative_version_id").notNull().references(() => artifactVersions.id),
  conflictingVersionId: integer("conflicting_version_id").references(() => artifactVersions.id),
  conflictingFields: jsonb("conflicting_fields").notNull(), // Array of field names with conflicts
  conflictDetails: jsonb("conflict_details"), // Detailed comparison of conflicting values
  resolutionStatus: text("resolution_status").default("pending"), // pending, resolved, ignored, escalated
  resolutionStrategy: text("resolution_strategy"), // 'accept_baseline', 'keep_initiative', 'manual_merge', 'custom'
  resolvedData: jsonb("resolved_data"), // Final resolved artifact data
  resolvedBy: integer("resolved_by").references(() => users.id),
  resolvedAt: timestamp("resolved_at"),
  resolutionNotes: text("resolution_notes"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  initiativeIdx: index("idx_conflicts_initiative").on(table.initiativeId),
  statusIdx: index("idx_conflicts_status").on(table.resolutionStatus),
}));

// Initiative Participants - Team members working on an initiative
export const initiativeParticipants = pgTable("initiative_participants", {
  id: serial("id").primaryKey(),
  initiativeId: text("initiative_id").notNull().references(() => initiatives.initiativeId),
  userId: integer("user_id").notNull().references(() => users.id),
  role: text("role").notNull(), // 'lead', 'architect', 'project_manager', 'tester', 'reviewer', 'viewer'
  permissions: jsonb("permissions"), // Specific permissions within the initiative
  joinedAt: timestamp("joined_at").defaultNow(),
  leftAt: timestamp("left_at"),
  addedBy: integer("added_by").references(() => users.id),
}, (table) => ({
  uniqueParticipant: index("idx_unique_participant").on(table.initiativeId, table.userId),
  userIdx: index("idx_participants_user").on(table.userId),
}));

// Artifact Locks - Prevents concurrent editing
export const artifactLocks = pgTable("artifact_locks", {
  id: serial("id").primaryKey(),
  artifactType: text("artifact_type").notNull(),
  artifactId: integer("artifact_id").notNull(),
  initiativeId: text("initiative_id").notNull().references(() => initiatives.initiativeId),
  lockedBy: integer("locked_by").notNull().references(() => users.id),
  lockedAt: timestamp("locked_at").defaultNow(),
  lockExpiry: timestamp("lock_expiry"), // Auto-release after timeout
  lockReason: text("lock_reason"),
}, (table) => ({
  uniqueLock: index("idx_unique_lock").on(table.artifactType, table.artifactId, table.initiativeId),
  expiryIdx: index("idx_locks_expiry").on(table.lockExpiry),
}));

// Version Dependencies - Track dependencies between artifacts
export const versionDependencies = pgTable("version_dependencies", {
  id: serial("id").primaryKey(),
  fromVersionId: integer("from_version_id").notNull().references(() => artifactVersions.id),
  toVersionId: integer("to_version_id").notNull().references(() => artifactVersions.id),
  dependencyType: text("dependency_type").notNull(), // 'requires', 'impacts', 'related_to'
  dependencyStrength: text("dependency_strength"), // 'strong', 'weak', 'optional'
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  fromIdx: index("idx_dependencies_from").on(table.fromVersionId),
  toIdx: index("idx_dependencies_to").on(table.toVersionId),
}));

// Initiative Comments - Discussion and notes on initiatives
export const initiativeComments = pgTable("initiative_comments", {
  id: serial("id").primaryKey(),
  initiativeId: text("initiative_id").notNull().references(() => initiatives.initiativeId),
  artifactType: text("artifact_type"),
  artifactId: integer("artifact_id"),
  versionId: integer("version_id").references(() => artifactVersions.id),
  comment: text("comment").notNull(),
  commentType: text("comment_type"), // 'general', 'review', 'conflict', 'resolution'
  userId: integer("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  parentCommentId: integer("parent_comment_id"),
}, (table) => ({
  initiativeIdx: index("idx_comments_initiative").on(table.initiativeId),
  versionIdx: index("idx_comments_version").on(table.versionId),
}));

// Baseline History - Track baseline changes over time
export const baselineHistory = pgTable("baseline_history", {
  id: serial("id").primaryKey(),
  artifactType: text("artifact_type").notNull(),
  artifactId: integer("artifact_id").notNull(),
  fromVersionId: integer("from_version_id").references(() => artifactVersions.id),
  toVersionId: integer("to_version_id").notNull().references(() => artifactVersions.id),
  initiativeId: text("initiative_id").references(() => initiatives.initiativeId),
  baselinedAt: timestamp("baselined_at").defaultNow(),
  baselinedBy: integer("baselined_by").notNull().references(() => users.id),
  baselineReason: text("baseline_reason"),
  rollbackOf: integer("rollback_of"), // If this baseline is a rollback
}, (table) => ({
  artifactIdx: index("idx_baseline_history_artifact").on(table.artifactType, table.artifactId),
  dateIdx: index("idx_baseline_history_date").on(table.baselinedAt),
}));

// Initiative Approval Workflow
export const initiativeApprovals = pgTable("initiative_approvals", {
  id: serial("id").primaryKey(),
  initiativeId: text("initiative_id").notNull().references(() => initiatives.initiativeId),
  approvalLevel: integer("approval_level").notNull(), // 1, 2, 3 etc for multi-level approval
  approverRole: text("approver_role").notNull(), // 'architect_lead', 'business_owner', 'it_director'
  approverId: integer("approver_id").references(() => users.id),
  status: text("status").notNull().default("pending"), // pending, approved, rejected, delegated
  decision: text("decision"),
  decisionNotes: text("decision_notes"),
  decidedAt: timestamp("decided_at"),
  delegatedTo: integer("delegated_to").references(() => users.id),
  dueDate: timestamp("due_date"),
}, (table) => ({
  initiativeIdx: index("idx_approvals_initiative").on(table.initiativeId),
  statusIdx: index("idx_approvals_status").on(table.status),
}));

// Create Zod schemas for validation
export const insertInitiativeSchema = createInsertSchema(initiatives);
export const insertArtifactVersionSchema = createInsertSchema(artifactVersions);
export const insertVersionConflictSchema = createInsertSchema(versionConflicts);
export const insertInitiativeParticipantSchema = createInsertSchema(initiativeParticipants);
export const insertArtifactLockSchema = createInsertSchema(artifactLocks);
export const insertVersionDependencySchema = createInsertSchema(versionDependencies);
export const insertInitiativeCommentSchema = createInsertSchema(initiativeComments);
export const insertBaselineHistorySchema = createInsertSchema(baselineHistory);
export const insertInitiativeApprovalSchema = createInsertSchema(initiativeApprovals);

// Export types
export type Initiative = typeof initiatives.$inferSelect;
export type InsertInitiative = z.infer<typeof insertInitiativeSchema>;

export type ArtifactVersion = typeof artifactVersions.$inferSelect;
export type InsertArtifactVersion = z.infer<typeof insertArtifactVersionSchema>;

export type VersionConflict = typeof versionConflicts.$inferSelect;
export type InsertVersionConflict = z.infer<typeof insertVersionConflictSchema>;

export type InitiativeParticipant = typeof initiativeParticipants.$inferSelect;
export type InsertInitiativeParticipant = z.infer<typeof insertInitiativeParticipantSchema>;

export type ArtifactLock = typeof artifactLocks.$inferSelect;
export type InsertArtifactLock = z.infer<typeof insertArtifactLockSchema>;

export type VersionDependency = typeof versionDependencies.$inferSelect;
export type InsertVersionDependency = z.infer<typeof insertVersionDependencySchema>;

export type InitiativeComment = typeof initiativeComments.$inferSelect;
export type InsertInitiativeComment = z.infer<typeof insertInitiativeCommentSchema>;

export type BaselineHistory = typeof baselineHistory.$inferSelect;
export type InsertBaselineHistory = z.infer<typeof insertBaselineHistorySchema>;

export type InitiativeApproval = typeof initiativeApprovals.$inferSelect;
export type InsertInitiativeApproval = z.infer<typeof insertInitiativeApprovalSchema>;