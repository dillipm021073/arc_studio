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
  }>;
  childProcesses?: BusinessProcessWithInterfaces[];
}

interface SIDUMLOptions {
  showChildProcesses?: boolean;
  showInterfaceDetails?: boolean;
  layoutDirection?: 'horizontal' | 'vertical';
}

export function generateSIDUMLDiagram(
  processes: BusinessProcessWithInterfaces[],
  options: SIDUMLOptions = {}
): { nodes: Node[], edges: Edge[] } {
  const {
    showChildProcesses = true,
    showInterfaceDetails = true,
    layoutDirection = 'vertical'
  } = options;

  const nodes: Node[] = [];
  const edges: Edge[] = [];
  
  // Layout configuration
  const processBoxWidth = 500;
  const processBoxMinHeight = 250;
  const interfaceHeight = 30;
  const interfaceSpacing = 5;
  const processSpacing = layoutDirection === 'vertical' ? 50 : 100;
  const headerHeight = 40;
  const padding = 20;
  const nestedProcessMargin = 20;
  
  let currentPosition = { x: 100, y: 100 };
  
  // Sort processes by sequence number
  const sortedProcesses = [...processes].sort((a, b) => a.sequenceNumber - b.sequenceNumber);
  
  // Generate nodes for each business process
  sortedProcesses.forEach((process, processIndex) => {
    console.log('Processing process for SID UML:', process);
    
    // Create process container node with all content
    const processNodeId = `bp-${process.id}`;
    
    // For Level A and B processes, combine internal activities and child processes at the same level
    const internalActivities = process.internalActivities || [];
    const childProcesses = process.childProcesses || [];
    
    // Create mixed items array with internal activities and child processes
    const mixedItems = [
      ...internalActivities.map(activity => ({ 
        type: 'activity' as const, 
        data: activity, 
        sequenceNumber: activity.sequenceNumber 
      })),
      ...childProcesses.map(child => ({ 
        type: 'process' as const, 
        data: child, 
        sequenceNumber: child.sequenceNumber 
      }))
    ].sort((a, b) => a.sequenceNumber - b.sequenceNumber);
    
    // For Level C or processes without children, just use interfaces
    const interfaces = process.interfaces || [];
    
    // Calculate the content height
    let contentHeight = headerHeight + padding * 2;
    
    // Add height for mixed items (activities and child processes)
    if (mixedItems.length > 0) {
      mixedItems.forEach(item => {
        if (item.type === 'activity') {
          contentHeight += interfaceHeight + interfaceSpacing;
        } else if (item.type === 'process') {
          // For nested processes, calculate their height
          const childInterfaces = item.data.interfaces?.length || 0;
          const childActivities = item.data.internalActivities?.length || 0;
          const childHeight = Math.max(150, headerHeight + ((childInterfaces + childActivities) * (interfaceHeight + interfaceSpacing)) + padding * 2);
          contentHeight += childHeight + nestedProcessMargin;
        }
      });
    } else if (interfaces.length > 0) {
      // If no mixed items, just show interfaces
      contentHeight += interfaces.length * (interfaceHeight + interfaceSpacing);
    }
    
    const boxHeight = Math.max(processBoxMinHeight, contentHeight);
    
    // Build the items HTML
    const generateItemsHtml = () => {
      // If we have mixed items (activities and child processes)
      if (mixedItems.length > 0) {
        return mixedItems.map((item, index) => {
          if (item.type === 'activity') {
            const activity = item.data;
            return `
              <div style="
                background-color: #f0fdf4;
                border: 1px solid #16a34a;
                border-radius: 4px;
                padding: 5px 10px;
                margin-bottom: 5px;
                font-size: 12px;
                display: flex;
                align-items: center;
                gap: 8px;
              ">
                <span style="font-weight: bold; color: #16a34a">⚙️ ${activity.activityName}</span>
                <span style="color: #6b7280">|</span>
                <span style="color: #059669">${activity.activityType}</span>
                ${activity.description ? `
                  <span style="color: #6b7280">|</span>
                  <span style="font-size: 11px; color: #6b7280; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px" title="${activity.description}">
                    ${activity.description}
                  </span>
                ` : ''}
              </div>
            `;
          } else if (item.type === 'process') {
            const childProcess = item.data;
            // Generate HTML for nested process
            return generateNestedProcessHtml(childProcess);
          }
          return '';
        }).join('');
      } 
      // Otherwise, just show interfaces for Level C or processes without children
      else if (interfaces.length > 0) {
        return interfaces.map((iface, index) => `
          <div style="
            background-color: #f3f4f6;
            border: 1px solid #d1d5db;
            border-radius: 4px;
            padding: 5px 10px;
            margin-bottom: 5px;
            font-size: 12px;
            display: flex;
            align-items: center;
            gap: 8px;
          ">
            <span style="font-weight: bold; color: #3b82f6">${iface.imlNumber}</span>
            <span style="color: #6b7280">|</span>
            <span>${iface.interfaceType}</span>
            ${showInterfaceDetails ? `
              <span style="color: #6b7280">|</span>
              <span style="font-size: 11px; color: #6b7280">
                ${iface.providerApp?.name || 'N/A'} → ${iface.consumerApp?.name || 'N/A'}
              </span>
            ` : ''}
          </div>
        `).join('');
      }
      return '<div style="text-align: center; color: #6b7280; font-style: italic">No items</div>';
    };
    
    // Helper function to generate nested process HTML
    const generateNestedProcessHtml = (childProcess: any) => {
      const childInterfaces = childProcess.interfaces || [];
      const childActivities = childProcess.internalActivities || [];
      
      // For Level B, show its child processes (Level C) and activities
      if (childProcess.level === 'B' && childProcess.childProcesses?.length > 0) {
        const childMixedItems = [
          ...childActivities.map((activity: any) => ({ 
            type: 'activity' as const, 
            data: activity, 
            sequenceNumber: activity.sequenceNumber 
          })),
          ...childProcess.childProcesses.map((grandchild: any) => ({ 
            type: 'process' as const, 
            data: grandchild, 
            sequenceNumber: grandchild.sequenceNumber 
          }))
        ].sort((a, b) => a.sequenceNumber - b.sequenceNumber);
        
        return `
          <div style="
            background-color: #eff6ff;
            border: 2px solid #3b82f6;
            border-radius: 6px;
            padding: 10px;
            margin-bottom: 10px;
          ">
            <div style="
              font-weight: bold;
              color: #1e40af;
              margin-bottom: 8px;
              font-size: 14px;
            ">
              ${childProcess.businessProcess}
              <span style="font-size: 11px; color: #3b82f6"> (Level ${childProcess.level})</span>
            </div>
            ${childMixedItems.map(item => {
              if (item.type === 'activity') {
                return `
                  <div style="
                    background-color: #f0fdf4;
                    border: 1px solid #16a34a;
                    border-radius: 4px;
                    padding: 4px 8px;
                    margin-bottom: 4px;
                    font-size: 11px;
                  ">
                    ⚙️ ${item.data.activityName}
                  </div>
                `;
              } else if (item.type === 'process') {
                // Level C process nested inside Level B
                const levelCProcess = item.data;
                const levelCInterfaces = levelCProcess.interfaces || [];
                return `
                  <div style="
                    background-color: #fef3c7;
                    border: 1px solid #f59e0b;
                    border-radius: 4px;
                    padding: 8px;
                    margin-bottom: 4px;
                    margin-left: 10px;
                  ">
                    <div style="
                      font-weight: bold;
                      color: #d97706;
                      margin-bottom: 4px;
                      font-size: 12px;
                    ">
                      ${levelCProcess.businessProcess}
                      <span style="font-size: 10px; color: #f59e0b"> (Level C)</span>
                    </div>
                    ${levelCInterfaces.map((iface: any) => `
                      <div style="
                        background-color: white;
                        border: 1px solid #e5e7eb;
                        border-radius: 3px;
                        padding: 3px 6px;
                        margin-bottom: 3px;
                        font-size: 10px;
                      ">
                        ${iface.imlNumber} - ${iface.interfaceType}
                      </div>
                    `).join('')}
                  </div>
                `;
              }
              return '';
            }).join('')}
          </div>
        `;
      } 
      // For Level C or Level B without children, just show interfaces
      else {
        return `
          <div style="
            background-color: #eff6ff;
            border: 2px solid #3b82f6;
            border-radius: 6px;
            padding: 10px;
            margin-bottom: 10px;
          ">
            <div style="
              font-weight: bold;
              color: #1e40af;
              margin-bottom: 8px;
              font-size: 14px;
            ">
              ${childProcess.businessProcess}
              <span style="font-size: 11px; color: #3b82f6"> (Level ${childProcess.level})</span>
            </div>
            ${childInterfaces.map((iface: any) => `
              <div style="
                background-color: #f3f4f6;
                border: 1px solid #d1d5db;
                border-radius: 4px;
                padding: 4px 8px;
                margin-bottom: 4px;
                font-size: 11px;
              ">
                ${iface.imlNumber} - ${iface.interfaceType}
              </div>
            `).join('')}
            ${childActivities.map((activity: any) => `
              <div style="
                background-color: #f0fdf4;
                border: 1px solid #16a34a;
                border-radius: 4px;
                padding: 4px 8px;
                margin-bottom: 4px;
                font-size: 11px;
              ">
                ⚙️ ${activity.activityName}
              </div>
            `).join('')}
          </div>
        `;
      }
    };
    
    const itemsHtml = generateItemsHtml();
    
    const processNode = {
      id: processNodeId,
      type: 'default',
      position: currentPosition,
      data: {
        label: (
          <div style={{ 
            width: processBoxWidth - 20,
            minHeight: boxHeight - 20,
            backgroundColor: 'white',
            border: '2px solid #3b82f6',
            borderRadius: '8px',
            overflow: 'hidden'
          }}>
            <div style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '10px',
              fontWeight: 'bold',
              fontSize: '16px',
              textAlign: 'center'
            }}>
              {process.businessProcess}
              <div style={{ fontSize: '12px', color: '#dbeafe', marginTop: '4px' }}>
                Level: {process.level} | Sequence: {process.sequenceNumber}
              </div>
            </div>
            <div style={{ padding: '10px' }}>
              <div dangerouslySetInnerHTML={{ __html: itemsHtml }} />
            </div>
          </div>
        ),
      },
      style: {
        width: processBoxWidth,
        height: 'auto',
        minHeight: boxHeight,
        background: 'transparent',
        border: 'none',
        padding: 0,
      },
      draggable: true,
      selectable: true,
    };
    
    console.log('Creating process node:', processNode);
    nodes.push(processNode);
    
    // No need to recursively add child processes anymore as they are handled inline
    
    // Update position for next process
    if (layoutDirection === 'vertical') {
      currentPosition.y += boxHeight + processSpacing;
    } else {
      currentPosition.x += processBoxWidth + processSpacing;
    }
    
    // Create edges between sequential processes
    if (processIndex > 0) {
      const prevProcessId = `bp-${sortedProcesses[processIndex - 1].id}`;
      edges.push({
        id: `edge-seq-${processIndex}`,
        source: prevProcessId,
        target: processNodeId,
        sourceHandle: layoutDirection === 'vertical' ? 'bottom' : 'right',
        targetHandle: layoutDirection === 'vertical' ? 'top' : 'left',
        type: 'smoothstep',
        style: {
          strokeWidth: 2,
          stroke: '#10b981',
        },
        markerEnd: {
          type: 'arrowclosed',
          color: '#10b981',
        },
        label: `Step ${process.sequenceNumber}`,
        labelStyle: {
          fontSize: '12px',
          fontWeight: 'bold',
          fill: '#10b981',
        },
      });
    }
  });
  
  return { nodes, edges };
}

// Helper function to create a simplified SID UML view for export
export function generateSimplifiedSIDUML(
  processes: BusinessProcessWithInterfaces[]
): { nodes: Node[], edges: Edge[] } {
  return generateSIDUMLDiagram(processes, {
    showChildProcesses: false,
    showInterfaceDetails: false,
    layoutDirection: 'vertical'
  });
}

// Helper function to create a detailed SID UML view
export function generateDetailedSIDUML(
  processes: BusinessProcessWithInterfaces[]
): { nodes: Node[], edges: Edge[] } {
  return generateSIDUMLDiagram(processes, {
    showChildProcesses: true,
    showInterfaceDetails: true,
    layoutDirection: 'horizontal'
  });
}