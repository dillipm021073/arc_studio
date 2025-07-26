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
  CheckCircle,
  AlertTriangle,
  Clock,
  FileText,
  MessageSquare,
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

interface ArtifactCardViewProps {
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

export default function ArtifactCardView({
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
}: ArtifactCardViewProps) {
  // Add custom scrollbar styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .artifact-card-scroll {
        scrollbar-width: thin;
        scrollbar-color: #4b5563 #1f2937;
      }
      .artifact-card-scroll::-webkit-scrollbar {
        width: 12px;
        height: 12px;
      }
      .artifact-card-scroll::-webkit-scrollbar-track {
        background: #1f2937;
        border-radius: 6px;
      }
      .artifact-card-scroll::-webkit-scrollbar-thumb {
        background: #4b5563;
        border-radius: 6px;
      }
      .artifact-card-scroll::-webkit-scrollbar-thumb:hover {
        background: #6b7280;
      }
      .artifact-card-scroll::-webkit-scrollbar-corner {
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

  const getArtifactDescription = (artifact: any) => {
    switch (artifactType) {
      case "application":
        return `${artifact.lob || 'N/A'} • ${artifact.os || 'N/A'}`;
      case "interface":
        return artifact.description || "No description";
      case "businessProcess":
        return `${artifact.lob || 'N/A'} • Level ${artifact.level || 'A'}`;
      case "internalActivity":
        return artifact.description || "No description";
      case "technicalProcess":
        return artifact.description || "No description";
      default:
        return "";
    }
  };

  const getArtifactBadges = (artifact: any) => {
    const badges = [];
    
    // Status badge
    if (artifact.status) {
      badges.push(
        <Badge key="status" variant="outline" className="text-xs">
          {artifact.status.replace('_', ' ')}
        </Badge>
      );
    }

    // Type-specific badges
    if (artifactType === "application") {
      if (artifact.deployment) {
        const isCloud = artifact.deployment === 'cloud';
        badges.push(
          <Badge key="deployment" variant="outline" className="text-xs">
            {isCloud ? <Cloud className="h-3 w-3 mr-1" /> : <HardDrive className="h-3 w-3 mr-1" />}
            {artifact.deployment}
          </Badge>
        );
      }
      if (artifact.uptime) {
        badges.push(
          <Badge key="uptime" variant="outline" className="text-xs">
            {artifact.uptime}% uptime
          </Badge>
        );
      }
    }

    if (artifactType === "interface" && artifact.interfaceType) {
      badges.push(
        <Badge key="type" variant="outline" className="text-xs">
          {artifact.interfaceType}
        </Badge>
      );
    }

    return badges;
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
    <div className="h-full overflow-auto artifact-card-scroll">
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
        {artifacts.map((artifact) => (
          <ArtifactContextMenu key={artifact.id} artifact={artifact}>
            <div
              className="group relative bg-gray-800 rounded-lg p-4 hover:bg-gray-700 cursor-pointer transition-all hover:shadow-lg"
              onDoubleClick={() => onView?.(artifact)}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "p-2 rounded-lg",
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
                  <ArtifactStatusBadge 
                    state={getArtifactState(artifact)} 
                    showIcon={true}
                    showText={false}
                    size="sm"
                  />
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
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

              {/* Content */}
              <div className="space-y-2">
                <h3 className="font-medium text-sm truncate" title={getArtifactName(artifact)}>
                  {getArtifactName(artifact)}
                </h3>
                <p className="text-xs text-gray-400 truncate" title={getArtifactDescription(artifact)}>
                  {getArtifactDescription(artifact)}
                </p>
              </div>

              {/* Badges */}
              <div className="mt-3 flex flex-wrap gap-1">
                {getArtifactBadges(artifact)}
              </div>

              {/* Footer */}
              <div className="mt-3 pt-3 border-t border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CommunicationBadge 
                    entityType={artifactType} 
                    entityId={artifact.id} 
                    entityName={getArtifactName(artifact)}
                    size="sm"
                  />
                </div>
                <div className="text-xs text-gray-400 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {artifact.lastChangeDate && formatDistanceToNow(new Date(artifact.lastChangeDate), { addSuffix: true })}
                </div>
              </div>
            </div>
          </ArtifactContextMenu>
        ))}
      </div>
    </div>
  );
}