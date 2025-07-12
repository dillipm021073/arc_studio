import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import { Badge } from "@/components/ui/badge";
import { getProcessLevelIcon, getProcessIconProps } from "@/lib/business-process-utils";

const childBusinessProcessSchema = z.object({
  businessProcess: z.string().min(1, "Business process name is required"),
  lob: z.string().min(1, "LOB is required"),
  product: z.string().min(1, "Product is required"),
  version: z.string().min(1, "Version is required"),
  level: z.enum(["A", "B", "C"]),
  domainOwner: z.string().optional(),
  itOwner: z.string().optional(),
  vendorFocal: z.string().optional(),
  status: z.enum(["active", "inactive", "under_review"]),
  description: z.string().optional(),
  technicalDetails: z.string().optional(),
  tags: z.string().optional(),
  sequenceNumber: z.number().min(1, "Sequence number must be at least 1"),
});

type ChildBusinessProcessFormData = z.infer<typeof childBusinessProcessSchema>;

interface ChildBusinessProcessFormProps {
  parentBP: any;
  childTemplate: any;
  onSuccess?: () => void;
}

export default function ChildBusinessProcessForm({ 
  parentBP, 
  childTemplate, 
  onSuccess 
}: ChildBusinessProcessFormProps) {
  const { toast } = useToast();

  const form = useForm<ChildBusinessProcessFormData>({
    resolver: zodResolver(childBusinessProcessSchema),
    defaultValues: {
      businessProcess: childTemplate.businessProcess,
      lob: childTemplate.lob,
      product: childTemplate.product,
      version: childTemplate.version,
      level: childTemplate.level,
      domainOwner: childTemplate.domainOwner || "",
      itOwner: childTemplate.itOwner || "",
      vendorFocal: childTemplate.vendorFocal || "",
      status: childTemplate.status,
      description: childTemplate.description || "",
      technicalDetails: childTemplate.technicalDetails || "",
      tags: childTemplate.tags || "",
      sequenceNumber: childTemplate.sequenceNumber || 1,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: ChildBusinessProcessFormData) => {
      const response = await fetch(`/api/business-processes/${parentBP.id}/children`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to create child business process");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: `Level ${childTemplate.level} process created and linked to ${parentBP.businessProcess}`,
      });
      onSuccess?.();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create child business process",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ChildBusinessProcessFormData) => {
    mutation.mutate(data);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-white flex items-center gap-2">
          {(() => {
            const ProcessIcon = getProcessLevelIcon(childTemplate.level);
            return <ProcessIcon {...getProcessIconProps("h-5 w-5 text-blue-600")} />;
          })()}
          Add Level {childTemplate.level} Process to {parentBP.businessProcess}
        </DialogTitle>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-sm text-gray-400">Parent:</span>
          <Badge className="bg-blue-600 text-white">
            {(() => {
              const ParentIcon = getProcessLevelIcon(parentBP.level);
              return <ParentIcon {...getProcessIconProps("h-3 w-3 mr-1")} />;
            })()}
            Level {parentBP.level}
          </Badge>
          <span className="text-sm text-white">{parentBP.businessProcess}</span>
        </div>
        <p className="text-sm text-gray-400">
          Create a new Level {childTemplate.level} business process that will be linked to the parent process.
        </p>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="businessProcess"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Business Process Name</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      className="bg-gray-700 border-gray-600 text-white" 
                      placeholder="Enter process name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sequenceNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Sequence Number</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      type="number"
                      min="1"
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                      className="bg-gray-700 border-gray-600 text-white" 
                      placeholder="1"
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
              name="lob"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Line of Business</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      className="bg-gray-700 border-gray-600 text-white" 
                      placeholder="Enter LOB"
                    />
                  </FormControl>
                  <FormMessage />
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
                    <Input 
                      {...field} 
                      className="bg-gray-700 border-gray-600 text-white" 
                      placeholder="Enter product"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="version"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Version</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      className="bg-gray-700 border-gray-600 text-white" 
                      placeholder="1.0"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="level"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Level</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      disabled
                      className="bg-gray-600 border-gray-500 text-gray-300" 
                    />
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
                  <FormLabel className="text-gray-300">Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      <SelectItem value="active" className="text-white hover:bg-gray-600">Active</SelectItem>
                      <SelectItem value="inactive" className="text-white hover:bg-gray-600">Inactive</SelectItem>
                      <SelectItem value="under_review" className="text-white hover:bg-gray-600">Under Review</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="domainOwner"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Domain Owner</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      className="bg-gray-700 border-gray-600 text-white" 
                      placeholder="Enter domain owner"
                    />
                  </FormControl>
                  <FormMessage />
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
                    <Input 
                      {...field} 
                      className="bg-gray-700 border-gray-600 text-white" 
                      placeholder="Enter IT owner"
                    />
                  </FormControl>
                  <FormMessage />
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
                    <Input 
                      {...field} 
                      className="bg-gray-700 border-gray-600 text-white" 
                      placeholder="Enter vendor focal"
                    />
                  </FormControl>
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
                  <Input 
                    {...field} 
                    className="bg-gray-700 border-gray-600 text-white" 
                    placeholder="Enter description (optional)"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onSuccess?.()}
              className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              {mutation.isPending ? "Creating..." : "Create Child Process"}
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
}