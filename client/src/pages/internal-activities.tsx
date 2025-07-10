import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useMultiSelect } from "@/hooks/use-multi-select";
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
  Eye
} from "lucide-react";
import { Link } from "wouter";

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
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedApplication, setSelectedApplication] = useState<string>("");
  const [selectedActivityType, setSelectedActivityType] = useState<string>("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<InternalActivity | null>(null);
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

  // Fetch internal activities
  const { data: activities, isLoading } = useQuery<InternalActivity[]>({
    queryKey: ["/api/internal-activities", selectedApplication, selectedActivityType, searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedApplication && selectedApplication !== "all") params.append("applicationId", selectedApplication);
      if (selectedActivityType && selectedActivityType !== "all") params.append("activityType", selectedActivityType);
      if (searchTerm) params.append("search", searchTerm);
      
      const response = await fetch(`/api/internal-activities?${params}`);
      if (!response.ok) throw new Error("Failed to fetch internal activities");
      return response.json();
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

  // Initialize multi-select hook
  const multiSelect = useMultiSelect({
    items: activities || [],
    getItemId: (activity) => activity.activity.id,
  });

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
      queryClient.invalidateQueries({ queryKey: ["/api/internal-activities"] });
      toast({ title: "Success", description: "Internal activity created successfully" });
      setIsCreateDialogOpen(false);
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
      queryClient.invalidateQueries({ queryKey: ["/api/internal-activities"] });
      toast({ title: "Success", description: "Internal activity updated successfully" });
      setEditingActivity(null);
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
      queryClient.invalidateQueries({ queryKey: ["/api/internal-activities"] });
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

    if (editingActivity) {
      updateMutation.mutate({ id: editingActivity.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDuplicate = (activity: any) => {
    const activityData = activity.activity;
    setFormData({
      applicationId: activityData.applicationId.toString(),
      activityName: `${activityData.activityName} (Copy)`,
      activityType: activityData.activityType,
      description: activityData.description || "",
      sequenceNumber: "",
      businessProcessId: activityData.businessProcessId ? activityData.businessProcessId.toString() : "",
      preCondition: activityData.preCondition || "",
      postCondition: activityData.postCondition || "",
      estimatedDurationMs: activityData.estimatedDurationMs ? activityData.estimatedDurationMs.toString() : ""
    });
    setEditingActivity(null);
    setIsCreateDialogOpen(true);
  };

  const handleEdit = (activity: any) => {
    const activityData = activity.activity;
    setFormData({
      applicationId: activityData.applicationId.toString(),
      activityName: activityData.activityName,
      activityType: activityData.activityType,
      description: activityData.description || "",
      sequenceNumber: activityData.sequenceNumber ? activityData.sequenceNumber.toString() : "",
      businessProcessId: activityData.businessProcessId ? activityData.businessProcessId.toString() : "",
      preCondition: activityData.preCondition || "",
      postCondition: activityData.postCondition || "",
      estimatedDurationMs: activityData.estimatedDurationMs ? activityData.estimatedDurationMs.toString() : ""
    });
    setEditingActivity(activityData);
    setIsCreateDialogOpen(true);
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

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                New Internal Activity
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-800 text-white border-gray-700 max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingActivity ? "Edit Internal Activity" : "Create Internal Activity"}
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
                    setIsCreateDialogOpen(false);
                    setEditingActivity(null);
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
                  {editingActivity ? "Update" : "Create"}
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
                      <p className="text-white font-medium">{viewingActivity.activity.activityName}</p>
                    </div>
                    <div>
                      <Label className="text-gray-300">Application</Label>
                      <p className="text-white">{viewingActivity.application?.name || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-300">Activity Type</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={`${getActivityTypeColor(viewingActivity.activity.activityType)} text-white`}>
                          <span className="mr-1">{getActivityTypeIcon(viewingActivity.activity.activityType)}</span>
                          {viewingActivity.activity.activityType}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <Label className="text-gray-300">Sequence Number</Label>
                      <p className="text-white">{viewingActivity.activity.sequenceNumber || 'Not set'}</p>
                    </div>
                  </div>

                  {viewingActivity.activity.description && (
                    <div>
                      <Label className="text-gray-300">Description</Label>
                      <p className="text-white">{viewingActivity.activity.description}</p>
                    </div>
                  )}

                  {viewingActivity.businessProcess && (
                    <div>
                      <Label className="text-gray-300">Business Process</Label>
                      <p className="text-white">{viewingActivity.businessProcess.businessProcess} ({viewingActivity.businessProcess.lob})</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-300">Pre-Condition</Label>
                      <p className="text-white font-mono text-sm bg-gray-700 p-2 rounded">
                        {viewingActivity.activity.preCondition || 'None'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-gray-300">Post-Condition</Label>
                      <p className="text-white font-mono text-sm bg-gray-700 p-2 rounded">
                        {viewingActivity.activity.postCondition || 'None'}
                      </p>
                    </div>
                  </div>

                  {viewingActivity.activity.estimatedDurationMs && (
                    <div>
                      <Label className="text-gray-300">Estimated Duration</Label>
                      <div className="flex items-center gap-1 text-white">
                        <Clock className="h-4 w-4" />
                        {viewingActivity.activity.estimatedDurationMs}ms
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-400">
                    <div>
                      <Label className="text-gray-400">Created</Label>
                      <p>{new Date(viewingActivity.activity.createdAt).toLocaleString()}</p>
                    </div>
                    <div>
                      <Label className="text-gray-400">Last Updated</Label>
                      <p>{new Date(viewingActivity.activity.updatedAt).toLocaleString()}</p>
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
      </header>

      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {/* Filters */}
          <Card className="bg-gray-800 border-gray-700 mb-6">
            <CardHeader>
              <CardTitle className="text-white">Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search activities..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-gray-700 border-gray-600"
                  />
                </div>

                <Select 
                  value={selectedApplication} 
                  onValueChange={setSelectedApplication}
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
                  value={selectedActivityType} 
                  onValueChange={setSelectedActivityType}
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
                        const selectedIds = multiSelect.selectedItems.map(activity => activity.activity.id);
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
                        checked={activities?.length > 0 && multiSelect.selectedItems.length === activities.length}
                        onCheckedChange={(checked) => {
                          if (checked) {
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
                    <TableHead className="text-gray-400 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-gray-400">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : activities?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-gray-400">
                        No internal activities found
                      </TableCell>
                    </TableRow>
                  ) : (
                    activities?.map((activity: any) => (
                      <ContextMenu key={activity.activity.id}>
                        <ContextMenuTrigger asChild>
                          <TableRow className={`border-gray-700 cursor-context-menu hover:bg-gray-700/50 ${multiSelect.isSelected(activity) ? 'bg-blue-900/20' : ''}`}>
                            <TableCell className="w-12">
                              <Checkbox
                                checked={multiSelect.isSelected(activity)}
                                onCheckedChange={() => multiSelect.toggleSelection(activity)}
                                onClick={(e) => e.stopPropagation()}
                                aria-label={`Select activity ${activity.activity.activityName}`}
                              />
                            </TableCell>
                            <TableCell className="text-white font-medium">
                          {activity.activity.activityName}
                          {activity.activity.description && (
                            <p className="text-sm text-gray-400 mt-1">
                              {activity.activity.description}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {activity.application?.name}
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getActivityTypeColor(activity.activity.activityType)} text-white`}>
                            <span className="mr-1">{getActivityTypeIcon(activity.activity.activityType)}</span>
                            {activity.activity.activityType}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {activity.activity.sequenceNumber || '-'}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {activity.activity.estimatedDurationMs ? (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {activity.activity.estimatedDurationMs}ms
                            </div>
                          ) : '-'}
                        </TableCell>
                        <TableCell className="text-gray-300 text-sm">
                          {activity.activity.preCondition || '-'}
                        </TableCell>
                        <TableCell className="text-gray-300 text-sm">
                          {activity.activity.postCondition || '-'}
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
                              onClick={() => deleteMutation.mutate(activity.activity.id)}
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
                            onClick={() => handleDuplicate(activity)}
                            className="text-gray-300 hover:bg-gray-700 focus:bg-gray-700"
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                          </ContextMenuItem>
                          <ContextMenuSeparator className="bg-gray-600" />
                          <ContextMenuItem
                            onClick={() => deleteMutation.mutate(activity.activity.id)}
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
    </div>
  );
}