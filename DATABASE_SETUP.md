# Database Setup Guide

## Quick Start

For a complete database setup from scratch, run:

```bash
npm run db:setup
```

This command will:
1. Generate migrations from all schema files
2. Push the schema to create all tables
3. Seed default users (admin and testuser)
4. Seed default API test environments (Development, Staging, Production)

## Manual Setup Steps

If you prefer to run steps manually:

### 1. Create/Update Database Tables
```bash
npm run db:push
```
This creates all tables based on the schema files:
- `shared/schema.ts` - Core application tables
- `shared/schema-version-control.ts` - Version control and initiative tables  
- `shared/schema-uml.ts` - UML diagram tables

### 2. Seed Database
```bash
# Basic seed (users and RBAC only)
npm run db:seed

# Or use safe seed that checks tables first
npm run db:safe-seed

# Safe seed with business data
npm run db:safe-seed --business

# Safe seed with comprehensive test data
npm run db:safe-seed --comprehensive
```

## Available Commands

- `npm run db:setup` - Complete database setup (recommended for new installations)
- `npm run db:push` - Push schema changes to database
- `npm run db:generate` - Generate migration files
- `npm run db:migrate` - Run migrations
- `npm run db:seed` - Basic seed (users and RBAC)
- `npm run db:seed-environments` - Seed default API test environments
- `npm run db:safe-seed` - Check tables before seeding (includes environments)
- `npm run db:seed-business` - Seed business data
- `npm run db:seed-comprehensive` - Seed comprehensive test data
- `npm run db:clean-reseed` - Clean all data except users and reseed

## Default Data

After seeding, the following data is available:

### Users
- **Admin**: username: `admin`, password: `admin123`
- **Test User**: username: `testuser`, password: `test123`

### API Test Environments
- **Development**: Base URL: `http://localhost:3000/api`
- **Staging**: Base URL: `https://staging-api.example.com`
- **Production**: Base URL: `https://api.example.com`

Each environment includes default variables like `API_BASE_URL` and `AUTH_TOKEN`.

## Troubleshooting

### Missing Tables Error
If you get errors about missing tables, run:
```bash
npm run db:push
```

### Connection Error
Ensure your `.env` file has the correct DATABASE_URL:
```
DATABASE_URL=postgresql://username:password@localhost:5432/your_database_name
```

### Schema Changes Not Reflected
After modifying schema files, always run:
```bash
npm run db:push
```

## Schema Files

The application uses three schema files:
1. **shared/schema.ts** - Core tables (applications, interfaces, business processes, etc.)
2. **shared/schema-version-control.ts** - Version control and initiative management
3. **shared/schema-uml.ts** - UML diagram storage

All schemas are automatically included when running db:push or db:setup.