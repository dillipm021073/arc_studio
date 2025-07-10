import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

const businessProcessSchema = z.object({
  businessProcess: z.string().min(1, "Business process name is required"),
  lob: z.string().min(1, "LOB is required"),
  product: z.string().min(1, "Product is required"),
  version: z.string().min(1, "Version is required"),
  level: z.enum(["A", "B", "C"]),
  domainOwner: z.string().optional(),
  itOwner: z.string().optional(),
  vendorFocal: z.string().optional(),
  status: z.enum(["active", "inactive", "under_review"]),
});

type BusinessProcessFormData = z.infer<typeof businessProcessSchema>;

interface BusinessProcessFormProps {
  businessProcess?: any;
  onSuccess?: () => void;
}

export default function BusinessProcessForm({ businessProcess, onSuccess }: BusinessProcessFormProps) {
  const { toast } = useToast();
  const isEditing = !!businessProcess && businessProcess.id > 0;
  const [selectedParentIds, setSelectedParentIds] = useState<number[]>([]);
  const [parentSequences, setParentSequences] = useState<Record<number, number>>({});
  const [parentProcessesLoading, setParentProcessesLoading] = useState(true);

  // Fetch all business processes for parent selection
  const { data: allProcesses = [] } = useQuery({
    queryKey: ["business-processes"],
    queryFn: async () => {
      const response = await fetch("/api/business-processes");
      if (!response.ok) throw new Error("Failed to fetch business processes");
      return response.json();
    },
  });

  // Fetch current parent processes if editing
  useEffect(() => {
    if (isEditing && businessProcess?.id) {
      fetch(`/api/business-processes/${businessProcess.id}/parents`)
        .then(res => res.json())
        .then(parents => {
          setSelectedParentIds(parents.map((p: any) => p.id));
          // Load sequence numbers
          const sequences: Record<number, number> = {};
          parents.forEach((p: any) => {
            sequences[p.id] = p.sequenceNumber || 1;
          });
          setParentSequences(sequences);
          setParentProcessesLoading(false);
        })
        .catch(() => setParentProcessesLoading(false));
    } else {
      setParentProcessesLoading(false);
    }
  }, [isEditing, businessProcess]);

  const form = useForm<BusinessProcessFormData>({
    resolver: zodResolver(businessProcessSchema),
    defaultValues: {
      businessProcess: businessProcess?.businessProcess || "",
      lob: businessProcess?.lob || "",
      product: businessProcess?.product || "",
      version: businessProcess?.version || "1.0",
      level: businessProcess?.level || "A",
      domainOwner: businessProcess?.domainOwner || "",
      itOwner: businessProcess?.itOwner || "",
      vendorFocal: businessProcess?.vendorFocal || "",
      status: businessProcess?.status || "active",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: BusinessProcessFormData) => {
      const url = isEditing
        ? `/api/business-processes/${businessProcess.id}`
        : "/api/business-processes";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to save business process");
      }

      return response.json();
    },
    onSuccess: async (savedProcess) => {
      // Handle parent relationships
      if (watchLevel !== "A") {
        try {
          // First, remove all existing parent relationships if editing
          if (isEditing) {
            const currentParents = await fetch(`/api/business-processes/${savedProcess.id}/parents`).then(res => res.json());
            for (const parent of currentParents) {
              await fetch(`/api/business-processes/${savedProcess.id}/relationships/${parent.id}`, {
                method: "DELETE"
              });
            }
          }
          
          // Then add new parent relationships with sequence numbers
          for (const parentId of selectedParentIds) {
            await fetch(`/api/business-processes/${savedProcess.id}/relationships`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ 
                parentProcessId: parentId,
                sequenceNumber: parentSequences[parentId] || 1 
              })
            });
          }
        } catch (error) {
          console.error("Failed to update parent relationships:", error);
        }
      }
      
      toast({
        title: "Success",
        description: `Business process ${isEditing ? "updated" : "created"} successfully`,
      });
      onSuccess?.();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save business process",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: BusinessProcessFormData) => {
    mutation.mutate(data);
  };

  // Watch level to determine parent process filtering
  const watchLevel = form.watch("level");

  // Filter parent processes based on selected level
  const availableParentProcesses = allProcesses.filter((p: any) => {
    if (businessProcess && p.id === businessProcess.id) return false; // Exclude self
    if (watchLevel === "A") return false; // Level A has no parent
    if (watchLevel === "B") return p.level === "A"; // Level B can only have Level A parent
    if (watchLevel === "C") return p.level === "B"; // Level C can only have Level B parent
    return false;
  });

  // Reset parent when level changes to A
  useEffect(() => {
    if (watchLevel === "A") {
      setSelectedParentIds([]);
    }
  }, [watchLevel]);

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-white">{isEditing ? "Edit Business Process" : "Add New Business Process"}</DialogTitle>
        <p className="text-sm text-gray-400 mt-2">
          {isEditing 
            ? "Update the business process configuration and ownership details." 
            : "Business processes use interfaces (IMLs) to accomplish specific business functions. Define the process details below."}
        </p>
      </DialogHeader>
      
      <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b border-gray-600 pb-2 text-white">Basic Information</h3>
          <FormField
          control={form.control}
          name="businessProcess"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-300">Business Process Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter business process name" {...field} className="bg-gray-700 border-gray-600 text-white placeholder-gray-400" />
              </FormControl>
              <FormDescription className="text-gray-400">
                The name of the business process
              </FormDescription>
              <FormMessage className="text-red-400" />
            </FormItem>
          )}
        />

          <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="lob"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-300">Line of Business (LOB)</FormLabel>
                <FormControl>
                  <Input placeholder="Enter LOB" {...field} className="bg-gray-700 border-gray-600 text-white placeholder-gray-400" />
                </FormControl>
                <FormMessage className="text-red-400" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="product"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-300">Product</FormLabel>
                <FormControl>
                  <Input placeholder="Enter product name" {...field} className="bg-gray-700 border-gray-600 text-white placeholder-gray-400" />
                </FormControl>
                <FormMessage className="text-red-400" />
              </FormItem>
            )}
          />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage className="text-red-400" />
              </FormItem>
            )}
          />
          </div>

          <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="level"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-300">Process Level</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="A">Level A (Top-level)</SelectItem>
                    <SelectItem value="B">Level B (Sub-process)</SelectItem>
                    <SelectItem value="C">Level C (Sub-sub-process)</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription className="text-gray-400">
                  Hierarchy level of the business process
                </FormDescription>
                <FormMessage className="text-red-400" />
              </FormItem>
            )}
          />

          <div className="space-y-2">
            <Label className="text-gray-300">Parent Processes</Label>
            {watchLevel === "A" ? (
              <p className="text-sm text-gray-400">Level A processes have no parent</p>
            ) : parentProcessesLoading ? (
              <p className="text-sm text-gray-400">Loading parent processes...</p>
            ) : (
              <>
                <div className="border border-gray-600 rounded-md bg-gray-700 p-3">
                  <ScrollArea className="h-[120px]">
                    <div className="space-y-2">
                      {availableParentProcesses.length === 0 ? (
                        <p className="text-sm text-gray-400">No available parent processes</p>
                      ) : (
                        availableParentProcesses.map((process: any) => (
                          <div key={process.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`parent-${process.id}`}
                              checked={selectedParentIds.includes(process.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedParentIds([...selectedParentIds, process.id]);
                                  setParentSequences(prev => ({
                                    ...prev,
                                    [process.id]: prev[process.id] || 1
                                  }));
                                } else {
                                  setSelectedParentIds(selectedParentIds.filter(id => id !== process.id));
                                  setParentSequences(prev => {
                                    const newSequences = { ...prev };
                                    delete newSequences[process.id];
                                    return newSequences;
                                  });
                                }
                              }}
                              className="border-gray-500 data-[state=checked]:bg-blue-600"
                            />
                            <label
                              htmlFor={`parent-${process.id}`}
                              className="text-sm text-white cursor-pointer flex-1"
                            >
                              {process.businessProcess} (Level {process.level})
                            </label>
                            {selectedParentIds.includes(process.id) && (
                              <Input
                                type="number"
                                min="1"
                                value={parentSequences[process.id] || 1}
                                onChange={(e) => {
                                  const value = parseInt(e.target.value) || 1;
                                  setParentSequences(prev => ({
                                    ...prev,
                                    [process.id]: value
                                  }));
                                }}
                                className="w-16 bg-gray-600 border-gray-500 text-white text-sm h-7"
                                placeholder="Seq"
                                title="Sequence number within parent process"
                              />
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </div>
                <FormDescription className="text-gray-400">
                  {watchLevel === "B" ? "Select Level A parent processes and set sequence numbers for flow order" : 
                   watchLevel === "C" ? "Select Level B parent processes and set sequence numbers for flow order" : 
                   ""}
                </FormDescription>
              </>
            )}
          </div>
          </div>
        </div>

        {/* Ownership Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b border-gray-600 pb-2 text-white">Ownership Information</h3>
          <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="domainOwner"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-300">Domain Owner</FormLabel>
                <FormControl>
                  <Input placeholder="Domain owner name" {...field} className="bg-gray-700 border-gray-600 text-white placeholder-gray-400" />
                </FormControl>
                <FormMessage className="text-red-400" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="itOwner"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-300">IT Owner</FormLabel>
                <FormControl>
                  <Input placeholder="IT owner name" {...field} className="bg-gray-700 border-gray-600 text-white placeholder-gray-400" />
                </FormControl>
                <FormMessage className="text-red-400" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="vendorFocal"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-300">Vendor Focal</FormLabel>
                <FormControl>
                  <Input placeholder="Vendor focal point" {...field} className="bg-gray-700 border-gray-600 text-white placeholder-gray-400" />
                </FormControl>
                <FormMessage className="text-red-400" />
              </FormItem>
            )}
          />
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-6 border-t border-gray-600">
          <Button type="button" variant="outline" onClick={onSuccess} className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600">
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending} className="bg-blue-600 text-white hover:bg-blue-700">
            {mutation.isPending ? "Saving..." : isEditing ? "Update Business Process" : "Create Business Process"}
          </Button>
        </div>
      </form>
    </Form>
    </>
  );
}