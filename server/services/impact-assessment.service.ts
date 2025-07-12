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
      const changeHistory = await db
        .select()
        .from(versionControlChangeHistory)
        .where(
          and(
            eq(versionControlChangeHistory.artifactId, artifact.artifactId),
            eq(versionControlChangeHistory.artifactType, artifact.artifactType)
          )
        );

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
}

// Initialize the service
ImpactAssessmentService.initialize();