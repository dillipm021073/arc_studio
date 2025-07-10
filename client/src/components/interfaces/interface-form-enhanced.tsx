import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { insertInterfaceSchema, type InsertInterface, type Application, type BusinessProcess } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useState, useEffect } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";

interface InterfaceFormEnhancedProps {
  onSuccess?: () => void;
  initialData?: Partial<InsertInterface>;
  interfaceId?: number;
  isEditing?: boolean;
}

interface BusinessProcessAssignment {
  businessProcessId: number;
  sequenceNumber: number;
  description?: string;
  businessProcess?: BusinessProcess;
}

export default function InterfaceFormEnhanced({ 
  onSuccess, 
  initialData, 
  interfaceId,
  isEditing = false 
}: InterfaceFormEnhancedProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [businessProcessAssignments, setBusinessProcessAssignments] = useState<BusinessProcessAssignment[]>([]);

  const { data: applications } = useQuery<Application[]>({
    queryKey: ["/api/applications"],
  });
  
  // Filter to show only active applications
  const activeApplications = applications?.filter(app => app.status === 'active') || [];

  const { data: businessProcesses } = useQuery<BusinessProcess[]>({
    queryKey: ["/api/business-processes"],
  });

  // Fetch existing business process assignments if editing
  const { data: existingAssignments } = useQuery({
    queryKey: ["/api/interfaces", interfaceId, "business-processes"],
    enabled: isEditing && !!interfaceId,
    queryFn: async () => {
      const response = await fetch(`/api/interfaces/${interfaceId}/business-processes`);
      if (!response.ok) throw new Error("Failed to fetch business process assignments");
      return response.json();
    },
  });

  useEffect(() => {
    if (existingAssignments) {
      setBusinessProcessAssignments(existingAssignments.map((assignment: any) => ({
        businessProcessId: assignment.businessProcessId,
        sequenceNumber: assignment.sequenceNumber,
        description: assignment.description,
        businessProcess: businessProcesses?.find(bp => bp.id === assignment.businessProcessId)
      })));
    }
  }, [existingAssignments, businessProcesses]);

  const form = useForm<InsertInterface>({
    resolver: zodResolver(insertInterfaceSchema),
    defaultValues: {
      imlNumber: initialData?.imlNumber || "",
      description: initialData?.description || "",
      providerApplicationId: initialData?.providerApplicationId || undefined,
      consumerApplicationId: initialData?.consumerApplicationId || undefined,
      interfaceType: initialData?.interfaceType || "",
      middleware: initialData?.middleware || "None",
      version: initialData?.version || "1.0",
      lob: initialData?.lob || "",
      businessProcessName: initialData?.businessProcessName || "",
      customerFocal: initialData?.customerFocal || "",
      providerOwner: initialData?.providerOwner || "",
      consumerOwner: initialData?.consumerOwner || "",
      status: initialData?.status || "active",
      sampleCode: initialData?.sampleCode || "",
      connectivitySteps: initialData?.connectivitySteps || "",
      interfaceTestSteps: initialData?.interfaceTestSteps || "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertInterface) => {
      // Create or update the interface
      const interfaceResponse = await apiRequest(
        isEditing ? "PUT" : "POST", 
        isEditing ? `/api/interfaces/${interfaceId}` : "/api/interfaces", 
        data
      );
      const interfaceData = await interfaceResponse.json();

      // Manage business process assignments
      const currentInterfaceId = isEditing ? interfaceId : interfaceData.id;
      
      if (isEditing && interfaceId) {
        // For existing interfaces, we need to handle BP updates differently
        // Since PUT endpoint has routing issues, let's delete and re-add
        
        // First, get existing assignments to delete them individually
        const existingResponse = await fetch(`/api/interfaces/${interfaceId}/business-processes`);
        const existingAssignments = await existingResponse.json();
        
        // Delete each existing assignment
        for (const existing of existingAssignments) {
          if (existing.id) {
            await apiRequest("DELETE", `/api/business-process-interfaces/${existing.id}`);
          }
        }
        
        // Then add all new assignments
        for (const assignment of businessProcessAssignments) {
          await apiRequest("POST", `/api/interfaces/${interfaceId}/business-processes`, {
            businessProcessId: assignment.businessProcessId,
            sequenceNumber: assignment.sequenceNumber,
            description: assignment.description,
          });
        }
      } else {
        // For new interfaces, add all business process assignments
        for (const assignment of businessProcessAssignments) {
          await apiRequest("POST", `/api/interfaces/${currentInterfaceId}/business-processes`, {
            businessProcessId: assignment.businessProcessId,
            sequenceNumber: assignment.sequenceNumber,
            description: assignment.description,
          });
        }
      }

      return interfaceData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/interfaces"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      if (interfaceId) {
        queryClient.invalidateQueries({ queryKey: ["/api/interfaces", interfaceId, "business-processes"] });
      }
      toast({
        title: isEditing ? "Interface updated" : "Interface created",
        description: `The interface has been successfully ${isEditing ? "updated" : "created"}.`,
      });
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? "update" : "create"} interface. Please try again.`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertInterface) => {
    createMutation.mutate(data);
  };

  const addBusinessProcess = () => {
    const availableProcesses = businessProcesses?.filter(
      bp => !businessProcessAssignments.find(a => a.businessProcessId === bp.id)
    );
    
    if (availableProcesses && availableProcesses.length > 0) {
      const nextSequence = businessProcessAssignments.length > 0 
        ? Math.max(...businessProcessAssignments.map(a => a.sequenceNumber)) + 1 
        : 1;
      
      setBusinessProcessAssignments([
        ...businessProcessAssignments,
        {
          businessProcessId: availableProcesses[0].id,
          sequenceNumber: nextSequence,
          businessProcess: availableProcesses[0]
        }
      ]);
    }
  };

  const removeBusinessProcess = (index: number) => {
    setBusinessProcessAssignments(businessProcessAssignments.filter((_, i) => i !== index));
  };

  const updateBusinessProcessAssignment = (index: number, field: keyof BusinessProcessAssignment, value: any) => {
    const updated = [...businessProcessAssignments];
    updated[index] = { ...updated[index], [field]: value };
    
    if (field === 'businessProcessId') {
      updated[index].businessProcess = businessProcesses?.find(bp => bp.id === value);
    }
    
    setBusinessProcessAssignments(updated);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-white">{isEditing ? "Edit Interface" : "Add New Interface"}</DialogTitle>
        <p className="text-sm text-gray-400 mt-2">
          {isEditing 
            ? "Update the interface configuration and connectivity details." 
            : "Define a new interface between applications. IML (Interface Master List) helps track all external interfaces."}
        </p>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Interface Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b border-gray-700 pb-2 text-white">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="imlNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">IML Number *</FormLabel>
                  <FormControl>
                    <Input placeholder="IML-2024-001" className="bg-gray-700 border-gray-600 text-white placeholder-gray-400" {...field} />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="version"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Version</FormLabel>
                  <FormControl>
                    <Input placeholder="1.0" className="bg-gray-700 border-gray-600 text-white placeholder-gray-400" {...field} />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel className="text-gray-300">Interface Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe the interface purpose and functionality..." 
                      className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="providerApplicationId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Provider Application</FormLabel>
                  <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                    <FormControl>
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue placeholder="Select provider application" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      {activeApplications.map((app) => (
                        <SelectItem key={app.id} value={app.id.toString()} className="text-white hover:bg-gray-700">
                          {app.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="consumerApplicationId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Consumer Application</FormLabel>
                  <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                    <FormControl>
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue placeholder="Select consumer application" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      {activeApplications.map((app) => (
                        <SelectItem key={app.id} value={app.id.toString()} className="text-white hover:bg-gray-700">
                          {app.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="interfaceType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Interface Type *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue placeholder="Select interface type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="rest" className="text-white hover:bg-gray-700">REST API</SelectItem>
                      <SelectItem value="soap" className="text-white hover:bg-gray-700">SOAP</SelectItem>
                      <SelectItem value="graphql" className="text-white hover:bg-gray-700">GraphQL</SelectItem>
                      <SelectItem value="messaging" className="text-white hover:bg-gray-700">Message Queue</SelectItem>
                      <SelectItem value="database" className="text-white hover:bg-gray-700">Database</SelectItem>
                      <SelectItem value="file" className="text-white hover:bg-gray-700">FILE</SelectItem>
                      <SelectItem value="ejb" className="text-white hover:bg-gray-700">EJB</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="middleware"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Middleware</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue placeholder="Select middleware" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="None" className="text-white hover:bg-gray-700">None</SelectItem>
                      <SelectItem value="Apache Kafka" className="text-white hover:bg-gray-700">Apache Kafka</SelectItem>
                      <SelectItem value="RabbitMQ" className="text-white hover:bg-gray-700">RabbitMQ</SelectItem>
                      <SelectItem value="IBM MQ" className="text-white hover:bg-gray-700">IBM MQ</SelectItem>
                      <SelectItem value="Redis" className="text-white hover:bg-gray-700">Redis</SelectItem>
                      <SelectItem value="WSO2" className="text-white hover:bg-gray-700">WSO2</SelectItem>
                      <SelectItem value="PSB" className="text-white hover:bg-gray-700">PSB</SelectItem>
                      <SelectItem value="PCE" className="text-white hover:bg-gray-700">PCE</SelectItem>
                      <SelectItem value="Custom" className="text-white hover:bg-gray-700">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lob"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Line of Business (LOB)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter line of business" className="bg-gray-700 border-gray-600 text-white placeholder-gray-400" {...field} />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="active" className="text-white hover:bg-gray-700">Active</SelectItem>
                      <SelectItem value="inactive" className="text-white hover:bg-gray-700">Inactive</SelectItem>
                      <SelectItem value="deprecated" className="text-white hover:bg-gray-700">Deprecated</SelectItem>
                      <SelectItem value="under_review" className="text-white hover:bg-gray-700">Under Review</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
            </div>
          </div>

          {/* Business Process Assignment */}
          <div className="space-y-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">Business Process Assignments</h3>
                  <div className="flex flex-col items-end gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={addBusinessProcess}
                      disabled={!businessProcesses || businessProcesses.length === 0 || businessProcesses.length === businessProcessAssignments.length}
                      className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600 disabled:opacity-50"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Business Process
                    </Button>
                    {(!businessProcesses || businessProcesses.length === 0) && (
                      <p className="text-xs text-red-400">No business processes available</p>
                    )}
                    {businessProcesses && businessProcesses.length > 0 && businessProcesses.length === businessProcessAssignments.length && (
                      <p className="text-xs text-yellow-400">All business processes assigned</p>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {businessProcessAssignments.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">
                    No business processes assigned. Click "Add Business Process" to assign this interface to business processes.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {businessProcessAssignments.map((assignment, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 border border-gray-600 rounded-lg bg-gray-700">
                        <GripVertical className="h-5 w-5 text-gray-400 mt-2" />
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="text-sm font-medium text-gray-300">Business Process</label>
                            <Select
                              value={assignment.businessProcessId.toString()}
                              onValueChange={(value) => updateBusinessProcessAssignment(index, 'businessProcessId', parseInt(value))}
                            >
                              <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-gray-800 border-gray-700">
                                {businessProcesses?.map((bp) => (
                                  <SelectItem 
                                    key={bp.id} 
                                    value={bp.id.toString()}
                                    disabled={businessProcessAssignments.some((a, i) => i !== index && a.businessProcessId === bp.id)}
                                    className="text-white hover:bg-gray-700 disabled:text-gray-500"
                                  >
                                    {bp.businessProcess}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-300">Sequence Number</label>
                            <Input
                              type="number"
                              min="1"
                              value={assignment.sequenceNumber}
                              onChange={(e) => updateBusinessProcessAssignment(index, 'sequenceNumber', parseInt(e.target.value))}
                              className="bg-gray-800 border-gray-600 text-white"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-300">Description (Optional)</label>
                            <Input
                              placeholder="BP-specific description"
                              value={assignment.description || ''}
                              onChange={(e) => updateBusinessProcessAssignment(index, 'description', e.target.value)}
                              className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                            />
                          </div>
                        </div>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => removeBusinessProcess(index)}
                          className="text-red-400 hover:text-red-300 hover:bg-gray-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Ownership Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b border-gray-700 pb-2 text-white">Ownership & Contacts</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField
              control={form.control}
              name="customerFocal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Customer Focal</FormLabel>
                  <FormControl>
                    <Input placeholder="Customer focal person" className="bg-gray-700 border-gray-600 text-white placeholder-gray-400" {...field} />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="providerOwner"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Provider Owner</FormLabel>
                  <FormControl>
                    <Input placeholder="Provider owner" className="bg-gray-700 border-gray-600 text-white placeholder-gray-400" {...field} />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="consumerOwner"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Consumer Owner</FormLabel>
                  <FormControl>
                    <Input placeholder="Consumer owner" className="bg-gray-700 border-gray-600 text-white placeholder-gray-400" {...field} />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
            </div>
          </div>

          {/* Connectivity & Testing Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b border-gray-700 pb-2 text-white">Connectivity & Testing</h3>
            <div className="space-y-6">
            <FormField
              control={form.control}
              name="sampleCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Sample Code</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Provide sample code for connectivity test..."
                      className="font-mono text-sm min-h-[120px] bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="connectivitySteps"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Connectivity Test Steps</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe the steps to test connectivity..."
                      className="min-h-[100px] bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="interfaceTestSteps"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Interface Test Steps</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe the steps to test the interface functionality..."
                      className="min-h-[100px] bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-700">
            <Button type="button" variant="outline" onClick={onSuccess} className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600">
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending} className="bg-blue-600 text-white hover:bg-blue-700">
              {createMutation.isPending ? "Saving..." : isEditing ? "Update Interface" : "Save Interface"}
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
}