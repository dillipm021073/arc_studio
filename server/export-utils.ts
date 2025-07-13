import * as XLSX from 'xlsx';
import { db } from "./db";
import { 
  applications, 
  interfaces, 
  businessProcesses, 
  businessProcessRelationships,
  changeRequests,
  businessProcessInterfaces,
  changeRequestApplications,
  changeRequestInterfaces,
  technicalProcesses,
  technicalProcessInterfaces,
  technicalProcessDependencies,
  changeRequestTechnicalProcesses
} from "../shared/schema";
import { eq } from "drizzle-orm";

// Helper function to flatten data and concatenate multiple values
function flattenData(data: any[], joinFields?: { [key: string]: string }): any[] {
  return data.map(item => {
    const flattened: any = {};
    
    for (const [key, value] of Object.entries(item)) {
      if (value === null || value === undefined) {
        flattened[key] = '';
      } else if (value instanceof Date) {
        flattened[key] = value.toISOString().split('T')[0];
      } else if (typeof value === 'boolean') {
        flattened[key] = value ? 'Yes' : 'No';
      } else if (Array.isArray(value)) {
        // Join array values with semicolon
        flattened[key] = value.join('; ');
      } else {
        flattened[key] = value.toString();
      }
    }
    
    return flattened;
  });
}

// Export applications with flat structure including new artifact fields
export async function exportApplicationsToXLSX() {
  try {
    const applicationsData = await db.select().from(applications);
    
    // Map the data to include all fields with proper formatting
    const mappedData = applicationsData.map(app => ({
      'ID': app.id,
      'AML Number': app.amlNumber,
      'Name': app.name,
      'Description': app.description || '',
      'LOB': app.lob || '',
      'OS': app.os || '',
      'Deployment': app.deployment || '',
      'Uptime': app.uptime || '',
      'Purpose': app.purpose || '',
      'Provides Ext Interface': app.providesExtInterface ? 'Yes' : 'No',
      'Prov Interface Type': app.provInterfaceType || '',
      'Consumes Ext Interfaces': app.consumesExtInterfaces ? 'Yes' : 'No',
      'Cons Interface Type': app.consInterfaceType || '',
      'Status': app.status,
      'Artifact State': app.artifactState || 'active',
      'Planned Activation Date': app.plannedActivationDate ? new Date(app.plannedActivationDate).toISOString().split('T')[0] : '',
      'Initiative Origin': app.initiativeOrigin || '',
      'First Active Date': app.firstActiveDate ? new Date(app.firstActiveDate).toISOString().split('T')[0] : '',
      'Last Change Date': app.lastChangeDate ? new Date(app.lastChangeDate).toISOString().split('T')[0] : '',
      'Decommission Date': app.decommissionDate ? new Date(app.decommissionDate).toISOString().split('T')[0] : '',
      'Decommission Reason': app.decommissionReason || '',
      'Decommissioned By': app.decommissionedBy || '',
      'X Position': app.xPosition || '',
      'Y Position': app.yPosition || '',
      'Layer': app.layer || '',
      'Criticality': app.criticality || '',
      'Team': app.team || '',
      'TMF Domain': app.tmfDomain || '',
      'Created At': app.createdAt ? new Date(app.createdAt).toISOString().split('T')[0] : '',
      'Updated At': app.updatedAt ? new Date(app.updatedAt).toISOString().split('T')[0] : ''
    }));
    
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(mappedData);
    
    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, "Applications");
    
    // Generate buffer
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
    
    return {
      buffer,
      filename: `applications-export-${new Date().toISOString().split('T')[0]}.xlsx`
    };
  } catch (error) {
    console.error("Error exporting applications to XLSX:", error);
    throw error;
  }
}

