import React from "react";
import {
  MessageSquare,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Users,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Timer,
  Link as LinkIcon,
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
import { formatDistanceToNow } from "date-fns";

interface Conversation {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  createdBy: string;
  assignedTo: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  links: any[];
  participants: any[];
}

interface CommunicationCardViewProps {
  conversations: Conversation[];
  onView?: (conversation: Conversation) => void;
  onEdit?: (conversation: Conversation) => void;
  onDelete?: (conversation: Conversation) => void;
  onMarkResolved?: (conversation: Conversation) => void;
  onReopen?: (conversation: Conversation) => void;
  isLoading?: boolean;
}

export default function CommunicationCardView({
  conversations,
  onView,
  onEdit,
  onDelete,
  onMarkResolved,
  onReopen,
  isLoading = false,
}: CommunicationCardViewProps) {
  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'in_progress':
        return <Timer className="h-4 w-4 text-blue-500" />;
      case 'resolved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'closed':
        return <XCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <MessageSquare className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical':
        return 'bg-red-600 text-white';
      case 'high':
        return 'bg-orange-600 text-white';
      case 'medium':
        return 'bg-yellow-600 text-white';
      case 'low':
        return 'bg-green-600 text-white';
      default:
        return 'bg-gray-600 text-white';
    }
  };

  const CommunicationContextMenu = ({ conversation, children }: { conversation: Conversation; children: React.ReactNode }) => (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        {onView && (
          <ContextMenuItem onClick={() => onView(conversation)}>
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </ContextMenuItem>
        )}
        {onEdit && (
          <ContextMenuItem onClick={() => onEdit(conversation)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </ContextMenuItem>
        )}
        {conversation.status !== 'resolved' && onMarkResolved && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={() => onMarkResolved(conversation)}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Mark as Resolved
            </ContextMenuItem>
          </>
        )}
        {conversation.status === 'resolved' && onReopen && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={() => onReopen(conversation)}>
              <AlertCircle className="mr-2 h-4 w-4" />
              Reopen
            </ContextMenuItem>
          </>
        )}
        {onDelete && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem 
              onClick={() => onDelete(conversation)}
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
      {conversations.map((conversation) => (
        <CommunicationContextMenu key={conversation.id} conversation={conversation}>
          <div
            className={cn(
              "bg-gray-800 rounded-lg p-4 border border-gray-700",
              "hover:bg-gray-750 hover:border-gray-600 transition-colors cursor-pointer",
              "group"
            )}
            onDoubleClick={() => onView?.(conversation)}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-medium text-sm truncate" title={conversation.title}>
                  {conversation.title}
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  by {conversation.createdBy}
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
                    <DropdownMenuItem onClick={() => onView(conversation)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                  )}
                  {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(conversation)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  {conversation.status !== 'resolved' && onMarkResolved && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onMarkResolved(conversation)}>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Mark as Resolved
                      </DropdownMenuItem>
                    </>
                  )}
                  {conversation.status === 'resolved' && onReopen && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onReopen(conversation)}>
                        <AlertCircle className="mr-2 h-4 w-4" />
                        Reopen
                      </DropdownMenuItem>
                    </>
                  )}
                  {onDelete && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => onDelete(conversation)}
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

            {/* Description - only show if different from title */}
            {conversation.description && conversation.description !== conversation.title && (
              <p className="text-xs text-gray-300 mb-3 line-clamp-2" title={conversation.description}>
                {conversation.description}
              </p>
            )}

            {/* Status and Priority */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-1">
                {getStatusIcon(conversation.status)}
                <span className="text-xs text-gray-400">{conversation.status.replace('_', ' ')}</span>
              </div>
              <Badge className={cn("text-xs", getPriorityColor(conversation.priority))}>
                {conversation.priority}
              </Badge>
            </div>

            {/* Details */}
            <div className="space-y-1 text-xs text-gray-400">
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                <span>Assigned to: {conversation.assignedTo}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{formatDistanceToNow(new Date(conversation.updatedAt))} ago</span>
              </div>
              {conversation.resolvedAt && (
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>Resolved {formatDistanceToNow(new Date(conversation.resolvedAt))} ago</span>
                </div>
              )}
            </div>

            {/* Links and Participants */}
            <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
              <div className="flex items-center gap-3">
                {conversation.links?.length > 0 && (
                  <div className="flex items-center gap-1">
                    <LinkIcon className="h-3 w-3" />
                    <span>{conversation.links.length}</span>
                  </div>
                )}
                {conversation.participants?.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span>{conversation.participants.length}</span>
                  </div>
                )}
              </div>
              <MessageSquare className="h-4 w-4 text-gray-500" />
            </div>
          </div>
        </CommunicationContextMenu>
      ))}
    </div>
  );
}