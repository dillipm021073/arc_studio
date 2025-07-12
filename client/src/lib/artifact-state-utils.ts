import { GitBranch, Lock, Zap, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from './utils';

export interface ArtifactLock {
  lock: {
    artifactType: string;
    artifactId: number;
    lockedBy: number;
  };
  user: {
    id: number;
    username: string;
  };
}

export interface ArtifactState {
  isCheckedOut: boolean;
  isCheckedOutByMe: boolean;
  isLockedByOther: boolean;
  hasInitiativeChanges: boolean;
  hasConflicts: boolean;
  isProductionBaseline: boolean;
  lockedBy?: string;
  state: 'production' | 'checked_out_me' | 'checked_out_other' | 'initiative_changes' | 'conflicted';
}

export interface ArtifactVisuals {
  rowClassName: string;
  iconComponent: React.ComponentType<any> | null;
  iconColor: string;
  badgeText?: string;
  badgeColor: string;
  tooltip: string;
  statusText: string;
  statusColor: string;
}

/**
 * Determines the current state of an artifact based on locks and initiative context
 */
export function getArtifactState(
  artifactId: number,
  artifactType: string,
  lock: ArtifactLock | null,
  currentUserId: number | undefined,
  hasInitiativeChanges: boolean = false,
  hasConflicts: boolean = false
): ArtifactState {
  const isCheckedOut = !!lock;
  const isCheckedOutByMe = isCheckedOut && lock.lock.lockedBy === currentUserId;
  const isLockedByOther = isCheckedOut && !isCheckedOutByMe;

  // Determine primary state (priority order: conflicts > checked out > initiative changes > production)
  let state: ArtifactState['state'] = 'production';
  
  if (hasConflicts) {
    state = 'conflicted';
  } else if (isCheckedOutByMe) {
    state = 'checked_out_me';
  } else if (isLockedByOther) {
    state = 'checked_out_other';
  } else if (hasInitiativeChanges) {
    state = 'initiative_changes';
  }

  return {
    isCheckedOut,
    isCheckedOutByMe,
    isLockedByOther,
    hasInitiativeChanges,
    hasConflicts,
    isProductionBaseline: state === 'production',
    lockedBy: lock?.user?.username,
    state
  };
}

/**
 * Maps artifact state to visual styling and components
 */
export function getArtifactVisuals(state: ArtifactState): ArtifactVisuals {
  switch (state.state) {
    case 'checked_out_me':
      return {
        rowClassName: 'bg-amber-950/30 border-l-4 border-amber-500 hover:bg-amber-950/40',
        iconComponent: GitBranch,
        iconColor: 'text-amber-400',
        badgeText: 'DRAFT',
        badgeColor: 'bg-amber-900 text-amber-200 border-amber-600',
        tooltip: `Checked out by you - ready for editing`,
        statusText: 'Checked Out',
        statusColor: 'bg-amber-600 text-amber-100'
      };

    case 'checked_out_other':
      return {
        rowClassName: 'bg-red-950/30 border-l-4 border-red-500 hover:bg-red-950/40',
        iconComponent: Lock,
        iconColor: 'text-red-400',
        badgeText: 'LOCKED',
        badgeColor: 'bg-red-900 text-red-200 border-red-600',
        tooltip: `Locked by ${state.lockedBy} - cannot edit`,
        statusText: 'Locked',
        statusColor: 'bg-red-600 text-red-100'
      };

    case 'initiative_changes':
      return {
        rowClassName: 'bg-blue-950/30 border-l-4 border-blue-500 hover:bg-blue-950/40',
        iconComponent: Zap,
        iconColor: 'text-blue-400',
        badgeText: 'MODIFIED',
        badgeColor: 'bg-blue-900 text-blue-200 border-blue-600',
        tooltip: 'Has changes in initiative - not baselined',
        statusText: 'In Initiative',
        statusColor: 'bg-blue-600 text-blue-100'
      };

    case 'conflicted':
      return {
        rowClassName: 'bg-purple-950/30 border-l-4 border-purple-500 hover:bg-purple-950/40',
        iconComponent: AlertTriangle,
        iconColor: 'text-purple-400',
        badgeText: 'CONFLICT',
        badgeColor: 'bg-purple-900 text-purple-200 border-purple-600',
        tooltip: 'Has unresolved conflicts - needs attention',
        statusText: 'Conflicted',
        statusColor: 'bg-purple-600 text-purple-100'
      };

    case 'production':
    default:
      return {
        rowClassName: 'hover:bg-gray-800/50',
        iconComponent: null,
        iconColor: '',
        badgeColor: 'bg-green-900 text-green-200 border-green-600',
        tooltip: 'Production baseline',
        statusText: 'Production',
        statusColor: 'bg-green-600 text-green-100'
      };
  }
}

/**
 * Creates CSS classes for enhanced table row styling
 */
export function getRowClassName(state: ArtifactState, isSelected: boolean = false): string {
  const visuals = getArtifactVisuals(state);
  console.log('getRowClassName:', {
    state: state.state,
    visuals: visuals.rowClassName,
    isSelected
  });
  return cn(
    'cursor-pointer transition-colors duration-200',
    visuals.rowClassName,
    isSelected && 'bg-accent'
  );
}

/**
 * Gets the appropriate filter options for artifact states
 */
export function getStateFilterOptions() {
  return [
    { value: 'all', label: 'All States', count: 0 },
    { value: 'production', label: 'Production', count: 0 },
    { value: 'checked_out_me', label: 'Checked Out by Me', count: 0 },
    { value: 'checked_out_other', label: 'Locked by Others', count: 0 },
    { value: 'initiative_changes', label: 'Initiative Changes', count: 0 },
    { value: 'conflicted', label: 'Conflicted', count: 0 }
  ];
}

/**
 * Filters artifacts by state
 */
export function filterArtifactsByState(
  artifacts: any[],
  selectedState: string,
  getArtifactStateFn: (artifact: any) => ArtifactState
): any[] {
  if (selectedState === 'all') return artifacts;
  
  return artifacts.filter(artifact => {
    const state = getArtifactStateFn(artifact);
    return state.state === selectedState;
  });
}

/**
 * Counts artifacts by state for filter badges
 */
export function countArtifactsByState(
  artifacts: any[],
  getArtifactStateFn: (artifact: any) => ArtifactState
): Record<string, number> {
  const counts = {
    all: artifacts.length,
    production: 0,
    checked_out_me: 0,
    checked_out_other: 0,
    initiative_changes: 0,
    conflicted: 0
  };

  artifacts.forEach(artifact => {
    const state = getArtifactStateFn(artifact);
    counts[state.state]++;
  });

  return counts;
}