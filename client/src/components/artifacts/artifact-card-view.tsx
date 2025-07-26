import React, { useEffect } from "react";
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
  Rocket,
  Info,
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

const getStatusColor = (status: string) => {
  if (!status) return 'bg-orange-600 text-white';
  switch (status.toLowerCase()) {
    case 'new': return 'bg-purple-600 text-white';
    case 'active': return 'bg-green-600 text-white';
    case 'inactive': return 'bg-red-600 text-white';
    case 'in_development': return 'bg-yellow-600 text-white';
    case 'in_testing': return 'bg-blue-600 text-white';
    case 'decommissioned': return 'bg-gray-600 text-white';
    default: return 'bg-orange-600 text-white';
  }
};

const getDeploymentColor = (deployment: string) => {
  if (!deployment) return 'bg-orange-600 text-white';
  switch (deployment.toLowerCase()) {
    case 'cloud': return 'bg-blue-600 text-white';
    case 'on-premise': return 'bg-orange-600 text-white';
    case 'on_premise': return 'bg-orange-600 text-white';
    case 'hybrid': return 'bg-purple-600 text-white';
    default: return 'bg-gray-600 text-white';
  }
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
  const { currentInitiative } = useInitiative();
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
    
    // Status badge - show initiative state if pending
    if (artifact.artifactState === 'pending' || artifact.versionState === 'new_in_initiative') {
      badges.push(
        <Badge key="status" className={cn("text-xs", "bg-yellow-600 text-white")}>
          Pending Deployment
        </Badge>
      );
    } else if (artifact.artifactState === 'decommissioning') {
      badges.push(
        <Badge key="status" className={cn("text-xs", "bg-gray-600 text-white")}>
          Decommissioning
        </Badge>
      );
    } else if (artifact.status) {
      badges.push(
        <Badge key="status" className={cn("text-xs", getStatusColor(artifact.status))}>
          {artifact.status.replace('_', ' ')}
        </Badge>
      );
    }

    // Type-specific badges
    if (artifactType === "application") {
      if (artifact.deployment) {
        const isCloud = artifact.deployment.toLowerCase() === 'cloud';
        badges.push(
          <Badge key="deployment" className={cn("text-xs", getDeploymentColor(artifact.deployment))}>
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
        {/* Version control options for initiative mode */}
        {currentInitiative && !isProductionView && (
          <>
            {onCheckout && !artifact.lockedBy && (
              <ContextMenuItem onClick={() => onCheckout(artifact)}>
                <Lock className="mr-2 h-4 w-4" />
                Checkout for Edit
              </ContextMenuItem>
            )}
            {artifact.lockedBy && artifact.lockedBy === artifact.currentUserId && (
              <>
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
            {artifact.lockedBy && artifact.lockedBy !== artifact.currentUserId && (
              <ContextMenuItem disabled>
                <Lock className="mr-2 h-4 w-4" />
                Locked by user
              </ContextMenuItem>
            )}
          </>
        )}
        {/* Edit option for production view or no initiative context */}
        {(!currentInitiative || isProductionView) && onEdit && (
          <ContextMenuItem onClick={() => onEdit(artifact)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </ContextMenuItem>
        )}
        {/* Show help when in initiative mode but item not checked out */}
        {currentInitiative && !isProductionView && !artifact.lockedBy && (
          <ContextMenuItem disabled>
            <Info className="mr-2 h-4 w-4" />
            Checkout required to edit
          </ContextMenuItem>
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
              className={cn(
                "group relative rounded-lg p-4 cursor-pointer transition-all hover:shadow-lg",
                "bg-gray-800 hover:bg-gray-700",
                // Visual differentiation based on state
                (() => {
                  // Check for pending/new artifacts first
                  if (artifact.artifactState === 'pending' || artifact.versionState === 'new_in_initiative') {
                    return "ring-2 ring-yellow-500/50 bg-yellow-950/20";
                  }
                  if (artifact.artifactState === 'decommissioning') {
                    return "opacity-60 ring-2 ring-gray-500/30";
                  }
                  // Then check lock states - all locked items show red as warning
                  if (artifact.lockedBy && artifact.lockedBy !== artifact.currentUserId) return "opacity-75 ring-2 ring-red-500/50";
                  if (artifact.lockedBy && artifact.lockedBy === artifact.currentUserId) return "ring-2 ring-red-500";
                  if (artifact.hasInitiativeChanges) return "ring-2 ring-yellow-500/30";
                  return "";
                })()
              )}
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
                  {/* Status indicators */}
                  {(() => {
                    const icons = [];
                    
                    // Show lock icon if checked out - all locks show red as warning
                    if (artifact.lockedBy && artifact.lockedBy === artifact.currentUserId) {
                      icons.push(
                        <div key="lock" className="p-1 rounded bg-red-500/20" title="Checked out by you">
                          <Lock className="h-4 w-4 text-red-500" />
                        </div>
                      );
                    } else if (artifact.lockedBy && artifact.lockedBy !== artifact.currentUserId) {
                      icons.push(
                        <div key="lock" className="p-1 rounded bg-red-500/20" title="Checked out by another user">
                          <Lock className="h-4 w-4 text-red-500" />
                        </div>
                      );
                    }
                    
                    // Show rocket icon for pending changes
                    if (artifact.hasInitiativeChanges || 
                        artifact.artifactState === 'pending' || 
                        artifact.versionState === 'new_in_initiative' ||
                        artifact.artifactState === 'decommissioning') {
                      icons.push(
                        <div key="rocket" className="p-1 rounded bg-yellow-500/20" title="Has pending changes">
                          <Rocket className="h-4 w-4 text-yellow-500" />
                        </div>
                      );
                    }
                    
                    return icons;
                  })()}
                  
                  {/* Status badge will be shown separately */}
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
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-medium text-sm truncate flex-1" title={getArtifactName(artifact)}>
                    {getArtifactName(artifact)}
                  </h3>
                  {artifactType === "application" && artifact.amlNumber && (
                    <span className="text-xs text-gray-500 font-mono">
                      {artifact.amlNumber}
                    </span>
                  )}
                </div>
                {/* Application name for internal activities and technical processes */}
                {(artifactType === "internalActivity" || artifactType === "technicalProcess") && artifact.applicationName && (
                  <p className="text-sm font-bold text-white truncate" title={artifact.applicationName}>
                    {artifact.applicationName}
                  </p>
                )}
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
                    entityType={artifactType === "businessProcess" ? "business_process" : artifactType as any} 
                    entityId={artifact.id} 
                    entityName={getArtifactName(artifact)}
                  />
                </div>
                <div className="text-xs text-gray-400 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {artifact.lastChangeDate && formatDistanceToNow(new Date(artifact.lastChangeDate))}
                </div>
              </div>
            </div>
          </ArtifactContextMenu>
        ))}
      </div>
    </div>
  );
}