// Export interfaces with related data in flat structure
export async function exportInterfacesToXLSX() {
  try {
    // Get interfaces with their relationships
    const interfacesData = await db.select().from(interfaces);
    
    // Get business process relationships
    const bpRelations = await db.select({
      interfaceId: businessProcessInterfaces.interfaceId,
      businessProcessId: businessProcessInterfaces.businessProcessId,
      sequenceNumber: businessProcessInterfaces.sequenceNumber,
      description: businessProcessInterfaces.description
    }).from(businessProcessInterfaces);
    
    // Get business process details
    const bpData = await db.select().from(businessProcesses);
    const bpMap = new Map(bpData.map(bp => [bp.id, bp]));
    
    // Get applications data for provider/consumer names
    const appsData = await db.select().from(applications);
    const appsMap = new Map(appsData.map(app => [app.id, app]));
    
    // Build flat data structure
    const flatData = interfacesData.map(iface => {
      // Get related business processes
      const relatedBPs = bpRelations
        .filter(rel => rel.interfaceId === iface.id)
        .map(rel => {
          const bp = bpMap.get(rel.businessProcessId!);
          return bp ? `${bp.businessProcess} (Seq: ${rel.sequenceNumber})` : '';
        })
        .filter(Boolean);
      
      // Get provider and consumer names
      const providerApp = iface.providerApplicationId ? appsMap.get(iface.providerApplicationId) : null;
      const consumerApp = iface.consumerApplicationId ? appsMap.get(iface.consumerApplicationId) : null;
      
      return {
        'ID': iface.id,
        'IML Number': iface.imlNumber,
        'Interface Type': iface.interfaceType,
        'Version': iface.version,
        'LOB': iface.lob || 'TBD',
        'Status': iface.status,
        'Artifact State': iface.artifactState || 'active',
        'Planned Activation Date': iface.plannedActivationDate ? new Date(iface.plannedActivationDate).toISOString().split('T')[0] : '',
        'Initiative Origin': iface.initiativeOrigin || '',
        'Provider Application': providerApp?.name || '',
        'Consumer Application': consumerApp?.name || '',
        'Business Processes': relatedBPs.join('; ') || 'None',
        'Customer Focal': iface.customerFocal || '',
        'Provider Owner': iface.providerOwner || '',
        'Consumer Owner': iface.consumerOwner || '',
        'Sample Code': iface.sampleCode ? 'Yes' : 'No',
        'Connectivity Steps': iface.connectivitySteps ? 'Yes' : 'No',
        'Interface Test Steps': iface.interfaceTestSteps ? 'Yes' : 'No',
        'Last Change Date': iface.lastChangeDate ? new Date(iface.lastChangeDate).toISOString().split('T')[0] : '',
        'Created At': iface.createdAt ? new Date(iface.createdAt).toISOString().split('T')[0] : '',
        'Updated At': iface.updatedAt ? new Date(iface.updatedAt).toISOString().split('T')[0] : ''
      };
    });
    
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(flatData);
    
    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, "Interfaces");
    
    // Generate buffer
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
    
    return {
      buffer,
      filename: `interfaces-export-${new Date().toISOString().split('T')[0]}.xlsx`
    };
  } catch (error) {
    console.error("Error exporting interfaces to XLSX:", error);
    throw error;
  }
}

// Export business processes with related interfaces
export async function exportBusinessProcessesToXLSX() {
  try {
    const bpData = await db.select().from(businessProcesses);
    
    // Get interface relationships
    const bpInterfaceRelations = await db.select().from(businessProcessInterfaces);
    const interfacesData = await db.select().from(interfaces);
    const interfacesMap = new Map(interfacesData.map(iface => [iface.id, iface]));
    
    // Build flat data structure
    const flatData = bpData.map(bp => {
      // Get related interfaces
      const relatedInterfaces = bpInterfaceRelations
        .filter(rel => rel.businessProcessId === bp.id)
        .sort((a, b) => (a.sequenceNumber || 0) - (b.sequenceNumber || 0))
        .map(rel => {
          const iface = interfacesMap.get(rel.interfaceId!);
          return iface ? `${iface.imlNumber} (Seq: ${rel.sequenceNumber})` : '';
        })
        .filter(Boolean);
      
      return {
        'Business Process': bp.businessProcess,
        'LOB': bp.lob,
        'Product': bp.product,
        'Version': bp.version,
        'Status': bp.status,
        'Domain Owner': bp.domainOwner || '',
        'IT Owner': bp.itOwner || '',
        'Vendor Focal': bp.vendorFocal || '',
        'Related Interfaces': relatedInterfaces.join('; ') || 'None',
        'Interface Count': relatedInterfaces.length,
        'Created At': bp.createdAt ? new Date(bp.createdAt).toISOString().split('T')[0] : '',
        'Updated At': bp.updatedAt ? new Date(bp.updatedAt).toISOString().split('T')[0] : ''
      };
    });
    
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(flatData);
    
    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, "Business Processes");
    
    // Generate buffer
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
    
    return {
      buffer,
      filename: `business-processes-export-${new Date().toISOString().split('T')[0]}.xlsx`
    };
  } catch (error) {
    console.error("Error exporting business processes to XLSX:", error);
    throw error;
  }
}

