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

export function generateSIDUMLDiagramV3(
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
  const lifelineHeight = 1200; // Increased for more content
  const sequenceStartY = lifelineStartY + 200; // Increased from 50 to 200 for proper spacing from application headers
  const sequenceSpacing = 120; // Increased from 80 to prevent IML box overlap
  const processBoxPadding = 20;
  const processBoxHeaderHeight = 40;
  const levelBProcessSpacing = 150; // Extra spacing between Level B processes
  
  // Create application header nodes (top) - bottom nodes will be created after calculating total height
  applications.forEach((app, index) => {
    const xPos = 100 + (index * lifelineSpacing);
    
    // Application header node (at top)
    nodes.push({
      id: `app-${app.id}`,
      type: 'sequenceNode',
      position: { x: xPos, y: 50 },
      data: { 
        label: app.name,
        application: app,
        interfaces: [],
        lifelineHeight: lifelineHeight, // Will be updated after calculating total height
        isIML: false
      },
      draggable: true,
      style: { zIndex: 50 } // Application headers should be on top
    });
  });
  
  // Helper to find application X position
  const getAppXPosition = (appId: number) => {
    const index = applications.findIndex(app => app.id === appId);
    return index >= 0 ? 100 + (index * lifelineSpacing) : 100;
  };
  
  // Process hierarchy and calculate positions
  let currentY = sequenceStartY;
  let globalSequenceCounter = 1;
  
  const processHierarchy = (
    process: BusinessProcessWithInterfaces, 
    parentY: number = currentY,
    isNested: boolean = false
  ): number => {
    let localY = parentY;
    
    // Calculate the height needed for this process
    let processHeight = processBoxHeaderHeight + processBoxPadding * 2;
    
    // Define minimum heights for different process levels
    const minProcessHeight = {
      'A': 300,  // Level A processes need more space
      'B': 250,  // Level B processes 
      'C': 200   // Level C processes
    };
    
    // Combine all items for this process
    const processItems: any[] = [];
    
    // Add internal activities
    process.internalActivities?.forEach(activity => {
      const fullActivity = currentProcessActivities.find(a => a.activity.id === activity.id);
      processItems.push({
        type: 'activity',
        data: {
          ...activity,
          application: fullActivity?.application || activity.application,
          applicationId: fullActivity?.application?.id || activity.applicationId
        },
        sequenceNumber: activity.sequenceNumber || globalSequenceCounter++
      });
    });
    
    // Add child processes
    process.childProcesses?.forEach(child => {
      processItems.push({
        type: 'process',
        data: child,
        sequenceNumber: child.sequenceNumber || globalSequenceCounter++
      });
    });
    
    // Add interfaces - always add them as they should be shown in the diagram
    console.log(`Process ${process.businessProcess} (Level ${process.level}) has ${process.interfaces?.length || 0} interfaces`);
    process.interfaces?.forEach(iface => {
      console.log(`  - Interface ${iface.imlNumber}: ${iface.providerApp?.name} -> ${iface.consumerApp?.name}`);
      processItems.push({
        type: 'interface',
        data: iface,
        sequenceNumber: iface.sequenceNumber || globalSequenceCounter++
      });
    });
    
    // Sort by sequence number
    processItems.sort((a, b) => a.sequenceNumber - b.sequenceNumber);
    
    // Check if process is empty (no items)
    const isEmptyProcess = processItems.length === 0;
    
    // Calculate space needed for each item
    const itemSpacing = 100; // Increased from 60 to prevent IML box overlap
    let itemY = localY + processBoxHeaderHeight + processBoxPadding + 60; // Added extra spacing after lane start
    
    // Create visual elements for each item
    processItems.forEach((item, index) => {
      if (item.type === 'activity') {
        const activity = item.data;
        if (activity.applicationId || activity.application?.id) {
          const appId = activity.applicationId || activity.application.id;
          
          // Create self-loop edge for internal activity
          // Connect to the app node instead of lifeline for proper positioning
          edges.push({
            id: `activity-${process.id}-${activity.id}`,
            source: `app-${appId}`,
            target: `app-${appId}`,
            type: 'selfloopDraggable',
            data: {
              isInternalActivity: true,
              activity: activity,
              sequenceNumber: item.sequenceNumber,
              yPosition: itemY,
              businessProcessId: process.id,
              businessProcessLevel: process.level
            },
            style: {
              stroke: '#16a34a',
              strokeWidth: 2,
              zIndex: 999, // Activities should be clickable but slightly below IMLs
              cursor: 'pointer'
            },
            animated: false,
            selectable: true,
            focusable: true,
            interactionWidth: 20
          });
          
          processHeight += itemSpacing;
          itemY += itemSpacing;
        }
      } else if (item.type === 'interface') {
        const iface = item.data;
        if (iface.providerApp && iface.consumerApp) {
          // Determine arrow direction based on interface type
          const isFileInterface = iface.interfaceType?.toLowerCase() === 'file';
          const source = isFileInterface 
            ? `app-${iface.providerApp.id}` // File: provider sends to consumer
            : `app-${iface.consumerApp.id}`; // Service: consumer calls provider
          const target = isFileInterface
            ? `app-${iface.consumerApp.id}` // File: consumer receives
            : `app-${iface.providerApp.id}`; // Service: provider responds
          
          edges.push({
            id: `iml-${process.id}-${iface.id}`,
            source,
            target,
            sourceHandle: 'right',
            targetHandle: 'left',
            type: 'sequence',
            data: {
              imlNumber: iface.imlNumber,
              interfaceType: iface.interfaceType,
              imlId: iface.id,
              interface: iface, // Add full interface object for double-click
              sequenceNumber: item.sequenceNumber,
              yPosition: itemY,
              businessProcessId: process.id,
              businessProcessLevel: process.level
            },
            style: {
              strokeWidth: 2,
              zIndex: 1000, // IMLs should be at the topmost layer for clicking
              cursor: 'pointer' // Show pointer cursor on hover
            },
            animated: true,
            selectable: true,
            focusable: true,
            interactionWidth: 20, // Increase click area
            markerEnd: iface.status === 'active' ? 'url(#arrowclosed)' : 'url(#arrowclosed-inactive)'
          });
          
          processHeight += itemSpacing;
          itemY += itemSpacing;
        }
      } else if (item.type === 'process') {
        // Recursively process child
        const childProcess = item.data;
        const extraSpacing = childProcess.level === 'B' ? levelBProcessSpacing : 100;
        const childHeight = processHierarchy(childProcess, itemY + 50, true); // Add gap before child process
        processHeight += childHeight + processBoxPadding + extraSpacing; // Add extra gap for Level B processes
        itemY += childHeight + processBoxPadding + extraSpacing;
      }
    });
    
    // Create process group boxes for Level C processes inside Level B
    if (process.level === 'C' && isNested) {
      const laneWidth = applications.length * lifelineSpacing + 100;
      
      // Create blue process group box for Level C
      nodes.push({
        id: `process-group-${process.id}`,
        type: 'processGroup',
        position: { x: 50, y: localY - 30 },
        data: {
          businessProcess: process,
          childInterfaces: process.interfaces || [],
          parentProcesses: []
        },
        draggable: true,
        selectable: true,
        style: {
          width: laneWidth - 100,
          height: processHeight + 40,
          zIndex: -5 // Process boxes in background
        }
      });
    }
    
    // Apply minimum height based on process level
    const processLevel = process.level as keyof typeof minProcessHeight;
    const minimumHeight = minProcessHeight[processLevel] || minProcessHeight['C'];
    
    // If process is empty, ensure we use minimum height
    if (isEmptyProcess) {
      processHeight = Math.max(processHeight, minimumHeight);
    } else {
      // Even for non-empty processes, ensure minimum height is met
      processHeight = Math.max(processHeight, minimumHeight);
    }
    
    // Add extra spacing for empty processes to prevent overlap
    if (isEmptyProcess && process.level !== 'A') {
      processHeight += 100; // Extra buffer for empty child processes
    }
    
    // Create process lanes for Level A and Level B processes
    // Level B processes always get swim lanes, even if they only contain child processes
    if (process.level === 'A' || (process.level === 'B' && (processItems.length > 0 || process.childProcesses?.length > 0))) {
      const laneWidth = applications.length * lifelineSpacing + 100;
      
      // For Level B processes, add extra spacing before the start lane to prevent overlap
      const startLaneY = process.level === 'B' ? localY - 80 : localY - 50;
      
      // Adjust end lane position with extra spacing to prevent overlap
      let endLaneY = localY + processHeight;
      if (process.level === 'B') {
        endLaneY += 50; // Extra spacing for Level B end lanes
      } else if (process.level === 'A') {
        endLaneY += 20; // Some spacing for Level A end lanes
      }
      
      // Start lane
      nodes.push({
        id: `lane-start-${process.id}`,
        type: 'processLane',
        position: { x: 0, y: startLaneY },
        data: {
          type: 'start',
          processName: process.businessProcess,
          processLevel: process.level,
          description: process.description || `Level ${process.level} process`
        },
        draggable: true,
        selectable: true,
        style: {
          width: laneWidth,
          zIndex: 0
        }
      });
      
      // End lane
      nodes.push({
        id: `lane-end-${process.id}`,
        type: 'processLane',
        position: { x: 0, y: endLaneY },
        data: {
          type: 'end',
          processName: process.businessProcess,
          processLevel: process.level,
          description: process.description
        },
        draggable: true,
        selectable: true,
        style: {
          width: laneWidth,
          zIndex: 0
        }
      });
    }
    
    return processHeight;
  };
  
  // Process each top-level process
  processes.forEach((process, index) => {
    if (index > 0) {
      currentY += 100; // Increased spacing between top-level processes for readability
    }
    const height = processHierarchy(process, currentY, process.level !== 'A');
    currentY += height + 100; // Increased spacing after each process
  });
  
  // Now create application bottom boxes at the correct end position
  const totalHeight = currentY;
  applications.forEach((app, index) => {
    const xPos = 100 + (index * lifelineSpacing);
    const topY = 50; // Top node Y position
    const bottomY = totalHeight - 50; // Bottom node Y position
    
    // Update the top application node with correct lifeline height and position data
    const topNode = nodes.find(n => n.id === `app-${app.id}`);
    if (topNode) {
      topNode.data.lifelineHeight = totalHeight - 50; // Total height minus header space
      topNode.data.bottomNodePosition = { x: xPos, y: bottomY }; // Store bottom node position
      topNode.data.topNodePosition = { x: xPos, y: topY }; // Store top node position
    }
    
    // Application bottom box at the end of all processes
    nodes.push({
      id: `app-bottom-${app.id}`,
      type: 'sequenceBottomNode',
      position: { x: xPos, y: bottomY }, // Position at end of all processes
      data: { 
        application: app,
        interfaces: [],
        currentHeight: totalHeight - 100 // Actual lifeline height
      },
      draggable: true,
      style: { zIndex: 50 } // Application headers should be on top
    });
  });
  
  return { nodes, edges };
}