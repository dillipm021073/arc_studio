import { db } from "../db";
import { eq, and, inArray } from "drizzle-orm";
import * as fs from 'fs/promises';
import * as path from 'path';
import * as https from 'https';
import {
  initiatives,
  artifactVersions,
  applications,
  interfaces,
  businessProcesses,
  businessProcessInterfaces,
  changeRequests,
  changeRequestApplications,
  changeRequestInterfaces,
  users,
  impactAssessments
} from "@db/schema";

export interface CrossCRImpact {
  commonApplications: Array<{
    application: any;
    affectedByCRs: string[];
    conflictType?: 'modification' | 'deletion' | 'status_change';
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
  }>;
  commonInterfaces: Array<{
    interface: any;
    affectedByCRs: string[];
    conflictType?: 'modification' | 'version_change' | 'deletion';
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
  }>;
  commonBusinessProcesses: Array<{
    businessProcess: any;
    affectedByCRs: string[];
    conflictType?: 'modification' | 'sequence_change' | 'deletion';
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
  }>;
  overallRiskAssessment: {
    level: 'low' | 'medium' | 'high' | 'critical';
    conflicts: string[];
    recommendations: string[];
  };
  timeline: Array<{
    crNumber: string;
    targetDate: Date | null;
    conflicts: string[];
  }>;
}

export class ImpactAssessmentService {
  // AutoX service is now used instead of Gemini
  
  static async getExistingAssessment(initiativeId: string): Promise<{
    success: boolean;
    assessment?: string;
    documentPath?: string;
    filename?: string;
    metadata?: any;
  }> {
    try {
      // Check if we have a recent assessment in the database
      const [existing] = await db
        .select()
        .from(impactAssessments)
        .where(
          and(
            eq(impactAssessments.initiativeId, initiativeId),
            eq(impactAssessments.assessmentType, 'initiative'),
            eq(impactAssessments.status, 'active')
          )
        )
        .orderBy(impactAssessments.generatedAt)
        .limit(1);
      
      if (existing && existing.assessmentContent) {
        // If filename is missing but documentPath exists, extract it
        let filename = existing.documentFilename;
        if (!filename && existing.documentPath) {
          filename = path.basename(existing.documentPath);
        }
        
        return {
          success: true,
          assessment: existing.assessmentContent,
          documentPath: existing.documentPath || undefined,
          filename: filename || undefined,
          metadata: existing.metadata
        };
      }
      
      return { success: false };
    } catch (error: any) {
      // If table doesn't exist, just return false (will generate new assessment)
      if (error.code === '42P01') {
        console.log("Impact assessments table doesn't exist yet. Will generate new assessment.");
        return { success: false };
      }
      console.error("Error fetching existing assessment:", error);
      return { success: false };
    }
  }

  static async generateImpactAssessment(initiativeId: string, userId?: number): Promise<{
    success: boolean;
    assessment?: string;
    documentPath?: string;
    filename?: string;
    error?: string;
  }> {
    try {
      // Gather all data needed for assessment
      const assessmentData = await this.gatherAssessmentData(initiativeId);
      
      if (!assessmentData) {
        return {
          success: false,
          error: "Initiative not found or has no changes"
        };
      }

      // Get user's AutoX credentials if userId provided
      let credentials = null;
      if (userId) {
        const [user] = await db.select().from(users).where(eq(users.id, userId));
        if (user?.autoXApiKey && user?.autoXUsername) {
          credentials = {
            apiKey: user.autoXApiKey,
            username: user.autoXUsername
          };
        }
      }

      if (!credentials) {
        return {
          success: false,
          error: "AutoX credentials not configured. Please configure them in Settings."
        };
      }

      // Generate the assessment using AutoX
      const prompt = this.buildAssessmentPrompt(assessmentData);
      const assessment = await this.callAutoXAPI(prompt, credentials.apiKey, credentials.username);
      
      if (!assessment) {
        return {
          success: false,
          error: "Failed to generate assessment from AutoX"
        };
      }

      // Save the assessment as a document
      const documentPath = await this.saveAssessmentDocument(
        assessmentData.initiative.initiativeId,
        assessmentData.initiative.name,
        assessment
      );

      // Return both full path and filename for flexibility
      const filename = path.basename(documentPath);
      
      // Save to database
      try {
        await db.insert(impactAssessments).values({
          initiativeId: assessmentData.initiative.initiativeId,
          assessmentType: 'initiative',
          assessmentContent: assessment,
          documentPath,
          documentFilename: filename,
          riskLevel: this.extractRiskLevel(assessment),
          generatedBy: userId,
          metadata: {
            artifactCount: assessmentData.artifactCount,
            changes: assessmentData.changes,
            changeRequestCount: assessmentData.changeRequests.length
          }
        });
      } catch (dbError: any) {
        if (dbError.code === '42P01') {
          console.log("Impact assessments table doesn't exist. Assessment saved to file only.");
        } else {
          console.error("Failed to save assessment to database:", dbError);
        }
        // Don't fail the whole operation if DB save fails
      }

      return {
        success: true,
        assessment,
        documentPath,
        filename
      };
    } catch (error) {
      console.error("Error generating impact assessment:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate impact assessment"
      };
    }
  }

