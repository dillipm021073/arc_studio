import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { 
  MessageSquare, 
  Plus, 
  Calendar, 
  User, 
  ChevronRight,
  Circle
} from "lucide-react";
import ConversationDetail from "./conversation-detail";
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
  commentCount: number;
  lastComment?: {
    author: string;
    content: string;
    createdAt: string;
  };
}

interface ConversationsListProps {
  entityType: "application" | "interface" | "business_process" | "change_request";
  entityId: number;
  onNewConversation?: () => void;
}

export default function ConversationsList({ 
  entityType, 
  entityId, 
  onNewConversation 
}: ConversationsListProps) {
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);

  // Fetch conversations for this entity
  const { data: conversations = [], isLoading } = useQuery<Conversation[]>({
    queryKey: [`/api/conversations/entity/${entityType}/${entityId}`],
    queryFn: async () => {
      const response = await fetch(`/api/conversations/entity/${entityType}/${entityId}`);
      if (!response.ok) throw new Error("Failed to fetch conversations");
      return response.json();
    }
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open': return 'bg-green-600 text-white';
      case 'resolved': return 'bg-gray-600 text-white';
      case 'pending': return 'bg-yellow-600 text-white';
      case 'closed': return 'bg-red-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'low': return 'bg-green-600 text-white';
      case 'medium': return 'bg-yellow-600 text-white';
      case 'high': return 'bg-orange-600 text-white';
      case 'critical': return 'bg-red-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-gray-400">Loading conversations...</p>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <MessageSquare className="h-12 w-12 text-gray-500 mb-4" />
        <p className="text-gray-400 mb-4">No conversations yet</p>
        {onNewConversation && (
          <Button 
            onClick={onNewConversation}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Start Conversation
          </Button>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-gray-400">
            {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
          </p>
          {onNewConversation && (
            <Button 
              onClick={onNewConversation}
              size="sm"
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              New
            </Button>
          )}
        </div>

        <ScrollArea className="h-[500px]">
          <div className="space-y-3">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 cursor-pointer transition-colors"
                onClick={() => setSelectedConversation(conversation.id)}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-white flex-1 mr-2">
                    {conversation.title}
                  </h4>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(conversation.status)}>
                      {conversation.status}
                    </Badge>
                    <Badge className={getPriorityColor(conversation.priority)}>
                      {conversation.priority}
                    </Badge>
                  </div>
                </div>

                {conversation.description && (
                  <p className="text-sm text-gray-400 mb-2 line-clamp-2">
                    {conversation.description}
                  </p>
                )}

                <div className="flex items-center justify-between text-xs text-gray-400">
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center">
                      <User className="h-3 w-3 mr-1" />
                      {conversation.createdBy}
                    </span>
                    <span className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatDistanceToNow(new Date(conversation.createdAt), { addSuffix: true })}
                    </span>
                    <span className="flex items-center">
                      <MessageSquare className="h-3 w-3 mr-1" />
                      {conversation.commentCount} comment{conversation.commentCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4" />
                </div>

                {conversation.lastComment && (
                  <div className="mt-3 pt-3 border-t border-gray-600">
                    <div className="flex items-start space-x-2">
                      <Circle className="h-2 w-2 text-blue-500 mt-1.5 flex-shrink-0" />
                      <div className="flex-1 text-xs">
                        <span className="text-gray-400">
                          {conversation.lastComment.author} • {formatDistanceToNow(new Date(conversation.lastComment.createdAt), { addSuffix: true })}
                        </span>
                        <p className="text-gray-300 mt-1 line-clamp-2">
                          {conversation.lastComment.content}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Conversation Detail Dialog */}
      <Dialog 
        open={selectedConversation !== null} 
        onOpenChange={(open) => !open && setSelectedConversation(null)}
      >
        <DialogContent className="max-w-4xl bg-gray-800 border-gray-700 max-h-[90vh]">
          {selectedConversation && (
            <ConversationDetail 
              conversationId={selectedConversation}
              onClose={() => setSelectedConversation(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}