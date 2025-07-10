import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Source database configuration
const sourceConfig = {
  connectionString: 'postgresql://postgres:postgres@10.236.82.22:31543/aml_iml',
  ssl: false
};

// Target database configuration - using env10o credentials
const targetConfig = {
  connectionString: 'postgresql://env10o:OnlyForTest123@incetks154:5432/paaspg',
  ssl: false
};

// Create connection pools
const sourcePool = new Pool(sourceConfig);
const targetPool = new Pool(targetConfig);

interface TableInfo {
  tableName: string;
  columns: Array<{
    column_name: string;
    data_type: string;
    is_nullable: string;
    column_default: string | null;
    character_maximum_length: number | null;
    numeric_precision: number | null;
    numeric_scale: number | null;
  }>;
  constraints: Array<{
    constraint_name: string;
    constraint_type: string;
    table_name: string;
    column_name: string;
    foreign_table_name: string | null;
    foreign_column_name: string | null;
  }>;
  indexes: Array<{
    indexname: string;
    indexdef: string;
  }>;
}

async function getAllTables(pool: Pool): Promise<string[]> {
  const result = await pool.query(`
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename NOT LIKE 'pg_%'
    AND tablename NOT LIKE 'sql_%'
    ORDER BY tablename
  `);
  return result.rows.map(row => row.tablename);
}

async function getTableInfo(pool: Pool, tableName: string): Promise<TableInfo> {
  // Get columns
  const columnsResult = await pool.query(`
    SELECT 
      column_name,
      data_type,
      is_nullable,
      column_default,
      character_maximum_length,
      numeric_precision,
      numeric_scale
    FROM information_schema.columns
    WHERE table_name = $1 AND table_schema = 'public'
    ORDER BY ordinal_position
  `, [tableName]);

  // Get constraints
  const constraintsResult = await pool.query(`
    SELECT DISTINCT
      tc.constraint_name,
      tc.constraint_type,
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    LEFT JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE tc.table_name = $1 AND tc.table_schema = 'public'
  `, [tableName]);

  // Get indexes
  const indexesResult = await pool.query(`
    SELECT indexname, indexdef
    FROM pg_indexes
    WHERE tablename = $1 AND schemaname = 'public'
  `, [tableName]);

  return {
    tableName,
    columns: columnsResult.rows,
    constraints: constraintsResult.rows,
    indexes: indexesResult.rows
  };
}

function generateCreateTableSQL(tableInfo: TableInfo): string {
  let sql = `CREATE TABLE IF NOT EXISTS "${tableInfo.tableName}" (\n`;
  
  // Add columns
  const columnDefs = tableInfo.columns.map(col => {
    let def = `  "${col.column_name}" ${col.data_type}`;
    
    // Add length/precision if applicable
    if (col.character_maximum_length) {
      def = `  "${col.column_name}" ${col.data_type}(${col.character_maximum_length})`;
    } else if (col.numeric_precision && col.numeric_scale !== null) {
      def = `  "${col.column_name}" ${col.data_type}(${col.numeric_precision},${col.numeric_scale})`;
    } else if (col.data_type === 'text' || col.data_type === 'integer' || col.data_type === 'boolean' || 
               col.data_type === 'timestamp without time zone' || col.data_type === 'numeric') {
      def = `  "${col.column_name}" ${col.data_type}`;
    } else {
      // For other types, use the original definition
      def = `  "${col.column_name}" ${col.data_type}`;
    }
    
    // Add NOT NULL
    if (col.is_nullable === 'NO') {
      def += ' NOT NULL';
    }
    
    // Add DEFAULT
    if (col.column_default && !col.column_default.includes('nextval')) {
      def += ` DEFAULT ${col.column_default}`;
    }
    
    return def;
  });
  
  // Add primary key constraints inline
  const pkConstraints = tableInfo.constraints
    .filter(c => c.constraint_type === 'PRIMARY KEY')
    .map(c => `  PRIMARY KEY ("${c.column_name}")`);
  
  // Add unique constraints
  const uniqueConstraints = tableInfo.constraints
    .filter(c => c.constraint_type === 'UNIQUE')
    .map(c => `  UNIQUE ("${c.column_name}")`);
  
  sql += [...columnDefs, ...pkConstraints, ...uniqueConstraints].join(',\n');
  sql += '\n)';
  
  return sql;
}

function generateForeignKeySQL(tableInfo: TableInfo): string[] {
  return tableInfo.constraints
    .filter(c => c.constraint_type === 'FOREIGN KEY')
    .map(c => `ALTER TABLE "${c.table_name}" ADD CONSTRAINT "${c.constraint_name}" FOREIGN KEY ("${c.column_name}") REFERENCES "${c.foreign_table_name}"("${c.foreign_column_name}")`)
    .filter((v, i, a) => a.indexOf(v) === i); // Remove duplicates
}

async function cleanTargetDatabase(tables: string[]) {
  console.log('\n🧹 Cleaning existing data in target database...\n');
  
  // Drop tables in reverse order to handle dependencies
  for (const table of tables.reverse()) {
    try {
      await targetPool.query(`DROP TABLE IF EXISTS "${table}" CASCADE`);
      console.log(`  ✅ Dropped table: ${table}`);
    } catch (error: any) {
      console.log(`  ⚠️  Could not drop ${table}: ${error.message}`);
    }
  }
}

