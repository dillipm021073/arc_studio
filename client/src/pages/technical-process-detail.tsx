import { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { 
  ArrowLeft,
  Edit,
  Trash2,
  Cpu,
  Clock,
  Calendar,
  User,
  AlertCircle,
  Plug,
  GitBranch,
  Activity,
  Zap,
  Database,
  CalendarCheck,
  MessageSquare,
  Play,
  Square,
  Network
} from "lucide-react";
import TechnicalProcessForm from "@/components/technical-processes/technical-process-form";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function TechnicalProcessDetail() {
  console.log('TechnicalProcessDetail component rendered');
  const { id } = useParams();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  console.log('TechnicalProcessDetail - id:', id);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Fetch technical process details
  const { data: process, isLoading, error } = useQuery({
    queryKey: [`/api/technical-processes/${id}`],
    enabled: !!id,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/technical-processes/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete technical process");
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Technical process deleted successfully",
      });
      navigate("/technical-processes");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate();
    setShowDeleteDialog(false);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      active: "default",
      inactive: "secondary",
      deprecated: "destructive",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
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

  const getDependencyTypeBadge = (type: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      requires: "destructive",
      triggers: "default",
      optional: "outline",
    };
    return <Badge variant={variants[type] || "outline"}>{type}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-400">Loading technical process...</div>
      </div>
    );
  }

  if (error || !process) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <div className="text-lg font-medium text-white">Technical process not found</div>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => navigate("/technical-processes")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Technical Processes
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-shrink-0 bg-gray-800 border-b border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/technical-processes")}
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <Cpu className="h-6 w-6 text-purple-500" />
                <h1 className="text-2xl font-semibold text-white">{process.name}</h1>
                {getStatusBadge(process.status)}
                {getCriticalityBadge(process.criticality)}
              </div>
              <p className="text-gray-400 text-sm mt-1">{process.jobName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => navigate(`/technical-processes/${id}/diagram`)}
              className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
            >
              <Network className="mr-2 h-4 w-4" />
              View Diagram
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsFormOpen(true)}
              className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(true)}
              className="bg-gray-700 border-gray-600 text-red-400 hover:bg-gray-600 hover:text-red-300"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="bg-gray-800 border-gray-700">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="interfaces">
              Interfaces
              {process.interfaces?.length > 0 && (
                <Badge className="ml-2" variant="secondary">
                  {process.interfaces.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="dependencies">
              Dependencies
              {((process.dependencies?.length || 0) + (process.dependents?.length || 0)) > 0 && (
                <Badge className="ml-2" variant="secondary">
                  {(process.dependencies?.length || 0) + (process.dependents?.length || 0)}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="execution">Execution History</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {process.description && (
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Description</p>
                    <p className="text-white">{process.description}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Application</p>
                    {process.applicationName ? (
                      <Link href={`/applications/${process.applicationId}`}>
                        <a className="text-blue-400 hover:text-blue-300">
                          {process.applicationName}
                        </a>
                      </Link>
                    ) : (
                      <p className="text-gray-500">Not linked to an application</p>
                    )}
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Frequency</p>
                    <div className="flex items-center gap-2">
                      {getFrequencyIcon(process.frequency)}
                      <span className="text-white">{process.frequency}</span>
                    </div>
                  </div>
                </div>

                {process.frequency === 'scheduled' && process.schedule && (
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Schedule</p>
                    <code className="text-sm bg-gray-900 px-2 py-1 rounded text-gray-300">
                      {process.schedule}
                    </code>
                  </div>
                )}

                <Separator className="bg-gray-700" />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Business Owner</p>
                    <p className="text-white flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      {process.owner || "-"}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Technical Owner</p>
                    <p className="text-white flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      {process.technicalOwner || "-"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => navigate(`/technical-processes/${id}/diagram`)}
                >
                  <Network className="mr-2 h-4 w-4" />
                  View Process Diagram
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  disabled={process.status !== 'active'}
                >
                  <Play className="mr-2 h-4 w-4" />
                  Run Now
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  disabled={process.status !== 'active'}
                >
                  <Square className="mr-2 h-4 w-4" />
                  Stop Process
                </Button>
                <Link href={`/communications?entityType=technical_process&entityId=${process.id}`}>
                  <Button className="w-full justify-start" variant="outline">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    View Communications
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="interfaces" className="space-y-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Interfaces Used</CardTitle>
                <CardDescription className="text-gray-400">
                  Interfaces that this technical process consumes or provides
                </CardDescription>
              </CardHeader>
              <CardContent>
                {process.interfaces && process.interfaces.length > 0 ? (
                  <div className="space-y-2">
                    {process.interfaces.sort((a: any, b: any) => a.sequenceNumber - b.sequenceNumber).map((intf: any) => (
                      <div
                        key={intf.id}
                        className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-400 font-mono bg-gray-800 px-2 py-1 rounded">
                              {intf.sequenceNumber}
                            </span>
                            <Plug className="h-5 w-5 text-green-500" />
                          </div>
                          <div>
                            <Link href={`/interfaces/${intf.interfaceId}`}>
                              <a className="text-white font-medium hover:text-blue-400">
                                {intf.imlNumber}
                              </a>
                            </Link>
                            <p className="text-sm text-gray-400">
                              {intf.interfaceDescription || "No description"}
                            </p>
                          </div>
                        </div>
                        <Badge variant={intf.usageType === 'provides' ? 'default' : 'secondary'}>
                          {intf.usageType}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Plug className="h-12 w-12 mx-auto mb-2 text-gray-600" />
                    <p>No interfaces configured</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dependencies" className="space-y-4">
            {process.dependencies && process.dependencies.length > 0 && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Depends On</CardTitle>
                  <CardDescription className="text-gray-400">
                    Processes that must run before this one
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {process.dependencies.map((dep: any) => (
                      <div
                        key={dep.id}
                        className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <GitBranch className="h-5 w-5 text-blue-500" />
                          <div>
                            <Link href={`/technical-processes/${dep.dependsOnProcessId}`}>
                              <a className="text-white font-medium hover:text-blue-400">
                                {dep.dependsOnProcessName}
                              </a>
                            </Link>
                            {dep.description && (
                              <p className="text-sm text-gray-400">{dep.description}</p>
                            )}
                          </div>
                        </div>
                        {getDependencyTypeBadge(dep.dependencyType)}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {process.dependents && process.dependents.length > 0 && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Dependent Processes</CardTitle>
                  <CardDescription className="text-gray-400">
                    Processes that depend on this one
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {process.dependents.map((dep: any) => (
                      <div
                        key={dep.id}
                        className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <GitBranch className="h-5 w-5 text-purple-500" />
                          <div>
                            <Link href={`/technical-processes/${dep.technicalProcessId}`}>
                              <a className="text-white font-medium hover:text-blue-400">
                                {dep.processName}
                              </a>
                            </Link>
                            {dep.description && (
                              <p className="text-sm text-gray-400">{dep.description}</p>
                            )}
                          </div>
                        </div>
                        {getDependencyTypeBadge(dep.dependencyType)}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {(!process.dependencies || process.dependencies.length === 0) &&
             (!process.dependents || process.dependents.length === 0) && (
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="text-center py-8 text-gray-500">
                  <GitBranch className="h-12 w-12 mx-auto mb-2 text-gray-600" />
                  <p>No dependencies configured</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="execution" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-white">Last Run</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-white">
                    <CalendarCheck className="h-4 w-4 text-gray-500" />
                    {process.lastRunDate ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            {new Date(process.lastRunDate).toLocaleDateString()}
                          </TooltipTrigger>
                          <TooltipContent>
                            {new Date(process.lastRunDate).toLocaleString()}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <span className="text-gray-500">Never</span>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-white">Next Scheduled Run</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-white">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    {process.nextRunDate ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            {new Date(process.nextRunDate).toLocaleDateString()}
                          </TooltipTrigger>
                          <TooltipContent>
                            {new Date(process.nextRunDate).toLocaleString()}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <span className="text-gray-500">Not scheduled</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Execution History</CardTitle>
              </CardHeader>
              <CardContent className="text-center py-8 text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-2 text-gray-600" />
                <p>Execution history will be available when integrated with your job scheduling system</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl">
          <TechnicalProcessForm
            process={process}
            onSuccess={() => {
              setIsFormOpen(false);
              queryClient.invalidateQueries({ queryKey: [`/api/technical-processes/${id}`] });
            }}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-gray-800 border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Technical Process?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              This action cannot be undone. This will permanently delete the technical process
              "{process.name}" and remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-700 text-gray-300 hover:bg-gray-600 border-gray-600">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}