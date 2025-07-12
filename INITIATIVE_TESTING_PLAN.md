# Initiative-Based Changes Testing Plan

## Overview
This document outlines the comprehensive testing plan for all initiative-based changes implemented in the Architect Studio application.

## Test Scenarios

### 1. Initiative Management
- **Create Initiative**
  - Navigate to Initiatives page
  - Click "New Initiative" 
  - Fill in name, description, target date
  - Verify initiative is created with "draft" status
  
- **Activate Initiative**
  - Select a draft initiative
  - Click "Activate"
  - Verify baseline is created from production
  - Verify status changes to "active"

### 2. Version Control for Applications
- **Checkout Application**
  - Navigate to Applications page while in initiative context
  - Right-click on an application → "Checkout"
  - Verify lock icon appears
  - Verify other users cannot checkout same item
  
- **Modify Application**
  - Edit checked-out application
  - Change fields like name, description, status
  - Save changes
  
- **Checkin Application**
  - Right-click → "Checkin"
  - Enter change reason
  - Verify lock is released
  - Verify version history shows change

### 3. Version Control for Interfaces
- **Checkout Interface**
  - Navigate to Interfaces page in initiative context
  - Checkout an interface
  - Modify interface details
  - Checkin with change reason
  
- **Create New Interface**
  - Create new interface in initiative context
  - Verify it's marked as "new" in change tracking

### 4. Version Control for Business Processes
- **Modify Business Process**
  - Checkout business process
  - Update description, LOB, or other fields
  - Checkin changes
  
### 5. Version Control for Internal Activities
- **Test Internal Activities Version Control**
  - Navigate to Internal Activities page
  - Verify checkout/checkin works
  - Verify version history tracking
  
### 6. Version Control for Technical Processes  
- **Test Technical Processes Version Control**
  - Navigate to Technical Processes page
  - Test checkout/checkin functionality
  - Verify changes are tracked in initiative

### 7. Business Process Diagram Features
- **View Initiative Changes in Diagram**
  - Open BP diagram while in initiative context
  - Verify change indicators:
    - Blue solid line = New interface
    - Orange dashed line = Modified interface  
    - Red dashed line = Deleted interface
    - Green solid line = Unchanged
  - Verify legend appears showing color meanings
  
- **Compare View**
  - Click "Compare" button (only visible in initiative context)
  - Verify side-by-side view shows:
    - Left: Production baseline
    - Right: Initiative changes with color coding
  
- **Timeline View**
  - Click "Timeline" button
  - Verify timeline shows:
    - All initiatives that modified this BP
    - Change dates and status
    - Specific changes made (interfaces, BP fields)

### 8. Impact Analysis Integration
- **View Initiative Impact**
  - Navigate to Impact Analysis
  - Select an initiative
  - Verify all changed artifacts are shown
  - Verify impact relationships are displayed

### 9. Production/Initiative View Toggle
- **Test View Toggle**
  - Click toggle in header to switch between:
    - Production view (read-only, shows baseline)
    - Initiative view (editable, shows changes)
  - Verify ViewModeIndicator shows current mode
  - Verify checkout/checkin disabled in production view

### 10. Complete Initiative Workflow
- **End-to-End Test**
  1. Create new initiative
  2. Activate initiative
  3. Checkout multiple artifacts (app, interface, BP)
  4. Make changes to each
  5. Checkin all changes
  6. View BP diagram - verify changes shown
  7. Use Compare view
  8. Check Timeline
  9. Complete initiative
  10. Verify changes merged to production

## Test Data Requirements
- At least 3 applications
- At least 5 interfaces between applications  
- At least 2 business processes with interfaces
- At least 2 internal activities
- At least 2 technical processes

## Expected Results
- All version control operations work correctly
- Changes are properly tracked in initiatives
- Visual indicators correctly show change types
- Compare and Timeline views display accurate data
- No data loss or corruption
- Proper access control (can't edit without checkout)

## Known Limitations
- Timeline view currently shows placeholder data for interface-BP relationships
- Merge to production not yet implemented (initiative completion)
- Conflict resolution for concurrent changes not implemented

## Testing Notes
- Test with multiple users to verify locking mechanism
- Test with different browser sessions
- Verify data persistence across page refreshes
- Check performance with large datasets