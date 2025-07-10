import { db } from "../db";
import { 
  artifactVersions, 
  versionConflicts,
  versionDependencies,
  ArtifactVersion,
  VersionConflict
} from "@db/schema";
import { eq, and, or, inArray, sql } from "drizzle-orm";
import { ArtifactType } from "./version-control.service";

export interface DetailedConflict {
  field: string;
  path: string[];
  originalValue: any;
  baselineValue: any;
  initiativeValue: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
  autoResolvable: boolean;
  suggestedResolution?: 'baseline' | 'initiative' | 'merge';
  mergeStrategy?: string;
}

export interface ConflictAnalysis {
  artifactType: ArtifactType;
  artifactId: number;
  conflicts: DetailedConflict[];
  dependencies: DependencyImpact[];
  riskScore: number;
  autoResolvable: boolean;
  suggestedStrategy: 'auto' | 'manual' | 'escalate';
}

export interface DependencyImpact {
  dependentArtifact: {
    type: ArtifactType;
    id: number;
    name: string;
  };
  impactType: 'breaking' | 'warning' | 'info';
  description: string;
}

export class ConflictDetectionService {
  // Field severity mapping for different artifact types
  private static readonly FIELD_SEVERITY_MAP: Record<ArtifactType, Record<string, 'low' | 'medium' | 'high' | 'critical'>> = {
    application: {
      name: 'critical',
      amlNumber: 'critical',
      status: 'high',
      providesExtInterface: 'high',
      consumesExtInterfaces: 'high',
      deployment: 'medium',
      description: 'low',
      purpose: 'low',
      uptime: 'medium',
      decommissionDate: 'high',
      team: 'medium',
      tmfDomain: 'medium'
    },
    interface: {
      imlNumber: 'critical',
      providerApplicationId: 'critical',
      consumerApplicationId: 'critical',
      interfaceType: 'high',
      middleware: 'high',
      status: 'high',
      version: 'high',
      protocol: 'high',
      dataFlow: 'medium',
      frequency: 'medium',
      description: 'low',
      sampleCode: 'low'
    },
    business_process: {
      processId: 'critical',
      name: 'critical',
      status: 'high',
      processType: 'high',
      businessFunction: 'high',
      startEvent: 'medium',
      endEvent: 'medium',
      description: 'low',
      documentation: 'low'
    },
    internal_process: {
      name: 'critical',
      status: 'high',
      department: 'medium',
      processFlow: 'high',
      description: 'low'
    },
    technical_process: {
      name: 'critical',
      status: 'high',
      technology: 'medium',
      implementation: 'high',
      description: 'low'
    }
  };

  // Auto-resolvable field patterns
  private static readonly AUTO_RESOLVABLE_FIELDS = [
    'updatedAt',
    'lastChangeDate',
    'description',
    'documentation',
    'notes',
    'comments'
  ];

  /**
   * Perform deep conflict analysis for an initiative
   */
  static async analyzeInitiativeConflicts(initiativeId: string): Promise<ConflictAnalysis[]> {
    const analyses: ConflictAnalysis[] = [];

    // Get all artifacts modified in this initiative
    const initiativeVersions = await db.select()
      .from(artifactVersions)
      .where(eq(artifactVersions.initiativeId, initiativeId));

    for (const version of initiativeVersions) {
      const analysis = await this.analyzeArtifactConflicts(
        version.artifactType as ArtifactType,
        version.artifactId,
        initiativeId
      );
      
      if (analysis.conflicts.length > 0) {
        analyses.push(analysis);
      }
    }

    return analyses;
  }

