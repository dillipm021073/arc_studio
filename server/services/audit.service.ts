import { db } from "../db";
import { 
  artifactVersions,
  initiatives,
  users,
  applications,
  interfaces,
  businessProcesses,
  technicalProcesses,
  internalActivities
} from "@db/schema";
import { eq, and, desc, or, sql, gte, lte, inArray } from "drizzle-orm";
import { ArtifactType } from "./version-control.service";

export interface AuditEntry {
  id: number;
  timestamp: string;
  artifactType: string;
  artifactId: number;
  artifactName: string;
  action: string;
  changeType: 'create' | 'update' | 'delete' | 'baseline' | 'checkout' | 'checkin';
  versionFrom?: number;
  versionTo?: number;
  userId: number;
  userName: string;
  userEmail: string;
  initiativeId?: string;
  initiativeName?: string;
  changeReason?: string;
  changedFields?: string[];
  metadata?: Record<string, any>;
}

export interface AuditFilter {
  artifactType?: string;
  artifactId?: number;
  initiativeId?: string;
  userId?: number;
  changeType?: string;
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
}

export interface FieldChange {
  field: string;
  path: string[];
  type: 'added' | 'removed' | 'modified' | 'unchanged';
  oldValue?: any;
  newValue?: any;
  subChanges?: FieldChange[];
}

export interface VersionComparison {
  artifactType: string;
  artifactId: number;
  artifactName: string;
  versionFrom: {
    number: number;
    createdAt: string;
    createdBy: string;
    isBaseline: boolean;
  };
  versionTo: {
    number: number;
    createdAt: string;
    createdBy: string;
    isBaseline: boolean;
  };
  changes: FieldChange[];
  summary: {
    added: number;
    removed: number;
    modified: number;
    unchanged: number;
  };
}

export class AuditService {
  /**
   * Get audit trail based on filters
   */
  static async getAuditTrail(filter: AuditFilter): Promise<{
    entries: AuditEntry[];
    total: number;
  }> {
    // Build query conditions
    const conditions = [];
    
    if (filter.artifactType) {
      conditions.push(eq(artifactVersions.artifactType, filter.artifactType));
    }
    
    if (filter.artifactId) {
      conditions.push(eq(artifactVersions.artifactId, filter.artifactId));
    }
    
    if (filter.initiativeId) {
      conditions.push(eq(artifactVersions.initiativeId, filter.initiativeId));
    }
    
    if (filter.userId) {
      conditions.push(
        or(
          eq(artifactVersions.createdBy, filter.userId),
          eq(artifactVersions.updatedBy, filter.userId)
        )
      );
    }
    
    if (filter.changeType) {
      conditions.push(eq(artifactVersions.changeType, filter.changeType));
    }
    
    if (filter.fromDate) {
      conditions.push(gte(artifactVersions.createdAt, filter.fromDate));
    }
    
    if (filter.toDate) {
      conditions.push(lte(artifactVersions.createdAt, filter.toDate));
    }

    // Query versions with user and initiative info
    const query = db.select({
      version: artifactVersions,
      creator: users,
      initiative: initiatives,
      artifactName: sql<string>`
        CASE 
          WHEN ${artifactVersions.artifactType} = 'application' THEN 
            (SELECT name FROM applications WHERE id = ${artifactVersions.artifactId})
          WHEN ${artifactVersions.artifactType} = 'interface' THEN 
            (SELECT iml_number FROM interfaces WHERE id = ${artifactVersions.artifactId})
          WHEN ${artifactVersions.artifactType} = 'business_process' THEN 
            (SELECT business_process FROM business_processes WHERE id = ${artifactVersions.artifactId})
          WHEN ${artifactVersions.artifactType} = 'technical_process' THEN 
            (SELECT name FROM technical_processes WHERE id = ${artifactVersions.artifactId})
          WHEN ${artifactVersions.artifactType} = 'internal_process' THEN 
            (SELECT activity_name FROM internal_activities WHERE id = ${artifactVersions.artifactId})
          ELSE 'Unknown'
        END
      `
    })
    .from(artifactVersions)
    .leftJoin(users, eq(users.id, artifactVersions.createdBy))
    .leftJoin(initiatives, eq(initiatives.initiativeId, artifactVersions.initiativeId))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(artifactVersions.createdAt))
    .limit(filter.limit || 100);

