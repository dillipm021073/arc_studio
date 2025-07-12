import { db } from "../db";
import { 
  applications, 
  interfaces, 
  businessProcesses, 
  internalActivities, 
  technicalProcesses,
  changeRequests,
  changeRequestApplications,
  changeRequestInterfaces,
  changeRequestInternalActivities,
  changeRequestTechnicalProcesses,
  businessProcessInterfaces,
  technicalProcessInterfaces,
  technicalProcessInternalActivities,
  artifactLocks,
  initiatives,
  artifactVersions
} from "@db/schema";
import { eq, and, or, inArray, sql } from "drizzle-orm";
import { VersionControlService, ArtifactType } from "./version-control.service";

export interface CheckoutImpactAnalysis {
  primaryArtifact: {
    type: ArtifactType;
    id: number;
    name: string;
  };
  requiredCheckouts: {
    applications: Array<{ id: number; name: string; reason: string; }>;
    interfaces: Array<{ id: number; imlNumber: string; reason: string; }>;
    businessProcesses: Array<{ id: number; businessProcess: string; reason: string; }>;
    internalActivities: Array<{ id: number; activityName: string; reason: string; }>;
    technicalProcesses: Array<{ id: number; name: string; reason: string; }>;
  };
  crossInitiativeImpacts: Array<{
    changeRequestId: number;
    title: string;
    status: string;
    initiativeId?: string;
    conflictType: 'application' | 'interface' | 'internal_activity' | 'technical_process';
    artifactId: number;
    artifactName: string;
  }>;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  summary: {
    totalRequiredCheckouts: number;
    crossInitiativeConflicts: number;
    estimatedComplexity: string;
  };
}

export class CheckoutImpactService {
  
  static async analyzeCheckoutImpact(
    artifactType: ArtifactType,
    artifactId: number,
    initiativeId: string
  ): Promise<CheckoutImpactAnalysis> {
    
    const analysis: CheckoutImpactAnalysis = {
      primaryArtifact: {
        type: artifactType,
        id: artifactId,
        name: ''
      },
      requiredCheckouts: {
        applications: [],
        interfaces: [],
        businessProcesses: [],
        internalActivities: [],
        technicalProcesses: []
      },
      crossInitiativeImpacts: [],
      riskLevel: 'low',
      summary: {
        totalRequiredCheckouts: 0,
        crossInitiativeConflicts: 0,
        estimatedComplexity: 'Simple'
      }
    };

    // Get primary artifact details and populate name
    await this.populatePrimaryArtifactDetails(analysis, artifactType, artifactId);

    // Analyze impact based on artifact type
    switch (artifactType) {
      case 'application':
        await this.analyzeApplicationImpact(analysis, artifactId, initiativeId);
        break;
      case 'interface':
        await this.analyzeInterfaceImpact(analysis, artifactId, initiativeId);
        break;
      case 'business_process':
        await this.analyzeBusinessProcessImpact(analysis, artifactId, initiativeId);
        break;
      case 'internal_process':
        await this.analyzeInternalActivityImpact(analysis, artifactId, initiativeId);
        break;
      case 'technical_process':
        await this.analyzeTechnicalProcessImpact(analysis, artifactId, initiativeId);
        break;
    }

    // Identify cross-initiative impacts
    await this.identifyCrossInitiativeImpacts(analysis, initiativeId);

    // Calculate risk level and summary
    this.calculateRiskAndSummary(analysis);

    return analysis;
  }

  private static async populatePrimaryArtifactDetails(
    analysis: CheckoutImpactAnalysis, 
    artifactType: ArtifactType, 
    artifactId: number
  ) {
    switch (artifactType) {
      case 'application':
        const [app] = await db.select({ name: applications.name })
          .from(applications)
          .where(eq(applications.id, artifactId));
        analysis.primaryArtifact.name = app?.name || `Application ${artifactId}`;
        break;
      case 'interface':
        const [iface] = await db.select({ imlNumber: interfaces.imlNumber })
          .from(interfaces)
          .where(eq(interfaces.id, artifactId));
        analysis.primaryArtifact.name = iface?.imlNumber || `Interface ${artifactId}`;
        break;
      case 'business_process':
        const [bp] = await db.select({ businessProcess: businessProcesses.businessProcess })
          .from(businessProcesses)
          .where(eq(businessProcesses.id, artifactId));
        analysis.primaryArtifact.name = bp?.businessProcess || `Business Process ${artifactId}`;
        break;
      case 'internal_process':
        const [ia] = await db.select({ activityName: internalActivities.activityName })
          .from(internalActivities)
          .where(eq(internalActivities.id, artifactId));
        analysis.primaryArtifact.name = ia?.activityName || `Internal Activity ${artifactId}`;
        break;
      case 'technical_process':
        const [tp] = await db.select({ name: technicalProcesses.name })
          .from(technicalProcesses)
          .where(eq(technicalProcesses.id, artifactId));
        analysis.primaryArtifact.name = tp?.name || `Technical Process ${artifactId}`;
        break;
    }
  }

