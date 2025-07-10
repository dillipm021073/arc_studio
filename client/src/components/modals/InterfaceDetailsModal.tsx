import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plug, Calendar, Users, Server, FileText, Activity,
  GitBranch, ArrowRight, Code, TestTube
} from "lucide-react";
import { format } from "date-fns";

interface InterfaceDetailsModalProps {
  interfaceId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function InterfaceDetailsModal({ 
  interfaceId, 
  open, 
  onOpenChange 
}: InterfaceDetailsModalProps) {
  
  const { data: interfaceData, isLoading } = useQuery({
    queryKey: ["/api/interfaces", interfaceId],
    queryFn: async () => {
      if (!interfaceId) return null;
      const response = await fetch(`/api/interfaces/${interfaceId}`);
      if (!response.ok) throw new Error("Failed to fetch interface");
      return response.json();
    },
    enabled: !!interfaceId,
  });

  const { data: businessProcesses = [] } = useQuery({
    queryKey: ["/api/business-processes", { interfaceId }],
    queryFn: async () => {
      if (!interfaceId) return [];
      const response = await fetch(`/api/business-processes?interfaceId=${interfaceId}`);
      if (!response.ok) throw new Error("Failed to fetch business processes");
      return response.json();
    },
    enabled: !!interfaceId,
  });

  const getStatusBadge = (status: string) => {
    const statusColors: { [key: string]: string } = {
      active: "bg-green-600 text-white",
      inactive: "bg-gray-600 text-white",
      deprecated: "bg-red-600 text-white",
      testing: "bg-yellow-600 text-white",
      development: "bg-blue-600 text-white",
    };
    return <Badge className={statusColors[status] || "bg-gray-600 text-white"}>{status}</Badge>;
  };

  const getInterfaceTypeBadge = (type: string) => {
    const typeColors: { [key: string]: string } = {
      REST: "bg-blue-600 text-white",
      SOAP: "bg-purple-600 text-white",
      GraphQL: "bg-pink-600 text-white",
      gRPC: "bg-green-600 text-white",
      WebSocket: "bg-orange-600 text-white",
      Database: "bg-yellow-600 text-white",
      "File Transfer": "bg-gray-600 text-white",
      "Message Queue": "bg-indigo-600 text-white",
    };
    return <Badge className={typeColors[type] || "bg-gray-600 text-white"}>{type}</Badge>;
  };

  if (!interfaceData && !isLoading) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-gray-800 border-gray-700 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-white flex items-center gap-3">
            <Plug className="h-6 w-6 text-gray-400" />
            {interfaceData?.imlNumber || "Loading..."}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <div className="h-32 bg-gray-700 rounded animate-pulse" />
            <div className="h-48 bg-gray-700 rounded animate-pulse" />
          </div>
        ) : interfaceData ? (
          <Tabs defaultValue="overview" className="mt-4">
            <TabsList className="grid w-full grid-cols-4 bg-gray-700">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="connectivity">Connectivity</TabsTrigger>
              <TabsTrigger value="business-processes">Business Processes</TabsTrigger>
              <TabsTrigger value="testing">Testing</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-gray-700 border-gray-600">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-gray-300">Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Status</span>
                      {getStatusBadge(interfaceData.status)}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Type</span>
                      {getInterfaceTypeBadge(interfaceData.interfaceType)}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Middleware</span>
                      <span className="text-sm text-white">{interfaceData.middleware || 'None'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Version</span>
                      <span className="text-sm text-white">v{interfaceData.version}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Last Change</span>
                      <span className="text-sm text-white">
                        {interfaceData.lastChangeDate ? 
                          format(new Date(interfaceData.lastChangeDate), "MMM d, yyyy") : 
                          "N/A"}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-700 border-gray-600">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-gray-300">Applications</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Server className="h-4 w-4 text-gray-400" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-400">Provider</p>
                          <p className="text-sm text-white font-medium">
                            {interfaceData.providerApplication?.name || "Unknown"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <ArrowRight className="h-4 w-4 text-gray-400 ml-4" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Server className="h-4 w-4 text-gray-400" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-400">Consumer</p>
                          <p className="text-sm text-white font-medium">
                            {interfaceData.consumerApplication?.name || "Unknown"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {interfaceData.description && (
                <Card className="bg-gray-700 border-gray-600">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-gray-300">Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-white">{interfaceData.description}</p>
                  </CardContent>
                </Card>
              )}

              <Card className="bg-gray-700 border-gray-600">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-gray-300">Ownership</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-gray-400">Provider Owner</p>
                      <p className="text-sm text-white">{interfaceData.providerOwner || "Not assigned"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Consumer Owner</p>
                      <p className="text-sm text-white">{interfaceData.consumerOwner || "Not assigned"}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Customer Focal</p>
                    <p className="text-sm text-white">{interfaceData.customerFocal || "Not assigned"}</p>
                  </div>
                </CardContent>
              </Card>

              {interfaceData.description && (
                <Card className="bg-gray-700 border-gray-600">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-gray-300">Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-white">{interfaceData.description}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="connectivity" className="space-y-4 mt-4">
              <Card className="bg-gray-700 border-gray-600">
                <CardHeader>
                  <CardTitle className="text-base text-white flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Connection Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Endpoint URL</p>
                    <code className="block p-2 bg-gray-800 rounded text-sm text-gray-300">
                      {interfaceData.endpoint || "Not specified"}
                    </code>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Protocol</p>
                    <p className="text-sm text-white">{interfaceData.protocol || interfaceData.interfaceType}</p>
                  </div>
                  {interfaceData.authentication && (
                    <div>
                      <p className="text-sm text-gray-400 mb-2">Authentication</p>
                      <p className="text-sm text-white">{interfaceData.authentication}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {interfaceData.connectivityTestSteps && (
                <Card className="bg-gray-700 border-gray-600">
                  <CardHeader>
                    <CardTitle className="text-base text-white flex items-center gap-2">
                      <TestTube className="h-4 w-4" />
                      Connectivity Test Steps
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                      {interfaceData.connectivityTestSteps}
                    </pre>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="business-processes" className="mt-4">
              {businessProcesses.length > 0 ? (
                <Card className="bg-gray-700 border-gray-600">
                  <CardHeader>
                    <CardTitle className="text-base text-white">
                      Associated Business Processes ({businessProcesses.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {businessProcesses.map((bp: any) => (
                        <div key={bp.id} className="p-3 bg-gray-800 rounded-lg border border-gray-600">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-white">{bp.businessProcess}</p>
                              <p className="text-sm text-gray-400">
                                {bp.LOB} - {bp.product}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                Domain: {bp.domainOwner} | IT: {bp.itOwner}
                              </p>
                            </div>
                            <Badge className="bg-gray-600 text-white">
                              v{bp.version}
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
                    <GitBranch className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-400">No business processes associated with this interface</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="testing" className="mt-4">
              <Card className="bg-gray-700 border-gray-600">
                <CardHeader>
                  <CardTitle className="text-base text-white flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    Sample Test Code
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {interfaceData.sampleTestCode ? (
                    <pre className="p-4 bg-gray-800 rounded-lg text-sm text-gray-300 overflow-x-auto">
                      <code>{interfaceData.sampleTestCode}</code>
                    </pre>
                  ) : (
                    <div className="text-center py-8">
                      <Code className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-400">No sample test code available</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {interfaceData.testingNotes && (
                <Card className="bg-gray-700 border-gray-600">
                  <CardHeader>
                    <CardTitle className="text-base text-white">Testing Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-300">{interfaceData.testingNotes}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}