import { Client } from 'pg';
import fs from 'fs';

// Source database configuration
const sourceConfig = {
  connectionString: 'postgresql://postgres:postgres@10.236.82.22:31543/aml_iml',
  ssl: false
};

// Target database configuration
const targetConfig = {
  connectionString: 'postgresql://env10o:OnlyForTest123@incetks154:5432/paaspg',
  ssl: false
};

async function executePgDump() {
  console.log('🚀 Starting complete database migration using pg_dump approach...\n');
  
  const sourceClient = new Client(sourceConfig);
  const targetClient = new Client(targetConfig);
  
  try {
    // Connect to both databases
    await sourceClient.connect();
    await targetClient.connect();
    console.log('✅ Connected to both databases\n');
    
    // Get list of all tables
    const tablesResult = await sourceClient.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename NOT LIKE 'pg_%'
      AND tablename NOT LIKE 'sql_%'
      ORDER BY tablename
    `);
    
    const tables = tablesResult.rows.map(r => r.tablename);
    console.log(`📋 Found ${tables.length} tables to migrate\n`);
    
    // Drop all existing tables in target
    console.log('🧹 Cleaning target database...');
    for (const table of [...tables].reverse()) {
      try {
        await targetClient.query(`DROP TABLE IF EXISTS "${table}" CASCADE`);
        console.log(`  ✅ Dropped: ${table}`);
      } catch (error: any) {
        console.log(`  ⚠️  ${table}: ${error.message}`);
      }
    }
    
    console.log('\n📊 Migrating tables...\n');
    
    let successCount = 0;
    let totalRows = 0;
    
    for (const table of tables) {
      try {
        // Get table structure using a more direct approach
        const structureResult = await sourceClient.query(`
          SELECT 
            'CREATE TABLE ' || quote_ident($1) || ' (' || E'\n' ||
            string_agg(
              '  ' || quote_ident(column_name) || ' ' ||
              CASE 
                WHEN data_type = 'character varying' THEN 'VARCHAR(' || character_maximum_length || ')'
                WHEN data_type = 'numeric' THEN 
                  CASE 
                    WHEN numeric_precision IS NOT NULL THEN 
                      'NUMERIC(' || numeric_precision || ',' || COALESCE(numeric_scale, 0) || ')'
                    ELSE 'NUMERIC'
                  END
                WHEN data_type = 'timestamp without time zone' THEN 'TIMESTAMP'
                WHEN data_type = 'character' THEN 'CHAR(' || character_maximum_length || ')'
                ELSE UPPER(data_type)
              END ||
              CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
              CASE 
                WHEN column_default IS NOT NULL AND column_default NOT LIKE 'nextval%' 
                THEN ' DEFAULT ' || column_default 
                ELSE '' 
              END,
              E',\n' ORDER BY ordinal_position
            ) || E'\n);' as create_statement
          FROM information_schema.columns
          WHERE table_name = $1 AND table_schema = 'public'
          GROUP BY table_name
        `, [table]);
        
        if (structureResult.rows.length === 0) continue;
        
        let createSQL = structureResult.rows[0].create_statement;
        
        // Handle SERIAL columns
        const serialColumns = await sourceClient.query(`
          SELECT column_name
          FROM information_schema.columns
          WHERE table_name = $1 
            AND column_default LIKE 'nextval%'
            AND data_type = 'integer'
            AND table_schema = 'public'
        `, [table]);
        
        for (const col of serialColumns.rows) {
          createSQL = createSQL.replace(
            new RegExp(`"${col.column_name}" INTEGER( NOT NULL)?`),
            `"${col.column_name}" SERIAL$1`
          );
        }
        
        // Create the table
        await targetClient.query(createSQL);
        
        // Copy data using COPY command simulation
        const dataResult = await sourceClient.query(`SELECT * FROM "${table}"`);
        const rowCount = dataResult.rows.length;
        
        if (rowCount > 0) {
          // Prepare bulk insert
          const columns = Object.keys(dataResult.rows[0]);
          const columnList = columns.map(c => `"${c}"`).join(', ');
          
          // Insert in batches
          const batchSize = 100;
          for (let i = 0; i < rowCount; i += batchSize) {
            const batch = dataResult.rows.slice(i, Math.min(i + batchSize, rowCount));
            const values = batch.map((row, idx) => {
              const vals = columns.map((col, colIdx) => {
                const val = row[col];
                if (val === null) return 'NULL';
                if (typeof val === 'string') return `$${idx * columns.length + colIdx + 1}`;
                if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
                if (val instanceof Date) return `$${idx * columns.length + colIdx + 1}`;
                return `$${idx * columns.length + colIdx + 1}`;
              }).join(', ');
              return `(${vals})`;
            }).join(', ');
            
            const flatValues = batch.flatMap(row => 
              columns.map(col => {
                const val = row[col];
                if (val === null) return null;
                if (typeof val === 'boolean') return null;
                return val;
              }).filter(v => v !== undefined)
            );
            
            if (flatValues.length > 0) {
              // Use simpler approach - insert one by one for reliability
              for (const row of batch) {
                const vals = columns.map(col => row[col]);
                const placeholders = columns.map((_, idx) => `$${idx + 1}`).join(', ');
                await targetClient.query(
                  `INSERT INTO "${table}" (${columnList}) VALUES (${placeholders})`,
                  vals
                );
              }
            }
          }
          
          // Reset sequences
          for (const col of serialColumns.rows) {
            const maxResult = await targetClient.query(
              `SELECT MAX("${col.column_name}") FROM "${table}"`
            );
            if (maxResult.rows[0].max) {
              await targetClient.query(
                `SELECT setval(pg_get_serial_sequence('"${table}"', '${col.column_name}'), $1)`,
                [maxResult.rows[0].max]
              );
            }
          }
        }
        
        console.log(`  ✅ ${table}: ${rowCount} rows`);
        successCount++;
        totalRows += rowCount;
        
      } catch (error: any) {
        console.log(`  ❌ ${table}: ${error.message}`);
      }
    }
    
    // Add primary keys
    console.log('\n🔑 Adding primary keys...');
    const pkResult = await sourceClient.query(`
      SELECT 
        tc.table_name,
        tc.constraint_name,
        string_agg(quote_ident(kcu.column_name), ', ' ORDER BY kcu.ordinal_position) as columns
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      WHERE tc.constraint_type = 'PRIMARY KEY'
        AND tc.table_schema = 'public'
        AND tc.table_name = ANY($1::text[])
      GROUP BY tc.table_name, tc.constraint_name
    `, [tables]);
    
    for (const pk of pkResult.rows) {
      try {
        await targetClient.query(
          `ALTER TABLE "${pk.table_name}" ADD PRIMARY KEY (${pk.columns})`
        );
        console.log(`  ✅ ${pk.table_name}`);
      } catch (error: any) {
        console.log(`  ⚠️  ${pk.table_name}: ${error.message}`);
      }
    }
    
    // Add foreign keys
    console.log('\n🔗 Adding foreign keys...');
    const fkResult = await sourceClient.query(`
      SELECT DISTINCT
        tc.table_name,
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
        AND tc.table_name = ANY($1::text[])
    `, [tables]);
    
    for (const fk of fkResult.rows) {
      try {
        await targetClient.query(
          `ALTER TABLE "${fk.table_name}" ADD CONSTRAINT "${fk.constraint_name}" ` +
          `FOREIGN KEY ("${fk.column_name}") REFERENCES "${fk.foreign_table_name}"("${fk.foreign_column_name}")`
        );
        console.log(`  ✅ ${fk.table_name} -> ${fk.foreign_table_name}`);
      } catch (error: any) {
        console.log(`  ⚠️  ${fk.table_name}: ${error.message}`);
      }
    }
    
    // Summary
    console.log('\n🎉 Migration completed!\n');
    console.log('📊 Summary:');
    console.log('─'.repeat(50));
    console.log(`  Tables migrated: ${successCount}/${tables.length}`);
    console.log(`  Total rows copied: ${totalRows}`);
    console.log('─'.repeat(50));
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
  } finally {
    await sourceClient.end();
    await targetClient.end();
  }
}

// Run migration
executePgDump().catch(console.error);