import { execSync } from 'child_process';
import { config } from 'dotenv';
import { Pool } from 'pg';

// Load environment variables
config();

async function setupDatabase() {
  console.log('🔧 Setting up database...');

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set in your .env file');
    process.exit(1);
  }

  // Test database connection
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: false });
  
  try {
    await pool.query('SELECT 1');
    console.log('✅ Database connection successful');
  } catch (error) {
    console.error('❌ Cannot connect to database:', error);
    console.log('Please ensure your PostgreSQL server is running and DATABASE_URL is correct');
    process.exit(1);
  } finally {
    await pool.end();
  }

  try {
    // Step 1: Generate migrations from current schema
    console.log('\n📝 Generating migrations from schema...');
    execSync('npm run db:generate', { stdio: 'inherit' });

    // Step 2: Push schema changes to database (creates all tables)
    console.log('\n🚀 Pushing schema to database...');
    execSync('npm run db:push', { stdio: 'inherit' });

    // Step 3: Run basic seed to create default users
    console.log('\n🌱 Seeding default users...');
    execSync('npm run db:seed', { stdio: 'inherit' });

    // Step 4: Seed default environments
    console.log('\n🌍 Seeding default environments...');
    execSync('npm run db:seed-environments', { stdio: 'inherit' });

    console.log('\n✅ Database setup complete!');
    console.log('\nDefault data created:');
    console.log('  Users:');
    console.log('    - Admin: username: admin, password: admin123');
    console.log('    - Test User: username: testuser, password: test123');
    console.log('  Environments:');
    console.log('    - Development (localhost)');
    console.log('    - Staging');
    console.log('    - Production');

  } catch (error) {
    console.error('\n❌ Error during database setup:', error);
    process.exit(1);
  }
}

// Run the setup
setupDatabase().catch(console.error);