  /**
   * Analyze conflicts for a specific artifact
   */
  static async analyzeArtifactConflicts(
    type: ArtifactType,
    artifactId: number,
    initiativeId: string
  ): Promise<ConflictAnalysis> {
    // Get versions
    const [initiativeVersion] = await db.select()
      .from(artifactVersions)
      .where(
        and(
          eq(artifactVersions.artifactType, type),
          eq(artifactVersions.artifactId, artifactId),
          eq(artifactVersions.initiativeId, initiativeId)
        )
      )
      .orderBy(sql`${artifactVersions.versionNumber} DESC`)
      .limit(1);

    if (!initiativeVersion) {
      return {
        artifactType: type,
        artifactId,
        conflicts: [],
        dependencies: [],
        riskScore: 0,
        autoResolvable: true,
        suggestedStrategy: 'auto'
      };
    }

    // Get original baseline when initiative started
    const [originalBaseline] = await db.select()
      .from(artifactVersions)
      .where(
        and(
          eq(artifactVersions.artifactType, type),
          eq(artifactVersions.artifactId, artifactId),
          eq(artifactVersions.isBaseline, true),
          sql`${artifactVersions.baselineDate} <= ${initiativeVersion.createdAt}`
        )
      )
      .orderBy(sql`${artifactVersions.baselineDate} DESC`)
      .limit(1);

    // Get current baseline
    const [currentBaseline] = await db.select()
      .from(artifactVersions)
      .where(
        and(
          eq(artifactVersions.artifactType, type),
          eq(artifactVersions.artifactId, artifactId),
          eq(artifactVersions.isBaseline, true)
        )
      )
      .orderBy(sql`${artifactVersions.versionNumber} DESC`)
      .limit(1);

    if (!originalBaseline || !currentBaseline) {
      return {
        artifactType: type,
        artifactId,
        conflicts: [],
        dependencies: [],
        riskScore: 0,
        autoResolvable: true,
        suggestedStrategy: 'auto'
      };
    }

    // Detect conflicts
    const conflicts = this.detectDetailedConflicts(
      type,
      originalBaseline.artifactData,
      currentBaseline.artifactData,
      initiativeVersion.artifactData
    );

    // Analyze dependencies
    const dependencies = await this.analyzeDependencyImpacts(
      type,
      artifactId,
      conflicts
    );

    // Calculate risk score
    const riskScore = this.calculateRiskScore(conflicts, dependencies);

    // Determine strategy
    const autoResolvable = conflicts.every(c => c.autoResolvable);
    const suggestedStrategy = this.determineSuggestedStrategy(
      riskScore,
      autoResolvable,
      conflicts.length
    );

    return {
      artifactType: type,
      artifactId,
      conflicts,
      dependencies,
      riskScore,
      autoResolvable,
      suggestedStrategy
    };
  }

  /**
   * Detect detailed conflicts with severity and resolution suggestions
   */
  private static detectDetailedConflicts(
    type: ArtifactType,
    original: any,
    baseline: any,
    initiative: any
  ): DetailedConflict[] {
    const conflicts: DetailedConflict[] = [];
    const severityMap = this.FIELD_SEVERITY_MAP[type] || {};

    const analyzeObject = (
      origObj: any,
      baseObj: any,
      initObj: any,
      path: string[] = []
    ) => {
      const allKeys = new Set([
        ...Object.keys(origObj || {}),
        ...Object.keys(baseObj || {}),
        ...Object.keys(initObj || {})
      ]);

      for (const key of allKeys) {
        const currentPath = [...path, key];
        const fieldPath = currentPath.join('.');
        
        const origVal = origObj?.[key];
        const baseVal = baseObj?.[key];
        const initVal = initObj?.[key];

        // Check if field changed in both baseline and initiative
        const baselineChanged = JSON.stringify(origVal) !== JSON.stringify(baseVal);
        const initiativeChanged = JSON.stringify(origVal) !== JSON.stringify(initVal);

        if (baselineChanged && initiativeChanged) {
          // Conflict detected
          const severity = severityMap[fieldPath] || 
                          (this.AUTO_RESOLVABLE_FIELDS.includes(key) ? 'low' : 'medium');
          
          const autoResolvable = this.isAutoResolvable(key, fieldPath, baseVal, initVal);
          const suggestedResolution = this.suggestResolution(
            key,
            fieldPath,
            origVal,
            baseVal,
            initVal
          );

          conflicts.push({
            field: key,
            path: currentPath,
            originalValue: origVal,
            baselineValue: baseVal,
            initiativeValue: initVal,
            severity,
            autoResolvable,
            suggestedResolution,
            mergeStrategy: this.getMergeStrategy(key, fieldPath, type)
          });
        } else if (typeof origVal === 'object' && origVal !== null && 
                   !Array.isArray(origVal) && !(origVal instanceof Date)) {
          // Recurse into nested objects
          analyzeObject(origVal, baseVal || {}, initVal || {}, currentPath);
        }
      }
    };

    analyzeObject(original, baseline, initiative);
    return conflicts;
  }

