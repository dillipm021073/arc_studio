import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MessageSquare, Plus } from "lucide-react";
import ConversationForm from "./conversation-form";
import ConversationsList from "./conversations-list";

interface CommunicationBadgeProps {
  entityType: "application" | "interface" | "business_process" | "change_request";
  entityId: number;
  entityName?: string;
}

export default function CommunicationBadge({ 
  entityType, 
  entityId, 
  entityName 
}: CommunicationBadgeProps) {
  const [showConversations, setShowConversations] = useState(false);
  const [showNewConversation, setShowNewConversation] = useState(false);

  // Fetch conversation count
  const { data: conversationCount = 0 } = useQuery({
    queryKey: [`/api/conversations/count/${entityType}/${entityId}`],
    queryFn: async () => {
      const response = await fetch(`/api/conversations/count/${entityType}/${entityId}`);
      if (!response.ok) throw new Error("Failed to fetch conversation count");
      const data = await response.json();
      return data.count;
    }
  });

  return (
    <>
      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center space-x-1 hover:bg-gray-700"
          onClick={() => setShowConversations(true)}
        >
          <MessageSquare className="h-4 w-4" />
          {conversationCount > 0 && (
            <Badge variant="secondary" className="ml-1 bg-blue-600 text-white">
              {conversationCount}
            </Badge>
          )}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="hover:bg-gray-700"
          onClick={() => setShowNewConversation(true)}
          title="Start new conversation"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Conversations List Dialog */}
      <Dialog open={showConversations} onOpenChange={setShowConversations}>
        <DialogContent className="max-w-4xl bg-gray-800 border-gray-700 max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-white">
              Conversations for {entityName || `${entityType} #${entityId}`}
            </DialogTitle>
          </DialogHeader>
          <ConversationsList
            entityType={entityType}
            entityId={entityId}
            onNewConversation={() => {
              setShowConversations(false);
              setShowNewConversation(true);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* New Conversation Dialog */}
      <Dialog open={showNewConversation} onOpenChange={setShowNewConversation}>
        <DialogContent className="max-w-2xl bg-gray-800 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Start New Conversation</DialogTitle>
          </DialogHeader>
          <ConversationForm
            entityType={entityType}
            entityId={entityId}
            entityName={entityName}
            onSuccess={() => setShowNewConversation(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}