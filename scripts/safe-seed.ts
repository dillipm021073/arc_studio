import { db } from "../server/db";
import { sql } from "drizzle-orm";
import { execSync } from 'child_process';

async function checkTableExists(tableName: string): Promise<boolean> {
  try {
    const result = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = ${tableName}
      );
    `);
    return result.rows[0]?.exists || false;
  } catch (error) {
    console.error(`Error checking table ${tableName}:`, error);
    return false;
  }
}

async function safeSeed() {
  console.log('🔍 Checking database tables...');

  // List of required tables
  const requiredTables = [
    'users',
    'applications',
    'interfaces',
    'business_processes',
    'technical_processes',
    'change_requests',
    'roles',
    'permissions',
    'role_permissions',
    'user_roles',
    'api_tests',
    'api_test_environments',
    'api_test_environment_variables',
    'capabilities',
    'internal_activities',
    'version_control_systems',
    'initiatives',
    'uml_business_processes',
    'uml_diagrams'
  ];

  const missingTables: string[] = [];

  // Check each table
  for (const table of requiredTables) {
    const exists = await checkTableExists(table);
    if (!exists) {
      missingTables.push(table);
      console.log(`❌ Table '${table}' is missing`);
    } else {
      console.log(`✅ Table '${table}' exists`);
    }
  }

  if (missingTables.length > 0) {
    console.log('\n⚠️  Missing tables detected!');
    console.log('Running db:push to create missing tables...');
    
    try {
      execSync('npm run db:push', { stdio: 'inherit' });
      console.log('\n✅ Tables created successfully');
    } catch (error) {
      console.error('\n❌ Failed to create tables:', error);
      process.exit(1);
    }
  }

  // Now run the appropriate seed scripts
  console.log('\n🌱 Running seed scripts...');
  
  try {
    // Always run basic seed first (users and RBAC)
    console.log('\n1. Seeding users and RBAC...');
    execSync('npm run db:seed', { stdio: 'inherit' });

    // Always seed default environments
    console.log('\n2. Seeding default environments...');
    execSync('npm run db:seed-environments', { stdio: 'inherit' });

    // Check if user wants comprehensive data
    const args = process.argv.slice(2);
    if (args.includes('--comprehensive')) {
      console.log('\n3. Seeding comprehensive test data...');
      execSync('npm run db:seed-comprehensive', { stdio: 'inherit' });
    } else if (args.includes('--business')) {
      console.log('\n3. Seeding business data...');
      execSync('npm run db:seed-business', { stdio: 'inherit' });
    } else {
      console.log('\n✅ Basic seed complete. Use --comprehensive or --business flags for additional data.');
    }

    console.log('\n✅ Seeding complete!');
  } catch (error) {
    console.error('\n❌ Error during seeding:', error);
    process.exit(1);
  }
}

// Run the safe seed
safeSeed().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});