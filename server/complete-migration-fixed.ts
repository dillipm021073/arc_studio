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

async function getAllSourceTables(): Promise<string[]> {
  const result = await sourcePool.query(`
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename NOT LIKE 'pg_%'
    AND tablename NOT LIKE 'sql_%'
    ORDER BY tablename
  `);
  return result.rows.map(row => row.tablename);
}

async function getTableDDL(tableName: string): Promise<string> {
  // Get the actual CREATE TABLE statement from pg_dump style query
  const columnsResult = await sourcePool.query(`
    SELECT 
      column_name,
      CASE 
        WHEN data_type = 'character varying' THEN 'VARCHAR(' || character_maximum_length || ')'
        WHEN data_type = 'numeric' AND numeric_precision IS NOT NULL THEN 
          'NUMERIC(' || numeric_precision || ',' || COALESCE(numeric_scale, 0) || ')'
        WHEN data_type = 'timestamp without time zone' THEN 'TIMESTAMP'
        WHEN data_type = 'character' THEN 'CHAR(' || character_maximum_length || ')'
        ELSE UPPER(data_type)
      END as data_type,
      is_nullable,
      column_default
    FROM information_schema.columns
    WHERE table_name = $1 AND table_schema = 'public'
    ORDER BY ordinal_position
  `, [tableName]);

  let ddl = `CREATE TABLE IF NOT EXISTS "${tableName}" (\n`;
  
  const columnDefs = columnsResult.rows.map(col => {
    let def = `  "${col.column_name}" ${col.data_type}`;
    
    if (col.is_nullable === 'NO') {
      def += ' NOT NULL';
    }
    
    if (col.column_default) {
      if (col.column_default.includes('nextval')) {
        // This is a serial column, replace with SERIAL
        if (col.data_type === 'INTEGER') {
          return `  "${col.column_name}" SERIAL${col.is_nullable === 'NO' ? ' NOT NULL' : ''}`;
        } else if (col.data_type === 'BIGINT') {
          return `  "${col.column_name}" BIGSERIAL${col.is_nullable === 'NO' ? ' NOT NULL' : ''}`;
        }
      } else {
        def += ` DEFAULT ${col.column_default}`;
      }
    }
    
    return def;
  });
  
  ddl += columnDefs.join(',\n');
  
  // Add primary key
  const pkResult = await sourcePool.query(`
    SELECT constraint_name, column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name = $1 
      AND tc.constraint_type = 'PRIMARY KEY'
      AND tc.table_schema = 'public'
  `, [tableName]);
  
  if (pkResult.rows.length > 0) {
    const pkColumns = pkResult.rows.map(r => `"${r.column_name}"`).join(', ');
    ddl += `,\n  PRIMARY KEY (${pkColumns})`;
  }
  
  ddl += '\n)';
  
  return ddl;
}

async function getTableConstraints(tableName: string): Promise<string[]> {
  const constraints: string[] = [];
  
  // Get foreign keys
  const fkResult = await sourcePool.query(`
    SELECT DISTINCT
      tc.constraint_name,
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY' 
      AND tc.table_name = $1
      AND tc.table_schema = 'public'
  `, [tableName]);
  
  for (const fk of fkResult.rows) {
    constraints.push(
      `ALTER TABLE "${fk.table_name}" ADD CONSTRAINT "${fk.constraint_name}" ` +
      `FOREIGN KEY ("${fk.column_name}") REFERENCES "${fk.foreign_table_name}"("${fk.foreign_column_name}")`
    );
  }
  
  // Get unique constraints
  const uniqueResult = await sourcePool.query(`
    SELECT DISTINCT constraint_name, column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name = $1 
      AND tc.constraint_type = 'UNIQUE'
      AND tc.table_schema = 'public'
  `, [tableName]);
  
  for (const uniq of uniqueResult.rows) {
    constraints.push(
      `ALTER TABLE "${tableName}" ADD CONSTRAINT "${uniq.constraint_name}" UNIQUE ("${uniq.column_name}")`
    );
  }
  
  return constraints;
}

async function getTableIndexes(tableName: string): Promise<string[]> {
  const result = await sourcePool.query(`
    SELECT indexname, indexdef
    FROM pg_indexes
    WHERE tablename = $1 
      AND schemaname = 'public'
      AND indexname NOT LIKE '%_pkey'
      AND indexname NOT LIKE '%_unique'
  `, [tableName]);
  
  return result.rows.map(row => row.indexdef);
}