  private static async saveAssessmentDocument(
    initiativeId: string, 
    initiativeName: string, 
    content: string
  ): Promise<string> {
    // Create documents directory if it doesn't exist
    const docsDir = path.join(process.cwd(), 'documents', 'impact-assessments');
    await fs.mkdir(docsDir, { recursive: true });

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const safeInitiativeName = initiativeName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filename = `impact_assessment_${safeInitiativeName}_${timestamp}.md`;
    const filePath = path.join(docsDir, filename);

    // Save the document
    await fs.writeFile(filePath, content, 'utf-8');

    return filePath;
  }

  private static async gatherAssessmentData(initiativeId: string) {
    // Get initiative details
    const [initiative] = await db
      .select()
      .from(initiatives)
      .where(eq(initiatives.initiativeId, initiativeId));

    if (!initiative) return null;

    // Get all artifacts in the initiative
    const artifacts = await db
      .select()
      .from(artifactVersions)
      .where(eq(artifactVersions.initiativeId, initiativeId));

    // Gather detailed change information
    const changes = {
      applications: [] as any[],
      interfaces: [] as any[],
      businessProcesses: [] as any[],
      totalChanges: 0,
      created: 0,
      modified: 0,
      deleted: 0,
      riskFactors: [] as string[]
    };

    // Process each artifact and collect risk factors
    for (const artifact of artifacts) {
      // TODO: Implement change history when versionControlChangeHistory table is available
      const changeHistory: any[] = [];
      // For now, simulate with a single change per artifact
      changeHistory.push({ action: 'update' });

      changes.totalChanges += changeHistory.length;

      // Get artifact details based on type
      if (artifact.artifactType === 'application') {
        const [app] = await db
          .select()
          .from(applications)
          .where(eq(applications.id, artifact.artifactId));
        
        if (app) {
          const interfaceCount = await this.getApplicationInterfaceCount(app.id);
          changes.applications.push({
            ...app,
            changeCount: changeHistory.length,
            interfaceCount,
            changes: changeHistory
          });

          // Identify risk factors
          if (app.status === 'critical') {
            changes.riskFactors.push(`Critical application "${app.name}" is being modified`);
          }
          if (interfaceCount > 5) {
            changes.riskFactors.push(`Application "${app.name}" has ${interfaceCount} interfaces that may be affected`);
          }
        }
      } else if (artifact.artifactType === 'interface') {
        const [iface] = await db
          .select()
          .from(interfaces)
          .where(eq(interfaces.id, artifact.artifactId));
        
        if (iface) {
          const businessProcessCount = await this.getInterfaceBusinessProcessCount(iface.id);
          changes.interfaces.push({
            ...iface,
            changeCount: changeHistory.length,
            businessProcessCount,
            changes: changeHistory
          });

          // Risk factors for interfaces
          if (businessProcessCount > 3) {
            changes.riskFactors.push(`Interface "${iface.imlNumber}" is used by ${businessProcessCount} business processes`);
          }
        }
      } else if (artifact.artifactType === 'business_process') {
        const [bp] = await db
          .select()
          .from(businessProcesses)
          .where(eq(businessProcesses.id, artifact.artifactId));
        
        if (bp) {
          const interfaceCount = await this.getBusinessProcessInterfaceCount(bp.id);
          changes.businessProcesses.push({
            ...bp,
            changeCount: changeHistory.length,
            interfaceCount,
            changes: changeHistory
          });

          // Risk factors for business processes
          if (bp.level === 'A') {
            changes.riskFactors.push(`High-level business process "${bp.businessProcess}" is being modified`);
          }
        }
      }

      // Count change types
      changeHistory.forEach(change => {
        if (change.action?.includes('create')) changes.created++;
        else if (change.action?.includes('delete')) changes.deleted++;
        else changes.modified++;
      });
    }

    // Get related change requests
    const changeRequestsList: any[] = [];

    return {
      initiative,
      changes,
      changeRequests: changeRequestsList,
      artifactCount: artifacts.length
    };
  }

