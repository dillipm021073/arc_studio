# Version Control System Test Guide

## Overview
The Architect Studio now includes a comprehensive enterprise-grade version control system that enables multi-user collaboration with initiative-based change management, conflict detection, and audit trails.

## Key Features Implemented

### 1. Initiative-Based Version Control
- **Initiatives** act like Git branches for grouping related changes
- Each initiative has its own isolated workspace
- Changes are tracked at the artifact level (applications, interfaces, business processes)
- Production baseline remains protected until changes are approved and deployed

### 2. Conflict Detection & Resolution
- **Automatic conflict detection** when baseline changes while you're working
- **Smart merge strategies** for different field types:
  - Auto-merge for timestamps and descriptions
  - Version increment strategies
  - State machine resolution for status fields
- **Risk assessment** with severity scoring
- **Dependency impact analysis** to understand ripple effects

### 3. Audit Trail & History
- Complete audit trail of all changes
- Version comparison with field-by-field diffs
- Timeline view of changes
- User activity tracking

### 4. UI Components
- **Initiative Switcher** in the sidebar for quick context switching
- **Initiative Management** page for overview and administration
- **Conflict Resolution Dialog** with visual diff and merge options
- **Version Badges** showing modification status
- **Audit Trail View** with filtering and search

## Testing Scenarios

### Scenario 1: Basic Initiative Workflow
1. **Login** with default credentials:
   - Admin: `admin` / `admin123`
   - Test User: `testuser` / `test123`

2. **Create an Initiative**:
   - Click the initiative switcher in the sidebar
   - Select "Create new initiative"
   - Name: "Q1 2024 Integration Updates"
   - Priority: High
   - Add business justification

3. **Make Changes**:
   - Go to Applications page
   - Edit an application (e.g., change status, update description)
   - Notice the version badge changes
   - Changes are isolated to your initiative

4. **Switch Views**:
   - Use the initiative switcher to go back to "Production Baseline"
   - Notice your changes are not visible
   - Switch back to your initiative to see changes

### Scenario 2: Conflict Detection
1. **Setup** (requires two browser sessions):
   - User A: Create initiative "Feature A"
   - User B: Create initiative "Feature B"

2. **Create Conflict**:
   - Both users edit the same application
   - User A: Change status to "maintenance"
   - User B: Change status to "deprecated"
   - User A: Complete and baseline their initiative

3. **Detect Conflict**:
   - User B: Go to Initiatives page
   - View their initiative
   - See conflict detected with risk score
   - Open conflict resolution dialog

4. **Resolve Conflict**:
   - Review the three-way diff (original, baseline, initiative)
   - Choose resolution strategy:
     - Auto-merge (if available)
     - Accept baseline
     - Keep initiative changes
     - Manual merge
   - Add resolution notes
   - Complete resolution

### Scenario 3: Dependency Impact Analysis
1. **Setup**:
   - Create initiative "Interface Modernization"
   - Edit an interface (e.g., change protocol from REST to GraphQL)

2. **View Impact**:
   - Go to initiative detail page
   - Check impact analysis
   - See affected applications (consumers/providers)
   - Review risk assessment

3. **Make Informed Decision**:
   - Based on impact, decide whether to proceed
   - Add comments for team review
   - Coordinate with affected teams

### Scenario 4: Audit Trail Review
1. **Make Multiple Changes**:
   - Create initiative
   - Edit several artifacts
   - Add comments
   - Resolve conflicts

2. **Review Audit Trail**:
   - Go to any artifact page
   - View audit trail section
   - Filter by user, date, or action type
   - Compare versions side-by-side

3. **Version History**:
   - Click "Compare" on any audit entry
   - See detailed field-by-field changes
   - Understand who made what changes when

### Scenario 5: Multi-User Collaboration
1. **Team Setup**:
   - Lead creates initiative "System Upgrade"
   - Adds team members as participants
   - Assigns roles (architect, tester, reviewer)

2. **Parallel Work**:
   - Team members work on different artifacts
   - Use comments for communication
   - Track progress via audit trail

3. **Review & Approval**:
   - Lead reviews all changes
   - Resolves any conflicts
   - Completes initiative to baseline

## API Testing

### Get All Initiatives
```bash
curl -X GET http://localhost:3000/api/initiatives \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE"
```

### Create Initiative
```bash
curl -X POST http://localhost:3000/api/initiatives \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE" \
  -d '{
    "name": "API Test Initiative",
    "description": "Testing via API",
    "priority": "medium"
  }'
```

### Checkout Artifact
```bash
curl -X POST http://localhost:3000/api/initiatives/INIT-XXX/checkout \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE" \
  -d '{
    "artifactType": "application",
    "artifactId": 1
  }'
```

### Detect Conflicts
```bash
curl -X POST http://localhost:3000/api/initiatives/INIT-XXX/detect-conflicts \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE"
```

### Get Audit Trail
```bash
curl -X GET "http://localhost:3000/api/audit/trail?artifactType=application&limit=20" \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE"
```

## Troubleshooting

### Common Issues

1. **"No conflicts detected" when you expect conflicts**:
   - Ensure the baseline was actually changed after your initiative started
   - Check that you're editing the same fields
   - Verify both changes are in different initiatives

2. **"Cannot baseline initiative with unresolved conflicts"**:
   - Go to the initiative page
   - Review all pending conflicts
   - Resolve each conflict before completing

3. **"Artifact is locked by another initiative"**:
   - Someone else is editing this artifact
   - Wait for them to complete or cancel their changes
   - Or work in a different initiative

### Database Reset
If needed, you can reset the version control tables:
```sql
-- Clear version control data (careful!)
DELETE FROM version_conflicts;
DELETE FROM artifact_versions WHERE initiative_id IS NOT NULL;
DELETE FROM initiative_participants;
DELETE FROM initiatives;
```

## Best Practices

1. **Initiative Naming**: Use descriptive names that indicate the purpose
   - Good: "Q1 2024 Security Updates", "Customer Portal Integration"
   - Bad: "Changes", "Test 1"

2. **Conflict Resolution**: 
   - Always review dependency impacts before resolving
   - Add meaningful resolution notes
   - Coordinate with affected teams

3. **Change Management**:
   - Group related changes in one initiative
   - Complete initiatives promptly to avoid conflicts
   - Use comments to communicate with team

4. **Testing Changes**:
   - Always test in initiative before baselining
   - Review audit trail before completing
   - Verify no unintended changes

## Next Steps

1. **Role-Based Permissions**: Restrict who can create/complete initiatives
2. **Approval Workflows**: Multi-level approval before baselining
3. **Automated Testing**: Run tests when conflicts are detected
4. **Change Notifications**: Alert users when their artifacts are modified
5. **Rollback Capabilities**: Undo baselined changes if issues found