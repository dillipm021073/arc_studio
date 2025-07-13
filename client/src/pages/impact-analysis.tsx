import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Network, 
  Box, 
  Plug, 
  GitBranch,
  AlertTriangle,
  Info,
  CheckCircle,
  Clock,
  X,
  Briefcase,
  Cpu
} from "lucide-react";
import { Link } from "wouter";
import { Checkbox } from "@/components/ui/checkbox";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import ApplicationDetailsModal from "@/components/modals/ApplicationDetailsModal";
import InterfaceDetailsModal from "@/components/modals/InterfaceDetailsModal";
import BusinessProcessDetailsModal, { BusinessProcessWithContextMenu } from "@/components/modals/BusinessProcessDetailsModal";
import { CrossCRImpactAnalysis } from "@/components/cross-cr-impact-analysis";
import type { CrossCRImpact } from "@/types/impact-analysis";

interface Application {
  id: number;
  name: string;
  description: string;
  status: string;
}

interface Interface {
  id: number;
  imlNumber: string;
  businessProcessName: string;
  interfaceType: string;
  status: string;
  providerApplicationName: string;
  consumerApplicationName: string;
}

interface ChangeRequest {
  id: number;
  crNumber: string;
  title: string;
  status: string;
  description?: string;
  priority?: string;
  owner?: string;
}

interface ImpactAnalysis {
  application?: any;
  changeRequest?: any;
  changeRequests?: any[];
  providedInterfaces: any[];
  consumedInterfaces: any[];
  relatedApplications: any[];
  activeChangeRequests: any[];
  impactedApplications: any[];
  impactedInterfaces: any[];
  impactedBusinessProcesses?: any[];
  impactedTechnicalProcesses?: any[];
  relatedChangeRequests?: any[];
  impactSummary: {
    totalInterfaces?: number;
    totalApplications?: number;
    relatedApplications?: number;
    activeChanges?: number;
    riskLevel?: string;
    totalBusinessProcesses?: number;
    totalTechnicalProcesses?: number;
  };
}

