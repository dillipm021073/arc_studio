import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  GitBranch, 
  Plus, 
  Search,
  Users,
  Package,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Edit,
  UserPlus,
  CheckSquare,
  MoreVertical,
  FileText
} from "lucide-react";
import { ConflictList } from "@/components/conflicts/conflict-list";
import { AuditTrail } from "@/components/audit/audit-trail";
import { CreateInitiativeDialog } from "@/components/initiatives/create-initiative-dialog";
import { EditInitiativeDialog } from "@/components/initiatives/edit-initiative-dialog";
import { TransferOwnershipDialog } from "@/components/initiatives/transfer-ownership-dialog";
import { InitiativeClosureDialog } from "@/components/initiatives/initiative-closure-dialog";
import { InitiativeImpactAnalysis } from "@/components/initiatives/initiative-impact-analysis";
import { InitiativeChangeSummary } from "@/components/initiatives/initiative-change-summary";
import { ImpactAssessmentDialog } from "@/components/initiatives/impact-assessment-dialog";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { usePermissions } from "@/hooks/use-permissions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function InitiativesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedInitiative, setSelectedInitiative] = useState<any>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [showClosureDialog, setShowClosureDialog] = useState(false);
  const [showImpactAssessmentDialog, setShowImpactAssessmentDialog] = useState(false);
  const [editingInitiative, setEditingInitiative] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { isAdmin } = usePermissions();

  const completeInitiativeMutation = useMutation({
    mutationFn: async (initiative: any) => {
      const response = await api.post(`/api/initiatives/${initiative.initiativeId || initiative.id}/baseline`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['initiatives'] });
      toast({
        title: "Initiative completed",
        description: "All changes have been deployed to production.",
      });
      setSelectedInitiative(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to complete initiative",
        variant: "destructive",
      });
    },
  });

  const cancelInitiativeMutation = useMutation({
    mutationFn: async (initiative: any) => {
      const response = await api.post(`/api/initiatives/${initiative.initiativeId || initiative.id}/cancel`, {
        reason: "No changes to deploy"
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['initiatives'] });
      toast({
        title: "Initiative cancelled",
        description: "The initiative has been cancelled successfully.",
      });
      setSelectedInitiative(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to cancel initiative",
        variant: "destructive",
      });
    },
  });

  const handleCompleteInitiative = async (initiative: any) => {
    if (!window.confirm(
      `Are you sure you want to complete "${initiative.name}"?\n\n` +
      "This will deploy all changes to production and cannot be undone."
    )) {
      return;
    }
    completeInitiativeMutation.mutate(initiative);
  };

  const handleCancelInitiative = async (initiative: any) => {
    if (!window.confirm(
      `Are you sure you want to cancel "${initiative.name}"?\n\n` +
      "This will discard all changes and cannot be undone."
    )) {
      return;
    }
    cancelInitiativeMutation.mutate(initiative);
  };

  const { data: initiatives, isLoading } = useQuery({
    queryKey: ['initiatives', 'all'],
    queryFn: async () => {
      const response = await api.get('/api/initiatives');
      return response.data;
    }
  });

  const filteredInitiatives = initiatives?.filter((item: any) => 
    item.initiative.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.initiative.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'review': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityIcon = (priority?: string) => {
    switch (priority) {
      case 'critical': return '🔴';
      case 'high': return '🟠';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '';
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <GitBranch className="h-6 w-6 text-gray-700 dark:text-gray-300" />
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Initiative Management
              </h1>
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Initiative
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden p-6">
        {selectedInitiative ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">{selectedInitiative.name}</h2>
                <p className="text-muted-foreground">{selectedInitiative.description}</p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setEditingInitiative(selectedInitiative);
                    setShowEditDialog(true);
                  }}
                >
                  Edit Initiative
                </Button>
                {(isAdmin || selectedInitiative.createdBy === user?.id) && (
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setEditingInitiative(selectedInitiative);
                      setShowTransferDialog(true);
                    }}
                  >
                    Transfer Ownership
                  </Button>
                )}
                <Button 
                  variant="outline"
                  onClick={() => {
                    setEditingInitiative(selectedInitiative);
                    setShowImpactAssessmentDialog(true);
                  }}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Impact Assessment
                </Button>
                {selectedInitiative.status === 'active' && (
                  <>
                    {(isAdmin || selectedInitiative.createdBy === user?.id) ? (
                      <>
                        <Button 
                          variant="default"
                          onClick={() => handleCompleteInitiative(selectedInitiative)}
                          disabled={completeInitiativeMutation.isPending}
                        >
                          {completeInitiativeMutation.isPending ? "Completing..." : "Complete Initiative"}
                        </Button>
                        <Button 
                          variant="destructive"
                          onClick={() => handleCancelInitiative(selectedInitiative)}
                          disabled={cancelInitiativeMutation.isPending}
                        >
                          {cancelInitiativeMutation.isPending ? "Cancelling..." : "Cancel Initiative"}
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button 
                          variant="default"
                          disabled
                          title="Only admin users or the initiative creator can complete initiatives"
                        >
                          Complete Initiative (No Permission)
                        </Button>
                        <Button 
                          variant="destructive"
                          disabled
                          title="Only admin users or the initiative creator can cancel initiatives"
                        >
                          Cancel Initiative (No Permission)
                        </Button>
                      </>
                    )}
                  </>
                )}
                <Button variant="outline" onClick={() => setSelectedInitiative(null)}>
                  Back to List
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge className={getStatusColor(selectedInitiative.status)}>
                    {selectedInitiative.status}
                  </Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Priority</CardTitle>
                </CardHeader>
                <CardContent>
                  <span className="text-lg">
                    {getPriorityIcon(selectedInitiative.priority)} {selectedInitiative.priority}
                  </span>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Participants</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>{selectedInitiative.participantCount || 0}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Artifacts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    <span>{selectedInitiative.artifactCount || 0}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="conflicts" className="space-y-4">
              <TabsList>
                <TabsTrigger value="conflicts">Conflicts</TabsTrigger>
                <TabsTrigger value="impact">Impact Analysis</TabsTrigger>
                <TabsTrigger value="audit">Audit Trail</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
              </TabsList>

              <TabsContent value="conflicts" className="space-y-4">
                <ConflictList initiativeId={selectedInitiative.initiativeId} />
              </TabsContent>

              <TabsContent value="impact" className="space-y-4">
                <InitiativeImpactAnalysis initiativeId={selectedInitiative.initiativeId} />
              </TabsContent>

              <TabsContent value="audit" className="space-y-4">
                <AuditTrail 
                  limit={50}
                />
              </TabsContent>

              <TabsContent value="details" className="space-y-4">
                <div className="space-y-6">
                  {/* Initiative Basic Details */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Initiative Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Business Justification
                        </label>
                        <p className="mt-1">{selectedInitiative.businessJustification || 'N/A'}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">
                            Created
                          </label>
                          <p className="mt-1">
                            {format(new Date(selectedInitiative.createdAt), 'PPP')}
                          </p>
                        </div>

                        <div>
                          <label className="text-sm font-medium text-muted-foreground">
                            Target Completion
                          </label>
                          <p className="mt-1">
                            {selectedInitiative.targetCompletionDate 
                              ? format(new Date(selectedInitiative.targetCompletionDate), 'PPP')
                              : 'Not set'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Change Summary Section */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Change Summary</h3>
                    <InitiativeChangeSummary initiativeId={selectedInitiative.initiativeId || selectedInitiative.id} />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search initiatives..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Initiative</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Participants</TableHead>
                      <TableHead>Artifacts</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center">
                          Loading initiatives...
                        </TableCell>
                      </TableRow>
                    ) : filteredInitiatives.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center">
                          No initiatives found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredInitiatives.map((item: any) => (
                        <TableRow key={item.initiative.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{item.initiative.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {item.initiative.description}
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            <Badge className={getStatusColor(item.initiative.status)}>
                              {item.initiative.status}
                            </Badge>
                          </TableCell>

                          <TableCell>
                            <span>{getPriorityIcon(item.initiative.priority)} {item.initiative.priority}</span>
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              <span>{item.participantCount || 0}</span>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4" />
                              <span>{item.artifactCount || 0}</span>
                            </div>
                          </TableCell>

                          <TableCell>
                            {format(new Date(item.initiative.createdAt), 'MMM d, yyyy')}
                          </TableCell>

                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedInitiative({...item.initiative, participantCount: item.participantCount, artifactCount: item.artifactCount})}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setEditingInitiative(item.initiative);
                                      setShowEditDialog(true);
                                    }}
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Initiative
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setEditingInitiative(item.initiative);
                                      setShowTransferDialog(true);
                                    }}
                                  >
                                    <UserPlus className="h-4 w-4 mr-2" />
                                    Transfer Ownership
                                  </DropdownMenuItem>
                                  {item.initiative.status === 'active' && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={() => {
                                          setEditingInitiative(item.initiative);
                                          setShowClosureDialog(true);
                                        }}
                                      >
                                        <CheckSquare className="h-4 w-4 mr-2" />
                                        Close Initiative
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      <CreateInitiativeDialog 
        open={showCreateDialog} 
        onOpenChange={setShowCreateDialog} 
      />

      <EditInitiativeDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        initiative={editingInitiative}
      />

      <TransferOwnershipDialog
        open={showTransferDialog}
        onOpenChange={setShowTransferDialog}
        initiative={editingInitiative}
      />

      <InitiativeClosureDialog
        open={showClosureDialog}
        onOpenChange={setShowClosureDialog}
        initiativeId={editingInitiative?.initiativeId || editingInitiative?.id || ''}
        initiativeName={editingInitiative?.name || ''}
      />

      <ImpactAssessmentDialog
        open={showImpactAssessmentDialog}
        onOpenChange={setShowImpactAssessmentDialog}
        initiativeId={editingInitiative?.initiativeId || editingInitiative?.id || ''}
        initiativeName={editingInitiative?.name || ''}
      />
    </div>
  );
}