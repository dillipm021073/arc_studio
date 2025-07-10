import { memo, useState, useEffect } from "react";
import { EdgeProps, EdgeLabelRenderer, useReactFlow } from "reactflow";
import { GripVertical } from "lucide-react";

interface SelfLoopEdgeData {
  activity?: any;
  isInternalActivity?: boolean;
  sequenceNumber: number;
  yPosition: number;
  label?: string;
  sublabel?: string;
  onClick?: () => void;
  onDoubleClick?: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  businessProcessId?: number;
  businessProcessLevel?: string;
}

function SelfLoopEdgeDraggable({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
  style,
  selected,
}: EdgeProps<SelfLoopEdgeData>) {
  const { setEdges, getEdges, getNodes } = useReactFlow();
  const [isDragging, setIsDragging] = useState(false);
  const [dragY, setDragY] = useState(data?.yPosition || sourceY);

  useEffect(() => {
    if (data?.yPosition) {
      setDragY(data.yPosition);
    }
  }, [data?.yPosition]);

  if (!data?.activity && !data?.label) return null;

  const activity = data.activity;
  const yPos = isDragging ? dragY : (data.yPosition || sourceY);
  
  // Create a self-loop path
  const loopWidth = 60;
  const loopHeight = 40;
  const x = sourceX;
  const selfLoopPath = `
    M ${x},${yPos} 
    C ${x - loopWidth},${yPos} ${x - loopWidth},${yPos + loopHeight} ${x},${yPos + loopHeight}
    L ${x},${yPos}
  `;
  
  // Label position for self-loop
  const labelPosX = x - loopWidth - 10;
  const labelPosY = yPos + (loopHeight / 2);

  const handleMouseDown = (e: React.MouseEvent) => {
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
      const processId = data?.businessProcessId || data?.activity?.businessProcessId;
      let minY = 150;
      let maxY = 2000;
      
      if (processId) {
        // Find start and end lanes for this process
        const startLane = nodes.find(n => n.id === `lane-start-${processId}`);
        const endLane = nodes.find(n => n.id === `lane-end-${processId}`);
        
        if (startLane) {
          minY = startLane.position.y + 80; // Increased padding for readability
        }
        if (endLane) {
          maxY = endLane.position.y - 80;
        }
      }
      
      // Also check sequence constraints within the same process
      const edges = getEdges();
      const sameProcessActivities = edges
        .filter(edge => 
          edge.type === 'selfloopDraggable' && 
          edge.data?.sequenceNumber &&
          (edge.data?.businessProcessId === processId || edge.data?.activity?.businessProcessId === processId)
        )
        .sort((a, b) => a.data.sequenceNumber - b.data.sequenceNumber);
      
      const currentIndex = sameProcessActivities.findIndex(edge => edge.id === id);
      
      if (currentIndex > 0) {
        const prevEdge = sameProcessActivities[currentIndex - 1];
        const prevY = (prevEdge.data?.yPosition || minY) + 60;
        minY = Math.max(minY, prevY);
      }
      
      if (currentIndex < sameProcessActivities.length - 1) {
        const nextEdge = sameProcessActivities[currentIndex + 1];
        const nextY = (nextEdge.data?.yPosition || maxY) - 60;
        maxY = Math.min(maxY, nextY);
      }
      
      // Constrain during drag
      const proposedY = startDragY + deltaY;
      const newY = Math.max(minY, Math.min(maxY, proposedY));
      setDragY(newY);
    };
    
    const handleMouseUp = (e: MouseEvent) => {
      e.preventDefault();
      setIsDragging(false);
      
      // Get process lanes to find boundaries
      const nodes = getNodes();
      const processId = data?.businessProcessId || data?.activity?.businessProcessId;
      let minY = 150;
      let maxY = 2000;
      
      if (processId) {
        // Find start and end lanes for this process
        const startLane = nodes.find(n => n.id === `lane-start-${processId}`);
        const endLane = nodes.find(n => n.id === `lane-end-${processId}`);
        
        if (startLane) {
          minY = startLane.position.y + 80; // Increased padding for readability
        }
        if (endLane) {
          maxY = endLane.position.y - 80;
        }
      }
      
      // Also check sequence constraints within the same process
      const edges = getEdges();
      const sameProcessActivities = edges
        .filter(edge => 
          edge.type === 'selfloopDraggable' && 
          edge.data?.sequenceNumber &&
          (edge.data?.businessProcessId === processId || edge.data?.activity?.businessProcessId === processId)
        )
        .sort((a, b) => a.data.sequenceNumber - b.data.sequenceNumber);
      
      const currentIndex = sameProcessActivities.findIndex(edge => edge.id === id);
      
      if (currentIndex > 0) {
        const prevEdge = sameProcessActivities[currentIndex - 1];
        const prevY = (prevEdge.data?.yPosition || minY) + 60;
        minY = Math.max(minY, prevY);
      }
      
      if (currentIndex < sameProcessActivities.length - 1) {
        const nextEdge = sameProcessActivities[currentIndex + 1];
        const nextY = (nextEdge.data?.yPosition || maxY) - 60;
        maxY = Math.min(maxY, nextY);
      }
      
      // Constrain final position
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
  
  return (
    <>
      {/* Self-loop arrow */}
      <path
        id={id}
        style={{
          ...style,
          strokeWidth: selected ? 3 : 2,
          fill: 'none',
          filter: isDragging ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' : undefined,
          pointerEvents: isDragging ? 'none' : 'auto',
          cursor: 'pointer',
          zIndex: 900,
        }}
        className="react-flow__edge-path"
        d={selfLoopPath}
        markerEnd="url(#arrowclosed-green)"
        onClick={(e) => {
          e.stopPropagation();
          data?.onClick?.();
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          data?.onDoubleClick?.();
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          data?.onContextMenu?.(e);
        }}
      />
      
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
            className={`bg-white px-3 py-2 rounded-lg border-2 ${selected ? 'border-green-500 shadow-lg' : 'border-gray-300 shadow-md'} relative transition-all hover:shadow-lg hover:scale-[1.02]`} 
            style={{ zIndex: 1500, cursor: 'pointer' }}
            onClick={(e) => {
              e.stopPropagation();
              data?.onClick?.();
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              data?.onDoubleClick?.();
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              data?.onContextMenu?.(e);
            }}
          >
            {/* Drag handle */}
            <div
              className={`absolute -left-10 top-1/2 -translate-y-1/2 p-2.5 bg-green-500 rounded-lg cursor-ns-resize hover:bg-green-600 transition-all shadow-lg border-2 border-white ${
                isDragging ? 'bg-green-700 scale-125 shadow-xl' : ''
              }`}
              onMouseDown={handleMouseDown}
              title="Drag to reposition activity vertically"
              style={{ zIndex: 2000 }}
            >
              <GripVertical className="h-5 w-5 text-white" />
            </div>
            
            {/* Activity type indicator */}
            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-500 border-2 border-white" />
            
            {/* Activity type color bar */}
            <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-md bg-green-600" />
            
            <div className="text-xs ml-1">
              <div className="flex items-center gap-1">
                <span className="text-green-600 font-bold">#{data.sequenceNumber}</span>
                <span className="font-bold">{activity?.activityName || data.label}</span>
              </div>
              {(activity?.activityType || data.sublabel) && (
                <div className="text-gray-600 font-semibold text-xs uppercase tracking-wider">{activity?.activityType || data.sublabel}</div>
              )}
              {activity?.description && (
                <div className="text-gray-700 max-w-[150px] truncate" title={activity?.description}>{activity.description}</div>
              )}
            </div>
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export default memo(SelfLoopEdgeDraggable);