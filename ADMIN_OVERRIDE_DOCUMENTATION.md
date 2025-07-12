# Admin Override System Documentation

## Overview
The Admin Override System provides administrative capabilities to bypass normal version control restrictions and manage artifact checkouts across the entire system. This allows administrators to resolve blocked workflows, handle emergencies, and maintain system operations.

## Admin Requirements
- User must have `role: 'admin'` in the system
- Access is controlled by the `requireAdmin` middleware
- Default admin credentials: `admin` / `admin123`

## Available Admin Override Endpoints

### 1. Force Cancel Any Checkout
**Endpoint**: `POST /api/version-control/admin/cancel-checkout`

**Purpose**: Cancel any user's checkout and discard their uncommitted changes

**Request Body**:
```json
{
  "artifactType": "application|interface|business_process|technical_process|internal_process",
  "artifactId": 123,
  "initiativeId": "INIT-001", 
  "reason": "Emergency unlock required"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Admin override: Checkout cancelled for John Doe (johndoe)",
  "details": {
    "artifactType": "application",
    "artifactId": 123,
    "initiativeId": "INIT-001",
    "originalUser": {
      "id": 5,
      "name": "John Doe", 
      "username": "johndoe"
    },
    "reason": "Emergency unlock required"
  }
}
```

### 2. Force Checkout Any Artifact  
**Endpoint**: `POST /api/version-control/admin/force-checkout`

**Purpose**: Override any existing locks and checkout an artifact as admin

**Request Body**:
```json
{
  "artifactType": "application",
  "artifactId": 123,
  "initiativeId": "INIT-002",
  "reason": "Critical bug fix required"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Admin force checkout successful",
  "lock": { /* lock details */ },
  "version": { /* version details */ },
  "overriddenUsers": [
    {
      "id": 5,
      "name": "John Doe",
      "username": "johndoe", 
      "initiativeId": "INIT-001"
    }
  ],
  "details": {
    "reason": "Critical bug fix required",
    "overriddenCheckouts": 1
  }
}
```

### 3. Force Checkin Any Artifact
**Endpoint**: `POST /api/version-control/admin/force-checkin`

**Purpose**: Force checkin changes to any artifact, even if locked by another user

**Request Body**:
```json
{
  "artifactType": "application",
  "artifactId": 123,
  "initiativeId": "INIT-002",
  "changes": {
    "name": "Updated Application Name",
    "description": "Emergency fix applied"
  },
  "changeDescription": "Emergency security patch",
  "reason": "Critical security vulnerability fix"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Admin force checkin successful",
  "version": { /* version details */ },
  "details": {
    "reason": "Critical security vulnerability fix",
    "originalUser": {
      "id": 5,
      "name": "John Doe",
      "username": "johndoe"
    },
    "adminOverride": true
  }
}
```

### 4. View All System Locks
**Endpoint**: `GET /api/version-control/admin/all-locks`

**Purpose**: Get overview of all active locks across the system

**Response**:
```json
{
  "locks": [
    {
      "lock": {
        "id": 1,
        "artifactType": "application",
        "artifactId": 123,
        "initiativeId": "INIT-001",
        "lockedBy": 5,
        "lockExpiry": "2024-01-15T10:30:00Z",
        "lockReason": "Feature development"
      },
      "user": {
        "id": 5,
        "name": "John Doe",
        "username": "johndoe",
        "email": "john.doe@company.com"
      }
    }
  ],
  "count": 1
}
```

### 5. Release Any Lock by ID
**Endpoint**: `DELETE /api/version-control/admin/locks/{lockId}`

**Purpose**: Release any specific lock by its ID

**Request Body**:
```json
{
  "reason": "Lock expired, user unavailable"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Admin override: Lock released successfully",
  "details": {
    "lockId": 1,
    "artifactType": "application", 
    "artifactId": 123,
    "initiativeId": "INIT-001",
    "originalUser": {
      "id": 5,
      "name": "John Doe",
      "username": "johndoe"
    },
    "reason": "Lock expired, user unavailable"
  }
}
```