// Export change requests with impact analysis
export async function exportChangeRequestsToXLSX() {
  try {
    const crData = await db.select().from(changeRequests);
    
    // Get impact data
    const crApps = await db.select().from(changeRequestApplications);
    const crInterfaces = await db.select().from(changeRequestInterfaces);
    
    // Get application and interface details
    const appsData = await db.select().from(applications);
    const interfacesData = await db.select().from(interfaces);
    const appsMap = new Map(appsData.map(app => [app.id, app]));
    const interfacesMap = new Map(interfacesData.map(iface => [iface.id, iface]));
    
    // Build flat data structure
    const flatData = crData.map(cr => {
      // Get impacted applications
      const impactedApps = crApps
        .filter(impact => impact.changeRequestId === cr.id)
        .map(impact => {
          const app = appsMap.get(impact.applicationId!);
          return app ? `${app.name} (${impact.impactType || 'impact'})` : '';
        })
        .filter(Boolean);
      
      // Get impacted interfaces
      const impactedInterfaces = crInterfaces
        .filter(impact => impact.changeRequestId === cr.id)
        .map(impact => {
          const iface = interfacesMap.get(impact.interfaceId!);
          return iface ? `${iface.imlNumber} (${impact.impactType || 'impact'})` : '';
        })
        .filter(Boolean);
      
      return {
        'CR Number': cr.crNumber,
        'Title': cr.title,
        'Description': cr.description || '',
        'Reason': cr.reason || '',
        'Benefit': cr.benefit || '',
        'Status': cr.status,
        'Priority': cr.priority || 'medium',
        'Owner': cr.owner || '',
        'Requested By': cr.requestedBy || '',
        'Approved By': cr.approvedBy || '',
        'Impacted Applications': impactedApps.join('; ') || 'None',
        'Impacted Application Count': impactedApps.length,
        'Impacted Interfaces': impactedInterfaces.join('; ') || 'None',
        'Impacted Interface Count': impactedInterfaces.length,
        'Target Date': cr.targetDate ? new Date(cr.targetDate).toISOString().split('T')[0] : '',
        'Completed Date': cr.completedDate ? new Date(cr.completedDate).toISOString().split('T')[0] : '',
        'Created At': cr.createdAt ? new Date(cr.createdAt).toISOString().split('T')[0] : '',
        'Updated At': cr.updatedAt ? new Date(cr.updatedAt).toISOString().split('T')[0] : ''
      };
    });
    
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(flatData);
    
    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, "Change Requests");
    
    // Generate buffer
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
    
    return {
      buffer,
      filename: `change-requests-export-${new Date().toISOString().split('T')[0]}.xlsx`
    };
  } catch (error) {
    console.error("Error exporting change requests to XLSX:", error);
    throw error;
  }
}

