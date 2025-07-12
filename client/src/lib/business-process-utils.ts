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