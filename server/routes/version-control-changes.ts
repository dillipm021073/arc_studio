import { Router } from 'express';
import { db } from '../db';
import { artifactVersions } from '@db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { requireAuth } from '../auth';

const router = Router();

// Get all changes in an initiative
router.get('/initiative/:initiativeId/changes', requireAuth, async (req, res) => {
  try {
    const { initiativeId } = req.params;

    // Fetch all artifact versions for this initiative
    const versions = await db.select()
      .from(artifactVersions)
      .where(eq(artifactVersions.initiativeId, initiativeId));

    // Group by artifact type
    const changes: {
      applications: any[];
      interfaces: any[];
      businessProcesses: any[];
      internalActivities: any[];
      technicalProcesses: any[];
    } = {
      applications: [],
      interfaces: [],
      businessProcesses: [],
      internalActivities: [],
      technicalProcesses: []
    };

    versions.forEach(version => {
      const change = {
        artifactId: version.artifactId,
        artifactType: version.artifactType,
        changeType: version.changeType,
        changedFields: version.changedFields || [],
        changeReason: version.changeReason,
        createdAt: version.createdAt,
        updatedAt: version.updatedAt
      };

      switch (version.artifactType) {
        case 'application':
          changes.applications.push(change);
          break;
        case 'interface':
          changes.interfaces.push(change);
          break;
        case 'business_process':
          changes.businessProcesses.push(change);
          break;
        case 'internal_process':
          changes.internalActivities.push(change);
          break;
        case 'technical_process':
          changes.technicalProcesses.push(change);
          break;
      }
    });

    res.json(changes);
  } catch (error) {
    console.error('Error fetching initiative changes:', error);
    res.status(500).json({ error: 'Failed to fetch initiative changes' });
  }
});

export default router;