// Export business processes with tree view hierarchy
export async function exportBusinessProcessesTreeViewToXLSX() {
  try {
    // Get all business processes and relationships
    const bpData = await db.select().from(businessProcesses);
    const bpRelationships = await db.select().from(businessProcessRelationships);
    
    // Get interface relationships for each process
    const bpInterfaceRelations = await db.select().from(businessProcessInterfaces);
    const interfacesData = await db.select().from(interfaces);
    const interfacesMap = new Map(interfacesData.map(iface => [iface.id, iface]));
    
    // Build process map
    const processMap = new Map<number, any>();
    bpData.forEach(p => processMap.set(p.id, p));
    
    // Create a map of parent to children
    const childrenMap = new Map<number, { process: any; sequenceNumber: number }[]>();
    
    bpRelationships.forEach(rel => {
      const child = processMap.get(rel.childProcessId);
      if (child) {
        if (!childrenMap.has(rel.parentProcessId)) {
          childrenMap.set(rel.parentProcessId, []);
        }
        childrenMap.get(rel.parentProcessId)?.push({
          process: child,
          sequenceNumber: rel.sequenceNumber
        });
      }
    });
    
    // Sort children by sequence number
    childrenMap.forEach(children => {
      children.sort((a, b) => a.sequenceNumber - b.sequenceNumber);
    });
    
    // Function to get interfaces for a process
    const getProcessInterfaces = (processId: number) => {
      return bpInterfaceRelations
        .filter(rel => rel.businessProcessId === processId)
        .sort((a, b) => (a.sequenceNumber || 0) - (b.sequenceNumber || 0))
        .map(rel => {
          const iface = interfacesMap.get(rel.interfaceId!);
          return iface ? `${iface.imlNumber} (Seq: ${rel.sequenceNumber})` : '';
        })
        .filter(Boolean);
    };
    
    // Build flat data with hierarchy
    const flatData: any[] = [];
    let sequenceCounter = { A: 0, B: 0, C: 0 };
    
    // Recursive function to traverse tree
    const traverseTree = (processId: number, depth: number = 0, parentSequence: string = '', levelASequence: string = '') => {
      const process = processMap.get(processId);
      if (!process) return;
      
      const children = childrenMap.get(processId) || [];
      
      // Calculate sequence based on level
      let currentSequence = '';
      if (process.level === 'A') {
        sequenceCounter.A++;
        sequenceCounter.B = 0;
        sequenceCounter.C = 0;
        currentSequence = `${sequenceCounter.A}.0`;
        levelASequence = `${sequenceCounter.A}`;
      } else if (process.level === 'B') {
        sequenceCounter.B++;
        sequenceCounter.C = 0;
        currentSequence = `${levelASequence}${sequenceCounter.B}.0`;
      } else if (process.level === 'C') {
        sequenceCounter.C++;
        const parentBSequence = parentSequence.split('.')[0];
        currentSequence = `${parentBSequence}.${sequenceCounter.C}`;
      }
      
      // Get related interfaces
      const relatedInterfaces = getProcessInterfaces(processId);
      
      // Create indentation based on level
      let indentation = '';
      if (process.level === 'B') {
        indentation = '***';
      } else if (process.level === 'C') {
        indentation = '******';
      }
      
      flatData.push({
        'Hierarchy': indentation + (indentation ? ' ' : '') + process.businessProcess,
        'Sequence': currentSequence,
        'Level': process.level,
        'Business Process': process.businessProcess,
        'LOB': process.lob,
        'Product': process.product,
        'Version': process.version,
        'Status': process.status,
        'Domain Owner': process.domainOwner || '',
        'IT Owner': process.itOwner || '',
        'Vendor Focal': process.vendorFocal || '',
        'Related Interfaces': relatedInterfaces.join('; ') || 'None',
        'Interface Count': relatedInterfaces.length,
        'Created At': process.createdAt ? new Date(process.createdAt).toISOString().split('T')[0] : '',
        'Updated At': process.updatedAt ? new Date(process.updatedAt).toISOString().split('T')[0] : ''
      });
      
      // Process children - sort by sequence number
      children.sort((a, b) => a.sequenceNumber - b.sequenceNumber);
      children.forEach((child) => {
        traverseTree(child.process.id, depth + 1, currentSequence, levelASequence);
      });
    };
    
    // Find root nodes (Level A processes without parents)
    const rootProcesses = bpData.filter(p => {
      if (p.level !== 'A') return false;
      return !bpRelationships.some(rel => rel.childProcessId === p.id);
    });
    
    // Sort root processes by name
    rootProcesses.sort((a, b) => a.businessProcess.localeCompare(b.businessProcess));
    
    // Traverse each root
    rootProcesses.forEach((root, index) => {
      traverseTree(root.id, 0);
    });
    
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(flatData);
    
    // Set column widths
    const colWidths = [
      { wch: 50 }, // Hierarchy
      { wch: 15 }, // Sequence
      { wch: 10 }, // Level
      { wch: 30 }, // Business Process
      { wch: 15 }, // LOB
      { wch: 20 }, // Product
      { wch: 10 }, // Version
      { wch: 15 }, // Status
      { wch: 20 }, // Domain Owner
      { wch: 20 }, // IT Owner
      { wch: 20 }, // Vendor Focal
      { wch: 40 }, // Related Interfaces
      { wch: 15 }, // Interface Count
      { wch: 15 }, // Created At
      { wch: 15 }  // Updated At
    ];
    ws['!cols'] = colWidths;
    
    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, "Business Process Tree");
    
    // Generate buffer
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
    
    return {
      buffer,
      filename: `business-processes-tree-export-${new Date().toISOString().split('T')[0]}.xlsx`
    };
  } catch (error) {
    console.error("Error exporting business processes tree view to XLSX:", error);
    throw error;
  }
}

