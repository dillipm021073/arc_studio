import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { Plus, X, Link as LinkIcon, Users } from "lucide-react";

const conversationSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: z.enum(["open", "resolved", "pending", "closed"]),
  priority: z.enum(["low", "medium", "high", "critical"]),
  assignedTo: z.string().optional(),
});

type ConversationFormData = z.infer<typeof conversationSchema>;

interface LinkedEntity {
  entityType: string;
  entityId: number;
  displayName?: string;
}

interface Participant {
  participantName: string;
  participantRole?: string;
}

interface ConversationFormProps {
  conversation?: any;
  onSuccess?: () => void;
  linkedEntity?: { type: string; id: number };
  entityType?: "application" | "interface" | "business_process" | "change_request";
  entityId?: number;
  entityName?: string;
}

export default function ConversationForm({ conversation, onSuccess, linkedEntity, entityType, entityId, entityName }: ConversationFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!conversation;

  const [linkedEntities, setLinkedEntities] = useState<LinkedEntity[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [newParticipantName, setNewParticipantName] = useState("");
  const [newParticipantRole, setNewParticipantRole] = useState("");

  // Fetch data for entity linking
  const { data: applications } = useQuery({
    queryKey: ["/api/applications"],
  });

  const { data: interfaces } = useQuery({
    queryKey: ["/api/interfaces"],
  });

  const { data: businessProcesses } = useQuery({
    queryKey: ["/api/business-processes"],
  });

  const { data: changeRequests } = useQuery({
    queryKey: ["/api/change-requests"],
  });

  const form = useForm<ConversationFormData>({
    resolver: zodResolver(conversationSchema),
    defaultValues: {
      title: conversation?.title || "",
      description: conversation?.description || "",
      status: conversation?.status || "open",
      priority: conversation?.priority || "medium",
      assignedTo: conversation?.assignedTo || "",
    },
  });

  useEffect(() => {
    if (conversation) {
      setLinkedEntities(conversation.links?.map((link: any) => ({
        entityType: link.entityType,
        entityId: link.entityId,
        displayName: getEntityDisplayName(link.entityType, link.entityId)
      })) || []);
      setParticipants(conversation.participants?.map((p: any) => ({
        participantName: p.participantName,
        participantRole: p.participantRole
      })) || []);
    } else if (entityType && entityId) {
      setLinkedEntities([{
        entityType,
        entityId,
        displayName: entityName || getEntityDisplayName(entityType, entityId)
      }]);
    } else if (linkedEntity) {
      setLinkedEntities([{
        entityType: linkedEntity.type,
        entityId: linkedEntity.id,
        displayName: getEntityDisplayName(linkedEntity.type, linkedEntity.id)
      }]);
    }
  }, [conversation, linkedEntity, entityType, entityId, entityName]);

  const getEntityDisplayName = (type: string, id: number): string => {
    switch (type) {
      case 'application':
        return applications?.find((a: any) => a.id === id)?.name || `App #${id}`;
      case 'interface':
        return interfaces?.find((i: any) => i.id === id)?.imlNumber || `IML #${id}`;
      case 'business_process':
        return businessProcesses?.find((bp: any) => bp.id === id)?.businessProcess || `BP #${id}`;
      case 'change_request':
        return changeRequests?.find((cr: any) => cr.id === id)?.crNumber || `CR #${id}`;
      default:
        return `${type} #${id}`;
    }
  };

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create conversation");
      return response.json();
    },
    onSuccess: async (newConversation) => {
      // Add links
      for (const entity of linkedEntities) {
        await fetch(`/api/conversations/${newConversation.id}/links`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            entityType: entity.entityType,
            entityId: entity.entityId,
          }),
        });
      }

      // Add participants
      for (const participant of participants) {
        await fetch(`/api/conversations/${newConversation.id}/participants`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(participant),
        });
      }

      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      toast({
        title: "Success",
        description: "Conversation created successfully",
      });
      onSuccess?.();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create conversation",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/conversations/${conversation.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update conversation");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      toast({
        title: "Success",
        description: "Conversation updated successfully",
      });
      onSuccess?.();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update conversation",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ConversationFormData) => {
    const conversationData = {
      ...data,
      createdBy: isEditing ? conversation.createdBy : user?.username || "Unknown",
    };

    if (isEditing) {
      updateMutation.mutate(conversationData);
    } else {
      createMutation.mutate(conversationData);
    }
  };

  const addLinkedEntity = (type: string, id: string) => {
    if (id === "none") return; // Skip "none" selection
    const entityId = parseInt(id);
    if (!isNaN(entityId) && !linkedEntities.some(e => e.entityType === type && e.entityId === entityId)) {
      setLinkedEntities([...linkedEntities, {
        entityType: type,
        entityId,
        displayName: getEntityDisplayName(type, entityId)
      }]);
    }
  };

  const removeLinkedEntity = (index: number) => {
    setLinkedEntities(linkedEntities.filter((_, i) => i !== index));
  };

  const addParticipant = () => {
    if (newParticipantName.trim()) {
      setParticipants([...participants, {
        participantName: newParticipantName.trim(),
        participantRole: newParticipantRole.trim() || undefined
      }]);
      setNewParticipantName("");
      setNewParticipantRole("");
    }
  };

  const removeParticipant = (index: number) => {
    setParticipants(participants.filter((_, i) => i !== index));
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white">
            {isEditing ? "Edit Conversation" : "Create New Conversation"}
          </h2>

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-300">Title</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="Enter conversation title"
                  />
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
                  <Textarea
                    {...field}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="Enter conversation description"
                    rows={3}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
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
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
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
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="assignedTo"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-300">Assigned To</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="Enter assignee name"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Linked Entities */}
          <div className="space-y-2">
            <FormLabel className="text-gray-300 flex items-center">
              <LinkIcon className="mr-2 h-4 w-4" />
              Linked Entities
            </FormLabel>
            <div className="space-y-2">
              {linkedEntities.map((entity, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Badge className="bg-gray-700 text-gray-300">
                    {entity.entityType}: {entity.displayName}
                  </Badge>
                  {!isEditing && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLinkedEntity(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              {!isEditing && (
                <div className="flex items-center space-x-2">
                  <Select onValueChange={(type) => {
                    const selectElement = document.getElementById(`entity-${type}`) as HTMLSelectElement;
                    if (selectElement?.value) {
                      addLinkedEntity(type, selectElement.value);
                    }
                  }}>
                    <SelectTrigger className="w-48 bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="Select entity type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="application">Application</SelectItem>
                      <SelectItem value="interface">Interface</SelectItem>
                      <SelectItem value="business_process">Business Process</SelectItem>
                      <SelectItem value="change_request">Change Request</SelectItem>
                    </SelectContent>
                  </Select>
                  <select
                    id="entity-application"
                    className="hidden"
                    onChange={(e) => addLinkedEntity('application', e.target.value)}
                  >
                    <option value="none">Select...</option>
                    {applications?.map((app: any) => (
                      <option key={app.id} value={app.id}>{app.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Participants */}
          <div className="space-y-2">
            <FormLabel className="text-gray-300 flex items-center">
              <Users className="mr-2 h-4 w-4" />
              Participants
            </FormLabel>
            <div className="space-y-2">
              {participants.map((participant, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Badge className="bg-gray-700 text-gray-300">
                    {participant.participantName}
                    {participant.participantRole && ` (${participant.participantRole})`}
                  </Badge>
                  {!isEditing && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeParticipant(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              {!isEditing && (
                <div className="flex items-center space-x-2">
                  <Input
                    value={newParticipantName}
                    onChange={(e) => setNewParticipantName(e.target.value)}
                    placeholder="Participant name"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                  <Select value={newParticipantRole} onValueChange={setNewParticipantRole}>
                    <SelectTrigger className="w-32 bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer">Customer</SelectItem>
                      <SelectItem value="vendor">Vendor</SelectItem>
                      <SelectItem value="architect">Architect</SelectItem>
                      <SelectItem value="pm">PM</SelectItem>
                      <SelectItem value="tester">Tester</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    onClick={addParticipant}
                    size="sm"
                    className="bg-blue-600 text-white hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2">
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
            className="bg-blue-600 text-white hover:bg-blue-700"
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {createMutation.isPending || updateMutation.isPending
              ? "Saving..."
              : isEditing
              ? "Update"
              : "Create"}
          </Button>
        </div>
      </form>
    </Form>
  );
}