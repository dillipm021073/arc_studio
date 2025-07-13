import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  AlertTriangle, 
  X, 
  FileCode, 
  Network, 
  Calendar,
  Link,
  Briefcase,
  ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CrossCRImpact } from "@/types/impact-analysis";

interface CrossCRImpactAnalysisProps {
  analysis?: CrossCRImpact | null;
  loading?: boolean;
  onClose?: () => void;
  onViewApplication?: (id: number) => void;
  onViewInterface?: (id: number) => void;
  onViewBusinessProcess?: (id: number) => void;
}

export function CrossCRImpactAnalysis({
  analysis,
  loading,
  onClose,
  onViewApplication,
  onViewInterface,
  onViewBusinessProcess
}: CrossCRImpactAnalysisProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-48">
          <div className="text-muted-foreground">Loading cross-CR analysis...</div>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return null;
  }

  const getRiskLevelBadge = (level: string) => {
    const colors = {
      low: "bg-green-500/15 text-green-700 border-green-500/20",
      medium: "bg-yellow-500/15 text-yellow-700 border-yellow-500/20",
      high: "bg-orange-500/15 text-orange-700 border-orange-500/20",
      critical: "bg-red-500/15 text-red-700 border-red-500/20"
    };

    return (
      <Badge 
        variant="outline" 
        className={cn("font-medium", colors[level as keyof typeof colors] || "")}
      >
        {level.toUpperCase()}
      </Badge>
    );
  };

  const getConflictTypeLabel = (type?: string) => {
    const labels: Record<string, string> = {
      modification: "Modified by Multiple CRs",
      deletion: "Deletion Conflict",
      status_change: "Status Change Conflict",
      version_change: "Version Conflict",
      sequence_change: "Sequence Change"
    };
    return labels[type || ""] || type || "Unknown";
  };

  return (
    <Card className="w-full">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-semibold">Cross-CR Impact Analysis</CardTitle>
            <CardDescription>
              Common artifacts affected by multiple change requests
            </CardDescription>
          </div>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Overall Risk Assessment */}
        <div className="p-6 border-b bg-muted/50">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <h3 className="text-sm font-medium mb-2">Overall Risk Assessment</h3>
              <div className="flex items-center gap-3">
                {getRiskLevelBadge(analysis.overallRiskAssessment.level)}
                <span className="text-sm text-muted-foreground">
                  {analysis.overallRiskAssessment.conflicts.length} conflicts detected
                </span>
              </div>
            </div>
          </div>

          {analysis.overallRiskAssessment.conflicts.length > 0 && (
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Conflicts Detected</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  {analysis.overallRiskAssessment.conflicts.map((conflict, idx) => (
                    <li key={idx} className="text-sm">{conflict}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {analysis.overallRiskAssessment.recommendations.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Recommendations</h4>
              <ul className="space-y-2">
                {analysis.overallRiskAssessment.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span className="text-sm text-muted-foreground">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Timeline Conflicts */}
        {analysis.timeline.some(t => t.conflicts.length > 0) && (
          <div className="p-6 border-b">
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Timeline Conflicts
            </h3>
            <div className="space-y-3">
              {analysis.timeline
                .filter(t => t.conflicts.length > 0)
                .map((timeline) => (
                  <div key={timeline.crNumber} className="flex items-start gap-3">
                    <Badge variant="outline">{timeline.crNumber}</Badge>
                    <div className="flex-1">
                      <div className="text-sm text-muted-foreground">
                        Target: {timeline.targetDate ? new Date(timeline.targetDate).toLocaleDateString() : 'Not set'}
                      </div>
                      <div className="mt-1">
                        {timeline.conflicts.map((conflict, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs mr-2">
                            {conflict}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Common Artifacts Tabs */}
        <Tabs defaultValue="applications" className="w-full">
          <TabsList className="w-full justify-start rounded-none border-b h-auto p-0">
            <TabsTrigger 
              value="applications" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
            >
              Applications ({analysis.commonApplications.length})
            </TabsTrigger>
            <TabsTrigger 
              value="interfaces"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
            >
              Interfaces ({analysis.commonInterfaces.length})
            </TabsTrigger>
            <TabsTrigger 
              value="processes"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
            >
              Business Processes ({analysis.commonBusinessProcesses.length})
            </TabsTrigger>
          </TabsList>

          {/* Common Applications */}
          <TabsContent value="applications" className="mt-0">
            <ScrollArea className="h-[400px]">
              <div className="p-6 space-y-4">
                {analysis.commonApplications.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No common applications found
                  </div>
                ) : (
                  analysis.commonApplications.map((item) => (
                    <Card key={item.application.id} className="border-l-4" style={{
                      borderLeftColor: item.riskLevel === 'critical' ? '#ef4444' :
                                      item.riskLevel === 'high' ? '#f97316' :
                                      item.riskLevel === 'medium' ? '#eab308' : '#22c55e'
                    }}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <FileCode className="h-4 w-4 text-muted-foreground" />
                              <h4 className="font-medium">
                                {item.application.name}
                              </h4>
                              {getRiskLevelBadge(item.riskLevel)}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {item.application.description}
                            </p>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-muted-foreground">Affected by:</span>
                              {item.affectedByCRs.map(cr => (
                                <Badge key={cr} variant="outline" className="text-xs">
                                  {cr}
                                </Badge>
                              ))}
                            </div>
                            {item.conflictType && (
                              <div className="mt-2">
                                <Badge variant="destructive" className="text-xs">
                                  {getConflictTypeLabel(item.conflictType)}
                                </Badge>
                              </div>
                            )}
                          </div>
                          {onViewApplication && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onViewApplication(item.application.id)}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Common Interfaces */}
          <TabsContent value="interfaces" className="mt-0">
            <ScrollArea className="h-[400px]">
              <div className="p-6 space-y-4">
                {analysis.commonInterfaces.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No common interfaces found
                  </div>
                ) : (
                  analysis.commonInterfaces.map((item) => (
                    <Card key={item.interface.id} className="border-l-4" style={{
                      borderLeftColor: item.riskLevel === 'critical' ? '#ef4444' :
                                      item.riskLevel === 'high' ? '#f97316' :
                                      item.riskLevel === 'medium' ? '#eab308' : '#22c55e'
                    }}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Network className="h-4 w-4 text-muted-foreground" />
                              <h4 className="font-medium">
                                {item.interface.imlNumber}
                              </h4>
                              {getRiskLevelBadge(item.riskLevel)}
                            </div>
                            <div className="text-sm text-muted-foreground mb-2">
                              <div className="flex items-center gap-2">
                                <Link className="h-3 w-3" />
                                <span>{item.interface.providerApplicationName}</span>
                                <span>→</span>
                                <span>{item.interface.consumerApplicationName}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-muted-foreground">Affected by:</span>
                              {item.affectedByCRs.map(cr => (
                                <Badge key={cr} variant="outline" className="text-xs">
                                  {cr}
                                </Badge>
                              ))}
                            </div>
                            {item.conflictType && (
                              <div className="mt-2">
                                <Badge variant="destructive" className="text-xs">
                                  {getConflictTypeLabel(item.conflictType)}
                                </Badge>
                              </div>
                            )}
                          </div>
                          {onViewInterface && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onViewInterface(item.interface.id)}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Common Business Processes */}
          <TabsContent value="processes" className="mt-0">
            <ScrollArea className="h-[400px]">
              <div className="p-6 space-y-4">
                {analysis.commonBusinessProcesses.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No common business processes found
                  </div>
                ) : (
                  analysis.commonBusinessProcesses.map((item) => (
                    <Card key={item.businessProcess.id} className="border-l-4" style={{
                      borderLeftColor: item.riskLevel === 'critical' ? '#ef4444' :
                                      item.riskLevel === 'high' ? '#f97316' :
                                      item.riskLevel === 'medium' ? '#eab308' : '#22c55e'
                    }}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Briefcase className="h-4 w-4 text-muted-foreground" />
                              <h4 className="font-medium">
                                {item.businessProcess.businessProcess}
                              </h4>
                              {getRiskLevelBadge(item.riskLevel)}
                            </div>
                            <div className="text-sm text-muted-foreground mb-2">
                              <div>LOB: {item.businessProcess.lob}</div>
                              <div>Product: {item.businessProcess.product}</div>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-muted-foreground">Affected by:</span>
                              {item.affectedByCRs.map(cr => (
                                <Badge key={cr} variant="outline" className="text-xs">
                                  {cr}
                                </Badge>
                              ))}
                            </div>
                            {item.conflictType && (
                              <div className="mt-2">
                                <Badge variant="destructive" className="text-xs">
                                  {getConflictTypeLabel(item.conflictType)}
                                </Badge>
                              </div>
                            )}
                          </div>
                          {onViewBusinessProcess && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onViewBusinessProcess(item.businessProcess.id)}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}