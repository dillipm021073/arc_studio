import { Node, Edge, Position } from 'reactflow';

interface BusinessProcessWithInterfaces {
  id: number;
  businessProcess: string;
  level: string;
  sequenceNumber: number;
  interfaces: Array<{
    id: number;
    imlNumber: string;
    interfaceType: string;
    providerApp: any;
    consumerApp: any;
    sequenceNumber: number;
  }>;
  internalActivities?: Array<{
    id: number;
    activityName: string;
    activityType: string;
    description?: string;
    sequenceNumber: number;
    applicationId?: number;
    application?: any;
  }>;
  childProcesses?: BusinessProcessWithInterfaces[];
}

interface SIDUMLOptions {
  showChildProcesses?: boolean;
  showInterfaceDetails?: boolean;
  layoutDirection?: 'horizontal' | 'vertical';
  currentProcessActivities?: any[];
}

export function generateSIDUMLDiagramV2(
  processes: BusinessProcessWithInterfaces[],
  options: SIDUMLOptions = {}
): { nodes: Node[], edges: Edge[] } {
  const {
    showChildProcesses = true,
    showInterfaceDetails = true,
    currentProcessActivities = []
  } = options;

  const nodes: Node[] = [];
  const edges: Edge[] = [];
  
  // Collect all applications from interfaces and internal activities
  const applicationMap = new Map();
  const collectApplications = (process: BusinessProcessWithInterfaces) => {
    // From interfaces
    process.interfaces?.forEach(iface => {
      if (iface.providerApp) {
        applicationMap.set(iface.providerApp.id, iface.providerApp);
      }
      if (iface.consumerApp) {
        applicationMap.set(iface.consumerApp.id, iface.consumerApp);
      }
    });
    
    // From internal activities
    process.internalActivities?.forEach(activity => {
      if (activity.application) {
        applicationMap.set(activity.application.id, activity.application);
      }
    });
    
    // From current process activities (includes application data)
    currentProcessActivities.forEach(activityData => {
      if (activityData.application) {
        applicationMap.set(activityData.application.id, activityData.application);
      }
    });
    
    // Recursively collect from child processes
    process.childProcesses?.forEach(child => collectApplications(child));
  };
  
  processes.forEach(process => collectApplications(process));
  
  // Convert map to array and sort by name
  const applications = Array.from(applicationMap.values()).sort((a, b) => 
    a.name.localeCompare(b.name)
  );
  
  // Layout configuration
  const headerHeight = 100;
  const lifelineSpacing = 200;
  const lifelineStartY = headerHeight + 50;
  const lifelineHeight = 800;
  const sequenceStartY = lifelineStartY + 50;
  const sequenceSpacing = 80;
  
  // Create application lifeline nodes
  applications.forEach((app, index) => {
    const xPos = 100 + (index * lifelineSpacing);
    
    // Application header node
    nodes.push({
      id: `app-${app.id}`,
      type: 'sequenceNode',
      position: { x: xPos, y: 50 },
      data: { 
        label: app.name,
        application: app,
        isIML: false
      },
      draggable: false,
    });
    
    // Lifeline
    nodes.push({
      id: `lifeline-${app.id}`,
      type: 'sequenceBottomNode',
      position: { x: xPos, y: lifelineStartY },
      data: { 
        height: lifelineHeight,
        application: app,
        interfaces: [],
        currentHeight: lifelineHeight
      },
      draggable: false,
      selectable: false,
    });
  });
  
  // Helper to find application X position
  const getAppXPosition = (appId: number) => {
    const index = applications.findIndex(app => app.id === appId);
    return index >= 0 ? 100 + (index * lifelineSpacing) : 100;
  };
  
  // Process all items (interfaces, internal activities, child processes) in sequence order
  let currentY = sequenceStartY;
  let sequenceNumber = 1;
  
  const processItems = (process: BusinessProcessWithInterfaces, parentGroupId?: string) => {
    // Combine all items with their types and sequence numbers
    const allItems: any[] = [];
    
    // Add interfaces
    process.interfaces?.forEach(iface => {
      allItems.push({
        type: 'interface',
        data: iface,
        sequenceNumber: iface.sequenceNumber || sequenceNumber++
      });
    });
    
    // Add internal activities with application info
    const activitiesWithApp = process.internalActivities?.map(activity => {
      // Find the full activity data from currentProcessActivities
      const fullActivity = currentProcessActivities.find(a => a.activity.id === activity.id);
      return {
        type: 'activity',
        data: {
          ...activity,
          application: fullActivity?.application || activity.application,
          applicationId: fullActivity?.application?.id || activity.applicationId
        },
        sequenceNumber: activity.sequenceNumber || sequenceNumber++
      };
    }) || [];
    
    allItems.push(...activitiesWithApp);
    
    // Add child processes
    process.childProcesses?.forEach(child => {
      allItems.push({
        type: 'process',
        data: child,
        sequenceNumber: child.sequenceNumber || sequenceNumber++
      });
    });
    
    // Sort by sequence number
    allItems.sort((a, b) => a.sequenceNumber - b.sequenceNumber);
    
    // Create visual elements for each item
    allItems.forEach((item, itemIndex) => {
      if (item.type === 'interface') {
        const iface = item.data;
        if (iface.providerApp && iface.consumerApp) {
          const sourceX = getAppXPosition(iface.providerApp.id);
          const targetX = getAppXPosition(iface.consumerApp.id);
          
          edges.push({
            id: `iml-${iface.id}`,
            source: `lifeline-${iface.providerApp.id}`,
            target: `lifeline-${iface.consumerApp.id}`,
            sourceHandle: 'right',
            targetHandle: 'left',
            type: 'sequence',
            data: {
              imlNumber: iface.imlNumber,
              interfaceType: iface.interfaceType,
              imlId: iface.id,
              sequenceNumber: item.sequenceNumber,
              yPosition: currentY,
            },
            style: {
              strokeWidth: 2,
            },
          });
          
          currentY += sequenceSpacing;
        }
      } else if (item.type === 'activity') {
        const activity = item.data;
        if (activity.applicationId || activity.application?.id) {
          const appId = activity.applicationId || activity.application.id;
          const appX = getAppXPosition(appId);
          
          // Create self-loop edge for internal activity
          edges.push({
            id: `activity-${activity.id}`,
            source: `lifeline-${appId}`,
            target: `lifeline-${appId}`,
            type: 'selfloop',
            data: {
              isInternalActivity: true,
              activity: activity,
              sequenceNumber: item.sequenceNumber,
              yPosition: currentY,
            },
            style: {
              stroke: '#16a34a',
              strokeWidth: 2,
            },
          });
          
          currentY += sequenceSpacing;
        }
      } else if (item.type === 'process') {
        // Create a group node for child process
        const childProcess = item.data;
        const groupId = `group-${childProcess.id}`;
        
        nodes.push({
          id: groupId,
          type: 'processGroup',
          position: { x: 50, y: currentY },
          data: {
            businessProcess: childProcess,
            childInterfaces: childProcess.interfaces || [],
            parentProcesses: []
          },
          style: {
            width: applications.length * lifelineSpacing + 100,
            height: 150,
            backgroundColor: childProcess.level === 'B' ? '#dbeafe' : '#fef3c7',
            border: `2px solid ${childProcess.level === 'B' ? '#3b82f6' : '#f59e0b'}`,
            borderRadius: '8px',
            padding: '10px',
          },
        });
        
        currentY += 160;
        
        // Process child items
        processItems(childProcess, groupId);
      }
    });
  };
  
  // Process each top-level process
  processes.forEach(process => {
    processItems(process);
  });
  
  return { nodes, edges };
}