// Export technical processes with related data
export async function exportTechnicalProcessesToXLSX() {
  try {
    const tpData = await db.select().from(technicalProcesses);
    
    // Get related data
    const tpInterfaces = await db.select().from(technicalProcessInterfaces);
    const tpDependencies = await db.select().from(technicalProcessDependencies);
    const interfacesData = await db.select().from(interfaces);
    const appsData = await db.select().from(applications);
    
    // Create maps for lookups
    const interfacesMap = new Map(interfacesData.map(iface => [iface.id, iface]));
    const appsMap = new Map(appsData.map(app => [app.id, app]));
    const tpMap = new Map(tpData.map(tp => [tp.id, tp]));
    
    // Build flat data structure
    const flatData = tpData.map(tp => {
      // Get related interfaces
      const relatedInterfaces = tpInterfaces
        .filter(rel => rel.technicalProcessId === tp.id)
        .map(rel => {
          const iface = interfacesMap.get(rel.interfaceId!);
          return iface ? `${iface.imlNumber} (${rel.usageType})` : '';
        })
        .filter(Boolean);
      
      // Get dependencies
      const dependencies = tpDependencies
        .filter(dep => dep.technicalProcessId === tp.id)
        .map(dep => {
          const depProcess = tpMap.get(dep.dependsOnProcessId!);
          return depProcess ? `${depProcess.name} (${dep.dependencyType})` : '';
        })
        .filter(Boolean);
      
      // Get dependents
      const dependents = tpDependencies
        .filter(dep => dep.dependsOnProcessId === tp.id)
        .map(dep => {
          const depProcess = tpMap.get(dep.technicalProcessId!);
          return depProcess ? `${depProcess.name} (${dep.dependencyType})` : '';
        })
        .filter(Boolean);
      
      // Get application name
      const app = tp.applicationId ? appsMap.get(tp.applicationId) : null;
      
      return {
        'Process Name': tp.name,
        'Job Name': tp.jobName,
        'Application': app?.name || '',
        'Description': tp.description || '',
        'Frequency': tp.frequency,
        'Schedule': tp.schedule || '',
        'Criticality': tp.criticality,
        'Status': tp.status,
        'Business Owner': tp.owner || '',
        'Technical Owner': tp.technicalOwner || '',
        'Interfaces Used': relatedInterfaces.join('; ') || 'None',
        'Interface Count': relatedInterfaces.length,
        'Dependencies': dependencies.join('; ') || 'None',
        'Dependents': dependents.join('; ') || 'None',
        'Last Run Date': tp.lastRunDate ? new Date(tp.lastRunDate).toISOString().split('T')[0] : '',
        'Next Run Date': tp.nextRunDate ? new Date(tp.nextRunDate).toISOString().split('T')[0] : '',
        'Created At': tp.createdAt ? new Date(tp.createdAt).toISOString().split('T')[0] : '',
        'Updated At': tp.updatedAt ? new Date(tp.updatedAt).toISOString().split('T')[0] : ''
      };
    });
    
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(flatData);
    
    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, "Technical Processes");
    
    // Generate buffer
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
    
    return {
      buffer,
      filename: `technical-processes-export-${new Date().toISOString().split('T')[0]}.xlsx`
    };
  } catch (error) {
    console.error("Error exporting technical processes to XLSX:", error);
    throw error;
  }
}