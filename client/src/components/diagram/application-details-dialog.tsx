import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Server, Cloud, Database, Calendar, Activity, GitBranch } from "lucide-react";
import { format } from "date-fns";

interface ApplicationDetailsDialogProps {
  applicationId: number | null;
  applicationData?: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ApplicationDetailsDialog({ 
  applicationId, 
  applicationData, 
  open, 
  onOpenChange 
}: ApplicationDetailsDialogProps) {
  // Use passed application data if available, otherwise fetch it
  const { data: fetchedApp, isLoading } = useQuery({
    queryKey: ["application", applicationId],
    queryFn: async () => {
      if (!applicationId || applicationData) return null;
      const response = await fetch(`/api/applications/${applicationId}`);
      if (!response.ok) throw new Error("Failed to fetch application details");
      return response.json();
    },
    enabled: !!applicationId && open && !applicationData,
  });

  const app = applicationData || fetchedApp;

  if (!applicationId && !applicationData) return null;

  const getDeploymentIcon = () => {
    if (app?.deployment === "cloud") {
      return <Cloud className="h-5 w-5 text-blue-500" />;
    } else if (app?.deployment === "on-premise") {
      return <Server className="h-5 w-5 text-gray-500" />;
    }
    return <Database className="h-5 w-5 text-primary" />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto bg-gray-800 border-gray-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            {getDeploymentIcon()}
            Application Details: {app?.name || "Loading..."}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Complete information about this application system
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : app ? (
          <Tabs defaultValue="general" className="mt-4">
            <TabsList className="grid w-full grid-cols-4 bg-gray-700">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="technical">Technical</TabsTrigger>
              <TabsTrigger value="interfaces">Interfaces</TabsTrigger>
              <TabsTrigger value="metadata">Metadata</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4">
              <Card className="bg-gray-700 border-gray-600">
                <CardHeader>
                  <CardTitle className="text-lg text-white">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4 text-white">
                  <div>
                    <p className="text-sm font-medium text-gray-400">Application Name</p>
                    <p className="font-medium text-white">{app.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-400">Status</p>
                    <Badge variant={app.status === "active" ? "default" : "secondary"} className="text-white">
                      {app.status}
                    </Badge>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-gray-400">Description</p>
                    <p className="mt-1 text-white">{app.description || "No description provided"}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-gray-400">Purpose</p>
                    <p className="mt-1 text-white">{app.purpose || "No purpose defined"}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-700 border-gray-600">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-white">
                    <Activity className="h-4 w-4" />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-white">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-400">Uptime</p>
                      <p className="text-2xl font-bold text-green-600">{app.uptime || "99.9"}%</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-400">Deployment Type</p>
                      <div className="flex items-center gap-2 mt-1">
                        {getDeploymentIcon()}
                        <p className="font-medium capitalize text-white">{app.deployment}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="technical" className="space-y-4">
              <Card className="bg-gray-700 border-gray-600">
                <CardHeader>
                  <CardTitle className="text-lg text-white">Technical Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-white">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-400">Operating System</p>
                      <p className="font-medium text-white">{app.os || "Not specified"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-400">Deployment</p>
                      <p className="font-medium capitalize text-white">{app.deployment}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="interfaces" className="space-y-4">
              <Card className="bg-gray-700 border-gray-600">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-white">
                    <GitBranch className="h-4 w-4" />
                    Interface Capabilities
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-white">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-400">Provides External Interfaces</p>
                      <Badge variant={app.providesExtInterface ? "default" : "secondary"}>
                        {app.providesExtInterface ? "Yes" : "No"}
                      </Badge>
                      {app.providesExtInterface && app.provInterfaceType && (
                        <p className="text-sm text-gray-400 mt-1">
                          Type: {app.provInterfaceType}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-400">Consumes External Interfaces</p>
                      <Badge variant={app.consumesExtInterfaces ? "default" : "secondary"}>
                        {app.consumesExtInterfaces ? "Yes" : "No"}
                      </Badge>
                      {app.consumesExtInterfaces && app.consInterfaceType && (
                        <p className="text-sm text-gray-400 mt-1">
                          Type: {app.consInterfaceType}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="metadata" className="space-y-4">
              <Card className="bg-gray-700 border-gray-600">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-white">
                    <Calendar className="h-4 w-4" />
                    Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-white">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-400">First Active Date</p>
                      <p className="font-medium text-white">
                        {app.firstActiveDate ? format(new Date(app.firstActiveDate), "PPP") : "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-400">Last Change Date</p>
                      <p className="font-medium text-white">
                        {app.lastChangeDate ? format(new Date(app.lastChangeDate), "PPP") : "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-400">Created At</p>
                      <p className="font-medium text-white">
                        {app.createdAt ? format(new Date(app.createdAt), "PPP") : "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-400">Updated At</p>
                      <p className="font-medium text-white">
                        {app.updatedAt ? format(new Date(app.updatedAt), "PPP") : "N/A"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center py-8 text-gray-400">
            Application not found
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}