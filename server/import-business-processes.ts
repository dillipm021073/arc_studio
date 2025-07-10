import XLSX from 'xlsx';
import { db } from './db';
import { businessProcesses, businessProcessRelationships } from '../shared/schema';
import { eq, and } from 'drizzle-orm';

interface ExcelRow {
  Hierarchy?: string;
  Sequence?: string;
  Level?: string;
  'Business Process'?: string;
  LOB?: string;
  Product?: string;
  Version?: string;
  Status?: string;
  'Domain Owner'?: string;
  'IT Owner'?: string;
  'Vendor Focal'?: string;
  'Related Interfaces'?: string;
  'Interface Count'?: number;
  'Created At'?: string;
  'Updated At'?: string;
}

async function importBusinessProcesses(filename?: string) {
  try {
    // Read the Excel file
    const fileToRead = filename || 'business-processes-tree-export-2025-06-16.xlsx';
    const workbook = XLSX.readFile(fileToRead);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const data: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`Found ${data.length} rows in the Excel file`);
    
    // Clear existing data (optional - comment out if you want to keep existing data)
    await db.delete(businessProcessRelationships);
    await db.delete(businessProcesses);
    
    // Process each row
    const processCache = new Map<string, number>(); // Cache for process name -> id mapping
    let currentLevelAId: number | null = null;
    let currentLevelBId: number | null = null;
    
    // First pass: Create all processes
    for (const row of data) {
      if (!row['Business Process'] || !row.Level) continue;
      
      const processName = row['Business Process'].trim();
      const level = row.Level.trim();
      const sequence = row.Sequence || '';
      
      // Check if process already exists
      const existing = await db.query.businessProcesses.findFirst({
        where: eq(businessProcesses.businessProcess, processName)
      });
      
      if (!existing) {
        const [inserted] = await db.insert(businessProcesses).values({
          businessProcess: processName,
          lob: row.LOB || 'Unknown',
          product: row.Product || 'Unknown',
          version: row.Version || '1.0',
          level: level,
          domainOwner: row['Domain Owner'] || null,
          itOwner: row['IT Owner'] || null,
          vendorFocal: row['Vendor Focal'] || null,
          status: row.Status || 'active'
        }).returning();
        
        processCache.set(processName, inserted.id);
        console.log(`Created Level ${level} process: ${processName}`);
        
        // Track current parent IDs based on level
        if (level === 'A') {
          currentLevelAId = inserted.id;
          currentLevelBId = null; // Reset B when we see a new A
        } else if (level === 'B') {
          currentLevelBId = inserted.id;
        }
      } else {
        processCache.set(processName, existing.id);
        
        // Track current parent IDs for existing processes too
        if (level === 'A') {
          currentLevelAId = existing.id;
          currentLevelBId = null;
        } else if (level === 'B') {
          currentLevelBId = existing.id;
        }
      }
    }
    
    // Second pass: Create relationships based on sequence order
    currentLevelAId = null;
    currentLevelBId = null;
    
    for (const row of data) {
      if (!row['Business Process'] || !row.Level) continue;
      
      const processName = row['Business Process'].trim();
      const level = row.Level.trim();
      const sequence = row.Sequence || '';
      const processId = processCache.get(processName);
      
      if (!processId) continue;
      
      // Update current parent tracking
      if (level === 'A') {
        currentLevelAId = processId;
        currentLevelBId = null;
      } else if (level === 'B') {
        currentLevelBId = processId;
        
        // Link B to A
        if (currentLevelAId) {
          // Check if relationship already exists
          const [existingRel] = await db
            .select()
            .from(businessProcessRelationships)
            .where(
              and(
                eq(businessProcessRelationships.parentProcessId, currentLevelAId),
                eq(businessProcessRelationships.childProcessId, processId)
              )
            )
            .limit(1);
          
          if (!existingRel) {
            const sequenceParts = sequence.split('.');
            await db.insert(businessProcessRelationships).values({
              parentProcessId: currentLevelAId,
              childProcessId: processId,
              relationshipType: 'contains',
              sequenceNumber: parseInt(sequenceParts[0]) || 1
            });
            console.log(`  - Linked ${processName} to parent Level A`);
          }
        }
      } else if (level === 'C') {
        // Link C to B
        if (currentLevelBId) {
          // Check if relationship already exists
          const [existingRel] = await db
            .select()
            .from(businessProcessRelationships)
            .where(
              and(
                eq(businessProcessRelationships.parentProcessId, currentLevelBId),
                eq(businessProcessRelationships.childProcessId, processId)
              )
            )
            .limit(1);
          
          if (!existingRel) {
            const sequenceParts = sequence.split('.');
            const seqNumber = sequenceParts.length >= 2 ? parseInt(sequenceParts[1]) : 1;
            await db.insert(businessProcessRelationships).values({
              parentProcessId: currentLevelBId,
              childProcessId: processId,
              relationshipType: 'contains',
              sequenceNumber: seqNumber || 1
            });
            console.log(`  - Linked ${processName} to parent Level B`);
          }
        }
      }
    }
    
    console.log(`Import completed. Created ${processCache.size} business processes.`);
    
    // Display summary
    const allProcesses = await db.query.businessProcesses.findMany();
    const levelACounts = allProcesses.filter(p => p.level === 'A').length;
    const levelBCounts = allProcesses.filter(p => p.level === 'B').length;
    const levelCCounts = allProcesses.filter(p => p.level === 'C').length;
    
    console.log(`\nSummary:`);
    console.log(`Level A processes: ${levelACounts}`);
    console.log(`Level B processes: ${levelBCounts}`);
    console.log(`Level C processes: ${levelCCounts}`);
    console.log(`Total processes: ${allProcesses.length}`);
    
  } catch (error) {
    console.error('Error importing business processes:', error);
    process.exit(1);
  }
}

// Run the import if called directly
const filename = process.argv[2];
importBusinessProcesses(filename)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });