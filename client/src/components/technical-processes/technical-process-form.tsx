import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CalendarIcon, 
  Plus, 
  X, 
  Cpu, 
  Plug,
  Search,
  AlertCircle,
  Clock,
  Activity
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";

const technicalProcessSchema = z.object({
  name: z.string().min(1, "Process name is required"),
  jobName: z.string().min(1, "Job name is required"),
  applicationId: z.number().nullable(),
  description: z.string().nullable(),
  frequency: z.enum(["scheduled", "on-demand", "real-time", "batch"]),
  schedule: z.string().nullable(),
  criticality: z.enum(["low", "medium", "high", "critical"]),
  status: z.enum(["active", "inactive", "deprecated"]),
  owner: z.string().nullable(),
  technicalOwner: z.string().nullable(),
  lastRunDate: z.string().nullable(),
  nextRunDate: z.string().nullable(),
});

type TechnicalProcessFormData = z.infer<typeof technicalProcessSchema>;

interface ProcessInterface {
  interfaceId: number;
  sequenceNumber: number;
  usageType: 'consumes' | 'provides';
  description?: string;
}

interface ProcessInternalActivity {
  internalActivityId: number;
  sequenceNumber: number;
  description?: string;
}

interface TechnicalProcessFormProps {
  process?: any;
  onSuccess?: () => void;
}

