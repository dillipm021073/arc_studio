# API Testing Feature Documentation

## Overview
This document describes the comprehensive API testing capability added to the StudioArchitect Interface Builder. The feature provides a Postman-like interface for testing REST, SOAP, and GraphQL APIs with support for multiple environments, variable management, and test automation.

## Implementation Date
- **Date**: July 19, 2025
- **Commit**: fd6fe21
- **Repository**: https://github.com/dillipm021073/arc_studio

## Features Implemented

### 1. API Test Dialog Component
**File**: `client/src/components/interface-builder/api-test-dialog.tsx`

A comprehensive UI component that provides:
- Split-panel interface with request configuration on the left and response display on the right
- Support for multiple HTTP methods (GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS)
- Protocol support for HTTP, HTTPS, and SOAP
- Request configuration tabs:
  - **Params**: Query parameter management
  - **Headers**: Custom header configuration
  - **Auth**: Authentication methods (None, Basic Auth, Bearer Token, API Key)
  - **Body**: Request body with multiple content types
  - **Tests**: JavaScript-based test assertions

### 2. Environment Management
**File**: `client/src/components/interface-builder/environment-variables-dialog.tsx`

Environment management system featuring:
- Four default environments: Development (Dev), System Integration Testing (SIT), User Acceptance Testing (UAT), and Production (PROD)
- Environment-specific variables with support for:
  - String, number, and boolean types
  - Secret variables with visibility toggle
  - Variable descriptions
- Color-coded environment indicators
- Variable usage syntax: `{{variableName}}`

### 3. Collections System
Collections provide organization for API requests:
- Create, rename, and delete collections
- Save requests within collections
- Share collections with other users
- Import/Export collections as JSON files
- Automatic request counting per collection

### 4. Backend Infrastructure

#### API Routes (`server/routes/api-test.ts`)
- `GET /api/api-test/collections` - List user's collections
- `GET /api/api-test/collections/:id` - Get collection with requests
- `POST /api/api-test/collections` - Create new collection
- `PUT /api/api-test/collections/:id` - Update collection
- `DELETE /api/api-test/collections/:id` - Delete collection
- `POST /api/api-test/collections/:id/requests` - Create request
- `GET /api/api-test/requests/:id` - Get request details
- `PUT /api/api-test/requests/:id` - Update request
- `DELETE /api/api-test/requests/:id` - Delete request
- `GET /api/api-test/collections/:id/environments` - Get environments
- `GET /api/api-test/environments/:id/variables` - Get environment variables
- `POST /api/api-test/environments/:id/variables` - Create/update variable
- `DELETE /api/api-test/variables/:id` - Delete variable
- `PUT /api/api-test/collections/:id/current-environment` - Set active environment

#### Proxy Endpoint (`server/routes/interface-builder.ts`)
- `POST /api/interface-builder/test-api` - Secure proxy for API testing
- SSRF protection (disabled for localhost in development)
- 30-second timeout handling
- Support for REST and SOAP protocols

### 5. Database Schema

#### Tables Created:
1. **api_test_collections**
   - Stores collection metadata
   - Tracks ownership and sharing
   - Maintains folder structure and variables

2. **api_test_requests**
   - Stores individual API requests
   - Includes method, URL, headers, body, auth config
   - Supports pre-request and test scripts

3. **api_test_history**
   - Tracks execution history
   - Stores request/response snapshots
   - Records test results and execution metadata

4. **api_test_environments**
   - Manages environment configurations
   - Default environments: dev, sit, uat, prod
   - Color coding and sort order

5. **api_test_environment_variables**
   - Environment-specific variables
   - Support for secrets and different data types

6. **api_test_global_variables**
   - Collection-wide variables
   - Shared across all environments

### 6. Integration Points

#### Interface Builder Integration
- Added "Try HTTP/HTTPS/SOAP" button after Import Project button
- Button opens API test dialog for general API testing

#### Interface Node Context Menu
- Added "Test API" option for REST, GraphQL, SOAP, and webhook interfaces
- Pre-populates test dialog with interface endpoint and sample data
- Available through right-click context menu on interface nodes

### 7. Variable Interpolation
Variables can be used throughout requests:
- URLs: `https://{{BASE_URL}}/api/users`
- Headers: `Authorization: Bearer {{AUTH_TOKEN}}`
- Request Body: `{"apiKey": "{{API_KEY}}"}`
- Variables resolved at request time from current environment