## Admin UI Interface

### Location
The Admin Override Panel is located in **Settings → Admin Controls** tab (only visible to admin users).

### Features
1. **Current Locks Overview**
   - Table showing all active locks system-wide
   - User information, expiry times, artifact details
   - Individual lock release buttons

2. **Force Cancel Checkout Form**
   - Artifact type dropdown
   - Artifact ID input
   - Initiative ID input  
   - Reason text area
   - Cancel button

3. **Force Checkout Form**
   - Artifact type dropdown
   - Artifact ID input
   - Initiative ID input
   - Reason text area
   - Checkout button

4. **Administrative Actions**
   - Real-time lock refresh
   - Detailed success/error messages
   - Audit trail of admin actions

## Security Features

### Authentication & Authorization
- **requireAdmin middleware**: Validates user has admin role
- **Session-based authentication**: Uses existing auth system
- **Role verification**: Checks both legacy `role` field and RBAC system

### Audit Trail
- All admin override actions are logged
- Tracks original user information
- Records reasons for override actions  
- Maintains change history with admin attribution

### Data Protection
- Original user context preserved in responses
- Change attribution maintained (shows admin override)
- Locks are cleanly removed to prevent orphaned state

## Use Cases

### Emergency Scenarios
1. **User Unavailable**: Release locks when users are unavailable and work is blocked
2. **System Issues**: Force checkout/checkin during system maintenance
3. **Critical Bugs**: Override locks for urgent security/bug fixes
4. **Process Recovery**: Resolve workflow deadlocks

### Administrative Tasks
1. **Cleanup Operations**: Remove stale or expired locks
2. **System Maintenance**: Prepare artifacts for bulk operations
3. **Conflict Resolution**: Resolve complex initiative conflicts
4. **Data Migration**: Force state changes during migrations

## Best Practices

### When to Use Admin Override
- ✅ User is unavailable and work is urgently blocked
- ✅ System emergency requiring immediate access
- ✅ Resolving orphaned or corrupted locks
- ✅ Critical security patches
- ❌ Convenience or impatience
- ❌ Normal workflow acceleration
- ❌ Bypassing proper review processes

### Required Documentation
1. **Always provide reason**: Explain why override is necessary
2. **Document affected users**: Note who was impacted
3. **Communicate changes**: Inform affected teams
4. **Follow up**: Ensure users can resume work properly

### Safety Checks
1. **Verify necessity**: Confirm override is truly required
2. **Check alternatives**: Consider less disruptive options
3. **Backup important work**: Preserve user changes when possible
4. **Test after override**: Ensure system state is correct

## Error Handling

### Common Errors
- `401 Unauthorized`: User not logged in
- `403 Forbidden`: User lacks admin privileges  
- `404 Not Found`: Artifact or lock doesn't exist
- `400 Bad Request`: Missing required parameters

### Error Response Format
```json
{
  "error": "Detailed error message",
  "code": "ERROR_CODE", 
  "details": { /* additional context */ }
}
```

## Monitoring & Observability

### Logging
All admin override actions generate audit logs with:
- Admin user ID and username
- Action type and parameters
- Original user context
- Timestamp and reason
- Success/failure status

### Metrics
Track admin override usage:
- Frequency of override operations
- Most common override reasons
- Impact on user workflows
- System recovery times

## Integration Points

### Database Tables
- `artifactLocks`: Lock management
- `artifactVersions`: Version control
- `users`: User information lookup
- `userActivityLog`: Audit trail (if enabled)

### Services
- `VersionControlService`: Core version control logic
- `DependencyTrackingService`: Impact analysis
- Authentication system: Role verification

### UI Components
- `AdminOverridePanel`: Main admin interface
- Settings page integration
- Toast notifications for feedback

This admin override system provides necessary emergency capabilities while maintaining security, auditability, and user context preservation.