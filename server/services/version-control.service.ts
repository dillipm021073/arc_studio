import { db } from "../db";
import { 
  artifactVersions, 
  initiatives, 
  versionConflicts, 
  artifactLocks,
  baselineHistory,
  initiativeParticipants,
  applications,
  interfaces,
  businessProcesses,
  ArtifactVersion,
  Initiative,
  VersionConflict
} from "@db/schema";
import { eq, and, desc, isNull, or, sql, gt } from "drizzle-orm";
import { ConflictDetectionService, ConflictAnalysis } from "./conflict-detection.service";
import { MergeStrategiesService, MergeContext } from "./merge-strategies.service";

export type ArtifactType = 'application' | 'interface' | 'business_process' | 'internal_process' | 'technical_process';

export interface VersionedArtifact {
  type: ArtifactType;
  id: number;
  data: any;
}

export interface ConflictField {
  fieldName: string;
  baselineValue: any;
  initiativeValue: any;
  conflictingValue?: any;
}

export class VersionControlService {
  /**
   * Create a new initiative
   */
  static async createInitiative(data: {
    name: string;
    description?: string;
    businessJustification?: string;
    priority?: string;
    targetCompletionDate?: Date;
    createdBy: number;
  }): Promise<Initiative> {
    const initiativeId = `INIT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const [initiative] = await db.insert(initiatives).values({
      initiativeId,
      name: data.name,
      description: data.description,
      businessJustification: data.businessJustification,
      priority: data.priority || 'medium',
      targetCompletionDate: data.targetCompletionDate,
      createdBy: data.createdBy,
      status: 'active'
    }).returning();

    // Add creator as lead participant
    await db.insert(initiativeParticipants).values({
      initiativeId,
      userId: data.createdBy,
      role: 'lead',
      addedBy: data.createdBy
    });

    return initiative;
  }

  /**
   * Create baseline version from production data
   */
  static async createBaselineFromProduction(type: ArtifactType, artifactId: number, userId: number): Promise<ArtifactVersion | null> {
    // Fetch the current production data
    let productionData: any = null;
    
    if (type === 'application') {
      const [app] = await db.select().from(applications).where(eq(applications.id, artifactId));
      productionData = app;
    } else if (type === 'interface') {
      const [iface] = await db.select().from(interfaces).where(eq(interfaces.id, artifactId));
      productionData = iface;
    } else if (type === 'business_process') {
      const [bp] = await db.select().from(businessProcesses).where(eq(businessProcesses.id, artifactId));
      productionData = bp;
    }
    
    if (!productionData) {
      return null;
    }
    
    // Create baseline version
    const [baseline] = await db.insert(artifactVersions).values({
      artifactType: type,
      artifactId,
      versionNumber: 1,
      isBaseline: true,
      artifactData: productionData,
      changeType: 'create',
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    
    return baseline;
  }

  /**
   * Get the current baseline version of an artifact
   */
  static async getBaselineVersion(type: ArtifactType, artifactId: number): Promise<ArtifactVersion | null> {
    const [baseline] = await db.select()
      .from(artifactVersions)
      .where(
        and(
          eq(artifactVersions.artifactType, type),
          eq(artifactVersions.artifactId, artifactId),
          eq(artifactVersions.isBaseline, true)
        )
      )
      .orderBy(desc(artifactVersions.versionNumber))
      .limit(1);

    return baseline || null;
  }

  /**
   * Get the latest version of an artifact within an initiative
   */
  static async getInitiativeVersion(
    type: ArtifactType, 
    artifactId: number, 
    initiativeId: string
  ): Promise<ArtifactVersion | null> {
    const [version] = await db.select()
      .from(artifactVersions)
      .where(
        and(
          eq(artifactVersions.artifactType, type),
          eq(artifactVersions.artifactId, artifactId),
          eq(artifactVersions.initiativeId, initiativeId)
        )
      )
      .orderBy(desc(artifactVersions.versionNumber))
      .limit(1);

    return version || null;
  }

  /**
   * Check out an artifact for editing within an initiative
   */
  static async checkoutArtifact(
    type: ArtifactType,
    artifactId: number,
    initiativeId: string,
    userId: number
  ): Promise<ArtifactVersion> {
    // Check if already checked out in this initiative
    const existingVersion = await this.getInitiativeVersion(type, artifactId, initiativeId);
    if (existingVersion) {
      return existingVersion;
    }

    // Check for existing lock
    const [existingLock] = await db.select()
      .from(artifactLocks)
      .where(
        and(
          eq(artifactLocks.artifactType, type),
          eq(artifactLocks.artifactId, artifactId),
          or(
            isNull(artifactLocks.lockExpiry),
            gt(artifactLocks.lockExpiry, new Date())
          )
        )
      );

    if (existingLock && existingLock.initiativeId !== initiativeId) {
      throw new Error(`Artifact is locked by initiative ${existingLock.initiativeId}`);
    }

    // Get baseline version
    let baseline = await this.getBaselineVersion(type, artifactId);
    if (!baseline) {
      // Create baseline version from current production data
      baseline = await this.createBaselineFromProduction(type, artifactId, userId);
      if (!baseline) {
        throw new Error(`No baseline version found for ${type} ${artifactId}`);
      }
    }

    // Create new version
    const nextVersionNumber = baseline.versionNumber + 1;
    const [newVersion] = await db.insert(artifactVersions).values({
      artifactType: type,
      artifactId,
      versionNumber: nextVersionNumber,
      initiativeId,
      isBaseline: false,
      artifactData: baseline.artifactData,
      changeType: 'update',
      createdBy: userId
    }).returning();

    // Create or update lock
    // First delete any existing lock for this artifact in this initiative
    await db.delete(artifactLocks)
      .where(
        and(
          eq(artifactLocks.artifactType, type),
          eq(artifactLocks.artifactId, artifactId),
          eq(artifactLocks.initiativeId, initiativeId)
        )
      );
    
    // Then create new lock
    await db.insert(artifactLocks).values({
      artifactType: type,
      artifactId,
      initiativeId,
      lockedBy: userId,
      lockExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    return newVersion;
  }

  /**
   * Check in changes to an artifact
   */
  static async checkinArtifact(
    type: ArtifactType,
    artifactId: number,
    initiativeId: string,
    userId: number,
    data: any,
    changeReason?: string
  ): Promise<ArtifactVersion> {
    // Get current initiative version
    const currentVersion = await this.getInitiativeVersion(type, artifactId, initiativeId);
    if (!currentVersion) {
      throw new Error(`No checked out version found for ${type} ${artifactId} in initiative ${initiativeId}`);
    }

    // Calculate changed fields
    const changedFields = this.calculateChangedFields(currentVersion.artifactData, data);

    // Update the version
    const [updatedVersion] = await db.update(artifactVersions)
      .set({
        artifactData: data,
        changedFields,
        changeReason,
        updatedBy: userId,
        updatedAt: new Date()
      })
      .where(eq(artifactVersions.id, currentVersion.id))
      .returning();

    // Release the lock
    await db.delete(artifactLocks)
      .where(
        and(
          eq(artifactLocks.artifactType, type),
          eq(artifactLocks.artifactId, artifactId),
          eq(artifactLocks.initiativeId, initiativeId)
        )
      );

    return updatedVersion;
  }

  /**
   * Detect conflicts for an initiative
   */
  static async detectConflicts(initiativeId: string): Promise<VersionConflict[]> {
    // Use enhanced conflict detection service
    const analyses = await ConflictDetectionService.analyzeInitiativeConflicts(initiativeId);
    const conflicts: VersionConflict[] = [];

    for (const analysis of analyses) {
      if (analysis.conflicts.length === 0) continue;

      // Get the initiative version
      const [initiativeVersion] = await db.select()
        .from(artifactVersions)
        .where(
          and(
            eq(artifactVersions.artifactType, analysis.artifactType),
            eq(artifactVersions.artifactId, analysis.artifactId),
            eq(artifactVersions.initiativeId, initiativeId)
          )
        )
        .orderBy(desc(artifactVersions.versionNumber))
        .limit(1);

      if (!initiativeVersion) continue;

      // Get current baseline
      const currentBaseline = await this.getBaselineVersion(
        analysis.artifactType,
        analysis.artifactId
      );
      if (!currentBaseline) continue;

      // Create or update conflict record
      const existingConflict = await db.select()
        .from(versionConflicts)
        .where(
          and(
            eq(versionConflicts.initiativeId, initiativeId),
            eq(versionConflicts.artifactType, analysis.artifactType),
            eq(versionConflicts.artifactId, analysis.artifactId),
            eq(versionConflicts.resolutionStatus, 'pending')
          )
        )
        .limit(1);

      if (existingConflict[0]) {
        // Update existing conflict with new analysis
        const [updated] = await db.update(versionConflicts)
          .set({
            conflictingFields: analysis.conflicts.map(c => c.field),
            conflictDetails: {
              conflicts: analysis.conflicts,
              dependencies: analysis.dependencies,
              riskScore: analysis.riskScore,
              suggestedStrategy: analysis.suggestedStrategy
            }
          })
          .where(eq(versionConflicts.id, existingConflict[0].id))
          .returning();
        conflicts.push(updated);
      } else {
        // Create new conflict record
        const [conflict] = await db.insert(versionConflicts).values({
          initiativeId,
          artifactType: analysis.artifactType,
          artifactId: analysis.artifactId,
          baselineVersionId: currentBaseline.id,
          initiativeVersionId: initiativeVersion.id,
          conflictingFields: analysis.conflicts.map(c => c.field),
          conflictDetails: {
            conflicts: analysis.conflicts,
            dependencies: analysis.dependencies,
            riskScore: analysis.riskScore,
            suggestedStrategy: analysis.suggestedStrategy
          }
        }).returning();
        conflicts.push(conflict);
      }
    }

    return conflicts;
  }

  /**
   * Resolve a conflict
   */
  static async resolveConflict(
    conflictId: number,
    strategy: 'accept_baseline' | 'keep_initiative' | 'manual_merge' | 'auto_merge',
    resolvedData: any,
    userId: number,
    notes?: string
  ): Promise<void> {
    const [conflict] = await db.select()
      .from(versionConflicts)
      .where(eq(versionConflicts.id, conflictId));

    if (!conflict) {
      throw new Error('Conflict not found');
    }

    // For auto merge, use the conflict detection service
    if (strategy === 'auto_merge' && conflict.conflictDetails) {
      const analysis = conflict.conflictDetails as any;
      if (analysis.suggestedStrategy === 'auto' || analysis.autoResolvable) {
        resolvedData = await ConflictDetectionService.autoResolveConflicts(
          conflictId,
          analysis as ConflictAnalysis
        );
        notes = `Auto-merged using strategies: ${analysis.conflicts
          .map((c: any) => `${c.field}=${c.mergeStrategy}`)
          .join(', ')}`;
      } else {
        throw new Error('Conflict is not auto-resolvable');
      }
    }

    // Update conflict resolution
    await db.update(versionConflicts)
      .set({
        resolutionStatus: 'resolved',
        resolutionStrategy: strategy,
        resolvedData,
        resolvedBy: userId,
        resolvedAt: new Date(),
        resolutionNotes: notes
      })
      .where(eq(versionConflicts.id, conflictId));

    // Update the initiative version with resolved data
    if (strategy !== 'accept_baseline') {
      await db.update(artifactVersions)
        .set({
          artifactData: resolvedData,
          updatedBy: userId,
          updatedAt: new Date()
        })
        .where(eq(artifactVersions.id, conflict.initiativeVersionId));
    }
  }

  /**
   * Check in changes to an artifact
   */
  static async checkinArtifact(
    type: ArtifactType,
    artifactId: number,
    initiativeId: string,
    userId: number,
    updatedData: any,
    changeReason: string
  ): Promise<ArtifactVersion> {
    // Get current version
    const currentVersion = await this.getInitiativeVersion(type, artifactId, initiativeId);
    if (!currentVersion) {
      throw new Error("No checked out version found");
    }

    // Detect changed fields
    const changedFields = Object.keys(updatedData).filter(
      key => JSON.stringify(currentVersion.artifactData[key]) !== JSON.stringify(updatedData[key])
    );

    // Update the version with new data
    const [updated] = await db.update(artifactVersions)
      .set({
        artifactData: updatedData,
        changedFields,
        changeReason,
        updatedBy: userId,
        updatedAt: new Date(),
        versionNumber: currentVersion.versionNumber + 1
      })
      .where(eq(artifactVersions.id, currentVersion.id))
      .returning();

    // Release the lock
    await db.delete(artifactLocks)
      .where(
        and(
          eq(artifactLocks.artifactType, type),
          eq(artifactLocks.artifactId, artifactId),
          eq(artifactLocks.lockedBy, userId)
        )
      );

    // Check for conflicts with current baseline
    await this.detectConflicts(initiativeId);

    return updated;
  }

  /**
   * Baseline an initiative (deploy to production)
   */
  static async baselineInitiative(initiativeId: string, userId: number): Promise<void> {
    // Check for unresolved conflicts
    const unresolvedConflicts = await db.select()
      .from(versionConflicts)
      .where(
        and(
          eq(versionConflicts.initiativeId, initiativeId),
          eq(versionConflicts.resolutionStatus, 'pending')
        )
      );

    if (unresolvedConflicts.length > 0) {
      throw new Error(`Cannot baseline initiative with ${unresolvedConflicts.length} unresolved conflicts`);
    }

    // Get all initiative versions
    const versions = await db.select()
      .from(artifactVersions)
      .where(eq(artifactVersions.initiativeId, initiativeId));

    // Process each artifact
    for (const version of versions) {
      // Get resolved data if there was a conflict
      const [conflict] = await db.select()
        .from(versionConflicts)
        .where(
          and(
            eq(versionConflicts.initiativeId, initiativeId),
            eq(versionConflicts.artifactType, version.artifactType),
            eq(versionConflicts.artifactId, version.artifactId),
            eq(versionConflicts.resolutionStatus, 'resolved')
          )
        );

      const dataToBaseline = conflict?.resolvedData || version.artifactData;

      // Create new baseline version
      const [newBaseline] = await db.insert(artifactVersions).values({
        artifactType: version.artifactType,
        artifactId: version.artifactId,
        versionNumber: version.versionNumber,
        isBaseline: true,
        baselineDate: new Date(),
        baselinedBy: userId,
        artifactData: dataToBaseline,
        changedFields: version.changedFields,
        changeType: version.changeType,
        changeReason: `Baselined from initiative ${initiativeId}`,
        createdBy: userId
      }).returning();

      // Mark old baseline as non-baseline
      await db.update(artifactVersions)
        .set({ isBaseline: false })
        .where(
          and(
            eq(artifactVersions.artifactType, version.artifactType),
            eq(artifactVersions.artifactId, version.artifactId),
            eq(artifactVersions.isBaseline, true),
            sql`${artifactVersions.id} != ${newBaseline.id}`
          )
        );

      // Record baseline history
      await db.insert(baselineHistory).values({
        artifactType: version.artifactType,
        artifactId: version.artifactId,
        toVersionId: newBaseline.id,
        initiativeId,
        baselinedBy: userId,
        baselineReason: `Initiative ${initiativeId} deployment`
      });
    }

    // Mark initiative as completed
    await db.update(initiatives)
      .set({
        status: 'completed',
        actualCompletionDate: new Date(),
        updatedBy: userId,
        updatedAt: new Date()
      })
      .where(eq(initiatives.initiativeId, initiativeId));

    // Release all locks
    await db.delete(artifactLocks)
      .where(eq(artifactLocks.initiativeId, initiativeId));
  }

  /**
   * Helper: Calculate changed fields between two versions
   */
  private static calculateChangedFields(oldData: any, newData: any): string[] {
    const changes: string[] = [];
    
    const checkObject = (oldObj: any, newObj: any, path: string = '') => {
      const allKeys = new Set([...Object.keys(oldObj || {}), ...Object.keys(newObj || {})]);
      
      for (const key of allKeys) {
        const fullPath = path ? `${path}.${key}` : key;
        
        if (JSON.stringify(oldObj?.[key]) !== JSON.stringify(newObj?.[key])) {
          changes.push(fullPath);
        }
      }
    };

    checkObject(oldData, newData);
    return changes;
  }

  /**
   * Helper: Find conflicting fields between versions
   */
  private static findConflictingFields(
    originalBaseline: any,
    currentBaseline: any,
    initiativeVersion: any
  ): ConflictField[] {
    const conflicts: ConflictField[] = [];
    
    // Get fields changed in both baseline and initiative
    const baselineChanges = this.calculateChangedFields(originalBaseline, currentBaseline);
    const initiativeChanges = this.calculateChangedFields(originalBaseline, initiativeVersion);
    
    // Find overlapping changes
    const conflictingFieldNames = baselineChanges.filter(field => initiativeChanges.includes(field));
    
    for (const fieldName of conflictingFieldNames) {
      conflicts.push({
        fieldName,
        baselineValue: this.getFieldValue(currentBaseline, fieldName),
        initiativeValue: this.getFieldValue(initiativeVersion, fieldName)
      });
    }
    
    return conflicts;
  }

  /**
   * Helper: Get nested field value
   */
  private static getFieldValue(obj: any, path: string): any {
    return path.split('.').reduce((curr, key) => curr?.[key], obj);
  }
}