async function copyTableData(tableName: string): Promise<number> {
  try {
    // Get all data from source
    const sourceData = await sourcePool.query(`SELECT * FROM "${tableName}" ORDER BY id`);
    const rowCount = sourceData.rows.length;
    
    if (rowCount === 0) {
      return 0;
    }
    
    // Get column names
    const columns = Object.keys(sourceData.rows[0]);
    const columnList = columns.map(c => `"${c}"`).join(', ');
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
    
    // Begin transaction
    await targetPool.query('BEGIN');
    
    try {
      // Insert all rows
      for (let i = 0; i < sourceData.rows.length; i++) {
        const row = sourceData.rows[i];
        const values = columns.map(col => row[col]);
        
        await targetPool.query(
          `INSERT INTO "${tableName}" (${columnList}) VALUES (${placeholders})`,
          values
        );
      }
      
      // Reset sequences if table has id column
      if (columns.includes('id') && rowCount > 0) {
        const maxId = Math.max(...sourceData.rows.map(r => r.id).filter(id => id != null));
        await targetPool.query(
          `SELECT setval(pg_get_serial_sequence('"${tableName}"', 'id'), $1, true)`,
          [maxId]
        );
      }
      
      await targetPool.query('COMMIT');
      return rowCount;
      
    } catch (error) {
      await targetPool.query('ROLLBACK');
      throw error;
    }
    
  } catch (error: any) {
    console.error(`  ❌ Error copying ${tableName}: ${error.message}`);
    return -1;
  }
}

async function completeMigration() {
  console.log('🚀 Starting COMPLETE database migration...\n');
  console.log('Source:', sourceConfig.connectionString);
  console.log('Target:', targetConfig.connectionString, '\n');
  
  try {
    // Test connections
    await sourcePool.query('SELECT 1');
    console.log('✅ Connected to source database');
    
    await targetPool.query('SELECT 1');
    console.log('✅ Connected to target database');
    
    // Get all tables from source
    console.log('\n📋 Analyzing source database...');
    const sourceTables = await getAllTables(sourcePool);
    console.log(`  Found ${sourceTables.length} tables:`, sourceTables.join(', '));
    
    // Get detailed schema for each table
    const tableInfos: TableInfo[] = [];
    for (const table of sourceTables) {
      const info = await getTableInfo(sourcePool, table);
      tableInfos.push(info);
    }
    
    // Clean target database
    await cleanTargetDatabase(sourceTables);
    
    // Create tables in correct order (considering dependencies)
    console.log('\n🔨 Creating tables in target database...\n');
    
    // First create all tables without foreign keys
    for (const tableInfo of tableInfos) {
      const createSQL = generateCreateTableSQL(tableInfo);
      await targetPool.query(createSQL);
      console.log(`  ✅ Created table: ${tableInfo.tableName}`);
    }
    
    // Then add foreign keys
    console.log('\n🔗 Adding foreign key constraints...\n');
    for (const tableInfo of tableInfos) {
      const fkSQLs = generateForeignKeySQL(tableInfo);
      for (const fkSQL of fkSQLs) {
        try {
          await targetPool.query(fkSQL);
          console.log(`  ✅ Added FK constraint on ${tableInfo.tableName}`);
        } catch (error: any) {
          console.log(`  ⚠️  Could not add FK on ${tableInfo.tableName}: ${error.message}`);
        }
      }
    }
    
    // Create indexes
    console.log('\n📇 Creating indexes...\n');
    for (const tableInfo of tableInfos) {
      for (const index of tableInfo.indexes) {
        if (!index.indexname.includes('_pkey')) { // Skip primary key indexes
          try {
            await targetPool.query(index.indexdef.replace('public.', ''));
            console.log(`  ✅ Created index: ${index.indexname}`);
          } catch (error: any) {
            console.log(`  ⚠️  Could not create index ${index.indexname}: ${error.message}`);
          }
        }
      }
    }
    
    // Copy data
    console.log('\n📊 Copying data...\n');
    const summary: { [key: string]: number } = {};
    
    for (const table of sourceTables) {
      process.stdout.write(`  Copying ${table}...`);
      const rowCount = await copyTableData(table);
      summary[table] = rowCount;
      
      if (rowCount >= 0) {
        console.log(` ✅ ${rowCount} rows`);
      }
    }
    
    // Final summary
    console.log('\n🎉 Migration completed!\n');
    console.log('📊 Summary:');
    console.log('─'.repeat(40));
    
    let totalRows = 0;
    for (const [table, count] of Object.entries(summary)) {
      if (count >= 0) {
        console.log(`  ${table}: ${count} rows`);
        totalRows += count;
      } else {
        console.log(`  ${table}: FAILED`);
      }
    }
    console.log('─'.repeat(40));
    console.log(`  Total: ${totalRows} rows across ${sourceTables.length} tables`);
    
    // Verify target database
    console.log('\n🔍 Verifying target database...');
    const targetTables = await getAllTables(targetPool);
    console.log(`  Target now has ${targetTables.length} tables`);
    
    const missingTables = sourceTables.filter(t => !targetTables.includes(t));
    if (missingTables.length > 0) {
      console.log(`  ⚠️  Missing tables: ${missingTables.join(', ')}`);
    } else {
      console.log(`  ✅ All tables migrated successfully!`);
    }
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
  } finally {
    await sourcePool.end();
    await targetPool.end();
  }
}

// Run the migration
completeMigration().catch(console.error);