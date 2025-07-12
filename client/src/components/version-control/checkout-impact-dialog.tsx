import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChevronDown,
  AlertTriangle,
  Info,
  CheckCircle,
  Package,
  Cable,
  Building,
  Settings,
  Workflow,
  Loader2,
  Download,
  Eye
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CheckoutImpactAnalysis {
  primaryArtifact: {
    type: string;
    id: number;
    name: string;
  };
  requiredCheckouts: {
    applications: Array<{ id: number; name: string; reason: string; }>;
    interfaces: Array<{ id: number; imlNumber: string; reason: string; }>;
    businessProcesses: Array<{ id: number; businessProcess: string; reason: string; }>;
    internalActivities: Array<{ id: number; activityName: string; reason: string; }>;
    technicalProcesses: Array<{ id: number; name: string; reason: string; }>;
  };
  crossInitiativeImpacts: Array<{
    changeRequestId: number;
    title: string;
    status: string;
    initiativeId?: string;
    conflictType: string;
    artifactId: number;
    artifactName: string;
  }>;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  summary: {
    totalRequiredCheckouts: number;
    crossInitiativeConflicts: number;
    estimatedComplexity: string;
  };
}

interface CheckoutImpactDialogProps {
  artifactType: string;
  artifactId: number;
  artifactName: string;
  initiativeId: string;
  trigger?: React.ReactNode;
  onCheckoutComplete?: (results: any) => void;
}

