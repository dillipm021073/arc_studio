import { useState } from "react";
import { usePersistentFilters } from "@/hooks/use-persistent-filters";
import { useTableExplorerMode } from "@/hooks/use-view-mode";
import { useCommunicationCounts } from "@/hooks/use-communication-counts";
import { usePermissions } from "@/hooks/use-permissions";
import { useMultiSelect } from "@/hooks/use-multi-select";
import { useInitiative } from "@/components/initiatives/initiative-context";
import { ViewModeIndicator } from "@/components/initiatives/view-mode-indicator";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  Cpu,
  MoreVertical,
  Copy,
  Calendar,
  Clock,
  AlertCircle,
  Activity,
  GitBranch,
  Zap,
  Database,
  CalendarCheck,
  FileJson,
  Network,
  Lock,
  Unlock,
  X,
  Grid3x3,
  List,
  TableIcon
} from "lucide-react";
import { Link, useLocation } from "wouter";
import TechnicalProcessForm from "@/components/technical-processes/technical-process-form";
import { ImportExportDialog } from "@/components/import-export-dialog";
import CommunicationBadge from "@/components/communications/communication-badge";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

interface TechnicalProcess {
  id: number;
  name: string;
  jobName: string;
  applicationId: number | null;
  applicationName: string | null;
  description: string | null;
  frequency: 'scheduled' | 'on-demand' | 'real-time' | 'batch';
  schedule: string | null;
  criticality: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'inactive' | 'deprecated';
  owner: string | null;
  technicalOwner: string | null;
  lastRunDate: string | null;
  nextRunDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function TechnicalProcesses() {
  const {
    searchTerm,
    filters,
    updateSearchTerm,
    updateFilters,
    clearAllFilters,
    hasActiveFilters
  } = usePersistentFilters('technical-processes');
  
  const { canCreate, canUpdate, canDelete, isAdmin } = usePermissions();
  const { currentInitiative, isProductionView } = useInitiative();
  const { user } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedProcess, setSelectedProcess] = useState<TechnicalProcess | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [showImportExport, setShowImportExport] = useState(false);
  const [viewingProcess, setViewingProcess] = useState<TechnicalProcess | null>(null);
  const [duplicatingProcess, setDuplicatingProcess] = useState<TechnicalProcess | null>(null);
  const { viewMode, setViewMode } = useTableExplorerMode('technical-processes', 'table');
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Fetch technical processes
  const { data: processes = [], isLoading } = useQuery({
    queryKey: ["/api/technical-processes"],
  });

  // Fetch locks for version control
  const { data: locks } = useQuery({
    queryKey: ['version-control-locks', currentInitiative?.initiativeId],
    queryFn: async () => {
      if (!currentInitiative) return [];
      try {
        const response = await api.get(`/api/version-control/locks?initiativeId=${currentInitiative.initiativeId}`);
        return response.data;
      } catch (error) {
        console.error('Failed to fetch locks:', error);
        return [];
      }
    },
    enabled: !!currentInitiative,
  });

