import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from './use-toast';

interface BulkUpdateRequest {
  ids: string[];
  updates: Record<string, any>;
}

interface BulkDeleteRequest {
  ids: string[];
}

interface BulkDuplicateRequest {
  ids: string[];
}

export function useBulkOperations(entityType: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const bulkUpdate = useMutation({
    mutationFn: async ({ ids, updates }: BulkUpdateRequest) => {
      const response = await fetch(`/api/bulk/${entityType}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids, updates }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update items');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [entityType] });
      toast({
        title: "Success",
        description: data.message || `Successfully updated ${data.updatedCount} items`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || 'Failed to update items',
        variant: "destructive",
      });
    },
  });

  const bulkDelete = useMutation({
    mutationFn: async ({ ids }: BulkDeleteRequest) => {
      const response = await fetch(`/api/bulk/${entityType}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete items');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [entityType] });
      toast({
        title: "Success",
        description: data.message || `Successfully deleted ${data.deletedCount} items`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || 'Failed to delete items',
        variant: "destructive",
      });
    },
  });

  const bulkDuplicate = useMutation({
    mutationFn: async ({ ids }: BulkDuplicateRequest) => {
      const response = await fetch(`/api/bulk/${entityType}/duplicate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to duplicate items');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [entityType] });
      toast({
        title: "Success",
        description: data.message || `Successfully duplicated ${data.duplicatedCount} items`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || 'Failed to duplicate items',
        variant: "destructive",
      });
    },
  });

  return {
    bulkUpdate: bulkUpdate.mutate,
    bulkDelete: bulkDelete.mutate,
    bulkDuplicate: bulkDuplicate.mutate,
    isUpdating: bulkUpdate.isPending,
    isDeleting: bulkDelete.isPending,
    isDuplicating: bulkDuplicate.isPending,
  };
}