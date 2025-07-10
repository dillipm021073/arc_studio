import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  FileText, 
  Code,
  Database,
  Globe,
  Key,
  Shield,
  Zap,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search
} from "lucide-react";
import { format } from "date-fns";

interface DocumentCapabilitiesDialogProps {
  document: {
    id: number;
    fileName: string;
    fileType: string;
    processedStatus: string;
    capabilitiesExtracted?: number;
    extractionNotes?: string;
    createdAt: string;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Capability {
  id: number;
  capabilityName: string;
  capabilityType: string;
  area?: string;
  description?: string;
  interfaceType?: string;
  protocol?: string;
  dataFormat?: string;
  status: string;
  endpoint?: string;
  extractedFrom: string;
  extractedDate: string;
  extractedBy: string;
}

export default function DocumentCapabilitiesDialog({ 
  document, 
  open, 
  onOpenChange 
}: DocumentCapabilitiesDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  
  // Fetch capabilities extracted from this specific document
  const { data: capabilities = [], isLoading } = useQuery<Capability[]>({
    queryKey: [`/api/documents/${document?.id}/capabilities`],
    queryFn: async () => {
      if (!document?.id) return [];
      const response = await fetch(`/api/documents/${document.id}/capabilities`);
      if (!response.ok) throw new Error("Failed to fetch capabilities");
      return response.json();
    },
    enabled: !!document?.id && open,
  });

  const getCapabilityIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      REST: <Globe className="h-4 w-4" />,
      SOAP: <Code className="h-4 w-4" />,
      Database: <Database className="h-4 w-4" />,
      Authentication: <Key className="h-4 w-4" />,
      Security: <Shield className="h-4 w-4" />,
      api: <Globe className="h-4 w-4" />,
      interface: <Zap className="h-4 w-4" />,
    };
    return icons[type] || <FileText className="h-4 w-4" />;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
      available: { color: "bg-green-600", icon: <CheckCircle className="h-3 w-3" /> },
      in_use: { color: "bg-blue-600", icon: <CheckCircle className="h-3 w-3" /> },
      deprecated: { color: "bg-yellow-600", icon: <AlertCircle className="h-3 w-3" /> },
      planned: { color: "bg-purple-600", icon: <AlertCircle className="h-3 w-3" /> },
    };

    const config = statusConfig[status] || { color: "bg-gray-600", icon: null };

    return (
      <Badge className={`${config.color} text-white flex items-center gap-1`}>
        {config.icon}
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  // Filter capabilities based on search
  const filteredCapabilities = capabilities.filter((cap) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      cap.capabilityName.toLowerCase().includes(search) ||
      cap.area?.toLowerCase().includes(search) ||
      cap.description?.toLowerCase().includes(search) ||
      cap.endpoint?.toLowerCase().includes(search) ||
      cap.interfaceType?.toLowerCase().includes(search)
    );
  });

  // Group filtered capabilities by area
  const groupedCapabilities = filteredCapabilities.reduce((acc, cap) => {
    const area = cap.area || "Other";
    if (!acc[area]) acc[area] = [];
    acc[area].push(cap);
    return acc;
  }, {} as Record<string, Capability[]>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-gray-800 border-gray-700 max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl text-white flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Document Capabilities
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            <div className="flex flex-col gap-1 mt-2">
              <span className="font-medium text-white">{document?.fileName}</span>
              <span className="text-sm">
                Processed on {document?.createdAt && format(new Date(document.createdAt), "MMM d, yyyy HH:mm")}
              </span>
              {document?.processedStatus === "completed" && (
                <span className="text-sm">
                  {document?.capabilitiesExtracted || 0} capabilities extracted
                </span>
              )}
              {document?.extractionNotes && (
                <span className="text-sm text-yellow-400 mt-1">{document.extractionNotes}</span>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>

        {/* Search Bar */}
        {capabilities.length > 0 && (
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search capabilities by name, area, description, or type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
            />
            {searchTerm && (
              <p className="text-xs text-gray-400 mt-1">
                Found {filteredCapabilities.length} of {capabilities.length} capabilities
              </p>
            )}
          </div>
        )}

        <ScrollArea className="mt-4 max-h-[60vh]">
          {isLoading ? (
            <div className="space-y-4">
              <div className="h-24 bg-gray-700 rounded animate-pulse" />
              <div className="h-24 bg-gray-700 rounded animate-pulse" />
            </div>
          ) : filteredCapabilities.length === 0 && searchTerm ? (
            <Card className="bg-gray-700 border-gray-600">
              <CardContent className="text-center py-12">
                <Search className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-400">
                  No capabilities match "{searchTerm}"
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Try adjusting your search terms
                </p>
              </CardContent>
            </Card>
          ) : capabilities.length === 0 ? (
            <Card className="bg-gray-700 border-gray-600">
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-400">
                  {document?.processedStatus === "failed" 
                    ? "Extraction failed. Please check the extraction notes."
                    : "No capabilities found in this document."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedCapabilities).map(([area, caps]) => (
                <div key={area}>
                  <h3 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                    {area}
                    <Badge className="bg-gray-600 text-white text-xs">{caps.length}</Badge>
                  </h3>
                  <div className="space-y-2">
                    {caps.map((capability) => (
                      <Card key={capability.id} className="bg-gray-700 border-gray-600">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {getCapabilityIcon(capability.capabilityType)}
                              <h4 className="text-white font-medium">{capability.capabilityName}</h4>
                            </div>
                            {getStatusBadge(capability.status)}
                          </div>
                          
                          {capability.description && (
                            <p className="text-sm text-gray-400 mb-2">{capability.description}</p>
                          )}
                          
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {capability.interfaceType && (
                              <div>
                                <span className="text-gray-500">Interface:</span>
                                <span className="text-gray-300 ml-1">{capability.interfaceType}</span>
                              </div>
                            )}
                            {capability.protocol && (
                              <div>
                                <span className="text-gray-500">Protocol:</span>
                                <span className="text-gray-300 ml-1">{capability.protocol}</span>
                              </div>
                            )}
                            {capability.dataFormat && (
                              <div>
                                <span className="text-gray-500">Format:</span>
                                <span className="text-gray-300 ml-1">{capability.dataFormat}</span>
                              </div>
                            )}
                            {capability.endpoint && (
                              <div className="col-span-2">
                                <span className="text-gray-500">Endpoint:</span>
                                <span className="text-gray-300 ml-1 font-mono text-xs">{capability.endpoint}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="mt-2 pt-2 border-t border-gray-600 text-xs text-gray-500">
                            Extracted by {capability.extractedBy} on {format(new Date(capability.extractedDate), "MMM d, yyyy")}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}