  // Fetch current user for version control
  const { data: currentUser } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: async () => {
      const response = await api.get('/api/auth/me');
      return response.data.user;
    }
  });

  // Helper function to check if process is locked
  const isProcessLocked = (processId: number) => {
    if (!locks || !Array.isArray(locks)) return null;
    
    const lock = locks.find((l: any) => 
      l.lock.artifactType === 'technical_process' && 
      l.lock.artifactId === processId
    );
    
    return lock || null;
  };

  // Helper to get process state for visual indicators
  const getTechnicalProcessState = (process: TechnicalProcess): ArtifactState => {
    const lock = isProcessLocked(process.id);
    // TODO: Add logic to detect initiative changes and conflicts
    const hasInitiativeChanges = false; // This would check if process has versions in current initiative
    const hasConflicts = false; // This would check for version conflicts
    
    return getArtifactState(
      process.id,
      'technical_process',
      lock,
      currentUser?.id,
      hasInitiativeChanges,
      hasConflicts
    );
  };

  // Get communication counts
  const processIds = Array.isArray(processes) ? processes.map((p: TechnicalProcess) => p.id) : [];
  const communicationCounts = useCommunicationCounts("technical_process", processIds);

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/technical-processes/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete technical process");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/technical-processes"] });
      toast({
        title: "Success",
        description: "Technical process deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Version Control mutations
  const checkoutMutation = useMutation({
    mutationFn: async (process: TechnicalProcess) => {
      const response = await api.post('/api/version-control/technical-processes/' + process.id + '/checkout', {
        initiativeId: currentInitiative?.initiativeId
      });
      return response.data;
    },
    onSuccess: (data, process) => {
      queryClient.invalidateQueries({ queryKey: ['version-control-locks'] });
      toast({
        title: "Process checked out",
        description: `${process.name} is now locked for editing in ${currentInitiative?.name}`
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to checkout process",
        variant: "destructive"
      });
    }
  });

  const checkinMutation = useMutation({
    mutationFn: async ({ process, data }: { process: TechnicalProcess; data: any }) => {
      const response = await api.post('/api/version-control/technical-processes/' + process.id + '/checkin', {
        initiativeId: currentInitiative?.initiativeId,
        data,
        changeReason: `Updated ${process.name} via UI`
      });
      return response.data;
    },
    onSuccess: (data, { process }) => {
      queryClient.invalidateQueries({ queryKey: ['version-control-locks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/technical-processes'] });
      toast({
        title: "Changes checked in",
        description: `${process.name} has been updated in ${currentInitiative?.name}`
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to checkin changes",
        variant: "destructive"
      });
    }
  });

  const cancelCheckoutMutation = useMutation({
    mutationFn: async (process: TechnicalProcess) => {
      const response = await api.post('/api/version-control/cancel-checkout', {
        artifactType: 'technical_process',
        artifactId: process.id,
        initiativeId: currentInitiative?.initiativeId
      });
      return response.data;
    },
    onSuccess: (data, process) => {
      queryClient.invalidateQueries({ queryKey: ['version-control-locks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/technical-processs'] });
      toast({
        title: "Checkout cancelled",
        description: `${process.name} checkout has been cancelled and changes discarded`
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

  const handleEdit = (process: TechnicalProcess) => {
    // Check if we're in initiative mode and need to checkout first
    const lock = isProcessLocked(process.id);
    if (currentInitiative && !isProductionView && !lock) {
      // Need to checkout first
      checkoutMutation.mutate(process);
    }
    setSelectedProcess(process);
    setIsFormOpen(true);
  };

  const handleDelete = (id: number) => {
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId);
      setDeleteId(null);
    }
  };

  const handleCopy = (process: TechnicalProcess) => {
    navigator.clipboard.writeText(JSON.stringify(process, null, 2));
    toast({
      title: "Copied",
      description: "Technical process data copied to clipboard",
    });
  };

  const handleDuplicateAndEdit = (process: TechnicalProcess) => {
    const duplicatedProcess = {
      ...process,
      id: 0, // New process will get a new ID
      name: `${process.name} (Copy)`,
      jobName: `${process.jobName}_copy`,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastRunDate: null,
      nextRunDate: null
    };
    setDuplicatingProcess(duplicatedProcess);
  };

  // Separate version state filter from other filters
  const versionStateFilter = filters.find(f => f.column === 'versionState');
  const otherFilters = filters.filter(f => f.column !== 'versionState');

  // Apply search and standard filters
  let filteredByConditions = applyFilters(
    processes.filter((process: TechnicalProcess) =>
      process.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      process.jobName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (process.description && process.description.toLowerCase().includes(searchTerm.toLowerCase()))
    ),
    otherFilters
  );

  // Apply version state filter if present
  if (versionStateFilter && currentInitiative && !isProductionView) {
    try {
      filteredByConditions = filteredByConditions.filter((process: TechnicalProcess) => {
        const processState = getTechnicalProcessState(process);
        return processState.state === versionStateFilter.value;
      });
    } catch (e) {
      console.error('Error in version state filter:', e);
    }
  }

  const filteredProcesses = filteredByConditions;

  // Initialize multi-select hook
  const multiSelect = useMultiSelect({
    items: filteredProcesses,
    getItemId: (process) => process.id,
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      new: "outline",
      active: "default",
      inactive: "secondary",
      deprecated: "destructive",
    };
    return <Badge variant={variants[status] || "outline"} className={status === 'new' ? 'bg-purple-600 text-white border-purple-600' : ''}>{status}</Badge>;
  };

  const getCriticalityBadge = (criticality: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      critical: "destructive",
      high: "destructive",
      medium: "secondary",
      low: "outline",
    };
    return <Badge variant={variants[criticality] || "outline"}>{criticality}</Badge>;
  };

  const getFrequencyIcon = (frequency: string) => {
    switch (frequency) {
      case 'real-time':
        return <Zap className="h-4 w-4 text-yellow-500" />;
      case 'scheduled':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'batch':
        return <Database className="h-4 w-4 text-purple-500" />;
      case 'on-demand':
        return <Activity className="h-4 w-4 text-green-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const filterColumns: FilterColumn[] = [
    { key: "name", label: "Process Name", type: "text" },
    { key: "jobName", label: "Job Name", type: "text" },
    { key: "applicationName", label: "Application", type: "text" },
    { key: "frequency", label: "Frequency", type: "select", options: ["scheduled", "on-demand", "real-time", "batch"] },
    { key: "criticality", label: "Criticality", type: "select", options: ["low", "medium", "high", "critical"] },
    { key: "status", label: "Status", type: "select", options: ["new", "active", "inactive", "deprecated"] },
    { key: "owner", label: "Owner", type: "text" },
    { key: "technicalOwner", label: "Technical Owner", type: "text" },
    { key: "versionState", label: "Version State", type: "select", options: [
      { value: "production", label: "Production Baseline" },
      { value: "checked_out_me", label: "Checked Out by Me" },
      { value: "checked_out_other", label: "Locked by Others" },
      { value: "initiative_changes", label: "Initiative Changes" },
      { value: "conflicted", label: "Conflicted" }
    ]},
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-shrink-0 bg-gray-800 border-b border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
              <Cpu className="h-7 w-7 text-purple-500" />
              Technical Processes
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Manage technical capabilities and automated processes
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowImportExport(true)}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              <FileJson className="mr-2" size={16} />
              Import/Export
            </Button>
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => setSelectedProcess(null)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Technical Process
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl bg-gray-800 border-gray-700 max-h-[90vh] overflow-y-auto">
                <TechnicalProcessForm
                  process={selectedProcess}
                  onSuccess={() => {
                    setIsFormOpen(false);
                    queryClient.invalidateQueries({ queryKey: ["/api/technical-processes"] });
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search technical processes..."
              value={searchTerm}
              onChange={(e) => updateSearchTerm(e.target.value)}
              className="pl-10 bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
            />
          </div>
          <DataFilter
            columns={filterColumns}
            filters={filters}
            onFiltersChange={updateFilters}
            onClearAll={clearAllFilters}
            hasActiveFilters={hasActiveFilters}
          />
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
              title="Card/List View"
            >
              <Grid3x3 className="h-4 w-4 mr-2" />
              Explorer
            </Button>
          </div>
        </div>
      </div>

      {/* View Mode Indicator */}
      {currentInitiative && (
        <div className="px-6 py-2 bg-gray-900">
          <ViewModeIndicator />
        </div>
      )}

      {/* Bulk Actions Toolbar */}
      {multiSelect.selectedItems.length > 0 && (
        <div className="flex-shrink-0 bg-gray-800 border-b border-gray-700 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-gray-300">
                {multiSelect.selectedItems.length} technical process{multiSelect.selectedItems.length > 1 ? 'es' : ''} selected
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const selectedIds = multiSelect.selectedItems.map(process => process.id);
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

      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-64 text-gray-400">
            Loading technical processes...
          </div>
        ) : filteredProcesses.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <Cpu className="h-12 w-12 mb-4 text-gray-600" />
            <p className="text-lg font-medium">No technical processes found</p>
            <p className="text-sm mt-2">
              {searchTerm || hasActiveFilters ? "Try adjusting your search or filters" : "Create your first technical process to get started"}
            </p>
          </div>
        ) : viewMode === "explorer" ? (
          <ArtifactsExplorer
            artifacts={filteredProcesses}
            artifactType="technicalProcess"
            isLoading={isLoading}
            onView={setViewingProcess}
            onEdit={(process) => {
              if (isProcessLocked(process.id)) {
                setSelectedProcess(process);
                setIsFormOpen(true);
              } else {
                toast({
                  title: "Technical process not checked out",
                  description: "You need to check out this technical process before editing",
                  variant: "destructive"
                });
              }
            }}
            onDelete={(process) => setDeleteId(process.id)}
            onCheckout={(process) => checkoutMutation.mutate(process)}
            onCheckin={(process, changes) => checkinMutation.mutate({ process, changes })}
            onCancelCheckout={(process) => cancelCheckoutMutation.mutate(process)}
            customActions={(process) => (
              <>
                {process.businessProcessId && (
                  <ContextMenuItem 
                    onClick={() => navigate(`/business-processes/${process.businessProcessId}/diagram`)}
                    className="text-gray-300 hover:bg-gray-700"
                  >
                    <Network className="mr-2 h-4 w-4" />
                    View Process Diagram
                  </ContextMenuItem>
                )}
                {canCreate('technical-processes') && (
                  <ContextMenuItem 
                    onClick={() => handleDuplicateAndEdit(process)}
                    className="text-gray-300 hover:bg-gray-700"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Duplicate Process
                  </ContextMenuItem>
                )}
              </>
            )}
          />
        ) : (
          <div className="p-6">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="w-12">
                    <Checkbox
                      checked={filteredProcesses.length > 0 && multiSelect.selectedItems.length === filteredProcesses.length}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          multiSelect.selectAll();
                        } else {
                          multiSelect.clearSelection();
                        }
                      }}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead className="text-gray-300">Process Name</TableHead>
                  <TableHead className="text-gray-300">Job Name</TableHead>
                  <TableHead className="text-gray-300">Application</TableHead>
                  <TableHead className="text-gray-300">Frequency</TableHead>
                  <TableHead className="text-gray-300">Criticality</TableHead>
                  <TableHead className="text-gray-300">Status</TableHead>
                  <TableHead className="text-gray-300">Owner</TableHead>
                  <TableHead className="text-gray-300">Version Status</TableHead>
                  <TableHead className="text-gray-300">Communications</TableHead>
                  <TableHead className="text-gray-300">Last Run</TableHead>
                  <TableHead className="text-gray-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProcesses.map((process) => (
                  <ContextMenu key={process.id}>
                    <ContextMenuTrigger asChild>
                      <TableRow
                        className={cn(
                          "hover:bg-gray-700 cursor-pointer",
                          getRowClassName(getTechnicalProcessState(process), multiSelect.isSelected(process))
                        )}
                        onDoubleClick={() => setViewingProcess(process)}
                      >
                        <TableCell className="w-12">
                          <Checkbox
                            checked={multiSelect.isSelected(process)}
                            onCheckedChange={() => multiSelect.toggleSelection(process)}
                            onClick={(e) => e.stopPropagation()}
                            aria-label={`Select ${process.name}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium text-white">
                          <ArtifactInitiativeTooltip
                            artifactType="technical_process"
                            artifactId={process.id}
                            artifactState={process.artifactState}
                          >
                            <div className="flex items-center gap-2">
                              <Cpu className="h-4 w-4 text-purple-500" />
                              <span>{process.name}</span>
                              <ArtifactStatusIndicator 
                                state={getTechnicalProcessState(process)} 
                                initiativeName={currentInitiative?.name}
                              />
                            </div>
                          </ArtifactInitiativeTooltip>
                        </TableCell>
                        <TableCell className="text-gray-300">{process.jobName}</TableCell>
                        <TableCell className="text-gray-300">
                          {process.applicationName || "Not specified"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getFrequencyIcon(process.frequency)}
                            <span className="text-gray-300">{process.frequency}</span>
                          </div>
                        </TableCell>
                        <TableCell>{getCriticalityBadge(process.criticality)}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={process.status === "active" ? "success" : process.status === "inactive" ? "secondary" : "destructive"}
                          >
                            {process.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-300">{process.owner || "-"}</TableCell>
                        <TableCell>
                          <StatusColumn state={getTechnicalProcessState(process)} />
                        </TableCell>
                        <TableCell>
                          <CommunicationBadge 
                            entityType="technical_process" 
                            entityId={process.id} 
                            entityName={process.name}
                          />
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {process.lastRunDate ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <div className="flex items-center gap-1">
                                    <CalendarCheck className="h-3 w-3" />
                                    {new Date(process.lastRunDate).toLocaleDateString()}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Last run: {new Date(process.lastRunDate).toLocaleString()}</p>
                                  {process.nextRunDate && (
                                    <p>Next run: {new Date(process.nextRunDate).toLocaleString()}</p>
                                  )}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setViewingProcess(process)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              {currentInitiative && !isProductionView && (
                                <>
                                  {!isProcessLocked(process.id) && (
                                    <DropdownMenuItem onClick={() => checkoutMutation.mutate(process)}>
                                      <Lock className="mr-2 h-4 w-4" />
                                      Checkout
                                    </DropdownMenuItem>
                                  )}
                                  {isProcessLocked(process.id) && (
                                    <>
                                      <DropdownMenuItem onClick={() => {
                                        setSelectedProcess(process);
                                        setIsFormOpen(true);
                                      }}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => cancelCheckoutMutation.mutate(process)}>
                                        <Unlock className="mr-2 h-4 w-4" />
                                        Cancel Checkout
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </>
                              )}
                              {(!currentInitiative || isProductionView) && canUpdate('technical-processes') && (
                                <DropdownMenuItem onClick={() => {
                                  setSelectedProcess(process);
                                  setIsFormOpen(true);
                                }}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                              )}
                              {process.businessProcessId && (
                                <DropdownMenuItem onClick={() => navigate(`/business-processes/${process.businessProcessId}/diagram`)}>
                                  <Network className="mr-2 h-4 w-4" />
                                  View Process Diagram
                                </DropdownMenuItem>
                              )}
                              {canCreate('technical-processes') && (
                                <DropdownMenuItem onClick={() => handleDuplicateAndEdit(process)}>
                                  <Copy className="mr-2 h-4 w-4" />
                                  Duplicate
                                </DropdownMenuItem>
                              )}
                              {canDelete('technical-processes') && (
                                <DropdownMenuItem 
                                  onClick={() => setDeleteId(process.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      <ContextMenuItem onClick={() => setViewingProcess(process)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </ContextMenuItem>
                      {currentInitiative && !isProductionView && (
                        <>
                          {!isProcessLocked(process.id) && (
                            <ContextMenuItem onClick={() => checkoutMutation.mutate(process)}>
                              <Lock className="mr-2 h-4 w-4" />
                              Checkout
                            </ContextMenuItem>
                          )}
                          {isProcessLocked(process.id) && (
                            <>
                              <ContextMenuItem onClick={() => {
                                setSelectedProcess(process);
                                setIsFormOpen(true);
                              }}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </ContextMenuItem>
                              <ContextMenuItem onClick={() => cancelCheckoutMutation.mutate(process)}>
                                <Unlock className="mr-2 h-4 w-4" />
                                Cancel Checkout
                              </ContextMenuItem>
                            </>
                          )}
                        </>
                      )}
                      {(!currentInitiative || isProductionView) && canUpdate('technical-processes') && (
                        <ContextMenuItem onClick={() => {
                          setSelectedProcess(process);
                          setIsFormOpen(true);
                        }}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </ContextMenuItem>
                      )}
                      <ContextMenuSeparator />
                      {process.businessProcessId && (
                        <ContextMenuItem onClick={() => navigate(`/business-processes/${process.businessProcessId}/diagram`)}>
                          <Network className="mr-2 h-4 w-4" />
                          View Process Diagram
                        </ContextMenuItem>
                      )}
                      {canCreate('technical-processes') && (
                        <ContextMenuItem onClick={() => handleDuplicateAndEdit(process)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicate
                        </ContextMenuItem>
                      )}
                      {canDelete('technical-processes') && (
                        <>
                          <ContextMenuSeparator />
                          <ContextMenuItem 
                            onClick={() => setDeleteId(process.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </ContextMenuItem>
                        </>
                      )}
                    </ContextMenuContent>
                  </ContextMenu>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
      
      {/* Old table implementation removed - using ArtifactsExplorer instead */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-gray-800 border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Technical Process?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              This action cannot be undone. This will permanently delete the technical process
              and remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-700 text-gray-300 hover:bg-gray-600 border-gray-600">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ImportExportDialog
        open={showImportExport}
        onOpenChange={setShowImportExport}
        entity="technical-processes"
        entityName="Technical Processes"
        onImportSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["/api/technical-processes"] });
        }}
      />

      {/* Technical Process Details Dialog */}
      <Dialog open={!!viewingProcess} onOpenChange={(open) => !open && setViewingProcess(null)}>
        <DialogContent className="max-w-4xl bg-gray-800 border-gray-700 max-h-[90vh] overflow-y-auto">
          {viewingProcess && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-600">
                <Cpu className="h-6 w-6 text-purple-500" />
                <div>
                  <h2 className="text-2xl font-semibold text-white">{viewingProcess.name}</h2>
                  <p className="text-gray-400">Job Name: {viewingProcess.jobName}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium text-white mb-3">Process Information</h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm text-gray-400">Application:</span>
                        <p className="text-white">{viewingProcess.applicationName || "Not specified"}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-400">Description:</span>
                        <p className="text-white">{viewingProcess.description || "No description"}</p>
                      </div>
                      <div className="flex gap-4">
                        <div>
                          <span className="text-sm text-gray-400">Frequency:</span>
                          <div className="flex items-center gap-2">
                            {getFrequencyIcon(viewingProcess.frequency)}
                            <span className="text-white">{viewingProcess.frequency}</span>
                          </div>
                        </div>
                        <div>
                          <span className="text-sm text-gray-400">Criticality:</span>
                          <div className="mt-1">{getCriticalityBadge(viewingProcess.criticality)}</div>
                        </div>
                      </div>
                      {viewingProcess.schedule && (
                        <div>
                          <span className="text-sm text-gray-400">Schedule:</span>
                          <p className="text-white font-mono">{viewingProcess.schedule}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium text-white mb-3">Ownership & Status</h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm text-gray-400">Status:</span>
                        <div className="mt-1">{getStatusBadge(viewingProcess.status)}</div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-400">Business Owner:</span>
                        <p className="text-white">{viewingProcess.owner || "Not specified"}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-400">Technical Owner:</span>
                        <p className="text-white">{viewingProcess.technicalOwner || "Not specified"}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-white mb-3">Execution History</h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm text-gray-400">Last Run:</span>
                        <p className="text-white">
                          {viewingProcess.lastRunDate 
                            ? new Date(viewingProcess.lastRunDate).toLocaleString()
                            : "Never executed"
                          }
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-400">Next Run:</span>
                        <p className="text-white">
                          {viewingProcess.nextRunDate
                            ? new Date(viewingProcess.nextRunDate).toLocaleString()
                            : "Not scheduled"
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-600">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-400">
                    Created: {new Date(viewingProcess.createdAt).toLocaleDateString()} | 
                    Updated: {new Date(viewingProcess.updatedAt).toLocaleDateString()}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        setViewingProcess(null);
                        setSelectedProcess(viewingProcess);
                        setIsFormOpen(true);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Process
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Duplicate and Edit Technical Process Dialog */}
      <Dialog open={!!duplicatingProcess} onOpenChange={(open) => !open && setDuplicatingProcess(null)}>
        <DialogContent className="max-w-4xl bg-gray-800 border-gray-700 max-h-[90vh] overflow-y-auto">
          {duplicatingProcess && (
            <TechnicalProcessForm 
              process={duplicatingProcess} 
              onSuccess={() => {
                setDuplicatingProcess(null);
                queryClient.invalidateQueries({ queryKey: ["/api/technical-processes"] });
              }} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}