  private static async analyzeApplicationImpact(
    analysis: CheckoutImpactAnalysis, 
    applicationId: number, 
    initiativeId: string
  ) {
    // 1. Find all interfaces where this application is provider or consumer
    const relatedInterfaces = await db.select({
      id: interfaces.id,
      imlNumber: interfaces.imlNumber,
      providerApplicationId: interfaces.providerApplicationId,
      consumerApplicationId: interfaces.consumerApplicationId
    })
    .from(interfaces)
    .where(
      or(
        eq(interfaces.providerApplicationId, applicationId),
        eq(interfaces.consumerApplicationId, applicationId)
      )
    );

    for (const iface of relatedInterfaces) {
      const reason = iface.providerApplicationId === applicationId 
        ? 'Provider application being modified'
        : 'Consumer application being modified';
      
      analysis.requiredCheckouts.interfaces.push({
        id: iface.id,
        imlNumber: iface.imlNumber,
        reason
      });

      // Also checkout the other application (provider or consumer)
      const otherAppId = iface.providerApplicationId === applicationId 
        ? iface.consumerApplicationId 
        : iface.providerApplicationId;
      
      if (otherAppId && otherAppId !== applicationId) {
        const [otherApp] = await db.select({ name: applications.name })
          .from(applications)
          .where(eq(applications.id, otherAppId));
        
        if (otherApp && !analysis.requiredCheckouts.applications.some(a => a.id === otherAppId)) {
          analysis.requiredCheckouts.applications.push({
            id: otherAppId,
            name: otherApp.name,
            reason: `Connected via interface ${iface.imlNumber}`
          });
        }
      }
    }

    // 2. Find all internal activities used by this application
    const internalActivitiesUsed = await db.select({
      id: internalActivities.id,
      activityName: internalActivities.activityName
    })
    .from(internalActivities)
    .where(eq(internalActivities.applicationId, applicationId));

    for (const activity of internalActivitiesUsed) {
      analysis.requiredCheckouts.internalActivities.push({
        id: activity.id,
        activityName: activity.activityName,
        reason: 'Internal capability of the application'
      });
    }

    // 3. Find technical processes within this application
    const technicalProcessesUsed = await db.select({
      id: technicalProcesses.id,
      name: technicalProcesses.name
    })
    .from(technicalProcesses)
    .where(eq(technicalProcesses.applicationId, applicationId));

    for (const process of technicalProcessesUsed) {
      analysis.requiredCheckouts.technicalProcesses.push({
        id: process.id,
        name: process.name,
        reason: 'Technical process within the application'
      });
    }

    // 4. Find business processes using the related interfaces
    if (relatedInterfaces.length > 0) {
      const interfaceIds = relatedInterfaces.map(i => i.id);
      const businessProcessesUsed = await db.select({
        id: businessProcesses.id,
        businessProcess: businessProcesses.businessProcess
      })
      .from(businessProcesses)
      .innerJoin(businessProcessInterfaces, eq(businessProcessInterfaces.businessProcessId, businessProcesses.id))
      .where(inArray(businessProcessInterfaces.interfaceId, interfaceIds));

      for (const bp of businessProcessesUsed) {
        if (!analysis.requiredCheckouts.businessProcesses.some(b => b.id === bp.id)) {
          analysis.requiredCheckouts.businessProcesses.push({
            id: bp.id,
            businessProcess: bp.businessProcess,
            reason: 'Uses interfaces affected by application changes'
          });
        }
      }
    }
  }

