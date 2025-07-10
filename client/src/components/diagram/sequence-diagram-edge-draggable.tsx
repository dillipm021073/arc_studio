import { memo, useState, useEffect } from "react";
import { EdgeProps, getStraightPath, EdgeLabelRenderer, useReactFlow } from "reactflow";
import { GripVertical } from "lucide-react";

interface SequenceDiagramEdgeData {
  interface: any;
  sequenceNumber: number;
  yPosition: number;
  businessProcessId?: number;
  businessProcessLevel?: string;
}

function SequenceDiagramEdgeDraggable({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
  style,
  selected,
}: EdgeProps<SequenceDiagramEdgeData>) {
  const { setEdges, getEdges, getNodes } = useReactFlow();
  const [isDragging, setIsDragging] = useState(false);
  const [dragY, setDragY] = useState(data?.yPosition || sourceY);

  useEffect(() => {
    if (data?.yPosition) {
      setDragY(data.yPosition);
    }
  }, [data?.yPosition]);

  if (!data?.interface) return null;

  const { interface: iml } = data;
  
  // Use the drag position or the data position
  const yPos = isDragging ? dragY : (data.yPosition || sourceY);
  
  // The arrow Y position should be at the IML box position
  // The lifeline is drawn as a vertical line from the bottom of the application box
  const arrowYPos = yPos;
  
  // Swap sourceX and targetX to correct the arrow direction
  // React Flow provides these swapped, so we need to correct them
  const correctedSourceX = targetX;
  const correctedTargetX = sourceX;
  
  // No need to adjust X positions - the sourceX and targetX already represent the lifeline positions
  // The sourceHandle and targetHandle are set to 'lifeline' which connects to the lifeline handles
  
  // Create a straight horizontal line at the adjusted y position
  const straightPath = `M ${correctedSourceX},${arrowYPos} L ${correctedTargetX},${arrowYPos}`;
  
  // Calculate arrow direction
  const arrowDirection = correctedTargetX > correctedSourceX ? 1 : -1;
  
  // Calculate label position (centered between the two lifelines)
  const labelPosX = (correctedSourceX + correctedTargetX) / 2;
  const labelPosY = yPos - 40; // Position IML box above the arrow line

  const handleMouseDown = (e: React.MouseEvent) => {
    // Prevent all propagation to avoid conflicts
    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    
    setIsDragging(true);
    
    const startY = e.clientY;
    const startDragY = yPos;
    
    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      const deltaY = e.clientY - startY;
      
      // Get process lanes to find boundaries
      const nodes = getNodes();
      const processId = data?.businessProcessId;
      let minY = 250; // Updated to match new initial offset
      let maxY = 2000;
      
      if (processId) {
        // Find start and end lanes for this process
        const startLane = nodes.find(n => n.id === `lane-start-${processId}`);
        const endLane = nodes.find(n => n.id === `lane-end-${processId}`);
        
        if (startLane) {
          minY = startLane.position.y + 120; // Further increased padding from start lane
        }
        if (endLane) {
          maxY = endLane.position.y - 120; // Further increased padding from end lane
        }
      }
      
      // Also check sequence constraints within the same process
      const edges = getEdges();
      const sameProcessEdges = edges
        .filter(edge => 
          edge.type === 'sequence' && 
          edge.data?.businessProcessId === processId &&
          edge.data?.sequenceNumber
        )
        .sort((a, b) => a.data.sequenceNumber - b.data.sequenceNumber);
      
      const currentIndex = sameProcessEdges.findIndex(edge => edge.id === id);
      
      if (currentIndex > 0) {
        const prevEdge = sameProcessEdges[currentIndex - 1];
        const prevY = (prevEdge.data?.yPosition || minY) + 100; // Increased spacing
        minY = Math.max(minY, prevY);
      }
      
      if (currentIndex < sameProcessEdges.length - 1) {
        const nextEdge = sameProcessEdges[currentIndex + 1];
        const nextY = (nextEdge.data?.yPosition || maxY) - 100; // Increased spacing
        maxY = Math.min(maxY, nextY);
      }
      
      // Constrain during drag for visual feedback
      const proposedY = startDragY + deltaY;
      const newY = Math.max(minY, Math.min(maxY, proposedY));
      setDragY(newY);
    };
    
    const handleMouseUp = (e: MouseEvent) => {
      e.preventDefault();
      setIsDragging(false);
      
      // Get process lanes to find boundaries
      const nodes = getNodes();
      const processId = data?.businessProcessId;
      let minY = 250; // Updated to match new initial offset
      let maxY = 2000;
      
      if (processId) {
        // Find start and end lanes for this process
        const startLane = nodes.find(n => n.id === `lane-start-${processId}`);
        const endLane = nodes.find(n => n.id === `lane-end-${processId}`);
        
        if (startLane) {
          minY = startLane.position.y + 120; // Further increased padding from start lane
        }
        if (endLane) {
          maxY = endLane.position.y - 120; // Further increased padding from end lane
        }
      }
      
      // Also check sequence constraints within the same process
      const edges = getEdges();
      const sameProcessEdges = edges
        .filter(edge => 
          edge.type === 'sequence' && 
          edge.data?.businessProcessId === processId &&
          edge.data?.sequenceNumber
        )
        .sort((a, b) => a.data.sequenceNumber - b.data.sequenceNumber);
      
      const currentIndex = sameProcessEdges.findIndex(edge => edge.id === id);
      
      if (currentIndex > 0) {
        const prevEdge = sameProcessEdges[currentIndex - 1];
        const prevY = (prevEdge.data?.yPosition || minY) + 100; // Increased spacing
        minY = Math.max(minY, prevY);
      }
      
      if (currentIndex < sameProcessEdges.length - 1) {
        const nextEdge = sameProcessEdges[currentIndex + 1];
        const nextY = (nextEdge.data?.yPosition || maxY) - 100; // Increased spacing
        maxY = Math.min(maxY, nextY);
      }
      
      // Constrain the final Y position
      const constrainedY = Math.max(minY, Math.min(maxY, dragY));
      
      // Update the edge data with constrained y position
      setEdges((edges) => 
        edges.map((edge) => {
          if (edge.id === id) {
            return {
              ...edge,
              data: {
                ...edge.data,
                yPosition: constrainedY,
              },
            };
          }
          return edge;
        })
      );
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Determine interface type and flow direction
  const isFileInterface = iml.interfaceType?.toLowerCase() === 'file';
  
  // For online interfaces: arrow should point from consumer to provider (consumer calls provider)
  // For file interfaces: arrow should point from provider to consumer (provider sends file)
  // The edge source/target are already set correctly in the parent component
  
  return (
    <>
      {/* Main request/file transfer arrow */}
      <g>
        <path
          id={id}
          style={{
            ...style,
            strokeWidth: selected ? 4 : 3,
            stroke: iml.status === 'active' ? '#10b981' : '#6b7280',
            strokeDasharray: isFileInterface ? '5,5' : undefined, // Dotted line for file-based interfaces
            filter: isDragging ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' : selected ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' : undefined,
            pointerEvents: isDragging ? 'none' : 'auto',
            cursor: 'pointer',
            zIndex: 1000,
            fill: 'none',
          }}
          className="react-flow__edge-path"
          d={straightPath}
        />
        {/* Manual arrow head */}
        <polygon
          points={`${correctedTargetX},${arrowYPos} ${correctedTargetX - (arrowDirection * 10)},${arrowYPos - 6} ${correctedTargetX - (arrowDirection * 10)},${arrowYPos + 6}`}
          fill={iml.status === 'active' ? '#10b981' : '#6b7280'}
          style={{
            pointerEvents: 'none',
          }}
        />
      </g>
      
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelPosX}px, ${labelPosY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <div 
            className={`bg-white px-3 py-2 rounded-lg border-2 ${selected ? 'border-blue-500 shadow-lg' : 'border-gray-300 shadow-md'} relative cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]`} 
            style={{ zIndex: 1500 }}
          >
            {/* Drag handle on the left - made larger and more prominent */}
            <div
              className={`absolute -left-10 top-1/2 -translate-y-1/2 p-2.5 bg-blue-500 rounded-lg cursor-ns-resize hover:bg-blue-600 transition-all shadow-lg border-2 border-white ${
                isDragging ? 'bg-blue-700 scale-125 shadow-xl' : ''
              }`}
              onMouseDown={handleMouseDown}
              title="Drag to reposition interface vertically"
              style={{ zIndex: 2000 }}
            >
              <GripVertical className="h-5 w-5 text-white" />
            </div>
            
            {/* Status indicator dot */}
            <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${iml.status === 'active' ? 'bg-green-500' : 'bg-gray-400'} border-2 border-white`} />
            
            {/* Interface type color bar */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-md ${isFileInterface ? 'bg-amber-500' : 'bg-blue-500'}`} />
            
            <div className="text-xs ml-1">
              <div className="flex items-center gap-1">
                <span className="text-primary font-bold">#{data.sequenceNumber}</span>
                <span className="font-bold">{iml.imlNumber}</span>
              </div>
              <div className="text-gray-600 font-semibold text-xs uppercase tracking-wider">{iml.interfaceType}</div>
              {iml.description && (
                <div className="text-gray-700 max-w-[150px] truncate" title={iml.description}>{iml.description}</div>
              )}
            </div>
          </div>
        </div>
      </EdgeLabelRenderer>

    </>
  );
}

export default memo(SequenceDiagramEdgeDraggable);