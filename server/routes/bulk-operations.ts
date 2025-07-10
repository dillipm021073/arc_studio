import express from 'express';
import { db } from '../db';
import { applications, interfaces, changeRequests, businessProcesses, technicalProcesses } from '../../shared/schema';
import { eq, inArray } from 'drizzle-orm';

const router = express.Router();

// Helper function to get table and schema based on entity type
function getTableAndSchema(entityType: string) {
  switch (entityType) {
    case 'applications':
      return { table: applications, schema: applications };
    case 'interfaces':
      return { table: interfaces, schema: interfaces };
    case 'change-requests':
      return { table: changeRequests, schema: changeRequests };
    case 'business-processes':
      return { table: businessProcesses, schema: businessProcesses };
    case 'technical-processes':
      return { table: technicalProcesses, schema: technicalProcesses };
    default:
      throw new Error(`Unknown entity type: ${entityType}`);
  }
}

// Bulk update endpoint
router.put('/:entityType', async (req, res) => {
  try {
    const { entityType } = req.params;
    const { ids, updates } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'IDs array is required and cannot be empty' });
    }

    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ error: 'Updates object is required' });
    }

    const { table } = getTableAndSchema(entityType);
    
    // Add timestamp for lastChangeDate if it exists in the table
    const updatesWithTimestamp = {
      ...updates,
      lastChangeDate: new Date().toISOString(),
    };

    // Execute bulk update within a transaction
    await db.transaction(async (tx) => {
      for (const id of ids) {
        await tx.update(table).set(updatesWithTimestamp).where(eq(table.id, id));
      }
    });

    res.json({ 
      success: true, 
      message: `Successfully updated ${ids.length} ${entityType}`,
      updatedCount: ids.length 
    });
  } catch (error) {
    console.error('Bulk update error:', error);
    res.status(500).json({ error: 'Failed to update items' });
  }
});

// Bulk delete endpoint
router.delete('/:entityType', async (req, res) => {
  try {
    const { entityType } = req.params;
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'IDs array is required and cannot be empty' });
    }

    const { table } = getTableAndSchema(entityType);

    // Execute bulk delete within a transaction
    const result = await db.transaction(async (tx) => {
      return await tx.delete(table).where(inArray(table.id, ids));
    });

    res.json({ 
      success: true, 
      message: `Successfully deleted ${ids.length} ${entityType}`,
      deletedCount: ids.length 
    });
  } catch (error) {
    console.error('Bulk delete error:', error);
    res.status(500).json({ error: 'Failed to delete items' });
  }
});

// Bulk duplicate endpoint
router.post('/:entityType/duplicate', async (req, res) => {
  try {
    const { entityType } = req.params;
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'IDs array is required and cannot be empty' });
    }

    const { table } = getTableAndSchema(entityType);

    // Get the original items
    const originalItems = await db.select().from(table).where(inArray(table.id, ids));

    if (originalItems.length === 0) {
      return res.status(404).json({ error: 'No items found to duplicate' });
    }

    // Create duplicates within a transaction
    const newItems = await db.transaction(async (tx) => {
      const duplicates = [];
      
      for (const original of originalItems) {
        const { id, ...duplicateWithoutId } = original;
        const duplicate: any = { ...duplicateWithoutId };
        
        // Update name/title fields to indicate it's a copy
        if ('name' in duplicate && duplicate.name) {
          duplicate.name = `${duplicate.name} (Copy)`;
        }
        if ('title' in duplicate && duplicate.title) {
          duplicate.title = `${duplicate.title} (Copy)`;
        }
        
        // Update timestamps
        const now = new Date();
        if ('createdAt' in duplicate) {
          duplicate.createdAt = now;
        }
        if ('lastChangeDate' in duplicate) {
          duplicate.lastChangeDate = now;
        }
        if ('firstActiveDate' in duplicate) {
          duplicate.firstActiveDate = now;
        }
        if ('updatedAt' in duplicate) {
          duplicate.updatedAt = now;
        }

        const [newItem] = await tx.insert(table).values(duplicate).returning();
        duplicates.push(newItem);
      }
      
      return duplicates;
    });

    res.json({ 
      success: true, 
      message: `Successfully duplicated ${ids.length} ${entityType}`,
      duplicatedCount: ids.length,
      newItems 
    });
  } catch (error) {
    console.error('Bulk duplicate error:', error);
    res.status(500).json({ error: 'Failed to duplicate items' });
  }
});

export default router;