  private static async analyzeInterfaceImpact(
    analysis: CheckoutImpactAnalysis, 
    interfaceId: number, 
    initiativeId: string
  ) {
    // 1. Get interface details and checkout provider/consumer applications
    const [interfaceDetails] = await db.select({
      providerApplicationId: interfaces.providerApplicationId,
      consumerApplicationId: interfaces.consumerApplicationId
    })
    .from(interfaces)
    .where(eq(interfaces.id, interfaceId));

    if (interfaceDetails) {
      // Checkout provider application
      if (interfaceDetails.providerApplicationId) {
        const [providerApp] = await db.select({ name: applications.name })
          .from(applications)
          .where(eq(applications.id, interfaceDetails.providerApplicationId));
        
        if (providerApp) {
          analysis.requiredCheckouts.applications.push({
            id: interfaceDetails.providerApplicationId,
            name: providerApp.name,
            reason: 'Provider application for the interface'
          });
        }
      }

      // Checkout consumer application
      if (interfaceDetails.consumerApplicationId) {
        const [consumerApp] = await db.select({ name: applications.name })
          .from(applications)
          .where(eq(applications.id, interfaceDetails.consumerApplicationId));
        
        if (consumerApp) {
          analysis.requiredCheckouts.applications.push({
            id: interfaceDetails.consumerApplicationId,
            name: consumerApp.name,
            reason: 'Consumer application for the interface'
          });
        }
      }
    }

    // 2. Find business processes using this interface
    const businessProcessesUsed = await db.select({
      id: businessProcesses.id,
      businessProcess: businessProcesses.businessProcess
    })
    .from(businessProcesses)
    .innerJoin(businessProcessInterfaces, eq(businessProcessInterfaces.businessProcessId, businessProcesses.id))
    .where(eq(businessProcessInterfaces.interfaceId, interfaceId));

    for (const bp of businessProcessesUsed) {
      analysis.requiredCheckouts.businessProcesses.push({
        id: bp.id,
        businessProcess: bp.businessProcess,
        reason: 'Business process uses this interface'
      });
    }

    // 3. Find technical processes using this interface
    const technicalProcessesUsed = await db.select({
      id: technicalProcesses.id,
      name: technicalProcesses.name
    })
    .from(technicalProcesses)
    .innerJoin(technicalProcessInterfaces, eq(technicalProcessInterfaces.technicalProcessId, technicalProcesses.id))
    .where(eq(technicalProcessInterfaces.interfaceId, interfaceId));

    for (const tp of technicalProcessesUsed) {
      analysis.requiredCheckouts.technicalProcesses.push({
        id: tp.id,
        name: tp.name,
        reason: 'Technical process uses this interface'
      });
    }
  }

  private static async analyzeBusinessProcessImpact(
    analysis: CheckoutImpactAnalysis, 
    businessProcessId: number, 
    initiativeId: string
  ) {
    // 1. Find all interfaces used by this business process
    const interfacesUsed = await db.select({
      id: interfaces.id,
      imlNumber: interfaces.imlNumber
    })
    .from(interfaces)
    .innerJoin(businessProcessInterfaces, eq(businessProcessInterfaces.interfaceId, interfaces.id))
    .where(eq(businessProcessInterfaces.businessProcessId, businessProcessId));

    for (const iface of interfacesUsed) {
      analysis.requiredCheckouts.interfaces.push({
        id: iface.id,
        imlNumber: iface.imlNumber,
        reason: 'Interface used by the business process'
      });
    }

    // 2. Find applications involved in these interfaces
    if (interfacesUsed.length > 0) {
      const interfaceIds = interfacesUsed.map(i => i.id);
      const applicationsInvolved = await db.select({
        id: applications.id,
        name: applications.name,
        providerForInterface: interfaces.id,
        consumerForInterface: sql<number>`NULL`
      })
      .from(applications)
      .innerJoin(interfaces, eq(interfaces.providerApplicationId, applications.id))
      .where(inArray(interfaces.id, interfaceIds))
      .union(
        db.select({
          id: applications.id,
          name: applications.name,
          providerForInterface: sql<number>`NULL`,
          consumerForInterface: interfaces.id
        })
        .from(applications)
        .innerJoin(interfaces, eq(interfaces.consumerApplicationId, applications.id))
        .where(inArray(interfaces.id, interfaceIds))
      );

      for (const app of applicationsInvolved) {
        if (!analysis.requiredCheckouts.applications.some(a => a.id === app.id)) {
          analysis.requiredCheckouts.applications.push({
            id: app.id,
            name: app.name,
            reason: 'Application involved in business process interfaces'
          });
        }
      }
    }
  }

