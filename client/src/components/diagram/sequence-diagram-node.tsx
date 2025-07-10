import { memo } from "react";
import { NodeProps, Handle, Position } from "reactflow";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Server, Database, Cloud } from "lucide-react";

interface SequenceDiagramNodeData {
  application: {
    id: number;
    name: string;
    description?: string;
    deployment?: string;
    status?: string;
    os?: string;
  };
  interfaces: any[];
  lifelineHeight?: number;
  bottomNodePosition?: { x: number; y: number };
  onLifelineUpdate?: (applicationId: number, newHeight: number) => void;
  topNodePosition?: { x: number; y: number };
}

function SequenceDiagramNode({ data, selected, id }: NodeProps<SequenceDiagramNodeData>) {
  const { application, interfaces, lifelineHeight = 600, bottomNodePosition, onLifelineUpdate, topNodePosition } = data;
  
  // Calculate dynamic lifeline height if bottom node position is available
  const currentTopY = topNodePosition?.y || 50; // Default top position
  const calculatedLifelineHeight = bottomNodePosition 
    ? Math.max(200, bottomNodePosition.y - currentTopY - 100) // Calculate from top to bottom minus card height
    : lifelineHeight;

  const getDeploymentIcon = () => {
    if (application.deployment === "cloud") {
      return <Cloud className="h-4 w-4 text-white" />;
    } else if (application.deployment === "on-premise" || application.deployment === "on_premise") {
      return <Server className="h-4 w-4 text-white" />;
    }
    return <Database className="h-4 w-4 text-white" />;
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-green-600 text-white';
      case 'inactive': return 'bg-red-600 text-white';
      case 'maintenance': return 'bg-blue-600 text-white';
      case 'deprecated': return 'bg-orange-600 text-white';
      default: return 'bg-orange-600 text-white';
    }
  };

  const getDeploymentColor = (deployment: string) => {
    switch (deployment?.toLowerCase()) {
      case 'cloud': return 'bg-blue-600';
      case 'on-premise': return 'bg-orange-600';
      case 'on_premise': return 'bg-orange-600';
      default: return 'bg-gray-700';
    }
  };

  return (
    <div className="relative">
      {/* System Box Header */}
      <Card
        className={`drag-handle p-4 min-w-[180px] max-w-[220px] ${
          selected ? "ring-2 ring-white ring-offset-2 ring-offset-transparent" : ""
        } ${getDeploymentColor(application.deployment)} border-0 shadow-lg cursor-move transition-all duration-200 hover:shadow-xl`}
      >
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            {getDeploymentIcon()}
            {application.status && (
              <Badge
                className={`text-xs ${getStatusColor(application.status)}`}
              >
                {application.status}
              </Badge>
            )}
          </div>
          
          <div className="text-center">
            <h3 className="font-semibold text-sm text-white">{application.name}</h3>
            {application.os && (
              <p className="text-xs text-gray-200 mt-1">OS: {application.os}</p>
            )}
          </div>
        </div>
      </Card>

      {/* Vertical Lifeline - extending from bottom of header box */}
      <div 
        className="absolute left-1/2 transform -translate-x-1/2"
        style={{ 
          top: "calc(100%)", // Start from exact bottom of card
          width: "2px",
          height: `${calculatedLifelineHeight}px`,
          background: "#9ca3af", // Solid gray line
          zIndex: -1
        }}
      >
        {/* Connection end indicator */}
        <div 
          className="absolute left-1/2 transform -translate-x-1/2"
          style={{ 
            bottom: "0",
            width: "6px",
            height: "6px",
            backgroundColor: "#9ca3af",
            borderRadius: "50%",
            marginLeft: "-2px"
          }}
        />
        {/* Connection handle for lifeline */}
        <Handle
          type="source"
          position={Position.Right}
          id="lifeline"
          style={{ 
            background: 'transparent',
            border: 'none',
            width: '16px',
            height: `${calculatedLifelineHeight}px`,
            right: '-8px',
            top: '0'
          }}
        />
        <Handle
          type="target"
          position={Position.Left}
          id="lifeline"
          style={{ 
            background: 'transparent',
            border: 'none',
            width: '16px',
            height: `${calculatedLifelineHeight}px`,
            left: '-8px',
            top: '0'
          }}
        />
      </div>
    </div>
  );
}

export default memo(SequenceDiagramNode);