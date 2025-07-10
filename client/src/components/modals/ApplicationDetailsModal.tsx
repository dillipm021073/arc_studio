import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Server, Calendar, Clock, Cloud, Monitor, ExternalLink, 
  Activity, Users, GitBranch, Plug, FileText, Zap
} from "lucide-react";
import { format } from "date-fns";
import ApplicationCapabilities from "@/components/applications/application-capabilities";

interface ApplicationDetailsModalProps {
  applicationId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ApplicationDetailsModal({ 
  applicationId, 
  open, 
  onOpenChange 
}: ApplicationDetailsModalProps) {
  
  const { data: application, isLoading } = useQuery({
    queryKey: ["/api/applications", applicationId],
    queryFn: async () => {
      if (!applicationId) return null;
      const response = await fetch(`/api/applications/${applicationId}`);
      if (!response.ok) throw new Error("Failed to fetch application");
      return response.json();
    },
    enabled: !!applicationId,
  });

  const { data: interfaces = [] } = useQuery({
    queryKey: ["/api/interfaces", { providerId: applicationId }],
    queryFn: async () => {
      if (!applicationId) return [];
      const response = await fetch(`/api/interfaces?providerApplicationId=${applicationId}`);
      if (!response.ok) throw new Error("Failed to fetch interfaces");
      return response.json();
    },
    enabled: !!applicationId,
  });

  const { data: consumedInterfaces = [] } = useQuery({
    queryKey: ["/api/interfaces", { consumerId: applicationId }],
    queryFn: async () => {
      if (!applicationId) return [];
      const response = await fetch(`/api/interfaces?consumerApplicationId=${applicationId}`);
      if (!response.ok) throw new Error("Failed to fetch consumed interfaces");
      return response.json();
    },
    enabled: !!applicationId,
  });

  const getStatusBadge = (status: string) => {
    const statusColors: { [key: string]: string } = {
      active: "bg-green-600 text-white",
      inactive: "bg-gray-600 text-white",
      deprecated: "bg-red-600 text-white",
      development: "bg-blue-600 text-white",
      testing: "bg-yellow-600 text-white",
    };
    return <Badge className={statusColors[status] || "bg-gray-600 text-white"}>{status}</Badge>;
  };

  const getDeploymentIcon = (deployment: string) => {
    return deployment === "cloud" ? <Cloud className="h-4 w-4" /> : <Monitor className="h-4 w-4" />;
  };

  if (!application && !isLoading) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-gray-800 border-gray-700 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-white flex items-center gap-3">
            <Server className="h-6 w-6 text-gray-400" />
            {application?.name || "Loading..."}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <div className="h-32 bg-gray-700 rounded animate-pulse" />
            <div className="h-48 bg-gray-700 rounded animate-pulse" />
          </div>
        ) : application ? (
          <Tabs defaultValue="overview" className="mt-4">
            <TabsList className="grid w-full grid-cols-4 bg-gray-700">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="interfaces">Interfaces</TabsTrigger>
              <TabsTrigger value="capabilities">Capabilities</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-gray-700 border-gray-600">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-gray-300">Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">AML Number</span>
                      <span className="text-sm font-mono text-white">{application.amlNumber}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Status</span>
                      {getStatusBadge(application.status)}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">OS</span>
                      <span className="text-sm text-white">{application.os}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Deployment</span>
                      <div className="flex items-center gap-2 text-white">
                        {getDeploymentIcon(application.deployment)}
                        <span className="text-sm">{application.deployment}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Uptime</span>
                      <span className="text-sm text-white">{application.uptime}%</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-700 border-gray-600">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-gray-300">Important Dates</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">First Active</span>
                      <span className="text-sm text-white">
                        {application.firstActiveDate ? 
                          format(new Date(application.firstActiveDate), "MMM d, yyyy") : 
                          "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Last Change</span>
                      <span className="text-sm text-white">
                        {application.lastChangeDate ? 
                          format(new Date(application.lastChangeDate), "MMM d, yyyy") : 
                          "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Created</span>
                      <span className="text-sm text-white">
                        {application.createdAt ? 
                          format(new Date(application.createdAt), "MMM d, yyyy") : 
                          "N/A"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {application.description && (
                <Card className="bg-gray-700 border-gray-600">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-gray-300">Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-300">{application.description}</p>
                  </CardContent>
                </Card>
              )}

              {application.purpose && (
                <Card className="bg-gray-700 border-gray-600">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-gray-300">Business Purpose</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-300">{application.purpose}</p>
                  </CardContent>
                </Card>
              )}

              <Card className="bg-gray-700 border-gray-600">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-gray-300">Interface Capabilities</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Provides External Interface</span>
                    <Badge className={application.provides_ext_interface ? "bg-green-600 text-white" : "bg-gray-600 text-white"}>
                      {application.provides_ext_interface ? "Yes" : "No"}
                    </Badge>
                  </div>
                  {application.provides_ext_interface && application.prov_interface_type && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Interface Type Provided</span>
                      <span className="text-sm text-white">{application.prov_interface_type}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Consumes External Interfaces</span>
                    <Badge className={application.consumes_ext_interfaces ? "bg-green-600 text-white" : "bg-gray-600 text-white"}>
                      {application.consumes_ext_interfaces ? "Yes" : "No"}
                    </Badge>
                  </div>
                  {application.consumes_ext_interfaces && application.cons_interface_type && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Interface Type Consumed</span>
                      <span className="text-sm text-white">{application.cons_interface_type}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="interfaces" className="space-y-4 mt-4">
              {interfaces.length > 0 && (
                <Card className="bg-gray-700 border-gray-600">
                  <CardHeader>
                    <CardTitle className="text-base text-white flex items-center gap-2">
                      <ExternalLink className="h-4 w-4" />
                      Provided Interfaces ({interfaces.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {interfaces.map((iface: any) => (
                        <div key={iface.id} className="p-3 bg-gray-800 rounded-lg border border-gray-600">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-white">{iface.imlNumber}</p>
                              <p className="text-sm text-gray-400">
                                {iface.interfaceType} - v{iface.version}
                              </p>
                              <p className="text-sm text-gray-400">
                                Consumer: {iface.consumerApplication?.name || "Unknown"}
                              </p>
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
              )}

              {consumedInterfaces.length > 0 && (
                <Card className="bg-gray-700 border-gray-600">
                  <CardHeader>
                    <CardTitle className="text-base text-white flex items-center gap-2">
                      <Plug className="h-4 w-4" />
                      Consumed Interfaces ({consumedInterfaces.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {consumedInterfaces.map((iface: any) => (
                        <div key={iface.id} className="p-3 bg-gray-800 rounded-lg border border-gray-600">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-white">{iface.imlNumber}</p>
                              <p className="text-sm text-gray-400">
                                {iface.interfaceType} - v{iface.version}
                              </p>
                              <p className="text-sm text-gray-400">
                                Provider: {iface.providerApplication?.name || "Unknown"}
                              </p>
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
              )}

              {interfaces.length === 0 && consumedInterfaces.length === 0 && (
                <Card className="bg-gray-700 border-gray-600">
                  <CardContent className="text-center py-8">
                    <Plug className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-400">No interfaces found for this application</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="capabilities" className="mt-4">
              <ApplicationCapabilities applicationId={application.id} />
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              <Card className="bg-gray-700 border-gray-600">
                <CardContent className="text-center py-8">
                  <Clock className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-400">Change history will be displayed here</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}