import { Building2, Workflow, Activity } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Get the appropriate icon for a business process level
 * Level A: Building2 (Strategic/Enterprise level)
 * Level B: Workflow (Operational level)
 * Level C: Activity (Tactical/Implementation level)
 */
export function getProcessLevelIcon(level: string): LucideIcon {
  switch (level.toUpperCase()) {
    case 'A':
      return Building2;
    case 'B':
      return Workflow;
    case 'C':
      return Activity;
    default:
      return Activity; // Default to Activity icon for unknown levels
  }
}

/**
 * Get the icon props for consistent sizing across the application
 */
export function getProcessIconProps(className?: string) {
  return {
    className: className || "h-4 w-4",
    strokeWidth: 2
  };
}

/**
 * Get the level description for tooltips and accessibility
 */
export function getProcessLevelDescription(level: string): string {
  switch (level.toUpperCase()) {
    case 'A':
      return 'Strategic Business Process (Level A)';
    case 'B':
      return 'Operational Business Process (Level B)';
    case 'C':
      return 'Tactical Business Process (Level C)';
    default:
      return 'Business Process';
  }
}

/**
 * Sort business processes hierarchically: Level A first, then Level B with their Level C children
 */
export function sortBusinessProcessesHierarchically(
  processes: any[],
  relationships: any[]
): any[] {
  // Handle edge cases
  if (!processes || processes.length === 0) {
    return [];
  }
  
  if (!relationships || relationships.length === 0) {
    // If no relationships, just sort by level and name
    return processes.sort((a, b) => {
      // Sort by level first (A, B, C)
      if (a.level !== b.level) {
        return (a.level || '').localeCompare(b.level || '');
      }
      // Then by business process name
      return (a.businessProcess || '').localeCompare(b.businessProcess || '');
    });
  }
  
  // Create a map of parent to children
  const childrenMap = new Map<number, any[]>();
  
  relationships.forEach(rel => {
    if (!childrenMap.has(rel.parentProcessId)) {
      childrenMap.set(rel.parentProcessId, []);
    }
    const child = processes.find(p => p.id === rel.childProcessId);
    if (child) {
      childrenMap.get(rel.parentProcessId)!.push({
        ...child,
        sequenceNumber: rel.sequenceNumber,
        parentId: rel.parentProcessId
      });
    }
  });
  
  // Sort children by sequence number
  childrenMap.forEach(children => {
    children.sort((a, b) => (a.sequenceNumber || 0) - (b.sequenceNumber || 0));
  });
  
  const result: any[] = [];
  const processedIds = new Set<number>();
  
  // First, add all Level A processes
  const levelAProcesses = processes
    .filter(p => p.level === 'A')
    .sort((a, b) => a.businessProcess.localeCompare(b.businessProcess));
  
  levelAProcesses.forEach(levelA => {
    if (!processedIds.has(levelA.id)) {
      result.push({ ...levelA, indentLevel: 0 });
      processedIds.add(levelA.id);
      
      // Add Level B children of this Level A
      const levelBChildren = (childrenMap.get(levelA.id) || [])
        .filter(child => child.level === 'B');
      
      levelBChildren.forEach(levelB => {
        if (!processedIds.has(levelB.id)) {
          result.push({ ...levelB, indentLevel: 1 });
          processedIds.add(levelB.id);
          
          // Add Level C children of this Level B
          const levelCChildren = (childrenMap.get(levelB.id) || [])
            .filter(child => child.level === 'C');
          
          levelCChildren.forEach(levelC => {
            if (!processedIds.has(levelC.id)) {
              result.push({ ...levelC, indentLevel: 2 });
              processedIds.add(levelC.id);
            }
          });
        }
      });
    }
  });
  
  // Add any orphaned Level B processes (those without Level A parents)
  const orphanedLevelB = processes
    .filter(p => p.level === 'B' && !processedIds.has(p.id))
    .sort((a, b) => a.businessProcess.localeCompare(b.businessProcess));
  
  orphanedLevelB.forEach(levelB => {
    if (!processedIds.has(levelB.id)) {
      result.push({ ...levelB, indentLevel: 0 });
      processedIds.add(levelB.id);
      
      // Add Level C children
      const levelCChildren = (childrenMap.get(levelB.id) || [])
        .filter(child => child.level === 'C');
      
      levelCChildren.forEach(levelC => {
        if (!processedIds.has(levelC.id)) {
          result.push({ ...levelC, indentLevel: 1 });
          processedIds.add(levelC.id);
        }
      });
    }
  });
  
  // Add any orphaned Level C processes
  const orphanedLevelC = processes
    .filter(p => p.level === 'C' && !processedIds.has(p.id))
    .sort((a, b) => a.businessProcess.localeCompare(b.businessProcess));
  
  orphanedLevelC.forEach(levelC => {
    if (!processedIds.has(levelC.id)) {
      result.push({ ...levelC, indentLevel: 0 });
      processedIds.add(levelC.id);
    }
  });
  
  return result;
}