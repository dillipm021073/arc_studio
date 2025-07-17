import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { insertInterfaceSchema, type InsertInterface, type Application } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface InterfaceFormProps {
  onSuccess?: () => void;
  initialData?: Partial<InsertInterface>;
  isEditing?: boolean;
}

export default function InterfaceForm({ onSuccess, initialData, isEditing = false }: InterfaceFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: applications } = useQuery<Application[]>({
    queryKey: ["/api/applications"],
  });
  
  // Filter to show only active applications
  const activeApplications = applications?.filter(app => app.status === 'active') || [];

  const form = useForm<InsertInterface>({
    resolver: zodResolver(insertInterfaceSchema),
    defaultValues: {
      imlNumber: initialData?.imlNumber || "",
      providerApplicationId: initialData?.providerApplicationId || undefined,
      consumerApplicationId: initialData?.consumerApplicationId || undefined,
      interfaceType: initialData?.interfaceType || "",
      middleware: initialData?.middleware || "None",
      version: initialData?.version || "1.0",
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
      const response = await apiRequest("POST", "/api/interfaces", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/interfaces"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      toast({
        title: "Interface created",
        description: "The interface has been successfully created.",
      });
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create interface. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertInterface) => {
    createMutation.mutate(data);
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
                  <FormLabel className="text-gray-300">Provider Application</FormLabel>
                  <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                    <FormControl>
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue placeholder="Select provider application" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      {activeApplications.map((app) => (
                        <SelectItem key={app.id} value={app.id.toString()}>
                          {app.name}
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
                  <FormLabel className="text-gray-300">Consumer Application</FormLabel>
                  <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                    <FormControl>
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue placeholder="Select consumer application" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      {activeApplications.map((app) => (
                        <SelectItem key={app.id} value={app.id.toString()}>
                          {app.name}
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                      <SelectItem value="MuleSoft">MuleSoft</SelectItem>
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="deprecated">Deprecated</SelectItem>
                      <SelectItem value="under_review">Under Review</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

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
                      placeholder="Describe the steps to test connectivity..."
                      className="min-h-[100px] bg-gray-700 border-gray-600 text-white placeholder-gray-400"
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
                      placeholder="Describe the steps to test the interface functionality..."
                      className="min-h-[100px] bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
