import { db } from "../db";
import { 
  artifactVersions,
  versionDependencies,
  applications,
  interfaces,
  businessProcesses,
  businessProcessInterfaces
} from "@db/schema";
import { eq, and, or, inArray, sql } from "drizzle-orm";
import { ArtifactType } from "./version-control.service";

export interface DependencyGraph {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
  cycles: DependencyCycle[];
  impactAnalysis: ImpactAnalysis;
}

export interface DependencyNode {
  id: string;
  type: ArtifactType;
  artifactId: number;
  name: string;
  version: number;
  metadata: Record<string, any>;
}

export interface DependencyEdge {
  from: string;
  to: string;
  type: 'requires' | 'impacts' | 'related_to' | 'consumes' | 'provides';
  strength: 'strong' | 'weak' | 'optional';
  description?: string;
}

export interface DependencyCycle {
  nodes: string[];
  severity: 'warning' | 'error';
  description: string;
}

export interface ImpactAnalysis {
  directImpacts: number;
  indirectImpacts: number;
  criticalPaths: string[][];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export class DependencyTrackingService {
  /**
   * Build complete dependency graph for an artifact
   */
  static async buildDependencyGraph(
    type: ArtifactType,
    artifactId: number,
    maxDepth: number = 3
  ): Promise<DependencyGraph> {
    const nodes = new Map<string, DependencyNode>();
    const edges: DependencyEdge[] = [];
    const visited = new Set<string>();

    // Build graph recursively
    await this.buildGraphRecursive(
      type,
      artifactId,
      nodes,
      edges,
      visited,
      0,
      maxDepth
    );

    // Detect cycles
    const cycles = this.detectCycles(Array.from(nodes.values()), edges);

    // Perform impact analysis
    const rootId = `${type}-${artifactId}`;
    const impactAnalysis = this.analyzeImpact(rootId, nodes, edges);

    return {
      nodes: Array.from(nodes.values()),
      edges,
      cycles,
      impactAnalysis
    };
  }

  /**
   * Recursively build dependency graph
   */
  private static async buildGraphRecursive(
    type: ArtifactType,
    artifactId: number,
    nodes: Map<string, DependencyNode>,
    edges: DependencyEdge[],
    visited: Set<string>,
    currentDepth: number,
    maxDepth: number
  ): Promise<void> {
    const nodeId = `${type}-${artifactId}`;
    
    if (visited.has(nodeId) || currentDepth > maxDepth) {
      return;
    }
    
    visited.add(nodeId);

    // Get artifact details
    const artifactDetails = await this.getArtifactDetails(type, artifactId);
    if (!artifactDetails) return;

    // Add node
    nodes.set(nodeId, {
      id: nodeId,
      type,
      artifactId,
      name: artifactDetails.name,
      version: artifactDetails.version || 1,
      metadata: artifactDetails.metadata || {}
    });

    // Get dependencies based on artifact type
    const dependencies = await this.getArtifactDependencies(type, artifactId);

    for (const dep of dependencies) {
      const depNodeId = `${dep.type}-${dep.artifactId}`;
      
      // Add edge
      edges.push({
        from: nodeId,
        to: depNodeId,
        type: dep.dependencyType,
        strength: dep.strength,
        description: dep.description
      });

      // Recurse
      await this.buildGraphRecursive(
        dep.type,
        dep.artifactId,
        nodes,
        edges,
        visited,
        currentDepth + 1,
        maxDepth
      );
    }
  }

  /**
   * Get artifact details
   */
  private static async getArtifactDetails(
    type: ArtifactType,
    artifactId: number
  ): Promise<any> {
    switch (type) {
      case 'application':
        const [app] = await db.select({
          name: applications.name,
          version: sql<number>`1`,
          metadata: sql<any>`jsonb_build_object(
            'status', ${applications.status},
            'lob', ${applications.lob},
            'criticality', ${applications.criticality}
          )`
        })
        .from(applications)
        .where(eq(applications.id, artifactId));
        return app;

      case 'interface':
        const [iface] = await db.select({
          name: interfaces.imlNumber,
          version: interfaces.version,
          metadata: sql<any>`jsonb_build_object(
            'type', ${interfaces.interfaceType},
            'status', ${interfaces.status},
            'middleware', ${interfaces.middleware}
          )`
        })
        .from(interfaces)
        .where(eq(interfaces.id, artifactId));
        return iface;

      case 'business_process':
        const [bp] = await db.select({
          name: businessProcesses.name,
          version: businessProcesses.version,
          metadata: sql<any>`jsonb_build_object(
            'lob', ${businessProcesses.lob},
            'processType', ${businessProcesses.processType}
          )`
        })
        .from(businessProcesses)
        .where(eq(businessProcesses.id, artifactId));
        return bp;

      default:
        return null;
    }
  }

  /**
   * Get dependencies for an artifact
   */
  private static async getArtifactDependencies(
    type: ArtifactType,
    artifactId: number
  ): Promise<Array<{
    type: ArtifactType;
    artifactId: number;
    dependencyType: 'requires' | 'impacts' | 'related_to' | 'consumes' | 'provides';
    strength: 'strong' | 'weak' | 'optional';
    description?: string;
  }>> {
    const dependencies: any[] = [];

    switch (type) {
      case 'application':
        // Get interfaces where this app is provider
        const providedInterfaces = await db.select({
          artifactId: interfaces.id
        })
        .from(interfaces)
        .where(eq(interfaces.providerApplicationId, artifactId));

        for (const iface of providedInterfaces) {
          dependencies.push({
            type: 'interface' as ArtifactType,
            artifactId: iface.artifactId,
            dependencyType: 'provides',
            strength: 'strong'
          });
        }

        // Get interfaces where this app is consumer
        const consumedInterfaces = await db.select({
          artifactId: interfaces.id
        })
        .from(interfaces)
        .where(eq(interfaces.consumerApplicationId, artifactId));

        for (const iface of consumedInterfaces) {
          dependencies.push({
            type: 'interface' as ArtifactType,
            artifactId: iface.artifactId,
            dependencyType: 'consumes',
            strength: 'strong'
          });
        }
        break;

      case 'interface':
        // Get provider and consumer applications
        const [iface] = await db.select()
          .from(interfaces)
          .where(eq(interfaces.id, artifactId));

        if (iface) {
          if (iface.providerApplicationId) {
            dependencies.push({
              type: 'application' as ArtifactType,
              artifactId: iface.providerApplicationId,
              dependencyType: 'requires',
              strength: 'strong',
              description: 'Provider application'
            });
          }

          if (iface.consumerApplicationId) {
            dependencies.push({
              type: 'application' as ArtifactType,
              artifactId: iface.consumerApplicationId,
              dependencyType: 'requires',
              strength: 'strong',
              description: 'Consumer application'
            });
          }
        }

        // Get business processes using this interface
        const businessProcesses = await db.select({
          processId: businessProcessInterfaces.businessProcessId
        })
        .from(businessProcessInterfaces)
        .where(eq(businessProcessInterfaces.interfaceId, artifactId));

        for (const bp of businessProcesses) {
          dependencies.push({
            type: 'business_process' as ArtifactType,
            artifactId: bp.processId,
            dependencyType: 'impacts',
            strength: 'medium'
          });
        }
        break;

      case 'business_process':
        // Get interfaces used by this process
        const usedInterfaces = await db.select({
          interfaceId: businessProcessInterfaces.interfaceId
        })
        .from(businessProcessInterfaces)
        .where(eq(businessProcessInterfaces.businessProcessId, artifactId));

        for (const iface of usedInterfaces) {
          dependencies.push({
            type: 'interface' as ArtifactType,
            artifactId: iface.interfaceId,
            dependencyType: 'requires',
            strength: 'strong'
          });
        }
        break;
    }

    // Get version-based dependencies
    const versionDeps = await db.select({
      toVersion: artifactVersions,
      dep: versionDependencies
    })
    .from(versionDependencies)
    .innerJoin(
      artifactVersions,
      eq(artifactVersions.id, versionDependencies.fromVersionId)
    )
    .where(
      and(
        eq(artifactVersions.artifactType, type),
        eq(artifactVersions.artifactId, artifactId),
        eq(artifactVersions.isBaseline, true)
      )
    );

    for (const vDep of versionDeps) {
      dependencies.push({
        type: vDep.toVersion.artifactType as ArtifactType,
        artifactId: vDep.toVersion.artifactId,
        dependencyType: vDep.dep.dependencyType as any,
        strength: vDep.dep.dependencyStrength as any,
        description: vDep.dep.description
      });
    }

    return dependencies;
  }

  /**
   * Detect dependency cycles
   */
  private static detectCycles(
    nodes: DependencyNode[],
    edges: DependencyEdge[]
  ): DependencyCycle[] {
    const cycles: DependencyCycle[] = [];
    const adjacencyList = new Map<string, string[]>();

    // Build adjacency list
    for (const edge of edges) {
      if (!adjacencyList.has(edge.from)) {
        adjacencyList.set(edge.from, []);
      }
      adjacencyList.get(edge.from)!.push(edge.to);
    }

    // DFS to detect cycles
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const path: string[] = [];

    const dfs = (node: string): void => {
      visited.add(node);
      recursionStack.add(node);
      path.push(node);

      const neighbors = adjacencyList.get(node) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          dfs(neighbor);
        } else if (recursionStack.has(neighbor)) {
          // Cycle detected
          const cycleStart = path.indexOf(neighbor);
          const cycle = path.slice(cycleStart);
          cycle.push(neighbor); // Complete the cycle

          cycles.push({
            nodes: cycle,
            severity: cycle.length > 3 ? 'error' : 'warning',
            description: `Circular dependency: ${cycle.join(' → ')}`
          });
        }
      }

      path.pop();
      recursionStack.delete(node);
    };

