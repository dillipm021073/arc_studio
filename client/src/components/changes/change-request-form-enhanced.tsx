import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  CalendarIcon, 
  Plus, 
  X, 
  Server, 
  Plug,
  Search,
  AlertCircle,
  Cpu,
  Activity
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { insertChangeRequestSchema, type InsertChangeRequest } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface ImpactedApplication {
  applicationId: number;
  applicationName?: string;
  impactType: string;
  impactDescription: string;
}

interface ImpactedInterface {
  interfaceId: number;
  imlNumber?: string;
  impactType: string;
  impactDescription: string;
}

interface ImpactedTechnicalProcess {
  technicalProcessId: number;
  processName?: string;
  jobName?: string;
  impactType: string;
  impactDescription: string;
}

interface ImpactedInternalActivity {
  internalActivityId: number;
  activityName: string;
  applicationName?: string;
  activityType?: string;
  impactType: string;
  impactDescription: string;
}

interface ChangeRequestFormProps {
  onSuccess?: () => void;
  changeRequest?: any;
  isEditing?: boolean;
}

export default function ChangeRequestFormEnhanced({ 
  onSuccess, 
  changeRequest,
  isEditing = false 
}: ChangeRequestFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [impactedApplications, setImpactedApplications] = useState<ImpactedApplication[]>([]);
  const [impactedInterfaces, setImpactedInterfaces] = useState<ImpactedInterface[]>([]);
  const [impactedTechnicalProcesses, setImpactedTechnicalProcesses] = useState<ImpactedTechnicalProcess[]>([]);
  const [impactedInternalActivities, setImpactedInternalActivities] = useState<ImpactedInternalActivity[]>([]);
  const [applicationSearch, setApplicationSearch] = useState("");
  const [interfaceSearch, setInterfaceSearch] = useState("");
  const [technicalProcessSearch, setTechnicalProcessSearch] = useState("");
  const [internalActivitySearch, setInternalActivitySearch] = useState("");
  const [showApplicationSearch, setShowApplicationSearch] = useState(false);
  const [showInterfaceSearch, setShowInterfaceSearch] = useState(false);
  const [showTechnicalProcessSearch, setShowTechnicalProcessSearch] = useState(false);
  const [showInternalActivitySearch, setShowInternalActivitySearch] = useState(false);

  // Fetch all applications
  const { data: applications = [] } = useQuery({
    queryKey: ["/api/applications"],
  });

  // Fetch all interfaces
  const { data: interfaces = [] } = useQuery({
    queryKey: ["/api/interfaces"],
  });

  // Fetch all technical processes
  const { data: technicalProcesses = [] } = useQuery({
    queryKey: ["/api/technical-processes"],
  });

  // Fetch all internal activities
  const { data: internalActivities = [] } = useQuery({
    queryKey: ["/api/internal-activities"],
  });

  // Fetch existing impacts if editing
  useEffect(() => {
    if (isEditing && changeRequest?.id) {
      // Fetch impacted applications
      fetch(`/api/change-requests/${changeRequest.id}/applications`)
        .then(res => res.json())
        .then(data => {
          setImpactedApplications(data.map((item: any) => ({
            applicationId: item.applicationId,
            applicationName: item.application?.name,
            impactType: item.impactType || "modification",
            impactDescription: item.impactDescription || ""
          })));
        })
        .catch(console.error);

      // Fetch impacted interfaces
      fetch(`/api/change-requests/${changeRequest.id}/interfaces`)
        .then(res => res.json())
        .then(data => {
          setImpactedInterfaces(data.map((item: any) => ({
            interfaceId: item.interfaceId,
            imlNumber: item.interface?.imlNumber,
            impactType: item.impactType || "modification",
            impactDescription: item.impactDescription || ""
          })));
        })
        .catch(console.error);

      // Fetch impacted technical processes
      fetch(`/api/change-requests/${changeRequest.id}/technical-processes`)
        .then(res => res.json())
        .then(data => {
          setImpactedTechnicalProcesses(data.map((item: any) => ({
            technicalProcessId: item.technicalProcessId,
            processName: item.technicalProcess?.name,
            jobName: item.technicalProcess?.jobName,
            impactType: item.impactType || "modification",
            impactDescription: item.impactDescription || ""
          })));
        })
        .catch(console.error);

      // Fetch impacted internal activities
      fetch(`/api/change-requests/${changeRequest.id}/internal-activities`)
        .then(res => res.json())
        .then(data => {
          setImpactedInternalActivities(data.map((item: any) => ({
            internalActivityId: item.internalActivityId,
            activityName: item.internalActivity?.activityName,
            applicationName: item.internalActivity?.application?.name,
            activityType: item.internalActivity?.activityType,
            impactType: item.impactType || "modification",
            impactDescription: item.impactDescription || ""
          })));
        })
        .catch(console.error);
    }
  }, [isEditing, changeRequest?.id]);

  const form = useForm<InsertChangeRequest>({
    resolver: zodResolver(insertChangeRequestSchema),
    defaultValues: {
      crNumber: changeRequest?.crNumber || "",
      title: changeRequest?.title || "",
      description: changeRequest?.description ?? "",
      reason: changeRequest?.reason ?? "",
      benefit: changeRequest?.benefit ?? "",
      status: changeRequest?.status || "draft",
      priority: changeRequest?.priority || "medium",
      owner: changeRequest?.owner ?? "",
      requestedBy: changeRequest?.requestedBy ?? "",
      approvedBy: changeRequest?.approvedBy ?? "",
      targetDate: changeRequest?.targetDate 
        ? (typeof changeRequest.targetDate === 'string' 
          ? new Date(changeRequest.targetDate) 
          : changeRequest.targetDate)
        : undefined,
      completedDate: changeRequest?.completedDate 
        ? (typeof changeRequest.completedDate === 'string' 
          ? new Date(changeRequest.completedDate) 
          : changeRequest.completedDate)
        : undefined,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/change-requests", data);
      return response.json();
    },
    onSuccess: async (newCR) => {
      // Save impacts
      await saveImpacts(newCR.id);
      
      queryClient.invalidateQueries({ queryKey: ["/api/change-requests"] });
      toast({
        title: "Success",
        description: "Change request created successfully",
      });
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create change request",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PUT", `/api/change-requests/${changeRequest.id}`, data);
      return response.json();
    },
    onSuccess: async () => {
      // Update impacts
      await saveImpacts(changeRequest.id);
      
      queryClient.invalidateQueries({ queryKey: ["/api/change-requests"] });
      toast({
        title: "Success",
        description: "Change request updated successfully",
      });
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update change request",
        variant: "destructive",
      });
    },
  });

  const saveImpacts = async (changeRequestId: number) => {
    // Save application impacts
    await apiRequest("PUT", `/api/change-requests/${changeRequestId}/applications`, {
      applications: impactedApplications
    });

    // Save interface impacts
    await apiRequest("PUT", `/api/change-requests/${changeRequestId}/interfaces`, {
      interfaces: impactedInterfaces
    });

    // Save technical process impacts
    await apiRequest("PUT", `/api/change-requests/${changeRequestId}/technical-processes`, {
      technicalProcesses: impactedTechnicalProcesses
    });

    // Save internal activity impacts
    await apiRequest("PUT", `/api/change-requests/${changeRequestId}/internal-activities`, {
      internalActivities: impactedInternalActivities
    });
  };

  const onSubmit = (data: InsertChangeRequest) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const addApplication = (app: any) => {
    if (!impactedApplications.find(a => a.applicationId === app.id)) {
      setImpactedApplications([...impactedApplications, {
        applicationId: app.id,
        applicationName: app.name,
        impactType: "modification",
        impactDescription: ""
      }]);
    }
    setApplicationSearch("");
    setShowApplicationSearch(false);
  };

  const removeApplication = (index: number) => {
    setImpactedApplications(impactedApplications.filter((_, i) => i !== index));
  };

  const updateApplicationImpact = (index: number, field: string, value: string) => {
    const updated = [...impactedApplications];
    updated[index] = { ...updated[index], [field]: value };
    setImpactedApplications(updated);
  };

  const addInterface = (iface: any) => {
    if (!impactedInterfaces.find(i => i.interfaceId === iface.id)) {
      setImpactedInterfaces([...impactedInterfaces, {
        interfaceId: iface.id,
        imlNumber: iface.imlNumber,
        impactType: "modification",
        impactDescription: ""
      }]);
    }
    setInterfaceSearch("");
    setShowInterfaceSearch(false);
  };

  const removeInterface = (index: number) => {
    setImpactedInterfaces(impactedInterfaces.filter((_, i) => i !== index));
  };

  const updateInterfaceImpact = (index: number, field: string, value: string) => {
    const updated = [...impactedInterfaces];
    updated[index] = { ...updated[index], [field]: value };
    setImpactedInterfaces(updated);
  };

  const addTechnicalProcess = (process: any) => {
    if (!impactedTechnicalProcesses.find(p => p.technicalProcessId === process.id)) {
      setImpactedTechnicalProcesses([...impactedTechnicalProcesses, {
        technicalProcessId: process.id,
        processName: process.name,
        jobName: process.jobName,
        impactType: "modification",
        impactDescription: ""
      }]);
    }
    setTechnicalProcessSearch("");
    setShowTechnicalProcessSearch(false);
  };

  const removeTechnicalProcess = (index: number) => {
    setImpactedTechnicalProcesses(impactedTechnicalProcesses.filter((_, i) => i !== index));
  };

  const updateTechnicalProcessImpact = (index: number, field: string, value: string) => {
    const updated = [...impactedTechnicalProcesses];
    updated[index] = { ...updated[index], [field]: value };
    setImpactedTechnicalProcesses(updated);
  };

  const addInternalActivity = (activity: any) => {
    if (!impactedInternalActivities.find(a => a.internalActivityId === activity.id)) {
      setImpactedInternalActivities([...impactedInternalActivities, {
        internalActivityId: activity.id,
        activityName: activity.activityName,
        applicationName: activity.application?.name,
        activityType: activity.activityType,
        impactType: "modification",
        impactDescription: ""
      }]);
    }
    setInternalActivitySearch("");
    setShowInternalActivitySearch(false);
  };

  const removeInternalActivity = (index: number) => {
    setImpactedInternalActivities(impactedInternalActivities.filter((_, i) => i !== index));
  };

  const updateInternalActivityImpact = (index: number, field: string, value: string) => {
    const updated = [...impactedInternalActivities];
    updated[index] = { ...updated[index], [field]: value };
    setImpactedInternalActivities(updated);
  };

  const filteredApplications = (applications as any[]).filter((app: any) =>
    app.name && 
    app.name.toLowerCase().includes(applicationSearch.toLowerCase()) &&
    !impactedApplications.find(a => a.applicationId === app.id) &&
    app.status === 'active' // Only show active applications
  );

  const filteredInterfaces = (interfaces as any[]).filter((iface: any) =>
    iface.imlNumber && 
    iface.imlNumber.toLowerCase().includes(interfaceSearch.toLowerCase()) &&
    !impactedInterfaces.find(i => i.interfaceId === iface.id) &&
    iface.status === 'active' // Only show active interfaces
  );

  const filteredTechnicalProcesses = (technicalProcesses as any[]).filter((process: any) =>
    ((process.name && process.name.toLowerCase().includes(technicalProcessSearch.toLowerCase())) ||
     (process.jobName && process.jobName.toLowerCase().includes(technicalProcessSearch.toLowerCase()))) &&
    !impactedTechnicalProcesses.find(p => p.technicalProcessId === process.id) &&
    process.status === 'active' // Only show active technical processes
  );

  const filteredInternalActivities = (internalActivities as any[]).filter((activity: any) =>
    activity.activityName && 
    activity.activityName.toLowerCase().includes(internalActivitySearch.toLowerCase()) &&
    !impactedInternalActivities.find(a => a.internalActivityId === activity.id) &&
    activity.status === 'active' // Only show active internal activities
  );

  return (
    <div className="bg-gray-800 text-white">
      <DialogHeader>
        <DialogTitle className="text-white">{isEditing ? "Edit" : "Create"} Change Request</DialogTitle>
        <p className="text-sm text-gray-400 mt-2">
          {isEditing 
            ? "Update the change request details, status, and impacted systems." 
            : "Create a new change request to track proposed changes to applications and interfaces."}
        </p>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-5 bg-gray-700">
              <TabsTrigger value="general">General Information</TabsTrigger>
              <TabsTrigger value="applications">
                Application Impacts
                {impactedApplications.length > 0 && (
                  <Badge className="ml-2 bg-blue-600 text-white">{impactedApplications.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="interfaces">
                Interface Impacts
                {impactedInterfaces.length > 0 && (
                  <Badge className="ml-2 bg-blue-600 text-white">{impactedInterfaces.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="technical-processes">
                Technical Process Impacts
                {impactedTechnicalProcesses.length > 0 && (
                  <Badge className="ml-2 bg-blue-600 text-white">{impactedTechnicalProcesses.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="internal-activities">
                Internal Activity Impacts
                {impactedInternalActivities.length > 0 && (
                  <Badge className="ml-2 bg-blue-600 text-white">{impactedInternalActivities.length}</Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="crNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">CR Number</FormLabel>
                      <FormControl>
                        <Input placeholder="CR-2024-001" {...field} className="bg-gray-700 border-gray-600 text-white placeholder-gray-400" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Priority</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-gray-800 border-gray-700">
                          <SelectItem value="low" className="text-gray-300">Low</SelectItem>
                          <SelectItem value="medium" className="text-gray-300">Medium</SelectItem>
                          <SelectItem value="high" className="text-gray-300">High</SelectItem>
                          <SelectItem value="critical" className="text-gray-300">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Brief description of the change" {...field} className="bg-gray-700 border-gray-600 text-white placeholder-gray-400" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Detailed description of the change request" 
                        className="min-h-[100px] bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Reason for Change</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Why is this change needed?" 
                          className="min-h-[80px] bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                          {...field}
                          value={field.value ?? ""} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="benefit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Expected Benefit</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="What benefits will this change bring?" 
                          className="min-h-[80px] bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                          {...field}
                          value={field.value ?? ""} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-gray-800 border-gray-700">
                          <SelectItem value="new" className="text-gray-300">New</SelectItem>
                          <SelectItem value="draft" className="text-gray-300">Draft</SelectItem>
                          <SelectItem value="submitted" className="text-gray-300">Submitted</SelectItem>
                          <SelectItem value="under_review" className="text-gray-300">Under Review</SelectItem>
                          <SelectItem value="approved" className="text-gray-300">Approved</SelectItem>
                          <SelectItem value="rejected" className="text-gray-300">Rejected</SelectItem>
                          <SelectItem value="in_progress" className="text-gray-300">In Progress</SelectItem>
                          <SelectItem value="completed" className="text-gray-300">Completed</SelectItem>
                          <SelectItem value="cancelled" className="text-gray-300">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="targetDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-gray-300">Target Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal bg-gray-700 border-gray-600 text-white hover:bg-gray-600",
                                !field.value && "text-gray-400"
                              )}
                            >
                              {field.value ? (
                                format(new Date(field.value), "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value ? new Date(field.value) : undefined}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date(new Date().setHours(0, 0, 0, 0))
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="completedDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-gray-300">Completed Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal bg-gray-700 border-gray-600 text-white hover:bg-gray-600",
                                !field.value && "text-gray-400"
                              )}
                            >
                              {field.value ? (
                                format(new Date(field.value), "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value ? new Date(field.value) : undefined}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="owner"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Owner</FormLabel>
                      <FormControl>
                        <Input placeholder="Change owner" {...field} value={field.value ?? ""} className="bg-gray-700 border-gray-600 text-white placeholder-gray-400" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="requestedBy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Requested By</FormLabel>
                      <FormControl>
                        <Input placeholder="Requester name" {...field} value={field.value ?? ""} className="bg-gray-700 border-gray-600 text-white placeholder-gray-400" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="approvedBy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Approved By</FormLabel>
                      <FormControl>
                        <Input placeholder="Approver name" {...field} value={field.value ?? ""} className="bg-gray-700 border-gray-600 text-white placeholder-gray-400" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </TabsContent>

            <TabsContent value="applications" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Impacted Applications</CardTitle>
                    <div className="relative">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowApplicationSearch(!showApplicationSearch)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Application
                      </Button>
                      {showApplicationSearch && (
                        <div className="absolute right-0 top-full mt-2 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-4 z-50">
                          <div className="relative mb-2">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              placeholder="Search applications..."
                              value={applicationSearch}
                              onChange={(e) => setApplicationSearch(e.target.value)}
                              className="pl-9 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                              autoFocus
                            />
                          </div>
                          <ScrollArea className="h-60">
                            {filteredApplications.length === 0 ? (
                              <p className="text-sm text-gray-400 text-center py-4">No applications found</p>
                            ) : (
                              <div className="space-y-1">
                                {filteredApplications.slice(0, 10).map((app: any) => (
                                  <button
                                    key={app.id}
                                    type="button"
                                    onClick={() => addApplication(app)}
                                    className="w-full text-left p-2 hover:bg-gray-700 rounded flex items-center space-x-2"
                                  >
                                    <Server className="h-4 w-4 text-blue-400" />
                                    <div>
                                      <p className="font-medium text-sm text-white">{app.name}</p>
                                      <p className="text-xs text-gray-400">{app.description}</p>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </ScrollArea>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {impactedApplications.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Server className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No applications impacted</p>
                      <p className="text-xs mt-1">Click "Add Application" to add impacted applications</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {impactedApplications.map((app, index) => (
                        <div key={index} className="border rounded-lg p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Server className="h-4 w-4 text-blue-600" />
                              <span className="font-medium">{app.applicationName}</span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeApplication(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <Select
                              value={app.impactType}
                              onValueChange={(value) => updateApplicationImpact(index, "impactType", value)}
                            >
                              <SelectTrigger className="h-8 text-sm bg-gray-700 border-gray-600 text-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-gray-800 border-gray-700">
                                <SelectItem value="modification" className="text-gray-300">Modification</SelectItem>
                                <SelectItem value="dependency" className="text-gray-300">Dependency</SelectItem>
                                <SelectItem value="testing" className="text-gray-300">Testing Only</SelectItem>
                                <SelectItem value="configuration" className="text-gray-300">Configuration</SelectItem>
                              </SelectContent>
                            </Select>
                            <Input
                              placeholder="Impact description"
                              value={app.impactDescription}
                              onChange={(e) => updateApplicationImpact(index, "impactDescription", e.target.value)}
                              className="h-8 text-sm"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="interfaces" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Impacted Interfaces</CardTitle>
                    <div className="relative">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowInterfaceSearch(!showInterfaceSearch)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Interface
                      </Button>
                      {showInterfaceSearch && (
                        <div className="absolute right-0 top-full mt-2 w-80 bg-white border rounded-lg shadow-lg p-4 z-50">
                          <div className="relative mb-2">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              placeholder="Search interfaces..."
                              value={interfaceSearch}
                              onChange={(e) => setInterfaceSearch(e.target.value)}
                              className="pl-9"
                              autoFocus
                            />
                          </div>
                          <ScrollArea className="h-60">
                            {filteredInterfaces.length === 0 ? (
                              <p className="text-sm text-gray-500 text-center py-4">No interfaces found</p>
                            ) : (
                              <div className="space-y-1">
                                {filteredInterfaces.slice(0, 10).map((iface: any) => (
                                  <button
                                    key={iface.id}
                                    type="button"
                                    onClick={() => addInterface(iface)}
                                    className="w-full text-left p-2 hover:bg-gray-100 rounded flex items-center space-x-2"
                                  >
                                    <Plug className="h-4 w-4 text-green-600" />
                                    <div>
                                      <p className="font-medium text-sm">{iface.imlNumber}</p>
                                      <p className="text-xs text-gray-500">
                                        {iface.interfaceType} - v{iface.version}
                                      </p>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </ScrollArea>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {impactedInterfaces.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Plug className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No interfaces impacted</p>
                      <p className="text-xs mt-1">Click "Add Interface" to add impacted interfaces</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {impactedInterfaces.map((iface, index) => (
                        <div key={index} className="border rounded-lg p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Plug className="h-4 w-4 text-green-600" />
                              <span className="font-medium">{iface.imlNumber}</span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeInterface(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <Select
                              value={iface.impactType}
                              onValueChange={(value) => updateInterfaceImpact(index, "impactType", value)}
                            >
                              <SelectTrigger className="h-8 text-sm bg-gray-700 border-gray-600 text-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-gray-800 border-gray-700">
                                <SelectItem value="modification" className="text-gray-300">Modification</SelectItem>
                                <SelectItem value="version_change" className="text-gray-300">Version Change</SelectItem>
                                <SelectItem value="deprecation" className="text-gray-300">Deprecation</SelectItem>
                                <SelectItem value="testing" className="text-gray-300">Testing Only</SelectItem>
                              </SelectContent>
                            </Select>
                            <Input
                              placeholder="Impact description"
                              value={iface.impactDescription}
                              onChange={(e) => updateInterfaceImpact(index, "impactDescription", e.target.value)}
                              className="h-8 text-sm"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="technical-processes" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Impacted Technical Processes</CardTitle>
                    <div className="relative">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowTechnicalProcessSearch(!showTechnicalProcessSearch)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Technical Process
                      </Button>
                      {showTechnicalProcessSearch && (
                        <div className="absolute right-0 top-full mt-2 w-80 bg-white border rounded-lg shadow-lg p-4 z-50">
                          <div className="relative mb-2">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              placeholder="Search technical processes..."
                              value={technicalProcessSearch}
                              onChange={(e) => setTechnicalProcessSearch(e.target.value)}
                              className="pl-9"
                              autoFocus
                            />
                          </div>
                          <ScrollArea className="h-60">
                            {filteredTechnicalProcesses.length === 0 ? (
                              <p className="text-sm text-gray-500 text-center py-4">No technical processes found</p>
                            ) : (
                              <div className="space-y-1">
                                {filteredTechnicalProcesses.slice(0, 10).map((process: any) => (
                                  <button
                                    key={process.id}
                                    type="button"
                                    onClick={() => addTechnicalProcess(process)}
                                    className="w-full text-left p-2 hover:bg-gray-100 rounded flex items-center space-x-2"
                                  >
                                    <Cpu className="h-4 w-4 text-purple-600" />
                                    <div>
                                      <p className="font-medium text-sm">{process.name}</p>
                                      <p className="text-xs text-gray-500">{process.jobName} - {process.frequency}</p>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </ScrollArea>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {impactedTechnicalProcesses.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Cpu className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No technical processes impacted</p>
                      <p className="text-xs mt-1">Click "Add Technical Process" to add impacted processes</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {impactedTechnicalProcesses.map((process, index) => (
                        <div key={index} className="border rounded-lg p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Cpu className="h-4 w-4 text-purple-600" />
                              <span className="font-medium">{process.processName} ({process.jobName})</span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeTechnicalProcess(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <Select
                              value={process.impactType}
                              onValueChange={(value) => updateTechnicalProcessImpact(index, "impactType", value)}
                            >
                              <SelectTrigger className="h-8 text-sm bg-gray-700 border-gray-600 text-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-gray-800 border-gray-700">
                                <SelectItem value="modification" className="text-gray-300">Modification</SelectItem>
                                <SelectItem value="dependency" className="text-gray-300">Dependency</SelectItem>
                                <SelectItem value="testing" className="text-gray-300">Testing Only</SelectItem>
                                <SelectItem value="schedule_change" className="text-gray-300">Schedule Change</SelectItem>
                              </SelectContent>
                            </Select>
                            <Input
                              placeholder="Impact description"
                              value={process.impactDescription}
                              onChange={(e) => updateTechnicalProcessImpact(index, "impactDescription", e.target.value)}
                              className="h-8 text-sm"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="internal-activities" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Impacted Internal Activities</CardTitle>
                    <div className="relative">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowInternalActivitySearch(!showInternalActivitySearch)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Internal Activity
                      </Button>
                      {showInternalActivitySearch && (
                        <div className="absolute right-0 top-full mt-2 w-80 bg-white border rounded-lg shadow-lg p-4 z-50">
                          <div className="relative mb-2">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              placeholder="Search internal activities..."
                              value={internalActivitySearch}
                              onChange={(e) => setInternalActivitySearch(e.target.value)}
                              className="pl-9"
                              autoFocus
                            />
                          </div>
                          <ScrollArea className="h-60">
                            {filteredInternalActivities.length === 0 ? (
                              <p className="text-sm text-gray-500 text-center py-4">No internal activities found</p>
                            ) : (
                              <div className="space-y-1">
                                {filteredInternalActivities.map((activity: any) => (
                                  <div
                                    key={activity.id}
                                    className="p-3 hover:bg-gray-50 rounded-lg cursor-pointer border border-transparent hover:border-gray-200"
                                    onClick={() => addInternalActivity(activity)}
                                  >
                                    <div className="flex items-center space-x-2">
                                      <Activity className="h-4 w-4 text-orange-600" />
                                      <div>
                                        <p className="text-sm font-medium text-black">{activity.activityName}</p>
                                        <p className="text-xs text-gray-500">
                                          {activity.application?.name} • {activity.activityType}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </ScrollArea>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {impactedInternalActivities.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Activity className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                      <p className="text-sm">No internal activities added</p>
                      <p className="text-xs mt-1">Use the button above to add internal activities that will be impacted</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {impactedInternalActivities.map((activity, index) => (
                        <div key={index} className="border rounded-lg p-3 bg-gray-50">
                          <div className="flex items-start space-x-3">
                            <Activity className="h-5 w-5 text-orange-600 mt-0.5" />
                            <div className="flex-1 space-y-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="text-sm font-medium text-black">{activity.activityName}</h4>
                                  <p className="text-xs text-gray-500">
                                    {activity.applicationName} • {activity.activityType}
                                  </p>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeInternalActivity(index)}
                                  className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <Label className="text-xs font-medium text-gray-700">Impact Type</Label>
                                  <Select
                                    value={activity.impactType}
                                    onValueChange={(value) => updateInternalActivityImpact(index, 'impactType', value)}
                                  >
                                    <SelectTrigger className="h-8">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="modification">Modification</SelectItem>
                                      <SelectItem value="dependency">Dependency</SelectItem>
                                      <SelectItem value="testing">Testing</SelectItem>
                                      <SelectItem value="configuration">Configuration</SelectItem>
                                      <SelectItem value="sequence_change">Sequence Change</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label className="text-xs font-medium text-gray-700">Impact Description</Label>
                                  <Input
                                    placeholder="Describe the impact..."
                                    value={activity.impactDescription}
                                    onChange={(e) => updateInternalActivityImpact(index, 'impactDescription', e.target.value)}
                                    className="h-8"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-between items-center pt-4 border-t">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <AlertCircle className="h-4 w-4" />
              <span>
                {impactedApplications.length} application{impactedApplications.length !== 1 ? 's' : ''},{' '}
                {impactedInterfaces.length} interface{impactedInterfaces.length !== 1 ? 's' : ''},{' '}
                {impactedTechnicalProcesses.length} technical process{impactedTechnicalProcesses.length !== 1 ? 'es' : ''}, and{' '}
                {impactedInternalActivities.length} internal activit{impactedInternalActivities.length !== 1 ? 'ies' : 'y'} impacted
              </span>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onSuccess?.()}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending ? "Saving..." : isEditing ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}