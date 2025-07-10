# Application Interface Tracker (AIT)

Version 1.0.0

## Overview

Application Interface Tracker (AIT) is a comprehensive enterprise solution designed to help architects, project managers, testers, and development teams track and visualize application interfaces, their relationships, and changes over time. It provides a centralized platform for managing the complexity of interconnected systems in large organizations.

## Key Features

### 🏗️ Core Components

1. **Application Master List (AML)**
   - Comprehensive application inventory
   - Track deployment types, operating systems, and uptime
   - Monitor interface capabilities (provider/consumer)
   - Manage application lifecycle and status

2. **Interface Master List (IML)**
   - Catalog all external interfaces
   - Track provider-consumer relationships
   - Version control for interfaces
   - Connectivity and testing documentation

3. **Business Process Management**
   - Link interfaces to business processes
   - Track process ownership and versions
   - Visualize interface sequences in processes
   - Domain and IT owner tracking

4. **Change Request System**
   - Full change lifecycle management
   - Impact analysis across systems
   - Status tracking with timestamps
   - Multi-level approval workflow

### 🚀 Advanced Features

- **Impact Analysis Dashboard**: Visualize the ripple effects of changes across your system landscape
- **Timeline Visualization**: Track system evolution and changes over time
- **Business Process Diagrams**: Visual flow editor for interface sequences
- **Import/Export**: Excel-based data exchange for bulk operations
- **Role-Based Views**: Tailored dashboards for different stakeholders
- **Real-time Search**: Fast filtering across all entities

## Technology Stack

- **Frontend**: React 18 with TypeScript, Tailwind CSS, Shadcn/ui
- **Backend**: Node.js with Express, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Passport.js with session management
- **Build Tools**: Vite, ESBuild
- **State Management**: TanStack Query (React Query)

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/dillipm021073/ApplicationInterfaceTracker.git
cd ApplicationInterfaceTracker
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

4. Set up the database:
```bash
npm run db:push
npm run db:seed
```

5. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

### Default Login Credentials

- **Admin User**: 
  - Username: `admin`
  - Password: `admin123`
- **Test User**: 
  - Username: `testuser`
  - Password: `test123`

## Project Structure

```
ApplicationInterfaceTracker/
├── client/               # React frontend application
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Page components
│   │   ├── contexts/     # React contexts
│   │   ├── hooks/        # Custom React hooks
│   │   └── lib/          # Utility functions
├── server/               # Express backend application
│   ├── routes.ts         # API endpoints
│   ├── storage.ts        # Database operations
│   ├── auth.ts           # Authentication logic
│   └── export-utils.ts   # Excel export utilities
├── shared/               # Shared types and schemas
│   └── schema.ts         # Database schema definitions
└── CLAUDE.md            # AI assistant instructions

```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:push` - Push schema changes to database
- `npm run db:seed` - Seed initial data
- `npm run db:seed-business` - Seed business process data
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking

## Features in Detail

### Application Management
- Track all applications in your enterprise
- Monitor deployment types (cloud/on-premise)
- Track interface capabilities
- Manage application lifecycle

### Interface Tracking
- Catalog all system interfaces
- Track provider-consumer relationships
- Version control for interface changes
- Store connectivity test procedures

### Business Process Integration
- Link interfaces to business processes
- Define interface execution sequences
- Track process ownership
- Visualize process flows

### Change Management
- Create and track change requests
- Perform impact analysis
- Track approval workflows
- Monitor implementation progress

### Impact Analysis
- Visualize system dependencies
- Identify affected components
- Plan testing requirements
- Assess change risks

## Contributing

Please read CONTRIBUTING.md for details on our code of conduct and the process for submitting pull requests.

## License

This project is proprietary software. All rights reserved.

## Support

For support, please contact the development team or raise an issue in the project repository.

## Acknowledgments

- Built with modern web technologies
- Designed for enterprise scale
- Focused on usability and performance# arc_studio