export default function TechnicalProcessForm({ process, onSuccess }: TechnicalProcessFormProps) {
  const { toast } = useToast();
  const isEditing = !!process && process.id > 0;
  
  const [interfaces, setInterfaces] = useState<ProcessInterface[]>([]);
  const [internalActivities, setInternalActivities] = useState<ProcessInternalActivity[]>([]);
  const [interfaceSearch, setInterfaceSearch] = useState("");
  const [activitySearch, setActivitySearch] = useState("");
  const [showInterfaceSearch, setShowInterfaceSearch] = useState(false);
  const [showActivitySearch, setShowActivitySearch] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<number | null>(null);

  // Fetch applications
  const { data: applications = [] } = useQuery({
    queryKey: ["/api/applications"],
  });

  // Fetch all interfaces
  const { data: allInterfaces = [] } = useQuery({
    queryKey: ["/api/interfaces"],
  });

  // Fetch internal activities for the selected application
  const { data: allInternalActivities = [] } = useQuery({
    queryKey: ["/api/internal-activities", selectedApplication],
    queryFn: async () => {
      if (!selectedApplication) return [];
      const response = await fetch(`/api/internal-activities?applicationId=${selectedApplication}`);
      if (!response.ok) throw new Error("Failed to fetch internal activities");
      return response.json();
    },
    enabled: !!selectedApplication,
  });

  // Load existing data if editing
  useEffect(() => {
    if (process?.id) {
      fetch(`/api/technical-processes/${process.id}`)
        .then(res => res.json())
        .then(data => {
          setInterfaces(data.interfaces || []);
          setInternalActivities(data.internalActivities || []);
          if (data.applicationId) {
            setSelectedApplication(data.applicationId);
          }
        });
    }
  }, [process?.id]);

  const form = useForm<TechnicalProcessFormData>({
    resolver: zodResolver(technicalProcessSchema),
    defaultValues: {
      name: process?.name || "",
      jobName: process?.jobName || "",
      applicationId: process?.applicationId || null,
      description: process?.description || "",
      frequency: process?.frequency || "on-demand",
      schedule: process?.schedule || "",
      criticality: process?.criticality || "medium",
      status: process?.status || "active",
      owner: process?.owner || "",
      technicalOwner: process?.technicalOwner || "",
      lastRunDate: process?.lastRunDate || null,
      nextRunDate: process?.nextRunDate || null,
    },
  });

  // Watch application selection and update state
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "applicationId") {
        setSelectedApplication(value.applicationId);
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/technical-processes", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Technical process created successfully",
      });
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create technical process",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PUT", `/api/technical-processes/${process.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Technical process updated successfully",
      });
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update technical process",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TechnicalProcessFormData) => {
    const payload = {
      ...data,
      interfaces,
      internalActivities,
    };

    if (isEditing) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const addInterface = (iface: any) => {
    if (!interfaces.find(i => i.interfaceId === iface.id)) {
      const maxSequence = Math.max(0, ...interfaces.map(i => i.sequenceNumber));
      setInterfaces([...interfaces, {
        interfaceId: iface.id,
        sequenceNumber: maxSequence + 1,
        usageType: 'consumes',
        description: ''
      }]);
    }
    setInterfaceSearch("");
    setShowInterfaceSearch(false);
  };

  const removeInterface = (index: number) => {
    setInterfaces(interfaces.filter((_, i) => i !== index));
  };

  const updateInterfaceSequence = (index: number, newSequence: number) => {
    const updated = [...interfaces];
    updated[index].sequenceNumber = newSequence;
    setInterfaces(updated.sort((a, b) => a.sequenceNumber - b.sequenceNumber));
  };

  const addInternalActivity = (activity: any) => {
    if (!internalActivities.find(a => a.internalActivityId === activity.activity.id)) {
      const maxSequence = Math.max(0, ...internalActivities.map(a => a.sequenceNumber));
      setInternalActivities([...internalActivities, {
        internalActivityId: activity.activity.id,
        sequenceNumber: maxSequence + 1,
        description: ''
      }]);
    }
    setActivitySearch("");
    setShowActivitySearch(false);
  };

  const removeInternalActivity = (index: number) => {
    setInternalActivities(internalActivities.filter((_, i) => i !== index));
  };

  const updateActivitySequence = (index: number, newSequence: number) => {
    const updated = [...internalActivities];
    updated[index].sequenceNumber = newSequence;
    setInternalActivities(updated.sort((a, b) => a.sequenceNumber - b.sequenceNumber));
  };

  const filteredInterfaces = allInterfaces.filter((iface: any) =>
    iface.imlNumber.toLowerCase().includes(interfaceSearch.toLowerCase()) &&
    !interfaces.find(i => i.interfaceId === iface.id)
  );

  const filteredActivities = allInternalActivities.filter((activityItem: any) =>
    activityItem.activity.activityName.toLowerCase().includes(activitySearch.toLowerCase()) &&
    !internalActivities.find(a => a.internalActivityId === activityItem.activity.id)
  );

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-white flex items-center gap-2">
          <Cpu className="h-5 w-5 text-purple-500" />
          {isEditing ? "Edit Technical Process" : "Create Technical Process"}
        </DialogTitle>
      </DialogHeader>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-gray-700">
              <TabsTrigger value="general">General Information</TabsTrigger>
              <TabsTrigger value="interfaces">
                Interfaces
                {interfaces.length > 0 && (
                  <Badge className="ml-2 bg-purple-600 text-white" variant="secondary">
                    {interfaces.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="activities">
                Internal Activities
                {internalActivities.length > 0 && (
                  <Badge className="ml-2 bg-purple-600 text-white" variant="secondary">
                    {internalActivities.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="h-[500px] w-full">
              <TabsContent value="general" className="space-y-4 mt-4 px-1">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Process Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Data Synchronization" 
                          {...field} 
                          className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="jobName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Job Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="sync_customer_data" 
                          {...field} 
                          className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe what this technical process does..."
                        {...field}
                        value={field.value || ""}
                        className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="applicationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">Application</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(value === "none" ? null : value ? parseInt(value) : null)}
                      value={field.value?.toString() || "none"}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                          <SelectValue placeholder="Select an application" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="none" className="text-gray-300">None</SelectItem>
                        {applications.map((app: any) => (
                          <SelectItem 
                            key={app.id} 
                            value={app.id.toString()}
                            className="text-gray-300"
                          >
                            {app.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="frequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Frequency</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-gray-800 border-gray-700">
                          <SelectItem value="on-demand" className="text-gray-300">On-Demand</SelectItem>
                          <SelectItem value="scheduled" className="text-gray-300">Scheduled</SelectItem>
                          <SelectItem value="real-time" className="text-gray-300">Real-Time</SelectItem>
                          <SelectItem value="batch" className="text-gray-300">Batch</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="criticality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Criticality</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-gray-800 border-gray-700">
                          <SelectItem value="low" className="text-gray-300">Low</SelectItem>
                          <SelectItem value="medium" className="text-gray-300">Medium</SelectItem>
                          <SelectItem value="high" className="text-gray-300">High</SelectItem>
                          <SelectItem value="critical" className="text-gray-300">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
              </div>

              {form.watch("frequency") === "scheduled" && (
                <FormField
                  control={form.control}
                  name="schedule"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Schedule (Cron Expression)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="0 0 * * * (daily at midnight)" 
                          {...field} 
                          value={field.value || ""}
                          className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
              )}

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-gray-800 border-gray-700">
                          <SelectItem value="new" className="text-gray-300">New</SelectItem>
                          <SelectItem value="active" className="text-gray-300">Active</SelectItem>
                          <SelectItem value="inactive" className="text-gray-300">Inactive</SelectItem>
                          <SelectItem value="deprecated" className="text-gray-300">Deprecated</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="owner"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Business Owner</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Owner name" 
                          {...field} 
                          value={field.value || ""}
                          className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="technicalOwner"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">Technical Owner</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Technical owner name" 
                        {...field} 
                        value={field.value || ""}
                        className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="lastRunDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Last Run Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal bg-gray-700 border-gray-600 text-white hover:bg-gray-600",
                                !field.value && "text-gray-400"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? format(new Date(field.value), "PPP") : <span>Pick a date</span>}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value ? new Date(field.value) : undefined}
                            onSelect={(date) => field.onChange(date ? date.toISOString() : null)}
                            initialFocus
                            className="bg-gray-800 text-white"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nextRunDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Next Run Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal bg-gray-700 border-gray-600 text-white hover:bg-gray-600",
                                !field.value && "text-gray-400"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? format(new Date(field.value), "PPP") : <span>Pick a date</span>}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value ? new Date(field.value) : undefined}
                            onSelect={(date) => field.onChange(date ? date.toISOString() : null)}
                            initialFocus
                            className="bg-gray-800 text-white"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </TabsContent>

            <TabsContent value="interfaces" className="space-y-4 mt-4 px-1">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-300">Process Interfaces</h3>
                  <div className="relative">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowInterfaceSearch(!showInterfaceSearch)}
                      className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Interface
                    </Button>
                    {showInterfaceSearch && (
                      <div className="absolute right-0 top-full mt-2 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-4 z-50">
                        <div className="relative mb-2">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Search interfaces..."
                            value={interfaceSearch}
                            onChange={(e) => setInterfaceSearch(e.target.value)}
                            className="pl-9 bg-gray-700 border-gray-600 text-white"
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
                                  className="w-full text-left p-2 hover:bg-gray-700 rounded flex items-center space-x-2"
                                >
                                  <Plug className="h-4 w-4 text-green-500" />
                                  <div>
                                    <p className="font-medium text-sm text-white">{iface.imlNumber}</p>
                                    <p className="text-xs text-gray-400">{iface.description}</p>
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

                {interfaces.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Plug className="h-12 w-12 mx-auto mb-2 text-gray-600" />
                    <p className="text-sm">No interfaces configured</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {interfaces.sort((a, b) => a.sequenceNumber - b.sequenceNumber).map((iface, index) => (
                      <div key={index} className="flex items-center gap-2 p-3 bg-gray-700 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={iface.sequenceNumber}
                            onChange={(e) => updateInterfaceSequence(index, parseInt(e.target.value) || 1)}
                            className="w-16 bg-gray-600 border-gray-500 text-white text-center"
                            min="1"
                          />
                          <Plug className="h-4 w-4 text-green-500" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-white">
                            {allInterfaces.find((i: any) => i.id === iface.interfaceId)?.imlNumber || 'Unknown'}
                          </p>
                        </div>
                        <Select
                          value={iface.usageType}
                          onValueChange={(value: any) => {
                            const updated = [...interfaces];
                            updated[index].usageType = value;
                            setInterfaces(updated);
                          }}
                        >
                          <SelectTrigger className="w-32 bg-gray-600 border-gray-500 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-700">
                            <SelectItem value="consumes" className="text-gray-300">Consumes</SelectItem>
                            <SelectItem value="provides" className="text-gray-300">Provides</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeInterface(index)}
                          className="text-gray-400 hover:text-red-400"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="activities" className="space-y-4 mt-4 px-1">
              <div className="space-y-4">
                {!selectedApplication ? (
                  <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div className="text-sm text-yellow-200">
                        <p className="font-medium">Select an Application First</p>
                        <p className="text-yellow-300/70 mt-1">
                          Please select an application in the General Information tab to view and add internal activities.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-300">Internal Activities</h3>
                      <div className="relative">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowActivitySearch(!showActivitySearch)}
                          className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Activity
                        </Button>
                        {showActivitySearch && (
                          <div className="absolute right-0 top-full mt-2 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-4 z-50">
                            <div className="relative mb-2">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                              <Input
                                placeholder="Search activities..."
                                value={activitySearch}
                                onChange={(e) => setActivitySearch(e.target.value)}
                                className="pl-9 bg-gray-700 border-gray-600 text-white"
                                autoFocus
                              />
                            </div>
                            <ScrollArea className="h-60">
                              {filteredActivities.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-4">No activities found</p>
                              ) : (
                                <div className="space-y-1">
                                  {filteredActivities.slice(0, 10).map((activityItem: any) => (
                                    <button
                                      key={activityItem.activity.id}
                                      type="button"
                                      onClick={() => addInternalActivity(activityItem)}
                                      className="w-full text-left p-2 hover:bg-gray-700 rounded flex items-center space-x-2"
                                    >
                                      <Activity className="h-4 w-4 text-green-500" />
                                      <div>
                                        <p className="font-medium text-sm text-white">{activityItem.activity.activityName}</p>
                                        <p className="text-xs text-gray-400">{activityItem.activity.activityType}</p>
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

                    {internalActivities.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Activity className="h-12 w-12 mx-auto mb-2 text-gray-600" />
                        <p className="text-sm">No internal activities configured</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {internalActivities.sort((a, b) => a.sequenceNumber - b.sequenceNumber).map((act, index) => {
                          const activityData = allInternalActivities.find((a: any) => a.activity.id === act.internalActivityId);
                          return (
                            <div key={index} className="flex items-center gap-2 p-3 bg-gray-700 rounded-lg">
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  value={act.sequenceNumber}
                                  onChange={(e) => updateActivitySequence(index, parseInt(e.target.value) || 1)}
                                  className="w-16 bg-gray-600 border-gray-500 text-white text-center"
                                  min="1"
                                />
                                <Activity className="h-4 w-4 text-green-500" />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-white">
                                  {activityData?.activity?.activityName || 'Unknown'}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {activityData?.activity?.activityType}
                                </p>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeInternalActivity(index)}
                                className="text-gray-400 hover:text-red-400"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            </TabsContent>
            </ScrollArea>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {createMutation.isPending || updateMutation.isPending
                ? "Saving..."
                : isEditing
                ? "Update Process"
                : "Create Process"}
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
}