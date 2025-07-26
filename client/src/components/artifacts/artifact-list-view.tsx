import { useEffect } from "react";
import {
  Box,
  Plug,
  GitBranch,
  Activity,
  Cpu,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Lock,
  Unlock,
  Cloud,
  HardDrive,
  Clock,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import { cn } from "@/lib/utils";
import { ArtifactType } from "./artifacts-explorer";
import { ArtifactStatusBadge } from "@/components/ui/artifact-status-badge";
import { getArtifactState } from "@/lib/artifact-state-utils";
import CommunicationBadge from "@/components/communications/communication-badge";
import { formatDistanceToNow } from "date-fns";
import { useInitiative } from "@/components/initiatives/initiative-context";

interface ArtifactListViewProps {
  artifacts: any[];
  artifactType: ArtifactType;
  onView?: (artifact: any) => void;
  onEdit?: (artifact: any) => void;
  onDelete?: (artifact: any) => void;
  onCheckout?: (artifact: any) => void;
  onCheckin?: (artifact: any, changes: any) => void;
  onCancelCheckout?: (artifact: any) => void;
  customActions?: (artifact: any) => React.ReactNode;
  isProductionView?: boolean;
}

const artifactIcons = {
  application: Box,
  interface: Plug,
  businessProcess: GitBranch,
  internalActivity: Activity,
  technicalProcess: Cpu,
};

export default function ArtifactListView({
  artifacts,
  artifactType,
  onView,
  onEdit,
  onDelete,
  onCheckout,
  onCheckin,
  onCancelCheckout,
  customActions,
  isProductionView = false,
}: ArtifactListViewProps) {
  const { currentInitiative } = useInitiative();
  // Add custom scrollbar styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .artifact-list-scroll {
        scrollbar-width: thin;
        scrollbar-color: #4b5563 #1f2937;
      }
      .artifact-list-scroll::-webkit-scrollbar {
        width: 12px;
        height: 12px;
      }
      .artifact-list-scroll::-webkit-scrollbar-track {
        background: #1f2937;
        border-radius: 6px;
      }
      .artifact-list-scroll::-webkit-scrollbar-thumb {
        background: #4b5563;
        border-radius: 6px;
      }
      .artifact-list-scroll::-webkit-scrollbar-thumb:hover {
        background: #6b7280;
      }
      .artifact-list-scroll::-webkit-scrollbar-corner {
        background: #1f2937;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const getArtifactIcon = () => artifactIcons[artifactType];
  
  const getArtifactName = (artifact: any) => {
    switch (artifactType) {
      case "application":
        return artifact.name;
      case "interface":
        return artifact.imlNumber;
      case "businessProcess":
        return artifact.businessProcess;
      case "internalActivity":
        return artifact.activityName;
      case "technicalProcess":
        return artifact.processName;
      default:
        return artifact.name || "Unnamed";
    }
  };

  const getArtifactSubtitle = (artifact: any) => {
    switch (artifactType) {
      case "application":
        return artifact.amlNumber;
      case "interface":
        return `${artifact.providerApplicationName || 'Unknown'} → ${artifact.consumerApplicationName || 'Unknown'}`;
      case "businessProcess":
        return `${artifact.lob || 'N/A'} • ${artifact.product || 'N/A'}`;
      case "internalActivity":
        return artifact.description || "No description";
      case "technicalProcess":
        return artifact.description || "No description";
      default:
        return "";
    }
  };

  const getArtifactDetails = (artifact: any) => {
    const details = [];
    
    if (artifactType === "application") {
      if (artifact.os) details.push(artifact.os);
      if (artifact.deployment) {
        const isCloud = artifact.deployment === 'cloud';
        details.push(
          <span key="deployment" className="flex items-center gap-1">
            {isCloud ? <Cloud className="h-3 w-3" /> : <HardDrive className="h-3 w-3" />}
            {artifact.deployment}
          </span>
        );
      }
      if (artifact.uptime) details.push(`${artifact.uptime}% uptime`);
    }

    if (artifactType === "interface") {
      if (artifact.interfaceType) details.push(artifact.interfaceType.toUpperCase());
      if (artifact.middleware) details.push(artifact.middleware);
    }

    if (artifactType === "businessProcess") {
      if (artifact.level) details.push(`Level ${artifact.level}`);
      if (artifact.version) details.push(`v${artifact.version}`);
    }

    return details;
  };

  const ArtifactContextMenu = ({ artifact, children }: { artifact: any; children: React.ReactNode }) => (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        {onView && (
          <ContextMenuItem onClick={() => onView(artifact)}>
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </ContextMenuItem>
        )}
        {!isProductionView && (
          <>
            {onCheckout && (
              <ContextMenuItem onClick={() => onCheckout(artifact)}>
                <Lock className="mr-2 h-4 w-4" />
                Checkout for Edit
              </ContextMenuItem>
            )}
            {onEdit && (
              <ContextMenuItem onClick={() => onEdit(artifact)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </ContextMenuItem>
            )}
            {onCancelCheckout && (
              <ContextMenuItem onClick={() => onCancelCheckout(artifact)}>
                <Unlock className="mr-2 h-4 w-4" />
                Cancel Checkout
              </ContextMenuItem>
            )}
          </>
        )}
        {customActions && (
          <>
            <ContextMenuSeparator />
            {customActions(artifact)}
          </>
        )}
        {onDelete && !isProductionView && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem 
              onClick={() => onDelete(artifact)}
              className="text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );

  const Icon = getArtifactIcon();

  return (
    <div className="h-full overflow-auto artifact-list-scroll">
      <div className="divide-y divide-gray-700">
        {artifacts.map((artifact) => (
          <ArtifactContextMenu key={artifact.id} artifact={artifact}>
            <div
              className={cn(
                "flex items-center gap-4 p-4 hover:bg-gray-800 cursor-pointer group transition-colors",
                "hover:bg-gray-700"
              )}
              onDoubleClick={() => onView?.(artifact)}
            >
              {/* Icon */}
              <div className={cn(
                "p-2 rounded-lg flex-shrink-0",
                artifactType === "application" && "bg-blue-500/10",
                artifactType === "interface" && "bg-green-500/10",
                artifactType === "businessProcess" && "bg-purple-500/10",
                artifactType === "internalActivity" && "bg-orange-500/10",
                artifactType === "technicalProcess" && "bg-cyan-500/10"
              )}>
                <Icon className={cn(
                  "h-5 w-5",
                  artifactType === "application" && "text-blue-500",
                  artifactType === "interface" && "text-green-500",
                  artifactType === "businessProcess" && "text-purple-500",
                  artifactType === "internalActivity" && "text-orange-500",
                  artifactType === "technicalProcess" && "text-cyan-500"
                )} />
              </div>

              {/* Main Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-sm truncate">
                    {getArtifactName(artifact)}
                  </h3>
                  {/* Status badge will be shown separately */}
                </div>
                {/* Application name for internal activities and technical processes */}
                {(artifactType === "internalActivity" || artifactType === "technicalProcess") && artifact.applicationName && (
                  <p className="text-sm font-bold text-white truncate mt-1">
                    {artifact.applicationName}
                  </p>
                )}
                <p className="text-xs text-gray-400 truncate mt-1">
                  {getArtifactSubtitle(artifact)}
                </p>
              </div>

              {/* Details */}
              <div className="hidden md:flex items-center gap-4 text-sm text-gray-400">
                {getArtifactDetails(artifact).map((detail, index) => (
                  <span key={index} className="flex items-center gap-1">
                    {detail}
                  </span>
                ))}
              </div>

              {/* Status & Communication */}
              <div className="flex items-center gap-3">
                {artifact.status && (
                  <Badge variant="outline" className="text-xs">
                    {artifact.status.replace('_', ' ')}
                  </Badge>
                )}
                <CommunicationBadge 
                  entityType={artifactType === "businessProcess" ? "business_process" : artifactType as any} 
                  entityId={artifact.id} 
                  entityName={getArtifactName(artifact)}
                />
              </div>

              {/* Last Modified */}
              <div className="hidden lg:flex items-center gap-1 text-xs text-gray-400">
                <Clock className="h-3 w-3" />
                {artifact.lastChangeDate && formatDistanceToNow(new Date(artifact.lastChangeDate))}
              </div>

              {/* Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onView && (
                    <DropdownMenuItem onClick={() => onView(artifact)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                  )}
                  {!isProductionView && (
                    <>
                      {onCheckout && (
                        <DropdownMenuItem onClick={() => onCheckout(artifact)}>
                          <Lock className="mr-2 h-4 w-4" />
                          Checkout for Edit
                        </DropdownMenuItem>
                      )}
                      {onEdit && (
                        <DropdownMenuItem onClick={() => onEdit(artifact)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                      )}
                      {onCancelCheckout && (
                        <DropdownMenuItem onClick={() => onCancelCheckout(artifact)}>
                          <Unlock className="mr-2 h-4 w-4" />
                          Cancel Checkout
                        </DropdownMenuItem>
                      )}
                    </>
                  )}
                  {customActions && (
                    <>
                      <DropdownMenuSeparator />
                      {customActions(artifact)}
                    </>
                  )}
                  {onDelete && !isProductionView && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => onDelete(artifact)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </ArtifactContextMenu>
        ))}
      </div>
    </div>
  );
}