  private static async getApplicationInterfaceCount(appId: number): Promise<number> {
    const result = await db
      .select()
      .from(interfaces)
      .where(eq(interfaces.providerApplicationId, appId));
    return result.length;
  }

  private static async getInterfaceBusinessProcessCount(interfaceId: number): Promise<number> {
    const result = await db
      .select()
      .from(businessProcessInterfaces)
      .where(eq(businessProcessInterfaces.interfaceId, interfaceId));
    return result.length;
  }

  private static async getBusinessProcessInterfaceCount(bpId: number): Promise<number> {
    const result = await db
      .select()
      .from(businessProcessInterfaces)
      .where(eq(businessProcessInterfaces.businessProcessId, bpId));
    return result.length;
  }

  private static buildAssessmentPrompt(data: any): string {
    const { initiative, changes, changeRequests, artifactCount } = data;

    return `You are an expert business analyst creating a comprehensive impact assessment document for a system change initiative using the Amdocs AutoX intelligent analysis system. 

# Initiative Context

**Initiative:** ${initiative.name}
**Description:** ${initiative.description}
**Business Justification:** ${initiative.businessJustification || 'Not specified'}
**Current Status:** ${initiative.status}
**Priority Level:** ${initiative.priority}
**Total Artifacts Impacted:** ${artifactCount}

# Change Metrics

- **Total Changes:** ${changes.totalChanges}
- **New Additions:** ${changes.created}
- **Modifications:** ${changes.modified}
- **Deletions:** ${changes.deleted}

# Affected Applications (${changes.applications.length})
${changes.applications.map((app: any) => `
**${app.name}** (Status: ${app.status})
- Description: ${app.description}
- Operating System: ${app.os}
- Deployment Type: ${app.deployment}
- Provides ${app.interfaceCount} interfaces
- Changes Applied: ${app.changeCount}
`).join('\n')}

# Affected Interfaces (${changes.interfaces.length})
${changes.interfaces.map((iface: any) => `
**${iface.imlNumber}** (Status: ${iface.status})
- Type: ${iface.interfaceType}
- Provider: ${iface.providerApplicationName}
- Consumer: ${iface.consumerApplicationName}
- Used in ${iface.businessProcessCount} business processes
- Changes Applied: ${iface.changeCount}
`).join('\n')}

# Affected Business Processes (${changes.businessProcesses.length})
${changes.businessProcesses.map((bp: any) => `
**${bp.businessProcess}** (Level ${bp.level})
- Line of Business: ${bp.lob}
- Product: ${bp.product}
- Utilizes ${bp.interfaceCount} interfaces
- Changes Applied: ${bp.changeCount}
`).join('\n')}

# Associated Change Requests
${changeRequests.map((cr: any) => `
**CR${cr.id}:** ${cr.title}
- Reason: ${cr.reason}
- Current Status: ${cr.status}
`).join('\n')}

# Identified Risk Factors
${changes.riskFactors.length > 0 ? changes.riskFactors.map((risk: string) => `- ${risk}`).join('\n') : '- No critical risk factors identified'}

---

Based on the above data, generate a comprehensive impact assessment document following this structure:

# IMPACT ASSESSMENT DOCUMENT

## 1. EXECUTIVE SUMMARY
Provide a 2-3 paragraph executive overview that:
- Summarizes the initiative's purpose and scope
- Highlights key impacts and expected benefits
- Provides an overall risk rating (Low/Medium/High/Critical)
- Identifies the most significant concerns for leadership attention

## 2. DETAILED IMPACT ANALYSIS

### 2.1 System Architecture Impact
- Analyze changes to the system architecture
- Identify integration touchpoints affected
- Assess data flow modifications
- Evaluate performance implications

### 2.2 Application-Level Changes
For each affected application:
- Specific changes and their implications
- Dependencies and downstream effects
- Interface modifications and compatibility concerns

### 2.3 Business Process Alignment
- Map technical changes to business processes
- Identify process efficiency improvements or disruptions
- Highlight areas requiring process updates

## 3. COMPREHENSIVE RISK ASSESSMENT

### 3.1 Technical Risks
- System stability concerns
- Integration failure points
- Data integrity risks
- Performance degradation possibilities
- Security vulnerabilities

### 3.2 Business Risks
- Process disruption potential
- User productivity impact
- Customer experience effects
- Regulatory compliance considerations

### 3.3 Operational Risks
- Deployment complexity
- Rollback challenges
- Support team readiness
- Monitoring and maintenance requirements

### 3.4 Risk Mitigation Strategies
Provide specific mitigation strategies for each identified risk.

## 4. BUSINESS PROCESS IMPACT DETAIL

### 4.1 Affected Processes
- Detailed analysis of each affected business process
- User groups impacted
- Transaction volume considerations
- Critical path dependencies

### 4.2 Process Complexity Assessment
Rate each process impact as:
- **Low Complexity:** Minimal changes, low user impact
- **Medium Complexity:** Moderate changes, some training required
- **High Complexity:** Significant changes, extensive coordination needed

### 4.3 Training Requirements
- Identify user groups requiring training
- Estimate training duration and approach
- Highlight documentation needs

## 5. TESTING STRATEGY

### 5.1 Test Scenarios
Based on the changes, identify:
- Critical test cases
- Integration test requirements
- Performance benchmarks
- Security validation needs

### 5.2 Test Environment Requirements
- Environment configuration needs
- Data requirements
- Third-party system dependencies

### 5.3 Acceptance Criteria
Define clear success metrics for testing phases.

## 6. IMPLEMENTATION RECOMMENDATIONS

### 6.1 Deployment Strategy
Recommend the optimal approach:
- **Phased Rollout:** If complexity is high or risk significant
- **Big Bang:** If changes are well-contained and low risk
- **Pilot Program:** If user impact is uncertain

### 6.2 Implementation Timeline
Suggest a realistic timeline considering:
- Technical complexity
- Resource availability
- Business constraints
- Risk factors

### 6.3 Rollback Plan
Outline the rollback strategy including:
- Trigger criteria
- Rollback procedures
- Data preservation approach
- Communication plan

## 7. COMPLEXITY ASSESSMENT

### 7.1 Overall Complexity Rating
Provide an overall rating with justification:
- **Low:** Straightforward changes, minimal risk
- **Medium:** Moderate complexity, manageable risks
- **High:** Complex changes, significant coordination required
- **Critical:** Extremely complex, high business impact

### 7.2 Complexity Factors
List and explain the key factors contributing to the complexity rating.

### 7.3 Complexity Management
Provide recommendations for managing the identified complexity.

## 8. SUCCESS METRICS

Define clear, measurable success criteria:
- Technical success indicators
- Business value metrics
- User adoption targets
- Performance benchmarks

## 9. COMMUNICATION PLAN

Outline key communication needs:
- Stakeholder groups
- Communication timeline
- Key messages
- Feedback mechanisms

## 10. RECOMMENDATIONS SUMMARY

Provide a prioritized list of recommendations for:
- Risk mitigation
- Implementation approach
- Resource allocation
- Timeline considerations

---

Format the document using clear markdown formatting with proper headings, bullet points, and emphasis where appropriate. Ensure the language is professional yet accessible to both technical and business stakeholders. The assessment should be thorough, actionable, and focused on enabling informed decision-making.`;
  }

