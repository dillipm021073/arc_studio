import { Router } from "express";
import { db } from "../db";
import { eq, and, desc, sql } from "drizzle-orm";
import {
  applications,
  interfaces,
  businessProcesses,
  internalActivities,
  technicalProcesses,
  initiatives,
  artifactVersions,
  changeRequests,
  users
} from "@db/schema";
import type { Request, Response } from "express";

const router = Router();

// Get comprehensive change summary for an initiative
router.get("/initiatives/:id/changes", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get all artifacts associated with the initiative
    const artifactsList = await db
      .select()
      .from(artifactVersions)
      .where(eq(artifactVersions.initiativeId, id));

    // Initialize change summary
    const changeSummary = {
      totalChanges: 0,
      created: 0,
      modified: 0,
      deleted: 0,
      artifactChanges: [],
      timeline: [],
      testingRequirements: {
        affectedSystems: new Set<string>(),
        testTypes: new Set<string>(),
        criticalPaths: []
      }
    };

    // Group artifacts by type
    const artifactsByType: Record<string, any[]> = {};
    for (const artifact of artifactsList) {
      if (!artifactsByType[artifact.artifactType]) {
        artifactsByType[artifact.artifactType] = [];
      }
      artifactsByType[artifact.artifactType].push(artifact);
    }

    // Process changes for each artifact type
    for (const [artifactType, artifacts] of Object.entries(artifactsByType)) {
      const typeChanges = {
        artifactType: artifactType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        changes: []
      };

      for (const artifact of artifacts) {
        // Get version history for this artifact
        const versions = await db
          .select()
          .from(versionControlVersions)
          .where(
            and(
              eq(versionControlVersions.artifactId, artifact.artifactId),
              eq(versionControlVersions.artifactType, artifact.artifactType)
            )
          )
          .orderBy(desc(versionControlVersions.createdAt));

        // Get change history
        const changes = await db
          .select({
            change: versionControlChangeHistory,
            version: versionControlVersions,
            changeRequest: changeRequests
          })
          .from(versionControlChangeHistory)
          .leftJoin(
            versionControlVersions,
            eq(versionControlChangeHistory.versionId, versionControlVersions.id)
          )
          .leftJoin(
            changeRequests,
            eq(versionControlChangeHistory.changeRequestId, changeRequests.id)
          )
          .where(
            and(
              eq(versionControlChangeHistory.artifactId, artifact.artifactId),
              eq(versionControlChangeHistory.artifactType, artifact.artifactType)
            )
          )
          .orderBy(desc(versionControlChangeHistory.changedAt));

        // Process each change
        for (const { change, version, changeRequest } of changes) {
          const changeData: any = {
            artifactName: await getArtifactName(artifact.artifactId, artifact.artifactType),
            changeType: determineChangeType(change),
            version: version?.versionNumber,
            description: change.changeDescription,
            fieldChanges: parseFieldChanges(change.changeDetails),
            impacts: [],
            changedBy: change.changedBy,
            changedAt: change.changedAt,
            changeRequestId: changeRequest?.id
          };

          // Determine impacts based on artifact type
          if (artifact.artifactType === 'interface') {
            const interfaceData = await db
              .select()
              .from(interfaces)
              .where(eq(interfaces.id, artifact.artifactId))
              .limit(1);
            
            if (interfaceData[0]) {
              changeData.impacts.push(`Provider: ${interfaceData[0].providerApplicationName}`);
              changeData.impacts.push(`Consumer: ${interfaceData[0].consumerApplicationName}`);
              changeSummary.testingRequirements.affectedSystems.add(interfaceData[0].providerApplicationName);
              changeSummary.testingRequirements.affectedSystems.add(interfaceData[0].consumerApplicationName);
              changeSummary.testingRequirements.testTypes.add('Interface Connectivity Test');
              changeSummary.testingRequirements.testTypes.add('End-to-End Integration Test');
            }
          } else if (artifact.artifactType === 'business_process') {
            changeSummary.testingRequirements.testTypes.add('Business Process Validation');
            changeSummary.testingRequirements.testTypes.add('User Acceptance Test');
          }

          typeChanges.changes.push(changeData);
          
          // Update counters
          changeSummary.totalChanges++;
          switch (changeData.changeType) {
            case 'created': changeSummary.created++; break;
            case 'modified': changeSummary.modified++; break;
            case 'deleted': changeSummary.deleted++; break;
          }
        }
      }

      if (typeChanges.changes.length > 0) {
        changeSummary.artifactChanges.push(typeChanges);
      }
    }

    // Build timeline of significant events
    const initiative = await db
      .select()
      .from(initiatives)
      .where(eq(initiatives.id, id))
      .limit(1);

    if (initiative[0]) {
      changeSummary.timeline.push({
        description: 'Initiative Created',
        timestamp: initiative[0].createdAt,
        status: 'completed',
        details: `Initiative "${initiative[0].name}" was created`
      });

      // Add artifact addition events
      for (const artifact of artifactsList) {
        const artifactName = await getArtifactName(artifact.artifactId, artifact.artifactType);
        changeSummary.timeline.push({
          description: `${artifact.artifactType.replace(/_/g, ' ')} Added`,
          timestamp: artifact.addedAt,
          status: 'completed',
          details: `${artifactName} was added to the initiative`
        });
      }

      // Sort timeline by timestamp
      changeSummary.timeline.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
    }

    // Convert sets to arrays for JSON serialization
    const finalSummary = {
      ...changeSummary,
      testingRequirements: {
        affectedSystems: Array.from(changeSummary.testingRequirements.affectedSystems),
        testTypes: Array.from(changeSummary.testingRequirements.testTypes),
        criticalPaths: changeSummary.testingRequirements.criticalPaths
      }
    };

    res.json(finalSummary);
  } catch (error) {
    console.error('Error fetching initiative changes:', error);
    res.status(500).json({ error: 'Failed to fetch initiative changes' });
  }
});

