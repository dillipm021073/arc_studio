import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Server, Database, Cloud } from "lucide-react";

interface ApplicationNodeData {
  application: {
    id: number;
    name: string;
    description?: string;
    deployment?: string;
    status?: string;
    os?: string;
  };
  type: "provider" | "consumer";
}

function ApplicationNode({ data, selected }: NodeProps<ApplicationNodeData>) {
  const { application, type } = data;
  const isProvider = type === "provider";

  const getDeploymentIcon = () => {
    if (application.deployment === "cloud") {
      return <Cloud className="h-4 w-4 text-blue-500" />;
    } else if (application.deployment === "on-premise") {
      return <Server className="h-4 w-4 text-gray-500" />;
    }
    return <Database className="h-4 w-4 text-primary" />;
  };

  return (
    <>
      {!isProvider && (
        <Handle
          type="target"
          position={Position.Left}
          style={{ background: "#555" }}
        />
      )}
      <Card
        className={`p-4 min-w-[200px] max-w-[250px] ${
          selected ? "ring-2 ring-primary" : ""
        } ${
          isProvider ? "bg-blue-50 border-blue-200" : "bg-green-50 border-green-200"
        } hover:shadow-lg transition-shadow`}
      >
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getDeploymentIcon()}
              <Badge
                variant="outline"
                className={`text-xs ${
                  isProvider ? "border-blue-500 text-blue-700" : "border-green-500 text-green-700"
                }`}
              >
                {isProvider ? "Provider" : "Consumer"}
              </Badge>
            </div>
            {application.status && (
              <Badge
                variant={application.status === "active" ? "default" : "secondary"}
                className="text-xs"
              >
                {application.status}
              </Badge>
            )}
          </div>
          
          <div>
            <h3 className="font-semibold text-sm">{application.name}</h3>
            {application.os && (
              <p className="text-xs text-muted-foreground mt-1">OS: {application.os}</p>
            )}
            {application.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {application.description}
              </p>
            )}
          </div>
        </div>
      </Card>
      {isProvider && (
        <Handle
          type="source"
          position={Position.Right}
          style={{ background: "#555" }}
        />
      )}
    </>
  );
}

export default memo(ApplicationNode);