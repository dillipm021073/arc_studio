import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plug, ArrowRight } from "lucide-react";

interface IMLNodeData {
  interface: {
    id: number;
    imlNumber: string;
    interfaceType: string;
    status: string;
    providerApplicationId?: number;
    consumerApplicationId?: number;
    providerApp?: { name: string };
    consumerApp?: { name: string };
  };
  sequenceNumber: number;
}

function IMLNode({ data, selected }: NodeProps<IMLNodeData>) {
  const { interface: iml, sequenceNumber } = data;

  return (
    <>
      <Card
        className={`p-4 min-w-[250px] ${
          selected ? "ring-2 ring-primary" : ""
        } hover:shadow-lg transition-shadow cursor-pointer`}
        title="Double-click to view details"
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">
              {sequenceNumber}
            </div>
            <Plug className="h-4 w-4 text-primary" />
          </div>
          <Badge
            variant={iml.status === "active" ? "default" : "secondary"}
            className="text-xs"
          >
            {iml.status}
          </Badge>
        </div>
        
        <div className="space-y-1">
          <h3 className="font-semibold text-sm">{iml.imlNumber}</h3>
          <p className="text-xs text-muted-foreground">{iml.interfaceType}</p>
          
          {(iml.providerApp || iml.consumerApp) && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
              <span className="truncate max-w-[80px]">
                {iml.providerApp?.name || "Unknown"}
              </span>
              <ArrowRight className="h-3 w-3 flex-shrink-0" />
              <span className="truncate max-w-[80px]">
                {iml.consumerApp?.name || "Unknown"}
              </span>
            </div>
          )}
        </div>
      </Card>
    </>
  );
}

export default memo(IMLNode);