async function copyTableData(tableName: string): Promise<number> {
  try {
    const countResult = await sourcePool.query(`SELECT COUNT(*) FROM "${tableName}"`);
    const totalRows = parseInt(countResult.rows[0].count);
    
    if (totalRows === 0) {
      return 0;
    }
    
    // Get data in batches
    const batchSize = 1000;
    let copiedRows = 0;
    
    await targetPool.query('BEGIN');
    
    try {
      for (let offset = 0; offset < totalRows; offset += batchSize) {
        const sourceData = await sourcePool.query(
          `SELECT * FROM "${tableName}" ORDER BY 1 LIMIT $1 OFFSET $2`,
          [batchSize, offset]
        );
        
        if (sourceData.rows.length === 0) break;
        
        // Get column names from first row
        const columns = Object.keys(sourceData.rows[0]);
        const columnList = columns.map(c => `"${c}"`).join(', ');
        const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
        
        // Insert rows
        for (const row of sourceData.rows) {
          const values = columns.map(col => row[col]);
          await targetPool.query(
            `INSERT INTO "${tableName}" (${columnList}) VALUES (${placeholders})`,
            values
          );
          copiedRows++;
        }
        
        process.stdout.write(`\r  Copying ${tableName}... ${copiedRows}/${totalRows} rows`);
      }
      
      // Reset sequences
      const seqResult = await sourcePool.query(`
        SELECT column_name, column_default
        FROM information_schema.columns
        WHERE table_name = $1 
          AND column_default LIKE 'nextval%'
          AND table_schema = 'public'
      `, [tableName]);
      
      for (const seq of seqResult.rows) {
        const maxResult = await targetPool.query(
          `SELECT MAX("${seq.column_name}") as max FROM "${tableName}"`
        );
        if (maxResult.rows[0].max) {
          await targetPool.query(
            `SELECT setval(pg_get_serial_sequence('"${tableName}"', '${seq.column_name}'), $1, true)`,
            [maxResult.rows[0].max]
          );
        }
      }
      
      await targetPool.query('COMMIT');
      process.stdout.write(`\r`);
      return copiedRows;
      
    } catch (error) {
      await targetPool.query('ROLLBACK');
      throw error;
    }
    
  } catch (error: any) {
    console.error(`\n  ❌ Error copying ${tableName}: ${error.message}`);
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
    
    // Get all tables
    console.log('\n📋 Analyzing source database...');
    const tables = await getAllSourceTables();
    console.log(`  Found ${tables.length} tables`);
    
    // Clean target database
    console.log('\n🧹 Cleaning target database...');
    for (const table of [...tables].reverse()) {
      try {
        await targetPool.query(`DROP TABLE IF EXISTS "${table}" CASCADE`);
        console.log(`  ✅ Dropped: ${table}`);
      } catch (error: any) {
        console.log(`  ⚠️  ${table}: ${error.message}`);
      }
    }
    
    // Create tables
    console.log('\n🔨 Creating tables...');
    const constraints: Array<{table: string, sql: string}> = [];
    const indexes: Array<{table: string, sql: string}> = [];
    
    for (const table of tables) {
      try {
        const ddl = await getTableDDL(table);
        await targetPool.query(ddl);
        console.log(`  ✅ Created: ${table}`);
        
        // Collect constraints and indexes for later
        const tableConstraints = await getTableConstraints(table);
        tableConstraints.forEach(sql => constraints.push({table, sql}));
        
        const tableIndexes = await getTableIndexes(table);
        tableIndexes.forEach(sql => indexes.push({table, sql}));
        
      } catch (error: any) {
        console.log(`  ❌ Failed to create ${table}: ${error.message}`);
      }
    }
    
    // Copy data
    console.log('\n📊 Copying data...');
    const summary: {[key: string]: number} = {};
    
    for (const table of tables) {
      const rowCount = await copyTableData(table);
      summary[table] = rowCount;
      
      if (rowCount >= 0) {
        console.log(`  ✅ ${table}: ${rowCount} rows`);
      }
    }
    
    // Add constraints
    console.log('\n🔗 Adding constraints...');
    for (const {table, sql} of constraints) {
      try {
        await targetPool.query(sql);
        console.log(`  ✅ Added constraint on ${table}`);
      } catch (error: any) {
        console.log(`  ⚠️  ${table}: ${error.message}`);
      }
    }
    
    // Add indexes
    console.log('\n📇 Creating indexes...');
    for (const {table, sql} of indexes) {
      try {
        await targetPool.query(sql);
        console.log(`  ✅ Added index on ${table}`);
      } catch (error: any) {
        console.log(`  ⚠️  ${table}: ${error.message}`);
      }
    }
    
    // Summary
    console.log('\n🎉 Migration completed!\n');
    console.log('📊 Summary:');
    console.log('─'.repeat(50));
    
    let totalRows = 0;
    let successTables = 0;
    
    for (const [table, count] of Object.entries(summary)) {
      if (count >= 0) {
        console.log(`  ${table.padEnd(30)} ${count.toString().padStart(10)} rows`);
        totalRows += count;
        successTables++;
      }
    }
    
    console.log('─'.repeat(50));
    console.log(`  Total: ${totalRows} rows in ${successTables}/${tables.length} tables`);
    
    // Verification
    console.log('\n🔍 Verification:');
    const targetTables = await targetPool.query(`
      SELECT COUNT(*) as count FROM pg_tables 
      WHERE schemaname = 'env10o'
    `);
    console.log(`  Target database now has ${targetTables.rows[0].count} tables`);
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
  } finally {
    await sourcePool.end();
    await targetPool.end();
  }
}

// Run migration
completeMigration().catch(console.error);