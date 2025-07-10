import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plug, Building, ArrowRight, Briefcase, Clock, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface InterfaceDetailsDialogProps {
  interfaceId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface InterfaceDetails {
  id: number;
  imlNumber: string;
  description?: string;
  providerApplicationId: number;
  consumerApplicationId: number;
  interfaceType: string;
  version: string;
  status: string;
  businessProcessName: string;
  lastChangeDate: string;
  providerApplication?: {
    id: number;
    name: string;
    description: string;
  };
  consumerApplication?: {
    id: number;
    name: string;
    description: string;
  };
}

interface BusinessProcessInterface {
  id: number;
  businessProcessId: number;
  interfaceId: number;
  sequenceNumber: number;
  description?: string;
  businessProcess?: {
    id: number;
    businessProcess: string;
    lob: string;
    product: string;
    version: string;
    domainOwner?: string;
    itOwner?: string;
    status: string;
  };
}

export default function InterfaceDetailsDialog({
  interfaceId,
  open,
  onOpenChange,
}: InterfaceDetailsDialogProps) {
  const [businessProcesses, setBusinessProcesses] = useState<BusinessProcessInterface[]>([]);

  // Fetch interface details
  const { data: interfaceDetails, isLoading } = useQuery<InterfaceDetails>({
    queryKey: ["/api/interfaces", interfaceId],
    queryFn: async () => {
      if (!interfaceId) return null;
      const response = await fetch(`/api/interfaces/${interfaceId}`);
      if (!response.ok) throw new Error("Failed to fetch interface details");
      return response.json();
    },
    enabled: open && !!interfaceId,
  });

  // Fetch business processes for this interface
  useEffect(() => {
    const fetchBusinessProcesses = async () => {
      if (!interfaceId || !open) return;
      
      try {
        const response = await fetch(`/api/interfaces/${interfaceId}/business-processes`);
        if (response.ok) {
          const data = await response.json();
          setBusinessProcesses(data);
        }
      } catch (error) {
        console.error("Failed to fetch business processes:", error);
      }
    };

    fetchBusinessProcesses();
  }, [interfaceId, open]);

  const getInterfaceTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "rest": return "bg-blue-600 text-white";
      case "soap": return "bg-green-600 text-white";
      case "graphql": return "bg-purple-600 text-white";
      case "messaging": return "bg-orange-600 text-white";
      case "database": return "bg-gray-600 text-white";
      case "file": return "bg-yellow-600 text-white";
      default: return "bg-gray-600 text-white";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active": return "bg-green-600 text-white";
      case "inactive": return "bg-red-600 text-white";
      case "maintenance": return "bg-blue-600 text-white";
      case "deprecated": return "bg-orange-600 text-white";
      case "under_review": return "bg-orange-600 text-white";
      default: return "bg-gray-600 text-white";
    }
  };

  if (!interfaceDetails && !isLoading) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto bg-gray-800 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-xl text-white flex items-center">
            <Plug className="mr-2 h-5 w-5 text-green-600" />
            Interface Details: {interfaceDetails?.imlNumber || 'Loading...'}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4 mt-4">
            <Skeleton className="h-32 w-full bg-gray-700" />
            <Skeleton className="h-24 w-full bg-gray-700" />
            <Skeleton className="h-24 w-full bg-gray-700" />
          </div>
        ) : interfaceDetails ? (
          <div className="space-y-6 mt-4">
            {/* Basic Information */}
            <Card className="bg-gray-900 border-gray-600">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-white flex items-center">
                  <Plug className="mr-2 h-5 w-5 text-green-600" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-300">IML Number</label>
                    <p className="text-white font-mono bg-gray-700 px-3 py-2 rounded">
                      {interfaceDetails.imlNumber}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-300">Version</label>
                    <p className="text-white bg-gray-700 px-3 py-2 rounded">
                      v{interfaceDetails.version}
                    </p>
                  </div>
                </div>
                
                {interfaceDetails.description && (
                  <div>
                    <label className="text-sm font-medium text-gray-300">Description</label>
                    <p className="text-white bg-gray-700 px-3 py-2 rounded">
                      {interfaceDetails.description}
                    </p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-300">Interface Type</label>
                    <div className="mt-1">
                      <Badge className={getInterfaceTypeColor(interfaceDetails.interfaceType)}>
                        {interfaceDetails.interfaceType}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-300">Status</label>
                    <div className="mt-1">
                      <Badge className={getStatusColor(interfaceDetails.status)}>
                        {interfaceDetails.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-300">Last Change Date</label>
                  <p className="text-white bg-gray-700 px-3 py-2 rounded flex items-center">
                    <Clock className="mr-2 h-4 w-4 text-gray-400" />
                    {new Date(interfaceDetails.lastChangeDate).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Applications */}
            <Card className="bg-gray-900 border-gray-600">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-white flex items-center">
                  <Building className="mr-2 h-5 w-5 text-blue-600" />
                  Connected Applications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center space-x-4 p-4 bg-gray-700 rounded-lg">
                  <div className="text-center">
                    <div className="text-sm text-gray-300 mb-1">Provider</div>
                    <div className="font-medium text-white">
                      {interfaceDetails.providerApplication?.name || `App ${interfaceDetails.providerApplicationId}`}
                    </div>
                    {interfaceDetails.providerApplication?.description && (
                      <div className="text-xs text-gray-400 mt-1">
                        {interfaceDetails.providerApplication.description}
                      </div>
                    )}
                  </div>
                  
                  <ArrowRight className="h-6 w-6 text-green-600" />
                  
                  <div className="text-center">
                    <div className="text-sm text-gray-300 mb-1">Consumer</div>
                    <div className="font-medium text-white">
                      {interfaceDetails.consumerApplication?.name || `App ${interfaceDetails.consumerApplicationId}`}
                    </div>
                    {interfaceDetails.consumerApplication?.description && (
                      <div className="text-xs text-gray-400 mt-1">
                        {interfaceDetails.consumerApplication.description}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Business Processes */}
            {businessProcesses.length > 0 && (
              <Card className="bg-gray-900 border-gray-600">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-white flex items-center">
                    <Briefcase className="mr-2 h-5 w-5 text-purple-600" />
                    Business Processes ({businessProcesses.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {businessProcesses.map((bpi) => (
                      <div key={bpi.id} className="p-3 bg-gray-700 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="font-medium text-white">
                              {bpi.businessProcess?.businessProcess || 'Unknown Process'}
                            </div>
                            {bpi.description && (
                              <div className="text-sm text-gray-300">
                                {bpi.description}
                              </div>
                            )}
                            <div className="flex items-center gap-4 text-xs text-gray-400">
                              {bpi.businessProcess?.lob && (
                                <span>LOB: {bpi.businessProcess.lob}</span>
                              )}
                              {bpi.businessProcess?.product && (
                                <span>Product: {bpi.businessProcess.product}</span>
                              )}
                              <span>Sequence: {bpi.sequenceNumber}</span>
                            </div>
                            {(bpi.businessProcess?.domainOwner || bpi.businessProcess?.itOwner) && (
                              <div className="flex items-center gap-4 text-xs text-gray-400">
                                {bpi.businessProcess.domainOwner && (
                                  <span className="flex items-center">
                                    <User className="mr-1 h-3 w-3" />
                                    Domain: {bpi.businessProcess.domainOwner}
                                  </span>
                                )}
                                {bpi.businessProcess.itOwner && (
                                  <span className="flex items-center">
                                    <User className="mr-1 h-3 w-3" />
                                    IT: {bpi.businessProcess.itOwner}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col items-end space-y-1">
                            <Badge className={getStatusColor(bpi.businessProcess?.status || 'active')}>
                              {bpi.businessProcess?.status || 'active'}
                            </Badge>
                            {bpi.businessProcess?.version && (
                              <span className="text-xs text-gray-400">
                                v{bpi.businessProcess.version}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            Interface not found
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}