# Multi-Select Feature Documentation

## Overview

The Application Interface Tracker now supports multi-select functionality across all major entity pages:
- Applications (AML)
- Interfaces (IML)
- Change Requests
- Business Processes
- Technical Processes

## Features

### 1. **Row Selection**
- Click the checkbox in any row to select/deselect that item
- Click the checkbox in the header to select/deselect all visible items
- Selected rows are highlighted with a subtle background color

### 2. **Keyboard Shortcuts**
- **Ctrl/Cmd + Click**: Toggle individual item selection
- **Shift + Click**: Select a range of items between the last selected and clicked item
- **Double-click**: View item details (existing functionality preserved)

### 3. **Bulk Action Bar**
- Appears when one or more items are selected
- Shows the count of selected items (e.g., "5 of 20 selected")
- Available actions:
  - **Edit**: Bulk edit common properties
  - **Delete**: Delete all selected items (with confirmation)
  - **Clear Selection**: Deselect all items
  - **Select All**: Select all visible items
  - **Invert Selection**: Invert the current selection

### 4. **Bulk Edit Dialog**
- Allows editing common properties across multiple items
- Shows "Mixed values" when selected items have different values
- Only enabled fields will be updated
- Preview changes before applying

### 5. **Context Menu Enhancements**
Right-click on any row to access:
- Standard actions (Edit, View, Delete, Duplicate)
- Multi-select actions:
  - "Select all with status: [status]"
  - "Select all in LOB: [LOB]"
  - Other entity-specific selection options

## Usage Examples

### Bulk Status Update
1. Select multiple applications with checkboxes
2. Click "Edit" in the bulk action bar
3. Enable the "Status" field in the bulk edit dialog
4. Select the new status (e.g., "Deprecated")
5. Click "Apply Changes"

### Bulk Delete Inactive Items
1. Use filters to show only inactive items
2. Click the header checkbox to select all
3. Click "Delete" in the bulk action bar
4. Confirm the deletion

### Select Similar Items
1. Right-click on an application with status "Active"
2. Choose "Select all with status: Active"
3. All active applications will be selected

## API Endpoints

New bulk operation endpoints have been added:

- `PUT /api/[entity]/bulk-update` - Update multiple items
- `DELETE /api/[entity]/bulk-delete` - Delete multiple items
- `POST /api/[entity]/bulk-duplicate` - Duplicate multiple items

Where `[entity]` can be:
- `applications`
- `interfaces`
- `change-requests`
- `business-processes`
- `technical-processes`

## Technical Implementation

### Frontend Components
- `useMultiSelect` hook - Manages selection state and operations
- `MultiSelectTable` - Enhanced table with checkbox column
- `BulkActionBar` - Action bar for bulk operations
- `BulkEditDialog` - Dialog for bulk property editing

### Backend Routes
- `server/routes/bulk-operations.ts` - Handles all bulk operations

## Permissions

Bulk operations respect existing permissions:
- Bulk edit requires "update" permission for the entity
- Bulk delete requires "delete" permission for the entity
- The bulk action bar only appears for users with appropriate permissions

## Safety Features

1. **Confirmation Dialogs**: All destructive operations require confirmation
2. **Transaction Support**: Bulk operations are atomic - all succeed or all fail
3. **Audit Trail**: All bulk operations are logged
4. **Validation**: Same validation rules apply to bulk operations as single operations

## Future Enhancements

- Export selected items to Excel/CSV
- Bulk status workflow transitions
- Saved selection sets
- Undo/redo for bulk operations
- Bulk tagging/categorization