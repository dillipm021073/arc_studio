import { useState, useEffect } from "react";
import { usePersistentFilters } from "@/hooks/use-persistent-filters";
import { useCommunicationCounts } from "@/hooks/use-communication-counts";
import { usePermissions } from "@/hooks/use-permissions";
import { useMultiSelect } from "@/hooks/use-multi-select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useInitiative } from "@/components/initiatives/initiative-context";
import { api } from "@/lib/api";
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
import { 
  Plus, 
  Search, 
  Edit, 
  Eye, 
  Trash2,
  Box,
  MoreVertical,
  Info,
  Server,
  Cloud,
  HardDrive,
  FileJson,
  Plug,
  Copy,
  AlertTriangle,
  Calendar,
  Upload,
  FileText,
  GitBranch,
  Lock,
  Unlock,
  X,
  CheckCircle,
  Rocket
} from "lucide-react";
import { Link } from "wouter";
import ApplicationForm from "@/components/applications/application-form";
import ApplicationInterfacesDialog from "@/components/applications/application-interfaces-dialog";
import ApplicationDetailsModal from "@/components/modals/ApplicationDetailsModal";
import CapabilitiesDocumentsDialog from "@/components/applications/capabilities-documents-dialog";
import CapabilitiesUploadDialog from "@/components/applications/capabilities-upload-dialog";
import CommunicationBadge from "@/components/communications/communication-badge";
import { DecommissionWarningModal } from "@/components/modals/decommission-warning-modal";
import { LockConflictDialog } from "@/components/version-control/lock-conflict-dialog";
import { ArtifactInitiativeTooltip } from "@/components/ui/artifact-initiative-tooltip";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useToast } from "@/hooks/use-toast";
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
import { ImportExportDialog } from "@/components/import-export-dialog";
import { MultiSelectTable } from "@/components/ui/multi-select-table";
import { BulkActionBar } from "@/components/ui/bulk-action-bar";
import { BulkEditDialog, type BulkEditField } from "@/components/bulk-edit-dialog";
import { cn } from "@/lib/utils";
import ArtifactsExplorer from "@/components/artifacts/artifacts-explorer";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Application {
  id: number;
  amlNumber: string;
  name: string;
  description: string;
  lob: string;
  os: string;
  deployment: string;
  uptime: string;
  purpose: string;
  providesExtInterface: boolean;
  provInterfaceType: string;
  consumesExtInterfaces: boolean;
  consInterfaceType: string;
  status: string;
  artifactState?: string;
  plannedActivationDate?: string;
  initiativeOrigin?: string;
  firstActiveDate: string;
  lastChangeDate: string;
  hasInitiativeChanges?: boolean;
  versionState?: string;
  initiativeData?: any;
}

