import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChevronDown,
  AlertTriangle,
  Info,
  CheckCircle,
  Package,
  Cable,
  Building,
  BarChart3,
  Loader2,
  Eye,
  FileEdit,
  Box,
  GitBranch
} from "lucide-react";
import ArtifactCardView from "@/components/artifacts/artifact-card-view";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ModifiedArtifact {
  artifactType: 'application' | 'interface' | 'business_process' | 'technical_process' | 'internal_process';
  artifactId: number;
  versionNumber: number;
  changeType: string;
  changeReason: string;
  artifactData: any;
}

interface Application {
  id: number;
  name: string;
  description: string;
  os: string;
  deployment: string;
  uptime: number;
  status: string;
  providesExtInterface: boolean;
  consumesExtInterfaces: boolean;
}

interface Interface {
  id: number;
  imlNumber: string;
  interfaceType: string;
  providerApplicationName: string;
  consumerApplicationName: string;
  businessProcessName: string;
  status: string;
  version: string;
}

interface BusinessProcess {
  id: number;
  businessProcess: string;
  lob: string;
  product: string;
  domainOwner: string;
  itOwner: string;
}

interface ImpactAnalysis {
  modifiedArtifacts: ModifiedArtifact[];
  impactedApplications: Application[];
  impactedInterfaces: Interface[];
  relatedBusinessProcesses: BusinessProcess[];
  riskLevel: 'low' | 'medium' | 'high';
  summary: {
    applicationsCount: number;
    interfacesCount: number;
    businessProcessesCount: number;
    totalImpactedArtifacts: number;
  };
}

interface InitiativeImpactAnalysisProps {
  initiativeId: string;
}