    const results = await query;

    // Get previous versions for comparison
    const entries: AuditEntry[] = [];
    
    for (const row of results) {
      const { version, creator, initiative } = row;
      
      // Get previous version number
      const [prevVersion] = await db.select({
        versionNumber: artifactVersions.versionNumber
      })
      .from(artifactVersions)
      .where(
        and(
          eq(artifactVersions.artifactType, version.artifactType),
          eq(artifactVersions.artifactId, version.artifactId),
          sql`${artifactVersions.versionNumber} < ${version.versionNumber}`
        )
      )
      .orderBy(desc(artifactVersions.versionNumber))
      .limit(1);

      // Determine action and change type
      let action = 'Modified';
      let changeType: AuditEntry['changeType'] = 'update';
      
      if (version.versionNumber === 1) {
        action = 'Created';
        changeType = 'create';
      } else if (version.isBaseline && version.baselinedBy) {
        action = 'Baselined';
        changeType = 'baseline';
      } else if (version.changeType === 'checkout') {
        action = 'Checked out';
        changeType = 'checkout';
      } else if (version.changeType === 'checkin') {
        action = 'Checked in';
        changeType = 'checkin';
      }

      entries.push({
        id: version.id,
        timestamp: version.createdAt?.toISOString() || new Date().toISOString(),
        artifactType: version.artifactType,
        artifactId: version.artifactId,
        artifactName: row.artifactName || 'Unknown',
        action,
        changeType,
        versionFrom: prevVersion?.versionNumber,
        versionTo: version.versionNumber,
        userId: creator?.id || 0,
        userName: creator?.name || 'Unknown',
        userEmail: creator?.email || 'unknown@example.com',
        initiativeId: initiative?.initiativeId,
        initiativeName: initiative?.name,
        changeReason: version.changeReason,
        changedFields: version.changedFields as string[],
        metadata: {
          isBaseline: version.isBaseline,
          baselineDate: version.baselineDate,
          updatedBy: version.updatedBy,
          updatedAt: version.updatedAt
        }
      });
    }

    // Get total count
    const [{ count }] = await db.select({
      count: sql<number>`COUNT(*)`
    })
    .from(artifactVersions)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

