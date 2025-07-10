import { memo, useCallback } from "react";
import { NodeProps, Handle, Position } from "reactflow";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Server, Database, Cloud, Move3D } from "lucide-react";

interface SequenceDiagramBottomNodeData {
  application: {
    id: number;
    name: string;
    description?: string;
    deployment?: string;
    status?: string;
    os?: string;
  };
  interfaces: any[];
  onExtendLifeline?: (applicationId: number, newHeight: number) => void;
  currentHeight?: number;
}

function SequenceDiagramBottomNode({ data, selected }: NodeProps<SequenceDiagramBottomNodeData>) {
  const { application, interfaces = [], onExtendLifeline, currentHeight = 600 } = data;

  // Handle case where application is not provided
  if (!application) {
    return null;
  }

  const getDeploymentIcon = () => {
    if (application?.deployment === "cloud") {
      return <Cloud className="h-3 w-3 text-white" />;
    } else if (application.deployment === "on-premise" || application.deployment === "on_premise") {
      return <Server className="h-3 w-3 text-white" />;
    }
    return <Database className="h-3 w-3 text-white" />;
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

  // Note: Drag handling will be managed by React Flow's onNodeDrag event

  return (
    <div className="relative cursor-move">
      {/* Connection point indicator - centered at top */}
      <div 
        className="absolute left-1/2 transform -translate-x-1/2"
        style={{ 
          top: "-3px",
          width: "6px",
          height: "6px",
          backgroundColor: "#9ca3af",
          borderRadius: "50%",
          zIndex: 20
        }}
      />
      
      {/* Bottom System Box */}
      <Card
        className={`drag-handle p-3 min-w-[160px] max-w-[200px] ${
          selected ? "ring-2 ring-white ring-offset-2 ring-offset-transparent" : ""
        } ${getDeploymentColor(application?.deployment)} border-0 shadow-lg cursor-move transition-all duration-200 hover:shadow-xl opacity-80 hover:opacity-100`}
      >
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              {getDeploymentIcon()}
              <Move3D className="h-3 w-3 text-gray-300" />
            </div>
            {application?.status && (
              <Badge
                className={`text-xs ${getStatusColor(application.status)}`}
              >
                {application.status}
              </Badge>
            )}
          </div>
          
          <div className="text-center">
            <h3 className="font-medium text-xs text-white">{application?.name || 'Unknown'}</h3>
            <p className="text-xs text-gray-200 mt-1">
              {interfaces.length} interface{interfaces.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </Card>

      {/* Connection handles */}
      <Handle
        type="source"
        position={Position.Top}
        id="lifeline-bottom"
        style={{ 
          background: 'transparent',
          border: 'none',
          width: '16px',
          height: '16px',
          top: '-8px'
        }}
      />
      <Handle
        type="target"
        position={Position.Top}
        id="lifeline-bottom"
        style={{ 
          background: 'transparent',
          border: 'none',
          width: '16px',
          height: '16px',
          top: '-8px'
        }}
      />
    </div>
  );
}

export default memo(SequenceDiagramBottomNode);