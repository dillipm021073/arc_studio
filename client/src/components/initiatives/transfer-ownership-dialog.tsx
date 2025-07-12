import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus } from "lucide-react";

const transferOwnershipSchema = z.object({
  newOwnerId: z.string().min(1, "Please select a new owner"),
});

type TransferOwnershipFormData = z.infer<typeof transferOwnershipSchema>;

interface TransferOwnershipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initiative: any;
}

export function TransferOwnershipDialog({
  open,
  onOpenChange,
  initiative,
}: TransferOwnershipDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<TransferOwnershipFormData>({
    resolver: zodResolver(transferOwnershipSchema),
    defaultValues: {
      newOwnerId: "",
    },
  });

  // Fetch all users
  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await api.get("/api/users");
      return response.data;
    },
    enabled: open,
  });

  // Filter out the current owner
  const availableUsers = users.filter((user: any) => 
    user.id !== initiative?.createdBy
  );

  const transferMutation = useMutation({
    mutationFn: async (data: TransferOwnershipFormData) => {
      const response = await api.post(`/api/initiatives/${initiative.initiativeId || initiative.id}/transfer-ownership`, {
        newOwnerId: parseInt(data.newOwnerId),
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["initiatives"] });
      toast({
        title: "Ownership transferred",
        description: "The initiative ownership has been successfully transferred.",
      });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to transfer ownership",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TransferOwnershipFormData) => {
    transferMutation.mutate(data);
  };

  useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [open, form]);

  if (!initiative) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Transfer Initiative Ownership</DialogTitle>
          <DialogDescription>
            Transfer ownership of "{initiative.name}" to another user. The new owner will have full control over this initiative.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="newOwnerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Owner</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a user" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableUsers.map((user: any) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          <div className="flex items-center gap-2">
                            <UserPlus className="h-4 w-4" />
                            <span>{user.name || user.username}</span>
                            {user.email && (
                              <span className="text-muted-foreground">({user.email})</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the user who will become the new owner of this initiative
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={transferMutation.isPending}>
                {transferMutation.isPending ? "Transferring..." : "Transfer Ownership"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}