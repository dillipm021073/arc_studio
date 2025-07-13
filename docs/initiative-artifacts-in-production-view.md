# Initiative Artifacts in Production View

## Overview
This document describes the implementation of showing initiative artifacts (applications/interfaces) in production view, allowing users to see pending changes that will be activated when an initiative is completed.

## Problem Statement
Previously, when users created new applications or interfaces within an initiative context, these artifacts were completely invisible in the production view. This made it difficult to:
- Understand what changes are coming
- Plan for future system states
- Coordinate between teams about pending additions

## Solution
We've implemented a system that allows artifacts created or modified in initiatives to be visible in production view with clear visual distinctions.

## Implementation Details

### 1. Database Schema Changes

Added three new fields to both `applications` and `interfaces` tables:

```sql
-- Applications table
artifact_state TEXT NOT NULL DEFAULT 'active'  -- Values: 'active', 'inactive', 'pending', 'draft'
planned_activation_date TIMESTAMP              -- When pending artifact will go live
initiative_origin TEXT                         -- Initiative ID that created this artifact

-- Interfaces table (same fields)
artifact_state TEXT NOT NULL DEFAULT 'active'
planned_activation_date TIMESTAMP
initiative_origin TEXT
```

To apply these changes to your database:
```bash
psql -U your_user -d your_database -f add-artifact-state-fields.sql
```

### 2. API Enhancements

#### GET /api/applications
New query parameters:
- `includeInitiativeChanges=true` - Include artifacts from initiatives
- `initiativeId=<id>` - Specify which initiative to include

Response includes additional fields for initiative artifacts:
```json
{
  "id": 123,
  "name": "New Application",
  "artifactState": "pending",
  "versionState": "new_in_initiative",
  "initiativeOrigin": "INIT-123456",
  "hasInitiativeChanges": true,
  "plannedActivationDate": "2024-06-01T00:00:00Z"
}
```

### 3. Visual Status System

New artifact states with distinct visual indicators:

| State | Visual Style | Icon | Description |
|-------|-------------|------|-------------|
| `production` | Normal | None | Active in production |
| `pending_new` | Teal background, dashed border | 🚀 Rocket | New artifact pending activation |
| `pending_decommission` | Gray, strike-through | 🗑️ Trash | Scheduled for removal |
| `modified_in_initiative` | Blue background | ⚡ Zap | Existing artifact with changes |
| `checked_out_me` | Amber background | Git branch | Locked for editing by you |
| `checked_out_other` | Red background | 🔒 Lock | Locked by another user |

### 4. UI Components

#### Production View Toggle
A toggle switch appears in production view when an initiative is selected:
```tsx
<label className="flex items-center cursor-pointer">
  <input
    type="checkbox"
    checked={showPendingChanges}
    onChange={(e) => setShowPendingChanges(e.target.checked)}
  />
  <span>Show pending changes from {currentInitiative.name}</span>
</label>
```

#### Updated Filter Options
New filter values for artifact states:
- `pending_new` - Show only new pending artifacts
- `pending_decommission` - Show artifacts being removed

## Usage Guide

### For End Users

1. **Viewing Pending Changes**
   - Switch to production view
   - Select an initiative from the dropdown
   - Toggle "Show pending changes" to see artifacts that will be added/modified

2. **Understanding Visual Indicators**
   - Dashed borders indicate new artifacts
   - Strike-through text shows decommissioning artifacts
   - Colored backgrounds show modification status

3. **Filtering**
   - Use the version state filter to show only specific types of changes
   - Filter by "Pending New" to see only new additions

### For Developers

1. **Extending Artifact States**
   ```typescript
   // In artifact-state-utils.ts
   export type ArtifactState = 'production' | 'pending_new' | 'pending_decommission' | ...
   ```

2. **Adding New Visual Styles**
   ```typescript
   case 'your_new_state':
     return {
       rowClassName: 'bg-color-950/30 border-l-4 border-color-500',
       iconComponent: YourIcon,
       iconColor: 'text-color-400',
       badgeText: 'YOUR_BADGE',
       tooltip: 'Description of state'
     };
   ```

3. **API Integration**
   ```typescript
   // Fetch with initiative changes
   const response = await api.get('/api/applications?includeInitiativeChanges=true&initiativeId=INIT-123');
   ```

## Benefits

1. **Improved Visibility**: Teams can see the complete future state of the system
2. **Better Planning**: Understand impacts before changes are activated
3. **Clear Communication**: Visual indicators make it obvious what's changing
4. **Flexible Control**: Toggle to show/hide pending changes as needed

## Technical Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌───────────────┐
│   Frontend      │────▶│   API Server     │────▶│   Database    │
│                 │     │                  │     │               │
│ - Toggle switch │     │ - Merge baseline │     │ - applications│
│ - Visual states │     │   with versions  │     │ - interfaces  │
│ - Filtering     │     │ - Return merged  │     │ - versions    │
└─────────────────┘     │   results        │     └───────────────┘
                        └──────────────────┘
```

## Migration Notes

For existing systems:
1. Run the SQL migration to add new fields
2. Existing artifacts will default to `artifact_state='active'`
3. No data loss or breaking changes

## Future Enhancements

1. **Activation Scheduling**: Automatically activate pending artifacts on planned dates
2. **Conflict Detection**: Highlight when pending changes conflict
3. **Timeline View**: Visual timeline of when artifacts will be activated
4. **Bulk Operations**: Apply state changes to multiple artifacts at once

## Related Documentation
- [Version Control System](./version-control.md)
- [Initiative Management](./initiatives.md)
- [Interface Builder](./interface-builder.md)