  /**
   * Determine if a conflict is auto-resolvable
   */
  private static isAutoResolvable(
    field: string,
    path: string,
    baselineValue: any,
    initiativeValue: any
  ): boolean {
    // Timestamp fields are auto-resolvable (take latest)
    if (field.includes('Date') || field.includes('At')) {
      return true;
    }

    // Description fields where one is a substring of the other
    if (this.AUTO_RESOLVABLE_FIELDS.includes(field)) {
      if (typeof baselineValue === 'string' && typeof initiativeValue === 'string') {
        return baselineValue.includes(initiativeValue) || 
               initiativeValue.includes(baselineValue);
      }
      return true;
    }

    // Numeric fields where the difference is minor
    if (typeof baselineValue === 'number' && typeof initiativeValue === 'number') {
      const diff = Math.abs(baselineValue - initiativeValue);
      const avg = (baselineValue + initiativeValue) / 2;
      return diff / avg < 0.1; // Less than 10% difference
    }

    return false;
  }

  /**
   * Suggest resolution strategy for a conflict
   */
  private static suggestResolution(
    field: string,
    path: string,
    originalValue: any,
    baselineValue: any,
    initiativeValue: any
  ): 'baseline' | 'initiative' | 'merge' {
    // For status fields, prefer active/enabled states
    if (field === 'status') {
      if (baselineValue === 'active' || baselineValue === 'enabled') return 'baseline';
      if (initiativeValue === 'active' || initiativeValue === 'enabled') return 'initiative';
    }

    // For version fields, prefer higher version
    if (field === 'version' || field.includes('Version')) {
      if (typeof baselineValue === 'string' && typeof initiativeValue === 'string') {
        return baselineValue.localeCompare(initiativeValue) > 0 ? 'baseline' : 'initiative';
      }
    }

    // For timestamp fields, prefer latest
    if (field.includes('Date') || field.includes('At')) {
      const baseDate = new Date(baselineValue).getTime();
      const initDate = new Date(initiativeValue).getTime();
      return baseDate > initDate ? 'baseline' : 'initiative';
    }

    // For description fields, suggest merge if both have content
    if (this.AUTO_RESOLVABLE_FIELDS.includes(field)) {
      if (baselineValue && initiativeValue && 
          baselineValue !== initiativeValue) {
        return 'merge';
      }
    }

    // Default: manual review needed
    return 'merge';
  }

  /**
   * Get merge strategy for a field
   */
  private static getMergeStrategy(
    field: string,
    path: string,
    type: ArtifactType
  ): string {
    if (field === 'description' || field === 'documentation') {
      return 'concatenate';
    }

    if (field.includes('Date') || field.includes('At')) {
      return 'latest';
    }

    if (field === 'version') {
      return 'increment';
    }

    if (field === 'status') {
      return 'state-machine';
    }

    if (typeof field === 'number') {
      return 'average';
    }

    return 'manual';
  }

  /**
   * Analyze dependency impacts
   */
  private static async analyzeDependencyImpacts(
    type: ArtifactType,
    artifactId: number,
    conflicts: DetailedConflict[]
  ): Promise<DependencyImpact[]> {
    const impacts: DependencyImpact[] = [];

    // Get direct dependencies
    const dependencies = await db.select({
      dep: versionDependencies,
      version: artifactVersions
    })
    .from(versionDependencies)
    .innerJoin(
      artifactVersions,
      eq(artifactVersions.id, versionDependencies.toVersionId)
    )
    .where(
      and(
        eq(artifactVersions.artifactType, type),
        eq(artifactVersions.artifactId, artifactId),
        eq(artifactVersions.isBaseline, true)
      )
    );

    // Analyze impact based on conflict severity
    for (const dep of dependencies) {
      const criticalConflicts = conflicts.filter(c => c.severity === 'critical');
      const highConflicts = conflicts.filter(c => c.severity === 'high');

      if (criticalConflicts.length > 0) {
        impacts.push({
          dependentArtifact: {
            type: dep.version.artifactType as ArtifactType,
            id: dep.version.artifactId,
            name: `${dep.version.artifactType}-${dep.version.artifactId}`
          },
          impactType: 'breaking',
          description: `Critical changes to ${criticalConflicts.map(c => c.field).join(', ')} may break this dependency`
        });
      } else if (highConflicts.length > 0 && dep.dep.dependencyStrength === 'strong') {
        impacts.push({
          dependentArtifact: {
            type: dep.version.artifactType as ArtifactType,
            id: dep.version.artifactId,
            name: `${dep.version.artifactType}-${dep.version.artifactId}`
          },
          impactType: 'warning',
          description: `Changes to ${highConflicts.map(c => c.field).join(', ')} may affect this dependency`
        });
      }
    }

    // Special handling for interface changes
    if (type === 'interface') {
      const interfaceConflicts = conflicts.filter(c => 
        ['interfaceType', 'protocol', 'dataFlow', 'middleware'].includes(c.field)
      );
      
      if (interfaceConflicts.length > 0) {
        // This would need to query consumer/provider applications
        // For now, we'll add a generic warning
        impacts.push({
          dependentArtifact: {
            type: 'application',
            id: 0,
            name: 'Consumer/Provider Applications'
          },
          impactType: 'warning',
          description: 'Interface contract changes may require updates to consumer and provider applications'
        });
      }
    }

    return impacts;
  }