### 8. Import/Export Functionality
Collections can be exported and imported as JSON files:
- Export includes all requests, environments, and variables
- Import creates new collection with "(Imported)" suffix
- Preserves all request configurations and test scripts
- Compatible format for sharing between users

### 9. Test Automation
JavaScript-based test scripts with familiar syntax:
```javascript
// Example tests
pm.test("Status code is 200", () => {
  pm.expect(response.status).to.equal(200);
});

pm.test("Response time is less than 500ms", () => {
  pm.expect(response.time).to.be.below(500);
});

pm.test("Response has required fields", () => {
  const data = response.data;
  pm.expect(data).to.have.property('id');
  pm.expect(data.name).to.be.a('string');
});
```

## Security Features
1. **SSRF Protection**: Blocks requests to localhost/internal IPs in production
2. **Timeout Handling**: 30-second timeout on all requests
3. **Secret Variables**: Sensitive values masked in UI
4. **Access Control**: Collections and requests scoped to user permissions

## User Workflow

### Creating and Testing APIs:
1. Click "Try HTTP/HTTPS/SOAP" button in Interface Builder
2. Create or select a collection
3. Configure request (method, URL, headers, auth, body)
4. Switch between environments using dropdown
5. Send request and view response
6. Write test assertions
7. Save request to collection

### Managing Environments:
1. Click settings icon next to environment dropdown
2. Select environment tab (Dev/SIT/UAT/PROD)
3. Add variables with key-value pairs
4. Mark sensitive values as secrets
5. Use variables in requests with {{variable}} syntax

### Importing/Exporting:
1. **Export**: Click menu icon on collection → Export Collection
2. **Import**: Click upload icon in collections header → Select JSON file

## Technical Implementation Notes

### Frontend Architecture:
- React components with TypeScript
- Shadcn/ui component library
- State management with React hooks
- Real-time variable interpolation

### Backend Architecture:
- Express.js routes with TypeScript
- PostgreSQL with Drizzle ORM
- Secure proxy implementation
- Permission-based access control

### Database Triggers:
- Automatic creation of default environments for new collections
- Cascade deletion for related data
- Timestamp management

## Migration Files
1. `0006_add_api_test_collections.sql` - Initial schema for collections, requests, and history
2. `0007_add_api_test_environments.sql` - Environment management schema with triggers

## Known Limitations
1. Test scripts use simplified assertion syntax (not full Postman compatibility)
2. No support for file uploads in requests
3. No GraphQL-specific query editor
4. Environment variables not encrypted at rest (only UI masking for secrets)

## Future Enhancements
1. Full Postman script compatibility
2. Request chaining and workflows
3. Performance testing capabilities
4. Team collaboration features
5. API documentation generation
6. Mock server functionality

## Troubleshooting

### Common Issues:
1. **"Testing against localhost is not allowed"** - This occurs in production. Use development mode for local testing.
2. **"fetch failed" errors** - Usually timeout issues. Check if target API is accessible.
3. **Variables not replacing** - Ensure environment is selected and variables are defined.

### Debug Steps:
1. Check browser console for errors
2. Verify environment variables are loaded
3. Confirm collection permissions
4. Check network tab for actual requests

## Related Files
- `/client/src/components/interface-builder/api-test-dialog.tsx` - Main UI component
- `/client/src/components/interface-builder/environment-variables-dialog.tsx` - Environment management
- `/server/routes/api-test.ts` - Backend API routes
- `/server/routes/interface-builder.ts` - Proxy endpoint (line 1222)
- `/shared/schema.ts` - Database schema definitions
- `/db/migrations/0006_add_api_test_collections.sql` - Collections migration
- `/db/migrations/0007_add_api_test_environments.sql` - Environments migration

## Commands
- `npm run dev` - Start development server
- `npm run db:push` - Apply schema changes
- `npm run check` - TypeScript checking

---

## Summary
This implementation provides a comprehensive API testing solution integrated directly into the StudioArchitect Interface Builder. It combines the familiar interface of tools like Postman with the specific needs of the application, allowing users to test their configured interfaces without leaving the platform. The feature supports modern API testing requirements including environment management, variable interpolation, and basic test automation, making it a valuable addition to the development workflow.