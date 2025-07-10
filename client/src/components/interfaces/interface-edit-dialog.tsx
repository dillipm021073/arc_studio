import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { insertInterfaceSchema, type InsertInterface, type Application, type Interface } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { InterfaceActivationWarningModal } from "@/components/modals/interface-activation-warning-modal";
import { Loader2 } from "lucide-react";

interface InterfaceEditDialogProps {
  interface: Interface | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function InterfaceEditDialog({ interface: initialInterface, open, onOpenChange }: InterfaceEditDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showActivationWarning, setShowActivationWarning] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [pendingFormData, setPendingFormData] = useState<InsertInterface | null>(null);

  const { data: applications } = useQuery<Application[]>({
    queryKey: ["/api/applications"],
  });

  const form = useForm<InsertInterface>({
    resolver: zodResolver(insertInterfaceSchema),
    defaultValues: {
      imlNumber: initialInterface?.imlNumber || "",
      description: initialInterface?.description || "",
      providerApplicationId: initialInterface?.providerApplicationId || undefined,
      consumerApplicationId: initialInterface?.consumerApplicationId || undefined,
      interfaceType: initialInterface?.interfaceType || "",
      middleware: initialInterface?.middleware || "None",
      version: initialInterface?.version || "1.0",
      lob: initialInterface?.lob || "",
      businessProcessName: initialInterface?.businessProcessName || "",
      customerFocal: initialInterface?.customerFocal || "",
      providerOwner: initialInterface?.providerOwner || "",
      consumerOwner: initialInterface?.consumerOwner || "",
      status: initialInterface?.status || "active",
      sampleCode: initialInterface?.sampleCode || "",
      connectivitySteps: initialInterface?.connectivitySteps || "",
      interfaceTestSteps: initialInterface?.interfaceTestSteps || "",
    },
  });

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
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/interfaces"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      toast({
        title: "Interface updated",
        description: "The interface has been successfully updated.",
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      // Check if it's an activation error
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
    // Check if we're trying to activate an inactive/decommissioned interface
    if (initialInterface && 
        (initialInterface.status === 'inactive' || initialInterface.status === 'decommissioned') && 
        data.status === 'active') {
      
      // Store the form data and validate activation
      setPendingFormData(data);
      const validation = await validateActivationMutation.mutateAsync(initialInterface.id);
      setValidationResult(validation);
      setShowActivationWarning(true);
      
      // If cannot activate, don't proceed
      if (!validation.canActivate) {
        return;
      }
    } else {
      // Direct update without validation
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

  const watchedStatus = form.watch("status");

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-800 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Interface</DialogTitle>
            <p className="text-sm text-gray-400 mt-2">
              Update the interface details. All fields can be modified as needed.
            </p>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                      <FormMessage />
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
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                            <SelectItem key={app.id} value={app.id.toString()}>
                              {app.name} {app.status !== 'active' && `(${app.status})`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
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
                            <SelectItem key={app.id} value={app.id.toString()}>
                              {app.name} {app.status !== 'active' && `(${app.status})`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
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
                          <SelectItem value="rest">REST API</SelectItem>
                          <SelectItem value="soap">SOAP</SelectItem>
                          <SelectItem value="graphql">GraphQL</SelectItem>
                          <SelectItem value="messaging">Message Queue</SelectItem>
                          <SelectItem value="database">Database</SelectItem>
                          <SelectItem value="file">FILE</SelectItem>
                          <SelectItem value="ejb">EJB</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
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
                          <SelectItem value="None">None</SelectItem>
                          <SelectItem value="Apache Kafka">Apache Kafka</SelectItem>
                          <SelectItem value="RabbitMQ">RabbitMQ</SelectItem>
                          <SelectItem value="IBM MQ">IBM MQ</SelectItem>
                          <SelectItem value="Redis">Redis</SelectItem>
                          <SelectItem value="WSO2">WSO2</SelectItem>
                          <SelectItem value="PSB">PSB</SelectItem>
                          <SelectItem value="PCE">PCE</SelectItem>
                          <SelectItem value="Custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
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
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="deprecated">Deprecated</SelectItem>
                          <SelectItem value="under_review">Under Review</SelectItem>
                          <SelectItem value="decommissioned">Decommissioned</SelectItem>
                        </SelectContent>
                      </Select>
                      {initialInterface && 
                       (initialInterface.status === 'inactive' || initialInterface.status === 'decommissioned') && 
                       watchedStatus === 'active' && (
                        <p className="text-sm text-yellow-600 mt-1">
                          Activation will be validated to ensure both applications are active
                        </p>
                      )}
                      <FormMessage />
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
                        placeholder="Describe the interface purpose and functionality" 
                        rows={3}
                        className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                      <FormMessage />
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
                      <FormMessage />
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
                      <FormMessage />
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
                      <FormMessage />
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-6 border-t border-gray-700 pt-6">
                <h3 className="text-lg font-semibold text-white">Testing Information</h3>
                
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
                      <FormMessage />
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
                      <FormMessage />
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-700">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600">
                  Cancel
                </Button>
                <Button className="bg-blue-600 text-white hover:bg-blue-700" 
                  type="submit" 
                  disabled={updateMutation.isPending || validateActivationMutation.isPending}
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