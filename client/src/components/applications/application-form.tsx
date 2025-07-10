import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { insertApplicationSchema, type InsertApplication } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface ApplicationFormProps {
  onSuccess?: () => void;
  initialData?: Partial<InsertApplication>;
  applicationId?: number;
  isEditing?: boolean;
}

export default function ApplicationForm({ onSuccess, initialData, applicationId, isEditing = false }: ApplicationFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertApplication>({
    resolver: zodResolver(insertApplicationSchema),
    defaultValues: {
      amlNumber: initialData?.amlNumber || "",
      name: initialData?.name || "",
      description: initialData?.description || "",
      lob: initialData?.lob || "",
      os: initialData?.os || "",
      deployment: initialData?.deployment || "",
      uptime: initialData?.uptime || "99.9",
      purpose: initialData?.purpose || "",
      providesExtInterface: initialData?.providesExtInterface || false,
      provInterfaceType: initialData?.provInterfaceType || "",
      consumesExtInterfaces: initialData?.consumesExtInterfaces || false,
      consInterfaceType: initialData?.consInterfaceType || "",
      status: initialData?.status || "active",
      firstActiveDate: initialData?.firstActiveDate || undefined,
      decommissionDate: initialData?.decommissionDate || undefined,
      tmfDomain: initialData?.tmfDomain || "",
      tmfSubDomain: initialData?.tmfSubDomain || "",
      tmfProcessArea: initialData?.tmfProcessArea || "",
      tmfCapability: initialData?.tmfCapability || "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertApplication) => {
      const response = await apiRequest(
        isEditing ? "PUT" : "POST", 
        isEditing ? `/api/applications/${applicationId}` : "/api/applications", 
        data
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      toast({
        title: isEditing ? "Application updated" : "Application created",
        description: `The application has been successfully ${isEditing ? "updated" : "created"}.`,
      });
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? "update" : "create"} application. Please try again.`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertApplication) => {
    createMutation.mutate(data);
  };

  const providesInterface = form.watch("providesExtInterface");
  const consumesInterfaces = form.watch("consumesExtInterfaces");

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-white">{isEditing ? "Edit Application" : "Add New Application"}</DialogTitle>
        <p className="text-sm text-gray-400 mt-2">
          {isEditing 
            ? "Update the application details. All fields can be modified as needed." 
            : "Fill in the application details below. Fields marked with * are required."}
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
              name="amlNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">AML Number *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., AML-0001" 
                      {...field} 
                      className="bg-gray-700 border-gray-600 text-white placeholder-gray-400" 
                    />
                  </FormControl>
                  <p className="text-xs text-gray-400 mt-1">Unique identifier for this application</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Application Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter application name" {...field} className="bg-gray-700 border-gray-600 text-white placeholder-gray-400" />
                  </FormControl>
                  <FormMessage />
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
                    <Input placeholder="Enter line of business" {...field} value={field.value || ''} className="bg-gray-700 border-gray-600 text-white placeholder-gray-400" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="os"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Operating System</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                    <FormControl>
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue placeholder="Select OS" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="linux">Linux</SelectItem>
                      <SelectItem value="windows">Windows</SelectItem>
                      <SelectItem value="macos">macOS</SelectItem>
                      <SelectItem value="containerized">Containerized</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="deployment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Deployment Type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value || undefined}
                      className="flex space-x-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="cloud" id="cloud" />
                        <Label htmlFor="cloud" className="text-gray-300">Cloud</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="on-premise" id="on-premise" />
                        <Label htmlFor="on-premise" className="text-gray-300">On-Premise</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Application Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                    <FormControl>
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="maintenance">Under Maintenance</SelectItem>
                      <SelectItem value="deprecated">Deprecated</SelectItem>
                      <SelectItem value="decommissioned" disabled>Decommissioned</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="uptime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Uptime (%)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.1" min="0" max="100" placeholder="99.9" {...field} value={field.value || ''} className="bg-gray-700 border-gray-600 text-white placeholder-gray-400" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="firstActiveDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">First Active Date</FormLabel>
                  <FormControl>
                    <Input 
                      type="date" 
                      {...field} 
                      value={field.value ? (field.value instanceof Date ? field.value.toISOString().split('T')[0] : new Date(field.value).toISOString().split('T')[0]) : ''}
                      onChange={(e) => field.onChange(e.target.value || undefined)}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="decommissionDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Planned Decommission Date</FormLabel>
                  <FormControl>
                    <Input 
                      type="date" 
                      {...field} 
                      value={field.value ? (field.value instanceof Date ? field.value.toISOString().split('T')[0] : new Date(field.value).toISOString().split('T')[0]) : ''}
                      onChange={(e) => field.onChange(e.target.value || undefined)}
                      className="bg-gray-700 border-gray-600 text-white"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </FormControl>
                  <p className="text-xs text-gray-400 mt-1">If set, all provided interfaces will be decommissioned on this date</p>
                  <FormMessage />
                </FormItem>
              )}
            />
            </div>
          </div>

          {/* Description and Purpose */}
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-300">Description</FormLabel>
                <FormControl>
                  <Textarea rows={3} placeholder="Enter application description" {...field} value={field.value || ''} className="bg-gray-700 border-gray-600 text-white placeholder-gray-400" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

            <FormField
              control={form.control}
              name="purpose"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Business Purpose</FormLabel>
                  <FormControl>
                    <Textarea rows={2} placeholder="Describe the business purpose of this application" {...field} value={field.value || ''} className="bg-gray-700 border-gray-600 text-white placeholder-gray-400" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Interface Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b border-gray-600 pb-2 text-white">Interface Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="providesExtInterface"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Provides External Interface</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={(value) => field.onChange(value === "true")}
                      defaultValue={field.value ? "true" : "false"}
                      className="flex space-x-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="true" id="provides-yes" />
                        <Label htmlFor="provides-yes" className="text-gray-300">Yes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="false" id="provides-no" />
                        <Label htmlFor="provides-no" className="text-gray-300">No</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {providesInterface && (
              <FormField
                control={form.control}
                name="provInterfaceType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">Provider Interface Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                          <SelectValue placeholder="Select Type" />
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
            )}

            <FormField
              control={form.control}
              name="consumesExtInterfaces"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Consumes External Interfaces</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={(value) => field.onChange(value === "true")}
                      defaultValue={field.value ? "true" : "false"}
                      className="flex space-x-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="true" id="consumes-yes" />
                        <Label htmlFor="consumes-yes" className="text-gray-300">Yes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="false" id="consumes-no" />
                        <Label htmlFor="consumes-no" className="text-gray-300">No</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {consumesInterfaces && (
              <FormField
                control={form.control}
                name="consInterfaceType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">Consumer Interface Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                          <SelectValue placeholder="Select Type" />
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
            )}
            </div>
          </div>

          {/* TM Forum Domain Classification */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b border-gray-600 pb-2 text-white">TM Forum Domain Classification</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="tmfDomain"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">TM Forum Domain</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                          <SelectValue placeholder="Select Domain" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="product">Product</SelectItem>
                        <SelectItem value="customer">Customer</SelectItem>
                        <SelectItem value="service">Service</SelectItem>
                        <SelectItem value="resource">Resource</SelectItem>
                        <SelectItem value="partner">Partner/Supplier</SelectItem>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tmfSubDomain"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">TM Forum Sub-Domain</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Product Catalog, Order Management" {...field} value={field.value || ''} className="bg-gray-700 border-gray-600 text-white placeholder-gray-400" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tmfProcessArea"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">eTOM Process Area</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Service Configuration & Activation" {...field} value={field.value || ''} className="bg-gray-700 border-gray-600 text-white placeholder-gray-400" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tmfCapability"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">TM Forum Capability</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Product Specification Management" {...field} value={field.value || ''} className="bg-gray-700 border-gray-600 text-white placeholder-gray-400" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-600">
            <Button type="button" variant="outline" onClick={onSuccess} className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600">
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending} className="bg-blue-600 text-white hover:bg-blue-700">
              {createMutation.isPending ? "Saving..." : isEditing ? "Update Application" : "Save Application"}
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
}