// Helper function to get artifact name
async function getArtifactName(artifactId: string, artifactType: string): Promise<string> {
  switch (artifactType) {
    case 'application':
      const app = await db.select().from(applications).where(eq(applications.id, artifactId)).limit(1);
      return app[0]?.name || 'Unknown Application';
    
    case 'interface':
      const iface = await db.select().from(interfaces).where(eq(interfaces.id, artifactId)).limit(1);
      return iface[0]?.imlNumber || 'Unknown Interface';
    
    case 'business_process':
      const bp = await db.select().from(businessProcesses).where(eq(businessProcesses.id, artifactId)).limit(1);
      return bp[0]?.businessProcess || 'Unknown Business Process';
    
    case 'internal_activity':
      const ia = await db.select().from(internalActivities).where(eq(internalActivities.id, artifactId)).limit(1);
      return ia[0]?.name || 'Unknown Internal Activity';
    
    case 'technical_process':
      const tp = await db.select().from(technicalProcesses).where(eq(technicalProcesses.id, artifactId)).limit(1);
      return tp[0]?.name || 'Unknown Technical Process';
    
    default:
      return 'Unknown Artifact';
  }
}

// Helper function to determine change type
function determineChangeType(change: any): string {
  const action = change.action?.toLowerCase() || '';
  if (action.includes('create') || action.includes('add')) return 'created';
  if (action.includes('delete') || action.includes('remove')) return 'deleted';
  return 'modified';
}

// Helper function to parse field changes from change details
function parseFieldChanges(changeDetails: any): any[] {
  if (!changeDetails || typeof changeDetails !== 'object') return [];
  
  const fieldChanges = [];
  const details = typeof changeDetails === 'string' ? JSON.parse(changeDetails) : changeDetails;
  
  if (details.fieldChanges) {
    for (const [field, values] of Object.entries(details.fieldChanges)) {
      if (typeof values === 'object' && values !== null && 'from' in values && 'to' in values) {
        fieldChanges.push({
          field,
          oldValue: values.from,
          newValue: values.to
        });
      }
    }
  }
  
  return fieldChanges;
}

export default router;