  private static async analyzeInternalActivityImpact(
    analysis: CheckoutImpactAnalysis, 
    internalActivityId: number, 
    initiativeId: string
  ) {
    // 1. Find the application that owns this internal activity
    const [activityDetails] = await db.select({
      applicationId: internalActivities.applicationId
    })
    .from(internalActivities)
    .where(eq(internalActivities.id, internalActivityId));

    if (activityDetails && activityDetails.applicationId) {
      const [ownerApp] = await db.select({ name: applications.name })
        .from(applications)
        .where(eq(applications.id, activityDetails.applicationId));
      
      if (ownerApp) {
        analysis.requiredCheckouts.applications.push({
          id: activityDetails.applicationId,
          name: ownerApp.name,
          reason: 'Owner application of the internal activity'
        });
      }
    }

    // 2. Find technical processes that use this internal activity
    const technicalProcessesUsed = await db.select({
      id: technicalProcesses.id,
      name: technicalProcesses.name
    })
    .from(technicalProcesses)
    .innerJoin(technicalProcessInternalActivities, eq(technicalProcessInternalActivities.technicalProcessId, technicalProcesses.id))
    .where(eq(technicalProcessInternalActivities.internalActivityId, internalActivityId));

    for (const tp of technicalProcessesUsed) {
      analysis.requiredCheckouts.technicalProcesses.push({
        id: tp.id,
        name: tp.name,
        reason: 'Technical process uses this internal activity'
      });
    }
  }

  private static async analyzeTechnicalProcessImpact(
    analysis: CheckoutImpactAnalysis, 
    technicalProcessId: number, 
    initiativeId: string
  ) {
    // 1. Find the application that owns this technical process
    const [processDetails] = await db.select({
      applicationId: technicalProcesses.applicationId
    })
    .from(technicalProcesses)
    .where(eq(technicalProcesses.id, technicalProcessId));

    if (processDetails && processDetails.applicationId) {
      const [ownerApp] = await db.select({ name: applications.name })
        .from(applications)
        .where(eq(applications.id, processDetails.applicationId));
      
      if (ownerApp) {
        analysis.requiredCheckouts.applications.push({
          id: processDetails.applicationId,
          name: ownerApp.name,
          reason: 'Owner application of the technical process'
        });
      }
    }

    // 2. Find interfaces used by this technical process
    const interfacesUsed = await db.select({
      id: interfaces.id,
      imlNumber: interfaces.imlNumber
    })
    .from(interfaces)
    .innerJoin(technicalProcessInterfaces, eq(technicalProcessInterfaces.interfaceId, interfaces.id))
    .where(eq(technicalProcessInterfaces.technicalProcessId, technicalProcessId));

    for (const iface of interfacesUsed) {
      analysis.requiredCheckouts.interfaces.push({
        id: iface.id,
        imlNumber: iface.imlNumber,
        reason: 'Interface used by the technical process'
      });
    }

    // 3. Find internal activities used by this technical process
    const internalActivitiesUsed = await db.select({
      id: internalActivities.id,
      activityName: internalActivities.activityName
    })
    .from(internalActivities)
    .innerJoin(technicalProcessInternalActivities, eq(technicalProcessInternalActivities.internalActivityId, internalActivities.id))
    .where(eq(technicalProcessInternalActivities.technicalProcessId, technicalProcessId));

    for (const activity of internalActivitiesUsed) {
      analysis.requiredCheckouts.internalActivities.push({
        id: activity.id,
        activityName: activity.activityName,
        reason: 'Internal activity used by the technical process'
      });
    }
  }

