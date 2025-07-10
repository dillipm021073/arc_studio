import { db } from "../db";
import { businessProcesses, businessProcessRelationships } from "../../shared/schema";

interface HierarchyNode {
  id: string;
  name: string;
  characteristics: {
    description?: string;
    level: string;
  };
  children?: HierarchyNode[];
}

interface GenerationOptions {
  lob: string;
  product: string;
  version: string;
  domainOwner?: string;
  itOwner?: string;
  vendorFocal?: string;
  includeDescriptions: boolean;
}

interface GenerationResult {
  summary: {
    created: number;
    levelA: number;
    levelB: number;
    levelC: number;
  };
  processIds: number[];
}

export async function generateBusinessProcessesFromHierarchy(
  hierarchyData: HierarchyNode[],
  options: GenerationOptions
): Promise<GenerationResult> {
  const processIds: number[] = [];
  const summary = {
    created: 0,
    levelA: 0,
    levelB: 0,
    levelC: 0
  };

  // Process root nodes (Level A)
  for (const rootNode of hierarchyData) {
    if (rootNode.characteristics?.level === 'A') {
      const processId = await createBusinessProcessRecursive(
        rootNode,
        null,
        options,
        processIds,
        summary,
        1
      );
    }
  }

  return { summary, processIds };
}

async function createBusinessProcessRecursive(
  node: HierarchyNode,
  parentId: number | null,
  options: GenerationOptions,
  processIds: number[],
  summary: { created: number; levelA: number; levelB: number; levelC: number },
  sequenceNumber: number
): Promise<number> {
  // Create the business process
  const [newProcess] = await db
    .insert(businessProcesses)
    .values({
      businessProcess: node.name,
      lob: options.lob,
      product: options.product,
      version: options.version || "1.0",
      level: node.characteristics.level || 'A',
      domainOwner: options.domainOwner || null,
      itOwner: options.itOwner || null,
      vendorFocal: options.vendorFocal || null,
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date()
    })
    .returning();

  processIds.push(newProcess.id);
  summary.created++;
  
  // Update level counts
  if (node.characteristics.level === 'A') summary.levelA++;
  else if (node.characteristics.level === 'B') summary.levelB++;
  else if (node.characteristics.level === 'C') summary.levelC++;

  // Create parent-child relationship if this is not a root node
  if (parentId !== null) {
    await db
      .insert(businessProcessRelationships)
      .values({
        parentProcessId: parentId,
        childProcessId: newProcess.id,
        relationshipType: 'contains',
        sequenceNumber: sequenceNumber,
        createdAt: new Date()
      });
  }

  // Process children recursively
  if (node.children && node.children.length > 0) {
    let childSequence = 1;
    for (const childNode of node.children) {
      // Only process children with valid levels according to hierarchy rules
      const currentLevel = node.characteristics.level;
      const childLevel = childNode.characteristics?.level;
      
      const isValidChild = 
        (currentLevel === 'A' && childLevel === 'B') ||
        (currentLevel === 'B' && childLevel === 'C');
      
      if (isValidChild) {
        await createBusinessProcessRecursive(
          childNode,
          newProcess.id,
          options,
          processIds,
          summary,
          childSequence * 10 // Use increments of 10 for easier reordering
        );
        childSequence++;
      }
    }
  }

  return newProcess.id;
}