// Re-export all schemas from shared
export * from "@shared/schema";
export * from "@shared/schema-version-control";
export * from "@shared/schema-uml";

// Type exports for convenience
export type { InferInsertModel, InferSelectModel } from "drizzle-orm";