    return {
      entries,
      total: Number(count)
    };
  }

  /**
   * Compare two versions of an artifact
   */
  static async compareVersions(
    artifactType: string,
    artifactId: number,
    versionFrom: number,
    versionTo: number
  ): Promise<VersionComparison> {
    // Get both versions
    const versions = await db.select({
      version: artifactVersions,
      creator: users
    })
    .from(artifactVersions)
    .leftJoin(users, eq(users.id, artifactVersions.createdBy))
    .where(
      and(
        eq(artifactVersions.artifactType, artifactType),
        eq(artifactVersions.artifactId, artifactId),
        inArray(artifactVersions.versionNumber, [versionFrom, versionTo])
      )
    );

    if (versions.length !== 2) {
      throw new Error('One or both versions not found');
    }

    const fromVersion = versions.find(v => v.version.versionNumber === versionFrom)!;
    const toVersion = versions.find(v => v.version.versionNumber === versionTo)!;

    // Get artifact name
    let artifactName = 'Unknown';
    switch (artifactType) {
      case 'application':
        const [app] = await db.select({ name: applications.name })
          .from(applications)
          .where(eq(applications.id, artifactId));
        artifactName = app?.name || 'Unknown';
        break;
      case 'interface':
        const [iface] = await db.select({ name: interfaces.imlNumber })
          .from(interfaces)
          .where(eq(interfaces.id, artifactId));
        artifactName = iface?.name || 'Unknown';
        break;
      case 'business_process':
        const [bp] = await db.select({ name: businessProcesses.name })
          .from(businessProcesses)
          .where(eq(businessProcesses.id, artifactId));
        artifactName = bp?.name || 'Unknown';
        break;
    }

    // Compare artifact data
    const changes = this.compareObjects(
      fromVersion.version.artifactData,
      toVersion.version.artifactData
    );

    // Calculate summary
    const summary = {
      added: 0,
      removed: 0,
      modified: 0,
      unchanged: 0
    };

    const countChanges = (changeList: FieldChange[]) => {
      for (const change of changeList) {
        summary[change.type === 'unchanged' ? 'unchanged' : change.type]++;
        if (change.subChanges) {
          countChanges(change.subChanges);
        }
      }
    };

    countChanges(changes);

    return {
      artifactType,
      artifactId,
      artifactName,
      versionFrom: {
        number: fromVersion.version.versionNumber,
        createdAt: fromVersion.version.createdAt?.toISOString() || '',
        createdBy: fromVersion.creator?.name || 'Unknown',
        isBaseline: fromVersion.version.isBaseline
      },
      versionTo: {
        number: toVersion.version.versionNumber,
        createdAt: toVersion.version.createdAt?.toISOString() || '',
        createdBy: toVersion.creator?.name || 'Unknown',
        isBaseline: toVersion.version.isBaseline
      },
      changes,
      summary
    };
  }

  /**
   * Compare two objects and return detailed changes
   */
  private static compareObjects(
    oldObj: any,
    newObj: any,
    path: string[] = []
  ): FieldChange[] {
    const changes: FieldChange[] = [];
    const allKeys = new Set([
      ...Object.keys(oldObj || {}),
      ...Object.keys(newObj || {})
    ]);

    // Skip system fields
    const skipFields = ['id', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy'];

    for (const key of allKeys) {
      if (skipFields.includes(key)) continue;

      const currentPath = [...path, key];
      const oldValue = oldObj?.[key];
      const newValue = newObj?.[key];

      // Field was removed
      if (oldValue !== undefined && newValue === undefined) {
        changes.push({
          field: key,
          path: currentPath,
          type: 'removed',
          oldValue
        });
      }
      // Field was added
      else if (oldValue === undefined && newValue !== undefined) {
        changes.push({
          field: key,
          path: currentPath,
          type: 'added',
          newValue
        });
      }
      // Field exists in both
      else {
        const oldStr = JSON.stringify(oldValue);
        const newStr = JSON.stringify(newValue);

        if (oldStr !== newStr) {
          // For objects, do deep comparison
          if (
            typeof oldValue === 'object' && 
            typeof newValue === 'object' &&
            oldValue !== null && 
            newValue !== null &&
            !Array.isArray(oldValue) && 
            !Array.isArray(newValue)
          ) {
            const subChanges = this.compareObjects(oldValue, newValue, currentPath);
            changes.push({
              field: key,
              path: currentPath,
              type: 'modified',
              oldValue,
              newValue,
              subChanges
            });
          } else {
            changes.push({
              field: key,
              path: currentPath,
              type: 'modified',
              oldValue,
              newValue
            });
          }
        } else {
          changes.push({
            field: key,
            path: currentPath,
            type: 'unchanged',
            oldValue,
            newValue
          });
        }
      }
    }

    return changes;
  }

  /**
   * Get version history for an artifact
   */
  static async getVersionHistory(
    artifactType: string,
    artifactId: number,
    limit: number = 20
  ): Promise<{
    versions: Array<{
      version: number;
      createdAt: string;
      createdBy: string;
      isBaseline: boolean;
      initiativeName?: string;
      changeReason?: string;
      changedFieldsCount: number;
    }>;
    total: number;
  }> {
    const versions = await db.select({
      version: artifactVersions,
      creator: users,
      initiative: initiatives
    })
    .from(artifactVersions)
    .leftJoin(users, eq(users.id, artifactVersions.createdBy))
    .leftJoin(initiatives, eq(initiatives.initiativeId, artifactVersions.initiativeId))
    .where(
      and(
        eq(artifactVersions.artifactType, artifactType),
        eq(artifactVersions.artifactId, artifactId)
      )
    )
    .orderBy(desc(artifactVersions.versionNumber))
    .limit(limit);

    const [{ total }] = await db.select({
      total: sql<number>`COUNT(*)`
    })
    .from(artifactVersions)
    .where(
      and(
        eq(artifactVersions.artifactType, artifactType),
        eq(artifactVersions.artifactId, artifactId)
      )
    );

    return {
      versions: versions.map(row => ({
        version: row.version.versionNumber,
        createdAt: row.version.createdAt?.toISOString() || '',
        createdBy: row.creator?.name || 'Unknown',
        isBaseline: row.version.isBaseline,
        initiativeName: row.initiative?.name,
        changeReason: row.version.changeReason,
        changedFieldsCount: (row.version.changedFields as string[])?.length || 0
      })),
      total: Number(total)
    };
  }
}