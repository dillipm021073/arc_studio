import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { insertInterfaceSchema, type InsertInterface, type Application, type Interface, type BusinessProcess } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { InterfaceActivationWarningModal } from "@/components/modals/interface-activation-warning-modal";
import { Loader2, Plus, Trash2, GripVertical } from "lucide-react";

interface InterfaceEditDialogProps {
  interface: Interface | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (updatedInterface: any) => void;
}

interface BusinessProcessAssignment {
  id?: number;
  businessProcessId: number;
  sequenceNumber: number;
  description?: string;
  businessProcess?: BusinessProcess;
}

export default function InterfaceEditDialog({ interface: initialInterface, open, onOpenChange, onSuccess }: InterfaceEditDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showActivationWarning, setShowActivationWarning] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [pendingFormData, setPendingFormData] = useState<InsertInterface | null>(null);
  const [businessProcessAssignments, setBusinessProcessAssignments] = useState<BusinessProcessAssignment[]>([]);

  const { data: applications } = useQuery<Application[]>({
    queryKey: ["/api/applications"],
  });

  const { data: businessProcesses } = useQuery<BusinessProcess[]>({
    queryKey: ["/api/business-processes"],
  });

  // Fetch existing business process assignments if editing
  const { data: existingAssignments } = useQuery({
    queryKey: ["/api/interfaces", initialInterface?.id, "business-processes"],
    enabled: !!initialInterface?.id,
    queryFn: async () => {
      const response = await fetch(`/api/interfaces/${initialInterface?.id}/business-processes`);
      if (!response.ok) throw new Error("Failed to fetch business process assignments");
      return response.json();
    },
  });

  useEffect(() => {
    if (open && existingAssignments) {
      setBusinessProcessAssignments(existingAssignments.map((assignment: any) => ({
        id: assignment.id,
        businessProcessId: assignment.businessProcessId,
        sequenceNumber: assignment.sequenceNumber,
        description: assignment.description,
        businessProcess: businessProcesses?.find(bp => bp.id === assignment.businessProcessId)
      })));
    } else if (!open) {
      // Clear assignments when dialog closes
      setBusinessProcessAssignments([]);
    }
  }, [open, existingAssignments, businessProcesses]);

  const form = useForm<InsertInterface>({
    resolver: zodResolver(insertInterfaceSchema),
    defaultValues: {
      imlNumber: "",
      description: "",
      providerApplicationId: undefined,
      consumerApplicationId: undefined,
      interfaceType: "",
      middleware: "None",
      version: "1.0",
      lob: "",
      businessProcessName: "",
      customerFocal: "",
      providerOwner: "",
      consumerOwner: "",
      status: "active",
      sampleCode: "",
      connectivitySteps: "",
      interfaceTestSteps: "",
    },
  });

  // Reset form with initialInterface values when dialog opens
  useEffect(() => {
    if (open && initialInterface) {
      form.reset({
        imlNumber: initialInterface.imlNumber || "",
        description: initialInterface.description || "",
        providerApplicationId: initialInterface.providerApplicationId || undefined,
        consumerApplicationId: initialInterface.consumerApplicationId || undefined,
        interfaceType: initialInterface.interfaceType || "",
        middleware: initialInterface.middleware || "None",
        version: initialInterface.version || "1.0",
        lob: initialInterface.lob || "",
        businessProcessName: initialInterface.businessProcessName || "",
        customerFocal: initialInterface.customerFocal || "",
        providerOwner: initialInterface.providerOwner || "",
        consumerOwner: initialInterface.consumerOwner || "",
        status: initialInterface.status || "active",
        sampleCode: initialInterface.sampleCode || "",
        connectivitySteps: initialInterface.connectivitySteps || "",
        interfaceTestSteps: initialInterface.interfaceTestSteps || "",
      });
    }
  }, [open, initialInterface, form]);

  const validateActivationMutation = useMutation({
    mutationFn: async (interfaceId: number) => {
      const response = await apiRequest("GET", `/api/interfaces/${interfaceId}/validate-activation`);
      return response.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InsertInterface) => {
      const response = await apiRequest("PUT", `/api/interfaces/${initialInterface?.id}`, data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update interface");
      }
      const interfaceData = await response.json();

      // Manage business process assignments
      if (initialInterface?.id) {
        // Get existing assignments to delete them individually
        const existingResponse = await fetch(`/api/interfaces/${initialInterface.id}/business-processes`);
        const existingAssignments = await existingResponse.json();
        
        // Delete each existing assignment
        for (const existing of existingAssignments) {
          if (existing.id) {
            await apiRequest("DELETE", `/api/business-process-interfaces/${existing.id}`);
          }
        }
        
        // Then add all new assignments
        for (const assignment of businessProcessAssignments) {
          await apiRequest("POST", `/api/interfaces/${initialInterface.id}/business-processes`, {
            businessProcessId: assignment.businessProcessId,
            sequenceNumber: assignment.sequenceNumber,
            description: assignment.description,
          });
        }
      }

      return interfaceData;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/interfaces"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      if (initialInterface?.id) {
        queryClient.invalidateQueries({ queryKey: ["/api/interfaces", initialInterface.id, "business-processes"] });
      }
      toast({
        title: "Interface updated",
        description: "The interface has been successfully updated.",
      });
      onSuccess?.(data);
      onOpenChange(false);
    },
    onError: (error: any) => {
      if (error.message?.includes("Cannot activate interface")) {
        toast({
          title: "Activation Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to update interface",
          variant: "destructive",
        });
      }
    },
  });

  const onSubmit = async (data: InsertInterface) => {
    if (initialInterface && 
        (initialInterface.status === 'inactive' || initialInterface.status === 'decommissioned') && 
        data.status === 'active') {
      
      setPendingFormData(data);
      const validation = await validateActivationMutation.mutateAsync(initialInterface.id);
      setValidationResult(validation);
      setShowActivationWarning(true);
      
      if (!validation.canActivate) {
        return;
      }
    } else {
      updateMutation.mutate(data);
    }
  };

  const handleProceedWithActivation = () => {
    if (pendingFormData) {
      updateMutation.mutate(pendingFormData);
      setShowActivationWarning(false);
      setPendingFormData(null);
    }
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

  const watchedStatus = form.watch("status");

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-gray-800 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Interface</DialogTitle>
            <p className="text-sm text-gray-400 mt-2">
              Update the interface details. All fields can be modified as needed.
            </p>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b border-gray-600 pb-2 text-white">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="imlNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">IML Number *</FormLabel>
                        <FormControl>
                          <Input placeholder="IML-2024-001" {...field} className="bg-gray-700 border-gray-600 text-white placeholder-gray-400" />
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
                          <Input placeholder="1.0" {...field} className="bg-gray-700 border-gray-600 text-white placeholder-gray-400" />
                        </FormControl>
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
                        <Select onValueChange={field.onChange} value={field.value}>
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
                            <SelectItem value="file" className="text-white hover:bg-gray-700">File</SelectItem>
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
                        <Select onValueChange={field.onChange} value={field.value}>
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
                            <SelectItem value="active" className="text-white hover:bg-gray-700">Active</SelectItem>
                            <SelectItem value="inactive" className="text-white hover:bg-gray-700">Inactive</SelectItem>
                            <SelectItem value="deprecated" className="text-white hover:bg-gray-700">Deprecated</SelectItem>
                            <SelectItem value="under_review" className="text-white hover:bg-gray-700">Under Review</SelectItem>
                            <SelectItem value="decommissioned" className="text-white hover:bg-gray-700">Decommissioned</SelectItem>
                          </SelectContent>
                        </Select>
                        {initialInterface && 
                         (initialInterface.status === 'inactive' || initialInterface.status === 'decommissioned') && 
                         watchedStatus === 'active' && (
                          <p className="text-sm text-yellow-300 mt-1">
                            Activation will be validated to ensure both applications are active
                          </p>
                        )}
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Application Links Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b border-gray-600 pb-2 text-white">Application Links</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="providerApplicationId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">Provider Application *</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(parseInt(value))} 
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                              <SelectValue placeholder="Select provider application" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-gray-800 border-gray-700">
                            {applications?.map((app) => (
                              <SelectItem key={app.id} value={app.id.toString()} className="text-white hover:bg-gray-700">
                                <span className="text-white">{app.name}</span> {app.status !== 'active' && <span className="text-gray-300">({app.status})</span>}
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
                        <FormLabel className="text-gray-300">Consumer Application *</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(parseInt(value))} 
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                              <SelectValue placeholder="Select consumer application" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-gray-800 border-gray-700">
                            {applications?.map((app) => (
                              <SelectItem key={app.id} value={app.id.toString()} className="text-white hover:bg-gray-700">
                                <span className="text-white">{app.name}</span> {app.status !== 'active' && <span className="text-gray-300">({app.status})</span>}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe the interface purpose and functionality" 
                        rows={3}
                        className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              {/* Business Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b border-gray-600 pb-2 text-white">Business Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="lob"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">Line of Business</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter LOB" {...field} className="bg-gray-700 border-gray-600 text-white placeholder-gray-400" />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="businessProcessName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">Business Process Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter business process name" {...field} className="bg-gray-700 border-gray-600 text-white placeholder-gray-400" />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="customerFocal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">Customer Focal</FormLabel>
                        <FormControl>
                          <Input placeholder="Customer focal person" {...field} className="bg-gray-700 border-gray-600 text-white placeholder-gray-400" />
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
                          <Input placeholder="Provider owner" {...field} className="bg-gray-700 border-gray-600 text-white placeholder-gray-400" />
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
                          <Input placeholder="Consumer owner" {...field} className="bg-gray-700 border-gray-600 text-white placeholder-gray-400" />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Business Process Assignment Section */}
              <div className="space-y-4">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-white">Business Process Assignments</h3>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={addBusinessProcess}
                        disabled={!businessProcesses || businessProcesses.length === businessProcessAssignments.length}
                        className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Business Process
                      </Button>
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

              {/* Testing Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b border-gray-600 pb-2 text-white">Testing Information</h3>
                
                <FormField
                  control={form.control}
                  name="sampleCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Sample Code</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Provide sample code for connectivity testing" 
                          rows={4}
                          className="font-mono text-sm bg-gray-700 border-gray-600 text-white placeholder-gray-400"
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
                          placeholder="Step-by-step instructions for connectivity testing" 
                          rows={3}
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
                  name="interfaceTestSteps"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Interface Test Steps</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Step-by-step instructions for interface testing" 
                          rows={3}
                          className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-700">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600">
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateMutation.isPending || validateActivationMutation.isPending}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  {(updateMutation.isPending || validateActivationMutation.isPending) ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Interface"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Activation Warning Modal */}
      {showActivationWarning && validationResult && (
        <InterfaceActivationWarningModal
          isOpen={showActivationWarning}
          onClose={() => {
            setShowActivationWarning(false);
            setPendingFormData(null);
          }}
          onProceed={validationResult.canActivate ? handleProceedWithActivation : undefined}
          interfaceName={initialInterface?.imlNumber || ""}
          validationResult={validationResult}
        />
      )}
    </>
  );
}