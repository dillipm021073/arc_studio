import { useState, useEffect } from "react";
import { usePersistentFilters } from "@/hooks/use-persistent-filters";
import { useCommunicationCounts } from "@/hooks/use-communication-counts";
import { usePermissions } from "@/hooks/use-permissions";
import { useMultiSelect } from "@/hooks/use-multi-select";
import { useQuery } from "@tanstack/react-query";
import { useInitiative } from "@/components/initiatives/initiative-context";
import { api } from "@/lib/api";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ArtifactInitiativeTooltip } from "@/components/ui/artifact-initiative-tooltip";
import { 
  Plus, 
  Search, 
  Edit, 
  Eye, 
  Trash2,
  Plug,
  MessageSquare,
  MoreVertical,
  Info,
  ArrowRight,
  FileJson,
  Copy,
  AlertTriangle,
  GitBranch,
  Lock,
  Unlock,
  X,
  Grid3x3,
  List,
  TableIcon
} from "lucide-react";
import { Link } from "wouter";
import InterfaceFormEnhanced from "@/components/interfaces/interface-form-enhanced";
import InterfaceEditDialog from "@/components/interfaces/interface-edit-dialog-enhanced";
import InterfaceBusinessProcesses from "@/components/interfaces/interface-business-processes";
import { ImportExportDialog } from "@/components/import-export-dialog";
import { MultiSelectTable } from "@/components/ui/multi-select-table";
import { BulkActionBar } from "@/components/ui/bulk-action-bar";
import { BulkEditDialog, type BulkEditField } from "@/components/bulk-edit-dialog";
import CommunicationBadge from "@/components/communications/communication-badge";
import InterfaceDecommissionModal from "@/components/modals/interface-decommission-modal";
import { LockConflictDialog } from "@/components/version-control/lock-conflict-dialog";
import { cn } from "@/lib/utils";
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
import ArtifactsExplorer from "@/components/artifacts/artifacts-explorer";

interface Interface {
  id: number;
  imlNumber: string;
  description?: string;
  providerApplicationId: number;
  consumerApplicationId: number;
  interfaceType: string;
  middleware?: string;
  version: string;
  lob: string;
  lastChangeDate: string;
  businessProcessName: string;
  customerFocal: string;
  providerOwner: string;
  consumerOwner: string;
  status: string;
}