export default function ImpactAnalysis() {
  const [analysisType, setAnalysisType] = useState<"application" | "change-request" | "interface">("change-request");
  const [selectedApplicationIds, setSelectedApplicationIds] = useState<string[]>([]);
  const [selectedChangeRequestIds, setSelectedChangeRequestIds] = useState<string[]>([]);
  const [selectedInterfaceIds, setSelectedInterfaceIds] = useState<string[]>([]);
  const [openAppPopover, setOpenAppPopover] = useState(false);
  const [viewingApplication, setViewingApplication] = useState<number | null>(null);
  const [viewingInterface, setViewingInterface] = useState<number | null>(null);
  const [viewingBusinessProcess, setViewingBusinessProcess] = useState<number | null>(null);
  const [openCRPopover, setOpenCRPopover] = useState(false);
  const [openInterfacePopover, setOpenInterfacePopover] = useState(false);
  const [showCrossCRAnalysis, setShowCrossCRAnalysis] = useState(false);

  const { data: applications } = useQuery<Application[]>({
    queryKey: ["/api/applications"],
  });

  const { data: changeRequests } = useQuery<ChangeRequest[]>({
    queryKey: ["/api/change-requests"],
  });

  const { data: interfaces } = useQuery<Interface[]>({
    queryKey: ["/api/interfaces"],
  });

  // Fetch multiple CR impacts
  const { data: multiCRImpact, isLoading: multiCRLoading } = useQuery<ImpactAnalysis>({
    queryKey: ["/api/impact-analysis/multi-change-requests", selectedChangeRequestIds],
    queryFn: async () => {
      if (selectedChangeRequestIds.length === 0) return null;
      const response = await fetch("/api/impact-analysis/multi-change-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ changeRequestIds: selectedChangeRequestIds.map(id => parseInt(id)) })
      });
      if (!response.ok) throw new Error("Failed to fetch multi-CR impact analysis");
      return response.json();
    },
    enabled: analysisType === "change-request" && selectedChangeRequestIds.length > 0,
  });

  // Fetch multiple interface impacts
  const { data: multiInterfaceImpact, isLoading: multiInterfaceLoading } = useQuery<any>({
    queryKey: ["/api/impact-analysis/multi-interfaces", selectedInterfaceIds],
    queryFn: async () => {
      if (selectedInterfaceIds.length === 0) return null;
      const response = await fetch("/api/impact-analysis/multi-interfaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interfaceIds: selectedInterfaceIds.map(id => parseInt(id)) })
      });
      if (!response.ok) throw new Error("Failed to fetch multi-interface impact analysis");
      return response.json();
    },
    enabled: analysisType === "interface" && selectedInterfaceIds.length > 0,
  });

  // Fetch application impact (single or multiple)
  const { data: applicationImpact, isLoading: applicationLoading } = useQuery<ImpactAnalysis>({
    queryKey: ["/api/impact-analysis/applications", selectedApplicationIds],
    queryFn: async () => {
      if (selectedApplicationIds.length === 0) return null;
      
      // For single application, use the existing endpoint
      if (selectedApplicationIds.length === 1) {
        const response = await fetch(`/api/impact-analysis/application/${selectedApplicationIds[0]}`);
        if (!response.ok) throw new Error("Failed to fetch application impact analysis");
        return response.json();
      }
      
      // For multiple applications, use the new endpoint
      const response = await fetch("/api/impact-analysis/multi-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationIds: selectedApplicationIds.map(id => parseInt(id)) })
      });
      if (!response.ok) throw new Error("Failed to fetch multi-application impact analysis");
      return response.json();
    },
    enabled: analysisType === "application" && selectedApplicationIds.length > 0,
  });

  // Fetch Cross-CR analysis when 2+ CRs are selected
  const { data: crossCRAnalysis, isLoading: crossCRLoading } = useQuery<CrossCRImpact>({
    queryKey: ["/api/cross-cr-analysis", selectedChangeRequestIds],
    queryFn: async () => {
      if (selectedChangeRequestIds.length < 2) return null;
      const response = await fetch("/api/cross-cr-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ crIds: selectedChangeRequestIds })
      });
      if (!response.ok) throw new Error("Failed to fetch cross-CR analysis");
      return response.json().then(res => res.analysis);
    },
    enabled: analysisType === "change-request" && selectedChangeRequestIds.length >= 2 && showCrossCRAnalysis,
  });

  const currentImpact = analysisType === "application" ? applicationImpact : 
                       analysisType === "change-request" ? multiCRImpact : 
                       multiInterfaceImpact;
  const isLoading = analysisType === "application" ? applicationLoading : 
                   analysisType === "change-request" ? multiCRLoading : 
                   multiInterfaceLoading;

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'bg-green-600 text-white';
      case 'medium': return 'bg-yellow-600 text-white';
      case 'high': return 'bg-orange-600 text-white';
      case 'critical': return 'bg-red-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-600 text-white';
      case 'inactive': return 'bg-red-600 text-white';
      case 'maintenance': return 'bg-blue-600 text-white';
      case 'deprecated': return 'bg-orange-600 text-white';
      case 'in_progress': return 'bg-blue-600 text-white';
      case 'completed': return 'bg-green-600 text-white';
      case 'under_review': return 'bg-orange-600 text-white';
      case 'draft': return 'bg-gray-600 text-white';
      case 'submitted': return 'bg-blue-600 text-white';
      case 'approved': return 'bg-green-600 text-white';
      case 'rejected': return 'bg-red-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const handleApplicationSelect = (appId: string) => {
    // Allow multiple application selection
    setSelectedApplicationIds(prev => 
      prev.includes(appId) ? prev.filter(id => id !== appId) : [...prev, appId]
    );
  };

  const handleCRSelect = (crId: string) => {
    setSelectedChangeRequestIds(prev => 
      prev.includes(crId) ? prev.filter(id => id !== crId) : [...prev, crId]
    );
  };

  const handleInterfaceSelect = (interfaceId: string) => {
    setSelectedInterfaceIds(prev => 
      prev.includes(interfaceId) ? prev.filter(id => id !== interfaceId) : [...prev, interfaceId]
    );
  };

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <nav className="flex" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-2 text-sm text-gray-400">
                <li><Link href="/" className="hover:text-gray-200">Home</Link></li>
                <li className="flex items-center">
                  <span className="mx-2">/</span>
                  <span className="text-white font-medium">Impact Analysis</span>
                </li>
              </ol>
            </nav>
            <h1 className="text-2xl font-semibold text-white mt-1">Impact Analysis</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        {/* Analysis Type Selector */}
        <Card className="mb-6 bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center text-white">
              <Network className="mr-2" size={20} />
              Impact Analysis Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={analysisType} onValueChange={(value) => setAnalysisType(value as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="application">Application Impact</TabsTrigger>
                <TabsTrigger value="change-request">Change Request Impact</TabsTrigger>
                <TabsTrigger value="interface">Interface Impact</TabsTrigger>
              </TabsList>
              
              <TabsContent value="application" className="mt-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Select Application to Analyze
                    </label>
                    <Popover open={openAppPopover} onOpenChange={setOpenAppPopover}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openAppPopover}
                          className="w-full justify-between bg-gray-700 text-white border-gray-600 hover:bg-gray-600"
                        >
                          {selectedApplicationIds.length === 0
                            ? "Select applications..."
                            : `${selectedApplicationIds.length} application(s) selected`}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0 bg-gray-800 border-gray-700">
                        <Command className="bg-gray-800">
                          <CommandInput placeholder="Search applications..." className="text-white border-gray-600" />
                          <CommandEmpty className="text-gray-300">No application found.</CommandEmpty>
                          <CommandGroup className="max-h-64 overflow-auto">
                            {applications?.map((app) => (
                              <CommandItem
                                key={app.id}
                                onSelect={() => handleApplicationSelect(app.id.toString())}
                                className="text-white hover:bg-gray-700"
                              >
                                <Checkbox
                                  checked={selectedApplicationIds.includes(app.id.toString())}
                                  className="mr-2"
                                />
                                <span className="truncate">{app.name}</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  {selectedApplicationIds.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedApplicationIds.map(id => {
                        const app = applications?.find(a => a.id.toString() === id);
                        return app ? (
                          <Badge key={id} variant="secondary" className="flex items-center gap-1">
                            {app.name}
                            <X 
                              className="h-3 w-3 cursor-pointer" 
                              onClick={() => handleApplicationSelect(id)}
                            />
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  )}
                  <p className="text-sm text-gray-400">
                    Analyze the impact of changes to one or more applications on related systems and interfaces. Select multiple applications to see combined impact analysis.
                  </p>
                </div>
              </TabsContent>
              
              <TabsContent value="change-request" className="mt-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Select Change Requests to Analyze
                    </label>
                    <Popover open={openCRPopover} onOpenChange={setOpenCRPopover}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openCRPopover}
                          className="w-full justify-between bg-gray-700 text-white border-gray-600 hover:bg-gray-600"
                        >
                          {selectedChangeRequestIds.length === 0
                            ? "Select change requests..."
                            : `${selectedChangeRequestIds.length} change request(s) selected`}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0 bg-gray-800 border-gray-700">
                        <Command className="bg-gray-800">
                          <CommandInput placeholder="Search change requests..." className="text-white border-gray-600" />
                          <CommandEmpty className="text-gray-300">No change request found.</CommandEmpty>
                          <CommandGroup className="max-h-64 overflow-auto">
                            {changeRequests?.map((cr) => (
                              <CommandItem
                                key={cr.id}
                                onSelect={() => handleCRSelect(cr.id.toString())}
                                className="text-white hover:bg-gray-700"
                              >
                                <Checkbox
                                  checked={selectedChangeRequestIds.includes(cr.id.toString())}
                                  className="mr-2"
                                />
                                <span className="truncate">{cr.crNumber} - {cr.title}</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  {selectedChangeRequestIds.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedChangeRequestIds.map(id => {
                        const cr = changeRequests?.find(c => c.id.toString() === id);
                        return cr ? (
                          <Badge key={id} variant="secondary" className="flex items-center gap-1">
                            {cr.crNumber}
                            <X 
                              className="h-3 w-3 cursor-pointer" 
                              onClick={() => handleCRSelect(id)}
                            />
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  )}
                  {selectedChangeRequestIds.length >= 2 && (
                    <Button
                      onClick={() => setShowCrossCRAnalysis(!showCrossCRAnalysis)}
                      variant="outline"
                      className="w-full"
                    >
                      <GitBranch className="mr-2 h-4 w-4" />
                      {showCrossCRAnalysis ? "Hide" : "Show"} Cross-CR Impact Analysis
                    </Button>
                  )}
                  <p className="text-sm text-gray-400">
                    Analyze the combined impact of multiple change requests across all affected applications and interfaces.
                    {selectedChangeRequestIds.length >= 2 && " Use Cross-CR analysis to identify common items and conflicts."}
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="interface" className="mt-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Select Interfaces to Analyze
                    </label>
                    <Popover open={openInterfacePopover} onOpenChange={setOpenInterfacePopover}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openInterfacePopover}
                          className="w-full justify-between bg-gray-700 text-white border-gray-600 hover:bg-gray-600"
                        >
                          {selectedInterfaceIds.length === 0
                            ? "Select interfaces..."
                            : `${selectedInterfaceIds.length} interface(s) selected`}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0 bg-gray-800 border-gray-700">
                        <Command className="bg-gray-800">
                          <CommandInput placeholder="Search interfaces..." className="text-white border-gray-600" />
                          <CommandEmpty className="text-gray-300">No interface found.</CommandEmpty>
                          <CommandGroup className="max-h-64 overflow-auto">
                            {interfaces?.map((iface) => (
                              <CommandItem
                                key={iface.id}
                                onSelect={() => handleInterfaceSelect(iface.id.toString())}
                                className="text-white hover:bg-gray-700"
                              >
                                <Checkbox
                                  checked={selectedInterfaceIds.includes(iface.id.toString())}
                                  className="mr-2"
                                />
                                <span className="truncate">{iface.imlNumber} - {iface.businessProcessName}</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  {selectedInterfaceIds.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedInterfaceIds.map(id => {
                        const iface = interfaces?.find(i => i.id.toString() === id);
                        return iface ? (
                          <Badge key={id} variant="secondary" className="flex items-center gap-1">
                            {iface.imlNumber}
                            <X 
                              className="h-3 w-3 cursor-pointer" 
                              onClick={() => handleInterfaceSelect(id)}
                            />
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  )}
                  <p className="text-sm text-gray-400">
                    View all change requests that impact the selected interfaces.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Impact Analysis Results */}
        {isLoading ? (
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="text-center py-12">
              <div className="text-gray-300">Analyzing impact...</div>
            </CardContent>
          </Card>
        ) : !currentImpact && (
          (analysisType === "application" && selectedApplicationIds.length === 0) ||
          (analysisType === "change-request" && selectedChangeRequestIds.length === 0) ||
          (analysisType === "interface" && selectedInterfaceIds.length === 0)
        ) ? (
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="text-center py-12">
              <Network className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No Analysis Selected</h3>
              <p className="text-gray-300">
                Select {analysisType === "application" ? "an application" : 
                       analysisType === "change-request" ? "change requests" : 
                       "interfaces"} above to view impact analysis.
              </p>
            </CardContent>
          </Card>
        ) : !currentImpact ? (
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="text-center py-12">
              <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No Impact Data Found</h3>
              <p className="text-gray-300">
                The selected {analysisType === "application" ? "application" : 
                             analysisType === "change-request" ? "change request(s)" : 
                             "interface(s)"} may not have any associated impacts yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Impact Summary */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-white">
                  <span className="flex items-center">
                    <AlertTriangle className="mr-2" size={20} />
                    Impact Summary
                  </span>
                  {currentImpact.impactSummary?.riskLevel && (
                    <Badge className={`status-badge ${getRiskLevelColor(currentImpact.impactSummary.riskLevel)}`}>
                      {currentImpact.impactSummary.riskLevel.toUpperCase()} RISK
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="text-center p-4 bg-blue-600 rounded-lg">
                    <div className="text-2xl font-bold text-white">
                      {currentImpact.impactSummary?.totalApplications || 0}
                    </div>
                    <div className="text-sm text-white">Applications</div>
                  </div>
                  <div className="text-center p-4 bg-green-600 rounded-lg">
                    <div className="text-2xl font-bold text-white">
                      {currentImpact.impactSummary?.totalInterfaces || 0}
                    </div>
                    <div className="text-sm text-white">Interfaces</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-600 rounded-lg">
                    <div className="text-2xl font-bold text-white">
                      {analysisType === "interface" 
                        ? (currentImpact.relatedChangeRequests?.length || 0)
                        : (currentImpact.impactSummary?.activeChanges || selectedChangeRequestIds.length || 0)}
                    </div>
                    <div className="text-sm text-white">
                      {analysisType === "interface" ? "Related CRs" : "Change Requests"}
                    </div>
                  </div>
                  <div className="text-center p-4 bg-purple-600 rounded-lg">
                    <div className="text-2xl font-bold text-white">
                      {currentImpact.impactSummary?.totalBusinessProcesses || 0}
                    </div>
                    <div className="text-sm text-white">Business Processes</div>
                  </div>
                  <div className="text-center p-4 bg-indigo-600 rounded-lg">
                    <div className="text-2xl font-bold text-white">
                      {currentImpact.impactSummary?.totalTechnicalProcesses || 0}
                    </div>
                    <div className="text-sm text-white">Technical Processes</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cross-CR Impact Analysis */}
            {analysisType === "change-request" && showCrossCRAnalysis && selectedChangeRequestIds.length >= 2 && (
              <CrossCRImpactAnalysis
                analysis={crossCRAnalysis}
                loading={crossCRLoading}
                onClose={() => setShowCrossCRAnalysis(false)}
                onViewApplication={(id) => setViewingApplication(id)}
                onViewInterface={(id) => setViewingInterface(id)}
                onViewBusinessProcess={(id) => setViewingBusinessProcess(id)}
              />
            )}

            {/* Selected Applications Details */}
            {analysisType === "application" && currentImpact?.applications && currentImpact.applications.length > 1 && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center text-white">
                    <Box className="mr-2" size={20} />
                    Selected Applications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {currentImpact.applications.map((app: any) => (
                      <div key={app.id} className="p-3 bg-gray-700 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <h4 className="font-semibold text-white">{app.name}</h4>
                            <p className="text-sm text-gray-300">{app.description}</p>
                            <div className="flex items-center gap-3 text-sm">
                              <Badge className={`status-badge ${getStatusColor(app.status)}`}>
                                {app.status}
                              </Badge>
                              {app.lob && <span className="text-gray-300">LOB: {app.lob}</span>}
                              {app.deployment && <span className="text-gray-300">Deployment: {app.deployment}</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Selected Items Details */}
            {analysisType === "change-request" && currentImpact?.changeRequests && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center text-white">
                    <GitBranch className="mr-2" size={20} />
                    Selected Change Requests
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {currentImpact.changeRequests.map((cr: any) => (
                      <div key={cr.id} className="p-3 bg-gray-700 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <h4 className="font-semibold text-white">{cr.crNumber}: {cr.title}</h4>
                            <p className="text-sm text-gray-300">{cr.description}</p>
                            <div className="flex items-center gap-3 text-sm">
                              <Badge className={`status-badge ${getStatusColor(cr.status)}`}>
                                {cr.status.replace('_', ' ')}
                              </Badge>
                              <span className="text-gray-300">Priority: {cr.priority}</span>
                              <span className="text-gray-300">Owner: {cr.owner}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Impacted Applications */}
            {currentImpact.impactedApplications?.length > 0 && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center text-white">
                    <Box className="mr-2" size={20} />
                    Impacted Applications ({currentImpact.impactedApplications.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {currentImpact.impactedApplications.map((item: any, index: number) => (
                      <div 
                        key={index} 
                        className="flex items-center justify-between p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors"
                        onDoubleClick={() => item.application?.id && setViewingApplication(item.application.id)}
                        title="Double-click to view application details"
                      >
                        <div>
                          <div className="font-medium text-white">{item.application?.name}</div>
                          <div className="text-sm text-gray-300">
                            {item.impact?.impactDescription || item.application?.description}
                          </div>
                          {item.changeRequest && (
                            <div className="text-xs text-gray-300 mt-1">
                              From CR: {item.changeRequest.crNumber}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={`status-badge ${getStatusColor(item.application?.status || 'active')}`}>
                            {item.application?.status}
                          </Badge>
                          {item.impact?.impactType && (
                            <Badge className="status-badge bg-orange-600 text-white">
                              {item.impact.impactType.replace('_', ' ')}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Impacted Interfaces */}
            {currentImpact.impactedInterfaces?.length > 0 && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center text-white">
                    <Plug className="mr-2" size={20} />
                    Impacted Interfaces ({currentImpact.impactedInterfaces.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {currentImpact.impactedInterfaces.map((item: any, index: number) => (
                      <div 
                        key={index} 
                        className="flex items-center justify-between p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors"
                        onDoubleClick={() => item.interface?.id && setViewingInterface(item.interface.id)}
                        title="Double-click to view interface details"
                      >
                        <div>
                          <div className="font-medium text-white">{item.interface?.imlNumber}</div>
                          <div className="text-sm text-gray-300">
                            {item.interface?.businessProcessName}
                          </div>
                          <div className="text-xs text-gray-300">
                            {item.interface?.providerApplicationName} → {item.interface?.consumerApplicationName}
                          </div>
                          {item.changeRequest && (
                            <div className="text-xs text-gray-300 mt-1">
                              From CR: {item.changeRequest.crNumber}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={`status-badge ${getStatusColor(item.interface?.status || 'active')}`}>
                            {item.interface?.interfaceType?.toUpperCase()}
                          </Badge>
                          {item.impact?.impactType && (
                            <Badge className="status-badge bg-orange-600 text-white">
                              {item.impact.impactType.replace('_', ' ')}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Impacted Business Processes */}
            {currentImpact.impactedBusinessProcesses?.length > 0 && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center text-white">
                    <Briefcase className="mr-2" size={20} />
                    Impacted Business Processes ({currentImpact.impactSummary?.totalBusinessProcesses || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(() => {
                      // Group business processes by unique ID to avoid duplicates
                      const uniqueBPs = new Map();
                      currentImpact.impactedBusinessProcesses.forEach((item: any) => {
                        if (item.businessProcess?.id && !uniqueBPs.has(item.businessProcess.id)) {
                          uniqueBPs.set(item.businessProcess.id, item);
                        }
                      });
                      
                      return Array.from(uniqueBPs.values()).map((item: any) => (
                        <BusinessProcessWithContextMenu
                          key={item.businessProcess.id}
                          businessProcess={item.businessProcess}
                          onDoubleClick={() => setViewingBusinessProcess(item.businessProcess.id)}
                          className="p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <div className="font-medium text-white">{item.businessProcess.businessProcess}</div>
                                <Badge className="bg-blue-600 text-white text-xs">Level {item.businessProcess.level || 'A'}</Badge>
                                {item.impactType && (
                                  <Badge className={
                                    item.impactType === 'parent' ? "bg-purple-600 text-white text-xs" :
                                    item.impactType === 'child' ? "bg-orange-600 text-white text-xs" :
                                    "bg-green-600 text-white text-xs"
                                  }>
                                    {item.impactType === 'parent' ? 'Parent Impact' :
                                     item.impactType === 'child' ? 'Child Impact' :
                                     'Direct Impact'}
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-gray-300">
                                LOB: {item.businessProcess.lob || 'N/A'} | Product: {item.businessProcess.product || 'N/A'}
                              </div>
                              <div className="text-xs text-gray-300">
                                Version: {item.businessProcess.version || '1.0'} | Status: {item.businessProcess.status || 'active'}
                              </div>
                              {item.businessProcess.domainOwner && (
                                <div className="text-xs text-gray-300">
                                  Domain Owner: {item.businessProcess.domainOwner}
                                </div>
                              )}
                              {item.businessProcess.itOwner && (
                                <div className="text-xs text-gray-300">
                                  IT Owner: {item.businessProcess.itOwner}
                                </div>
                              )}
                            </div>
                            <Badge className={`status-badge ${getStatusColor(item.businessProcess.status || 'active')}`}>
                              {item.businessProcess.status || 'active'}
                            </Badge>
                          </div>
                          {/* Show which interfaces link this BP */}
                          <div className="mt-2 pt-2 border-t border-gray-600">
                            <div className="text-xs text-gray-300">
                              Related Interfaces: {
                                currentImpact.impactedBusinessProcesses
                                  .filter((bp: any) => bp.businessProcess?.id === item.businessProcess.id)
                                  .map((bp: any) => {
                                    const iface = currentImpact.impactedInterfaces?.find((i: any) => i.interface?.id === bp.interfaceId);
                                    return iface?.interface?.imlNumber || bp.interfaceId;
                                  })
                                  .filter((v: any, i: number, a: any[]) => a.indexOf(v) === i)
                                  .join(', ')
                              }
                            </div>
                          </div>
                        </BusinessProcessWithContextMenu>
                      ));
                    })()}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Impacted Technical Processes */}
            {currentImpact.impactedTechnicalProcesses?.length > 0 && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center text-white">
                    <Cpu className="mr-2" size={20} />
                    Impacted Technical Processes ({currentImpact.impactSummary?.totalTechnicalProcesses || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {currentImpact.impactedTechnicalProcesses.map((item: any, index: number) => (
                      <div 
                        key={index} 
                        className="flex items-center justify-between p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors"
                        onDoubleClick={() => item.technicalProcess?.id && (window.location.href = `/technical-processes/${item.technicalProcess.id}`)}
                        title="Double-click to view technical process details"
                      >
                        <div>
                          <div className="font-medium text-white">{item.technicalProcess?.name}</div>
                          <div className="text-sm text-gray-300">
                            Job: {item.technicalProcess?.jobName}
                          </div>
                          <div className="text-xs text-gray-300">
                            {item.technicalProcess?.applicationName && `Application: ${item.technicalProcess.applicationName}`}
                          </div>
                          <div className="text-xs text-gray-300">
                            Frequency: {item.technicalProcess?.frequency} | Criticality: {item.technicalProcess?.criticality}
                          </div>
                          {item.changeRequest && (
                            <div className="text-xs text-gray-300 mt-1">
                              From CR: {item.changeRequest.crNumber}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={`status-badge ${getStatusColor(item.technicalProcess?.status || 'active')}`}>
                            {item.technicalProcess?.status}
                          </Badge>
                          {item.impact?.impactType && (
                            <Badge className="status-badge bg-orange-600 text-white">
                              {item.impact.impactType.replace('_', ' ')}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Related Applications (for interface analysis) */}
            {analysisType === "interface" && currentImpact.impactedApplications?.length > 0 && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center text-white">
                    <Box className="mr-2" size={20} />
                    Related Applications ({currentImpact.impactedApplications.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {currentImpact.impactedApplications.map((item: any, index: number) => (
                      <div 
                        key={index} 
                        className="flex items-center justify-between p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors"
                        onDoubleClick={() => item.application?.id && setViewingApplication(item.application.id)}
                        title="Double-click to view application details"
                      >
                        <div>
                          <div className="font-medium text-white">{item.application?.name}</div>
                          <div className="text-sm text-gray-300">
                            {item.application?.description}
                          </div>
                          <div className="text-xs text-gray-300 mt-1">
                            {item.impact?.impactDescription}
                          </div>
                        </div>
                        <Badge className={`status-badge ${getStatusColor(item.application?.status || 'active')}`}>
                          {item.application?.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Related Change Requests (for interface analysis) */}
            {analysisType === "interface" && currentImpact.relatedChangeRequests?.length > 0 && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center text-white">
                    <GitBranch className="mr-2" size={20} />
                    Related Change Requests ({currentImpact.relatedChangeRequests.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {currentImpact.relatedChangeRequests.map((item: any, index: number) => (
                      <div key={index} className="p-3 bg-gray-700 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <h4 className="font-semibold text-white">{item.changeRequest.crNumber}: {item.changeRequest.title}</h4>
                            <p className="text-sm text-gray-300">{item.changeRequest.description}</p>
                            <div className="text-xs text-gray-300">
                              Impact on interface: {item.interface.imlNumber} - {item.impact?.impactDescription}
                            </div>
                          </div>
                          <Badge className={`status-badge ${getStatusColor(item.changeRequest.status)}`}>
                            {item.changeRequest.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recommendations */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center text-white">
                  <CheckCircle className="mr-2" size={20} />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <Info className="text-blue-500 mt-1" size={16} />
                    <div>
                      <div className="font-medium text-white">Impact Assessment</div>
                      <div className="text-sm text-gray-300">
                        {analysisType === "interface" 
                          ? "Review all change requests affecting these interfaces before planning updates."
                          : "Review all connected systems before making changes to ensure compatibility."}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Info className="text-blue-500 mt-1" size={16} />
                    <div>
                      <div className="font-medium text-white">Testing Strategy</div>
                      <div className="text-sm text-gray-300">
                        {selectedChangeRequestIds.length > 1 
                          ? "Coordinate testing efforts across all selected change requests to avoid conflicts."
                          : "Include integration testing for all identified interface dependencies."}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Info className="text-blue-500 mt-1" size={16} />
                    <div>
                      <div className="font-medium text-white">Communication Plan</div>
                      <div className="text-sm text-gray-300">
                        Notify stakeholders of all affected applications and interfaces before implementation.
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      
      {/* Application Details Modal */}
      <ApplicationDetailsModal
        applicationId={viewingApplication}
        open={!!viewingApplication}
        onOpenChange={(open) => !open && setViewingApplication(null)}
      />
      
      {/* Interface Details Modal */}
      <InterfaceDetailsModal
        interfaceId={viewingInterface}
        open={!!viewingInterface}
        onOpenChange={(open) => !open && setViewingInterface(null)}
      />
      
      {/* Business Process Details Modal */}
      <BusinessProcessDetailsModal
        businessProcessId={viewingBusinessProcess}
        open={!!viewingBusinessProcess}
        onOpenChange={(open) => !open && setViewingBusinessProcess(null)}
      />
    </div>
  );
}