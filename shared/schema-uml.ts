import { pgTable, serial, text, timestamp, integer, jsonb, pgEnum, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./schema";

// Enum for diagram types
export const diagramTypeEnum = pgEnum("diagram_type", [
  "sequence",
  "activity",
  "class",
  "usecase",
  "component",
  "state",
  "deployment",
  "object",
  "package",
  "timing",
  "custom"
]);

// UML Folders table
export const umlFolders = pgTable("uml_folders", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  parentId: integer("parent_id"),
  path: text("path").notNull(), // Materialized path for efficient queries
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// UML Diagrams table
export const umlDiagrams = pgTable("uml_diagrams", {
  id: serial("id").primaryKey(),
  folderId: integer("folder_id").notNull().references(() => umlFolders.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  content: text("content").notNull(), // PlantUML text content
  diagramType: diagramTypeEnum("diagram_type").notNull().default("sequence"),
  renderedSvg: text("rendered_svg"), // Cached SVG rendering
  renderedPng: text("rendered_png"), // Cached PNG as base64
  metadata: jsonb("metadata"), // Additional metadata (size, actors, etc.)
  version: integer("version").default(1),
  isPublic: boolean("is_public").default(false),
  createdBy: integer("created_by").notNull().references(() => users.id),
  updatedBy: integer("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Relations
export const umlFoldersRelations = relations(umlFolders, ({ one, many }) => ({
  parent: one(umlFolders, {
    fields: [umlFolders.parentId],
    references: [umlFolders.id],
    relationName: "parentChild"
  }),
  children: many(umlFolders, { relationName: "parentChild" }),
  diagrams: many(umlDiagrams),
  creator: one(users, {
    fields: [umlFolders.createdBy],
    references: [users.id]
  })
}));

export const umlDiagramsRelations = relations(umlDiagrams, ({ one }) => ({
  folder: one(umlFolders, {
    fields: [umlDiagrams.folderId],
    references: [umlFolders.id]
  }),
  creator: one(users, {
    fields: [umlDiagrams.createdBy],
    references: [users.id]
  }),
  updater: one(users, {
    fields: [umlDiagrams.updatedBy],
    references: [users.id]
  })
}));

// Type exports
export type UmlFolder = typeof umlFolders.$inferSelect;
export type NewUmlFolder = typeof umlFolders.$inferInsert;
export type UmlDiagram = typeof umlDiagrams.$inferSelect;
export type NewUmlDiagram = typeof umlDiagrams.$inferInsert;