export function CheckoutImpactDialog({
  artifactType,
  artifactId,
  artifactName,
  initiativeId,
  trigger,
  onCheckoutComplete
}: CheckoutImpactDialogProps) {
  const [analysis, setAnalysis] = useState<CheckoutImpactAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const fetchImpactAnalysis = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/version-control/analyze-checkout-impact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artifactType,
          artifactId,
          initiativeId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to analyze checkout impact');
      }

      const data = await response.json();
      setAnalysis(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to analyze checkout impact",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkCheckout = async () => {
    try {
      setCheckoutLoading(true);
      const response = await fetch('/api/version-control/bulk-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artifactType,
          artifactId,
          initiativeId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to perform bulk checkout');
      }

      const results = await response.json();
      
      toast({
        title: "Bulk Checkout Complete",
        description: results.message
      });

      if (onCheckoutComplete) {
        onCheckoutComplete(results);
      }

      setOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to perform bulk checkout",
        variant: "destructive"
      });
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleSingleCheckout = async () => {
    try {
      setCheckoutLoading(true);
      const response = await fetch('/api/version-control/checkout-with-impact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artifactType,
          artifactId,
          initiativeId,
          includeImpacts: false
        })
      });

      if (!response.ok) {
        throw new Error('Failed to checkout artifact');
      }

      const results = await response.json();
      
      toast({
        title: "Checkout Complete",
        description: results.message
      });

      if (onCheckoutComplete) {
        onCheckoutComplete(results);
      }

      setOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to checkout artifact",
        variant: "destructive"
      });
    } finally {
      setCheckoutLoading(false);
    }
  };

  const getRiskLevelVariant = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'default';
      default: return 'outline';
    }
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="h-4 w-4" />;
      case 'medium':
        return <Info className="h-4 w-4" />;
      case 'low':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getArtifactIcon = (type: string) => {
    switch (type) {
      case 'application': return <Package className="h-4 w-4" />;
      case 'interface': return <Cable className="h-4 w-4" />;
      case 'business_process': return <Building className="h-4 w-4" />;
      case 'internal_process': return <Settings className="h-4 w-4" />;
      case 'technical_process': return <Workflow className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" onClick={fetchImpactAnalysis}>
            <Eye className="h-4 w-4 mr-2" />
            Analyze Impact
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getArtifactIcon(artifactType)}
            Checkout Impact Analysis: {artifactName}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Analyzing impact...</span>
          </div>
        ) : analysis ? (
          <div className="space-y-6">
            {/* Risk Summary */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Badge 
                      variant={getRiskLevelVariant(analysis.riskLevel)}
                      className="flex items-center gap-2"
                    >
                      {getRiskIcon(analysis.riskLevel)}
                      {analysis.riskLevel.toUpperCase()} RISK
                    </Badge>
                    <div className="text-sm text-muted-foreground">
                      {analysis.summary.estimatedComplexity} complexity
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{analysis.summary.totalRequiredCheckouts}</div>
                    <div className="text-sm text-muted-foreground">Required checkouts</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cross-Initiative Conflicts */}
            {analysis.crossInitiativeImpacts.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Warning:</strong> {analysis.crossInitiativeImpacts.length} cross-initiative conflicts detected. 
                  These artifacts are already being modified in other initiatives or change requests.
                </AlertDescription>
              </Alert>
            )}

            {/* Required Checkouts */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Required Checkouts</h3>
              
              {/* Applications */}
              {analysis.requiredCheckouts.applications.length > 0 && (
                <Collapsible defaultOpen>
                  <Card>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-muted/50">
                        <CardTitle className="flex items-center justify-between text-base">
                          <span className="flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            Applications ({analysis.requiredCheckouts.applications.length})
                          </span>
                          <ChevronDown className="h-4 w-4" />
                        </CardTitle>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Application</TableHead>
                              <TableHead>Reason</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {analysis.requiredCheckouts.applications.map((app) => (
                              <TableRow key={app.id}>
                                <TableCell className="font-medium">{app.name}</TableCell>
                                <TableCell className="text-sm text-muted-foreground">{app.reason}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              )}

              {/* Interfaces */}
              {analysis.requiredCheckouts.interfaces.length > 0 && (
                <Collapsible defaultOpen>
                  <Card>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-muted/50">
                        <CardTitle className="flex items-center justify-between text-base">
                          <span className="flex items-center gap-2">
                            <Cable className="h-4 w-4" />
                            Interfaces ({analysis.requiredCheckouts.interfaces.length})
                          </span>
                          <ChevronDown className="h-4 w-4" />
                        </CardTitle>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>IML Number</TableHead>
                              <TableHead>Reason</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {analysis.requiredCheckouts.interfaces.map((iface) => (
                              <TableRow key={iface.id}>
                                <TableCell className="font-medium">{iface.imlNumber}</TableCell>
                                <TableCell className="text-sm text-muted-foreground">{iface.reason}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              )}

              {/* Business Processes */}
              {analysis.requiredCheckouts.businessProcesses.length > 0 && (
                <Collapsible>
                  <Card>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-muted/50">
                        <CardTitle className="flex items-center justify-between text-base">
                          <span className="flex items-center gap-2">
                            <Building className="h-4 w-4" />
                            Business Processes ({analysis.requiredCheckouts.businessProcesses.length})
                          </span>
                          <ChevronDown className="h-4 w-4" />
                        </CardTitle>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Process</TableHead>
                              <TableHead>Reason</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {analysis.requiredCheckouts.businessProcesses.map((bp) => (
                              <TableRow key={bp.id}>
                                <TableCell className="font-medium">{bp.businessProcess}</TableCell>
                                <TableCell className="text-sm text-muted-foreground">{bp.reason}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              )}

              {/* Internal Activities & Technical Processes */}
              {(analysis.requiredCheckouts.internalActivities.length > 0 || 
                analysis.requiredCheckouts.technicalProcesses.length > 0) && (
                <Collapsible>
                  <Card>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-muted/50">
                        <CardTitle className="flex items-center justify-between text-base">
                          <span className="flex items-center gap-2">
                            <Settings className="h-4 w-4" />
                            Internal Components ({analysis.requiredCheckouts.internalActivities.length + analysis.requiredCheckouts.technicalProcesses.length})
                          </span>
                          <ChevronDown className="h-4 w-4" />
                        </CardTitle>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="space-y-4">
                        {analysis.requiredCheckouts.internalActivities.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2">Internal Activities</h4>
                            <Table>
                              <TableBody>
                                {analysis.requiredCheckouts.internalActivities.map((ia) => (
                                  <TableRow key={ia.id}>
                                    <TableCell className="font-medium">{ia.activityName}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground">{ia.reason}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                        
                        {analysis.requiredCheckouts.technicalProcesses.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2">Technical Processes</h4>
                            <Table>
                              <TableBody>
                                {analysis.requiredCheckouts.technicalProcesses.map((tp) => (
                                  <TableRow key={tp.id}>
                                    <TableCell className="font-medium">{tp.name}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground">{tp.reason}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              )}
            </div>

            {/* Cross-Initiative Conflicts Detail */}
            {analysis.crossInitiativeImpacts.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-destructive">Cross-Initiative Conflicts</h3>
                <Card>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Change Request</TableHead>
                          <TableHead>Artifact</TableHead>
                          <TableHead>Initiative</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {analysis.crossInitiativeImpacts.map((conflict, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <div>
                                <div className="font-medium">CR-{conflict.changeRequestId}</div>
                                <div className="text-sm text-muted-foreground">{conflict.title}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{conflict.artifactName}</div>
                                <div className="text-sm text-muted-foreground">{conflict.conflictType}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {conflict.initiativeId || 'No Initiative'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">{conflict.status}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center p-8">
            <Button onClick={fetchImpactAnalysis}>
              <Eye className="h-4 w-4 mr-2" />
              Analyze Impact
            </Button>
          </div>
        )}

        <DialogFooter className="flex justify-between">
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            {analysis && (
              <Button 
                variant="outline" 
                onClick={handleSingleCheckout}
                disabled={checkoutLoading}
              >
                {checkoutLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Checkout Single
              </Button>
            )}
          </div>
          {analysis && analysis.summary.totalRequiredCheckouts > 0 && (
            <Button 
              onClick={handleBulkCheckout}
              disabled={checkoutLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {checkoutLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Bulk Checkout ({analysis.summary.totalRequiredCheckouts})
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}