  static async generateCrossCRAnalysis(crIds: string[]): Promise<{
    success: boolean;
    analysis?: CrossCRImpact;
    error?: string;
  }> {
    try {
      if (crIds.length < 2) {
        return {
          success: false,
          error: "At least 2 CRs are required for cross-CR analysis"
        };
      }

      // Fetch all CRs and their impacts
      const crs = await db
        .select()
        .from(changeRequests)
        .where(inArray(changeRequests.crNumber, crIds));

      if (crs.length < 2) {
        return {
          success: false,
          error: "Some CRs were not found"
        };
      }

      // Get all impacts for each CR
      const impactsByCP = new Map<string, {
        applications: Map<number, { cr: string; impactType: string; impact: any }[]>;
        interfaces: Map<number, { cr: string; impactType: string; impact: any }[]>;
        businessProcesses: Map<number, { cr: string; impactType: string; impact: any }[]>;
      }>();

      for (const cr of crs) {
        const impacts = {
          applications: new Map<number, { cr: string; impactType: string; impact: any }[]>(),
          interfaces: new Map<number, { cr: string; impactType: string; impact: any }[]>(),
          businessProcesses: new Map<number, { cr: string; impactType: string; impact: any }[]>()
        };

        // Get application impacts
        const appImpacts = await db
          .select({
            changeRequestApplication: changeRequestApplications,
            application: applications
          })
          .from(changeRequestApplications)
          .innerJoin(applications, eq(changeRequestApplications.applicationId, applications.id))
          .where(eq(changeRequestApplications.changeRequestId, cr.id));

        appImpacts?.forEach((impact) => {
          const appId = impact.application.id;
          if (!impacts.applications.has(appId)) {
            impacts.applications.set(appId, []);
          }
          impacts.applications.get(appId)!.push({
            cr: cr.crNumber,
            impactType: impact.changeRequestApplication.impactType || '',
            impact: {
              ...impact.changeRequestApplication,
              ...impact.application
            }
          });
        });

        // Get interface impacts
        const ifaceImpacts = await db
          .select({
            changeRequestInterface: changeRequestInterfaces,
            interface: interfaces
          })
          .from(changeRequestInterfaces)
          .innerJoin(interfaces, eq(changeRequestInterfaces.interfaceId, interfaces.id))
          .where(eq(changeRequestInterfaces.changeRequestId, cr.id));

        ifaceImpacts?.forEach((impact) => {
          const ifaceId = impact.interface.id;
          if (!impacts.interfaces.has(ifaceId)) {
            impacts.interfaces.set(ifaceId, []);
          }
          impacts.interfaces.get(ifaceId)!.push({
            cr: cr.crNumber,
            impactType: impact.changeRequestInterface.impactType || '',
            impact: {
              ...impact.changeRequestInterface,
              ...impact.interface
            }
          });
        });

        // Get business process impacts (via interfaces)
        const bpImpacts = await db
          .selectDistinct({
            businessProcess: businessProcesses,
            impactType: changeRequestInterfaces.impactType
          })
          .from(changeRequestInterfaces)
          .innerJoin(businessProcessInterfaces, eq(businessProcessInterfaces.interfaceId, changeRequestInterfaces.interfaceId))
          .innerJoin(businessProcesses, eq(businessProcesses.id, businessProcessInterfaces.businessProcessId))
          .where(eq(changeRequestInterfaces.changeRequestId, cr.id));

        bpImpacts?.forEach((impact) => {
          const bpId = impact.businessProcess.id;
          if (!impacts.businessProcesses.has(bpId)) {
            impacts.businessProcesses.set(bpId, []);
          }
          impacts.businessProcesses.get(bpId)!.push({
            cr: cr.crNumber,
            impactType: impact.impactType || '',
            impact: impact.businessProcess
          });
        });

        impactsByCP.set(cr.crNumber, impacts);
      }

      // Analyze common impacts
      const commonApplications = this.findCommonImpacts(impactsByCP, 'applications');
      const commonInterfaces = this.findCommonImpacts(impactsByCP, 'interfaces');
      const commonBusinessProcesses = this.findCommonImpacts(impactsByCP, 'businessProcesses');

      // Analyze timeline conflicts
      const timeline = crs.map(cr => ({
        crNumber: cr.crNumber,
        targetDate: cr.targetDate,
        conflicts: this.findTimelineConflicts(cr, crs)
      }));

      // Generate overall risk assessment
      const overallRiskAssessment = this.assessOverallRisk(
        commonApplications,
        commonInterfaces,
        commonBusinessProcesses,
        timeline
      );

      return {
        success: true,
        analysis: {
          commonApplications,
          commonInterfaces,
          commonBusinessProcesses,
          overallRiskAssessment,
          timeline
        }
      };
    } catch (error) {
      console.error("Error generating cross-CR analysis:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate cross-CR analysis"
      };
    }
  }

