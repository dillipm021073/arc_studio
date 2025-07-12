import { useState, useEffect } from "react";
import { usePersistentFilters } from "@/hooks/use-persistent-filters";
import { useCommunicationCounts } from "@/hooks/use-communication-counts";
import { usePermissions } from "@/hooks/use-permissions";
import { useMultiSelect } from "@/hooks/use-multi-select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useInitiative } from "@/components/initiatives/initiative-context";
import { api } from "@/lib/api";
import { Plus, Search, Edit, Trash2, Network, MoreVertical, Info, FileJson, Copy, Eye, TableIcon, UserPlus, FileDown, ChevronDown, Layers, GitBranch, Lock, Unlock, AlertTriangle , X} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import BusinessProcessForm from "@/components/business-processes/business-process-form";
import ChildBusinessProcessForm from "@/components/business-processes/child-business-process-form";
import HierarchyHtmlEditor from "@/components/business-processes/hierarchy-html-editor";
import HierarchyDesignsList from "@/components/business-processes/hierarchy-designs-list";
import BusinessProcessTreeView from "@/components/business-processes/business-process-tree-view";
import BusinessProcessTreeViewDnd from "@/components/business-processes/business-process-tree-view-dnd";
import { DataFilter, FilterCondition, FilterColumn, applyFilters } from "@/components/ui/data-filter";
import CommunicationBadge from "@/components/communications/communication-badge";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { ImportExportDialog } from "@/components/import-export-dialog";
import { ViewModeIndicator } from "@/components/initiatives/view-mode-indicator";
import { 
  getArtifactState, 
  getRowClassName, 
  ArtifactState 
} from "@/lib/artifact-state-utils";
import { 
  ArtifactStatusBadge, 
  ArtifactStatusIndicator, 
  StatusColumn 
} from "@/components/ui/artifact-status-badge";

