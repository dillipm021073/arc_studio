# Hierarchical Business Process Table View Implementation

## Overview
Implemented hierarchical sorting and visual indentation for business processes in table view to show parent-child relationships clearly. Level A processes appear first, followed by their Level B children (with their Level C children nested), making the hierarchy visually apparent.

## Implementation Date
July 12, 2025

## Changes Made

### 1. Created Hierarchical Sorting Function
**File**: `client/src/lib/business-process-utils.ts`

Added `sortBusinessProcessesHierarchically` function that:
- Sorts processes by level (A → B → C) while maintaining parent-child relationships
- Adds `indentLevel` property to each process (0 for top-level, 1 for first-level children, 2 for second-level)
- Maintains sequence numbers within each parent
- Handles orphaned processes (those without parents)

### 2. Updated Business Processes Page
**File**: `client/src/pages/business-processes.tsx`

- Added import for hierarchical sorting function
- Created `hierarchicalBPs` using `useMemo` hook that applies sorting only in table view
- Updated table rendering to use `hierarchicalBPs` instead of `filteredBPs`
- Maintained all existing functionality (search, filters, selections)

### 3. Added Visual Indentation
**File**: `client/src/pages/business-processes.tsx`

Added visual hierarchy indicators:
- Dynamic padding based on `indentLevel` (24px per level)
- Tree connector lines ("└─") for child processes
- Subtle background shading for different levels:
  - Level B children: `bg-gray-800/30`
  - Level C children: `bg-gray-800/50`
- Lighter text color for child processes

## Visual Design

### Hierarchy Display
```
Level A Process
  └─ Level B Process (child of A)
     └─ Level C Process (child of B)
     └─ Level C Process (child of B)
  └─ Level B Process (child of A)
     └─ Level C Process (child of B)
Level A Process
  └─ Level B Process (child of A)
```

### Indentation Rules
- Level A: No indentation
- Level B (child of A): 24px indentation
- Level C (child of B): 48px indentation
- Orphaned Level B: No indentation
- Orphaned Level C (child of orphaned B): 24px indentation

## Technical Details

### Algorithm
1. Create a map of parent-to-children relationships
2. Sort children by sequence number
3. Process all Level A processes alphabetically
4. For each Level A, add its Level B children in sequence
5. For each Level B, add its Level C children in sequence
6. Add orphaned Level B processes
7. Add orphaned Level C processes

### Performance
- Uses `useMemo` to prevent unnecessary recalculations
- Only applies hierarchical sorting in table view
- Tree and hierarchy views remain unchanged

## Benefits

1. **Clear Visual Hierarchy**: Users can immediately see which processes belong together
2. **Maintains Context**: Child processes appear directly under their parents
3. **Respects Sequence**: Processes maintain their defined sequence numbers
4. **Handles Edge Cases**: Orphaned processes are still displayed appropriately
5. **Non-Intrusive**: Only affects table view; other views remain unchanged

## Testing

Tested with real data showing:
- 3 Level A processes
- 21 Level B processes
- 45 Level C processes
- Multiple parent-child relationships
- Proper sequence ordering

## Future Enhancements

1. Add expand/collapse functionality for parent processes
2. Show relationship counts (e.g., "3 children")
3. Add keyboard navigation for hierarchy
4. Export hierarchical structure to Excel with indentation
5. Add visual tree lines connecting parents to children