  private static findCommonImpacts(
    impactsByCP: Map<string, any>,
    type: 'applications' | 'interfaces' | 'businessProcesses'
  ): any[] {
    const allImpacts = new Map<number, { artifact: any; crs: Set<string>; impacts: any[] }>();

    // Collect all impacts by artifact ID
    impactsByCP.forEach((impacts, crNumber) => {
      impacts[type].forEach((impactList: any[], artifactId: number) => {
        if (!allImpacts.has(artifactId)) {
          allImpacts.set(artifactId, {
            artifact: impactList[0]?.impact,
            crs: new Set(),
            impacts: []
          });
        }
        const record = allImpacts.get(artifactId)!;
        record.crs.add(crNumber);
        record.impacts.push(...impactList);
      });
    });

    // Filter for common impacts (affected by 2+ CRs)
    const commonImpacts: any[] = [];
    allImpacts.forEach((record, artifactId) => {
      if (record.crs.size >= 2) {
        const conflictType = this.detectConflictType(record.impacts);
        const riskLevel = this.assessRiskLevel(record.impacts, record.crs.size);
        
        commonImpacts.push({
          [type === 'applications' ? 'application' : type === 'interfaces' ? 'interface' : 'businessProcess']: record.artifact,
          affectedByCRs: Array.from(record.crs),
          conflictType,
          riskLevel
        });
      }
    });

    return commonImpacts.sort((a, b) => {
      const riskOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
      return (riskOrder[a.riskLevel] || 999) - (riskOrder[b.riskLevel] || 999);
    });
  }

