import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertTriangle,
  GitMerge,
  CheckCircle,
  XCircle,
  Package,
  FileText,
  Sparkles,
  Eye
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ConflictResolutionDialog } from "./conflict-resolution-dialog";
import { useInitiative } from "../initiatives/initiative-context";

interface Conflict {
  id: number;
  initiativeId: string;
  artifactType: string;
  artifactId: number;
  baselineVersionId: number;
  initiativeVersionId: number;
  conflictingFields: string[];
  conflictDetails?: {
    riskScore: number;
    suggestedStrategy: string;
    conflicts: Array<{
      severity: string;
    }>;
  };
  resolutionStatus: string;
  resolutionStrategy?: string;
  resolvedBy?: number;
  resolvedAt?: string;
  createdAt: string;
}

interface ConflictListProps {
  initiativeId?: string;
  showResolved?: boolean;
}

export function ConflictList({ 
  initiativeId,
  showResolved = false 
}: ConflictListProps) {
  const [selectedConflict, setSelectedConflict] = useState<Conflict | null>(null);
  const { currentInitiative } = useInitiative();
  
  const effectiveInitiativeId = initiativeId || currentInitiative?.initiativeId;

  const { data: conflicts, isLoading, refetch } = useQuery({
    queryKey: ['conflicts', effectiveInitiativeId, showResolved],
    queryFn: async () => {
      if (!effectiveInitiativeId) return [];
      
      const response = await api.get(
        `/api/initiatives/${effectiveInitiativeId}/conflicts`
      );
      
      return response.data.filter((c: Conflict) => 
        showResolved ? c.resolutionStatus === 'resolved' : c.resolutionStatus === 'pending'
      );
    },
    enabled: !!effectiveInitiativeId
  });

  const getArtifactIcon = (type: string) => {
    switch (type) {
      case 'application': return <Package className="h-4 w-4" />;
      case 'interface': return <FileText className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const getRiskColor = (riskScore?: number) => {
    if (!riskScore) return '';
    if (riskScore > 50) return 'text-red-600 bg-red-50';
    if (riskScore > 20) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const getSeverityCounts = (conflicts?: Array<{ severity: string }>) => {
    if (!conflicts) return { critical: 0, high: 0, medium: 0, low: 0 };
    
    return conflicts.reduce((acc, c) => {
      acc[c.severity as keyof typeof acc] = (acc[c.severity as keyof typeof acc] || 0) + 1;
      return acc;
    }, { critical: 0, high: 0, medium: 0, low: 0 });
  };

  if (!effectiveInitiativeId) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Select an initiative to view conflicts
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const pendingConflicts = conflicts?.filter((c: Conflict) => c.resolutionStatus === 'pending') || [];
  const hasAutoResolvable = pendingConflicts.some(
    (c: Conflict) => c.conflictDetails?.suggestedStrategy === 'auto'
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          <h3 className="text-lg font-semibold">
            {showResolved ? 'Resolved Conflicts' : 'Active Conflicts'}
          </h3>
          <Badge variant="secondary">
            {conflicts?.length || 0} {showResolved ? 'resolved' : 'pending'}
          </Badge>
        </div>

        {!showResolved && hasAutoResolvable && (
          <Button variant="secondary" size="sm">
            <Sparkles className="h-4 w-4 mr-2" />
            Auto-resolve All
          </Button>
        )}
      </div>

      {conflicts?.length === 0 ? (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            {showResolved 
              ? 'No resolved conflicts in this initiative'
              : 'No conflicts detected - all changes are compatible with baseline'
            }
          </AlertDescription>
        </Alert>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Artifact</TableHead>
                <TableHead>Conflicting Fields</TableHead>
                <TableHead>Risk</TableHead>
                <TableHead>Severity Breakdown</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {conflicts.map((conflict: Conflict) => {
                const severities = getSeverityCounts(conflict.conflictDetails?.conflicts);
                
                return (
                  <TableRow key={conflict.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getArtifactIcon(conflict.artifactType)}
                        <div>
                          <div className="font-medium">
                            {conflict.artifactType} #{conflict.artifactId}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            v{conflict.baselineVersionId} → v{conflict.initiativeVersionId}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {conflict.conflictingFields.slice(0, 3).map((field, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {field}
                          </Badge>
                        ))}
                        {conflict.conflictingFields.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{conflict.conflictingFields.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      {conflict.conflictDetails?.riskScore !== undefined && (
                        <Badge 
                          variant="secondary"
                          className={cn("text-xs", getRiskColor(conflict.conflictDetails.riskScore))}
                        >
                          Risk: {conflict.conflictDetails.riskScore}
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2 text-xs">
                        {severities.critical > 0 && (
                          <span className="text-red-600">
                            {severities.critical} critical
                          </span>
                        )}
                        {severities.high > 0 && (
                          <span className="text-orange-600">
                            {severities.high} high
                          </span>
                        )}
                        {severities.medium > 0 && (
                          <span className="text-yellow-600">
                            {severities.medium} medium
                          </span>
                        )}
                        {severities.low > 0 && (
                          <span className="text-green-600">
                            {severities.low} low
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      {conflict.resolutionStatus === 'resolved' ? (
                        <div className="space-y-1">
                          <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Resolved
                          </Badge>
                          {conflict.resolutionStrategy && (
                            <div className="text-xs text-muted-foreground">
                              via {conflict.resolutionStrategy.replace('_', ' ')}
                            </div>
                          )}
                        </div>
                      ) : (
                        <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      {conflict.resolutionStatus === 'pending' ? (
                        <div className="flex items-center justify-end gap-2">
                          {conflict.conflictDetails?.suggestedStrategy === 'auto' && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                // Handle auto-resolve
                              }}
                            >
                              <Sparkles className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedConflict(conflict)}
                          >
                            <GitMerge className="h-3 w-3 mr-1" />
                            Resolve
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedConflict(conflict)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {selectedConflict && (
        <ConflictResolutionDialog
          open={!!selectedConflict}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedConflict(null);
              refetch();
            }
          }}
          conflictId={selectedConflict.id}
          initiativeId={selectedConflict.initiativeId}
        />
      )}
    </div>
  );
}