import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle,
  GitMerge,
  CheckCircle,
  XCircle,
  Sparkles,
  FileText,
  Globe,
  GitBranch,
  Info
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ConflictResolutionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conflictId: number;
  initiativeId: string;
}

interface ConflictDetail {
  field: string;
  path: string[];
  originalValue: any;
  baselineValue: any;
  initiativeValue: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
  autoResolvable: boolean;
  suggestedResolution?: 'baseline' | 'initiative' | 'merge';
  mergeStrategy?: string;
}

interface ConflictAnalysis {
  conflicts: ConflictDetail[];
  dependencies: Array<{
    dependentArtifact: {
      type: string;
      id: number;
      name: string;
    };
    impactType: 'breaking' | 'warning' | 'info';
    description: string;
  }>;
  riskScore: number;
  autoResolvable: boolean;
  suggestedStrategy: 'auto' | 'manual' | 'escalate';
}

export function ConflictResolutionDialog({
  open,
  onOpenChange,
  conflictId,
  initiativeId
}: ConflictResolutionDialogProps) {
  const [resolutionStrategy, setResolutionStrategy] = useState<string>('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [customResolutions, setCustomResolutions] = useState<Record<string, any>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch conflict details with analysis
  const { data: conflict, isLoading } = useQuery({
    queryKey: ['conflict-analysis', conflictId],
    queryFn: async () => {
      const response = await api.get(
        `/api/initiatives/${initiativeId}/conflicts/${conflictId}/analysis`
      );
      return response.data;
    },
    enabled: open
  });

  // Resolve conflict mutation
  const resolveMutation = useMutation({
    mutationFn: async (data: {
      strategy: string;
      resolvedData?: any;
      notes?: string;
    }) => {
      const response = await api.post(
        `/api/initiatives/${initiativeId}/conflicts/${conflictId}/resolve`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conflicts'] });
      queryClient.invalidateQueries({ queryKey: ['initiatives'] });
      toast({
        title: "Conflict resolved",
        description: "The conflict has been successfully resolved."
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Resolution failed",
        description: error.response?.data?.error || "Failed to resolve conflict",
        variant: "destructive"
      });
    }
  });

  // Auto-resolve mutation
  const autoResolveMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(
        `/api/initiatives/${initiativeId}/conflicts/${conflictId}/auto-resolve`
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conflicts'] });
      queryClient.invalidateQueries({ queryKey: ['initiatives'] });
      toast({
        title: "Auto-resolved",
        description: "The conflict has been automatically resolved."
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Auto-resolution failed",
        description: error.response?.data?.error || "Failed to auto-resolve conflict",
        variant: "destructive"
      });
    }
  });

  const analysis = conflict?.analysis as ConflictAnalysis | undefined;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getImpactIcon = (type: string) => {
    switch (type) {
      case 'breaking': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'info': return <Info className="h-4 w-4 text-blue-600" />;
      default: return null;
    }
  };

  const renderValue = (value: any): string => {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  const handleResolve = () => {
    if (!resolutionStrategy) {
      toast({
        title: "Select a strategy",
        description: "Please select a resolution strategy",
        variant: "destructive"
      });
      return;
    }

    let resolvedData = null;
    
    if (resolutionStrategy === 'manual_merge') {
      // Build resolved data from custom resolutions
      resolvedData = { ...customResolutions };
    }

    resolveMutation.mutate({
      strategy: resolutionStrategy as any,
      resolvedData,
      notes: resolutionNotes
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitMerge className="h-5 w-5" />
            Resolve Conflict
          </DialogTitle>
          <DialogDescription>
            Review and resolve conflicts between baseline and initiative changes
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4 flex-1">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : conflict && analysis ? (
          <div className="flex-1 overflow-hidden flex flex-col space-y-4">
            {/* Risk Assessment */}
            <div className="grid grid-cols-3 gap-4">
              <div className={cn(
                "p-3 rounded-lg border",
                analysis.riskScore > 50 ? "border-red-200 bg-red-50" :
                analysis.riskScore > 20 ? "border-yellow-200 bg-yellow-50" :
                "border-green-200 bg-green-50"
              )}>
                <div className="text-sm font-medium">Risk Score</div>
                <div className="text-2xl font-bold">
                  {analysis.riskScore}/100
                </div>
              </div>

              <div className="p-3 rounded-lg border">
                <div className="text-sm font-medium">Conflicts</div>
                <div className="text-2xl font-bold">
                  {analysis.conflicts.length}
                </div>
              </div>

              <div className="p-3 rounded-lg border">
                <div className="text-sm font-medium">Dependencies</div>
                <div className="text-2xl font-bold">
                  {analysis.dependencies.length}
                </div>
              </div>
            </div>

            {/* Strategy Recommendation */}
            {analysis.suggestedStrategy && (
              <Alert>
                <Sparkles className="h-4 w-4" />
                <AlertDescription>
                  <strong>Recommendation:</strong> {
                    analysis.suggestedStrategy === 'auto' ? 'This conflict can be automatically resolved.' :
                    analysis.suggestedStrategy === 'manual' ? 'Manual review and resolution recommended.' :
                    'This conflict should be escalated to senior architects.'
                  }
                </AlertDescription>
              </Alert>
            )}

            <Tabs defaultValue="conflicts" className="flex-1 overflow-hidden flex flex-col">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="conflicts">
                  Conflicts ({analysis.conflicts.length})
                </TabsTrigger>
                <TabsTrigger value="dependencies">
                  Dependencies ({analysis.dependencies.length})
                </TabsTrigger>
                <TabsTrigger value="resolution">
                  Resolution
                </TabsTrigger>
              </TabsList>

              <TabsContent value="conflicts" className="flex-1 overflow-hidden">
                <ScrollArea className="h-[300px] rounded-md border p-4">
                  <div className="space-y-4">
                    {analysis.conflicts.map((conflict, index) => (
                      <div 
                        key={index} 
                        className="border rounded-lg p-4 space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium">{conflict.field}</h4>
                            <p className="text-xs text-muted-foreground">
                              Path: {conflict.path.join(' → ')}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="secondary" 
                              className={cn("text-xs", getSeverityColor(conflict.severity))}
                            >
                              {conflict.severity}
                            </Badge>
                            {conflict.autoResolvable && (
                              <Badge variant="secondary" className="text-xs">
                                Auto-resolvable
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 text-sm">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <FileText className="h-3 w-3" />
                              Original
                            </div>
                            <pre className="p-2 bg-gray-50 rounded text-xs overflow-auto max-h-20">
                              {renderValue(conflict.originalValue)}
                            </pre>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Globe className="h-3 w-3" />
                              Baseline (Current)
                            </div>
                            <pre className="p-2 bg-blue-50 rounded text-xs overflow-auto max-h-20">
                              {renderValue(conflict.baselineValue)}
                            </pre>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <GitBranch className="h-3 w-3" />
                              Initiative
                            </div>
                            <pre className="p-2 bg-green-50 rounded text-xs overflow-auto max-h-20">
                              {renderValue(conflict.initiativeValue)}
                            </pre>
                          </div>
                        </div>

                        {conflict.suggestedResolution && (
                          <div className="text-xs text-muted-foreground">
                            Suggested: Use <strong>{conflict.suggestedResolution}</strong> value
                            {conflict.mergeStrategy && ` (${conflict.mergeStrategy} strategy)`}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="dependencies" className="flex-1 overflow-hidden">
                <ScrollArea className="h-[300px] rounded-md border p-4">
                  {analysis.dependencies.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      No dependency impacts detected
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {analysis.dependencies.map((dep, index) => (
                        <div 
                          key={index}
                          className="flex items-start gap-3 p-3 rounded-lg border"
                        >
                          {getImpactIcon(dep.impactType)}
                          <div className="flex-1">
                            <div className="font-medium text-sm">
                              {dep.dependentArtifact.type} - {dep.dependentArtifact.name}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {dep.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="resolution" className="flex-1 overflow-hidden space-y-4">
                <RadioGroup 
                  value={resolutionStrategy} 
                  onValueChange={setResolutionStrategy}
                >
                  <div className="space-y-3">
                    {analysis.autoResolvable && (
                      <label className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50">
                        <RadioGroupItem value="auto_merge" className="mt-1" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4" />
                            <span className="font-medium">Auto-merge</span>
                            <Badge variant="secondary" className="text-xs">
                              Recommended
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Automatically resolve using intelligent merge strategies
                          </p>
                        </div>
                      </label>
                    )}

                    <label className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50">
                      <RadioGroupItem value="accept_baseline" className="mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          <span className="font-medium">Accept baseline</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Keep all baseline changes and discard initiative changes
                        </p>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50">
                      <RadioGroupItem value="keep_initiative" className="mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <GitBranch className="h-4 w-4" />
                          <span className="font-medium">Keep initiative</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Keep all initiative changes and override baseline
                        </p>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50">
                      <RadioGroupItem value="manual_merge" className="mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <GitMerge className="h-4 w-4" />
                          <span className="font-medium">Manual merge</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Manually select values for each conflicting field
                        </p>
                      </div>
                    </label>
                  </div>
                </RadioGroup>

                <div className="space-y-2">
                  <Label htmlFor="notes">Resolution Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add any notes about this resolution..."
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Failed to load conflict details
            </AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={resolveMutation.isPending || autoResolveMutation.isPending}
          >
            Cancel
          </Button>
          {analysis?.autoResolvable && (
            <Button
              variant="secondary"
              onClick={() => autoResolveMutation.mutate()}
              disabled={resolveMutation.isPending || autoResolveMutation.isPending}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {autoResolveMutation.isPending ? "Resolving..." : "Quick Resolve"}
            </Button>
          )}
          <Button
            onClick={handleResolve}
            disabled={!resolutionStrategy || resolveMutation.isPending || autoResolveMutation.isPending}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            {resolveMutation.isPending ? "Resolving..." : "Resolve Conflict"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}