import { ArtifactType } from "./version-control.service";

export interface MergeContext {
  artifactType: ArtifactType;
  field: string;
  path: string[];
  originalValue: any;
  baselineValue: any;
  initiativeValue: any;
  metadata?: Record<string, any>;
}

export interface MergeResult {
  value: any;
  confidence: number; // 0-1 confidence in the merge
  explanation: string;
  requiresReview: boolean;
}

export class MergeStrategiesService {
  /**
   * Registry of merge strategies
   */
  private static strategies: Map<string, (context: MergeContext) => MergeResult> = new Map([
    ['concatenate', MergeStrategiesService.concatenateMerge],
    ['latest', MergeStrategiesService.latestMerge],
    ['increment', MergeStrategiesService.incrementMerge],
    ['average', MergeStrategiesService.averageMerge],
    ['state-machine', MergeStrategiesService.stateMachineMerge],
    ['array-merge', MergeStrategiesService.arrayMerge],
    ['object-merge', MergeStrategiesService.objectMerge],
    ['tm-forum-domain', MergeStrategiesService.tmForumDomainMerge],
    ['interface-contract', MergeStrategiesService.interfaceContractMerge]
  ]);

  /**
   * Apply merge strategy
   */
  static applyStrategy(strategy: string, context: MergeContext): MergeResult {
    const strategyFn = this.strategies.get(strategy);
    if (!strategyFn) {
      return {
        value: context.baselineValue,
        confidence: 0,
        explanation: `Unknown merge strategy: ${strategy}`,
        requiresReview: true
      };
    }
    return strategyFn(context);
  }

  /**
   * Concatenate text fields with clear separation
   */
  private static concatenateMerge(context: MergeContext): MergeResult {
    const { baselineValue, initiativeValue } = context;
    
    if (!baselineValue && !initiativeValue) {
      return {
        value: null,
        confidence: 1,
        explanation: 'Both values are empty',
        requiresReview: false
      };
    }

    if (!baselineValue) {
      return {
        value: initiativeValue,
        confidence: 1,
        explanation: 'Only initiative value exists',
        requiresReview: false
      };
    }

    if (!initiativeValue) {
      return {
        value: baselineValue,
        confidence: 1,
        explanation: 'Only baseline value exists',
        requiresReview: false
      };
    }

    // Check if one contains the other
    if (baselineValue.includes(initiativeValue)) {
      return {
        value: baselineValue,
        confidence: 0.9,
        explanation: 'Baseline already contains initiative changes',
        requiresReview: false
      };
    }

    if (initiativeValue.includes(baselineValue)) {
      return {
        value: initiativeValue,
        confidence: 0.9,
        explanation: 'Initiative already contains baseline changes',
        requiresReview: false
      };
    }

    // Concatenate with clear separation
    const merged = `${baselineValue}\n\n--- Merged from Initiative ---\n${initiativeValue}`;
    
    return {
      value: merged,
      confidence: 0.7,
      explanation: 'Concatenated both values with clear separation',
      requiresReview: true
    };
  }

  /**
   * Take the latest timestamp
   */
  private static latestMerge(context: MergeContext): MergeResult {
    const { baselineValue, initiativeValue } = context;
    
    const baseDate = new Date(baselineValue);
    const initDate = new Date(initiativeValue);
    
    if (isNaN(baseDate.getTime()) || isNaN(initDate.getTime())) {
      return {
        value: initiativeValue,
        confidence: 0.5,
        explanation: 'Invalid date format detected',
        requiresReview: true
      };
    }

    const latest = baseDate > initDate ? baselineValue : initiativeValue;
    const source = baseDate > initDate ? 'baseline' : 'initiative';
    
    return {
      value: latest,
      confidence: 1,
      explanation: `Selected ${source} value as it's more recent`,
      requiresReview: false
    };
  }