export default function Applications() {
  const {
    searchTerm,
    filters,
    updateSearchTerm,
    updateFilters,
    clearAllFilters,
    hasActiveFilters
  } = usePersistentFilters('applications');
  
  const { canCreate, canUpdate, canDelete, isAdmin } = usePermissions();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<Application | null>(null);
  const [viewingApp, setViewingApp] = useState<Application | null>(null);
  const [deletingApp, setDeletingApp] = useState<Application | null>(null);
  const [viewingInterfacesApp, setViewingInterfacesApp] = useState<Application | null>(null);
  const [duplicatingApp, setDuplicatingApp] = useState<Application | null>(null);
  const [showImportExport, setShowImportExport] = useState(false);
  const [decommissioningApp, setDecommissioningApp] = useState<Application | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "explorer">("table");
  const [decommissionImpact, setDecommissionImpact] = useState<any>(null);
  const [showBulkEditDialog, setShowBulkEditDialog] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [showBulkDuplicateConfirm, setShowBulkDuplicateConfirm] = useState(false);
  const [showCapabilitiesUpload, setShowCapabilitiesUpload] = useState<Application | null>(null);
  const [showCapabilitiesView, setShowCapabilitiesView] = useState<Application | null>(null);
  const [refreshKey, setRefreshKey] = useState(0); // Force refresh key
  const [artifactViewMode, setArtifactViewMode] = useState<'production' | 'pending' | 'all'>('all'); // View mode for artifacts
  const [showInitiativeDetails, setShowInitiativeDetails] = useState(false); // Show initiative details for pending artifacts
  const [lockConflictError, setLockConflictError] = useState<any>(null);
  const [showLockConflictDialog, setShowLockConflictDialog] = useState(false);

  // Initiative context
  const { currentInitiative, isProductionView } = useInitiative();
  
  // Refetch locks when initiative changes
  useEffect(() => {
    if (currentInitiative && !isProductionView) {
      refetchLocks?.();
    }
  }, [currentInitiative?.initiativeId, isProductionView]);

  const { data: applications, isLoading } = useQuery<Application[]>({
    queryKey: ["/api/applications", currentInitiative?.initiativeId, isProductionView, artifactViewMode],
    queryFn: async () => {
      let url = '/api/applications';
      // Include initiative changes in production view when showing pending or all artifacts
      if (isProductionView && currentInitiative && artifactViewMode !== 'production') {
        url += `?includeInitiativeChanges=true&initiativeId=${currentInitiative.initiativeId}`;
      }
      const response = await api.get(url);
      return response.data;
    }
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
  const { data: locks, error: locksError, refetch: refetchLocks } = useQuery({
    queryKey: ['version-control-locks', currentInitiative?.initiativeId],
    queryFn: async () => {
      if (!currentInitiative) return [];
      try {
        // Add timestamp to prevent caching
        const response = await api.get(`/api/version-control/locks?initiativeId=${currentInitiative.initiativeId}&t=${Date.now()}`);
        console.log('Locks API response:', response.data);
        return response.data;
      } catch (error) {
        console.error('Error fetching locks:', error);
        return [];
      }
    },
    enabled: !!currentInitiative && !isProductionView,
    staleTime: 0, // Always refetch when queried
    cacheTime: 0,  // Don't cache the results
    refetchOnMount: 'always',
    refetchOnWindowFocus: true
  });

  // Log any errors for debugging
  useEffect(() => {
    if (locksError) {
      console.error('Locks query error:', locksError);
    }
    if (locks) {
      console.log('Locks data structure:', locks);
      console.log('Current user ID:', currentUser?.id);
      // Log each lock for debugging
      locks.forEach((lock: any) => {
        console.log(`Lock for ${lock.lock.artifactType} ${lock.lock.artifactId}:`, {
          lockedBy: lock.lock.lockedBy,
          username: lock.user?.username,
          userId: lock.user?.id
        });
      });
    }
  }, [locksError, locks, currentUser]);

  // Fetch communication counts for all applications
  const applicationIds = applications?.map(app => app.id) || [];
  const { data: communicationCounts } = useCommunicationCounts("application", applicationIds);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/applications/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete application");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      toast({
        title: "Success",
        description: "Application deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete application",
        variant: "destructive",
      });
    },
  });

  const decommissionMutation = useMutation({
    mutationFn: async (data: { id: number; decommissionDate: Date; decommissionReason: string; decommissionedBy: string }) => {
      const response = await fetch(`/api/applications/${data.id}/decommission`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decommissionDate: data.decommissionDate,
          decommissionReason: data.decommissionReason,
          decommissionedBy: data.decommissionedBy
        }),
      });
      if (!response.ok) throw new Error("Failed to decommission application");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/interfaces"] });
      toast({
        title: "Success",
        description: data.message,
      });
      setDecommissioningApp(null);
      setDecommissionImpact(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to decommission application",
        variant: "destructive",
      });
    },
  });

  const handleDecommission = async (app: Application) => {
    // First fetch the impact analysis
    try {
      const response = await fetch(`/api/applications/${app.id}/decommission-impact`);
      if (!response.ok) throw new Error("Failed to fetch decommission impact");
      const impact = await response.json();
      setDecommissionImpact(impact);
      setDecommissioningApp(app);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch decommission impact analysis",
        variant: "destructive",
      });
    }
  };

  const handleDuplicateAndEdit = (app: Application) => {
    const duplicatedApp = {
      ...app,
      id: 0, // New application will get a new ID
      name: `${app.name} (Copy)`,
      firstActiveDate: new Date().toISOString().split('T')[0],
      lastChangeDate: new Date().toISOString().split('T')[0],
      // When duplicating within an initiative, set proper status and artifactState
      ...(currentInitiative && !isProductionView ? {
        status: "active", // Keep status as active
        artifactState: "pending", // Set artifactState to pending for initiative
        initiativeOrigin: currentInitiative.initiativeId
      } : {})
    };
    setDuplicatingApp(duplicatedApp);
  };

  // Bulk operations mutations using the new API endpoints
  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ ids, updates }: { ids: number[]; updates: Record<string, any> }) => {
      const response = await fetch("/api/bulk/applications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, updates }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update applications");
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      toast({
        title: "Success",
        description: data.message,
      });
      multiSelect.clearSelection();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update applications",
        variant: "destructive",
      });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      const response = await fetch("/api/bulk/applications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete applications");
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
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
        description: error.message || "Failed to delete applications",
        variant: "destructive",
      });
    },
  });

  const bulkDuplicateMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      const response = await fetch("/api/bulk/applications/duplicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to duplicate applications");
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      toast({
        title: "Success",
        description: data.message,
      });
      multiSelect.clearSelection();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to duplicate applications",
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
    setShowBulkDuplicateConfirm(true);
  };

  const confirmBulkDuplicate = () => {
    const ids = multiSelect.selectedItems?.map(app => app.id) || [];
    if (ids.length > 0) {
      bulkDuplicateMutation.mutate(ids);
    }
    setShowBulkDuplicateConfirm(false);
  };

  const handleBulkUpdate = (updates: Record<string, any>) => {
    const ids = multiSelect.selectedItems?.map(app => app.id) || [];
    if (ids.length > 0) {
      bulkUpdateMutation.mutate({ ids, updates });
    }
  };

  // Version Control mutations
  const checkoutMutation = useMutation({
    mutationFn: async (app: Application) => {
      console.log('Checkout mutation starting for:', app.name, 'ID:', app.id);
      
      // Check if already locked before attempting checkout
      const currentLock = isApplicationLocked(app.id);
      if (currentLock) {
        console.log('App already locked, skipping checkout');
        throw new Error('Application is already checked out');
      }
      
      const response = await api.post('/api/version-control/checkout', {
        artifactType: 'application',
        artifactId: app.id,
        initiativeId: currentInitiative?.initiativeId
      });
      return response.data;
    },
    onSuccess: async (data, app) => {
      console.log('Checkout response:', data);
      
      // If the response includes lock data, immediately update the cache
      if (data.lock) {
        console.log('Optimistically updating locks cache with new lock:', data.lock);
        queryClient.setQueryData(
          ['version-control-locks', currentInitiative?.initiativeId],
          (oldLocks: any[] = []) => {
            // Remove any existing lock for this artifact and add the new one
            const filteredLocks = oldLocks.filter((l: any) => 
              !(l.lock.artifactType === 'application' && l.lock.artifactId === app.id)
            );
            return [...filteredLocks, data.lock];
          }
        );
      }
      
      // Immediately force refresh
      setRefreshKey(prev => prev + 1);
      
      // Invalidate and refetch locks to ensure UI updates
      await queryClient.invalidateQueries({ queryKey: ['version-control-locks', currentInitiative?.initiativeId] });
      
      // Multiple attempts to ensure locks are refreshed
      const newLocks = await refetchLocks();
      console.log('Locks after refetch:', newLocks.data);
      
      // Add a small delay and refetch again to ensure backend has updated
      setTimeout(async () => {
        console.log('Refetching locks after delay...');
        const finalLocks = await refetchLocks();
        console.log('Final locks after delay:', finalLocks.data);
        setRefreshKey(prev => prev + 1);
        
        // Check if the new lock is present
        const newLock = finalLocks.data?.find((l: any) => 
          l.lock.artifactType === 'application' && 
          l.lock.artifactId === app.id
        );
        console.log(`Lock for app ${app.id} after checkout:`, newLock);
      }, 500);
      
      toast({
        title: "Application checked out",
        description: `${app.name} is now locked for editing in ${currentInitiative?.name}`
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
          description: error.response?.data?.error || "Failed to checkout application",
          variant: "destructive"
        });
      }
    }
  });

  const checkinMutation = useMutation({
    mutationFn: async ({ app, changes }: { app: Application; changes: any }) => {
      const response = await api.post('/api/version-control/checkin', {
        artifactType: 'application',
        artifactId: app.id,
        initiativeId: currentInitiative?.initiativeId,
        changes,
        changeDescription: `Updated ${app.name} via UI`
      });
      return response.data;
    },
    onSuccess: async (data, { app }) => {
      await queryClient.invalidateQueries({ queryKey: ['version-control-locks', currentInitiative?.initiativeId] });
      await queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
      await refetchLocks();
      toast({
        title: "Changes checked in",
        description: `${app.name} has been updated in ${currentInitiative?.name}`
      });
      setEditingApp(null);
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
    mutationFn: async (app: Application) => {
      const response = await api.post('/api/version-control/cancel-checkout', {
        artifactType: 'application',
        artifactId: app.id,
        initiativeId: currentInitiative?.initiativeId
      });
      return response.data;
    },
    onSuccess: async (data, app) => {
      await queryClient.invalidateQueries({ queryKey: ['version-control-locks', currentInitiative?.initiativeId] });
      await queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
      await refetchLocks();
      toast({
        title: "Checkout cancelled",
        description: `${app.name} checkout has been cancelled and changes discarded`
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

  // Helper to check if an application is locked
  const isApplicationLocked = (appId: number) => {
    if (!locks) {
      console.log(`isApplicationLocked(${appId}): No locks data available`);
      return null;
    }
    
    console.log(`isApplicationLocked(${appId}): Checking against locks:`, {
      lockCount: locks.length,
      locks: locks.map(l => ({
        artifactType: l.lock.artifactType,
        artifactId: l.lock.artifactId,
        lockedBy: l.lock.lockedBy,
        username: l.user?.username
      }))
    });
    
    const found = locks.find((l: any) => 
      l.lock.artifactType === 'application' && 
      l.lock.artifactId === appId
    );
    
    if (found) {
      console.log(`isApplicationLocked(${appId}): Found lock`, {
        lock: found,
        lockedBy: found.lock.lockedBy,
        lockExpiry: found.lock.lockExpiry,
        username: found.user?.username
      });
    } else {
      console.log(`isApplicationLocked(${appId}): No lock found for app ${appId}`);
    }
    return found;
  };

  // Helper to get application state for visual indicators
  const getApplicationState = (app: Application): ArtifactState => {
    const lock = isApplicationLocked(app.id);
    const hasInitiativeChanges = app.hasInitiativeChanges || false;
    const hasConflicts = false; // This would check for version conflicts
    const artifactState = app.artifactState;
    const versionState = app.versionState;
    
    // Debug logging
    console.log(`getApplicationState for ${app.name} (${app.id}):`, {
      hasLock: !!lock,
      lock: lock,
      currentUserId: currentUser?.id,
      lockedBy: lock?.lock?.lockedBy,
      isMatch: lock?.lock?.lockedBy === currentUser?.id,
      isAdmin: isAdmin,
      refreshKey: refreshKey,
      artifactState,
      versionState
    });
    
    return getArtifactState(
      app.id,
      'application',
      lock,
      currentUser?.id,
      hasInitiativeChanges,
      hasConflicts,
      artifactState,
      versionState
    );
  };

  const getStatusColor = (status: string) => {
    if (!status) return 'bg-orange-600 text-white';
    switch (status.toLowerCase()) {
      case 'new': return 'bg-purple-600 text-white';
      case 'active': return 'bg-green-600 text-white';
      case 'inactive': return 'bg-red-600 text-white';
      case 'maintenance': return 'bg-blue-600 text-white';
      case 'deprecated': return 'bg-orange-600 text-white';
      case 'decommissioned': return 'bg-gray-600 text-white';
      default: return 'bg-orange-600 text-white';
    }
  };

  const getDeploymentColor = (deployment: string) => {
    if (!deployment) return 'bg-orange-600 text-white';
    switch (deployment.toLowerCase()) {
      case 'cloud': return 'bg-blue-600 text-white';
      case 'on-premise': return 'bg-orange-600 text-white';
      case 'on_premise': return 'bg-orange-600 text-white';
      default: return 'bg-orange-600 text-white';
    }
  };

  const filterColumns: FilterColumn[] = [
    { key: "amlNumber", label: "AML Number" },
    { key: "name", label: "Application Name" },
    { key: "lob", label: "Line of Business" },
    { key: "os", label: "Operating System" },
    { key: "deployment", label: "Deployment", type: "select", options: [
      { value: "cloud", label: "Cloud" },
      { value: "on-premise", label: "On-Premise" }
    ]},
    { key: "uptime", label: "Uptime", type: "number" },
    { key: "status", label: "Status", type: "select", options: [
      { value: "new", label: "New" },
      { value: "active", label: "Active" },
      { value: "inactive", label: "Inactive" },
      { value: "maintenance", label: "Maintenance" },
      { value: "deprecated", label: "Deprecated" },
      { value: "decommissioned", label: "Decommissioned" }
    ]},
    { key: "purpose", label: "Purpose" },
    { key: "providesExtInterface", label: "Provides Interface", type: "select", options: [
      { value: "true", label: "Yes" },
      { value: "false", label: "No" }
    ]},
    { key: "consumesExtInterfaces", label: "Consumes Interface", type: "select", options: [
      { value: "true", label: "Yes" },
      { value: "false", label: "No" }
    ]},
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

  // Apply standard filters first - ensure no null applications
  const validApplications = (applications || []).filter(app => app != null);
  let filteredByConditions = validApplications ? applyFilters(validApplications, otherFilters) : [];

  // Then apply custom hasCommunications filter if present
  if (hasCommunicationsFilter && communicationCounts) {
    try {
      filteredByConditions = filteredByConditions.filter(app => {
        const communicationCount = communicationCounts.get(app.id) ?? 0;
        const filterValue = hasCommunicationsFilter.value?.toLowerCase?.() || '';
        if (filterValue === 'yes') {
          return communicationCount > 0;
        } else if (filterValue === 'no') {
          return communicationCount === 0;
        }
        return true;
      });
    } catch (e) {
      console.error('Error in communications filter:', e);
    }
  }

  // Apply version state filter if present
  if (versionStateFilter) {
    try {
      filteredByConditions = filteredByConditions.filter(app => {
        // For initiative_changes filter, check if app has any initiative-related changes
        if (versionStateFilter.value === 'initiative_changes') {
          // Check if the application is locked (checked out)
          const isLocked = isApplicationLocked(app.id);
          
          return app.hasInitiativeChanges || 
                 app.versionState === 'new_in_initiative' || 
                 app.versionState === 'modified_in_initiative' ||
                 app.artifactState === 'pending' ||
                 app.initiativeOrigin ||
                 isLocked; // Include locked/checked out applications
        }
        
        // For other filters, use the artifact state
        const appState = getApplicationState(app);
        return appState.state === versionStateFilter.value;
      });
    } catch (e) {
      console.error('Error in version state filter:', e);
    }
  }

  // Apply search filter
  let searchFiltered = filteredByConditions?.filter(app => {
    if (!searchTerm) return true;
    try {
      const searchLower = (searchTerm || '').toLowerCase();
      return (
        ((app.amlNumber || '').toLowerCase()).includes(searchLower) ||
        ((app.name || '').toLowerCase()).includes(searchLower) ||
        ((app.description || '').toLowerCase()).includes(searchLower) ||
        ((app.lob || '').toLowerCase()).includes(searchLower) ||
        ((app.os || '').toLowerCase()).includes(searchLower) ||
        ((app.deployment || '').toLowerCase()).includes(searchLower) ||
        ((app.status || '').toLowerCase()).includes(searchLower) ||
        ((app.purpose || '').toLowerCase()).includes(searchLower)
      );
    } catch (e) {
      console.error('Error in search filter:', e, 'app:', app);
      return true;
    }
  }) || [];

  // Apply artifact view mode filter in production view
  const filteredApplications = searchFiltered.filter(app => {
    if (!isProductionView || !currentInitiative) return true;
    
    const isPending = app.artifactState === 'pending' || app.versionState === 'new_in_initiative';
    const isProduction = !isPending && app.artifactState !== 'draft';
    
    switch (artifactViewMode) {
      case 'production':
        return isProduction;
      case 'pending':
        return isPending;
      case 'all':
      default:
        return true;
    }
  });

  // Initialize multi-select hook - ensure no null items
  const multiSelect = useMultiSelect({
    items: filteredApplications?.filter(app => app != null) || [],
    getItemId: (app) => app?.id || 0,
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
        { value: "maintenance", label: "Maintenance" },
        { value: "deprecated", label: "Deprecated" },
      ],
      currentValues: new Set(multiSelect.selectedItems?.map(app => app.status) || []),
    },
    {
      key: "lob",
      label: "Line of Business",
      type: "text",
      currentValues: new Set(multiSelect.selectedItems?.map(app => app.lob) || []),
    },
    {
      key: "deployment",
      label: "Deployment",
      type: "select",
      options: [
        { value: "cloud", label: "Cloud" },
        { value: "on-premise", label: "On-Premise" },
      ],
      currentValues: new Set(multiSelect.selectedItems?.map(app => app.deployment) || []),
    },
    {
      key: "os",
      label: "Operating System",
      type: "text",
      currentValues: new Set(multiSelect.selectedItems?.map(app => app.os) || []),
    },
  ];

  // Add error boundary for debugging
  if (!applications && !isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center">
          <h2 className="text-2xl mb-4">Error Loading Applications</h2>
          <p>Unable to fetch applications. Please check the console for errors.</p>
        </div>
      </div>
    );
  }

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
                  <span className="text-white font-medium">Applications</span>
                </li>
              </ol>
            </nav>
            <h1 className="text-2xl font-semibold text-white mt-1">Applications Management (AML)</h1>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              onClick={() => setShowImportExport(true)}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              <FileJson className="mr-2" size={16} />
              Import/Export
            </Button>
            {canCreate('applications') && (
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    className="bg-blue-600 text-white hover:bg-blue-700"
                    disabled={isProductionView && currentInitiative}
                  >
                    <Plus className="mr-2" size={16} />
                    New Application
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-5xl bg-gray-800 border-gray-700 max-h-[90vh] overflow-y-auto">
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
                  <ApplicationForm 
                    onSuccess={() => setIsCreateDialogOpen(false)} 
                    initiativeId={currentInitiative?.initiativeId}
                  />
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        {/* View Mode Indicator */}
        <ViewModeIndicator />
        
        {/* Production View Filter */}
        {isProductionView && currentInitiative && (
          <div className="flex items-center gap-4 mt-2 p-3 bg-gray-800 rounded-lg">
            <span className="text-sm text-gray-300">View:</span>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setArtifactViewMode('production');
                  setShowInitiativeDetails(false);
                }}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  artifactViewMode === 'production' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <CheckCircle className="inline h-3 w-3 mr-1" />
                Production Only
              </button>
              <button
                onClick={() => {
                  setArtifactViewMode('pending');
                  setShowInitiativeDetails(true);
                }}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  artifactViewMode === 'pending' 
                    ? 'bg-teal-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <Rocket className="inline h-3 w-3 mr-1" />
                Pending Only
              </button>
              <button
                onClick={() => {
                  setArtifactViewMode('all');
                  setShowInitiativeDetails(false);
                }}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  artifactViewMode === 'all' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <Eye className="inline h-3 w-3 mr-1" />
                All
              </button>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs text-gray-400">
                Showing: {filteredApplications.length} {filteredApplications.length === 1 ? 'application' : 'applications'}
              </span>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    <strong>Production Only:</strong> Shows only active artifacts in production<br/>
                    <strong>Pending Only:</strong> Shows only new/modified artifacts from {currentInitiative.name}<br/>
                    <strong>All:</strong> Shows both production and pending artifacts
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        )}
        
        {/* Initiative Details for Pending Artifacts */}
        {isProductionView && currentInitiative && artifactViewMode === 'pending' && showInitiativeDetails && (
          <div className="mt-2 p-3 bg-teal-900/20 border border-teal-700 rounded-lg">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-sm font-medium text-teal-300 flex items-center gap-2">
                  <GitBranch className="h-4 w-4" />
                  Initiative: {currentInitiative.name}
                </h4>
                <p className="text-xs text-gray-400 mt-1">
                  ID: {currentInitiative.initiativeId}
                </p>
                {currentInitiative.description && (
                  <p className="text-sm text-gray-300 mt-2">{currentInitiative.description}</p>
                )}
                <div className="mt-2 text-xs text-gray-400">
                  <p>Status: <span className="text-teal-400">{currentInitiative.status}</span></p>
                  {currentInitiative.targetCompletionDate && (
                    <p>Target Completion: <span className="text-teal-400">
                      {new Date(currentInitiative.targetCompletionDate).toLocaleDateString()}
                    </span></p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowInitiativeDetails(false)}
                className="text-gray-400 hover:text-gray-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-700">
              <p className="text-xs text-gray-400">
                Showing {filteredApplications.length} pending {filteredApplications.length === 1 ? 'artifact' : 'artifacts'} that will be activated when this initiative is completed.
              </p>
            </div>
          </div>
        )}
        
        {/* Search and Filter Bar */}
        <div className="mb-6 space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search applications..."
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
                <FileText className="h-4 w-4 mr-2" />
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
        {canUpdate('applications') && (
          <BulkActionBar
            selectedCount={multiSelect.selectedCount}
            totalCount={filteredApplications.length}
            onBulkEdit={handleBulkEdit}
            onBulkDelete={canDelete('applications') ? handleBulkDelete : undefined}
            onDuplicate={canCreate('applications') ? handleBulkDuplicate : undefined}
            onClearSelection={multiSelect.clearSelection}
            onSelectAll={multiSelect.selectAll}
            onInvertSelection={multiSelect.invertSelection}
          />
        )}

        {/* Applications Table */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-gray-400">Loading applications...</div>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 text-center py-12">
            <Box className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No applications found</h3>
            <p className="text-gray-400 mb-4">
              {searchTerm ? "No applications match your search criteria." : "Get started by creating your first application."}
            </p>
            {canCreate('applications') && (
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 text-white hover:bg-blue-700">
                    <Plus className="mr-2" size={16} />
                    Create Application
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-5xl bg-gray-800 border-gray-700 max-h-[90vh] overflow-y-auto">
                  <ApplicationForm onSuccess={() => setIsCreateDialogOpen(false)} />
                </DialogContent>
              </Dialog>
            )}
          </div>
        ) : viewMode === "explorer" ? (
          <ArtifactsExplorer
            artifacts={filteredApplications}
            artifactType="application"
            isLoading={isLoading}
            onView={setViewingApp}
            onEdit={(app) => {
              if (isApplicationLocked(app.id)) {
                setEditingApp(app);
              } else {
                toast({
                  title: "Application not checked out",
                  description: "You need to check out this application before editing",
                  variant: "destructive"
                });
              }
            }}
            onDelete={(app) => setDeletingApp(app)}
            onCheckout={(app) => checkoutMutation.mutate(app)}
            onCheckin={(app, changes) => checkinMutation.mutate({ app, changes })}
            onCancelCheckout={(app) => cancelCheckoutMutation.mutate(app)}
            customActions={(app) => (
              <>
                <DropdownMenuItem onClick={() => setViewingInterfacesApp(app)}>
                  <Plug className="mr-2 h-4 w-4" />
                  View Interfaces
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDuplicatingApp(app)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate
                </DropdownMenuItem>
                {app.status === 'active' && (
                  <DropdownMenuItem
                    onClick={() => handleDecommission(app)}
                    className="text-yellow-600"
                  >
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Decommission
                  </DropdownMenuItem>
                )}
              </>
            )}
          />
        ) : (
          <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={multiSelect.isAllSelected}
                      indeterminate={multiSelect.isSomeSelected}
                      onCheckedChange={multiSelect.toggleAll}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead className="w-[120px] text-gray-300">AML Number</TableHead>
                  <TableHead className="w-[200px] text-gray-300">Application Name</TableHead>
                  <TableHead className="w-[150px] text-gray-300">LOB</TableHead>
                  <TableHead className="w-[100px] text-gray-300">OS</TableHead>
                  <TableHead className="w-[120px] text-gray-300">Deployment</TableHead>
                  <TableHead className="w-[80px] text-gray-300">Uptime</TableHead>
                  <TableHead className="w-[100px] text-gray-300">Status</TableHead>
                  <TableHead className="w-[120px] text-gray-300">Version Status</TableHead>
                  <TableHead className="w-[120px] text-gray-300">Interfaces</TableHead>
                  <TableHead className="w-[100px] text-gray-300">Communications</TableHead>
                  <TableHead className="w-[120px] text-gray-300">Last Changed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApplications.map((app) => (
                  <ContextMenu key={`${app.id}-${refreshKey}`}>
                    <ContextMenuTrigger asChild>
                      <TableRow
                        className={(() => {
                          const state = getApplicationState(app);
                          const className = getRowClassName(state, multiSelect.isSelected(app));
                          console.log(`Row class for ${app.name}:`, {
                            state: state.state,
                            className,
                            lock: isApplicationLocked(app.id)
                          });
                          return className;
                        })()}
                        onDoubleClick={() => setViewingApp(app)}
                      >
                        <TableCell className="w-12">
                          <Checkbox
                            checked={multiSelect.isSelected(app)}
                            onCheckedChange={() => multiSelect.toggleSelection(app)}
                            onClick={(e) => e.stopPropagation()}
                            aria-label={`Select application ${app.name}`}
                          />
                        </TableCell>
                        <TableCell className="text-gray-300 font-mono">{app.amlNumber}</TableCell>
                        <TableCell className="font-medium text-white">
                          <ArtifactInitiativeTooltip
                            artifactType="application"
                            artifactId={app.id}
                            artifactState={app.artifactState}
                          >
                            <div className="flex items-center space-x-2">
                              <Box className="h-4 w-4 text-blue-500" />
                              <span>{app.name}</span>
                              <ArtifactStatusIndicator 
                                state={getApplicationState(app)} 
                                initiativeName={currentInitiative?.name}
                              />
                              <ArtifactStatusBadge 
                                state={getApplicationState(app)} 
                                showIcon={false}
                                showText={true}
                                size="sm"
                              />
                            </div>
                          </ArtifactInitiativeTooltip>
                        </TableCell>
                        <TableCell className="text-gray-300">{app.lob || '-'}</TableCell>
                        <TableCell className="text-gray-300">{app.os}</TableCell>
                        <TableCell>
                          <Badge className={getDeploymentColor(app.deployment)}>
                            {app.deployment === 'cloud' && <Cloud className="mr-1 h-3 w-3" />}
                            {(app.deployment === 'on-premise' || app.deployment === 'on_premise') && <HardDrive className="mr-1 h-3 w-3" />}
                            {app.deployment}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-300">{app.uptime}%</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(app.status)}>
                            {app.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <StatusColumn state={getApplicationState(app)} />
                        </TableCell>
                        <TableCell>
                          <TooltipProvider>
                            <div className="flex items-center space-x-1">
                              {app.providesExtInterface && (
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Badge variant="outline" className="text-xs text-white border-gray-600">
                                      P: {app.provInterfaceType}
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Provides: {app.provInterfaceType}</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                              {app.consumesExtInterfaces && (
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Badge variant="outline" className="text-xs text-white border-gray-600">
                                      C: {app.consInterfaceType}
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Consumes: {app.consInterfaceType}</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell>
                          <CommunicationBadge 
                            entityType="application" 
                            entityId={app.id} 
                            entityName={app.name}
                          />
                        </TableCell>
                        <TableCell className="text-gray-300">{new Date(app.lastChangeDate).toLocaleDateString()}</TableCell>
                      </TableRow>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      {/* Version Control Options */}
                      {currentInitiative && !isProductionView && (
                        <>
                          {(() => {
                            const lock = isApplicationLocked(app.id);
                            const isLockedByMe = lock && (lock.lock.lockedBy === currentUser?.id || isAdmin);
                            const isLockedByOther = lock && !isLockedByMe;
                            
                            console.log(`Context menu for ${app.name}:`, {
                              hasLock: !!lock,
                              lockedBy: lock?.lock?.lockedBy,
                              currentUserId: currentUser?.id,
                              isLockedByMe,
                              isLockedByOther,
                              isAdmin
                            });
                            
                            return (
                              <>
                                {!lock && (
                                  <ContextMenuItem 
                                    onClick={() => {
                                      console.log(`Attempting checkout for app ${app.name} (ID: ${app.id})`);
                                      checkoutMutation.mutate(app);
                                    }}
                                    disabled={checkoutMutation.isPending}
                                  >
                                    <GitBranch className="mr-2 h-4 w-4" />
                                    Checkout
                                  </ContextMenuItem>
                                )}
                                {isLockedByMe && (
                                  <>
                                    <ContextMenuItem onClick={() => setEditingApp(app)}>
                                      <Edit className="mr-2 h-4 w-4" />
                                      Edit
                                    </ContextMenuItem>
                                    <ContextMenuItem 
                                      onClick={() => checkinMutation.mutate({ app, changes: {} })}
                                      disabled={checkinMutation.isPending}
                                    >
                                      <Unlock className="mr-2 h-4 w-4" />
                                      Checkin
                                    </ContextMenuItem>
                                    <ContextMenuItem 
                                      onClick={() => cancelCheckoutMutation.mutate(app)}
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
                      {/* Show edit for production view or when no initiative context */}
                      {canUpdate('applications') && (!currentInitiative || isProductionView) && (
                        <ContextMenuItem onClick={() => setEditingApp(app)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </ContextMenuItem>
                      )}
                      {/* Show help when in initiative mode but item not checked out */}
                      {currentInitiative && !isProductionView && !isApplicationLocked(app.id) && canUpdate('applications') && (
                        <ContextMenuItem disabled>
                          <Info className="mr-2 h-4 w-4" />
                          Checkout required to edit
                        </ContextMenuItem>
                      )}
                      <ContextMenuItem onClick={() => setViewingApp(app)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </ContextMenuItem>
                      <ContextMenuItem onClick={() => setViewingInterfacesApp(app)}>
                        <Plug className="mr-2 h-4 w-4" />
                        View Interfaces
                      </ContextMenuItem>
                      <ContextMenuSeparator />
                      <ContextMenuItem onClick={() => setShowCapabilitiesView(app)}>
                        <FileText className="mr-2 h-4 w-4" />
                        View Capability Documents
                      </ContextMenuItem>
                      <ContextMenuItem onClick={() => setShowCapabilitiesUpload(app)}>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Capability Document
                      </ContextMenuItem>
                      {(canCreate('applications') || canUpdate('applications') || canDelete('applications')) && (
                        <ContextMenuSeparator />
                      )}
                      {canCreate('applications') && (
                        <ContextMenuItem onClick={() => handleDuplicateAndEdit(app)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicate and Edit
                        </ContextMenuItem>
                      )}
                      {canDelete('applications') && (
                        <>
                          <ContextMenuSeparator />
                          {app.status !== 'decommissioned' && (
                            <ContextMenuItem
                              onClick={() => handleDecommission(app)}
                              className="text-orange-400 focus:text-orange-300"
                            >
                              <AlertTriangle className="mr-2 h-4 w-4" />
                              Schedule Decommission
                            </ContextMenuItem>
                          )}
                          <ContextMenuItem
                            onClick={() => setDeletingApp(app)}
                            className="text-red-400 focus:text-red-300"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </ContextMenuItem>
                        </>
                      )}
                      {canUpdate('applications') && (
                        <>
                          <ContextMenuSeparator />
                          <ContextMenuItem
                            onClick={() => {
                              multiSelect.selectByPredicate((a) => a.status === app.status);
                            }}
                            className="text-blue-400 focus:text-blue-300"
                          >
                            Select all with status: {app.status}
                          </ContextMenuItem>
                          <ContextMenuItem
                            onClick={() => {
                              multiSelect.selectByPredicate((a) => a.lob === app.lob);
                            }}
                            className="text-blue-400 focus:text-blue-300"
                          >
                            Select all in LOB: {app.lob || 'None'}
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

        {/* Pagination would go here if needed */}
        {filteredApplications.length > 0 && (
          <div className="mt-8 text-center text-sm text-gray-400">
            Showing {filteredApplications.length} application{filteredApplications.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Edit Application Dialog */}
      <Dialog open={!!editingApp} onOpenChange={(open) => !open && setEditingApp(null)}>
        <DialogContent className="max-w-5xl bg-gray-800 border-gray-700 max-h-[90vh] overflow-y-auto">
          {editingApp && (
            <ApplicationForm 
              initialData={editingApp} 
              applicationId={editingApp.id}
              isEditing={true}
              onSuccess={async () => {
                try {
                  // If in an initiative and app is checked out, do checkin
                  if (currentInitiative && !isProductionView) {
                    const lock = isApplicationLocked(editingApp.id);
                    console.log('Edit complete - checking lock status:', {
                      hasLock: !!lock,
                      lockDetails: lock,
                      currentUserId: currentUser?.id,
                      isLockedByMe: lock?.lock.lockedBy === currentUser?.id,
                      initiativeId: currentInitiative?.initiativeId
                    });
                    
                    if (lock?.lock.lockedBy === currentUser?.id) {
                      // App is checked out by current user, do checkin
                      // Note: The form has already saved the changes to the server
                      console.log('Attempting checkin...');
                      await checkinMutation.mutateAsync({ 
                        app: editingApp, 
                        changes: editingApp // Pass the full app data as changes
                      });
                    } else {
                      console.log('Skipping checkin - not locked by current user');
                    }
                  }
                } catch (error) {
                  console.error('Checkin failed after edit:', error);
                  // Don't block the UI close even if checkin fails
                }
                setEditingApp(null);
                queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
              }} 
            />
          )}
        </DialogContent>
      </Dialog>

      {/* View Application Details Modal */}
      <ApplicationDetailsModal
        applicationId={viewingApp?.id || null}
        open={!!viewingApp}
        onOpenChange={(open) => !open && setViewingApp(null)}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingApp} onOpenChange={(open) => !open && setDeletingApp(null)}>
        <AlertDialogContent className="bg-gray-800 border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              This will permanently delete the application "{deletingApp?.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingApp) {
                  deleteMutation.mutate(deletingApp.id);
                  setDeletingApp(null);
                }
              }}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import/Export Dialog */}
      <ImportExportDialog
        open={showImportExport}
        onOpenChange={setShowImportExport}
        entity="applications"
        entityName="Applications"
        onImportSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
        }}
      />

      {/* Bulk Edit Dialog */}
      <BulkEditDialog
        open={showBulkEditDialog}
        onOpenChange={setShowBulkEditDialog}
        selectedCount={multiSelect.selectedCount}
        fields={bulkEditFields}
        onSubmit={handleBulkUpdate}
        entityName="Applications"
      />

      {/* Bulk Delete Confirmation */}
      <AlertDialog open={showBulkDeleteConfirm} onOpenChange={setShowBulkDeleteConfirm}>
        <AlertDialogContent className="bg-gray-800 border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete {multiSelect.selectedCount} Applications?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              This will permanently delete {multiSelect.selectedCount} selected applications. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const ids = multiSelect.selectedItems?.map(app => app.id) || [];
                if (ids.length > 0) {
                  bulkDeleteMutation.mutate(ids);
                }
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
        artifactType="application"
      />

      {/* Bulk Duplicate Confirmation */}
      <AlertDialog open={showBulkDuplicateConfirm} onOpenChange={setShowBulkDuplicateConfirm}>
        <AlertDialogContent className="bg-gray-800 border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Duplicate {multiSelect.selectedCount} Applications?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              This will create {multiSelect.selectedCount} duplicate applications with "(Copy)" added to their names. 
              Each duplicate will have updated creation dates and will be available for editing immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBulkDuplicate}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              Duplicate All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Duplicate and Edit Application Dialog */}
      <Dialog open={!!duplicatingApp} onOpenChange={(open) => !open && setDuplicatingApp(null)}>
        <DialogContent className="max-w-5xl bg-gray-800 border-gray-700 max-h-[90vh] overflow-y-auto">
          {duplicatingApp && (
            <ApplicationForm 
              initialData={duplicatingApp} 
              isEditing={false}
              onSuccess={() => {
                setDuplicatingApp(null);
                queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
              }} 
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Application Interfaces Dialog */}
      <ApplicationInterfacesDialog
        application={viewingInterfacesApp}
        open={!!viewingInterfacesApp}
        onOpenChange={(open) => !open && setViewingInterfacesApp(null)}
      />

      {/* Decommission Warning Modal */}
      {decommissioningApp && decommissionImpact && (
        <DecommissionWarningModal
          isOpen={!!decommissioningApp}
          onClose={() => {
            setDecommissioningApp(null);
            setDecommissionImpact(null);
          }}
          onConfirm={(reason, acknowledged) => {
            if (decommissioningApp) {
              const decommissionDate = decommissioningApp.decommissionDate 
                ? new Date(decommissioningApp.decommissionDate)
                : new Date();
              
              decommissionMutation.mutate({
                id: decommissioningApp.id,
                decommissionDate,
                decommissionReason: reason,
                decommissionedBy: "current_user" // In real app, get from auth context
              });
            }
          }}
          applicationName={decommissioningApp.name}
          decommissionDate={decommissioningApp.decommissionDate 
            ? new Date(decommissioningApp.decommissionDate) 
            : new Date()}
          impactedInterfaces={[
            ...decommissionImpact.providedInterfaces,
            ...decommissionImpact.consumedInterfaces
          ]}
          providedInterfaces={decommissionImpact.providedInterfaces}
          consumedInterfaces={decommissionImpact.consumedInterfaces}
        />
      )}

      {/* Capabilities Documents Dialog */}
      <CapabilitiesDocumentsDialog
        application={showCapabilitiesView}
        open={!!showCapabilitiesView}
        onOpenChange={(open) => !open && setShowCapabilitiesView(null)}
        onUploadClick={() => {
          setShowCapabilitiesUpload(showCapabilitiesView);
          setShowCapabilitiesView(null);
        }}
      />

      {/* Capabilities Upload Dialog */}
      <CapabilitiesUploadDialog
        application={showCapabilitiesUpload}
        open={!!showCapabilitiesUpload}
        onOpenChange={(open) => !open && setShowCapabilitiesUpload(null)}
        onSuccess={() => {
          // Optionally open the documents view after successful upload
          setShowCapabilitiesView(showCapabilitiesUpload);
        }}
      />


      {/* View Application Details Modal */}
      {viewingApp && (
        <ApplicationDetailsModal
          application={viewingApp}
          isOpen={!!viewingApp}
          onClose={() => setViewingApp(null)}
        />
      )}
    </div>
  );
}
