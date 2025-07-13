import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "../db";
import { eq, and, inArray } from "drizzle-orm";
import * as fs from 'fs/promises';
import * as path from 'path';
import {
  initiatives,
  artifactVersions,
  applications,
  interfaces,
  businessProcesses,
  businessProcessInterfaces,
  changeRequests
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
  private static genAI: GoogleGenerativeAI;

  static initialize() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY not set. Impact assessment generation will be disabled.");
      return;
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  static async generateImpactAssessment(initiativeId: string): Promise<{
    success: boolean;
    assessment?: string;
    documentPath?: string;
    error?: string;
  }> {
    try {
      if (!this.genAI) {
        return {
          success: false,
          error: "AutoX service not configured. Please set GEMINI_API_KEY environment variable."
        };
      }

      // Gather all data needed for assessment
      const assessmentData = await this.gatherAssessmentData(initiativeId);
      
      if (!assessmentData) {
        return {
          success: false,
          error: "Initiative not found or has no changes"
        };
      }

      // Generate the assessment using AutoX (Gemini)
      const model = this.genAI.getGenerativeModel({ 
        model: 'gemini-2.0-flash-exp' // Using same model as capability extraction
      });

      const prompt = this.buildAssessmentPrompt(assessmentData);
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const assessment = response.text();

      // Save the assessment as a document
      const documentPath = await this.saveAssessmentDocument(
        assessmentData.initiative.id,
        assessmentData.initiative.name,
        assessment
      );

      return {
        success: true,
        assessment,
        documentPath
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
      .where(eq(initiatives.id, initiativeId));

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
          .where(eq(applications.id, parseInt(artifact.artifactId)));
        
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
          .where(eq(interfaces.id, parseInt(artifact.artifactId)));
        
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
          .where(eq(businessProcesses.id, parseInt(artifact.artifactId)));
        
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
    const changeRequestIds = [...new Set(artifacts.map(a => a.changeRequestId).filter(Boolean))];
    const changeRequestsList = changeRequestIds.length > 0
      ? await db
          .select()
          .from(changeRequests)
          .where(inArray(changeRequests.id, changeRequestIds as number[]))
      : [];

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

    return `You are an expert business analyst using the AutoX intelligent analysis system to create a comprehensive impact assessment document for a system change initiative. 

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
        const [appImpacts] = await db.raw(`
          SELECT ca.*, a.*
          FROM change_request_applications ca
          JOIN applications a ON ca.application_id = a.id
          WHERE ca.change_request_id = ?
        `, [cr.id]);

        appImpacts?.forEach((impact: any) => {
          const appId = impact.application_id;
          if (!impacts.applications.has(appId)) {
            impacts.applications.set(appId, []);
          }
          impacts.applications.get(appId)!.push({
            cr: cr.crNumber,
            impactType: impact.impact_type,
            impact
          });
        });

        // Get interface impacts
        const [ifaceImpacts] = await db.raw(`
          SELECT ci.*, i.*
          FROM change_request_interfaces ci
          JOIN interfaces i ON ci.interface_id = i.id
          WHERE ci.change_request_id = ?
        `, [cr.id]);

        ifaceImpacts?.forEach((impact: any) => {
          const ifaceId = impact.interface_id;
          if (!impacts.interfaces.has(ifaceId)) {
            impacts.interfaces.set(ifaceId, []);
          }
          impacts.interfaces.get(ifaceId)!.push({
            cr: cr.crNumber,
            impactType: impact.impact_type,
            impact
          });
        });

        // Get business process impacts (via interfaces)
        const [bpImpacts] = await db.raw(`
          SELECT DISTINCT bp.*, ci.impact_type
          FROM change_request_interfaces ci
          JOIN business_process_interfaces bpi ON bpi.interface_id = ci.interface_id
          JOIN business_processes bp ON bp.id = bpi.business_process_id
          WHERE ci.change_request_id = ?
        `, [cr.id]);

        bpImpacts?.forEach((impact: any) => {
          const bpId = impact.id;
          if (!impacts.businessProcesses.has(bpId)) {
            impacts.businessProcesses.set(bpId, []);
          }
          impacts.businessProcesses.get(bpId)!.push({
            cr: cr.crNumber,
            impactType: impact.impact_type,
            impact
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
      const riskOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
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
}

// Initialize the service
ImpactAssessmentService.initialize();