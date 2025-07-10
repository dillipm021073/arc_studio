import XLSX from 'xlsx';
import { db } from './db';
import { businessProcesses, businessProcessRelationships, businessProcessInterfaces, interfaces } from '../shared/schema';
import { eq, and, sql } from 'drizzle-orm';

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

export async function importBusinessProcessesFromExcel(buffer: Buffer, clearExisting: boolean = false) {
  try {
    // Read the Excel file from buffer
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const data: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`Found ${data.length} rows in the Excel file`);
    
    // Clear existing data if requested
    if (clearExisting) {
      await db.delete(businessProcessRelationships);
      await db.delete(businessProcessInterfaces);
      await db.delete(businessProcesses);
    }
    
    // Process each row
    const processCache = new Map<string, number>(); // Cache for process name -> id mapping
    let currentLevelAId: number | null = null;
    let currentLevelBId: number | null = null;
    const interfaceCache = new Map<string, number>(); // Cache for IML number -> interface id
    
    // First pass: Create all processes
    for (const row of data) {
      if (!row['Business Process'] || !row.Level) continue;
      
      const processName = row['Business Process'].trim();
      const level = row.Level.trim();
      
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
          currentLevelBId = null;
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
    
    // Second pass: Create relationships and interface mappings
    currentLevelAId = null;
    currentLevelBId = null;
    
    for (const row of data) {
      if (!row['Business Process'] || !row.Level) continue;
      
      const processName = row['Business Process'].trim();
      const level = row.Level.trim();
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
          const existingRel = await db.query.businessProcessRelationships.findFirst({
            where: and(
              eq(businessProcessRelationships.parentProcessId, currentLevelAId),
              eq(businessProcessRelationships.childProcessId, processId)
            )
          });
          
          if (!existingRel) {
            const sequenceParts = (row.Sequence || '').split('.');
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
          const existingRel = await db.query.businessProcessRelationships.findFirst({
            where: and(
              eq(businessProcessRelationships.parentProcessId, currentLevelBId),
              eq(businessProcessRelationships.childProcessId, processId)
            )
          });
          
          if (!existingRel) {
            const sequenceParts = (row.Sequence || '').split('.');
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
      
      // Process related interfaces
      if (row['Related Interfaces'] && row['Related Interfaces'] !== 'None') {
        const interfaceList = row['Related Interfaces'].split(';').map(i => i.trim());
        
        for (const interfaceStr of interfaceList) {
          // Extract IML number and sequence from string like "IML001 (Seq: 1)"
          const match = interfaceStr.match(/^(IML\d+)\s*\(Seq:\s*(\d+)\)/);
          if (match) {
            const imlNumber = match[1];
            const sequenceNumber = parseInt(match[2]);
            
            // Get or cache interface ID
            let interfaceId = interfaceCache.get(imlNumber);
            if (!interfaceId) {
              const iface = await db.query.interfaces.findFirst({
                where: eq(interfaces.imlNumber, imlNumber)
              });
              if (iface) {
                interfaceId = iface.id;
                interfaceCache.set(imlNumber, interfaceId);
              }
            }
            
            if (interfaceId) {
              // Check if relationship already exists
              const existingMapping = await db.query.businessProcessInterfaces.findFirst({
                where: and(
                  eq(businessProcessInterfaces.businessProcessId, processId),
                  eq(businessProcessInterfaces.interfaceId, interfaceId)
                )
              });
              
              if (!existingMapping) {
                await db.insert(businessProcessInterfaces).values({
                  businessProcessId: processId,
                  interfaceId: interfaceId,
                  sequenceNumber: sequenceNumber,
                  description: null
                });
                console.log(`  - Linked interface ${imlNumber} to ${processName}`);
              }
            }
          }
        }
      }
    }
    
    console.log(`Import completed. Created/updated ${processCache.size} business processes.`);
    
    // Display summary
    const allProcesses = await db.query.businessProcesses.findMany();
    const levelACounts = allProcesses.filter(p => p.level === 'A').length;
    const levelBCounts = allProcesses.filter(p => p.level === 'B').length;
    const levelCCounts = allProcesses.filter(p => p.level === 'C').length;
    
    return {
      success: true,
      summary: {
        totalProcesses: allProcesses.length,
        levelA: levelACounts,
        levelB: levelBCounts,
        levelC: levelCCounts
      }
    };
    
  } catch (error) {
    console.error('Error importing business processes:', error);
    throw error;
  }
}