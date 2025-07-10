import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Calendar, FileWarning, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Interface {
  id: number;
  imlNumber: string;
  description?: string;
  status: string;
  consumerApplicationId?: number;
  providerApplicationId?: number;
}

interface DecommissionWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string, acknowledgeInterfaces: boolean) => void;
  applicationName: string;
  decommissionDate: Date;
  impactedInterfaces: Interface[];
  providedInterfaces: Interface[];
  consumedInterfaces: Interface[];
}

export function DecommissionWarningModal({
  isOpen,
  onClose,
  onConfirm,
  applicationName,
  decommissionDate,
  impactedInterfaces,
  providedInterfaces,
  consumedInterfaces,
}: DecommissionWarningModalProps) {
  const [acknowledgeInterfaces, setAcknowledgeInterfaces] = React.useState(false);
  const [decommissionReason, setDecommissionReason] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const totalImpactedInterfaces = providedInterfaces.length + consumedInterfaces.length;
  
  const handleConfirm = async () => {
    if (!acknowledgeInterfaces || !decommissionReason.trim()) {
      return;
    }
    
    setIsSubmitting(true);
    await onConfirm(decommissionReason, acknowledgeInterfaces);
    setIsSubmitting(false);
    
    // Reset state
    setAcknowledgeInterfaces(false);
    setDecommissionReason("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <AlertTriangle className="h-6 w-6 text-red-500" />
            Application Decommission Warning
          </DialogTitle>
          <DialogDescription className="text-base">
            You are about to decommission <strong>{applicationName}</strong> on{" "}
            <strong>{format(decommissionDate, "MMMM dd, yyyy")}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full pr-4">
            <div className="space-y-4">
              {totalImpactedInterfaces > 0 && (
                <Alert className="border-red-200 bg-red-50">
                  <FileWarning className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    <strong>Critical Impact:</strong> This application has{" "}
                    <strong>{totalImpactedInterfaces} interface(s)</strong> that will be affected:
                  </AlertDescription>
                </Alert>
              )}

              {providedInterfaces.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-red-700">
                    Provided Interfaces ({providedInterfaces.length}):
                  </h4>
                  <div className="bg-red-50 rounded-lg p-3 space-y-2">
                    {providedInterfaces.map((iface) => (
                      <div key={iface.id} className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                        <div className="flex-1">
                          <div className="font-medium">{iface.imlNumber}</div>
                          {iface.description && (
                            <div className="text-sm text-gray-600">{iface.description}</div>
                          )}
                          <div className="text-sm text-red-600 font-medium">
                            Will be decommissioned
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {consumedInterfaces.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-orange-700">
                    Consumed Interfaces ({consumedInterfaces.length}):
                  </h4>
                  <div className="bg-orange-50 rounded-lg p-3 space-y-2">
                    {consumedInterfaces.map((iface) => (
                      <div key={iface.id} className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5" />
                        <div className="flex-1">
                          <div className="font-medium">{iface.imlNumber}</div>
                          {iface.description && (
                            <div className="text-sm text-gray-600">{iface.description}</div>
                          )}
                          <div className="text-sm text-orange-600 font-medium">
                            Will need alternative provider
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="reason" className="text-base font-semibold">
                  Decommission Reason <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="reason"
                  placeholder="Please provide a detailed reason for decommissioning this application..."
                  value={decommissionReason}
                  onChange={(e) => setDecommissionReason(e.target.value)}
                  className="min-h-[100px]"
                  required
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-800 mb-2">Important Notes:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-yellow-700">
                  <li>All provided interfaces will be automatically decommissioned</li>
                  <li>Consumer applications will need to find alternative providers</li>
                  <li>This action will be executed on the scheduled decommission date</li>
                  <li>Ensure all stakeholders have been notified</li>
                  <li>Create change requests for any interface migrations if needed</li>
                </ul>
              </div>

              <div className="flex items-start gap-2 bg-gray-50 p-4 rounded-lg">
                <Checkbox
                  id="acknowledge"
                  checked={acknowledgeInterfaces}
                  onCheckedChange={(checked) => setAcknowledgeInterfaces(!!checked)}
                  className="mt-1"
                />
                <Label
                  htmlFor="acknowledge"
                  className="text-sm font-medium leading-relaxed cursor-pointer"
                >
                  I acknowledge that decommissioning <strong>{applicationName}</strong> will impact{" "}
                  <strong>{totalImpactedInterfaces} interface(s)</strong> and have ensured proper
                  communication with all stakeholders. I understand this action will be executed on{" "}
                  <strong>{format(decommissionDate, "MMMM dd, yyyy")}</strong>.
                </Label>
              </div>
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!acknowledgeInterfaces || !decommissionReason.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <>Processing...</>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirm Decommission
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}