import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plug, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import InterfaceDetailsDialog from "@/components/interfaces/interface-details-dialog";

interface Application {
  id: number;
  name: string;
}

interface Interface {
  id: number;
  imlNumber: string;
  providerApplicationId: number;
  consumerApplicationId: number;
  interfaceType: string;
  version: string;
  status: string;
  businessProcessName: string;
}

interface BusinessProcess {
  id: number;
  businessProcess: string;
  lob: string;
  product: string;
}

interface BusinessProcessInterface {
  id: number;
  businessProcessId: number;
  interfaceId: number;
  sequenceNumber: number;
  description?: string;
  businessProcess?: BusinessProcess;
}

interface ApplicationInterfacesDialogProps {
  application: Application | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ApplicationInterfacesDialog({
  application,
  open,
  onOpenChange,
}: ApplicationInterfacesDialogProps) {
  const [applicationInterfaces, setApplicationInterfaces] = useState<{
    provider: Interface[];
    consumer: Interface[];
  }>({ provider: [], consumer: [] });
  const [selectedInterfaceId, setSelectedInterfaceId] = useState<number | null>(null);
  const [isInterfaceDetailsOpen, setIsInterfaceDetailsOpen] = useState(false);

  // Fetch all interfaces
  const { data: interfaces, isLoading: interfacesLoading } = useQuery<Interface[]>({
    queryKey: ["/api/interfaces"],
    enabled: open && !!application,
  });

  // Fetch all applications to get their names
  const { data: applications } = useQuery<Application[]>({
    queryKey: ["/api/applications"],
    enabled: open && !!application,
  });

  // Fetch business processes
  const { data: businessProcesses } = useQuery<BusinessProcess[]>({
    queryKey: ["/api/business-processes"],
    enabled: open && !!application,
  });

  // Map to store business process interfaces by interface ID
  const [businessProcessMap, setBusinessProcessMap] = useState<Map<number, BusinessProcessInterface[]>>(new Map());

  // Filter interfaces where the application is either provider or consumer
  useEffect(() => {
    if (interfaces && application) {
      const providerInterfaces = interfaces.filter(
        (iml) => iml.providerApplicationId === application.id
      );
      const consumerInterfaces = interfaces.filter(
        (iml) => iml.consumerApplicationId === application.id
      );
      setApplicationInterfaces({
        provider: providerInterfaces,
        consumer: consumerInterfaces,
      });
    }
  }, [interfaces, application]);

  // Fetch business process interfaces for each interface
  useEffect(() => {
    const fetchBusinessProcessInterfaces = async () => {
      if (!applicationInterfaces.provider.length && !applicationInterfaces.consumer.length) return;

      const allInterfaces = [...applicationInterfaces.provider, ...applicationInterfaces.consumer];
      const map = new Map<number, BusinessProcessInterface[]>();

      for (const iml of allInterfaces) {
        try {
          const response = await fetch(`/api/interfaces/${iml.id}/business-processes`);
          if (response.ok) {
            const data = await response.json();
            map.set(iml.id, data);
          }
        } catch (error) {
          console.error(`Failed to fetch business processes for interface ${iml.id}:`, error);
        }
      }

      setBusinessProcessMap(map);
    };

    if (open && application) {
      fetchBusinessProcessInterfaces();
    }
  }, [applicationInterfaces, open, application]);

  const getApplicationName = (id: number) => {
    return applications?.find((app) => app.id === id)?.name || "Unknown";
  };

  const getBusinessProcessName = (bpId: number) => {
    return businessProcesses?.find((bp) => bp.id === bpId)?.businessProcess || "Unknown";
  };

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

  const handleInterfaceDoubleClick = (interfaceId: number) => {
    setSelectedInterfaceId(interfaceId);
    setIsInterfaceDetailsOpen(true);
  };

  const renderInterfaceTable = (interfaces: Interface[], role: "provider" | "consumer") => {
    if (interfaces.length === 0) {
      return (
        <div className="text-center py-8 text-gray-400">
          No interfaces where this application is the {role}.
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow className="border-gray-700">
            <TableHead className="text-gray-300">IML Number</TableHead>
            <TableHead className="text-gray-300">Type</TableHead>
            <TableHead className="text-gray-300">Version</TableHead>
            <TableHead className="text-gray-300">{role === "provider" ? "Consumer" : "Provider"}</TableHead>
            <TableHead className="text-gray-300">Business Processes</TableHead>
            <TableHead className="text-gray-300">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {interfaces.map((iml) => {
            const bpInterfaces = businessProcessMap.get(iml.id) || [];
            const partnerId = role === "provider" ? iml.consumerApplicationId : iml.providerApplicationId;
            
            return (
              <TableRow 
                key={iml.id} 
                className="border-gray-700 hover:bg-gray-700/50 cursor-pointer transition-colors" 
                onDoubleClick={() => handleInterfaceDoubleClick(iml.id)}
                title="Double-click to view interface details"
              >
                <TableCell className="font-medium text-white">
                  <div className="flex items-center space-x-2">
                    <Plug className="h-4 w-4 text-green-600" />
                    <span>{iml.imlNumber}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={`status-badge ${getInterfaceTypeColor(iml.interfaceType)}`}>
                    {iml.interfaceType}
                  </Badge>
                </TableCell>
                <TableCell className="text-gray-300">v{iml.version}</TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1 text-gray-300">
                    {role === "provider" && (
                      <>
                        <span className="font-medium text-white">{application?.name}</span>
                        <ArrowRight className="h-3 w-3 text-gray-400" />
                        <span>{getApplicationName(partnerId)}</span>
                      </>
                    )}
                    {role === "consumer" && (
                      <>
                        <span>{getApplicationName(partnerId)}</span>
                        <ArrowRight className="h-3 w-3 text-gray-400" />
                        <span className="font-medium text-white">{application?.name}</span>
                      </>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {bpInterfaces.length > 0 ? (
                    <div className="space-y-1">
                      {bpInterfaces.map((bpi) => (
                        <div key={bpi.id} className="text-sm">
                          <span className="font-medium text-gray-300">
                            {getBusinessProcessName(bpi.businessProcessId)}
                          </span>
                          {bpi.description && (
                            <span className="text-gray-400 ml-1">({bpi.description})</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-400">None</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge className={`status-badge ${getStatusColor(iml.status)}`}>
                    {iml.status.replace("_", " ")}
                  </Badge>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto bg-gray-800 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-xl text-white">
            Interfaces for Application: {application?.name}
          </DialogTitle>
          <p className="text-sm text-gray-400 mt-2">
            Double-click any interface row to view detailed information
          </p>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {interfacesLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : (
            <>
              {/* Provider Interfaces */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-white">
                  As Provider ({applicationInterfaces.provider.length} interfaces)
                </h3>
                <div className="border border-gray-700 rounded-lg overflow-hidden bg-gray-900">
                  {renderInterfaceTable(applicationInterfaces.provider, "provider")}
                </div>
              </div>

              {/* Consumer Interfaces */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-white">
                  As Consumer ({applicationInterfaces.consumer.length} interfaces)
                </h3>
                <div className="border border-gray-700 rounded-lg overflow-hidden bg-gray-900">
                  {renderInterfaceTable(applicationInterfaces.consumer, "consumer")}
                </div>
              </div>

              {/* Summary */}
              <div className="bg-gray-700 p-4 rounded-lg">
                <h4 className="font-semibold text-white mb-2">Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Total Interfaces:</span>
                    <span className="ml-2 font-medium text-white">
                      {applicationInterfaces.provider.length + applicationInterfaces.consumer.length}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Active Interfaces:</span>
                    <span className="ml-2 font-medium text-white">
                      {[...applicationInterfaces.provider, ...applicationInterfaces.consumer].filter(
                        (iml) => iml.status === "active"
                      ).length}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
      
      {/* Interface Details Dialog */}
      <InterfaceDetailsDialog
        interfaceId={selectedInterfaceId}
        open={isInterfaceDetailsOpen}
        onOpenChange={setIsInterfaceDetailsOpen}
      />
    </Dialog>
  );
}