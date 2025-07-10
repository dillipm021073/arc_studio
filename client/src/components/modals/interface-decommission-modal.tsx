import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Users, GitBranch, Box } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface InterfaceDecommissionModalProps {
  interface_: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function InterfaceDecommissionModal({
  interface_,
  open,
  onOpenChange,
}: InterfaceDecommissionModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [decommissionDate, setDecommissionDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [reason, setReason] = useState("");
  const [decommissionedBy, setDecommissionedBy] = useState("");

  // Get business processes using this interface
  const { data: businessProcesses = [] } = useQuery({
    queryKey: ["/api/interfaces", interface_?.id, "business-processes"],
    enabled: !!interface_?.id,
  });

  // Get applications associated with this interface
  const { data: applications = [] } = useQuery({
    queryKey: ["/api/applications"],
  });

  const providerApp = applications.find((app: any) => app.id === interface_?.providerApplicationId);
  const consumerApp = applications.find((app: any) => app.id === interface_?.consumerApplicationId);

  const decommissionMutation = useMutation({
    mutationFn: async () => {
      // Update the interface status to decommissioned
      const response = await fetch(`/api/interfaces/${interface_.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...interface_,
          status: "decommissioned",
          lastChangeDate: new Date(),
        }),
      });
      
      if (!response.ok) throw new Error("Failed to decommission interface");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/interfaces"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      toast({
        title: "Interface Decommissioned",
        description: `${interface_.imlNumber} has been successfully decommissioned.`,
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to decommission interface. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDecommission = () => {
    if (!reason.trim() || !decommissionedBy.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a reason and your name.",
        variant: "destructive",
      });
      return;
    }
    
    decommissionMutation.mutate();
  };

  if (!interface_) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-gray-800 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-white flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Decommission Interface
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            You are about to decommission interface <span className="font-semibold text-white">{interface_.imlNumber}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Warning about business processes */}
          {businessProcesses.length > 0 && (
            <Alert className="bg-orange-900/20 border-orange-600">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <AlertDescription className="text-orange-200">
                <strong>Warning:</strong> This interface is used by {businessProcesses.length} business 
                process{businessProcesses.length > 1 ? 'es' : ''}. Decommissioning will affect these processes:
                <ul className="mt-2 space-y-1">
                  {businessProcesses.map((bp: any) => (
                    <li key={bp.id} className="flex items-center gap-2">
                      <GitBranch className="h-3 w-3" />
                      <span className="text-sm">{bp.businessProcess.businessProcess}</span>
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Interface details */}
          <div className="bg-gray-700 p-4 rounded-lg space-y-3">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">Interface Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Type:</span>
                <Badge className="ml-2 bg-blue-600 text-white">{interface_.interfaceType}</Badge>
              </div>
              <div>
                <span className="text-gray-400">Version:</span>
                <span className="ml-2 text-white">v{interface_.version}</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-400">Provider:</span>
                <div className="flex items-center gap-2 mt-1">
                  <Box className="h-4 w-4 text-gray-400" />
                  <span className="text-white">{providerApp?.name || 'Unknown'}</span>
                  {providerApp?.status === 'decommissioned' && (
                    <Badge className="bg-red-600 text-white text-xs">Decommissioned</Badge>
                  )}
                </div>
              </div>
              <div className="col-span-2">
                <span className="text-gray-400">Consumer:</span>
                <div className="flex items-center gap-2 mt-1">
                  <Box className="h-4 w-4 text-gray-400" />
                  <span className="text-white">{consumerApp?.name || 'Unknown'}</span>
                  {consumerApp?.status === 'decommissioned' && (
                    <Badge className="bg-red-600 text-white text-xs">Decommissioned</Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Decommission form */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="decommissionDate" className="text-gray-300">
                Decommission Date
              </Label>
              <Input
                id="decommissionDate"
                type="date"
                value={decommissionDate}
                onChange={(e) => setDecommissionDate(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
                min={format(new Date(), "yyyy-MM-dd")}
              />
            </div>

            <div>
              <Label htmlFor="reason" className="text-gray-300">
                Reason for Decommissioning <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Provide a detailed reason for decommissioning this interface..."
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 min-h-[100px]"
              />
            </div>

            <div>
              <Label htmlFor="decommissionedBy" className="text-gray-300">
                Your Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="decommissionedBy"
                value={decommissionedBy}
                onChange={(e) => setDecommissionedBy(e.target.value)}
                placeholder="Enter your full name"
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600"
          >
            Cancel
          </Button>
          <Button
            onClick={handleDecommission}
            disabled={decommissionMutation.isPending || !reason.trim() || !decommissionedBy.trim()}
            className="bg-orange-600 text-white hover:bg-orange-700"
          >
            {decommissionMutation.isPending ? "Decommissioning..." : "Decommission Interface"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}