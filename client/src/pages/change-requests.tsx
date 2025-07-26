import { useState } from "react";
import { usePersistentFilters } from "@/hooks/use-persistent-filters";
import { useTableExplorerMode } from "@/hooks/use-view-mode";
import { usePermissions } from "@/hooks/use-permissions";
import { useMultiSelect } from "@/hooks/use-multi-select";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
  GitBranch,
  Calendar,
  User,
  MoreVertical,
  Info,
  Trash2,
  FileJson,
  Copy,
  Grid3x3,
  TableIcon
} from "lucide-react";
import { Link } from "wouter";
import ChangeRequestFormEnhanced from "@/components/changes/change-request-form-enhanced";
import ChangeRequestImpactsView from "@/components/changes/change-request-impacts-view";
import { ImportExportDialog } from "@/components/import-export-dialog";
import { MultiSelectTable } from "@/components/ui/multi-select-table";
import { BulkActionBar } from "@/components/ui/bulk-action-bar";
import { BulkEditDialog, type BulkEditField } from "@/components/bulk-edit-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CommunicationBadge from "@/components/communications/communication-badge";
import { useCommunicationCounts } from "@/hooks/use-communication-counts";
import ChangeRequestCardView from "@/components/changes/change-request-card-view";

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

export default function ChangeRequests() {
  const {
    searchTerm,
    filters,
    updateSearchTerm,
    updateFilters,
    clearAllFilters,
    hasActiveFilters
  } = usePersistentFilters('change-requests');
  
  const { viewMode, setViewMode } = useTableExplorerMode('change-requests', 'table');
  const { canCreate, canUpdate, canDelete } = usePermissions();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCR, setEditingCR] = useState<ChangeRequest | null>(null);
  const [viewingCR, setViewingCR] = useState<ChangeRequest | null>(null);
  const [deletingCR, setDeletingCR] = useState<ChangeRequest | null>(null);
  const [duplicatingCR, setDuplicatingCR] = useState<ChangeRequest | null>(null);
  const [showImportExport, setShowImportExport] = useState(false);
  const [showBulkEditDialog, setShowBulkEditDialog] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  const { data: changeRequests, isLoading } = useQuery<ChangeRequest[]>({
    queryKey: ["/api/change-requests"],
  });

  // Fetch communication counts for all change requests
  const changeRequestIds = changeRequests?.map(cr => cr.id) || [];
  const { data: communicationCounts } = useCommunicationCounts("change_request", changeRequestIds);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/change-requests/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete change request");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/change-requests"] });
      toast({
        title: "Success",
        description: "Change request deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete change request",
        variant: "destructive",
      });
    },
  });

  const handleDuplicateAndEdit = (cr: ChangeRequest) => {
    const duplicatedCR = {
      ...cr,
      id: 0, // New change request will get a new ID
      crNumber: `${cr.crNumber}-Copy`,
      title: `${cr.title} (Copy)`,
      status: 'draft',
      createdAt: new Date().toISOString().split('T')[0],
      targetDate: '',
      completedDate: '',
      approvedBy: ''
    };
    setDuplicatingCR(duplicatedCR);
  };

  // Bulk operations mutations
  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ ids, updates }: { ids: number[]; updates: Record<string, any> }) => {
      const response = await fetch("/api/change-requests/bulk-update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, updates }),
      });
      if (!response.ok) throw new Error("Failed to update change requests");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/change-requests"] });
      toast({
        title: "Success",
        description: data.message,
      });
      multiSelect.clearSelection();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update change requests",
        variant: "destructive",
      });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      const response = await fetch("/api/change-requests/bulk-delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (!response.ok) throw new Error("Failed to delete change requests");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/change-requests"] });
      toast({
        title: "Success",
        description: data.message,
      });
      multiSelect.clearSelection();
      setShowBulkDeleteConfirm(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete change requests",
        variant: "destructive",
      });
    },
  });

  const handleBulkEdit = () => {
    setShowBulkEditDialog(true);
  };

  const handleBulkDelete = () => {
    setShowBulkDeleteConfirm(true);
  };

  // Filter and search data first
  const hasCommunicationsFilter = filters.find(f => f.column === 'hasCommunications');
  const otherFilters = filters.filter(f => f.column !== 'hasCommunications');

  // Apply standard filters first
  let filteredByConditions = changeRequests ? applyFilters(changeRequests, otherFilters) : [];

  // Then apply custom hasCommunications filter if present
  if (hasCommunicationsFilter && communicationCounts) {
    filteredByConditions = filteredByConditions.filter(cr => {
      const communicationCount = communicationCounts.get(cr.id) ?? 0;
      if (hasCommunicationsFilter.value === 'yes') {
        return communicationCount > 0;
      } else if (hasCommunicationsFilter.value === 'no') {
        return communicationCount === 0;
      }
      return true;
    });
  }

  // Then apply search
  const filteredChangeRequests = filteredByConditions.filter(cr => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      cr.crNumber?.toLowerCase().includes(searchLower) ||
      cr.title?.toLowerCase().includes(searchLower) ||
      cr.description?.toLowerCase().includes(searchLower) ||
      cr.owner?.toLowerCase().includes(searchLower) ||
      cr.status?.toLowerCase().includes(searchLower) ||
      cr.priority?.toLowerCase().includes(searchLower) ||
      cr.benefit?.toLowerCase().includes(searchLower)
    );
  });

  // Initialize multi-select hook with filtered data
  const multiSelect = useMultiSelect({
    items: filteredChangeRequests,
    getItemId: (cr) => cr.id,
  });

  const handleBulkUpdate = (updates: Record<string, any>) => {
    const ids = multiSelect.selectedItems.map(cr => cr.id);
    bulkUpdateMutation.mutate({ ids, updates });
  };

  const handleViewImpacts = (crId: number) => {
    const cr = changeRequests?.find(c => c.id === crId);
    if (cr) {
      setViewingCR(cr);
    }
  };

  // Prepare bulk edit fields
  const bulkEditFields: BulkEditField[] = [
    {
      key: "status",
      label: "Status",
      type: "select",
      options: [
        { value: "draft", label: "Draft" },
        { value: "submitted", label: "Submitted" },
        { value: "under_review", label: "Under Review" },
        { value: "approved", label: "Approved" },
        { value: "rejected", label: "Rejected" },
        { value: "in_progress", label: "In Progress" },
        { value: "completed", label: "Completed" },
        { value: "cancelled", label: "Cancelled" },
      ],
      currentValues: new Set(multiSelect.selectedItems.map(cr => cr.status)),
    },
    {
      key: "priority",
      label: "Priority",
      type: "select",
      options: [
        { value: "low", label: "Low" },
        { value: "medium", label: "Medium" },
        { value: "high", label: "High" },
        { value: "critical", label: "Critical" },
      ],
      currentValues: new Set(multiSelect.selectedItems.map(cr => cr.priority)),
    },
    {
      key: "owner",
      label: "Owner",
      type: "text",
      currentValues: new Set(multiSelect.selectedItems.map(cr => cr.owner)),
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'new': return 'bg-purple-600 text-white';
      case 'draft': return 'bg-gray-600 text-white';
      case 'submitted': return 'bg-blue-600 text-white';
      case 'under_review': return 'status-under-review';
      case 'approved': return 'bg-green-600 text-white';
      case 'in_progress': return 'status-in-progress';
      case 'completed': return 'status-completed';
      case 'rejected': return 'bg-red-600 text-white';
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

  const filterColumns: FilterColumn[] = [
    { key: "crNumber", label: "CR Number" },
    { key: "title", label: "Title" },
    { key: "status", label: "Status", type: "select", options: [
      { value: "new", label: "New" },
      { value: "draft", label: "Draft" },
      { value: "submitted", label: "Submitted" },
      { value: "under_review", label: "Under Review" },
      { value: "approved", label: "Approved" },
      { value: "rejected", label: "Rejected" },
      { value: "in_progress", label: "In Progress" },
      { value: "completed", label: "Completed" },
      { value: "cancelled", label: "Cancelled" }
    ]},
    { key: "priority", label: "Priority", type: "select", options: [
      { value: "low", label: "Low" },
      { value: "medium", label: "Medium" },
      { value: "high", label: "High" },
      { value: "critical", label: "Critical" }
    ]},
    { key: "owner", label: "Owner" },
    { key: "requestedBy", label: "Requested By" },
    { key: "approvedBy", label: "Approved By" },
    { key: "hasCommunications", label: "Has Communications", type: "select", options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" }
    ]}
  ];


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
                  <span className="text-white font-medium">Change Requests</span>
                </li>
              </ol>
            </nav>
            <h1 className="text-2xl font-semibold text-white mt-1">Change Requests Management</h1>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              onClick={() => setShowImportExport(true)}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              <FileJson className="mr-2" size={16} />
              Import/Export
            </Button>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 text-white hover:bg-blue-700">
                  <Plus className="mr-2" size={16} />
                  New Change Request
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl bg-gray-800 border-gray-700">
                <ChangeRequestFormEnhanced onSuccess={() => setIsCreateDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        {/* Search and Filter Bar */}
        <div className="mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search change requests..."
                  value={searchTerm}
                  onChange={(e) => updateSearchTerm(e.target.value)}
                  className="w-80 pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="text-gray-400" size={16} />
                </div>
              </div>
              <DataFilter
                columns={filterColumns}
                filters={filters}
                onFiltersChange={updateFilters}
                onClearAllFilters={clearAllFilters}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "table" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("table")}
                title="Table View"
              >
                <TableIcon className="h-4 w-4 mr-2" />
                Table
              </Button>
              <Button
                variant={viewMode === "explorer" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("explorer")}
                title="Card View"
              >
                <Grid3x3 className="h-4 w-4 mr-2" />
                Cards
              </Button>
            </div>
          </div>
          {hasActiveFilters() && (
            <div className="flex items-center gap-2 text-sm text-blue-400">
              <Info className="h-4 w-4" />
              <span>Filters are active - results are filtered. {searchTerm && `Search: "${searchTerm}"`}</span>
            </div>
          )}
        </div>

        {/* Bulk Action Bar */}
        {canUpdate('change-requests') && (
          <BulkActionBar
            selectedCount={multiSelect.selectedCount}
            totalCount={filteredChangeRequests.length}
            onBulkEdit={handleBulkEdit}
            onBulkDelete={canDelete('change-requests') ? handleBulkDelete : undefined}
            onClearSelection={multiSelect.clearSelection}
            onSelectAll={multiSelect.selectAll}
            onInvertSelection={multiSelect.invertSelection}
          />
        )}

        {/* Change Requests Table */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-gray-400">Loading change requests...</div>
          </div>
        ) : filteredChangeRequests.length === 0 ? (
          <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 text-center py-12">
            <GitBranch className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No change requests found</h3>
            <p className="text-gray-400 mb-4">
              {searchTerm ? "No change requests match your search criteria." : "Get started by creating your first change request."}
            </p>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 text-white hover:bg-blue-700">
                  <Plus className="mr-2" size={16} />
                  Create Change Request
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl bg-gray-800 border-gray-700">
                <ChangeRequestFormEnhanced onSuccess={() => setIsCreateDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
        ) : viewMode === "explorer" ? (
          <ChangeRequestCardView
            changeRequests={filteredChangeRequests}
            onView={setViewingCR}
            onEdit={canUpdate('change-requests') ? setEditingCR : undefined}
            onDelete={canDelete('change-requests') ? setDeletingCR : undefined}
            onViewImpacts={(cr) => handleViewImpacts(cr.id)}
            isLoading={isLoading}
          />
        ) : (
          <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700">
            <MultiSelectTable
              items={filteredChangeRequests}
              selectedIds={multiSelect.selectedIds}
              getItemId={(cr) => cr.id}
              onToggleSelection={multiSelect.toggleSelection}
              onToggleAll={multiSelect.toggleAll}
              onRangeSelect={multiSelect.selectRange}
              isAllSelected={multiSelect.isAllSelected}
              isSomeSelected={multiSelect.isSomeSelected}
              onRowDoubleClick={(cr) => setViewingCR(cr)}
              headers={
                <>
                  <TableHead className="w-[120px] text-gray-300">CR Number</TableHead>
                  <TableHead className="w-[250px] text-gray-300">Title</TableHead>
                  <TableHead className="w-[100px] text-gray-300">Status</TableHead>
                  <TableHead className="w-[100px] text-gray-300">Priority</TableHead>
                  <TableHead className="w-[120px] text-gray-300">Owner</TableHead>
                  <TableHead className="w-[120px] text-gray-300">Requested By</TableHead>
                  <TableHead className="w-[100px] text-gray-300">Communications</TableHead>
                  <TableHead className="w-[120px] text-gray-300">Target Date</TableHead>
                </>
              }
              renderContextMenu={(cr, rowContent) => (
                <ContextMenu>
                  <ContextMenuTrigger asChild>
                    {rowContent}
                  </ContextMenuTrigger>
                  <ContextMenuContent className="bg-gray-800 border-gray-700">
                    <ContextMenuItem 
                      onClick={() => setViewingCR(cr)}
                      className="text-gray-300 hover:bg-gray-700 focus:bg-gray-700"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </ContextMenuItem>
                    <ContextMenuItem 
                      onClick={() => setEditingCR(cr)}
                      className="text-gray-300 hover:bg-gray-700 focus:bg-gray-700"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </ContextMenuItem>
                    <ContextMenuItem 
                      onClick={() => handleDuplicateAndEdit(cr)}
                      className="text-gray-300 hover:bg-gray-700 focus:bg-gray-700"
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Duplicate and Edit
                    </ContextMenuItem>
                    <ContextMenuSeparator className="bg-gray-600" />
                    <ContextMenuItem
                      onClick={() => setDeletingCR(cr)}
                      className="text-red-400 hover:bg-gray-700 focus:bg-gray-700"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              )}
            >
              {(cr) => (
                <>
                  <TableCell className="font-medium text-white">
                    <div className="flex items-center space-x-2">
                      <GitBranch className="h-4 w-4 text-orange-600" />
                      <span>{cr.crNumber}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="text-left">
                          <span className="line-clamp-1 text-gray-300">{cr.title}</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">{cr.title}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell>
                    <Badge className={`status-badge ${getStatusColor(cr.status)}`}>
                      {cr.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getPriorityColor(cr.priority)}>
                      {cr.priority}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-300">{cr.owner}</TableCell>
                  <TableCell className="text-gray-300">{cr.requestedBy}</TableCell>
                  <TableCell>
                    <CommunicationBadge 
                      entityType="change_request" 
                      entityId={cr.id} 
                      entityName={cr.crNumber}
                    />
                  </TableCell>
                  <TableCell className="text-gray-300">{cr.targetDate ? new Date(cr.targetDate).toLocaleDateString() : 'N/A'}</TableCell>
                </>
              )}
            </MultiSelectTable>
          </div>
        )}

        {/* Pagination */}
        {filteredChangeRequests.length > 0 && (
          <div className="mt-8 text-center text-sm text-gray-400">
            Showing {filteredChangeRequests.length} change request{filteredChangeRequests.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Edit Change Request Dialog */}
      <Dialog open={!!editingCR} onOpenChange={(open) => !open && setEditingCR(null)}>
        <DialogContent className="max-w-5xl bg-gray-800 border-gray-700 max-h-[90vh] overflow-y-auto">
          <ChangeRequestFormEnhanced 
            changeRequest={editingCR!} 
            onSuccess={() => {
              setEditingCR(null);
              queryClient.invalidateQueries({ queryKey: ["/api/change-requests"] });
            }} 
            isEditing={true}
          />
        </DialogContent>
      </Dialog>

      {/* View Change Request Details Dialog */}
      <Dialog open={!!viewingCR} onOpenChange={(open) => !open && setViewingCR(null)}>
        <DialogContent className="max-w-3xl bg-gray-800 border-gray-700 max-h-[80vh] overflow-y-auto">
          <div className="space-y-4">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-white">{viewingCR?.crNumber}</h2>
              <p className="text-gray-400">{viewingCR?.title}</p>
            </div>
            
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="general">General Information</TabsTrigger>
                <TabsTrigger value="impacts">Impacts</TabsTrigger>
              </TabsList>
              
              <TabsContent value="general" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-300 mb-1">Status Information</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-400">Status:</span>
                          <Badge className={`status-badge ${getStatusColor(viewingCR?.status || '')}`}>
                            {viewingCR?.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-400">Priority:</span>
                          <Badge className={getPriorityColor(viewingCR?.priority || '')}>
                            {viewingCR?.priority}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-semibold text-gray-300 mb-1">People</h3>
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm text-gray-400">Owner:</span>
                          <p className="text-sm font-medium text-white">{viewingCR?.owner}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-400">Requested By:</span>
                          <p className="text-sm font-medium text-white">{viewingCR?.requestedBy}</p>
                        </div>
                        {viewingCR?.approvedBy && (
                          <div>
                            <span className="text-sm text-gray-400">Approved By:</span>
                            <p className="text-sm font-medium text-white">{viewingCR.approvedBy}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-300 mb-1">Dates</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-400">Created:</span>
                          <span className="text-sm font-medium text-white">
                            {viewingCR?.createdAt ? new Date(viewingCR.createdAt).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                        {viewingCR?.targetDate && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-400">Target:</span>
                            <span className="text-sm font-medium text-white">
                              {new Date(viewingCR.targetDate).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        {viewingCR?.completedDate && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-400">Completed:</span>
                            <span className="text-sm font-medium text-white">
                              {new Date(viewingCR.completedDate).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {viewingCR?.description && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-300 mb-1">Description</h3>
                    <p className="text-sm text-gray-400">{viewingCR.description}</p>
                  </div>
                )}
                
                {viewingCR?.reason && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-300 mb-1">Reason for Change</h3>
                    <p className="text-sm text-gray-400">{viewingCR.reason}</p>
                  </div>
                )}
                
                {viewingCR?.benefit && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-300 mb-1">Expected Benefit</h3>
                    <p className="text-sm text-gray-400">{viewingCR.benefit}</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="impacts" className="mt-4">
                {viewingCR && <ChangeRequestImpactsView changeRequestId={viewingCR.id} />}
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingCR} onOpenChange={(open) => !open && setDeletingCR(null)}>
        <AlertDialogContent className="bg-gray-800 border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              This will permanently delete the change request "{deletingCR?.crNumber}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingCR) {
                  deleteMutation.mutate(deletingCR.id);
                  setDeletingCR(null);
                }
              }}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Duplicate and Edit Change Request Dialog */}
      <Dialog open={!!duplicatingCR} onOpenChange={(open) => !open && setDuplicatingCR(null)}>
        <DialogContent className="max-w-5xl bg-gray-800 border-gray-700 max-h-[90vh] overflow-y-auto">
          {duplicatingCR && (
            <ChangeRequestFormEnhanced 
              changeRequest={duplicatingCR} 
              onSuccess={() => {
                setDuplicatingCR(null);
                queryClient.invalidateQueries({ queryKey: ["/api/change-requests"] });
              }} 
              isEditing={false}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Import/Export Dialog */}
      <ImportExportDialog
        open={showImportExport}
        onOpenChange={setShowImportExport}
        entity="change-requests"
        entityName="Change Requests"
        onImportSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["/api/change-requests"] });
        }}
      />

      {/* Bulk Edit Dialog */}
      <BulkEditDialog
        open={showBulkEditDialog}
        onOpenChange={setShowBulkEditDialog}
        selectedCount={multiSelect.selectedCount}
        fields={bulkEditFields}
        onSubmit={handleBulkUpdate}
        entityName="Change Requests"
      />

      {/* Bulk Delete Confirmation */}
      <AlertDialog open={showBulkDeleteConfirm} onOpenChange={setShowBulkDeleteConfirm}>
        <AlertDialogContent className="bg-gray-800 border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete {multiSelect.selectedCount} Change Requests?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              This will permanently delete {multiSelect.selectedCount} selected change requests. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const ids = multiSelect.selectedItems.map(cr => cr.id);
                bulkDeleteMutation.mutate(ids);
              }}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
