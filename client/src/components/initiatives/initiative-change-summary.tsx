import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  FileEdit, 
  Plus, 
  Trash2, 
  ArrowRight,
  Package,
  GitBranch,
  Clock,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";

interface InitiativeChangeSummaryProps {
  initiativeId: string;
}

export function InitiativeChangeSummary({ initiativeId }: InitiativeChangeSummaryProps) {
  const { data: changeDetails, isLoading } = useQuery({
    queryKey: ['initiative-changes', initiativeId],
    queryFn: async () => {
      const response = await api.get(`/api/initiatives/${initiativeId}/changes`);
      return response.data;
    }
  });

  if (isLoading) {
    return <div className="text-center p-4">Loading change summary...</div>;
  }

  if (!changeDetails || !changeDetails.hasChanges) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center p-4 text-muted-foreground">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p>No changes found in this initiative</p>
            <p className="text-sm mt-2">
              To make changes, check out artifacts and modify them within this initiative.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getChangeIcon = (changeType: string) => {
    switch (changeType) {
      case 'created': return <Plus className="h-4 w-4 text-green-600" />;
      case 'modified': return <FileEdit className="h-4 w-4 text-blue-600" />;
      case 'deleted': return <Trash2 className="h-4 w-4 text-red-600" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getChangeTypeColor = (changeType: string) => {
    switch (changeType) {
      case 'created': return 'bg-green-100 text-green-800';
      case 'modified': return 'bg-blue-100 text-blue-800';
      case 'deleted': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatFieldChange = (field: string, oldValue: any, newValue: any) => {
    if (oldValue === null || oldValue === undefined) oldValue = 'Not set';
    if (newValue === null || newValue === undefined) newValue = 'Not set';
    
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="font-medium capitalize">{field.replace(/_/g, ' ')}:</span>
        <span className="text-muted-foreground">{String(oldValue)}</span>
        <ArrowRight className="h-3 w-3" />
        <span className="font-medium">{String(newValue)}</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Summary Statistics */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Package className="h-4 w-4" />
              Total Changes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{changeDetails.totalChanges || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Plus className="h-4 w-4 text-green-600" />
              Created
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{changeDetails.created || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileEdit className="h-4 w-4 text-blue-600" />
              Modified
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{changeDetails.modified || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-red-600" />
              Deleted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{changeDetails.deleted || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Changes by Artifact Type */}
      {changeDetails.artifactChanges?.map((artifactGroup: any) => (
        <Card key={artifactGroup.artifactType}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{artifactGroup.artifactType}</span>
              <Badge variant="secondary">{artifactGroup.changes.length} changes</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto pr-2 space-y-3">
              {artifactGroup.changes.map((change: any, index: number) => (
                <Card key={index} className="bg-gray-50 dark:bg-gray-800 border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      {getChangeIcon(change.changeType)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-base">{change.artifactName}</span>
                          <Badge className={getChangeTypeColor(change.changeType)}>
                            {change.changeType}
                          </Badge>
                          {change.version && (
                            <Badge variant="outline">v{change.version}</Badge>
                          )}
                        </div>
                        
                        {/* Change Description */}
                        {change.description && (
                          <p className="text-sm text-muted-foreground mt-1">{change.description}</p>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0 space-y-3">
                    {/* Field Changes */}
                    {change.fieldChanges && change.fieldChanges.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-sm font-medium">Field Changes:</span>
                        <div className="space-y-1 pl-4 border-l-2 border-gray-200 dark:border-gray-600">
                          {change.fieldChanges.map((fieldChange: any, idx: number) => (
                            <div key={idx}>
                              {formatFieldChange(fieldChange.field, fieldChange.oldValue, fieldChange.newValue)}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Impact Information */}
                    {change.impacts && change.impacts.length > 0 && (
                      <div>
                        <span className="text-sm font-medium">Impacts:</span>
                        <ul className="mt-1 text-sm text-muted-foreground list-disc list-inside">
                          {change.impacts.map((impact: string, idx: number) => (
                            <li key={idx}>{impact}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Change Metadata */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t border-gray-200 dark:border-gray-600">
                      {change.changedBy && (
                        <span>Changed by: <span className="font-medium">{change.changedBy}</span></span>
                      )}
                      {change.changedAt && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(change.changedAt), 'MMM d, yyyy HH:mm')}
                        </span>
                      )}
                      {change.changeRequestId && (
                        <span className="font-medium">CR #{change.changeRequestId}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Change Timeline */}
      {changeDetails.timeline && changeDetails.timeline.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Change Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {changeDetails.timeline.map((event: any, index: number) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="mt-1">
                    {event.status === 'completed' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <Clock className="h-4 w-4 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{event.description}</span>
                      <Badge variant="outline" className="text-xs">
                        {format(new Date(event.timestamp), 'MMM d, yyyy HH:mm')}
                      </Badge>
                    </div>
                    {event.details && (
                      <p className="text-sm text-muted-foreground mt-1">{event.details}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Testing Requirements Summary */}
      {changeDetails.testingRequirements && (
        <Card>
          <CardHeader>
            <CardTitle>Testing Requirements Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <h4 className="font-medium mb-2">Affected Systems</h4>
                <div className="flex flex-wrap gap-2">
                  {changeDetails.testingRequirements.affectedSystems?.map((system: string) => (
                    <Badge key={system} variant="secondary">{system}</Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Required Test Types</h4>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {changeDetails.testingRequirements.testTypes?.map((testType: string) => (
                    <li key={testType}>{testType}</li>
                  ))}
                </ul>
              </div>

              {changeDetails.testingRequirements.criticalPaths && (
                <div>
                  <h4 className="font-medium mb-2">Critical Test Paths</h4>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {changeDetails.testingRequirements.criticalPaths.map((path: string, idx: number) => (
                      <li key={idx}>{path}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}