    // Check each unvisited node
    for (const node of nodes) {
      if (!visited.has(node.id)) {
        dfs(node.id);
      }
    }

    return cycles;
  }

  /**
   * Analyze impact of changes to an artifact
   */
  private static analyzeImpact(
    rootId: string,
    nodes: Map<string, DependencyNode>,
    edges: DependencyEdge[]
  ): ImpactAnalysis {
    const impactedNodes = new Set<string>();
    const criticalPaths: string[][] = [];
    
    // Build reverse adjacency list (who depends on me)
    const reverseAdjacency = new Map<string, Array<{ node: string; strength: string }>>();
    for (const edge of edges) {
      if (!reverseAdjacency.has(edge.to)) {
        reverseAdjacency.set(edge.to, []);
      }
      reverseAdjacency.get(edge.to)!.push({
        node: edge.from,
        strength: edge.strength
      });
    }

    // BFS to find all impacted nodes
    const queue: Array<{ node: string; depth: number; path: string[] }> = [{
      node: rootId,
      depth: 0,
      path: [rootId]
    }];
    
    const visited = new Set<string>();
    let directImpacts = 0;
    let indirectImpacts = 0;

    while (queue.length > 0) {
      const { node, depth, path } = queue.shift()!;
      
      if (visited.has(node)) continue;
      visited.add(node);

      if (depth === 1) directImpacts++;
      else if (depth > 1) indirectImpacts++;

      const dependents = reverseAdjacency.get(node) || [];
      
      for (const dep of dependents) {
        if (!visited.has(dep.node)) {
          const newPath = [...path, dep.node];
          
          // Track critical paths (strong dependencies only)
          if (dep.strength === 'strong' && depth >= 1) {
            criticalPaths.push(newPath);
          }

          queue.push({
            node: dep.node,
            depth: depth + 1,
            path: newPath
          });
        }
      }
    }

    // Calculate risk level
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    const totalImpacts = directImpacts + indirectImpacts;
    
    if (totalImpacts > 20 || criticalPaths.length > 10) {
      riskLevel = 'critical';
    } else if (totalImpacts > 10 || criticalPaths.length > 5) {
      riskLevel = 'high';
    } else if (totalImpacts > 5 || criticalPaths.length > 2) {
      riskLevel = 'medium';
    }

    return {
      directImpacts,
      indirectImpacts,
      criticalPaths,
      riskLevel
    };
  }

  /**
   * Create dependency between artifacts
   */
  static async createDependency(
    fromType: ArtifactType,
    fromId: number,
    toType: ArtifactType,
    toId: number,
    dependencyType: 'requires' | 'impacts' | 'related_to',
    strength: 'strong' | 'weak' | 'optional' = 'strong',
    description?: string
  ): Promise<void> {
    // Get baseline versions
    const [fromVersion] = await db.select()
      .from(artifactVersions)
      .where(
        and(
          eq(artifactVersions.artifactType, fromType),
          eq(artifactVersions.artifactId, fromId),
          eq(artifactVersions.isBaseline, true)
        )
      )
      .orderBy(sql`${artifactVersions.versionNumber} DESC`)
      .limit(1);

    const [toVersion] = await db.select()
      .from(artifactVersions)
      .where(
        and(
          eq(artifactVersions.artifactType, toType),
          eq(artifactVersions.artifactId, toId),
          eq(artifactVersions.isBaseline, true)
        )
      )
      .orderBy(sql`${artifactVersions.versionNumber} DESC`)
      .limit(1);

    if (!fromVersion || !toVersion) {
      throw new Error('Baseline versions not found for one or both artifacts');
    }

    // Create dependency
    await db.insert(versionDependencies).values({
      fromVersionId: fromVersion.id,
      toVersionId: toVersion.id,
      dependencyType,
      dependencyStrength: strength,
      description
    });
  }

  /**
   * Get impact report for proposed changes
   */
  static async getImpactReport(
    changes: Array<{ type: ArtifactType; id: number; changeType: string }>
  ): Promise<{
    totalImpacts: number;
    criticalImpacts: number;
    affectedArtifacts: Array<{
      type: ArtifactType;
      id: number;
      name: string;
      impactLevel: 'low' | 'medium' | 'high' | 'critical';
      reason: string;
    }>;
    recommendations: string[];
  }> {
    const affectedArtifacts: any[] = [];
    const allImpactedNodes = new Set<string>();
    let criticalImpacts = 0;

    for (const change of changes) {
      const graph = await this.buildDependencyGraph(change.type, change.id);
      
      // Add impacted nodes
      for (const node of graph.nodes) {
        if (node.id !== `${change.type}-${change.id}`) {
          allImpactedNodes.add(node.id);
          
          const impactLevel = graph.impactAnalysis.riskLevel;
          if (impactLevel === 'critical') criticalImpacts++;

          affectedArtifacts.push({
            type: node.type,
            id: node.artifactId,
            name: node.name,
            impactLevel,
            reason: `${change.changeType} on ${change.type} ${change.id}`
          });
        }
      }
    }

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (criticalImpacts > 0) {
      recommendations.push('Critical impacts detected. Thorough testing required.');
    }
    
    if (allImpactedNodes.size > 10) {
      recommendations.push('Large number of dependencies affected. Consider phased rollout.');
    }

    const interfaceImpacts = affectedArtifacts.filter(a => a.type === 'interface');
    if (interfaceImpacts.length > 0) {
      recommendations.push('Interface changes detected. Coordinate with consumer teams.');
    }

    return {
      totalImpacts: allImpactedNodes.size,
      criticalImpacts,
      affectedArtifacts: affectedArtifacts.slice(0, 50), // Limit results
      recommendations
    };
  }
}