  private static detectConflictType(impacts: any[]): string | undefined {
    const impactTypes = new Set(impacts.map(i => i.impactType));
    
    if (impactTypes.has('deletion') && impactTypes.has('modification')) {
      return 'deletion'; // Deletion takes precedence
    }
    if (impactTypes.has('version_change') && impactTypes.size > 1) {
      return 'version_change';
    }
    if (impactTypes.has('status_change') && impactTypes.has('modification')) {
      return 'status_change';
    }
    if (impactTypes.size > 1) {
      return 'modification';
    }
    return undefined;
  }

  private static assessRiskLevel(impacts: any[], crCount: number): 'low' | 'medium' | 'high' | 'critical' {
    const hasConflict = impacts.some(i => i.impactType === 'deletion') && 
                       impacts.some(i => i.impactType === 'modification');
    
    if (hasConflict || crCount > 3) return 'critical';
    if (crCount > 2 || impacts.some(i => i.impactType === 'deletion')) return 'high';
    if (impacts.some(i => i.impactType === 'version_change')) return 'medium';
    return 'low';
  }

  private static findTimelineConflicts(cr: any, allCRs: any[]): string[] {
    const conflicts: string[] = [];
    const crDate = cr.targetDate ? new Date(cr.targetDate) : null;
    
    if (!crDate) return conflicts;

    allCRs.forEach(otherCr => {
      if (otherCr.crNumber === cr.crNumber) return;
      
      const otherDate = otherCr.targetDate ? new Date(otherCr.targetDate) : null;
      if (!otherDate) return;

      const daysDiff = Math.abs((crDate.getTime() - otherDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff <= 7) {
        conflicts.push(`${otherCr.crNumber} scheduled within 7 days`);
      }
    });

    return conflicts;
  }

  private static assessOverallRisk(
    commonApps: any[],
    commonInterfaces: any[],
    commonBPs: any[],
    timeline: any[]
  ): CrossCRImpact['overallRiskAssessment'] {
    const conflicts: string[] = [];
    const recommendations: string[] = [];
    let riskScore = 0;

    // Check for critical conflicts
    const criticalItems = [
      ...commonApps.filter(a => a.riskLevel === 'critical'),
      ...commonInterfaces.filter(i => i.riskLevel === 'critical'),
      ...commonBPs.filter(b => b.riskLevel === 'critical')
    ];

    if (criticalItems.length > 0) {
      riskScore += criticalItems.length * 10;
      conflicts.push(`${criticalItems.length} critical conflicts detected across CRs`);
      recommendations.push("Immediate coordination required between CR owners");
      recommendations.push("Consider consolidating related CRs to avoid conflicts");
    }

    // Check timeline conflicts
    const timelineConflicts = timeline.filter(t => t.conflicts.length > 0);
    if (timelineConflicts.length > 0) {
      riskScore += timelineConflicts.length * 5;
      conflicts.push(`${timelineConflicts.length} CRs have overlapping timelines`);
      recommendations.push("Stagger deployment schedules by at least 2 weeks");
    }

    // Check scope overlap
    const totalOverlap = commonApps.length + commonInterfaces.length + commonBPs.length;
    if (totalOverlap > 10) {
      riskScore += 15;
      conflicts.push(`High overlap detected: ${totalOverlap} common artifacts`);
      recommendations.push("Consider creating a unified release plan");
    }

    // Determine overall risk level
    let level: 'low' | 'medium' | 'high' | 'critical';
    if (riskScore >= 30) level = 'critical';
    else if (riskScore >= 20) level = 'high';
    else if (riskScore >= 10) level = 'medium';
    else level = 'low';

    return {
      level,
      conflicts,
      recommendations
    };
  }

  /**
   * Generate a professional impact report using AutoX
   */
  static async generateCrossCRReport(
    crossCRData: CrossCRImpact,
    crIds: string[],
    userId: number
  ): Promise<{ success: boolean; report?: string; error?: string }> {
    try {
      // Fetch user's AutoX credentials
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      
      if (!user?.autoXApiKey || !user?.autoXUsername) {
        return {
          success: false,
          error: "AutoX credentials not configured. Please configure them in Settings."
        };
      }

      // Build the prompt for AutoX
      const prompt = this.buildCrossCRReportPrompt(crossCRData, crIds);
      
      // Call AutoX API
      const report = await this.callAutoXAPI(prompt, user.autoXApiKey, user.autoXUsername);
      
      if (!report) {
        return {
          success: false,
          error: "Failed to generate report from AutoX"
        };
      }

      return {
        success: true,
        report
      };
    } catch (error) {
      console.error("Error generating Cross-CR report:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate report"
      };
    }
  }

  private static buildCrossCRReportPrompt(data: CrossCRImpact, crIds: string[]): string {
    return `You are an expert business analyst creating a professional Cross-Change Request Impact Assessment Report.

# Input Data

**Change Requests Being Analyzed:** ${crIds.join(', ')}

## Common Applications (${data.commonApplications.length})
${JSON.stringify(data.commonApplications, null, 2)}

## Common Interfaces (${data.commonInterfaces.length})
${JSON.stringify(data.commonInterfaces, null, 2)}

## Common Business Processes (${data.commonBusinessProcesses.length})
${JSON.stringify(data.commonBusinessProcesses, null, 2)}

## Overall Risk Assessment
${JSON.stringify(data.overallRiskAssessment, null, 2)}

## Timeline Conflicts
${JSON.stringify(data.timeline, null, 2)}

---

# Instructions

Generate a comprehensive Cross-CR Impact Assessment Report with the following structure:

# CROSS-CHANGE REQUEST IMPACT ASSESSMENT REPORT

## EXECUTIVE SUMMARY
Provide a concise 2-3 paragraph overview that:
- Summarizes the scope of analysis (which CRs were analyzed)
- Highlights the key findings (number of common artifacts, risk level)
- States the most critical risks and conflicts
- Provides top-level recommendations

## 1. ANALYSIS OVERVIEW

### 1.1 Change Requests Analyzed
List each CR with its key details and objectives

### 1.2 Analysis Methodology
Brief description of how cross-CR impacts were identified

### 1.3 Summary Statistics
- Total common applications: X
- Total common interfaces: Y
- Total common business processes: Z
- Overall risk level: [Level]

## 2. DETAILED IMPACT ANALYSIS

### 2.1 Common Applications Impact
For each common application:
- Application name and description
- CRs affecting this application
- Type of changes/conflicts
- Risk level and justification
- Specific concerns

### 2.2 Common Interfaces Impact
For each common interface:
- Interface details (IML number, provider, consumer)
- CRs affecting this interface
- Type of changes/conflicts
- Risk level and justification
- Integration concerns

### 2.3 Common Business Processes Impact
For each common business process:
- Process name and business area
- CRs affecting this process
- Type of changes/conflicts
- Risk level and justification
- Business impact

## 3. RISK ASSESSMENT

### 3.1 Critical Risks
Detailed analysis of all critical and high-risk items

### 3.2 Timeline Conflicts
Analysis of scheduling conflicts between CRs

### 3.3 Technical Dependencies
Map of technical dependencies between affected artifacts

### 3.4 Business Impact Summary
Overall business impact assessment

## 4. CONFLICT ANALYSIS

### 4.1 Modification Conflicts
Where multiple CRs modify the same artifact

### 4.2 Version Conflicts
Where version incompatibilities may arise

### 4.3 Deletion Conflicts
Where one CR deletes what another modifies

## 5. RECOMMENDATIONS

### 5.1 Immediate Actions Required
Critical steps to prevent conflicts

### 5.2 Coordination Requirements
How CR teams should coordinate

### 5.3 Implementation Sequencing
Recommended order of CR implementation

### 5.4 Risk Mitigation Strategies
Specific strategies for each identified risk

## 6. IMPLEMENTATION ROADMAP

### 6.1 Phased Approach
If applicable, how to phase the implementations

### 6.2 Dependency Management
How to manage interdependencies

### 6.3 Testing Strategy
Integrated testing approach for all CRs

## 7. APPENDICES

### Appendix A: Detailed Artifact Lists
Complete lists of all affected artifacts

### Appendix B: Risk Matrix
Visual representation of risks by artifact

### Appendix C: Timeline Chart
Visual timeline showing all CR schedules

---

Format the report using professional markdown with:
- Clear section numbering
- Bullet points for lists
- Tables where appropriate
- Bold for emphasis
- Risk level badges using markdown formatting
- Professional, clear language suitable for executive review`;
  }

  private static async callAutoXAPI(
    prompt: string,
    apiKey: string,
    username: string
  ): Promise<string | null> {
    try {
      // First, send the request to get a task ID
      const taskId = await this.sendAutoXRequest(prompt, apiKey, username);
      if (!taskId) {
        return null;
      }

      // Then wait for the task to complete
      const result = await this.waitForAutoXCompletion(taskId);
      return result;
    } catch (error) {
      console.error('AutoX API error:', error);
      return null;
    }
  }

  private static async sendAutoXRequest(
    prompt: string,
    apiKey: string,
    username: string
  ): Promise<string | null> {
    return new Promise((resolve) => {
      const requestData = {
        username,
        apikey: apiKey,
        conv_id: '',
        application: 'ait-impact-assessment',
        messages: [{ user: prompt }],
        promptfilename: '',
        promptname: '',
        prompttype: 'system',
        promptrole: 'You are a professional business analyst creating impact assessment reports using Amdocs AutoX',
        prompttask: 'Create a comprehensive impact assessment report for system changes',
        promptexamples: '',
        promptformat: 'Return a well-formatted markdown report',
        promptrestrictions: 'Be thorough, professional, and actionable',
        promptadditional: 'Focus on business value and risk mitigation',
        max_tokens: 8000,
        model_type: 'GPT4o_128K',
        temperature: 0.3,
        topKChunks: 5,
        read_from_your_data: false,
        data_filenames: [],
        document_groupname: '',
        document_grouptags: [],
        find_the_best_response: false,
        chat_attr: {},
        additional_attr: {}
      };

      const data = JSON.stringify(requestData);
      
      const options = {
        hostname: 'chat.autox.corp.amdocs.azr',
        path: '/api/v1/chats/send-message',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'accept': 'application/json',
          'Content-Length': Buffer.byteLength(data)
        },
        agent: new https.Agent({
          rejectUnauthorized: false
        }),
        timeout: 120000
      };

      const req = https.request(options, (res) => {
        let responseBody = '';
        
        res.on('data', (chunk) => {
          responseBody += chunk;
        });
        
        res.on('end', () => {
          try {
            const response = JSON.parse(responseBody);
            if (response.task_id) {
              resolve(response.task_id);
            } else {
              console.error('No task_id in AutoX response:', response);
              resolve(null);
            }
          } catch (error) {
            console.error('Failed to parse AutoX response:', error);
            resolve(null);
          }
        });
      });

      req.on('error', (error) => {
        console.error('AutoX API request error:', error);
        resolve(null);
      });

      req.on('timeout', () => {
        console.error('AutoX API request timeout');
        req.destroy();
        resolve(null);
      });

      req.write(data);
      req.end();
    });
  }

