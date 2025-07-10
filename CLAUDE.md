# Application Interface Tracker - Requirements

## Overview
This is a smart intelligent product designed to help architects, project managers, testers, and teams track and visualize application interfaces, their relationships, and changes over time.

## Core Components

### AML (Application Master List)
A comprehensive list of applications with the following properties:
- **name**: Application name
- **description**: Application description
- **OS**: Operating system
- **deployment**: cloud/on-premise
- **uptime**: Application uptime percentage
- **purpose**: Business purpose of the application
- **provides_ext_interface**: Boolean - whether it provides external interfaces
- **prov_interface_type**: Type of interface provided
- **consumes_ext_interfaces**: Boolean - whether it consumes external interfaces
- **cons_interface_type**: Type of interface consumed
- **status**: Application status (active, inactive, deprecated, etc.)
- **firstActiveDate**: When the application was first activated
- **lastChangeDate**: Last modification date

### IML (Interface Master List)
A list of external interfaces with:
- **provider_application_name**: Name of the provider application
- **consumer_application_name**: Name of the consumer application
- **imlNumber**: Unique IML identifier
- **interfaceType**: Type of interface (REST, SOAP, etc.)
- **version**: IML version
- **lastChangeDate**: Last IML change date
- **businessProcessName**: Associated business process
- **customerFocal**: Customer point of contact
- **providerOwner**: Provider owner
- **consumerOwner**: Consumer owner
- **status**: IML status

### Business Processes (BPs)
Business processes that use IMLs:
- **businessProcess**: Process name
- **LOB**: Line of Business
- **product**: Product name
- **version**: Process version
- **domainOwner**: Domain owner
- **itOwner**: IT owner
- **vendorFocal**: Vendor point of contact

### Change Requests (CRs)
Track all proposed changes with:
- **CR details**: Reason, benefit, status lifecycle
- **Status tracking**: Draft, submitted, approved, in-progress, completed
- **Date tracking**: Status change dates
- **Impact analysis**: List of systems (AMLs) impacted and IMLs impacted
- **Testing requirements**: What needs to be tested

## Key Features

### 1. Change Management
- Track all proposed changes through CRs/Releases
- Status lifecycle management with date tracking
- Capture reasons for change and benefits
- Track impacted systems and interfaces

### 2. Interface Relationships
- IMLs are used by BPs with specific sequence numbers
- Same IML can be used by multiple applications
- Consumer-specific descriptions and responses

### 3. Connectivity Testing
- Each IML provider must provide sample code/steps for:
  - Connectivity testing
  - Interface testing

### 4. Timeline Visualization
- View AMLs and IMLs status over time
- Show what has changed and what remains unchanged
- Present information based on CRs within a specific period

### 5. Impact Analysis Views
- **Architect View**: Overall system impacts
- **Project Manager View**: Timeline or Release-based impacts
- **Tester View**: List of changes to be tested
- **Team View**: All proposed changes and their status

### 6. IML Diagram Editor
- Use for editor function how it is implemented in /mnt/c/new_portfolio/WSM and you are allowed to read all files and sub directories to adopt and reuse
- Draw and present IML diagrams for specific Business Processes
- Allow users to change flow positions
- Add comments and annotations
- Save diagrams to database
- Consumer-specific views and descriptions

## Technical Implementation Notes

### Database Schema Updates Needed:
1. Add Business Process table
2. Add IML-BP relationship table with sequence numbers
3. Add sample code/test steps fields to IML table
4. Add version tracking for IMLs
5. Add diagram storage for IML visualizations
6. Update CR tables to track impacted systems and interfaces

### UI Components Needed:
1. Business Process management pages
2. IML diagram editor (flow diagram tool)
3. Enhanced timeline view with filtering
4. Impact analysis dashboard with role-based views
5. Connectivity test documentation viewer

### API Endpoints Needed:
1. Business Process CRUD operations
2. IML-BP relationship management
3. Diagram save/load functionality
4. Enhanced impact analysis queries
5. Timeline data with CR-based filtering

## Commands to Run
- `npm run dev` - Start development server
- `npm run db:push` - Push schema changes to database
- `npm run db:seed` - Seed initial data
- `npm run lint` - Run linting
- `npm run typecheck` - Run type checking

## Default Users
- Admin: username: `admin`, password: `admin123`
- Test User: username: `testuser`, password: `test123`