  private static async identifyCrossInitiativeImpacts(
    analysis: CheckoutImpactAnalysis, 
    currentInitiativeId: string
  ) {
    // Get all artifact IDs that would be impacted
    const allImpactedArtifacts = {
      applications: [analysis.primaryArtifact.type === 'application' ? analysis.primaryArtifact.id : null, ...analysis.requiredCheckouts.applications.map(a => a.id)].filter(Boolean) as number[],
      interfaces: [analysis.primaryArtifact.type === 'interface' ? analysis.primaryArtifact.id : null, ...analysis.requiredCheckouts.interfaces.map(i => i.id)].filter(Boolean) as number[],
      internalActivities: [analysis.primaryArtifact.type === 'internal_process' ? analysis.primaryArtifact.id : null, ...analysis.requiredCheckouts.internalActivities.map(ia => ia.id)].filter(Boolean) as number[],
      technicalProcesses: [analysis.primaryArtifact.type === 'technical_process' ? analysis.primaryArtifact.id : null, ...analysis.requiredCheckouts.technicalProcesses.map(tp => tp.id)].filter(Boolean) as number[]
    };

    // Find Change Requests that impact these artifacts
    const conflictingCRs = [];

    // Check for application conflicts
    if (allImpactedArtifacts.applications.length > 0) {
      const appConflicts = await db.select({
        changeRequestId: changeRequestApplications.changeRequestId,
        artifactId: changeRequestApplications.applicationId,
        title: changeRequests.title,
        status: changeRequests.status,
        initiativeId: changeRequests.initiativeId,
        artifactName: applications.name
      })
      .from(changeRequestApplications)
      .innerJoin(changeRequests, eq(changeRequests.id, changeRequestApplications.changeRequestId))
      .innerJoin(applications, eq(applications.id, changeRequestApplications.applicationId))
      .where(
        and(
          inArray(changeRequestApplications.applicationId, allImpactedArtifacts.applications),
          sql`${changeRequests.initiativeId} != ${currentInitiativeId} OR ${changeRequests.initiativeId} IS NULL`
        )
      );

      for (const conflict of appConflicts) {
        conflictingCRs.push({
          changeRequestId: conflict.changeRequestId,
          title: conflict.title,
          status: conflict.status,
          initiativeId: conflict.initiativeId,
          conflictType: 'application' as const,
          artifactId: conflict.artifactId,
          artifactName: conflict.artifactName
        });
      }
    }

    // Check for interface conflicts
    if (allImpactedArtifacts.interfaces.length > 0) {
      const interfaceConflicts = await db.select({
        changeRequestId: changeRequestInterfaces.changeRequestId,
        artifactId: changeRequestInterfaces.interfaceId,
        title: changeRequests.title,
        status: changeRequests.status,
        initiativeId: changeRequests.initiativeId,
        artifactName: interfaces.imlNumber
      })
      .from(changeRequestInterfaces)
      .innerJoin(changeRequests, eq(changeRequests.id, changeRequestInterfaces.changeRequestId))
      .innerJoin(interfaces, eq(interfaces.id, changeRequestInterfaces.interfaceId))
      .where(
        and(
          inArray(changeRequestInterfaces.interfaceId, allImpactedArtifacts.interfaces),
          sql`${changeRequests.initiativeId} != ${currentInitiativeId} OR ${changeRequests.initiativeId} IS NULL`
        )
      );

      for (const conflict of interfaceConflicts) {
        conflictingCRs.push({
          changeRequestId: conflict.changeRequestId,
          title: conflict.title,
          status: conflict.status,
          initiativeId: conflict.initiativeId,
          conflictType: 'interface' as const,
          artifactId: conflict.artifactId,
          artifactName: conflict.artifactName
        });
      }
    }

    // Similar checks for internal activities and technical processes...
    if (allImpactedArtifacts.internalActivities.length > 0) {
      const iaConflicts = await db.select({
        changeRequestId: changeRequestInternalActivities.changeRequestId,
        artifactId: changeRequestInternalActivities.internalActivityId,
        title: changeRequests.title,
        status: changeRequests.status,
        initiativeId: changeRequests.initiativeId,
        artifactName: internalActivities.activityName
      })
      .from(changeRequestInternalActivities)
      .innerJoin(changeRequests, eq(changeRequests.id, changeRequestInternalActivities.changeRequestId))
      .innerJoin(internalActivities, eq(internalActivities.id, changeRequestInternalActivities.internalActivityId))
      .where(
        and(
          inArray(changeRequestInternalActivities.internalActivityId, allImpactedArtifacts.internalActivities),
          sql`${changeRequests.initiativeId} != ${currentInitiativeId} OR ${changeRequests.initiativeId} IS NULL`
        )
      );

      for (const conflict of iaConflicts) {
        conflictingCRs.push({
          changeRequestId: conflict.changeRequestId,
          title: conflict.title,
          status: conflict.status,
          initiativeId: conflict.initiativeId,
          conflictType: 'internal_activity' as const,
          artifactId: conflict.artifactId,
          artifactName: conflict.artifactName
        });
      }
    }

    if (allImpactedArtifacts.technicalProcesses.length > 0) {
      const tpConflicts = await db.select({
        changeRequestId: changeRequestTechnicalProcesses.changeRequestId,
        artifactId: changeRequestTechnicalProcesses.technicalProcessId,
        title: changeRequests.title,
        status: changeRequests.status,
        initiativeId: changeRequests.initiativeId,
        artifactName: technicalProcesses.name
      })
      .from(changeRequestTechnicalProcesses)
      .innerJoin(changeRequests, eq(changeRequests.id, changeRequestTechnicalProcesses.changeRequestId))
      .innerJoin(technicalProcesses, eq(technicalProcesses.id, changeRequestTechnicalProcesses.technicalProcessId))
      .where(
        and(
          inArray(changeRequestTechnicalProcesses.technicalProcessId, allImpactedArtifacts.technicalProcesses),
          sql`${changeRequests.initiativeId} != ${currentInitiativeId} OR ${changeRequests.initiativeId} IS NULL`
        )
      );

      for (const conflict of tpConflicts) {
        conflictingCRs.push({
          changeRequestId: conflict.changeRequestId,
          title: conflict.title,
          status: conflict.status,
          initiativeId: conflict.initiativeId,
          conflictType: 'technical_process' as const,
          artifactId: conflict.artifactId,
          artifactName: conflict.artifactName
        });
      }
    }

    analysis.crossInitiativeImpacts = conflictingCRs;
  }

