import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMultiSelect } from "@/hooks/use-multi-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useToast } from "@/hooks/use-toast";
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
import { DataFilter, FilterCondition, FilterColumn, applyFilters } from "@/components/ui/data-filter";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { 
  Plus, 
  Search, 
  Edit, 
  Eye, 
  Trash2,
  MessageSquare,
  Users,
  Clock,
  Link as LinkIcon,
  AlertCircle,
  CheckCircle,
  XCircle,
  Timer
} from "lucide-react";
import { Link } from "wouter";
import ConversationForm from "@/components/communications/conversation-form";
import ConversationDetail from "@/components/communications/conversation-detail";
import { format } from "date-fns";

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

export default function Communications() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingConversation, setEditingConversation] = useState<Conversation | null>(null);
  const [viewingConversation, setViewingConversation] = useState<Conversation | null>(null);
  const [deletingConversation, setDeletingConversation] = useState<Conversation | null>(null);
  const [filters, setFilters] = useState<FilterCondition[]>([]);

  const { data: conversations, isLoading } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations"],
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/conversations/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete conversation");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      toast({
        title: "Success",
        description: "Conversation deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete conversation",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open': return 'bg-blue-600 text-white';
      case 'resolved': return 'bg-green-600 text-white';
      case 'pending': return 'bg-yellow-600 text-white';
      case 'closed': return 'bg-gray-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open': return <AlertCircle className="h-3 w-3" />;
      case 'resolved': return <CheckCircle className="h-3 w-3" />;
      case 'pending': return <Timer className="h-3 w-3" />;
      case 'closed': return <XCircle className="h-3 w-3" />;
      default: return null;
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

  const filterColumns: FilterColumn[] = [
    { key: "title", label: "Title" },
    { key: "status", label: "Status", type: "select", options: [
      { value: "open", label: "Open" },
      { value: "resolved", label: "Resolved" },
      { value: "pending", label: "Pending" },
      { value: "closed", label: "Closed" }
    ]},
    { key: "priority", label: "Priority", type: "select", options: [
      { value: "low", label: "Low" },
      { value: "medium", label: "Medium" },
      { value: "high", label: "High" },
      { value: "critical", label: "Critical" }
    ]},
    { key: "createdBy", label: "Created By" },
    { key: "assignedTo", label: "Assigned To" }
  ];

  // Apply filters first
  const filteredByConditions = conversations ? applyFilters(conversations, filters) : [];

  // Then apply search
  const filteredConversations = filteredByConditions.filter(conversation => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      conversation.title?.toLowerCase().includes(searchLower) ||
      conversation.description?.toLowerCase().includes(searchLower) ||
      conversation.createdBy?.toLowerCase().includes(searchLower) ||
      conversation.assignedTo?.toLowerCase().includes(searchLower)
    );
  });

  // Initialize multi-select hook after filteredConversations is defined
  const multiSelect = useMultiSelect({
    items: filteredConversations,
    getItemId: (conversation) => conversation.id,
  });

  const formatLinkedEntities = (links: any[]) => {
    if (!links || links.length === 0) return "None";
    
    return links.map((link, index) => {
      const displayName = link.entityName || `${link.entityType || 'Unknown'} #${link.entityId}`;
      const shortType = link.entityType ? 
        link.entityType.split('_').map((word: string) => word[0]).join('').toUpperCase() : 
        'UNK';
      
      return (
        <span key={index} className="text-xs">
          {shortType}: {displayName}
        </span>
      );
    }).reduce((prev, curr, i) => i === 0 ? [curr] : [...prev, " • ", curr], [] as any[]);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <nav className="flex" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-2 text-sm text-gray-400">
                <li><Link href="/" className="hover:text-gray-200">Home</Link></li>
                <li className="flex items-center">
                  <span className="mx-2">/</span>
                  <span className="text-white font-medium">Communications</span>
                </li>
              </ol>
            </nav>
            <h1 className="text-2xl font-semibold text-white mt-1">Communications Management</h1>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              onClick={() => window.location.href = '/communications/timeline'}
              variant="outline"
              className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600"
            >
              <Clock className="mr-2" size={16} />
              Timeline View
            </Button>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 text-white hover:bg-blue-700">
                  <Plus className="mr-2" size={16} />
                  New Conversation
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-800 border-gray-700">
                <ConversationForm onSuccess={() => setIsCreateDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Bulk Actions Toolbar */}
      {multiSelect.selectedItems.length > 0 && (
        <div className="flex-shrink-0 bg-gray-800 border-b border-gray-700 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-gray-300">
                {multiSelect.selectedItems.length} conversation{multiSelect.selectedItems.length > 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const selectedIds = multiSelect.selectedItems.map(conversation => conversation.id);
                  selectedIds.forEach(id => deleteMutation.mutate(id));
                  multiSelect.clearSelection();
                }}
                className="border-red-600 text-red-400 hover:bg-red-900/20"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => multiSelect.clearSelection()}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Clear Selection
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        {/* Search and Filter Bar */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-80 pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="text-gray-400" size={16} />
              </div>
            </div>
            <DataFilter
              columns={filterColumns}
              filters={filters}
              onFiltersChange={setFilters}
            />
          </div>
        </div>

        {/* Conversations Table */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-gray-400">Loading conversations...</div>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 text-center py-12">
            <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No conversations found</h3>
            <p className="text-gray-400 mb-4">
              {searchTerm ? "No conversations match your search criteria." : "Get started by creating your first conversation."}
            </p>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 text-white hover:bg-blue-700">
                  <Plus className="mr-2" size={16} />
                  Create Conversation
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-800 border-gray-700">
                <ConversationForm onSuccess={() => setIsCreateDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="w-12">
                    <Checkbox
                      checked={filteredConversations.length > 0 && multiSelect.selectedItems.length === filteredConversations.length}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          multiSelect.selectAll();
                        } else {
                          multiSelect.clearSelection();
                        }
                      }}
                      aria-label="Select all conversations"
                    />
                  </TableHead>
                  <TableHead className="w-[300px] text-gray-300">Title</TableHead>
                  <TableHead className="w-[100px] text-gray-300">Status</TableHead>
                  <TableHead className="w-[100px] text-gray-300">Priority</TableHead>
                  <TableHead className="w-[150px] text-gray-300">Created By</TableHead>
                  <TableHead className="w-[150px] text-gray-300">Assigned To</TableHead>
                  <TableHead className="w-[200px] text-gray-300">Linked Entities</TableHead>
                  <TableHead className="w-[120px] text-gray-300">Last Updated</TableHead>
                  <TableHead className="w-[80px] text-gray-300">Participants</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredConversations.map((conversation) => (
                  <ContextMenu key={conversation.id}>
                    <ContextMenuTrigger asChild>
                      <TableRow 
                        className={`border-gray-700 hover:bg-gray-700/50 cursor-context-menu ${multiSelect.isSelected(conversation) ? 'bg-blue-900/20' : ''}`}
                        onDoubleClick={() => setViewingConversation(conversation)}
                        title="Double-click to view conversation details"
                      >
                        <TableCell className="w-12">
                          <Checkbox
                            checked={multiSelect.isSelected(conversation)}
                            onCheckedChange={() => multiSelect.toggleSelection(conversation)}
                            onClick={(e) => e.stopPropagation()}
                            aria-label={`Select conversation ${conversation.title}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium text-white">
                          <div className="flex items-start space-x-2">
                            <MessageSquare className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div className="min-w-0">
                              <div className="truncate">{conversation.title}</div>
                              {conversation.description && (
                                <div className="text-xs text-gray-400 truncate">{conversation.description}</div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`status-badge ${getStatusColor(conversation.status)} inline-flex items-center gap-1`}>
                            {getStatusIcon(conversation.status)}
                            {conversation.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getPriorityColor(conversation.priority)}>
                            {conversation.priority}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-300">{conversation.createdBy}</TableCell>
                        <TableCell className="text-gray-300">{conversation.assignedTo || '-'}</TableCell>
                        <TableCell className="text-gray-300">
                          <div className="flex items-center space-x-1">
                            {conversation.links && conversation.links.length > 0 && (
                              <LinkIcon className="h-3 w-3 text-gray-400 mr-1" />
                            )}
                            <span className="text-xs">{formatLinkedEntities(conversation.links)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-300">
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3 text-gray-400" />
                            <span className="text-xs">{format(new Date(conversation.updatedAt), 'MMM d, HH:mm')}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Users className="h-3 w-3 text-gray-400" />
                            <span className="text-gray-300">{conversation.participants?.length || 0}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      <ContextMenuItem onClick={() => setEditingConversation(conversation)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </ContextMenuItem>
                      <ContextMenuItem onClick={() => setViewingConversation(conversation)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </ContextMenuItem>
                      <ContextMenuSeparator />
                      <ContextMenuItem
                        onClick={() => setDeletingConversation(conversation)}
                        className="text-red-400 focus:text-red-300"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        {filteredConversations.length > 0 && (
          <div className="mt-8 text-center text-sm text-gray-400">
            Showing {filteredConversations.length} conversation{filteredConversations.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Edit Conversation Dialog */}
      <Dialog open={!!editingConversation} onOpenChange={(open) => !open && setEditingConversation(null)}>
        <DialogContent className="max-w-4xl bg-gray-800 border-gray-700 max-h-[90vh] overflow-y-auto">
          {editingConversation && (
            <ConversationForm 
              conversation={editingConversation}
              onSuccess={() => {
                setEditingConversation(null);
                queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
              }} 
            />
          )}
        </DialogContent>
      </Dialog>

      {/* View Conversation Details Dialog */}
      <Dialog open={!!viewingConversation} onOpenChange={(open) => !open && setViewingConversation(null)}>
        <DialogContent className="max-w-5xl bg-gray-800 border-gray-700 max-h-[90vh] overflow-y-auto">
          {viewingConversation && (
            <ConversationDetail conversationId={viewingConversation.id} />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingConversation} onOpenChange={(open) => !open && setDeletingConversation(null)}>
        <AlertDialogContent className="bg-gray-800 border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              This will permanently delete the conversation "{deletingConversation?.title}" and all its comments. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingConversation) {
                  deleteMutation.mutate(deletingConversation.id);
                  setDeletingConversation(null);
                }
              }}
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