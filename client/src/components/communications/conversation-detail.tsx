import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { format, formatDistanceToNow } from "date-fns";
import {
  MessageSquare,
  Send,
  Clock,
  User,
  Link as LinkIcon,
  Users,
  Edit,
  Trash2,
  Reply,
  CheckCircle,
  AlertCircle,
  Timer,
  XCircle,
  Paperclip
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ConversationDetailProps {
  conversationId: number;
}

interface Comment {
  id: number;
  conversationId: number;
  parentId?: number;
  content: string;
  author: string;
  isEdited: boolean;
  editedAt?: string;
  createdAt: string;
  attachments?: any[];
  mentions?: any[];
  replies?: Comment[];
}

export default function ConversationDetail({ conversationId }: ConversationDetailProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  const [newComment, setNewComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [deletingCommentId, setDeletingCommentId] = useState<number | null>(null);
  const [replyingToId, setReplyingToId] = useState<number | null>(null);

  // Fetch conversation details with comments
  const { data: conversation, isLoading } = useQuery({
    queryKey: ["/api/conversations", conversationId],
    queryFn: async () => {
      const response = await fetch(`/api/conversations/${conversationId}`);
      if (!response.ok) throw new Error("Failed to fetch conversation");
      return response.json();
    },
  });

  // Auto-scroll to bottom when new comments are added
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [conversation?.comments]);

  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch(`/api/conversations/${conversationId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          author: user?.username || "Unknown",
          parentId: replyingToId || undefined,
        }),
      });
      if (!response.ok) throw new Error("Failed to add comment");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", conversationId] });
      setNewComment("");
      setReplyingToId(null);
      toast({
        title: "Success",
        description: "Comment added successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
    },
  });

  const updateCommentMutation = useMutation({
    mutationFn: async ({ id, content }: { id: number; content: string }) => {
      const response = await fetch(`/api/comments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!response.ok) throw new Error("Failed to update comment");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", conversationId] });
      setEditingCommentId(null);
      setEditingContent("");
      toast({
        title: "Success",
        description: "Comment updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update comment",
        variant: "destructive",
      });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/comments/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete comment");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", conversationId] });
      setDeletingCommentId(null);
      toast({
        title: "Success",
        description: "Comment deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete comment",
        variant: "destructive",
      });
    },
  });

  const handleSendComment = () => {
    if (newComment.trim()) {
      addCommentMutation.mutate(newComment.trim());
    }
  };

  const handleEditComment = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditingContent(comment.content);
  };

  const handleUpdateComment = () => {
    if (editingCommentId && editingContent.trim()) {
      updateCommentMutation.mutate({
        id: editingCommentId,
        content: editingContent.trim(),
      });
    }
  };

  const handleDeleteComment = (id: number) => {
    deleteCommentMutation.mutate(id);
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open': return <AlertCircle className="h-4 w-4" />;
      case 'resolved': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <Timer className="h-4 w-4" />;
      case 'closed': return <XCircle className="h-4 w-4" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open': return 'bg-blue-600 text-white';
      case 'resolved': return 'bg-green-600 text-white';
      case 'pending': return 'bg-yellow-600 text-white';
      case 'closed': return 'bg-gray-600 text-white';
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

  // Organize comments into threaded structure
  const organizeComments = (comments: Comment[]): Comment[] => {
    const commentMap = new Map<number, Comment>();
    const topLevelComments: Comment[] = [];

    // First pass: create map
    comments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    // Second pass: organize hierarchy
    comments.forEach(comment => {
      if (comment.parentId) {
        const parent = commentMap.get(comment.parentId);
        if (parent) {
          parent.replies!.push(commentMap.get(comment.id)!);
        }
      } else {
        topLevelComments.push(commentMap.get(comment.id)!);
      }
    });

    return topLevelComments;
  };

  const renderComment = (comment: Comment, level: number = 0) => (
    <div key={comment.id} className={`${level > 0 ? 'ml-8 mt-2' : ''}`}>
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              <div className="bg-gray-700 rounded-full p-2">
                <User className="h-4 w-4 text-gray-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-white">{comment.author}</span>
                  <span className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                  </span>
                  {comment.isEdited && (
                    <span className="text-xs text-gray-500">(edited)</span>
                  )}
                </div>
                {editingCommentId === comment.id ? (
                  <div className="mt-2 space-y-2">
                    <Textarea
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                      rows={3}
                    />
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={handleUpdateComment}
                        className="bg-blue-600 text-white hover:bg-blue-700"
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingCommentId(null);
                          setEditingContent("");
                        }}
                        className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-1 text-gray-300 whitespace-pre-wrap">{comment.content}</p>
                )}
                {comment.attachments && comment.attachments.length > 0 && (
                  <div className="mt-2 flex items-center space-x-2">
                    <Paperclip className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-400">
                      {comment.attachments.length} attachment{comment.attachments.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>
            </div>
            {!editingCommentId && comment.author === user?.username && (
              <div className="flex items-center space-x-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleEditComment(comment)}
                  className="text-gray-400 hover:text-white"
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setDeletingCommentId(comment.id)}
                  className="text-gray-400 hover:text-red-400"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
          {!editingCommentId && level === 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setReplyingToId(comment.id);
                setNewComment(`@${comment.author} `);
              }}
              className="mt-2 text-gray-400 hover:text-white"
            >
              <Reply className="h-3 w-3 mr-1" />
              Reply
            </Button>
          )}
        </CardContent>
      </Card>
      {comment.replies && comment.replies.map(reply => renderComment(reply, level + 1))}
    </div>
  );

  if (isLoading) {
    return <div className="text-center py-8 text-gray-400">Loading conversation...</div>;
  }

  if (!conversation) {
    return <div className="text-center py-8 text-gray-400">Conversation not found</div>;
  }

  const organizedComments = organizeComments(conversation.comments || []);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="space-y-4 pb-4">
        <div>
          <h2 className="text-2xl font-semibold text-white">{conversation.title}</h2>
          {conversation.description && (
            <p className="text-gray-400 mt-1">{conversation.description}</p>
          )}
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <Badge className={`status-badge ${getStatusColor(conversation.status)} inline-flex items-center gap-1`}>
              {getStatusIcon(conversation.status)}
              {conversation.status}
            </Badge>
            <Badge className={getPriorityColor(conversation.priority)}>
              {conversation.priority} priority
            </Badge>
          </div>

          <div className="flex items-center space-x-4 text-sm text-gray-400">
            <div className="flex items-center space-x-1">
              <User className="h-3 w-3" />
              <span>Created by {conversation.createdBy}</span>
            </div>
            {conversation.assignedTo && (
              <div className="flex items-center space-x-1">
                <User className="h-3 w-3" />
                <span>Assigned to {conversation.assignedTo}</span>
              </div>
            )}
            <div className="flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>{format(new Date(conversation.createdAt), 'MMM d, yyyy')}</span>
            </div>
          </div>
        </div>

        {/* Linked Entities */}
        {conversation.links && conversation.links.length > 0 && (
          <div className="flex items-center space-x-2">
            <LinkIcon className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-400">Linked to:</span>
            <div className="flex flex-wrap gap-2">
              {conversation.links.map((link: any, index: number) => {
                let displayName = link.entityName || `${link.entityType} #${link.entityId}`;
                let badgeClass = "bg-gray-700 text-gray-300";
                
                // Add specific colors for different entity types
                switch (link.entityType) {
                  case 'application':
                    badgeClass = "bg-blue-700 text-blue-100";
                    break;
                  case 'interface':
                    badgeClass = "bg-green-700 text-green-100";
                    break;
                  case 'business_process':
                    badgeClass = "bg-purple-700 text-purple-100";
                    break;
                  case 'change_request':
                    badgeClass = "bg-orange-700 text-orange-100";
                    break;
                }
                
                return (
                  <Badge 
                    key={index} 
                    className={badgeClass}
                    title={link.entityDetails?.description || link.entityDetails?.title || ''}
                  >
                    {displayName}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        {/* Participants */}
        {conversation.participants && conversation.participants.length > 0 && (
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-400">Participants:</span>
            <div className="flex flex-wrap gap-2">
              {conversation.participants.map((participant: any, index: number) => (
                <Badge key={index} className="bg-gray-700 text-gray-300">
                  {participant.participantName}
                  {participant.participantRole && ` (${participant.participantRole})`}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      <Separator className="bg-gray-700" />

      {/* Comments Section */}
      <div className="flex-1 flex flex-col mt-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <MessageSquare className="mr-2 h-5 w-5" />
            Comments ({conversation.comments?.length || 0})
          </h3>
        </div>

        {/* Comments List */}
        <ScrollArea className="flex-1 pr-4 mb-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {organizedComments.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                No comments yet. Start the conversation!
              </div>
            ) : (
              organizedComments.map(comment => renderComment(comment))
            )}
          </div>
        </ScrollArea>

        {/* New Comment Input */}
        <div className="space-y-2">
          {replyingToId && (
            <div className="flex items-center justify-between bg-gray-700 p-2 rounded">
              <span className="text-sm text-gray-300">
                Replying to comment...
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setReplyingToId(null);
                  setNewComment("");
                }}
                className="text-gray-400 hover:text-white"
              >
                Cancel
              </Button>
            </div>
          )}
          <div className="flex space-x-2">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Type your comment..."
              className="flex-1 bg-gray-700 border-gray-600 text-white"
              rows={3}
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.ctrlKey) {
                  handleSendComment();
                }
              }}
            />
            <Button
              onClick={handleSendComment}
              disabled={!newComment.trim() || addCommentMutation.isPending}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-gray-500">Press Ctrl+Enter to send</p>
        </div>
      </div>

      {/* Delete Comment Confirmation */}
      <AlertDialog
        open={!!deletingCommentId}
        onOpenChange={(open) => !open && setDeletingCommentId(null)}
      >
        <AlertDialogContent className="bg-gray-800 border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Comment</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to delete this comment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingCommentId && handleDeleteComment(deletingCommentId)}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}