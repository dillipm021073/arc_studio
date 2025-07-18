import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  AlertTriangle,
  Info,
  CheckCircle,
  Package,
  Cable,
  Building,
  BarChart3,
  Loader2
} from "lucide-react";

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

      {/* Modified Artifacts */}
      {analysis.modifiedArtifacts && analysis.modifiedArtifacts.length > 0 && (
        <Collapsible defaultOpen>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50">
                <CardTitle className="flex items-center justify-between">
                  <span>Modified Artifacts ({analysis.modifiedArtifacts.length})</span>
                  <ChevronDown className="h-4 w-4" />
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4">
                {analysis.modifiedArtifacts && analysis.modifiedArtifacts.map((artifact, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className="mt-0.5">
                      {getArtifactTypeIcon(artifact.artifactType)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="font-medium">
                        {artifact.artifactType} #{artifact.artifactId}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Version: {artifact.versionNumber} | Change: {artifact.changeType}
                      </div>
                      {artifact.changeReason && (
                        <div className="text-sm text-muted-foreground">
                          Reason: {artifact.changeReason}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Impacted Applications */}
      {analysis.impactedApplications && analysis.impactedApplications.length > 0 && (
        <Collapsible defaultOpen>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50">
                <CardTitle className="flex items-center justify-between">
                  <span>Impacted Applications ({analysis.impactedApplications.length})</span>
                  <ChevronDown className="h-4 w-4" />
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analysis.impactedApplications && analysis.impactedApplications.map((app) => (
                    <Card key={app.id} className="border">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold">{app.name}</h4>
                          <Badge variant={app.status === 'active' ? 'default' : 'secondary'}>
                            {app.status}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-3">
                          {app.description}
                        </p>
                        
                        <Separator className="my-3" />
                        
                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge variant="outline">{app.os}</Badge>
                          <Badge variant="outline">{app.deployment}</Badge>
                          {app.uptime && (
                            <Badge variant="outline">{app.uptime}% uptime</Badge>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          {app.providesExtInterface && (
                            <Badge variant="secondary">Provides Interfaces</Badge>
                          )}
                          {app.consumesExtInterfaces && (
                            <Badge variant="secondary">Consumes Interfaces</Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Impacted Interfaces */}
      {analysis.impactedInterfaces && analysis.impactedInterfaces.length > 0 && (
        <Collapsible defaultOpen>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50">
                <CardTitle className="flex items-center justify-between">
                  <span>Impacted Interfaces (IMLs) ({analysis.impactedInterfaces.length})</span>
                  <ChevronDown className="h-4 w-4" />
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4">
                {analysis.impactedInterfaces && analysis.impactedInterfaces.map((iface) => (
                  <div key={iface.id} className="flex items-start gap-3 p-4 border rounded-lg">
                    <Cable className="h-5 w-5 mt-0.5 text-purple-600" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold">{iface.imlNumber}</span>
                        <Badge variant={iface.status === 'active' ? 'default' : 'secondary'}>
                          {iface.status}
                        </Badge>
                        <Badge variant="outline">{iface.interfaceType}</Badge>
                      </div>
                      
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>
                          Provider: {iface.providerApplicationName} → Consumer: {iface.consumerApplicationName}
                        </div>
                        <div>
                          Business Process: {iface.businessProcessName} | Version: {iface.version}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Related Business Processes */}
      {analysis.relatedBusinessProcesses && analysis.relatedBusinessProcesses.length > 0 && (
        <Collapsible defaultOpen>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50">
                <CardTitle className="flex items-center justify-between">
                  <span>Related Business Processes ({analysis.relatedBusinessProcesses.length})</span>
                  <ChevronDown className="h-4 w-4" />
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analysis.relatedBusinessProcesses && analysis.relatedBusinessProcesses.map((bp) => (
                    <Card key={bp.id} className="border">
                      <CardContent className="p-4">
                        <h4 className="font-semibold mb-3">{bp.businessProcess}</h4>
                        
                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge variant="outline">{bp.lob}</Badge>
                          <Badge variant="outline">{bp.product}</Badge>
                        </div>
                        
                        <Separator className="my-3" />
                        
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div>Domain Owner: {bp.domainOwner}</div>
                          <div>IT Owner: {bp.itOwner}</div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
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