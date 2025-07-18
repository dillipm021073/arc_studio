import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useMultiSelect } from "@/hooks/use-multi-select";
import { usePermissions } from "@/hooks/use-permissions";
import { useInitiative } from "@/components/initiatives/initiative-context";
import { ViewModeIndicator } from "@/components/initiatives/view-mode-indicator";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ArtifactInitiativeTooltip } from "@/components/ui/artifact-initiative-tooltip";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  GitBranch,
  Copy,
  Eye,
  Lock,
  Unlock,
  X
} from "lucide-react";
import { Link } from "wouter";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/auth-context";
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

interface InternalActivity {
  id: number;
  applicationId: number;
  activityName: string;
  activityType: string;
  description?: string;
  sequenceNumber?: number;
  businessProcessId?: number;
  preCondition?: string;
  postCondition?: string;
  estimatedDurationMs?: number;
  createdAt: string;
  updatedAt: string;
}

interface Application {
  id: number;
  name: string;
  amlNumber: string;
}

interface BusinessProcess {
  id: number;
  businessProcess: string;
  lob: string;
}

export default function InternalActivities() {
  try {
    console.log('InternalActivities component rendering');
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const { currentInitiative, isProductionView } = useInitiative();
    const { user } = useAuth();
    const { isAdmin } = usePermissions();
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<InternalActivity | null>(null);
  const [deletingActivity, setDeletingActivity] = useState<InternalActivity | null>(null);
  const [duplicatingActivity, setDuplicatingActivity] = useState<InternalActivity | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [applicationFilter, setApplicationFilter] = useState("all");
  const [processFilter, setProcessFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [viewingActivity, setViewingActivity] = useState<any | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    applicationId: "",
    activityName: "",
    activityType: "check",
    description: "",
    sequenceNumber: "",
    businessProcessId: "",
    preCondition: "",
    postCondition: "",
    estimatedDurationMs: ""
  });

  // Fetch all data
  const { data, isLoading, error } = useQuery({
    queryKey: ["internal-activities"],
    queryFn: async () => {
      const response = await fetch("/api/internal-activities");
      if (!response.ok) {
        throw new Error("Failed to fetch internal activities");
      }
      return response.json();
    },
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

  // Fetch applications for dropdown
  const { data: applications } = useQuery<Application[]>({
    queryKey: ["/api/applications"],
    queryFn: async () => {
      const response = await fetch("/api/applications");
      if (!response.ok) throw new Error("Failed to fetch applications");
      return response.json();
    }
  });

  // Fetch business processes for dropdown
  const { data: businessProcesses } = useQuery<BusinessProcess[]>({
    queryKey: ["/api/business-processes"],
    queryFn: async () => {
      const response = await fetch("/api/business-processes");
      if (!response.ok) throw new Error("Failed to fetch business processes");
      return response.json();
    }
  });

  // Transform data for display
  const activities = data || [];
  console.log('Raw activities data:', activities);
  
  let displayActivities = [];
  try {
    displayActivities = activities.map((item: any) => {
      if (!item?.activity) {
        console.error('Invalid activity item:', item);
        return null;
      }
      return {
        ...item.activity,
        applicationName: item.application?.name || '',
        businessProcessName: item.businessProcess?.businessProcess || ''
      };
    }).filter(Boolean);
  } catch (err) {
    console.error('Error transforming activities:', err);
    displayActivities = [];
  }
  console.log('Display activities:', displayActivities);

  // Filter activities
  let filteredActivities = [];
  try {
    filteredActivities = displayActivities.filter((activity: InternalActivity & { applicationName: string; businessProcessName: string }) => {
      if (!activity) return false;
      
      const matchesSearch = !searchQuery || 
        activity.activityName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (activity.description && activity.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        activity.applicationName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.businessProcessName?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesApplication = applicationFilter === "all" || activity.applicationId?.toString() === applicationFilter;
      const matchesProcess = processFilter === "all" || activity.businessProcessId?.toString() === processFilter;
      const matchesType = typeFilter === "all" || activity.activityType === typeFilter;

      return matchesSearch && matchesApplication && matchesProcess && matchesType;
    });
  } catch (err) {
    console.error('Error filtering activities:', err);
    filteredActivities = [];
  }

  // Initialize multi-select hook
  const multiSelect = useMultiSelect({
    items: filteredActivities || [],
    getItemId: (activity) => activity?.id || 0,
  });

  // Helper function to check if activity is locked
  const isActivityLocked = (activityId: number) => {
    if (!locks || !Array.isArray(locks)) return null;
    
    const lock = locks.find((l: any) => 
      l.lock.artifactType === 'internal_process' && 
      l.lock.artifactId === activityId
    );
    
    return lock || null;
  };

  // Helper to get activity state for visual indicators
  const getActivityState = (activity: any): ArtifactState => {
    const lock = isActivityLocked(activity.id);
    // TODO: Add logic to detect initiative changes and conflicts
    const hasInitiativeChanges = false; // This would check if activity has versions in current initiative
    const hasConflicts = false; // This would check for version conflicts
    
    return getArtifactState(
      activity.id,
      'internal_process',
      lock,
      currentUser?.id,
      hasInitiativeChanges,
      hasConflicts
    );
  };

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/internal-activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error("Failed to create internal activity");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["internal-activities"] });
      toast({ title: "Success", description: "Internal activity created successfully" });
      setCreateDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "Failed to create internal activity", 
        variant: "destructive" 
      });
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await fetch(`/api/internal-activities/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error("Failed to update internal activity");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["internal-activities"] });
      toast({ title: "Success", description: "Internal activity updated successfully" });
      setEditDialogOpen(false);
      setSelectedActivity(null);
      resetForm();
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "Failed to update internal activity", 
        variant: "destructive" 
      });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/internal-activities/${id}`, {
        method: "DELETE"
      });
      if (!response.ok) throw new Error("Failed to delete internal activity");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["internal-activities"] });
      toast({ title: "Success", description: "Internal activity deleted successfully" });
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "Failed to delete internal activity", 
        variant: "destructive" 
      });
    }
  });

  // Version Control mutations
  const checkoutMutation = useMutation({
    mutationFn: async (activity: any) => {
      const response = await api.post('/api/version-control/internal-activities/' + activity.id + '/checkout', {
        initiativeId: currentInitiative?.initiativeId
      });
      return response.data;
    },
    onSuccess: (data, activity) => {
      queryClient.invalidateQueries({ queryKey: ['version-control-locks'] });
      toast({
        title: "Activity checked out",
        description: `${activity.activityName} is now locked for editing in ${currentInitiative?.name}`
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to checkout activity",
        variant: "destructive"
      });
    }
  });

  const checkinMutation = useMutation({
    mutationFn: async ({ activity, data }: { activity: any; data: any }) => {
      const response = await api.post('/api/version-control/internal-activities/' + activity.id + '/checkin', {
        initiativeId: currentInitiative?.initiativeId,
        data,
        changeReason: `Updated ${activity.activityName} via UI`
      });
      return response.data;
    },
    onSuccess: (data, { activity }) => {
      queryClient.invalidateQueries({ queryKey: ['version-control-locks'] });
      queryClient.invalidateQueries({ queryKey: ['internal-activities'] });
      toast({
        title: "Changes checked in",
        description: `${activity.activityName} has been updated in ${currentInitiative?.name}`
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
    mutationFn: async (activity: InternalActivity) => {
      const response = await api.post('/api/version-control/cancel-checkout', {
        artifactType: 'internal_process',
        artifactId: activity.id,
        initiativeId: currentInitiative?.initiativeId
      });
      return response.data;
    },
    onSuccess: (data, activity) => {
      queryClient.invalidateQueries({ queryKey: ['version-control-locks'] });
      queryClient.invalidateQueries({ queryKey: ['internal-activities'] });
      toast({
        title: "Checkout cancelled",
        description: `${activity.activityName} checkout has been cancelled and changes discarded`
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

  const resetForm = () => {
    setFormData({
      applicationId: "",
      activityName: "",
      activityType: "check",
      description: "",
      sequenceNumber: "",
      businessProcessId: "",
      preCondition: "",
      postCondition: "",
      estimatedDurationMs: ""
    });
  };

  const handleSubmit = () => {
    const data = {
      ...formData,
      applicationId: parseInt(formData.applicationId),
      sequenceNumber: formData.sequenceNumber ? parseInt(formData.sequenceNumber) : null,
      businessProcessId: formData.businessProcessId && formData.businessProcessId !== "none" ? parseInt(formData.businessProcessId) : null,
      estimatedDurationMs: formData.estimatedDurationMs ? parseInt(formData.estimatedDurationMs) : null
    };

    if (selectedActivity) {
      const lock = isActivityLocked(selectedActivity.id);
      if (currentInitiative && !isProductionView && lock?.lock.lockedBy === user?.id) {
        // Do checkin with the changes
        const activityData = filteredActivities?.find((a: any) => a.id === selectedActivity.id);
        if (activityData) {
          checkinMutation.mutate({ activity: activityData, data });
          setEditDialogOpen(false);
          setSelectedActivity(null);
          resetForm();
        }
      } else {
        // Regular update
        updateMutation.mutate({ id: selectedActivity.id, data });
      }
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDuplicateAndEdit = (activity: InternalActivity & { applicationName: string; businessProcessName: string }) => {
    setDuplicatingActivity({
      ...activity,
      id: 0,
      activityName: `${activity.activityName} (Copy)`
    });
  };

  const handleEdit = (activity: InternalActivity & { applicationName: string; businessProcessName: string }) => {
    setFormData({
      applicationId: activity.applicationId.toString(),
      activityName: activity.activityName,
      activityType: activity.activityType,
      description: activity.description || "",
      sequenceNumber: activity.sequenceNumber ? activity.sequenceNumber.toString() : "",
      businessProcessId: activity.businessProcessId ? activity.businessProcessId.toString() : "",
      preCondition: activity.preCondition || "",
      postCondition: activity.postCondition || "",
      estimatedDurationMs: activity.estimatedDurationMs ? activity.estimatedDurationMs.toString() : ""
    });
    setSelectedActivity(activity);
    setEditDialogOpen(true);
  };

  const getActivityTypeIcon = (type: string) => {
    switch (type) {
      case 'check': return <CheckCircle className="h-4 w-4" />;
      case 'validate': return <XCircle className="h-4 w-4" />;
      case 'transform': return <RefreshCw className="h-4 w-4" />;
      case 'compute': return <Activity className="h-4 w-4" />;
      case 'decide': return <GitBranch className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityTypeColor = (type: string) => {
    switch (type) {
      case 'check': return 'bg-blue-600';
      case 'validate': return 'bg-purple-600';
      case 'transform': return 'bg-green-600';
      case 'compute': return 'bg-yellow-600';
      case 'decide': return 'bg-orange-600';
      default: return 'bg-gray-600';
    }
  };

  // Initialize form data when duplicating
  React.useEffect(() => {
    try {
      if (duplicatingActivity) {
        setFormData({
          applicationId: duplicatingActivity.applicationId?.toString() || "",
          activityName: duplicatingActivity.activityName || "",
          activityType: duplicatingActivity.activityType || "check",
          description: duplicatingActivity.description || "",
          sequenceNumber: "",
          businessProcessId: duplicatingActivity.businessProcessId ? duplicatingActivity.businessProcessId.toString() : "",
          preCondition: duplicatingActivity.preCondition || "",
          postCondition: duplicatingActivity.postCondition || "",
          estimatedDurationMs: duplicatingActivity.estimatedDurationMs ? duplicatingActivity.estimatedDurationMs.toString() : ""
        });
        setCreateDialogOpen(true);
      }
    } catch (err) {
      console.error('Error in duplicating activity effect:', err);
    }
  }, [duplicatingActivity]);

  if (error) {
    console.error('Error loading internal activities:', error);
    return (
      <div className="flex flex-col h-screen bg-gray-900 items-center justify-center">
        <div className="text-red-500">
          <h2 className="text-xl font-bold mb-2">Error loading internal activities</h2>
          <p>{error.message}</p>
        </div>
      </div>
    );
  }

  console.log('Rendering with:', {
    isLoading,
    activitiesCount: activities.length,
    displayActivitiesCount: displayActivities.length,
    filteredCount: filteredActivities.length
  });

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <nav className="flex" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-2 text-sm text-gray-400">
                <li><Link href="/" className="hover:text-gray-200">Home</Link></li>
                <li className="flex items-center">
                  <span className="mx-2">/</span>
                  <span className="text-white font-medium">Internal Activities</span>
                </li>
              </ol>
            </nav>
            <h1 className="text-2xl font-bold text-white mt-2">Internal Activities</h1>
            <p className="text-gray-400 text-sm mt-1">
              Manage self-referential activities within applications
            </p>
          </div>
          <Button
            onClick={() => setCreateDialogOpen(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Internal Activity
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {/* View Mode Indicator */}
          {currentInitiative && (
            <div className="mb-4">
              {/* Temporarily disabled ViewModeIndicator to debug */}
              {/* <ViewModeIndicator /> */}
              <div className="text-white">Initiative: {currentInitiative?.name}</div>
            </div>
          )}
          
          {/* Filters */}
          <Card className="bg-gray-800 border-gray-700 mb-6 mt-4">
            <CardHeader>
              <CardTitle className="text-white">Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search activities..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-gray-700 border-gray-600"
                  />
                </div>

                <Select 
                  value={applicationFilter} 
                  onValueChange={setApplicationFilter}
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600">
                    <SelectValue placeholder="All Applications" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="all">All Applications</SelectItem>
                    {applications?.map((app) => (
                      <SelectItem key={app.id} value={app.id.toString()}>
                        {app.amlNumber} - {app.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select 
                  value={typeFilter} 
                  onValueChange={setTypeFilter}
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600">
                    <SelectValue placeholder="All Activity Types" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="all">All Activity Types</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                    <SelectItem value="validate">Validate</SelectItem>
                    <SelectItem value="transform">Transform</SelectItem>
                    <SelectItem value="compute">Compute</SelectItem>
                    <SelectItem value="decide">Decide</SelectItem>
                  </SelectContent>
                </Select>

                <Select 
                  value={processFilter} 
                  onValueChange={setProcessFilter}
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600">
                    <SelectValue placeholder="All Business Processes" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="all">All Business Processes</SelectItem>
                    {businessProcesses?.map((bp) => (
                      <SelectItem key={bp.id} value={bp.id.toString()}>
                        {bp.businessProcess} ({bp.lob})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Bulk Actions */}
          {multiSelect.selectedItems.length > 0 && (
            <Card className="bg-gray-800 border-gray-700 mb-6">
              <CardContent className="p-4">
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
                        const selectedIds = multiSelect.selectedItems.map(activity => activity.id);
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
              </CardContent>
            </Card>
          )}

          {/* Activities Table */}
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-0">
              <div className="max-h-[600px] overflow-auto">
                <Table>
                <TableHeader>
                  <TableRow className="border-gray-700">
                    <TableHead className="w-12">
                      <Checkbox
                        checked={filteredActivities?.length > 0 && multiSelect.selectedItems.length === filteredActivities.length}
                        onCheckedChange={(checked) => {
                          if (checked && filteredActivities?.length > 0) {
                            multiSelect.selectAll();
                          } else {
                            multiSelect.clearSelection();
                          }
                        }}
                        aria-label="Select all activities"
                      />
                    </TableHead>
                    <TableHead className="text-gray-400">Activity Name</TableHead>
                    <TableHead className="text-gray-400">Application</TableHead>
                    <TableHead className="text-gray-400">Type</TableHead>
                    <TableHead className="text-gray-400">Sequence</TableHead>
                    <TableHead className="text-gray-400">Duration</TableHead>
                    <TableHead className="text-gray-400">Pre-Condition</TableHead>
                    <TableHead className="text-gray-400">Post-Condition</TableHead>
                    <TableHead className="text-gray-400">Version Status</TableHead>
                    <TableHead className="text-gray-400 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center text-gray-400">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : filteredActivities?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center text-gray-400">
                        No internal activities found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredActivities?.map((activity: InternalActivity & { applicationName: string; businessProcessName: string }) => (
                      <ContextMenu key={activity.id}>
                        <ContextMenuTrigger asChild>
                          <TableRow className={getRowClassName(getActivityState(activity), multiSelect.isSelected(activity))}>
                            <TableCell className="w-12">
                              <Checkbox
                                checked={multiSelect.isSelected(activity)}
                                onCheckedChange={() => multiSelect.toggleSelection(activity)}
                                onClick={(e) => e.stopPropagation()}
                                aria-label={`Select activity ${activity.activityName}`}
                              />
                            </TableCell>
                            <TableCell className="text-white font-medium">
                            <div className="flex items-center space-x-2">
                              <Activity className="h-4 w-4 text-green-600" />
                              <span>{activity.activityName}</span>
                            </div>
                            {activity.description && (
                              <p className="text-sm text-gray-400 mt-1">
                                {activity.description}
                              </p>
                            )}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {activity.applicationName}
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getActivityTypeColor(activity.activityType)} text-white`}>
                            <span className="mr-1">{getActivityTypeIcon(activity.activityType)}</span>
                            {activity.activityType}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {activity.sequenceNumber || '-'}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {activity.estimatedDurationMs ? (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {activity.estimatedDurationMs}ms
                            </div>
                          ) : '-'}
                        </TableCell>
                        <TableCell className="text-gray-300 text-sm">
                          {activity.preCondition || '-'}
                        </TableCell>
                        <TableCell className="text-gray-300 text-sm">
                          {activity.postCondition || '-'}
                        </TableCell>
                        <TableCell>
                          {/* Temporarily disabled StatusColumn */}
                          <span className="text-gray-400">-</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(activity)}
                              className="text-blue-400 hover:text-blue-300"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteMutation.mutate(activity.id)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                          </TableRow>
                        </ContextMenuTrigger>
                        <ContextMenuContent className="bg-gray-800 border-gray-600">
                          <ContextMenuItem
                            onClick={() => setViewingActivity(activity)}
                            className="text-gray-300 hover:bg-gray-700 focus:bg-gray-700"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </ContextMenuItem>
                          <ContextMenuItem
                            onClick={() => handleEdit(activity)}
                            className="text-gray-300 hover:bg-gray-700 focus:bg-gray-700"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </ContextMenuItem>
                          <ContextMenuItem
                            onClick={() => handleDuplicateAndEdit(activity)}
                            className="text-gray-300 hover:bg-gray-700 focus:bg-gray-700"
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                          </ContextMenuItem>
                          
                          {/* Version Control Options */}
                          {currentInitiative && !isProductionView && (
                            <>
                              <ContextMenuSeparator className="bg-gray-600" />
                              {(() => {
                                const lock = isActivityLocked(activity.id);
                                const isLockedByMe = lock?.lock.lockedBy === currentUser?.id || isAdmin;
                                const isLockedByOther = lock && !isLockedByMe;
                                
                                return (
                                  <>
                                    {!lock && (
                                      <ContextMenuItem 
                                        onClick={() => checkoutMutation.mutate(activity)}
                                        className="text-gray-300 hover:bg-gray-700 focus:bg-gray-700"
                                      >
                                        <GitBranch className="mr-2 h-4 w-4" />
                                        Checkout
                                      </ContextMenuItem>
                                    )}
                                    {isLockedByMe && (
                                      <>
                                        <ContextMenuItem onClick={() => handleEdit(activity)}>
                                          <Edit className="mr-2 h-4 w-4" />
                                          Edit (Checked Out)
                                        </ContextMenuItem>
                                        <ContextMenuItem 
                                          onClick={() => {
                                            const data = {
                                              applicationId: activity.applicationId,
                                              activityName: activity.activityName,
                                              activityType: activity.activityType,
                                              description: activity.description,
                                              sequenceNumber: activity.sequenceNumber,
                                              businessProcessId: activity.businessProcessId,
                                              preCondition: activity.preCondition,
                                              postCondition: activity.postCondition,
                                              estimatedDurationMs: activity.estimatedDurationMs
                                            };
                                            checkinMutation.mutate({ activity, data });
                                          }}
                                          className="text-gray-300 hover:bg-gray-700 focus:bg-gray-700"
                                        >
                                          <Unlock className="mr-2 h-4 w-4" />
                                          Checkin
                                        </ContextMenuItem>
                                        <ContextMenuItem 
                                          onClick={() => cancelCheckoutMutation.mutate(activity)}
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
                            </>
                          )}
                          
                          <ContextMenuSeparator className="bg-gray-600" />
                          <ContextMenuItem
                            onClick={() => deleteMutation.mutate(activity.id)}
                            className="text-red-400 hover:bg-gray-700 focus:bg-gray-700"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </ContextMenuItem>
                        </ContextMenuContent>
                      </ContextMenu>
                    ))
                  )}
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={createDialogOpen || editDialogOpen || !!duplicatingActivity} onOpenChange={(open) => {
        if (!open) {
          setCreateDialogOpen(false);
          setEditDialogOpen(false);
          setDuplicatingActivity(null);
          setSelectedActivity(null);
          resetForm();
        }
      }}>
        <DialogContent className="bg-gray-800 text-white border-gray-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedActivity ? "Edit Internal Activity" : duplicatingActivity ? "Duplicate Internal Activity" : "Create Internal Activity"}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Define an internal activity that occurs within an application
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <Label>Application</Label>
              <Select 
                value={formData.applicationId} 
                onValueChange={(value) => setFormData({ ...formData, applicationId: value })}
              >
                <SelectTrigger className="bg-gray-700 border-gray-600">
                  <SelectValue placeholder="Select application" />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  {applications?.map((app) => (
                    <SelectItem key={app.id} value={app.id.toString()}>
                      {app.amlNumber} - {app.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Activity Type</Label>
              <Select 
                value={formData.activityType} 
                onValueChange={(value) => setFormData({ ...formData, activityType: value })}
              >
                <SelectTrigger className="bg-gray-700 border-gray-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="validate">Validate</SelectItem>
                  <SelectItem value="transform">Transform</SelectItem>
                  <SelectItem value="compute">Compute</SelectItem>
                  <SelectItem value="decide">Decide</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2">
              <Label>Activity Name</Label>
              <Input
                value={formData.activityName}
                onChange={(e) => setFormData({ ...formData, activityName: e.target.value })}
                className="bg-gray-700 border-gray-600"
                placeholder="e.g., Check Reservation ID"
              />
            </div>

            <div className="col-span-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-gray-700 border-gray-600"
                rows={3}
              />
            </div>

            <div>
              <Label>Pre-Condition</Label>
              <Input
                value={formData.preCondition}
                onChange={(e) => setFormData({ ...formData, preCondition: e.target.value })}
                className="bg-gray-700 border-gray-600"
                placeholder="e.g., order.status === 'pending'"
              />
            </div>

            <div>
              <Label>Post-Condition</Label>
              <Input
                value={formData.postCondition}
                onChange={(e) => setFormData({ ...formData, postCondition: e.target.value })}
                className="bg-gray-700 border-gray-600"
                placeholder="e.g., reservation.id !== null"
              />
            </div>

            <div>
              <Label>Sequence Number</Label>
              <Input
                type="number"
                value={formData.sequenceNumber}
                onChange={(e) => setFormData({ ...formData, sequenceNumber: e.target.value })}
                className="bg-gray-700 border-gray-600"
              />
            </div>

            <div>
              <Label>Estimated Duration (ms)</Label>
              <Input
                type="number"
                value={formData.estimatedDurationMs}
                onChange={(e) => setFormData({ ...formData, estimatedDurationMs: e.target.value })}
                className="bg-gray-700 border-gray-600"
                placeholder="e.g., 500"
              />
            </div>

            <div className="col-span-2">
              <Label>Business Process (Optional)</Label>
              <Select 
                value={formData.businessProcessId} 
                onValueChange={(value) => setFormData({ ...formData, businessProcessId: value })}
              >
                <SelectTrigger className="bg-gray-700 border-gray-600">
                  <SelectValue placeholder="Select business process" />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  <SelectItem value="none">None</SelectItem>
                  {businessProcesses?.map((bp) => (
                    <SelectItem key={bp.id} value={bp.id.toString()}>
                      {bp.businessProcess} ({bp.lob})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setCreateDialogOpen(false);
                setEditDialogOpen(false);
                setDuplicatingActivity(null);
                setSelectedActivity(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.applicationId || !formData.activityName}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {selectedActivity ? "Update" : "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={!!viewingActivity} onOpenChange={() => setViewingActivity(null)}>
        <DialogContent className="bg-gray-800 text-white border-gray-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle>Internal Activity Details</DialogTitle>
            <DialogDescription>
              View detailed information about this internal activity
            </DialogDescription>
          </DialogHeader>
          
          {viewingActivity && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">Activity Name</Label>
                  <p className="text-white font-medium">{viewingActivity.activityName}</p>
                </div>
                <div>
                  <Label className="text-gray-300">Application</Label>
                  <p className="text-white">{viewingActivity.applicationName || 'N/A'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">Activity Type</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={`${getActivityTypeColor(viewingActivity.activityType)} text-white`}>
                      <span className="mr-1">{getActivityTypeIcon(viewingActivity.activityType)}</span>
                      {viewingActivity.activityType}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-gray-300">Sequence Number</Label>
                  <p className="text-white">{viewingActivity.sequenceNumber || 'Not set'}</p>
                </div>
              </div>

              {viewingActivity.description && (
                <div>
                  <Label className="text-gray-300">Description</Label>
                  <p className="text-white">{viewingActivity.description}</p>
                </div>
              )}

              {viewingActivity.businessProcessName && (
                <div>
                  <Label className="text-gray-300">Business Process</Label>
                  <p className="text-white">{viewingActivity.businessProcessName}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">Pre-Condition</Label>
                  <p className="text-white font-mono text-sm bg-gray-700 p-2 rounded">
                    {viewingActivity.preCondition || 'None'}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-300">Post-Condition</Label>
                  <p className="text-white font-mono text-sm bg-gray-700 p-2 rounded">
                    {viewingActivity.postCondition || 'None'}
                  </p>
                </div>
              </div>

              {viewingActivity.estimatedDurationMs && (
                <div>
                  <Label className="text-gray-300">Estimated Duration</Label>
                  <div className="flex items-center gap-1 text-white">
                    <Clock className="h-4 w-4" />
                    {viewingActivity.estimatedDurationMs}ms
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm text-gray-400">
                <div>
                  <Label className="text-gray-400">Created</Label>
                  <p>{new Date(viewingActivity.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-gray-400">Last Updated</Label>
                  <p>{new Date(viewingActivity.updatedAt).toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setViewingActivity(null)}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Close
            </Button>
            <Button
              onClick={() => {
                handleEdit(viewingActivity);
                setViewingActivity(null);
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
  } catch (error) {
    console.error('Error in InternalActivities component:', error);
    return (
      <div className="flex flex-col h-screen bg-gray-900 items-center justify-center">
        <div className="text-red-500">
          <h2 className="text-xl font-bold mb-2">Component Error</h2>
          <p>{error?.message || 'An unexpected error occurred'}</p>
          <pre className="mt-4 text-xs">{error?.stack}</pre>
        </div>
      </div>
    );
  }
}