export default function Interfaces() {
  const {
    searchTerm,
    filters,
    updateSearchTerm,
    updateFilters,
    clearAllFilters,
    hasActiveFilters
  } = usePersistentFilters('interfaces');
  
  const { canCreate, canUpdate, canDelete, isAdmin } = usePermissions();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingInterface, setEditingInterface] = useState<Interface | null>(null);
  const [viewingInterface, setViewingInterface] = useState<Interface | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "explorer">("table");
  const [deletingInterface, setDeletingInterface] = useState<Interface | null>(null);
  const [duplicatingInterface, setDuplicatingInterface] = useState<Interface | null>(null);
  const [showImportExport, setShowImportExport] = useState(false);
  const [decommissioningInterface, setDecommissioningInterface] = useState<Interface | null>(null);
  const [showBulkEditDialog, setShowBulkEditDialog] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [lockConflictError, setLockConflictError] = useState<any>(null);
  const [showLockConflictDialog, setShowLockConflictDialog] = useState(false);

  // Initiative context
  const { currentInitiative, isProductionView } = useInitiative();

  const { data: interfaces, isLoading } = useQuery<Interface[]>({
    queryKey: ["/api/interfaces"],
  });

  // Fetch current user
  const { data: currentUser } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: async () => {
      const response = await api.get('/api/auth/me');
      return response.data.user;
    }
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

  const { data: businessProcesses } = useQuery({
    queryKey: ["/api/business-processes"],
  });

  const { data: applications } = useQuery({
    queryKey: ["/api/applications"],
  });

  // Fetch communication counts for all interfaces
  const interfaceIds = interfaces?.map(iface => iface.id) || [];
  const { data: communicationCounts } = useCommunicationCounts("interface", interfaceIds);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/interfaces/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete interface");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/interfaces"] });
      toast({
        title: "Success",
        description: "Interface deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete interface",
        variant: "destructive",
      });
    },
  });

  const handleDuplicateAndEdit = (interface_: Interface) => {
    const duplicatedInterface = {
      ...interface_,
      id: 0, // New interface will get a new ID
      imlNumber: `${interface_.imlNumber}-Copy`,
      version: '1.0',
      lastChangeDate: new Date().toISOString().split('T')[0]
    };
    setDuplicatingInterface(duplicatedInterface);
  };

  // Bulk operations mutations using the new API endpoints
  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ ids, updates }: { ids: number[]; updates: Record<string, any> }) => {
      const response = await fetch("/api/bulk/interfaces", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, updates }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update interfaces");
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/interfaces"] });
      toast({
        title: "Success",
        description: data.message,
      });
      multiSelect.clearSelection();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update interfaces",
        variant: "destructive",
      });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      const response = await fetch("/api/bulk/interfaces", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete interfaces");
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/interfaces"] });
      toast({
        title: "Success",
        description: data.message,
      });
      multiSelect.clearSelection();
      setShowBulkDeleteConfirm(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete interfaces",
        variant: "destructive",
      });
    },
  });

  const bulkDuplicateMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      const response = await fetch("/api/bulk/interfaces/duplicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to duplicate interfaces");
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/interfaces"] });
      toast({
        title: "Success",
        description: data.message,
      });
      multiSelect.clearSelection();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to duplicate interfaces",
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

  const handleBulkDuplicate = () => {
    const ids = multiSelect.selectedItems.map(iface => iface.id);
    bulkDuplicateMutation.mutate(ids);
  };

  const handleBulkUpdate = (updates: Record<string, any>) => {
    const ids = multiSelect.selectedItems.map(iface => iface.id);
    bulkUpdateMutation.mutate({ ids, updates });
  };

  // Version Control mutations
  const checkoutMutation = useMutation({
    mutationFn: async (iface: Interface) => {
      const response = await api.post('/api/version-control/checkout', {
        artifactType: 'interface',
        artifactId: iface.id,
        initiativeId: currentInitiative?.initiativeId
      });
      return response.data;
    },
    onSuccess: (data, iface) => {
      queryClient.invalidateQueries({ queryKey: ['version-control-locks'] });
      toast({
        title: "Interface checked out",
        description: `${iface.imlNumber} is now locked for editing in ${currentInitiative?.name}`
      });
    },
    onError: (error: any) => {
      // Check if it's a lock conflict error (409 status)
      if (error.response?.status === 409 && error.response?.data) {
        setLockConflictError(error.response.data);
        setShowLockConflictDialog(true);
      } else {
        // For other errors, show toast
        toast({
          title: "Checkout failed",
          description: error.response?.data?.error || "Failed to checkout interface",
          variant: "destructive"
        });
      }
    }
  });

  const checkinMutation = useMutation({
    mutationFn: async ({ iface, changes }: { iface: Interface; changes: any }) => {
      const response = await api.post('/api/version-control/checkin', {
        artifactType: 'interface',
        artifactId: iface.id,
        initiativeId: currentInitiative?.initiativeId,
        changes,
        changeDescription: `Updated ${iface.imlNumber} via UI`
      });
      return response.data;
    },
    onSuccess: (data, { iface }) => {
      queryClient.invalidateQueries({ queryKey: ['version-control-locks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/interfaces'] });
      toast({
        title: "Changes checked in",
        description: `${iface.imlNumber} has been updated in ${currentInitiative?.name}`
      });
      setEditingInterface(null);
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
    mutationFn: async (interface_: any) => {
      const response = await api.post('/api/version-control/cancel-checkout', {
        artifactType: 'interface',
        artifactId: interface_.id,
        initiativeId: currentInitiative?.initiativeId
      });
      return response.data;
    },
    onSuccess: (data, interface_) => {
      queryClient.invalidateQueries({ queryKey: ['version-control-locks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/interfaces'] });
      toast({
        title: "Checkout cancelled",
        description: `${interface_.imlNumber} checkout has been cancelled and changes discarded`
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

  // Helper to check if an interface is locked
  const isInterfaceLocked = (interfaceId: number) => {
    if (!locks) return null;
    return locks.find((l: any) => 
      l.lock.artifactType === 'interface' && 
      l.lock.artifactId === interfaceId
    );
  };

  // Helper to get interface state for visual indicators
  const getInterfaceState = (interface_: Interface): ArtifactState => {
    const lock = isInterfaceLocked(interface_.id);
    // TODO: Add logic to detect initiative changes and conflicts
    const hasInitiativeChanges = false; // This would check if interface has versions in current initiative
    const hasConflicts = false; // This would check for version conflicts
    
    return getArtifactState(
      interface_.id,
      'interface',
      lock,
      currentUser?.id,
      hasInitiativeChanges,
      hasConflicts
    );
  };

  const getApplication = (id: number) => {
    return applications?.find(app => app.id === id);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'new': return 'bg-purple-600 text-white';
      case 'active': return 'bg-green-600 text-white';
      case 'inactive': return 'bg-red-600 text-white';
      case 'maintenance': return 'bg-orange-600 text-white';
      case 'deprecated': return 'bg-orange-600 text-white';
      case 'under_review': return 'bg-orange-600 text-white';
      default: return 'bg-orange-600 text-white';
    }
  };

  const getInterfaceTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'rest': return 'bg-blue-600 text-white';
      case 'soap': return 'bg-green-600 text-white';
      case 'graphql': return 'bg-purple-600 text-white';
      case 'messaging': return 'bg-orange-600 text-white';
      case 'database': return 'bg-gray-600 text-white';
      case 'file': return 'bg-yellow-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const filterColumns: FilterColumn[] = [
    { key: "imlNumber", label: "IML Number" },
    { key: "version", label: "Version" },
    { key: "interfaceType", label: "Interface Type", type: "select", options: [
      { value: "REST", label: "REST" },
      { value: "SOAP", label: "SOAP" },
      { value: "GraphQL", label: "GraphQL" },
      { value: "Messaging", label: "Messaging" },
      { value: "Database", label: "Database" },
      { value: "File", label: "File" }
    ]},
    { key: "middleware", label: "Middleware", type: "select", options: [
      { value: "None", label: "None" },
      { value: "Apache Kafka", label: "Apache Kafka" },
      { value: "RabbitMQ", label: "RabbitMQ" },
      { value: "IBM MQ", label: "IBM MQ" },
      { value: "Redis", label: "Redis" },
      { value: "WSO2", label: "WSO2" },
      { value: "MuleSoft", label: "MuleSoft" },
      { value: "PSB", label: "PSB" },
      { value: "PCE", label: "PCE" },
      { value: "Custom", label: "Custom" }
    ]},
    { key: "lob", label: "Line of Business" },
    { key: "status", label: "Status", type: "select", options: [
      { value: "new", label: "New" },
      { value: "active", label: "Active" },
      { value: "inactive", label: "Inactive" },
      { value: "deprecated", label: "Deprecated" },
      { value: "under_review", label: "Under Review" }
    ]},
    { key: "businessProcessName", label: "Business Process" },
    { key: "customerFocal", label: "Customer Focal" },
    { key: "providerOwner", label: "Provider Owner" },
    { key: "consumerOwner", label: "Consumer Owner" },
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
  let filteredByConditions = interfaces ? applyFilters(interfaces, otherFilters) : [];

  // Then apply custom hasCommunications filter if present
  if (hasCommunicationsFilter && communicationCounts) {
    filteredByConditions = filteredByConditions.filter(interface_ => {
      const communicationCount = communicationCounts.get(interface_.id) ?? 0;
      if (hasCommunicationsFilter.value === 'yes') {
        return communicationCount > 0;
      } else if (hasCommunicationsFilter.value === 'no') {
        return communicationCount === 0;
      }
      return true;
    });
  }

  // Apply version state filter if present
  if (versionStateFilter) {
    try {
      filteredByConditions = filteredByConditions.filter(interface_ => {
        // For initiative_changes filter, check if interface has any initiative-related changes
        if (versionStateFilter.value === 'initiative_changes') {
          // Check if the interface is locked (checked out)
          const isLocked = isInterfaceLocked(interface_.id);
          
          return interface_.hasInitiativeChanges || 
                 interface_.versionState === 'new_in_initiative' || 
                 interface_.versionState === 'modified_in_initiative' ||
                 interface_.artifactState === 'pending' ||
                 interface_.initiativeOrigin ||
                 isLocked; // Include locked/checked out interfaces
        }
        
        // For other filters, use the interface state
        const interfaceState = getInterfaceState(interface_);
        return interfaceState.state === versionStateFilter.value;
      });
    } catch (e) {
      console.error('Error in version state filter:', e);
    }
  }

  // Then apply search
  const filteredInterfaces = filteredByConditions.filter(interface_ => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      interface_.imlNumber?.toLowerCase().includes(searchLower) ||
      interface_.businessProcessName?.toLowerCase().includes(searchLower) ||
      interface_.interfaceType?.toLowerCase().includes(searchLower) ||
      interface_.middleware?.toLowerCase().includes(searchLower) ||
      interface_.lob?.toLowerCase().includes(searchLower) ||
      interface_.status?.toLowerCase().includes(searchLower) ||
      interface_.description?.toLowerCase().includes(searchLower) ||
      interface_.customerFocal?.toLowerCase().includes(searchLower) ||
      interface_.providerOwner?.toLowerCase().includes(searchLower) ||
      interface_.consumerOwner?.toLowerCase().includes(searchLower)
    );
  });

  // Initialize multi-select hook
  const multiSelect = useMultiSelect({
    items: filteredInterfaces,
    getItemId: (interface_) => interface_.id,
  });

  // Prepare bulk edit fields (must come after multiSelect hook)
  const bulkEditFields: BulkEditField[] = [
    {
      key: "status",
      label: "Status",
      type: "select",
      options: [
        { value: "new", label: "New" },
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
        { value: "deprecated", label: "Deprecated" },
        { value: "under_review", label: "Under Review" },
      ],
      currentValues: new Set(multiSelect.selectedItems.map(iface => iface.status)),
    },
    {
      key: "lob",
      label: "Line of Business",
      type: "text",
      currentValues: new Set(multiSelect.selectedItems.map(iface => iface.lob)),
    },
    {
      key: "middleware",
      label: "Middleware",
      type: "select",
      options: [
        { value: "None", label: "None" },
        { value: "Apache Kafka", label: "Apache Kafka" },
        { value: "RabbitMQ", label: "RabbitMQ" },
        { value: "IBM MQ", label: "IBM MQ" },
        { value: "Redis", label: "Redis" },
        { value: "WSO2", label: "WSO2" },
        { value: "MuleSoft", label: "MuleSoft" },
        { value: "PSB", label: "PSB" },
        { value: "PCE", label: "PCE" },
        { value: "Custom", label: "Custom" },
      ],
      currentValues: new Set(multiSelect.selectedItems.map(iface => iface.middleware)),
    },
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
                  <span className="text-white font-medium">Interfaces</span>
                </li>
              </ol>
            </nav>
            <h1 className="text-2xl font-semibold text-white mt-1">Interfaces Management (IML)</h1>
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
                <Button 
                  className="bg-blue-600 text-white hover:bg-blue-700"
                  disabled={isProductionView && currentInitiative}
                >
                  <Plus className="mr-2" size={16} />
                  New Interface
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-gray-800 border-gray-700">
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
                <InterfaceFormEnhanced 
                  onSuccess={() => setIsCreateDialogOpen(false)} 
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
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search interfaces..."
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
                variant={viewMode === "explorer" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("explorer")}
                title="Card/List View"
              >
                <Grid3x3 className="h-4 w-4 mr-2" />
                Explorer
              </Button>
              <Button
                variant={viewMode === "table" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("table")}
                title="Table View"
              >
                <List className="h-4 w-4 mr-2" />
                Table
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
        {canUpdate('interfaces') && (
          <BulkActionBar
            selectedCount={multiSelect.selectedCount}
            totalCount={filteredInterfaces.length}
            onBulkEdit={handleBulkEdit}
            onBulkDelete={canDelete('interfaces') ? handleBulkDelete : undefined}
            onDuplicate={canCreate('interfaces') ? handleBulkDuplicate : undefined}
            onClearSelection={multiSelect.clearSelection}
            onSelectAll={multiSelect.selectAll}
            onInvertSelection={multiSelect.invertSelection}
          />
        )}

        {/* Interfaces View */}
        {viewMode === "explorer" ? (
          <ArtifactsExplorer
          artifacts={filteredInterfaces}
          artifactType="interface"
          isLoading={isLoading}
          onView={setViewingInterface}
          onEdit={(iface) => {
            if (isInterfaceLocked(iface.id)) {
              setEditingInterface(iface);
            } else {
              toast({
                title: "Interface not checked out",
                description: "You need to check out this interface before editing",
                variant: "destructive"
              });
            }
          }}
          onDelete={(iface) => setDeletingInterface(iface)}
          onCheckout={(iface) => checkoutMutation.mutate(iface)}
          onCheckin={(iface, changes) => checkinMutation.mutate({ interface: iface, changes })}
          onCancelCheckout={(iface) => cancelCheckoutMutation.mutate(iface)}
          customActions={(iface) => (
            <>
              <ContextMenuItem 
                onClick={() => navigator.clipboard.writeText(iface.imlNumber)}
                className="text-gray-300 hover:bg-gray-700"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy IML Number
              </ContextMenuItem>
              {canCreate('interfaces') && (
                <ContextMenuItem 
                  onClick={() => handleDuplicateAndEdit(iface)}
                  className="text-gray-300 hover:bg-gray-700"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate Interface
                </ContextMenuItem>
              )}
              {canDelete('interfaces') && iface.status !== 'decommissioned' && (
                <>
                  <ContextMenuSeparator className="bg-gray-700" />
                  <ContextMenuItem 
                    onClick={() => setDecommissioningInterface(iface)}
                    className="text-yellow-400 hover:bg-yellow-900/20"
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Decommission
                  </ContextMenuItem>
                </>
              )}
            </>
          )}
          />
        ) : (
          <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="w-12">
                    <Checkbox
                      checked={filteredInterfaces.length > 0 && multiSelect.selectedItems.length === filteredInterfaces.length}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          multiSelect.selectAll();
                        } else {
                          multiSelect.clearSelection();
                        }
                      }}
                      aria-label="Select all interfaces"
                    />
                  </TableHead>
                  <TableHead className="text-gray-300">IML Number</TableHead>
                  <TableHead className="text-gray-300">Provider App</TableHead>
                  <TableHead className="text-gray-300">Consumer App</TableHead>
                  <TableHead className="text-gray-300">Type</TableHead>
                  <TableHead className="text-gray-300">Version</TableHead>
                  <TableHead className="text-gray-300">Status</TableHead>
                  <TableHead className="text-gray-300">Business Process</TableHead>
                  <TableHead className="text-gray-300">Version Status</TableHead>
                  <TableHead className="text-gray-300">Communications</TableHead>
                  <TableHead className="text-gray-300">Last Changed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center text-gray-400">
                      Loading interfaces...
                    </TableCell>
                  </TableRow>
                ) : filteredInterfaces.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center text-gray-400">
                      No interfaces found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInterfaces.map((interface_) => {
                    const providerApp = getApplication(interface_.providerApplicationId);
                    const consumerApp = getApplication(interface_.consumerApplicationId);
                    return (
                      <ContextMenu key={interface_.id}>
                        <ContextMenuTrigger asChild>
                          <TableRow 
                            className={cn(
                              "hover:bg-gray-700 cursor-pointer",
                              getRowClassName(getInterfaceState(interface_), multiSelect.isSelected(interface_))
                            )}
                            onDoubleClick={() => setViewingInterface(interface_)}
                          >
                            <TableCell className="w-12">
                              <Checkbox
                                checked={multiSelect.isSelected(interface_)}
                                onCheckedChange={() => multiSelect.toggleSelection(interface_)}
                                onClick={(e) => e.stopPropagation()}
                                aria-label={`Select interface ${interface_.imlNumber}`}
                              />
                            </TableCell>
                            <TableCell className="font-medium text-white">
                              <ArtifactInitiativeTooltip
                                artifactType="interface"
                                artifactId={interface_.id}
                                artifactState={interface_.artifactState}
                              >
                                <div className="flex items-center space-x-2">
                                  <Plug className="h-4 w-4 text-green-500" />
                                  <span>{interface_.imlNumber}</span>
                                  <ArtifactStatusIndicator 
                                    state={getInterfaceState(interface_)} 
                                    initiativeName={currentInitiative?.name}
                                  />
                                </div>
                              </ArtifactInitiativeTooltip>
                            </TableCell>
                            <TableCell className="text-gray-300">
                              {providerApp?.name || 'Unknown'}
                            </TableCell>
                            <TableCell className="text-gray-300">
                              {consumerApp?.name || 'Unknown'}
                            </TableCell>
                            <TableCell>
                              <Badge className={getInterfaceTypeColor(interface_.interfaceType)}>
                                {interface_.interfaceType}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-gray-300">{interface_.version}</TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(interface_.status)}>
                                {interface_.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-gray-300">{interface_.businessProcessName}</TableCell>
                            <TableCell>
                              <StatusColumn state={getInterfaceState(interface_)} />
                            </TableCell>
                            <TableCell>
                              <CommunicationBadge 
                                entityType="interface" 
                                entityId={interface_.id} 
                                entityName={interface_.imlNumber}
                              />
                            </TableCell>
                            <TableCell className="text-gray-300">
                              {new Date(interface_.lastChangeDate).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        </ContextMenuTrigger>
                        <ContextMenuContent>
                          <ContextMenuItem onClick={() => setViewingInterface(interface_)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </ContextMenuItem>
                          {currentInitiative && !isProductionView && (
                            <>
                              {!isInterfaceLocked(interface_.id) && (
                                <ContextMenuItem onClick={() => checkoutMutation.mutate(interface_)}>
                                  <Lock className="mr-2 h-4 w-4" />
                                  Checkout
                                </ContextMenuItem>
                              )}
                              {isInterfaceLocked(interface_.id) && (
                                <>
                                  <ContextMenuItem onClick={() => setEditingInterface(interface_)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </ContextMenuItem>
                                  <ContextMenuItem onClick={() => cancelCheckoutMutation.mutate(interface_)}>
                                    <Unlock className="mr-2 h-4 w-4" />
                                    Cancel Checkout
                                  </ContextMenuItem>
                                </>
                              )}
                            </>
                          )}
                          {(!currentInitiative || isProductionView) && canUpdate('interfaces') && (
                            <ContextMenuItem onClick={() => setEditingInterface(interface_)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </ContextMenuItem>
                          )}
                          <ContextMenuSeparator />
                          <ContextMenuItem onClick={() => navigator.clipboard.writeText(interface_.imlNumber)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Copy IML Number
                          </ContextMenuItem>
                          {canCreate('interfaces') && (
                            <ContextMenuItem onClick={() => handleDuplicateAndEdit(interface_)}>
                              <Copy className="mr-2 h-4 w-4" />
                              Duplicate Interface
                            </ContextMenuItem>
                          )}
                          {canDelete('interfaces') && (
                            <>
                              <ContextMenuSeparator />
                              {interface_.status !== 'decommissioned' && (
                                <ContextMenuItem 
                                  onClick={() => setDecommissioningInterface(interface_)}
                                  className="text-yellow-400"
                                >
                                  <AlertTriangle className="mr-2 h-4 w-4" />
                                  Decommission
                                </ContextMenuItem>
                              )}
                              <ContextMenuItem 
                                onClick={() => setDeletingInterface(interface_)}
                                className="text-red-400"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </ContextMenuItem>
                            </>
                          )}
                        </ContextMenuContent>
                      </ContextMenu>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Edit Interface Dialog */}
      <Dialog open={!!editingInterface} onOpenChange={(open) => !open && setEditingInterface(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-gray-800 border-gray-700">
          {editingInterface && (
            <InterfaceFormEnhanced 
              initialData={editingInterface} 
              interfaceId={editingInterface.id}
              isEditing={true}
              onSuccess={() => {
                setEditingInterface(null);
                queryClient.invalidateQueries({ queryKey: ["/api/interfaces"] });
              }} 
            />
          )}
        </DialogContent>
      </Dialog>

      {/* View Interface Details Dialog */}
      <Dialog open={!!viewingInterface} onOpenChange={(open) => !open && setViewingInterface(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-gray-800 border-gray-700">
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-white">{viewingInterface?.imlNumber}</h2>
              <p className="text-gray-400">Version {viewingInterface?.version}</p>
              {viewingInterface?.description && (
                <p className="text-gray-300 mt-2">{viewingInterface.description}</p>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-300 mb-1">Interface Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">Type:</span>
                      <Badge className={getInterfaceTypeColor(viewingInterface?.interfaceType || '')}>
                        {viewingInterface?.interfaceType.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">Status:</span>
                      <Badge className={getStatusColor(viewingInterface?.status || '')}>
                        {viewingInterface?.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">Last Changed:</span>
                      <span className="text-sm font-medium text-white">
                        {viewingInterface?.lastChangeDate ? new Date(viewingInterface.lastChangeDate).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-semibold text-gray-300 mb-1">Provider Information</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-400">Application:</span>
                      <p className="text-sm font-medium text-white">
                        {getApplication(viewingInterface?.providerApplicationId || 0)?.name || 'Unknown'}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-400">Owner:</span>
                      <p className="text-sm font-medium text-white">{viewingInterface?.providerOwner}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-300 mb-1">Consumer Information</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-400">Application:</span>
                      <p className="text-sm font-medium text-white">
                        {getApplication(viewingInterface?.consumerApplicationId || 0)?.name || 'Unknown'}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-400">Owner:</span>
                      <p className="text-sm font-medium text-white">{viewingInterface?.consumerOwner}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-semibold text-gray-300 mb-1">Business Information</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-400">Customer Focal:</span>
                      <p className="text-sm font-medium text-white">{viewingInterface?.customerFocal}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-400">Business Processes:</span>
                      <div className="mt-1">
                        {viewingInterface && <InterfaceBusinessProcesses interfaceId={viewingInterface.id} />}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingInterface} onOpenChange={(open) => !open && setDeletingInterface(null)}>
        <AlertDialogContent className="bg-gray-800 border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              This will permanently delete the interface "{deletingInterface?.imlNumber}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingInterface) {
                  deleteMutation.mutate(deletingInterface.id);
                  setDeletingInterface(null);
                }
              }}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


      {/* Duplicate and Edit Interface Dialog */}
      <Dialog open={!!duplicatingInterface} onOpenChange={(open) => !open && setDuplicatingInterface(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-gray-800 border-gray-700">
          {duplicatingInterface && (
            <InterfaceFormEnhanced 
              initialData={duplicatingInterface} 
              isEditing={false}
              onSuccess={() => {
                setDuplicatingInterface(null);
                queryClient.invalidateQueries({ queryKey: ["/api/interfaces"] });
              }} 
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Decommission Interface Modal */}
      <InterfaceDecommissionModal
        interface_={decommissioningInterface}
        open={!!decommissioningInterface}
        onOpenChange={(open) => !open && setDecommissioningInterface(null)}
      />

      {/* Import/Export Dialog */}
      <ImportExportDialog
        open={showImportExport}
        onOpenChange={setShowImportExport}
        entity="interfaces"
        entityName="Interfaces"
        onImportSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["/api/interfaces"] });
        }}
      />

      {/* Bulk Edit Dialog */}
      <BulkEditDialog
        open={showBulkEditDialog}
        onOpenChange={setShowBulkEditDialog}
        selectedCount={multiSelect.selectedCount}
        fields={bulkEditFields}
        onSubmit={handleBulkUpdate}
        entityName="Interfaces"
      />

      {/* Bulk Delete Confirmation */}
      <AlertDialog open={showBulkDeleteConfirm} onOpenChange={setShowBulkDeleteConfirm}>
        <AlertDialogContent className="bg-gray-800 border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete {multiSelect.selectedCount} Interfaces?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              This will permanently delete {multiSelect.selectedCount} selected interfaces. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const ids = multiSelect.selectedItems.map(iface => iface.id);
                bulkDeleteMutation.mutate(ids);
              }}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Lock Conflict Dialog */}
      <LockConflictDialog
        open={showLockConflictDialog}
        onOpenChange={setShowLockConflictDialog}
        error={lockConflictError}
        artifactType="interface"
      />

      {/* Edit Interface Dialog */}
      {editingInterface && (
        <InterfaceEditDialog
          interface={editingInterface}
          open={!!editingInterface}
          onOpenChange={(open) => !open && setEditingInterface(null)}
          onSuccess={async (updatedInterface) => {
            try {
              // If in an initiative and interface is checked out, do checkin
              if (currentInitiative && !isProductionView) {
                const lock = isInterfaceLocked(editingInterface.id);
                if (lock?.lock.lockedBy === currentUser?.id || isAdmin) {
                  // Interface is checked out by current user, do checkin
                  await checkinMutation.mutateAsync({ 
                    iface: editingInterface, 
                    changes: updatedInterface 
                  });
                }
              }
            } catch (error) {
              console.error('Checkin failed after edit:', error);
              // Don't block the UI close even if checkin fails
            }
            setEditingInterface(null);
            queryClient.invalidateQueries({ queryKey: ["/api/interfaces"] });
          }}
        />
      )}
    </div>
  );
}