export function InitiativeImpactAnalysis({ initiativeId }: InitiativeImpactAnalysisProps) {
  const [analysis, setAnalysis] = useState<ImpactAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewingArtifact, setViewingArtifact] = useState<any | null>(null);
  const [viewingArtifactType, setViewingArtifactType] = useState<string>('');
  
  console.log('InitiativeImpactAnalysis rendering with initiativeId:', initiativeId);

  useEffect(() => {
    fetchImpactAnalysis();
  }, [initiativeId]);

  const fetchImpactAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching impact analysis for initiative:', initiativeId);
      const response = await fetch(`/api/initiatives/${initiativeId}/impact-analysis`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch impact analysis:', response.status, errorText);
        throw new Error(`Failed to fetch impact analysis: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Impact analysis data received:', data);
      
      // Ensure data has the expected structure
      const analysisData: ImpactAnalysis = {
        modifiedArtifacts: data.modifiedArtifacts || [],
        impactedApplications: data.impactedApplications || [],
        impactedInterfaces: data.impactedInterfaces || [],
        relatedBusinessProcesses: data.relatedBusinessProcesses || [],
        riskLevel: data.riskLevel || 'low',
        summary: {
          applicationsCount: data.summary?.applicationsCount || 0,
          interfacesCount: data.summary?.interfacesCount || 0,
          businessProcessesCount: data.summary?.businessProcessesCount || 0,
          totalImpactedArtifacts: data.summary?.totalImpactedArtifacts || 0
        }
      };
      
      setAnalysis(analysisData);
    } catch (err) {
      console.error('Error in fetchImpactAnalysis:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getRiskLevelVariant = (riskLevel: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (riskLevel) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'default';
      default: return 'outline';
    }
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'medium': return <Info className="h-4 w-4" />;
      case 'low': return <CheckCircle className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getArtifactTypeIcon = (type: string) => {
    switch (type) {
      case 'application': return <Package className="h-4 w-4" />;
      case 'interface': return <Cable className="h-4 w-4" />;
      case 'business_process': return <Building className="h-4 w-4" />;
      default: return <BarChart3 className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span className="text-sm text-muted-foreground">
          Analyzing initiative impact...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between w-full">
          {error}
          <Button variant="outline" size="sm" onClick={fetchImpactAnalysis}>
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!analysis) return null;

  try {
    return (
      <div className="space-y-6">
      {/* Risk Level Summary */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="flex items-center gap-4">
              <Badge 
                variant={getRiskLevelVariant(analysis.riskLevel)}
                className="flex items-center gap-2 px-3 py-1"
              >
                {getRiskIcon(analysis.riskLevel)}
                {analysis.riskLevel.toUpperCase()} RISK
              </Badge>
              <h3 className="text-lg font-semibold">Impact Analysis</h3>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <Card className="text-center p-3">
                <div className="text-2xl font-bold text-blue-600">
                  {analysis.summary.applicationsCount}
                </div>
                <div className="text-xs text-muted-foreground">Applications</div>
              </Card>
              <Card className="text-center p-3">
                <div className="text-2xl font-bold text-purple-600">
                  {analysis.summary.interfacesCount}
                </div>
                <div className="text-xs text-muted-foreground">Interfaces</div>
              </Card>
              <Card className="text-center p-3">
                <div className="text-2xl font-bold text-green-600">
                  {analysis.summary.businessProcessesCount}
                </div>
                <div className="text-xs text-muted-foreground">Processes</div>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabbed Interface for Artifacts */}
      {(analysis.modifiedArtifacts?.length > 0 || 
        analysis.impactedApplications?.length > 0 || 
        analysis.impactedInterfaces?.length > 0 || 
        analysis.relatedBusinessProcesses?.length > 0) && (
        <Card>
          <CardContent className="p-0">
            <Tabs defaultValue={
              analysis.modifiedArtifacts?.length > 0 ? "modified" :
              analysis.impactedApplications?.length > 0 ? "applications" :
              analysis.impactedInterfaces?.length > 0 ? "interfaces" : "processes"
            } className="w-full">
              <TabsList className="w-full justify-start rounded-none border-b">
                {analysis.modifiedArtifacts?.length > 0 && (
                  <TabsTrigger value="modified" className="data-[state=active]:bg-background">
                    <FileEdit className="h-4 w-4 mr-2" />
                    Modified ({analysis.modifiedArtifacts.length})
                  </TabsTrigger>
                )}
                {analysis.impactedApplications?.length > 0 && (
                  <TabsTrigger value="applications" className="data-[state=active]:bg-background">
                    <Box className="h-4 w-4 mr-2" />
                    Applications ({analysis.impactedApplications.length})
                  </TabsTrigger>
                )}
                {analysis.impactedInterfaces?.length > 0 && (
                  <TabsTrigger value="interfaces" className="data-[state=active]:bg-background">
                    <Cable className="h-4 w-4 mr-2" />
                    Interfaces ({analysis.impactedInterfaces.length})
                  </TabsTrigger>
                )}
                {analysis.relatedBusinessProcesses?.length > 0 && (
                  <TabsTrigger value="processes" className="data-[state=active]:bg-background">
                    <GitBranch className="h-4 w-4 mr-2" />
                    Processes ({analysis.relatedBusinessProcesses.length})
                  </TabsTrigger>
                )}
              </TabsList>

              {/* Modified Artifacts Tab */}
              {analysis.modifiedArtifacts?.length > 0 && (
                <TabsContent value="modified" className="p-0 m-0">
                  <div className="h-[500px] overflow-y-auto">
                  <div className="p-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                      {analysis.modifiedArtifacts.map((artifact, index) => {
                        // Extract the actual name from artifactData
                        const getArtifactName = () => {
                          if (artifact.artifactType === 'application' && artifact.artifactData?.name) {
                            return artifact.artifactData.name;
                          } else if (artifact.artifactType === 'interface' && artifact.artifactData?.imlNumber) {
                            return artifact.artifactData.imlNumber;
                          } else if (artifact.artifactType === 'business_process' && artifact.artifactData?.businessProcess) {
                            return artifact.artifactData.businessProcess;
                          } else if (artifact.artifactType === 'technical_process' && artifact.artifactData?.name) {
                            return artifact.artifactData.name;
                          } else if (artifact.artifactType === 'internal_process' && artifact.artifactData?.name) {
                            return artifact.artifactData.name;
                          }
                          return `#${artifact.artifactId}`;
                        };

                        const artifactName = getArtifactName();

                        return (
                          <div
                            key={index}
                            className="group relative rounded-lg p-3 cursor-pointer transition-all hover:shadow-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-600"
                            onDoubleClick={() => {
                              const artifactData = {
                                id: artifact.artifactId,
                                name: artifactName,
                                description: `Version: ${artifact.versionNumber} | Change: ${artifact.changeType}${artifact.changeReason ? ` | Reason: ${artifact.changeReason}` : ''}`,
                                status: 'modified',
                                artifactType: artifact.artifactType,
                                versionNumber: artifact.versionNumber,
                                changeType: artifact.changeType,
                                changeReason: artifact.changeReason,
                                ...artifact.artifactData
                              };
                              setViewingArtifact(artifactData);
                              setViewingArtifactType('modified');
                            }}
                            title={artifactName}
                          >
                            {/* Header with icon */}
                            <div className="flex items-center gap-1 mb-2">
                              <div className="p-1 rounded flex-shrink-0">
                                {getArtifactTypeIcon(artifact.artifactType)}
                              </div>
                              <div className="text-xs font-medium text-white truncate">
                                {artifact.artifactType}
                              </div>
                            </div>
                            
                            {/* Name */}
                            <div className="text-xs font-semibold text-blue-300 break-words mb-1" style={{ 
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden'
                            }}>
                              {artifactName}
                            </div>
                            
                            {/* Content */}
                            <div className="space-y-1">
                              <div className="text-xs text-gray-300">
                                v{artifact.versionNumber}
                              </div>
                              <div className="text-xs text-blue-400 capitalize">
                                {artifact.changeType}
                              </div>
                              {artifact.changeReason && (
                                <div className="text-xs text-gray-400 truncate" title={artifact.changeReason}>
                                  {artifact.changeReason}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                </TabsContent>
              )}

              {/* Impacted Applications Tab */}
              {analysis.impactedApplications?.length > 0 && (
                <TabsContent value="applications" className="p-0 m-0">
                  <div className="h-[500px] overflow-y-auto p-4">
                    <ArtifactCardView
                      artifacts={analysis.impactedApplications}
                      artifactType="application"
                      onView={(app) => {
                        setViewingArtifact(app);
                        setViewingArtifactType('application');
                      }}
                      isProductionView={true}
                    />
                  </div>
                </TabsContent>
              )}

              {/* Impacted Interfaces Tab */}
              {analysis.impactedInterfaces?.length > 0 && (
                <TabsContent value="interfaces" className="p-0 m-0">
                  <div className="h-[500px] overflow-y-auto p-4">
                    <ArtifactCardView
                      artifacts={analysis.impactedInterfaces}
                      artifactType="interface"
                      onView={(iface) => {
                        setViewingArtifact(iface);
                        setViewingArtifactType('interface');
                      }}
                      isProductionView={true}
                    />
                  </div>
                </TabsContent>
              )}

              {/* Related Business Processes Tab */}
              {analysis.relatedBusinessProcesses?.length > 0 && (
                <TabsContent value="processes" className="p-0 m-0">
                  <div className="h-[500px] overflow-y-auto p-4">
                    <ArtifactCardView
                      artifacts={analysis.relatedBusinessProcesses}
                      artifactType="businessProcess"
                      onView={(bp) => {
                        setViewingArtifact(bp);
                        setViewingArtifactType('businessProcess');
                      }}
                      isProductionView={true}
                    />
                  </div>
                </TabsContent>
              )}
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* No Impact Message */}
      {analysis.summary.totalImpactedArtifacts === 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            No artifacts have been modified in this initiative yet, so there is no impact to analyze.
          </AlertDescription>
        </Alert>
      )}

      {/* Artifact Details Dialog */}
      <Dialog open={!!viewingArtifact} onOpenChange={(open) => !open && setViewingArtifact(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {viewingArtifactType === 'application' && 'Application Details'}
              {viewingArtifactType === 'interface' && 'Interface Details'}
              {viewingArtifactType === 'businessProcess' && 'Business Process Details'}
              {viewingArtifactType === 'modified' && 'Modified Artifact Details'}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {viewingArtifact && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">
                    {viewingArtifactType === 'application' && viewingArtifact.name}
                    {viewingArtifactType === 'interface' && viewingArtifact.imlNumber}
                    {viewingArtifactType === 'businessProcess' && viewingArtifact.businessProcess}
                    {viewingArtifactType === 'modified' && viewingArtifact.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {viewingArtifact.description || 'No description available'}
                  </p>
                </div>
                {/* Add more details based on artifact type */}
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
                  {JSON.stringify(viewingArtifact, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      </div>
    );
  } catch (renderError) {
    console.error('Error rendering InitiativeImpactAnalysis:', renderError);
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          An error occurred while rendering the impact analysis. Please refresh the page.
        </AlertDescription>
      </Alert>
    );
  }
}