  private static async checkAutoXTaskStatus(taskId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'chat.autox.corp.amdocs.azr',
        path: `/api/v1/chats/status/${taskId}`,
        method: 'GET',
        headers: {
          'accept': 'application/json'
        },
        agent: new https.Agent({
          rejectUnauthorized: false
        })
      };

      const req = https.request(options, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          try {
            const response = JSON.parse(responseData);
            resolve(response);
          } catch (error) {
            reject(new Error(`Failed to parse status response: ${responseData}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.end();
    });
  }

  private static async waitForAutoXCompletion(
    taskId: string,
    maxAttempts = 60,
    delayMs = 2000
  ): Promise<string | null> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const status = await this.checkAutoXTaskStatus(taskId);
        
        if (status.status === 'Complete' || status.status === 'complete') {
          return status.result || null;
        } else if (status.status === 'Failed' || status.status === 'failed') {
          console.error(`AutoX task failed: ${status.result || 'Unknown error'}`);
          return null;
        }
        
        // Wait before next attempt
        await new Promise(resolve => setTimeout(resolve, delayMs));
      } catch (error) {
        console.error('Error checking AutoX task status:', error);
        return null;
      }
    }
    
    console.error(`AutoX task did not complete after ${maxAttempts} attempts`);
    return null;
  }
  
  private static extractRiskLevel(assessment: string): string {
    const lowerAssessment = assessment.toLowerCase();
    if (lowerAssessment.includes('critical risk') || lowerAssessment.includes('risk rating: critical')) {
      return 'critical';
    } else if (lowerAssessment.includes('high risk') || lowerAssessment.includes('risk rating: high')) {
      return 'high';
    } else if (lowerAssessment.includes('medium risk') || lowerAssessment.includes('risk rating: medium')) {
      return 'medium';
    }
    return 'low';
  }
}

// Service initialization not needed for AutoX (uses user credentials)