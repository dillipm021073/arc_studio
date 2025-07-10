import { memo, useState } from "react";
import { NodeProps, useReactFlow } from "reactflow";
import { ChevronRight, Square, GripVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ProcessLaneNodeData {
  type: 'start' | 'end';
  processName: string;
  processLevel?: string;
  description?: string;
}

function ProcessLaneNode({ id, data }: NodeProps<ProcessLaneNodeData>) {
  const { type, processName, processLevel, description } = data;
  const isStart = type === 'start';
  const { setNodes } = useReactFlow();
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(true);
    
    const startY = e.clientY;
    
    // Get the current node position from React Flow
    setNodes((nodes) => {
      const currentNode = nodes.find(n => n.id === id);
      if (!currentNode) return nodes;
      
      const startPosition = currentNode.position.y;
      
      const handleMouseMove = (e: MouseEvent) => {
        e.preventDefault();
        const deltaY = e.clientY - startY;
        
        setNodes((nodes) => 
          nodes.map((n) => {
            if (n.id === id) {
              return {
                ...n,
                position: {
                  ...n.position,
                  y: startPosition + deltaY
                }
              };
            }
            return n;
          })
        );
      };
      
      const handleMouseUp = (e: MouseEvent) => {
        e.preventDefault();
        setIsDragging(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return nodes;
    });
  };

  return (
    <div 
      className={`w-full px-4 py-3 border-2 ${
        isStart ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'
      } rounded relative`}
      style={{
        minWidth: '800px',
        pointerEvents: 'auto',
      }}
    >
      {/* Drag handle */}
      <div
        className={`absolute -left-10 top-1/2 -translate-y-1/2 p-2.5 ${
          isStart ? 'bg-green-500' : 'bg-red-500'
        } rounded-lg cursor-ns-resize hover:bg-opacity-80 transition-all shadow-lg border-2 border-white ${
          isDragging ? 'scale-125 shadow-xl' : ''
        }`}
        onMouseDown={handleMouseDown}
        title="Drag to reposition lane vertically"
        style={{ zIndex: 2000 }}
      >
        <GripVertical className="h-5 w-5 text-white" />
      </div>

      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`mt-0.5 ${isStart ? 'text-green-500' : 'text-red-500'}`}>
          {isStart ? <ChevronRight className="h-5 w-5" /> : <Square className="h-4 w-4" />}
        </div>
        
        {/* Content */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-white">
              {isStart ? processName : `End: ${processName}`}
            </h3>
            {processLevel && (
              <Badge className={`text-xs ${
                isStart ? 'bg-green-600' : 'bg-red-600'
              } text-white`}>
                Level {processLevel}
              </Badge>
            )}
          </div>
          {description && (
            <p className="text-sm text-gray-400 italic mt-1">
              {isStart 
                ? description 
                : `${processName} process completed`}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(ProcessLaneNode);