import React from "react";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Lock, User, Calendar, FileText } from "lucide-react";

interface LockConflictDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  error: {
    error: string;
    lockedBy?: number;
    lockedByUser?: string;
    initiativeId?: string;
    expiresAt?: string;
  } | null;
  artifactType?: string;
}

export function LockConflictDialog({
  open,
  onOpenChange,
  error,
  artifactType = "artifact"
}: LockConflictDialogProps) {
  if (!error) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Unknown";
    try {
      return format(new Date(dateString), "PPP 'at' p");
    } catch {
      return "Unknown";
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-destructive" />
            <AlertDialogTitle>Artifact Locked</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-4 pt-4">
            <div className="bg-muted p-4 rounded-lg space-y-3">
              <p className="text-sm font-medium text-foreground">
                This {artifactType} is currently being edited by another user.
              </p>
              
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Locked by</p>
                    <p className="text-sm text-muted-foreground">
                      {error.lockedByUser || "Unknown User"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Initiative</p>
                    <p className="text-sm text-muted-foreground font-mono">
                      {error.initiativeId || "Unknown Initiative"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Lock expires</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(error.expiresAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>What can you do?</strong>
              </p>
              <ul className="text-sm text-blue-700 dark:text-blue-300 mt-1 space-y-1">
                <li>• Contact {error.lockedByUser || "the user"} to coordinate</li>
                <li>• Wait for the lock to expire</li>
                <li>• Ask an administrator to release the lock if needed</li>
              </ul>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button onClick={() => onOpenChange(false)}>
            Understood
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}