  private static calculateRiskAndSummary(analysis: CheckoutImpactAnalysis) {
    const totalCheckouts = 
      analysis.requiredCheckouts.applications.length +
      analysis.requiredCheckouts.interfaces.length +
      analysis.requiredCheckouts.businessProcesses.length +
      analysis.requiredCheckouts.internalActivities.length +
      analysis.requiredCheckouts.technicalProcesses.length;

    const crossInitiativeConflicts = analysis.crossInitiativeImpacts.length;

    // Calculate risk level
    if (crossInitiativeConflicts > 5 || totalCheckouts > 20) {
      analysis.riskLevel = 'critical';
    } else if (crossInitiativeConflicts > 2 || totalCheckouts > 10) {
      analysis.riskLevel = 'high';
    } else if (crossInitiativeConflicts > 0 || totalCheckouts > 5) {
      analysis.riskLevel = 'medium';
    } else {
      analysis.riskLevel = 'low';
    }

    // Calculate complexity
    let complexity = 'Simple';
    if (totalCheckouts > 15) {
      complexity = 'Very Complex';
    } else if (totalCheckouts > 10) {
      complexity = 'Complex';
    } else if (totalCheckouts > 5) {
      complexity = 'Moderate';
    }

    analysis.summary = {
      totalRequiredCheckouts: totalCheckouts,
      crossInitiativeConflicts,
      estimatedComplexity: complexity
    };
  }

  // Method to perform bulk checkout based on impact analysis
  static async performBulkCheckout(
    analysis: CheckoutImpactAnalysis,
    initiativeId: string,
    userId: number,
    autoApprove: boolean = false
  ): Promise<{ successful: number; failed: Array<{ artifact: string; error: string }> }> {
    const results = { successful: 0, failed: [] as Array<{ artifact: string; error: string }> };

    // Helper function to checkout an artifact safely
    const safeCheckout = async (type: ArtifactType, id: number, name: string) => {
      try {
        await VersionControlService.checkoutArtifact(type, id, initiativeId, userId);
        results.successful++;
      } catch (error) {
        results.failed.push({
          artifact: `${type}: ${name}`,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    };

    // Checkout all required applications
    for (const app of analysis.requiredCheckouts.applications) {
      await safeCheckout('application', app.id, app.name);
    }

    // Checkout all required interfaces
    for (const iface of analysis.requiredCheckouts.interfaces) {
      await safeCheckout('interface', iface.id, iface.imlNumber);
    }

    // Checkout all required business processes
    for (const bp of analysis.requiredCheckouts.businessProcesses) {
      await safeCheckout('business_process', bp.id, bp.businessProcess);
    }

    // Checkout all required internal activities
    for (const ia of analysis.requiredCheckouts.internalActivities) {
      await safeCheckout('internal_process', ia.id, ia.activityName);
    }

    // Checkout all required technical processes
    for (const tp of analysis.requiredCheckouts.technicalProcesses) {
      await safeCheckout('technical_process', tp.id, tp.name);
    }

    return results;
  }
}