export default function BusinessProcesses() {
  const {
    searchTerm: search,
    filters,
    updateSearchTerm: setSearch,
    updateFilters: setFilters,
    clearAllFilters,
    hasActiveFilters
  } = usePersistentFilters('business-processes');
  
  const { canCreate, canUpdate, canDelete, isAdmin } = usePermissions();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingBP, setEditingBP] = useState<any>(null);
  const [viewingBP, setViewingBP] = useState<any>(null);
  const [deletingBP, setDeletingBP] = useState<any>(null);
  const [duplicatingBP, setDuplicatingBP] = useState<any>(null);
  const [showImportExport, setShowImportExport] = useState(false);
  const [bpParents, setBpParents] = useState<any[]>([]);
  const [bpChildren, setBpChildren] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<"table" | "hierarchy" | "tree">("table");
  const [deletionImpactMessage, setDeletionImpactMessage] = useState<string | null>(null);
  const [creatingChildForBP, setCreatingChildForBP] = useState<any>(null);
  const [showHierarchyDesigns, setShowHierarchyDesigns] = useState(false);
  const [selectedHierarchyDesign, setSelectedHierarchyDesign] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  // Initiative context
  const { currentInitiative, isProductionView } = useInitiative();

  const { data: businessProcesses = [], isLoading } = useQuery({
    queryKey: ["business-processes"],
    queryFn: async () => {
      const response = await fetch("/api/business-processes");
      if (!response.ok) throw new Error("Failed to fetch business processes");
      return response.json();
    },
  });

  // Fetch locks for version control
  const { data: locks } = useQuery({
    queryKey: ['version-control-locks', currentInitiative?.initiativeId],
    queryFn: async () => {
      if (!currentInitiative) return [];
      const response = await api.get(`/api/version-control/locks?initiativeId=${currentInitiative.initiativeId}`);
      return response.data;
    },
    enabled: !!currentInitiative && !isProductionView
  });

  // Fetch current user for version control
  const { data: currentUser } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: async () => {
      const response = await api.get('/api/auth/me');
      return response.data.user;
    }
  });

  // Fetch business process relationships for tree view
  const { data: relationships = [] } = useQuery({
    queryKey: ["business-process-relationships"],
    queryFn: async () => {
      const response = await fetch("/api/business-processes/relationships");
      if (!response.ok) throw new Error("Failed to fetch relationships");
      return response.json();
    },
    enabled: viewMode === "tree", // Only fetch when tree view is active
  });

  // Fetch communication counts for all business processes
  const businessProcessIds = businessProcesses?.map(bp => bp.id) || [];
  const { data: communicationCounts } = useCommunicationCounts("business_process", businessProcessIds);

  const deleteMutation = useMutation({
    mutationFn: async (bp: any) => {
      // First check deletion impact
      const impactResponse = await fetch(`/api/business-processes/${bp.id}/deletion-impact`);
      if (!impactResponse.ok) throw new Error("Failed to check deletion impact");
      
      const impact = await impactResponse.json();
      
      // If there will be orphaned children, update the confirmation message
      if (impact.orphanedChildren && impact.orphanedChildren.length > 0) {
        setDeletionImpactMessage(impact.message);
      }
      
      // Proceed with deletion
      const response = await fetch(`/api/business-processes/${bp.id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete business process");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-processes"] });
      queryClient.invalidateQueries({ queryKey: ["business-process-relationships"] });
      toast({
        title: "Success",
        description: "Business process deleted successfully",
      });
      setDeletionImpactMessage(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete business process",
        variant: "destructive",
      });
      setDeletionImpactMessage(null);
    },
  });

  const moveProcessMutation = useMutation({
    mutationFn: async ({ processId, newParentId, position }: { 
      processId: number; 
      newParentId: number | null; 
      position?: number 
    }) => {
      const response = await fetch(`/api/business-processes/${processId}/move`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newParentId, position }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to move business process");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-processes"] });
      queryClient.invalidateQueries({ queryKey: ["business-process-relationships"] });
      toast({
        title: "Success",
        description: "Business process moved successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to move business process",
        variant: "destructive",
      });
    },
  });

  // Version Control mutations
  const checkoutMutation = useMutation({
    mutationFn: async (bp: any) => {
      const response = await api.post('/api/version-control/checkout', {
        artifactType: 'business_process',
        artifactId: bp.id,
        initiativeId: currentInitiative?.initiativeId
      });
      return response.data;
    },
    onSuccess: (data, bp) => {
      queryClient.invalidateQueries({ queryKey: ['version-control-locks'] });
      toast({
        title: "Business process checked out",
        description: `${bp.businessProcess} is now locked for editing in ${currentInitiative?.name}`
      });
    },
    onError: (error: any) => {
      toast({
        title: "Checkout failed",
        description: error.response?.data?.error || "Failed to checkout business process",
        variant: "destructive"
      });
    }
  });

  const checkinMutation = useMutation({
    mutationFn: async ({ bp, changes }: { bp: any; changes: any }) => {
      const response = await api.post('/api/version-control/checkin', {
        artifactType: 'business_process',
        artifactId: bp.id,
        initiativeId: currentInitiative?.initiativeId,
        changes,
        changeDescription: `Updated ${bp.businessProcess} via UI`
      });
      return response.data;
    },
    onSuccess: (data, { bp }) => {
      queryClient.invalidateQueries({ queryKey: ['version-control-locks'] });
      queryClient.invalidateQueries({ queryKey: ['business-processes'] });
      toast({
        title: "Changes checked in",
        description: `${bp.businessProcess} has been updated in ${currentInitiative?.name}`
      });
      setEditingBP(null);
    },
    onError: (error: any) => {
      toast({
        title: "Checkin failed",
        description: error.response?.data?.error || "Failed to checkin changes",
        variant: "destructive"
      });
    }
  });

  const cancelCheckoutMutation = useMutation({
    mutationFn: async (bp: any) => {
      const response = await api.post('/api/version-control/cancel-checkout', {
        artifactType: 'business_process',
        artifactId: bp.id,
        initiativeId: currentInitiative?.initiativeId
      });
      return response.data;
    },
    onSuccess: (data, bp) => {
      queryClient.invalidateQueries({ queryKey: ['version-control-locks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/business-processs'] });
      toast({
        title: "Checkout cancelled",
        description: `${bp.businessProcess} checkout has been cancelled and changes discarded`
      });
    },
    onError: (error: any) => {
      toast({
        title: "Cancel checkout failed",
        description: error.response?.data?.error || "Failed to cancel checkout",
        variant: "destructive"
      });
    }
  });

  // Helper to check if a business process is locked
  const isBusinessProcessLocked = (bpId: number) => {
    if (!locks) return null;
    return locks.find((l: any) => 
      l.lock.artifactType === 'business_process' && 
      l.lock.artifactId === bpId
    );
  };

  // Helper to get business process state for visual indicators
  const getBusinessProcessState = (bp: any): ArtifactState => {
    const lock = isBusinessProcessLocked(bp.id);
    // TODO: Add logic to detect initiative changes and conflicts
    const hasInitiativeChanges = false; // This would check if BP has versions in current initiative
    const hasConflicts = false; // This would check for version conflicts
    
    return getArtifactState(
      bp.id,
      'business_process',
      lock,
      currentUser?.id,
      hasInitiativeChanges,
      hasConflicts
    );
  };

  // Export functions
  const handleExportFlat = async () => {
    try {
      const response = await fetch("/api/business-processes/export", {
        credentials: 'include'
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Export failed' }));
        throw new Error(error.message || 'Failed to export business processes');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `business-processes-export-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export Successful",
        description: "Business processes have been exported successfully.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Failed to export business processes",
        variant: "destructive",
      });
    }
  };

  const handleExportTreeView = async () => {
    try {
      const response = await fetch("/api/business-processes/export-tree", {
        credentials: 'include'
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Export failed' }));
        throw new Error(error.message || 'Failed to export business processes tree view');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `business-processes-tree-export-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export Successful",
        description: "Business processes tree view has been exported successfully.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Failed to export business processes tree view",
        variant: "destructive",
      });
    }
  };

  const handleDeleteClick = async (bp: any) => {
    try {
      // Check deletion impact first
      const impactResponse = await fetch(`/api/business-processes/${bp.id}/deletion-impact`);
      if (!impactResponse.ok) {
        throw new Error("Failed to check deletion impact");
      }
      
      const impact = await impactResponse.json();
      setDeletionImpactMessage(impact.message);
      setDeletingBP(bp);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to check deletion impact",
        variant: "destructive",
      });
    }
  };

  const handleCreateChild = async (parentBP: any) => {
    try {
      // Get current children to determine the next sequence number
      const childrenResponse = await fetch(`/api/business-processes/${parentBP.id}/children`);
      if (!childrenResponse.ok) {
        throw new Error("Failed to fetch children");
      }
      
      const children = await childrenResponse.json();
      const nextSequenceNumber = children.length > 0 ? Math.max(...children.map((c: any) => c.sequenceNumber || 0)) + 1 : 1;
      
      // Determine the child level
      const childLevel = parentBP.level === 'A' ? 'B' : parentBP.level === 'B' ? 'C' : null;
      
      if (!childLevel) {
        toast({
          title: "Error",
          description: "Level C processes cannot have children",
          variant: "destructive",
        });
        return;
      }
      
      // Create a template for the child process
      const childTemplate = {
        id: 0, // New process
        businessProcess: `New Level ${childLevel} Process`,
        lob: parentBP.lob,
        product: parentBP.product,
        version: '1.0',
        domainOwner: parentBP.domainOwner,
        itOwner: parentBP.itOwner,
        vendorFocal: parentBP.vendorFocal,
        status: 'new',
        level: childLevel,
        description: '',
        technicalDetails: '',
        tags: '',
        parentProcessId: parentBP.id,
        sequenceNumber: nextSequenceNumber
      };
      
      setCreatingChildForBP({ parent: parentBP, child: childTemplate });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to prepare child process creation",
        variant: "destructive",
      });
    }
  };

  const handleDuplicateAndEdit = async (bp: any) => {
    try {
      // Use the new duplicate endpoint that includes children
      const response = await fetch(`/api/business-processes/${bp.id}/duplicate`, {
        method: "POST",
      });
      
      if (!response.ok) {
        throw new Error("Failed to duplicate business process");
      }
      
      const duplicatedBP = await response.json();
      
      // Open the edit dialog with the duplicated business process
      setDuplicatingBP(duplicatedBP);
      
      toast({
        title: "Success",
        description: `Business process "${bp.businessProcess}" has been duplicated${
          bp.level === 'A' ? ' with existing child processes linked' : 
          bp.level === 'B' ? ' with all child processes duplicated' : 
          ''
        }`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to duplicate business process",
        variant: "destructive",
      });
    }
  };

  const handleMoveProcess = async (processId: number, newParentId: number | null, position?: number) => {
    await moveProcessMutation.mutateAsync({ processId, newParentId, position });
  };

  const handleCopyPaste = async (sourceProcessId: number, targetParentId: number | null) => {
    try {
      const response = await fetch(`/api/business-processes/${sourceProcessId}/copy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetParentId }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to copy process");
      }
      
      queryClient.invalidateQueries({ queryKey: ["business-processes"] });
      queryClient.invalidateQueries({ queryKey: ["business-process-relationships"] });
      
      toast({
        title: "Success",
        description: "Business process copied successfully with all children",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to copy business process",
        variant: "destructive",
      });
    }
  };

  // Fetch parent/child relationships when viewing a BP
  useEffect(() => {
    if (viewingBP) {
      // Fetch parents
      fetch(`/api/business-processes/${viewingBP.id}/parents`)
        .then(res => res.json())
        .then(setBpParents)
        .catch(() => setBpParents([]));
      
      // Fetch children
      fetch(`/api/business-processes/${viewingBP.id}/children`)
        .then(res => res.json())
        .then(setBpChildren)
        .catch(() => setBpChildren([]));
    }
  }, [viewingBP]);

  const filterColumns: FilterColumn[] = [
    { key: "businessProcess", label: "Business Process" },
    { key: "lob", label: "Line of Business" },
    { key: "product", label: "Product" },
    { key: "version", label: "Version" },
    { key: "level", label: "Level", type: "select", options: [
      { value: "A", label: "Level A" },
      { value: "B", label: "Level B" },
      { value: "C", label: "Level C" }
    ]},
    { key: "status", label: "Status", type: "select", options: [
      { value: "new", label: "New" },
      { value: "active", label: "Active" },
      { value: "inactive", label: "Inactive" },
      { value: "deprecated", label: "Deprecated" }
    ]},
    { key: "domainOwner", label: "Domain Owner" },
    { key: "itOwner", label: "IT Owner" },
    { key: "vendorFocal", label: "Vendor Focal" },
    { key: "hasCommunications", label: "Has Communications", type: "select", options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" }
    ]},
    { key: "versionState", label: "Version State", type: "select", options: [
      { value: "production", label: "Production Baseline" },
      { value: "checked_out_me", label: "Checked Out by Me" },
      { value: "checked_out_other", label: "Locked by Others" },
      { value: "initiative_changes", label: "Initiative Changes" },
      { value: "conflicted", label: "Conflicted" }
    ]}
  ];

  // Separate custom filters from standard filters
  const hasCommunicationsFilter = filters.find(f => f.column === 'hasCommunications');
  const versionStateFilter = filters.find(f => f.column === 'versionState');
  const otherFilters = filters.filter(f => f.column !== 'hasCommunications' && f.column !== 'versionState');

  // Apply standard filters first
  let filteredByConditions = businessProcesses ? applyFilters(businessProcesses, otherFilters) : [];

  // Then apply custom hasCommunications filter if present
  if (hasCommunicationsFilter && communicationCounts) {
    filteredByConditions = filteredByConditions.filter((bp: any) => {
      const communicationCount = communicationCounts.get(bp.id) ?? 0;
      if (hasCommunicationsFilter.value === 'yes') {
        return communicationCount > 0;
      } else if (hasCommunicationsFilter.value === 'no') {
        return communicationCount === 0;
      }
      return true;
    });
  }

  // Apply version state filter if present
  if (versionStateFilter && currentInitiative && !isProductionView) {
    try {
      filteredByConditions = filteredByConditions.filter((bp: any) => {
        const bpState = getBusinessProcessState(bp);
        return bpState.state === versionStateFilter.value;
      });
    } catch (e) {
      console.error('Error in version state filter:', e);
    }
  }

  // Then apply search
  const filteredBPs = filteredByConditions.filter((bp: any) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      bp.businessProcess?.toLowerCase().includes(searchLower) ||
      bp.lob?.toLowerCase().includes(searchLower) ||
      bp.product?.toLowerCase().includes(searchLower) ||
      bp.domainOwner?.toLowerCase().includes(searchLower) ||
      bp.itOwner?.toLowerCase().includes(searchLower)
    );
  });

  // Initialize multi-select hook
  const multiSelect = useMultiSelect({
    items: filteredBPs,
    getItemId: (process) => process.id,
  });

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-white">Business Processes</h1>
          <div className="flex items-center space-x-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="bg-blue-600 text-white hover:bg-blue-700">
                  <FileDown className="mr-2" size={16} />
                  Export
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700 w-56">
                <DropdownMenuItem 
                  onClick={handleExportFlat}
                  className="text-gray-300 hover:text-white hover:bg-gray-700"
                >
                  <FileJson className="mr-2 h-4 w-4" />
                  Export Flat View
                  <span className="ml-auto text-xs text-gray-400">Standard</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleExportTreeView}
                  className="text-gray-300 hover:text-white hover:bg-gray-700"
                >
                  <Layers className="mr-2 h-4 w-4" />
                  Export Hierarchical View
                  <span className="ml-auto text-xs text-gray-400">With Relationships</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setShowImportExport(true)}
                  className="text-gray-300 hover:text-white hover:bg-gray-700"
                >
                  <FileJson className="mr-2 h-4 w-4" />
                  Import Data
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-blue-600 text-white hover:bg-blue-700"
                  disabled={isProductionView && currentInitiative}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Business Process
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl bg-gray-800 border-gray-700 max-h-[90vh] overflow-y-auto">
                {currentInitiative && !isProductionView ? (
                  <div className="mb-4 p-3 bg-blue-900/20 border border-blue-700 rounded">
                    <p className="text-sm text-blue-300">
                      <GitBranch className="inline h-4 w-4 mr-1" />
                      Creating in initiative: <strong>{currentInitiative.name}</strong>
                    </p>
                  </div>
                ) : (
                  <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-700 rounded">
                    <p className="text-sm text-yellow-300">
                      <AlertTriangle className="inline h-4 w-4 mr-1" />
                      Creating directly in production. Switch to an initiative to track changes.
                    </p>
                  </div>
                )}
                <BusinessProcessForm 
                  onSuccess={() => {
                    setIsCreateOpen(false);
                    queryClient.invalidateQueries({ queryKey: ["business-processes"] });
                  }} 
                  initiativeId={currentInitiative?.initiativeId}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        {/* View Mode Indicator */}
        <ViewModeIndicator />
        
        {/* Search and Filter Bar */}
        <div className="mb-6 space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search business processes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-sm bg-gray-800 border-gray-700 text-white placeholder-gray-400"
              />
              <DataFilter
                columns={filterColumns}
                filters={filters}
                onFiltersChange={setFilters}
                onClearAllFilters={clearAllFilters}
              />
            </div>
            <ToggleGroup 
              type="single" 
              value={viewMode} 
              onValueChange={(value) => value && setViewMode(value as "table" | "hierarchy" | "tree")}
              className="bg-gray-800 border-gray-700"
            >
              <ToggleGroupItem value="table" aria-label="Table view" className="data-[state=on]:bg-gray-700">
                <TableIcon className="h-4 w-4 mr-2" />
                Table
              </ToggleGroupItem>
              <ToggleGroupItem value="tree" aria-label="Tree view" className="data-[state=on]:bg-gray-700">
                <GitBranch className="h-4 w-4 mr-2" />
                Tree
              </ToggleGroupItem>
              <ToggleGroupItem value="hierarchy" aria-label="Hierarchy Designer" className="data-[state=on]:bg-gray-700">
                <Layers className="h-4 w-4 mr-2" />
                Hierarchy
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          {hasActiveFilters() && (
            <div className="flex items-center gap-2 text-sm text-blue-400">
              <Info className="h-4 w-4" />
              <span>Filters are active - results are filtered. {search && `Search: "${search}"`}</span>
            </div>
          )}
        </div>

        {/* Bulk Actions */}
        {multiSelect.selectedItems.length > 0 && (
          <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-gray-300">
                  {multiSelect.selectedItems.length} item{multiSelect.selectedItems.length > 1 ? 's' : ''} selected
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    multiSelect.selectedItems.forEach(bp => deleteMutation.mutate(bp));
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

        {viewMode === "table" ? (
          <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700">
          <Table>
          <TableHeader>
            <TableRow className="border-gray-700">
              <TableHead className="w-12">
                <Checkbox
                  checked={filteredBPs.length > 0 && multiSelect.selectedItems.length === filteredBPs.length}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      multiSelect.selectAll();
                    } else {
                      multiSelect.clearSelection();
                    }
                  }}
                  aria-label="Select all business processes"
                />
              </TableHead>
              <TableHead className="text-gray-300">Business Process</TableHead>
              <TableHead className="text-gray-300">LOB</TableHead>
              <TableHead className="text-gray-300">Product</TableHead>
              <TableHead className="text-gray-300">Version</TableHead>
              <TableHead className="text-gray-300">Level</TableHead>
              <TableHead className="text-gray-300">Domain Owner</TableHead>
              <TableHead className="text-gray-300">IT Owner</TableHead>
              <TableHead className="text-gray-300">Status</TableHead>
              <TableHead className="text-gray-300">Version Status</TableHead>
              <TableHead className="text-gray-300">Communications</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-gray-400">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredBPs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-gray-400">
                  No business processes found
                </TableCell>
              </TableRow>
            ) : (
              filteredBPs.map((bp: any) => (
                <ContextMenu key={bp.id}>
                  <ContextMenuTrigger asChild>
                    <TableRow 
                      className={getRowClassName(getBusinessProcessState(bp), multiSelect.isSelected(bp))}
                      onDoubleClick={() => setViewingBP(bp)}
                      title="Double-click to view business process details"
                    >
                      <TableCell className="w-12">
                        <Checkbox
                          checked={multiSelect.isSelected(bp)}
                          onCheckedChange={() => multiSelect.toggleSelection(bp)}
                          onClick={(e) => e.stopPropagation()}
                          aria-label={`Select business process ${bp.businessProcess}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium text-white">
                        <div className="flex items-center space-x-2">
                          <Network className="h-4 w-4 text-blue-600" />
                          <span>{bp.businessProcess}</span>
                          <ArtifactStatusIndicator 
                            state={getBusinessProcessState(bp)} 
                            initiativeName={currentInitiative?.name}
                          />
                          <ArtifactStatusBadge 
                            state={getBusinessProcessState(bp)} 
                            showIcon={false}
                            showText={true}
                            size="sm"
                          />
                        </div>
                      </TableCell>
                  <TableCell className="text-gray-300">{bp.lob}</TableCell>
                  <TableCell className="text-gray-300">{bp.product}</TableCell>
                  <TableCell className="text-gray-300">{bp.version}</TableCell>
                  <TableCell className="text-gray-300">
                    <Badge className="bg-gray-700 text-white" variant="outline">
                      Level {bp.level || "A"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-300">{bp.domainOwner || "-"}</TableCell>
                  <TableCell className="text-gray-300">{bp.itOwner || "-"}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          bp.status === "new" ? "bg-purple-600 text-white" :
                          bp.status === "active" ? "bg-green-600 text-white" :
                          bp.status === "inactive" ? "bg-red-600 text-white" :
                          bp.status === "maintenance" ? "bg-blue-600 text-white" :
                          "bg-orange-600 text-white"
                        }
                      >
                        {bp.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <StatusColumn state={getBusinessProcessState(bp)} />
                    </TableCell>
                    <TableCell>
                      <CommunicationBadge 
                        entityType="business_process" 
                        entityId={bp.id} 
                        entityName={bp.businessProcess}
                      />
                    </TableCell>
                    </TableRow>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    {/* Version Control Options */}
                    {currentInitiative && !isProductionView && (
                      <>
                        {(() => {
                          const lock = isBusinessProcessLocked(bp.id);
                          const isLockedByMe = lock?.lock.lockedBy === currentUser?.id || isAdmin;
                          const isLockedByOther = lock && !isLockedByMe;
                          
                          return (
                            <>
                              {!lock && (
                                <ContextMenuItem 
                                  onClick={() => checkoutMutation.mutate(bp)}
                                  disabled={checkoutMutation.isPending}
                                >
                                  <GitBranch className="mr-2 h-4 w-4" />
                                  Checkout
                                </ContextMenuItem>
                              )}
                              {isLockedByMe && (
                                <>
                                  <ContextMenuItem onClick={() => setEditingBP(bp)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </ContextMenuItem>
                                  <ContextMenuItem 
                                    onClick={() => checkinMutation.mutate({ bp, changes: {} })}
                                    disabled={checkinMutation.isPending}
                                  >
                                    <Unlock className="mr-2 h-4 w-4" />
                                    Checkin
                                  </ContextMenuItem>
                                  <ContextMenuItem 
                                    onClick={() => cancelCheckoutMutation.mutate(bp)}
                                    disabled={cancelCheckoutMutation.isPending}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <X className="mr-2 h-4 w-4" />
                                    Cancel Checkout
                                  </ContextMenuItem>
                                </>
                              )}
                              {isLockedByOther && (
                                <ContextMenuItem disabled>
                                  <Lock className="mr-2 h-4 w-4" />
                                  Locked by {lock.user?.username}
                                </ContextMenuItem>
                              )}
                            </>
                          );
                        })()}
                        <ContextMenuSeparator />
                      </>
                    )}
                    {canUpdate && (!currentInitiative || isProductionView) && (
                      <ContextMenuItem onClick={() => setEditingBP(bp)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </ContextMenuItem>
                    )}
                    <ContextMenuItem onClick={() => setViewingBP(bp)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => navigate(`/business-processes/${bp.id}/diagram`)}>
                      <Network className="mr-2 h-4 w-4" />
                      View IML Diagram
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    {bp.level !== 'C' && (
                      <>
                        <ContextMenuItem onClick={() => handleCreateChild(bp)} className="text-green-400 focus:text-green-300">
                          <UserPlus className="mr-2 h-4 w-4" />
                          Add Level {bp.level === 'A' ? 'B' : 'C'} Process
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                      </>
                    )}
                    <ContextMenuItem onClick={() => handleDuplicateAndEdit(bp)}>
                      <Copy className="mr-2 h-4 w-4" />
                      Duplicate and Edit
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem
                      onClick={() => handleDeleteClick(bp)}
                      className="text-red-400 focus:text-red-300"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              ))
            )}
          </TableBody>
        </Table>
        </div>
        ) : viewMode === "hierarchy" ? (
          <div className="space-y-4">
            {/* Hierarchy Builder Header */}
            <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">Business Process Hierarchy Designer</h2>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setSelectedHierarchyDesign(null);
                      toast({
                        title: "New Design",
                        description: "Starting a new hierarchy design",
                      });
                    }}
                    className="bg-blue-600 text-white hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Design
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowHierarchyDesigns(!showHierarchyDesigns)}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    <Layers className="h-4 w-4 mr-2" />
                    {showHierarchyDesigns ? 'Hide' : 'Show'} Saved Designs
                  </Button>
                </div>
              </div>
              
              {showHierarchyDesigns && (
                <HierarchyDesignsList
                  onSelectDesign={(design) => {
                    setSelectedHierarchyDesign(design);
                    setShowHierarchyDesigns(false);
                    toast({
                      title: "Design Loaded",
                      description: `Hierarchy design "${design.name}" has been loaded into the editor`,
                    });
                  }}
                />
              )}
            </div>
            
            {/* Hierarchy Builder */}
            <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-4 flex-1 flex flex-col min-h-0" style={{ height: 'calc(100vh - 300px)' }}>
              <HierarchyHtmlEditor
                key={selectedHierarchyDesign?.id || 'new'} // Force re-render when design changes
                initialHierarchy={selectedHierarchyDesign ? JSON.parse(selectedHierarchyDesign.hierarchyData) : undefined}
                initialMetadata={selectedHierarchyDesign ? {
                  name: selectedHierarchyDesign.name,
                  description: selectedHierarchyDesign.description || "",
                  tags: selectedHierarchyDesign.tags || ""
                } : undefined}
                onSave={async (hierarchy, metadata) => {
                  // Get current user from localStorage or session
                  const currentUser = localStorage.getItem('username') || 'unknown';
                  
                  // Add timestamp and username to the name
                  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
                  const enhancedName = `${metadata.name}_${timestamp}_${currentUser}`;
                  
                  const response = await fetch("/api/hierarchy-designs", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                      name: enhancedName,
                      description: metadata.description,
                      hierarchyData: JSON.stringify(hierarchy),
                      tags: Array.isArray(metadata.tags) ? metadata.tags.join(', ') : metadata.tags,
                      createdBy: currentUser,
                    }),
                  });
                  if (!response.ok) throw new Error("Failed to save design");
                  
                  // Clear selected design after save to show fresh state
                  setSelectedHierarchyDesign(null);
                }}
              />
            </div>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-4">
            <BusinessProcessTreeViewDnd
              processes={filteredBPs}
              relationships={relationships}
              searchTerm={search}
              onEdit={setEditingBP}
              onView={setViewingBP}
              onDelete={handleDeleteClick}
              onDuplicate={handleDuplicateAndEdit}
              onCreateChild={handleCreateChild}
              onMoveProcess={handleMoveProcess}
              onCopyPaste={handleCopyPaste}
            />
          </div>
        )}
      </div>

      {/* Edit Business Process Dialog */}
      <Dialog open={!!editingBP} onOpenChange={(open) => !open && setEditingBP(null)}>
        <DialogContent className="max-w-3xl bg-gray-800 border-gray-700 max-h-[90vh] overflow-y-auto">
          <BusinessProcessForm
            businessProcess={editingBP}
            onSuccess={async () => {
              try {
                // If in an initiative and BP is checked out, do checkin
                if (currentInitiative && !isProductionView) {
                  const lock = isBusinessProcessLocked(editingBP.id);
                  if (lock?.lock.lockedBy === lock?.user?.id) {
                    // BP is checked out by current user, do checkin
                    // Note: The form has already saved the changes to the server
                    await checkinMutation.mutateAsync({ 
                      bp: editingBP, 
                      changes: {} // Changes already saved 
                    });
                  }
                }
              } catch (error) {
                console.error('Checkin failed after edit:', error);
                // Don't block the UI close even if checkin fails
              }
              setEditingBP(null);
              queryClient.invalidateQueries({ queryKey: ["business-processes"] });
            }}
          />
        </DialogContent>
      </Dialog>

      {/* View Business Process Details Dialog */}
      <Dialog open={!!viewingBP} onOpenChange={(open) => !open && setViewingBP(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-gray-800 border-gray-700">
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-white">{viewingBP?.businessProcess}</h2>
              <div className="flex items-center gap-2">
                <Badge className="bg-gray-700 text-white" variant="outline">
                  Level {viewingBP?.level || "A"}
                </Badge>
                <p className="text-gray-400">Version {viewingBP?.version}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-300 mb-1">Business Information</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-400">Line of Business:</span>
                      <p className="text-sm font-medium text-white">{viewingBP?.lob}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-400">Product:</span>
                      <p className="text-sm font-medium text-white">{viewingBP?.product}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-400">Status:</span>
                      <Badge
                        className={`ml-2 ${
                          viewingBP?.status === "active" ? "bg-green-600 text-white" :
                          viewingBP?.status === "inactive" ? "bg-red-600 text-white" :
                          viewingBP?.status === "maintenance" ? "bg-blue-600 text-white" :
                          "bg-orange-600 text-white"
                        }`}
                      >
                        {viewingBP?.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-300 mb-1">Ownership</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-400">Domain Owner:</span>
                      <p className="text-sm font-medium text-white">{viewingBP?.domainOwner || "Not assigned"}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-400">IT Owner:</span>
                      <p className="text-sm font-medium text-white">{viewingBP?.itOwner || "Not assigned"}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-400">Vendor Focal:</span>
                      <p className="text-sm font-medium text-white">{viewingBP?.vendorFocal || "Not assigned"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Process Hierarchy */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">Process Hierarchy</h3>
              
              {viewingBP?.level !== "A" && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-300 mb-2">Parent Processes</h4>
                  {bpParents.length === 0 ? (
                    <p className="text-sm text-gray-400">No parent processes</p>
                  ) : (
                    <div className="space-y-1">
                      {bpParents.map((parent: any) => (
                        <div key={parent.id} className="flex items-center gap-2 text-sm">
                          <Badge className="bg-blue-600 text-white text-xs">
                            Seq: {parent.sequenceNumber}
                          </Badge>
                          <span className="text-white">{parent.businessProcess}</span>
                          <Badge className="bg-gray-700 text-white text-xs" variant="outline">
                            Level {parent.level}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {viewingBP?.level !== "C" && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-300 mb-2">Child Processes</h4>
                  {bpChildren.length === 0 ? (
                    <p className="text-sm text-gray-400">No child processes</p>
                  ) : (
                    <div className="space-y-1">
                      {bpChildren
                        .sort((a: any, b: any) => a.sequenceNumber - b.sequenceNumber)
                        .map((child: any) => (
                        <div key={child.id} className="flex items-center gap-2 text-sm">
                          <Badge className="bg-purple-600 text-white text-xs">
                            Seq: {child.sequenceNumber}
                          </Badge>
                          <span className="text-white">{child.businessProcess}</span>
                          <Badge className="bg-gray-700 text-white text-xs" variant="outline">
                            Level {child.level}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingBP} onOpenChange={(open) => {
        if (!open) {
          setDeletingBP(null);
          setDeletionImpactMessage(null);
        }
      }}>
        <AlertDialogContent className="bg-gray-800 border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              {deletionImpactMessage || `This will permanently delete the business process "${deletingBP?.businessProcess}". This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingBP) {
                  deleteMutation.mutate(deletingBP);
                  setDeletingBP(null);
                }
              }}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Duplicate and Edit Business Process Dialog */}
      <Dialog open={!!duplicatingBP} onOpenChange={(open) => !open && setDuplicatingBP(null)}>
        <DialogContent className="max-w-3xl bg-gray-800 border-gray-700 max-h-[90vh] overflow-y-auto">
          {duplicatingBP && (
            <BusinessProcessForm
              businessProcess={duplicatingBP}
              onSuccess={() => {
                setDuplicatingBP(null);
                queryClient.invalidateQueries({ queryKey: ["business-processes"] });
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Create Child Business Process Dialog */}
      <Dialog open={!!creatingChildForBP} onOpenChange={(open) => !open && setCreatingChildForBP(null)}>
        <DialogContent className="max-w-3xl bg-gray-800 border-gray-700 max-h-[90vh] overflow-y-auto">
          {creatingChildForBP && (
            <ChildBusinessProcessForm
              parentBP={creatingChildForBP.parent}
              childTemplate={creatingChildForBP.child}
              onSuccess={() => {
                setCreatingChildForBP(null);
                queryClient.invalidateQueries({ queryKey: ["business-processes"] });
                queryClient.invalidateQueries({ queryKey: ["business-process-relationships"] });
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Import/Export Dialog */}
      <ImportExportDialog
        open={showImportExport}
        onOpenChange={setShowImportExport}
        entity="business-processes"
        entityName="Business Processes"
        onImportSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["business-processes"] });
        }}
      />
    </div>
  );
}