import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  GitBranch, Users, Briefcase, Building, Calendar,
  Plug, Server, Activity, FileText, Package, ArrowRight,
  ChevronRight, ChevronDown, Layers
} from "lucide-react";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";

interface BusinessProcessDetailsModalProps {
  businessProcessId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function BusinessProcessDetailsModal({ 
  businessProcessId, 
  open, 
  onOpenChange 
}: BusinessProcessDetailsModalProps) {
  const [expandedProcesses, setExpandedProcesses] = useState<Set<number>>(new Set());
  
  const { data: businessProcess, isLoading } = useQuery({
    queryKey: ["/api/business-processes", businessProcessId],
    queryFn: async () => {
      if (!businessProcessId) return null;
      const response = await fetch(`/api/business-processes/${businessProcessId}`);
      if (!response.ok) throw new Error("Failed to fetch business process");
      return response.json();
    },
    enabled: !!businessProcessId,
  });

  const { data: interfaces = [] } = useQuery({
    queryKey: ["/api/interfaces", { businessProcessId }],
    queryFn: async () => {
      if (!businessProcessId) return [];
      const response = await fetch(`/api/interfaces?businessProcessId=${businessProcessId}`);
      if (!response.ok) throw new Error("Failed to fetch interfaces");
      const data = await response.json();
      // Filter only active interfaces
      return data.filter((iface: any) => iface.status === 'active');
    },
    enabled: !!businessProcessId,
  });

  const { data: businessProcessInterfaces = [] } = useQuery({
    queryKey: ["/api/business-processes", businessProcessId, "interfaces"],
    queryFn: async () => {
      if (!businessProcessId) return [];
      const response = await fetch(`/api/business-processes/${businessProcessId}/interfaces`);
      if (!response.ok) throw new Error("Failed to fetch business process interfaces");
      const data = await response.json();
      // Filter only active interfaces and sort by sequence number
      return data
        .filter((item: any) => item.status === 'active')
        .sort((a: any, b: any) => (a.sequenceNumber || 0) - (b.sequenceNumber || 0));
    },
    enabled: !!businessProcessId,
  });

  const { data: applications = [] } = useQuery({
    queryKey: ["/api/applications", { businessProcessId }],
    queryFn: async () => {
      if (!businessProcessId) return [];
      const response = await fetch(`/api/applications?businessProcessId=${businessProcessId}`);
      if (!response.ok) throw new Error("Failed to fetch applications");
      const data = await response.json();
      // Filter only active applications
      return data.filter((app: any) => app.status === 'active');
    },
    enabled: !!businessProcessId,
  });

  // Fetch parent processes
  const { data: parentProcesses = [] } = useQuery({
    queryKey: ["/api/business-processes", businessProcessId, "parents"],
    queryFn: async () => {
      if (!businessProcessId) return [];
      const response = await fetch(`/api/business-processes/${businessProcessId}/parents`);
      if (!response.ok) throw new Error("Failed to fetch parent processes");
      return response.json();
    },
    enabled: !!businessProcessId,
  });

  // Fetch child processes
  const { data: childProcesses = [] } = useQuery({
    queryKey: ["/api/business-processes", businessProcessId, "children"],
    queryFn: async () => {
      if (!businessProcessId) return [];
      const response = await fetch(`/api/business-processes/${businessProcessId}/children`);
      if (!response.ok) throw new Error("Failed to fetch child processes");
      return response.json();
    },
    enabled: !!businessProcessId,
  });

  const toggleExpand = (processId: number) => {
    const newExpanded = new Set(expandedProcesses);
    if (newExpanded.has(processId)) {
      newExpanded.delete(processId);
    } else {
      newExpanded.add(processId);
    }
    setExpandedProcesses(newExpanded);
  };

  if (!businessProcess && !isLoading) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-gray-800 border-gray-700 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-white flex items-center gap-3">
            <GitBranch className="h-6 w-6 text-gray-400" />
            {businessProcess?.businessProcess || "Loading..."}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <div className="h-32 bg-gray-700 rounded animate-pulse" />
            <div className="h-48 bg-gray-700 rounded animate-pulse" />
          </div>
        ) : businessProcess ? (
          <Tabs defaultValue="overview" className="mt-4">
            <TabsList className="grid w-full grid-cols-5 bg-gray-700">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="hierarchy">Hierarchy</TabsTrigger>
              <TabsTrigger value="interfaces">Interfaces</TabsTrigger>
              <TabsTrigger value="applications">Applications</TabsTrigger>
              <TabsTrigger value="flow">Process Flow</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-gray-700 border-gray-600">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-gray-300">Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Line of Business</span>
                      <span className="text-sm text-white">{businessProcess.LOB}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Product</span>
                      <span className="text-sm text-white">{businessProcess.product}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Version</span>
                      <Badge className="bg-gray-600 text-white">v{businessProcess.version}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Level</span>
                      <Badge className="bg-blue-600 text-white">Level {businessProcess.level || 'A'}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Created</span>
                      <span className="text-sm text-white">
                        {businessProcess.createdAt ? 
                          format(new Date(businessProcess.createdAt), "MMM d, yyyy") : 
                          "N/A"}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-700 border-gray-600">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-gray-300">Ownership</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-gray-400" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-400">Domain Owner</p>
                          <p className="text-sm text-white">{businessProcess.domainOwner || "Not assigned"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-400">IT Owner</p>
                          <p className="text-sm text-white">{businessProcess.itOwner || "Not assigned"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-gray-400" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-400">Vendor Focal</p>
                          <p className="text-sm text-white">{businessProcess.vendorFocal || "Not assigned"}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {businessProcess.description && (
                <Card className="bg-gray-700 border-gray-600">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-gray-300">Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-300">{businessProcess.description}</p>
                  </CardContent>
                </Card>
              )}

              <Card className="bg-gray-700 border-gray-600">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-gray-300">Process Statistics</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">{interfaces.length}</p>
                    <p className="text-xs text-gray-400">Active Interfaces</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">{applications.length}</p>
                    <p className="text-xs text-gray-400">Active Applications</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">
                      {businessProcess.complexity || "Medium"}
                    </p>
                    <p className="text-xs text-gray-400">Complexity</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="hierarchy" className="mt-4">
              <Card className="bg-gray-700 border-gray-600">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Layers className="h-5 w-5" />
                    Process Hierarchy
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Parent Processes */}
                  {parentProcesses.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-400 mb-2">Parent Processes ({parentProcesses.length}):</p>
                      <div className="space-y-2">
                        {parentProcesses.map((parent: any) => (
                          <div key={parent.id} className="p-3 bg-gray-800 rounded-lg border border-gray-600">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <GitBranch className="h-4 w-4 text-gray-400" />
                                <span className="text-white font-medium">{parent.businessProcess}</span>
                                <Badge className="bg-blue-600 text-white text-xs">Level {parent.level}</Badge>
                              </div>
                              <Badge className={
                                parent.status === "active" ? "bg-green-600 text-white" : "bg-gray-600 text-white"
                              }>
                                {parent.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Current Process */}
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Current Process:</p>
                    <div className="p-3 bg-blue-900/20 rounded-lg border border-blue-600">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <GitBranch className="h-4 w-4 text-blue-400" />
                          <span className="text-white font-medium">{businessProcess.businessProcess}</span>
                          <Badge className="bg-blue-600 text-white text-xs">Level {businessProcess.level || 'A'}</Badge>
                        </div>
                        <Badge className={
                          businessProcess.status === "active" ? "bg-green-600 text-white" : "bg-gray-600 text-white"
                        }>
                          {businessProcess.status}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Child Processes */}
                  {childProcesses.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-400 mb-2">Child Processes ({childProcesses.length}):</p>
                      <div className="space-y-2">
                        {childProcesses.map((child: any) => (
                          <div key={child.id} className="p-3 bg-gray-800 rounded-lg border border-gray-600">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <GitBranch className="h-4 w-4 text-gray-400" />
                                <span className="text-white">{child.businessProcess}</span>
                                <Badge className="bg-blue-600 text-white text-xs">Level {child.level}</Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className={
                                  child.status === "active" ? "bg-green-600 text-white" : "bg-gray-600 text-white"
                                }>
                                  {child.status}
                                </Badge>
                                <span className="text-xs text-gray-400">{child.product}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {parentProcesses.length === 0 && childProcesses.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <Layers className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>This is a standalone process with no hierarchy relationships.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="interfaces" className="mt-4">
              {interfaces.length > 0 ? (
                <Card className="bg-gray-700 border-gray-600">
                  <CardHeader>
                    <CardTitle className="text-base text-white flex items-center gap-2">
                      <Plug className="h-4 w-4" />
                      Active Interfaces ({interfaces.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {interfaces.map((iface: any, index: number) => (
                        <div key={iface.id} className="p-3 bg-gray-800 rounded-lg border border-gray-600">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400">#{index + 1}</span>
                                <p className="font-medium text-white">{iface.imlNumber}</p>
                              </div>
                              <p className="text-sm text-gray-400 mt-1">
                                {iface.interfaceType} - v{iface.version}
                              </p>
                              <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                                <Server className="h-3 w-3" />
                                <span>{iface.providerApplication?.name}</span>
                                <span>→</span>
                                <span>{iface.consumerApplication?.name}</span>
                              </div>
                            </div>
                            <Badge className={iface.status === "active" ? "bg-green-600 text-white" : "bg-gray-600 text-white"}>
                              {iface.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-gray-700 border-gray-600">
                  <CardContent className="text-center py-8">
                    <Plug className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-400">No interfaces associated with this business process</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="applications" className="mt-4">
              {applications.length > 0 ? (
                <Card className="bg-gray-700 border-gray-600">
                  <CardHeader>
                    <CardTitle className="text-base text-white flex items-center gap-2">
                      <Server className="h-4 w-4" />
                      Active Applications ({applications.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2">
                      {applications.map((app: any) => (
                        <div key={app.id} className="p-3 bg-gray-800 rounded-lg border border-gray-600">
                          <div className="flex items-start gap-2">
                            <Server className="h-4 w-4 text-gray-400 mt-1" />
                            <div className="flex-1">
                              <p className="font-medium text-white">{app.name}</p>
                              <p className="text-xs text-gray-400">{app.os} - {app.deployment}</p>
                            </div>
                            <Badge className={app.status === "active" ? "bg-green-600 text-white" : "bg-gray-600 text-white"}>
                              {app.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-gray-700 border-gray-600">
                  <CardContent className="text-center py-8">
                    <Server className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-400">No applications involved in this business process</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="flow" className="mt-4">
              <Card className="bg-gray-700 border-gray-600">
                <CardHeader>
                  <CardTitle className="text-base text-white flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Process Flow Diagram
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {businessProcessInterfaces.length > 0 ? (
                    <div 
                      className="relative h-[600px] overflow-auto process-flow-scroll"
                      style={{
                        scrollbarWidth: 'thin',
                        scrollbarColor: '#4B5563 #1F2937'
                      }}
                    >
                      <style>{`
                        .process-flow-scroll::-webkit-scrollbar {
                          width: 12px;
                          height: 12px;
                        }
                        .process-flow-scroll::-webkit-scrollbar-track {
                          background: #1F2937;
                          border-radius: 6px;
                        }
                        .process-flow-scroll::-webkit-scrollbar-thumb {
                          background: #4B5563;
                          border-radius: 6px;
                        }
                        .process-flow-scroll::-webkit-scrollbar-thumb:hover {
                          background: #6B7280;
                        }
                        .process-flow-scroll::-webkit-scrollbar-corner {
                          background: #1F2937;
                        }
                      `}</style>
                      <div className="p-6" style={{ minWidth: Math.max(800, businessProcessInterfaces.length * 250) + 'px' }}>
                        {/* Collect unique applications */}
                        {(() => {
                          const uniqueApps = new Map();
                          businessProcessInterfaces.forEach((item: any) => {
                            if (item.providerApp && !uniqueApps.has(item.providerApplicationId)) {
                              uniqueApps.set(item.providerApplicationId, item.providerApp);
                            }
                            if (item.consumerApp && !uniqueApps.has(item.consumerApplicationId)) {
                              uniqueApps.set(item.consumerApplicationId, item.consumerApp);
                            }
                          });
                          
                          const apps = Array.from(uniqueApps.values());
                          const appPositions = new Map();
                          apps.forEach((app, index) => {
                            appPositions.set(app.id, index * 200 + 100);
                          });
                          
                          return (
                            <div className="relative" style={{ height: `${businessProcessInterfaces.length * 80 + 200}px` }}>
                              {/* Application Headers */}
                              {apps.map((app) => (
                                <div
                                  key={app.id}
                                  className="absolute bg-gray-800 border border-gray-600 rounded-lg p-4"
                                  style={{
                                    left: `${appPositions.get(app.id) - 75}px`,
                                    top: '0px',
                                    width: '150px'
                                  }}
                                >
                                  <div className="text-center">
                                    <Server className="h-6 w-6 mx-auto mb-2 text-gray-400" />
                                    <h4 className="text-sm font-semibold text-white truncate">{app.name}</h4>
                                    <Badge className="mt-1" variant={app.status === 'active' ? 'default' : 'secondary'}>
                                      {app.status}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                              
                              {/* Lifelines */}
                              {apps.map((app) => (
                                <div
                                  key={`lifeline-${app.id}`}
                                  className="absolute border-l-2 border-dashed border-gray-600"
                                  style={{
                                    left: `${appPositions.get(app.id)}px`,
                                    top: '100px',
                                    height: `${businessProcessInterfaces.length * 80 + 50}px`
                                  }}
                                />
                              ))}
                              
                              {/* Interface Arrows */}
                              {businessProcessInterfaces.map((item: any, index: number) => {
                                const providerX = appPositions.get(item.providerApplicationId) || 100;
                                const consumerX = appPositions.get(item.consumerApplicationId) || 300;
                                const y = 120 + index * 80;
                                const isLeftToRight = providerX < consumerX;
                                const arrowStart = isLeftToRight ? providerX : consumerX;
                                const arrowEnd = isLeftToRight ? consumerX : providerX;
                                const arrowWidth = Math.abs(arrowEnd - arrowStart);
                                
                                return (
                                  <div key={item.id} className="absolute" style={{ top: `${y}px` }}>
                                    {/* Arrow Line */}
                                    <div
                                      className="absolute border-t-2 border-blue-500"
                                      style={{
                                        left: `${arrowStart}px`,
                                        width: `${arrowWidth}px`,
                                        top: '20px'
                                      }}
                                    >
                                      {/* Arrow Head */}
                                      <ArrowRight 
                                        className="absolute text-blue-500" 
                                        style={{
                                          right: isLeftToRight ? '-8px' : 'auto',
                                          left: isLeftToRight ? 'auto' : '-8px',
                                          top: '-12px',
                                          transform: isLeftToRight ? 'none' : 'rotate(180deg)'
                                        }}
                                        size={20}
                                      />
                                    </div>
                                    
                                    {/* Interface Label */}
                                    <div
                                      className="absolute bg-gray-800 border border-gray-600 rounded px-3 py-2 text-xs"
                                      style={{
                                        left: `${arrowStart + arrowWidth / 2 - 80}px`,
                                        top: '-10px',
                                        width: '160px'
                                      }}
                                    >
                                      <div className="text-center">
                                        <span className="font-semibold text-white">#{item.sequenceNumber} {item.imlNumber}</span>
                                        <div className="text-gray-400 mt-1">{item.interfaceType}</div>
                                        {item.interfaceDescription && (
                                          <div className="text-gray-500 text-xs mt-1 truncate">
                                            {item.interfaceDescription}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Activity className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-400">No interfaces found for this business process</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

// Export a wrapper component that includes context menu functionality
export function BusinessProcessWithContextMenu({ 
  businessProcess, 
  children,
  onDoubleClick,
  className = ""
}: { 
  businessProcess: any;
  children: React.ReactNode;
  onDoubleClick?: () => void;
  className?: string;
}) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div 
          className={`cursor-pointer ${className}`}
          onDoubleClick={onDoubleClick}
        >
          {children}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="bg-gray-800 border-gray-700">
        <ContextMenuItem className="text-gray-300 hover:bg-gray-700" disabled>
          <FileText className="mr-2 h-4 w-4" />
          Business Process Details
        </ContextMenuItem>
        <ContextMenuSeparator className="bg-gray-700" />
        <ContextMenuItem className="text-gray-300 hover:bg-gray-700">
          <span className="font-medium">Process:</span>
          <span className="ml-2">{businessProcess.businessProcess}</span>
        </ContextMenuItem>
        <ContextMenuItem className="text-gray-300 hover:bg-gray-700">
          <span className="font-medium">LOB:</span>
          <span className="ml-2">{businessProcess.LOB}</span>
        </ContextMenuItem>
        <ContextMenuItem className="text-gray-300 hover:bg-gray-700">
          <span className="font-medium">Product:</span>
          <span className="ml-2">{businessProcess.product}</span>
        </ContextMenuItem>
        <ContextMenuItem className="text-gray-300 hover:bg-gray-700">
          <span className="font-medium">Version:</span>
          <span className="ml-2">v{businessProcess.version}</span>
        </ContextMenuItem>
        <ContextMenuSeparator className="bg-gray-700" />
        <ContextMenuItem className="text-gray-300 hover:bg-gray-700">
          <span className="font-medium">Domain Owner:</span>
          <span className="ml-2">{businessProcess.domainOwner || "Not assigned"}</span>
        </ContextMenuItem>
        <ContextMenuItem className="text-gray-300 hover:bg-gray-700">
          <span className="font-medium">IT Owner:</span>
          <span className="ml-2">{businessProcess.itOwner || "Not assigned"}</span>
        </ContextMenuItem>
        <ContextMenuItem className="text-gray-300 hover:bg-gray-700">
          <span className="font-medium">Vendor Focal:</span>
          <span className="ml-2">{businessProcess.vendorFocal || "Not assigned"}</span>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}