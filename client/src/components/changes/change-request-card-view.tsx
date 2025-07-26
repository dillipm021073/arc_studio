import React from "react";
import {
  GitBranch,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Copy,
  Clock,
  User,
  Calendar,
  AlertCircle,
  CheckCircle,
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
import CommunicationBadge from "@/components/communications/communication-badge";
import { formatDistanceToNow } from "date-fns";

interface ChangeRequest {
  id: number;
  crNumber: string;
  title: string;
  description: string;
  reason: string;
  benefit: string;
  status: string;
  priority: string;
  owner: string;
  requestedBy: string;
  approvedBy: string;
  targetDate: string;
  completedDate: string;
  createdAt: string;
}

interface ChangeRequestCardViewProps {
  changeRequests: ChangeRequest[];
  onView?: (cr: ChangeRequest) => void;
  onEdit?: (cr: ChangeRequest) => void;
  onDelete?: (cr: ChangeRequest) => void;
  onViewImpacts?: (cr: ChangeRequest) => void;
  isLoading?: boolean;
}

export default function ChangeRequestCardView({
  changeRequests,
  onView,
  onEdit,
  onDelete,
  onViewImpacts,
  isLoading = false,
}: ChangeRequestCardViewProps) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft':
        return 'bg-gray-600 text-white';
      case 'submitted':
        return 'bg-blue-600 text-white';
      case 'in_review':
        return 'bg-yellow-600 text-white';
      case 'approved':
        return 'bg-green-600 text-white';
      case 'in_progress':
        return 'bg-purple-600 text-white';
      case 'completed':
        return 'bg-green-700 text-white';
      case 'rejected':
        return 'bg-red-600 text-white';
      case 'cancelled':
        return 'bg-gray-700 text-white';
      default:
        return 'bg-gray-600 text-white';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'high':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'medium':
        return <Info className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const ChangeRequestContextMenu = ({ cr, children }: { cr: ChangeRequest; children: React.ReactNode }) => (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        {onView && (
          <ContextMenuItem onClick={() => onView(cr)}>
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </ContextMenuItem>
        )}
        {onEdit && (
          <ContextMenuItem onClick={() => onEdit(cr)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </ContextMenuItem>
        )}
        <ContextMenuItem onClick={() => navigator.clipboard.writeText(cr.crNumber)}>
          <Copy className="mr-2 h-4 w-4" />
          Copy CR Number
        </ContextMenuItem>
        {onViewImpacts && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={() => onViewImpacts(cr)}>
              <GitBranch className="mr-2 h-4 w-4" />
              View Impacts
            </ContextMenuItem>
          </>
        )}
        {onDelete && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem 
              onClick={() => onDelete(cr)}
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

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-gray-800 rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-700 rounded w-1/2 mb-4"></div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-700 rounded"></div>
              <div className="h-3 bg-gray-700 rounded w-5/6"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
      {changeRequests.map((cr) => (
        <ChangeRequestContextMenu key={cr.id} cr={cr}>
          <div
            className={cn(
              "bg-gray-800 rounded-lg p-4 border border-gray-700",
              "hover:bg-gray-750 hover:border-gray-600 transition-colors cursor-pointer",
              "group"
            )}
            onDoubleClick={() => onView?.(cr)}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-medium text-sm truncate flex-1" title={cr.title}>
                    {cr.title}
                  </h3>
                  <span className="text-xs text-gray-500 font-mono">
                    {cr.crNumber}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  by {cr.requestedBy}
                </p>
              </div>
              
              {/* Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onView && (
                    <DropdownMenuItem onClick={() => onView(cr)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                  )}
                  {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(cr)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => navigator.clipboard.writeText(cr.crNumber)}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy CR Number
                  </DropdownMenuItem>
                  {onViewImpacts && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onViewImpacts(cr)}>
                        <GitBranch className="mr-2 h-4 w-4" />
                        View Impacts
                      </DropdownMenuItem>
                    </>
                  )}
                  {onDelete && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => onDelete(cr)}
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

            {/* Description */}
            <p className="text-xs text-gray-300 mb-3 line-clamp-2" title={cr.description}>
              {cr.description}
            </p>

            {/* Status and Priority */}
            <div className="flex items-center gap-2 mb-3">
              <Badge className={cn("text-xs", getStatusColor(cr.status))}>
                {cr.status.replace('_', ' ')}
              </Badge>
              <div className="flex items-center gap-1">
                {getPriorityIcon(cr.priority)}
                <span className="text-xs text-gray-400">{cr.priority}</span>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-1 text-xs text-gray-400">
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span>Owner: {cr.owner}</span>
              </div>
              {cr.targetDate && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>Target: {new Date(cr.targetDate).toLocaleDateString()}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{formatDistanceToNow(new Date(cr.createdAt))} ago</span>
              </div>
            </div>

            {/* Communication Badge */}
            <div className="mt-3 flex justify-end">
              <CommunicationBadge 
                entityType="change_request" 
                entityId={cr.id} 
                entityName={cr.crNumber}
              />
            </div>
          </div>
        </ChangeRequestContextMenu>
      ))}
    </div>
  );
}