  /**
   * Increment version numbers intelligently
   */
  private static incrementMerge(context: MergeContext): MergeResult {
    const { originalValue, baselineValue, initiativeValue } = context;
    
    // Parse semantic versions
    const parseVersion = (v: string) => {
      const match = v.match(/(\d+)\.(\d+)(?:\.(\d+))?/);
      if (!match) return null;
      return {
        major: parseInt(match[1]),
        minor: parseInt(match[2]),
        patch: match[3] ? parseInt(match[3]) : 0
      };
    };

    const origVer = parseVersion(originalValue);
    const baseVer = parseVersion(baselineValue);
    const initVer = parseVersion(initiativeValue);

    if (!origVer || !baseVer || !initVer) {
      return {
        value: initiativeValue,
        confidence: 0.5,
        explanation: 'Unable to parse version format',
        requiresReview: true
      };
    }

    // Determine version increment strategy
    let merged = { ...baseVer };
    
    // If both changed major version, requires review
    if (baseVer.major > origVer.major && initVer.major > origVer.major) {
      return {
        value: `${Math.max(baseVer.major, initVer.major)}.0.0`,
        confidence: 0.5,
        explanation: 'Both branches incremented major version',
        requiresReview: true
      };
    }

    // Take highest of each component
    merged.major = Math.max(baseVer.major, initVer.major);
    merged.minor = Math.max(baseVer.minor, initVer.minor);
    merged.patch = Math.max(baseVer.patch, initVer.patch);

    // If there was a conflict, increment patch
    if (baseVer.major === initVer.major && 
        baseVer.minor === initVer.minor && 
        baseVer.patch === initVer.patch) {
      merged.patch++;
    }

    const mergedVersion = `${merged.major}.${merged.minor}.${merged.patch}`;
    
    return {
      value: mergedVersion,
      confidence: 0.8,
      explanation: 'Merged version numbers taking highest components',
      requiresReview: false
    };
  }

  /**
   * Average numeric values
   */
  private static averageMerge(context: MergeContext): MergeResult {
    const { baselineValue, initiativeValue } = context;
    
    if (typeof baselineValue !== 'number' || typeof initiativeValue !== 'number') {
      return {
        value: baselineValue,
        confidence: 0,
        explanation: 'Values are not numeric',
        requiresReview: true
      };
    }

    const avg = (baselineValue + initiativeValue) / 2;
    const diff = Math.abs(baselineValue - initiativeValue);
    const percentDiff = diff / Math.max(baselineValue, initiativeValue);
    
    return {
      value: avg,
      confidence: percentDiff < 0.1 ? 0.9 : 0.6,
      explanation: `Averaged values (${percentDiff * 100}% difference)`,
      requiresReview: percentDiff > 0.2
    };
  }

  /**
   * State machine based merge for status fields
   */
  private static stateMachineMerge(context: MergeContext): MergeResult {
    const { field, baselineValue, initiativeValue } = context;
    
    // Define state precedence for different fields
    const statePrecedence: Record<string, string[]> = {
      status: [
        'active',
        'in_progress',
        'under_review',
        'maintenance',
        'inactive',
        'deprecated',
        'decommissioned'
      ],
      approvalStatus: [
        'approved',
        'pending',
        'under_review',
        'rejected',
        'draft'
      ]
    };

    const states = statePrecedence[field] || statePrecedence.status;
    const baseIndex = states.indexOf(baselineValue);
    const initIndex = states.indexOf(initiativeValue);

    if (baseIndex === -1 || initIndex === -1) {
      return {
        value: baselineValue,
        confidence: 0.5,
        explanation: 'Unknown status value',
        requiresReview: true
      };
    }

    // Take the "higher" state (lower index = more active/approved)
    const selected = baseIndex < initIndex ? baselineValue : initiativeValue;
    const source = baseIndex < initIndex ? 'baseline' : 'initiative';
    
    return {
      value: selected,
      confidence: 0.8,
      explanation: `Selected ${source} status as it represents a more active state`,
      requiresReview: Math.abs(baseIndex - initIndex) > 2
    };
  }

  /**
   * Merge arrays intelligently
   */
  private static arrayMerge(context: MergeContext): MergeResult {
    const { originalValue, baselineValue, initiativeValue } = context;
    
    if (!Array.isArray(baselineValue) || !Array.isArray(initiativeValue)) {
      return {
        value: baselineValue,
        confidence: 0,
        explanation: 'Values are not arrays',
        requiresReview: true
      };
    }

    const original = Array.isArray(originalValue) ? originalValue : [];
    
    // Track additions and removals
    const baseAdded = baselineValue.filter(item => !original.includes(item));
    const baseRemoved = original.filter(item => !baselineValue.includes(item));
    const initAdded = initiativeValue.filter(item => !original.includes(item));
    const initRemoved = original.filter(item => !initiativeValue.includes(item));

    // Check for conflicts
    const conflictingRemovals = baseRemoved.filter(item => initAdded.includes(item)) ||
                               initRemoved.filter(item => baseAdded.includes(item));

    if (conflictingRemovals.length > 0) {
      return {
        value: [...new Set([...baselineValue, ...initiativeValue])],
        confidence: 0.5,
        explanation: 'Conflicting additions and removals detected',
        requiresReview: true
      };
    }

    // Merge arrays preserving all additions and removals
    const merged = original
      .filter(item => !baseRemoved.includes(item) && !initRemoved.includes(item))
      .concat(baseAdded)
      .concat(initAdded.filter(item => !baseAdded.includes(item)));

    return {
      value: [...new Set(merged)],
      confidence: 0.8,
      explanation: 'Merged arrays preserving all changes',
      requiresReview: false
    };
  }

