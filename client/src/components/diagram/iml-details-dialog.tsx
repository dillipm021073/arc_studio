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
import { Loader2, Network, Code, TestTube, Calendar, User } from "lucide-react";
import { format } from "date-fns";

interface IMLDetailsDialogProps {
  imlId: number | null;
  interfaceData?: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function IMLDetailsDialog({ imlId, interfaceData, open, onOpenChange }: IMLDetailsDialogProps) {
  // Use passed interface data if available, otherwise fetch it
  const { data: fetchedIml, isLoading } = useQuery({
    queryKey: ["interface", imlId],
    queryFn: async () => {
      if (!imlId || interfaceData) return null;
      const response = await fetch(`/api/interfaces/${imlId}`);
      if (!response.ok) throw new Error("Failed to fetch interface details");
      return response.json();
    },
    enabled: !!imlId && open && !interfaceData,
  });

  const iml = interfaceData || fetchedIml;

  if (!imlId && !interfaceData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto bg-gray-800 border-gray-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Network className="h-5 w-5" />
            {iml?.isInternalActivity ? 'Internal Activity' : 'Interface'} Details: {iml?.imlNumber || "Loading..."}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {iml?.isInternalActivity 
              ? 'Complete information about this internal activity'
              : 'Complete information about this Interface Master List (IML) entry'}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : iml ? (
          <Tabs defaultValue="general" className="mt-4">
            <TabsList className="grid w-full grid-cols-4 bg-gray-700">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="technical">Technical</TabsTrigger>
              <TabsTrigger value="testing">Testing</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4">
              <Card className="bg-gray-700 border-gray-600">
                <CardHeader>
                  <CardTitle className="text-lg text-white">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4 text-white">
                  <div>
                    <p className="text-sm font-medium text-gray-400">IML Number</p>
                    <p className="font-medium text-white">{iml.imlNumber || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-400">Status</p>
                    <Badge variant={iml.status === "active" ? "default" : "secondary"} className="text-white">
                      {iml.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-400">Interface Type</p>
                    <p className="font-medium text-white">{iml.interfaceType || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-400">Version</p>
                    <p className="font-medium text-white">{iml.version || "1.0"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-400">Business Process</p>
                    <p className="font-medium text-white">{iml.businessProcessName || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-400">Last Updated</p>
                    <p className="font-medium text-white">
                      {iml.lastChangeDate ? format(new Date(iml.lastChangeDate), "PPP") : "N/A"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-700 border-gray-600">
                <CardHeader>
                  <CardTitle className="text-lg text-white">Applications</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-white">
                  <div>
                    <p className="text-sm font-medium text-gray-400 mb-1">Provider Application</p>
                    <div className="p-3 bg-gray-600 rounded-md">
                      <p className="font-medium text-white">{iml.providerApp?.name || "Unknown"}</p>
                      {iml.providerApp?.description && (
                        <p className="text-sm text-gray-400 mt-1">{iml.providerApp.description}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-400 mb-1">Consumer Application</p>
                    <div className="p-3 bg-gray-600 rounded-md">
                      <p className="font-medium text-white">{iml.consumerApp?.name || "Unknown"}</p>
                      {iml.consumerApp?.description && (
                        <p className="text-sm text-gray-400 mt-1">{iml.consumerApp.description}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="technical" className="space-y-4">
              <Card className="bg-gray-700 border-gray-600">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-white">
                    <Code className="h-4 w-4" />
                    Technical Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-white">
                  <div>
                    <p className="text-sm font-medium text-gray-400">Description</p>
                    <p className="mt-1 text-white">{iml.description || "No description provided"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-400">Consumer-Specific Description</p>
                    <p className="mt-1 text-white">{iml.consumerDescription || "No consumer-specific description"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-400">Sample Response</p>
                    <pre className="mt-1 p-3 bg-gray-600 rounded-md text-sm overflow-x-auto text-white">
                      {iml.sampleResponse || "No sample response provided"}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="testing" className="space-y-4">
              <Card className="bg-gray-700 border-gray-600">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-white">
                    <TestTube className="h-4 w-4" />
                    Testing Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-white">
                  <div>
                    <p className="text-sm font-medium text-gray-400">Connectivity Test Steps</p>
                    <div className="mt-2 p-3 bg-gray-600 rounded-md">
                      <pre className="text-sm whitespace-pre-wrap text-white">
                        {iml.connectivityTestSteps || "No connectivity test steps provided"}
                      </pre>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-400">Sample Test Code</p>
                    <div className="mt-2 p-3 bg-gray-600 rounded-md">
                      <pre className="text-sm whitespace-pre-wrap text-white">
                        {iml.sampleTestCode || "No sample test code provided"}
                      </pre>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <Card className="bg-gray-700 border-gray-600">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-white">
                    <Calendar className="h-4 w-4" />
                    History & Ownership
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-white">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-400">Customer Focal</p>
                      <div className="flex items-center gap-2 mt-1">
                        <User className="h-4 w-4 text-gray-400" />
                        <p className="text-white">{iml.customerFocal || "Not assigned"}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-400">Provider Owner</p>
                      <div className="flex items-center gap-2 mt-1">
                        <User className="h-4 w-4 text-gray-400" />
                        <p className="text-white">{iml.providerOwner || "Not assigned"}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-400">Consumer Owner</p>
                      <div className="flex items-center gap-2 mt-1">
                        <User className="h-4 w-4 text-gray-400" />
                        <p className="text-white">{iml.consumerOwner || "Not assigned"}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-400">Created Date</p>
                      <p className="text-white">{iml.createdAt ? format(new Date(iml.createdAt), "PPP") : "N/A"}</p>
                    </div>
                  </div>
                  
                  {iml.changeHistory && iml.changeHistory.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-400 mb-2">Change History</p>
                      <div className="space-y-2">
                        {iml.changeHistory.map((change: any, index: number) => (
                          <div key={index} className="p-3 bg-gray-600 rounded-md">
                            <p className="text-sm font-medium text-white">{change.description}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {format(new Date(change.date), "PPP")} by {change.user}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Interface not found
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}