  /**
   * Calculate risk score based on conflicts and dependencies
   */
  private static calculateRiskScore(
    conflicts: DetailedConflict[],
    dependencies: DependencyImpact[]
  ): number {
    let score = 0;

    // Conflict severity scoring
    const severityScores = {
      low: 1,
      medium: 3,
      high: 5,
      critical: 10
    };

    for (const conflict of conflicts) {
      score += severityScores[conflict.severity];
      if (!conflict.autoResolvable) {
        score += 2; // Additional penalty for manual resolution
      }
    }

    // Dependency impact scoring
    const impactScores = {
      info: 1,
      warning: 5,
      breaking: 15
    };

    for (const dep of dependencies) {
      score += impactScores[dep.impactType];
    }

    // Normalize to 0-100 scale
    return Math.min(100, score);
  }

  /**
   * Determine suggested resolution strategy
   */
  private static determineSuggestedStrategy(
    riskScore: number,
    autoResolvable: boolean,
    conflictCount: number
  ): 'auto' | 'manual' | 'escalate' {
    if (riskScore > 50 || conflictCount > 10) {
      return 'escalate';
    }

    if (autoResolvable && riskScore < 20) {
      return 'auto';
    }

    return 'manual';
  }

  /**
   * Automatically resolve conflicts where possible
   */
  static async autoResolveConflicts(
    conflictId: number,
    analysis: ConflictAnalysis
  ): Promise<any> {
    const resolvedData: any = {};

    for (const conflict of analysis.conflicts) {
      if (!conflict.autoResolvable) continue;

      const value = this.autoResolveField(conflict);
      this.setNestedValue(resolvedData, conflict.path, value);
    }

    return resolvedData;
  }

  /**
   * Auto-resolve a single field conflict
   */
  private static autoResolveField(conflict: DetailedConflict): any {
    switch (conflict.mergeStrategy) {
      case 'latest':
        const baseDate = new Date(conflict.baselineValue).getTime();
        const initDate = new Date(conflict.initiativeValue).getTime();
        return baseDate > initDate ? conflict.baselineValue : conflict.initiativeValue;

      case 'concatenate':
        if (conflict.baselineValue && conflict.initiativeValue) {
          return `${conflict.baselineValue}\n\n[Merged from initiative]\n${conflict.initiativeValue}`;
        }
        return conflict.baselineValue || conflict.initiativeValue;

      case 'increment':
        // For version fields, take the higher one
        return conflict.suggestedResolution === 'baseline' 
          ? conflict.baselineValue 
          : conflict.initiativeValue;

      case 'average':
        if (typeof conflict.baselineValue === 'number' && 
            typeof conflict.initiativeValue === 'number') {
          return (conflict.baselineValue + conflict.initiativeValue) / 2;
        }
        return conflict.baselineValue;

      default:
        // Use suggested resolution
        return conflict.suggestedResolution === 'baseline'
          ? conflict.baselineValue
          : conflict.initiativeValue;
    }
  }

  /**
   * Set nested value in object
   */
  private static setNestedValue(obj: any, path: string[], value: any): void {
    let current = obj;
    for (let i = 0; i < path.length - 1; i++) {
      if (!current[path[i]]) {
        current[path[i]] = {};
      }
      current = current[path[i]];
    }
    current[path[path.length - 1]] = value;
  }
}