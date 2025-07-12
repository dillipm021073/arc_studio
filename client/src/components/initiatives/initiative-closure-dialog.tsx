import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { usePermissions } from "@/hooks/use-permissions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  GitBranch, 
  Lock, 
  Unlock, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Package,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface InitiativeClosureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initiativeId: string;
  initiativeName: string;
}

interface CheckedOutArtifact {
  id: number;
  artifactType: string;
  artifactId: number;
  artifactName: string;
  lockedBy: number;
  lockedAt: string;
  userName: string;
  userEmail: string;
  hasChanges: boolean;
  conflictCount: number;
}

interface VersionConflict {
  id: number;
  artifactType: string;
  artifactId: number;
  artifactName: string;
  conflictingFields: string[];
  resolutionStatus: string;
}

export function InitiativeClosureDialog({
  open,
  onOpenChange,
  initiativeId,
  initiativeName
}: InitiativeClosureDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { isAdmin } = usePermissions();
  const [selectedArtifacts, setSelectedArtifacts] = useState<Set<string>>(new Set());
  const [currentStep, setCurrentStep] = useState<'review' | 'checkin' | 'conflicts' | 'baseline'>('review');

  // Fetch initiative details to check creator
  const { data: initiative } = useQuery({
    queryKey: ['initiative', initiativeId],
    queryFn: async () => {
      const response = await api.get(`/api/initiatives/${initiativeId}`);
      return response.data;
    },
    enabled: open && !!initiativeId
  });

  // Fetch checked out artifacts
  const { data: checkedOutArtifacts = [], isLoading: isLoadingArtifacts } = useQuery({
    queryKey: ['initiative-checked-out', initiativeId],
    queryFn: async () => {
      const response = await api.get(`/api/initiatives/${initiativeId}/checked-out-artifacts`);
      return response.data as CheckedOutArtifact[];
    },
    enabled: open
  });

  // Fetch conflicts
  const { data: conflicts = [], isLoading: isLoadingConflicts } = useQuery({
    queryKey: ['initiative-conflicts', initiativeId],
    queryFn: async () => {
      const response = await api.get(`/api/initiatives/${initiativeId}/conflicts`);
      return response.data as VersionConflict[];
    },
    enabled: open
  });

  // Bulk checkin mutation
  const checkinMutation = useMutation({
    mutationFn: async (artifacts: CheckedOutArtifact[]) => {
      const checkinPromises = artifacts.map(artifact => 
        api.post('/api/version-control/checkin', {
          artifactType: artifact.artifactType,
          artifactId: artifact.artifactId,
          initiativeId,
          changes: {},
          changeDescription: `Bulk checkin for initiative closure: ${initiativeName}`
        })
      );
      
      const results = await Promise.allSettled(checkinPromises);
      const failed = results.filter(r => r.status === 'rejected');
      
      if (failed.length > 0) {
        throw new Error(`Failed to checkin ${failed.length} artifacts`);
      }
      
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['initiative-checked-out', initiativeId] });
      queryClient.invalidateQueries({ queryKey: ['version-control-locks'] });
      toast({
        title: "Artifacts checked in",
        description: "All selected artifacts have been checked in successfully"
      });
      setCurrentStep('conflicts');
    },
    onError: (error: any) => {
      toast({
        title: "Checkin failed",
        description: error.message || "Some artifacts failed to checkin",
        variant: "destructive"
      });
    }
  });

  // Baseline mutation
  const baselineMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/api/initiatives/${initiativeId}/baseline`, {
        description: `Baseline creation for initiative closure: ${initiativeName}`
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['initiatives'] });
      toast({
        title: "Initiative baselined",
        description: `${initiativeName} has been successfully baselined and closed`
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Baseline failed",
        description: error.response?.data?.error || "Failed to create baseline",
        variant: "destructive"
      });
    }
  });

  const handleSelectArtifact = (artifactKey: string, checked: boolean) => {
    const newSelected = new Set(selectedArtifacts);
    if (checked) {
      newSelected.add(artifactKey);
    } else {
      newSelected.delete(artifactKey);
    }
    setSelectedArtifacts(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allKeys = checkedOutArtifacts.map(a => `${a.artifactType}-${a.artifactId}`);
      setSelectedArtifacts(new Set(allKeys));
    } else {
      setSelectedArtifacts(new Set());
    }
  };

  const handleBulkCheckin = () => {
    const selectedArtifactObjects = checkedOutArtifacts.filter(a => 
      selectedArtifacts.has(`${a.artifactType}-${a.artifactId}`)
    );
    
    if (selectedArtifactObjects.length === 0) {
      toast({
        title: "No artifacts selected",
        description: "Please select artifacts to checkin",
        variant: "destructive"
      });
      return;
    }
    
    checkinMutation.mutate(selectedArtifactObjects);
  };

  const handleCreateBaseline = () => {
    if (conflicts.length > 0) {
      toast({
        title: "Conflicts must be resolved",
        description: "Please resolve all conflicts before creating baseline",
        variant: "destructive"
      });
      return;
    }
    
    baselineMutation.mutate();
  };

  const getArtifactIcon = (type: string) => {
    switch (type) {
      case 'application': return <Package className="h-4 w-4" />;
      case 'interface': return <GitBranch className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  // Check if user can create baseline (admin or initiative creator)
  const isCreator = initiative?.initiative?.createdBy === user?.id;
  const canCreateBaseline = isAdmin || isCreator;
  const canProceedToBaseline = checkedOutArtifacts.length === 0 && conflicts.length === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Close Initiative: {initiativeName}
          </DialogTitle>
          <DialogDescription>
            Review and checkin all artifacts, resolve conflicts, then create baseline
          </DialogDescription>
        </DialogHeader>

        <Tabs value={currentStep} onValueChange={(value) => setCurrentStep(value as any)} className="flex-1">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="review" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Review ({checkedOutArtifacts.length})
            </TabsTrigger>
            <TabsTrigger value="checkin" disabled={checkedOutArtifacts.length === 0}>
              <Unlock className="h-4 w-4" />
              Checkin
            </TabsTrigger>
            <TabsTrigger value="conflicts" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Conflicts ({conflicts.length})
            </TabsTrigger>
            <TabsTrigger value="baseline" disabled={!canProceedToBaseline}>
              <CheckCircle className="h-4 w-4" />
              Baseline
            </TabsTrigger>
          </TabsList>

          <TabsContent value="review" className="space-y-4 mt-4">
            <Alert>
              <Lock className="h-4 w-4" />
              <AlertDescription>
                The following artifacts are currently checked out and need to be checked in before closing the initiative.
              </AlertDescription>
            </Alert>

            {isLoadingArtifacts ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : checkedOutArtifacts.length === 0 ? (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  All artifacts are checked in. You can proceed to resolve conflicts and create baseline.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <Checkbox
                    checked={selectedArtifacts.size === checkedOutArtifacts.length}
                    onCheckedChange={handleSelectAll}
                  />
                  <span className="text-sm font-medium">Select All</span>
                </div>
                
                {checkedOutArtifacts.map((artifact) => {
                  const artifactKey = `${artifact.artifactType}-${artifact.artifactId}`;
                  return (
                    <div
                      key={artifactKey}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                    >
                      <Checkbox
                        checked={selectedArtifacts.has(artifactKey)}
                        onCheckedChange={(checked) => handleSelectArtifact(artifactKey, checked as boolean)}
                      />
                      {getArtifactIcon(artifact.artifactType)}
                      <div className="flex-1">
                        <div className="font-medium">{artifact.artifactName}</div>
                        <div className="text-sm text-muted-foreground">
                          {artifact.artifactType} • Locked by {artifact.userName}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {artifact.hasChanges && (
                          <Badge variant="secondary">Has Changes</Badge>
                        )}
                        {artifact.conflictCount > 0 && (
                          <Badge variant="destructive">{artifact.conflictCount} Conflicts</Badge>
                        )}
                        <Badge variant="outline">
                          <Lock className="h-3 w-3 mr-1" />
                          Checked Out
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="checkin" className="space-y-4 mt-4">
            <Alert>
              <Unlock className="h-4 w-4" />
              <AlertDescription>
                Selected artifacts will be checked in with their current changes.
              </AlertDescription>
            </Alert>
            
            <div className="text-sm text-muted-foreground">
              {selectedArtifacts.size} of {checkedOutArtifacts.length} artifacts selected for checkin
            </div>
          </TabsContent>

          <TabsContent value="conflicts" className="space-y-4 mt-4">
            {isLoadingConflicts ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : conflicts.length === 0 ? (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  No conflicts detected. You can proceed to create baseline.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-2">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    The following conflicts must be resolved before creating baseline.
                  </AlertDescription>
                </Alert>
                
                {conflicts.map((conflict) => (
                  <div
                    key={`${conflict.artifactType}-${conflict.artifactId}`}
                    className="p-3 rounded-lg border bg-card"
                  >
                    <div className="flex items-center gap-3">
                      {getArtifactIcon(conflict.artifactType)}
                      <div className="flex-1">
                        <div className="font-medium">{conflict.artifactName}</div>
                        <div className="text-sm text-muted-foreground">
                          {conflict.artifactType} • {conflict.conflictingFields.length} conflicting fields
                        </div>
                      </div>
                      <Badge variant="destructive">
                        {conflict.resolutionStatus}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="baseline" className="space-y-4 mt-4">
            {!canCreateBaseline ? (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Only admin users or the initiative creator can create baselines and close initiatives.
                  {isCreator === false && !isAdmin && (
                    <span className="block mt-2">
                      You are not authorized to baseline this initiative.
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    All artifacts are checked in and conflicts resolved. Ready to create baseline and close initiative.
                  </AlertDescription>
                </Alert>
                
                <div className="text-sm text-muted-foreground">
                  Creating a baseline will:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Mark all current versions as baseline</li>
                    <li>Close the initiative</li>
                    <li>Make changes available in production view</li>
                    <li>Prevent further modifications to this initiative</li>
                  </ul>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          
          <div className="flex gap-2">
            {currentStep === 'review' && checkedOutArtifacts.length > 0 && (
              <Button 
                onClick={() => setCurrentStep('checkin')}
                disabled={selectedArtifacts.size === 0}
              >
                Proceed to Checkin ({selectedArtifacts.size})
              </Button>
            )}
            
            {currentStep === 'checkin' && (
              <Button 
                onClick={handleBulkCheckin}
                disabled={checkinMutation.isPending || selectedArtifacts.size === 0}
              >
                {checkinMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Checkin Selected Artifacts
              </Button>
            )}
            
            {currentStep === 'conflicts' && conflicts.length === 0 && (
              <Button onClick={() => setCurrentStep('baseline')}>
                Proceed to Baseline
              </Button>
            )}
            
            {currentStep === 'baseline' && (
              <Button 
                onClick={handleCreateBaseline}
                disabled={baselineMutation.isPending || !canProceedToBaseline || !canCreateBaseline}
                className="bg-green-600 hover:bg-green-700"
              >
                {baselineMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Baseline & Close Initiative
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}