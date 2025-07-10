import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { insertChangeRequestSchema, type InsertChangeRequest } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface ChangeRequestFormProps {
  onSuccess?: () => void;
  initialData?: Partial<InsertChangeRequest>;
  isEditing?: boolean;
}

export default function ChangeRequestForm({ onSuccess, initialData, isEditing = false }: ChangeRequestFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertChangeRequest>({
    resolver: zodResolver(insertChangeRequestSchema),
    defaultValues: {
      crNumber: initialData?.crNumber || "",
      title: initialData?.title || "",
      description: initialData?.description || "",
      reason: initialData?.reason || "",
      benefit: initialData?.benefit || "",
      status: initialData?.status || "draft",
      priority: initialData?.priority || "medium",
      owner: initialData?.owner || "",
      requestedBy: initialData?.requestedBy || "",
      approvedBy: initialData?.approvedBy || "",
      targetDate: initialData?.targetDate 
        ? (typeof initialData.targetDate === 'string' 
          ? new Date(initialData.targetDate) 
          : initialData.targetDate)
        : undefined,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertChangeRequest) => {
      const response = await apiRequest("POST", "/api/change-requests", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/change-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/recent-changes"] });
      toast({
        title: "Change request created",
        description: "The change request has been successfully created.",
      });
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create change request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertChangeRequest) => {
    // Convert dates to ISO strings
    const submitData = {
      ...data,
      targetDate: data.targetDate ? 
        (data.targetDate instanceof Date ? 
          data.targetDate.toISOString() : 
          data.targetDate) : 
        undefined,
      completedDate: data.completedDate ? 
        (data.completedDate instanceof Date ? 
          data.completedDate.toISOString() : 
          data.completedDate) : 
        undefined
    };
    createMutation.mutate(submitData);
  };

  return (
    <div className="bg-gray-800 text-white">
      <DialogHeader>
        <DialogTitle className="text-white">{isEditing ? "Edit Change Request" : "Create New Change Request"}</DialogTitle>
        <p className="text-sm text-gray-400 mt-2">
          {isEditing 
            ? "Update the change request details and status." 
            : "Create a new change request to track proposed changes to applications and interfaces."}
        </p>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="crNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">CR Number *</FormLabel>
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
                <FormLabel className="text-gray-300">Title *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter change request title" {...field} className="bg-gray-700 border-gray-600 text-white placeholder-gray-400" />
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
                  <Textarea rows={3} placeholder="Describe the change request" {...field} className="bg-gray-700 border-gray-600 text-white placeholder-gray-400" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Reason for Change</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Why is this change needed?" {...field} className="bg-gray-700 border-gray-600 text-white placeholder-gray-400" />
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
                    <Textarea rows={3} placeholder="What benefits will this change bring?" {...field} className="bg-gray-700 border-gray-600 text-white placeholder-gray-400" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField
              control={form.control}
              name="owner"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Owner</FormLabel>
                  <FormControl>
                    <Input placeholder="Change owner" {...field} className="bg-gray-700 border-gray-600 text-white placeholder-gray-400" />
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
                    <Input placeholder="Who requested this change" {...field} className="bg-gray-700 border-gray-600 text-white placeholder-gray-400" />
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
                    <Input placeholder="Who approved this change" {...field} className="bg-gray-700 border-gray-600 text-white placeholder-gray-400" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      <SelectItem value="draft" className="text-gray-300">Draft</SelectItem>
                      <SelectItem value="submitted" className="text-gray-300">Submitted</SelectItem>
                      <SelectItem value="under_review" className="text-gray-300">Under Review</SelectItem>
                      <SelectItem value="approved" className="text-gray-300">Approved</SelectItem>
                      <SelectItem value="in_progress" className="text-gray-300">In Progress</SelectItem>
                      <SelectItem value="completed" className="text-gray-300">Completed</SelectItem>
                      <SelectItem value="rejected" className="text-gray-300">Rejected</SelectItem>
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
                <FormItem>
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
                            format(field.value, "PPP")
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
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date < new Date()
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-600">
            <Button type="button" variant="outline" onClick={onSuccess} className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600">
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending} className="bg-blue-600 text-white hover:bg-blue-700">
              {createMutation.isPending ? "Saving..." : isEditing ? "Update Change Request" : "Save Change Request"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