  /**
   * Deep merge objects
   */
  private static objectMerge(context: MergeContext): MergeResult {
    const { originalValue, baselineValue, initiativeValue } = context;
    
    if (typeof baselineValue !== 'object' || typeof initiativeValue !== 'object') {
      return {
        value: baselineValue,
        confidence: 0,
        explanation: 'Values are not objects',
        requiresReview: true
      };
    }

    const merged: any = {};
    const conflicts: string[] = [];
    
    // Get all keys
    const allKeys = new Set([
      ...Object.keys(originalValue || {}),
      ...Object.keys(baselineValue || {}),
      ...Object.keys(initiativeValue || {})
    ]);

    for (const key of allKeys) {
      const orig = originalValue?.[key];
      const base = baselineValue?.[key];
      const init = initiativeValue?.[key];

      // No changes
      if (JSON.stringify(base) === JSON.stringify(init)) {
        merged[key] = base;
        continue;
      }

      // Only baseline changed
      if (JSON.stringify(orig) === JSON.stringify(init)) {
        merged[key] = base;
        continue;
      }

      // Only initiative changed
      if (JSON.stringify(orig) === JSON.stringify(base)) {
        merged[key] = init;
        continue;
      }

      // Both changed - conflict
      conflicts.push(key);
      // For now, prefer baseline in conflicts
      merged[key] = base;
    }

    return {
      value: merged,
      confidence: conflicts.length === 0 ? 1 : 0.6,
      explanation: conflicts.length > 0 
        ? `Conflicts in fields: ${conflicts.join(', ')}`
        : 'Objects merged without conflicts',
      requiresReview: conflicts.length > 0
    };
  }

  /**
   * TM Forum domain-specific merge
   */
  private static tmForumDomainMerge(context: MergeContext): MergeResult {
    const { field, baselineValue, initiativeValue } = context;
    
    // TM Forum domain hierarchy
    const domainHierarchy: Record<string, number> = {
      'enterprise': 1,
      'customer': 2,
      'product': 3,
      'service': 4,
      'resource': 5,
      'partner': 6
    };

    const basePriority = domainHierarchy[baselineValue] || 999;
    const initPriority = domainHierarchy[initiativeValue] || 999;

    // If moving to a higher-level domain, requires review
    if (basePriority < initPriority && initPriority < 999) {
      return {
        value: baselineValue,
        confidence: 0.7,
        explanation: 'Baseline represents a higher-level domain',
        requiresReview: true
      };
    }

    return {
      value: initiativeValue,
      confidence: 0.8,
      explanation: 'Initiative value selected for domain classification',
      requiresReview: Math.abs(basePriority - initPriority) > 2
    };
  }

  /**
   * Interface contract-specific merge
   */
  private static interfaceContractMerge(context: MergeContext): MergeResult {
    const { field, baselineValue, initiativeValue } = context;
    
    // Critical interface fields that affect contract
    const criticalFields = ['interfaceType', 'protocol', 'dataFlow', 'middleware'];
    
    if (criticalFields.includes(field)) {
      // Any change to critical fields requires review
      return {
        value: initiativeValue,
        confidence: 0.5,
        explanation: 'Critical interface contract field changed',
        requiresReview: true
      };
    }

    // For non-critical fields, use standard merge
    return {
      value: initiativeValue,
      confidence: 0.8,
      explanation: 'Non-critical interface field updated',
      requiresReview: false
    };
  }

  /**
   * Get appropriate merge strategy for a field
   */
  static getStrategyForField(
    artifactType: ArtifactType,
    field: string,
    fieldType: string
  ): string {
    // Special cases first
    if (field === 'status' || field.includes('Status')) {
      return 'state-machine';
    }

    if (field === 'version' || field.includes('Version')) {
      return 'increment';
    }

    if (field.includes('Date') || field.includes('At')) {
      return 'latest';
    }

    if (field === 'description' || field === 'documentation' || field === 'notes') {
      return 'concatenate';
    }

    if (field.startsWith('tmf')) {
      return 'tm-forum-domain';
    }

    if (artifactType === 'interface' && 
        ['interfaceType', 'protocol', 'dataFlow', 'middleware'].includes(field)) {
      return 'interface-contract';
    }

    // Type-based strategies
    if (fieldType === 'array') {
      return 'array-merge';
    }

    if (fieldType === 'object') {
      return 'object-merge';
    }

    if (fieldType === 'number') {
      return 'average';
    }

    // Default
    return 'manual';
  }
}