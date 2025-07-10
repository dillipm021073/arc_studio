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
import { AlertTriangle, XCircle, CheckCircle, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ValidationIssue {
  type: 'provider' | 'consumer';
  applicationName: string;
  applicationStatus: string;
  message: string;
}

interface InterfaceActivationWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceed?: () => void;
  interfaceName: string;
  validationResult: {
    canActivate: boolean;
    issues: ValidationIssue[];
    providerApplication?: {
      id: number;
      name: string;
      status: string;
    } | null;
    consumerApplication?: {
      id: number;
      name: string;
      status: string;
    } | null;
  };
}

export function InterfaceActivationWarningModal({
  isOpen,
  onClose,
  onProceed,
  interfaceName,
  validationResult,
}: InterfaceActivationWarningModalProps) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-600 text-white';
      case 'inactive': return 'bg-red-600 text-white';
      case 'maintenance': return 'bg-blue-600 text-white';
      case 'deprecated': return 'bg-orange-600 text-white';
      case 'decommissioned': return 'bg-gray-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            {validationResult.canActivate ? (
              <>
                <CheckCircle className="h-6 w-6 text-green-500" />
                Interface Can Be Activated
              </>
            ) : (
              <>
                <XCircle className="h-6 w-6 text-red-500" />
                Interface Cannot Be Activated
              </>
            )}
          </DialogTitle>
          <DialogDescription className="text-base">
            Validation results for activating interface: <strong>{interfaceName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Application Status Summary */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Associated Applications:</h4>
            
            {validationResult.providerApplication && (
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="text-sm">
                    <span className="text-gray-500">Provider:</span>{" "}
                    <span className="font-medium">{validationResult.providerApplication.name}</span>
                  </div>
                </div>
                <Badge className={getStatusColor(validationResult.providerApplication.status)}>
                  {validationResult.providerApplication.status}
                </Badge>
              </div>
            )}
            
            {validationResult.consumerApplication && (
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="text-sm">
                    <span className="text-gray-500">Consumer:</span>{" "}
                    <span className="font-medium">{validationResult.consumerApplication.name}</span>
                  </div>
                </div>
                <Badge className={getStatusColor(validationResult.consumerApplication.status)}>
                  {validationResult.consumerApplication.status}
                </Badge>
              </div>
            )}
          </div>

          {/* Validation Issues */}
          {validationResult.issues.length > 0 && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription>
                <div className="space-y-2">
                  <div className="font-semibold text-red-800">
                    The following issues prevent activation:
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
                    {validationResult.issues.map((issue, index) => (
                      <li key={index}>{issue.message}</li>
                    ))}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Success Message */}
          {validationResult.canActivate && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                All associated applications are active. The interface can be activated.
              </AlertDescription>
            </Alert>
          )}

          {/* Information Note */}
          <Alert className="border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 text-sm">
              <strong>Note:</strong> An interface can only be activated when both its provider 
              and consumer applications are in an active state. This ensures proper connectivity 
              and prevents runtime errors.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            {validationResult.canActivate ? "Cancel" : "Close"}
          </Button>
          {validationResult.canActivate && onProceed && (
            <Button onClick={onProceed} className="bg-green-600 hover:bg-green-700">
              Proceed with Activation
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}