import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock,
  Zap,
  Link,
  Filter,
  Plus,
  Search,
  AlertCircle,
  Download,
  Trash2,
  Eye,
  Server,
  Code,
  Plug,
  Cloud,
  Sparkles
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/use-permissions";
import AutoXExtractionDialog from "./autox-extraction-dialog";

interface ApplicationCapabilitiesProps {
  applicationId: number;
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
  isActive: boolean;
  status: string;
  endpoint?: string;
  sampleRequest?: string;
  sampleResponse?: string;
  documentation?: string;
  mappedImlId?: number;
  extractedFrom?: string;
  extractedDate?: string;
  extractedBy?: string;
  confidence?: number;
  createdAt: string;
  updatedAt: string;
}

interface UploadedDocument {
  id: number;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedBy: string;
  processedStatus: string;
  capabilitiesExtracted?: number;
  extractionNotes?: string;
  createdAt: string;
}

export default function ApplicationCapabilities({ applicationId }: ApplicationCapabilitiesProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCapability, setSelectedCapability] = useState<Capability | null>(null);
  const [showAutoXDialog, setShowAutoXDialog] = useState(false);
  const [isFallbackMode, setIsFallbackMode] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { canUpdate, canDelete } = usePermissions();

  // Fetch capabilities
  const { data: capabilities = [], isLoading: loadingCapabilities } = useQuery({
    queryKey: [`/api/applications/${applicationId}/capabilities`],
    queryFn: async () => {
      const response = await fetch(`/api/applications/${applicationId}/capabilities`);
      if (!response.ok) throw new Error("Failed to fetch capabilities");
      return response.json();
    },
  });

  // Fetch uploaded documents
  const { data: documents = [], isLoading: loadingDocuments } = useQuery({
    queryKey: [`/api/applications/${applicationId}/documents`],
    queryFn: async () => {
      const response = await fetch(`/api/applications/${applicationId}/documents`);
      if (!response.ok) throw new Error("Failed to fetch documents");
      return response.json();
    },
  });

  // AutoX fallback extraction
  const autoXFallbackMutation = useMutation({
    mutationFn: async (filename: string) => {
      const response = await fetch(`/api/applications/${applicationId}/extract-autox`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ 
          filename: filename,
          fileType: filename.toLowerCase().endsWith('.pdf') ? 'pdf' : 'document'
        }),
      });

      if (!response.ok) {
        throw new Error("AutoX extraction also failed");
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Document processed via AutoX fallback",
        description: (
          <div className="space-y-1">
            <p>Extracted {data.capabilitiesExtracted || 0} capabilities using AutoX AI</p>
            <p className="text-yellow-400">Regular parsing failed, used AutoX as backup</p>
          </div>
        ),
      });
      
      queryClient.invalidateQueries({ queryKey: [`/api/applications/${applicationId}/capabilities`] });
      queryClient.invalidateQueries({ queryKey: [`/api/applications/${applicationId}/documents`] });
      setSelectedFile(null);
      setIsFallbackMode(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Both parsing methods failed",
        description: `Regular parsing and AutoX extraction both failed: ${error.message}`,
        variant: "destructive",
      });
      setIsFallbackMode(false);
    },
  });

  // Upload document mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("document", file);

      const response = await fetch(`/api/applications/${applicationId}/upload-capabilities`, {
        method: "POST",
        body: formData,
        credentials: "include", // Include cookies for authentication
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to upload document");
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Document processed successfully",
        description: `Extracted ${data.capabilitiesExtracted} capabilities`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/applications/${applicationId}/capabilities`] });
      queryClient.invalidateQueries({ queryKey: [`/api/applications/${applicationId}/documents`] });
      setSelectedFile(null);
    },
    onError: (error: Error) => {
      // Check if we should try AutoX fallback
      if (selectedFile && !isFallbackMode) {
        console.log("Regular parsing failed, trying AutoX fallback...");
        setIsFallbackMode(true);
        
        toast({
          title: "Trying AutoX fallback",
          description: "Regular parsing failed, attempting AutoX extraction...",
          variant: "default",
        });
        
        // Try AutoX extraction with the filename
        autoXFallbackMutation.mutate(selectedFile.name);
      } else {
        toast({
          title: "Upload failed",
          description: error.message,
          variant: "destructive",
        });
        setIsFallbackMode(false);
      }
    },
  });

  // Delete document mutation
  const deleteDocumentMutation = useMutation({
    mutationFn: async (documentId: number) => {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete document");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Document deleted",
        description: "Document has been deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/applications/${applicationId}/documents`] });
    },
  });

  // Match capability with IML mutation
  const matchImlMutation = useMutation({
    mutationFn: async ({ capabilityId, imlId }: { capabilityId: number; imlId: number }) => {
      const response = await fetch(`/api/capabilities/${capabilityId}/match-iml`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imlId }),
      });

      if (!response.ok) throw new Error("Failed to match capability with IML");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Capability matched",
        description: "Capability has been matched with IML",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/applications/${applicationId}/capabilities`] });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      await uploadMutation.mutateAsync(selectedFile);
    } finally {
      setIsUploading(false);
    }
  };

  // Group capabilities by area
  const groupedCapabilities = capabilities.reduce((acc: Record<string, Capability[]>, cap: Capability) => {
    const area = cap.area || "Other";
    if (!acc[area]) acc[area] = [];
    acc[area].push(cap);
    return acc;
  }, {});

  // Apply filters
  const filteredGroups = Object.entries(groupedCapabilities).reduce((acc: Record<string, Capability[]>, [area, caps]) => {
    const filtered = (caps as Capability[]).filter((cap) => {
      const matchesStatus = filterStatus === "all" || cap.status === filterStatus;
      const matchesSearch = !searchTerm || 
        cap.capabilityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cap.description?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    });
    
    if (filtered.length > 0) {
      acc[area] = filtered;
    }
    return acc;
  }, {});

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
      in_use: { color: "bg-green-600", icon: <CheckCircle className="h-3 w-3" /> },
      available: { color: "bg-blue-600", icon: <Zap className="h-3 w-3" /> },
      deprecated: { color: "bg-red-600", icon: <XCircle className="h-3 w-3" /> },
      planned: { color: "bg-yellow-600", icon: <Clock className="h-3 w-3" /> },
    };

    const config = statusConfig[status] || { color: "bg-gray-600", icon: null };

    return (
      <Badge className={`${config.color} text-white flex items-center gap-1`}>
        {config.icon}
        {status}
      </Badge>
    );
  };

  const getCapabilityTypeIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      interface: <Link className="h-4 w-4" />,
      api: <Zap className="h-4 w-4" />,
      service: <Server className="h-4 w-4" />,
      function: <Code className="h-4 w-4" />,
      integration: <Plug className="h-4 w-4" />,
    };
    return icons[type] || <FileText className="h-4 w-4" />;
  };

  if (loadingCapabilities || loadingDocuments) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-gray-700 rounded animate-pulse" />
        <div className="h-48 bg-gray-700 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Upload Section */}
      <Card className="bg-gray-700 border-gray-600">
        <CardHeader>
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Capability Document
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="file-upload" className="text-gray-300">
                Select a document containing application capabilities
              </Label>
              <div className="mt-2 flex items-center gap-4">
                <Input
                  id="file-upload"
                  type="file"
                  accept=".pdf,.docx,.doc,.txt,.xlsx,.xls"
                  onChange={handleFileSelect}
                  className="flex-1 bg-gray-800 border-gray-600 text-white"
                  disabled={!canUpdate('applications')}
                />
                <Button
                  onClick={handleUpload}
                  disabled={!selectedFile || isUploading || !canUpdate('applications')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isUploading ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload & Extract
                    </>
                  )}
                </Button>
              </div>
              {selectedFile && (
                <p className="mt-2 text-sm text-gray-400">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>

            {/* AutoX Extraction Option */}
            <div className="pt-4 border-t border-gray-600">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-300">AutoX AI Extraction</h4>
                  <p className="text-xs text-gray-400 mt-1">
                    Extract capabilities from documents already uploaded to AutoX Cloud
                  </p>
                </div>
                <Button
                  onClick={() => setShowAutoXDialog(true)}
                  disabled={!canUpdate('applications')}
                  variant="outline"
                  className="bg-gray-600 border-gray-500 text-white hover:bg-gray-500"
                >
                  <Cloud className="h-4 w-4 mr-2" />
                  Use AutoX
                </Button>
              </div>
            </div>

            {/* Recent Documents */}
            {documents.length > 0 && (
              <div className="pt-4 border-t border-gray-600">
                <h4 className="text-sm font-medium text-gray-300 mb-2">Recent Documents</h4>
                <div className="space-y-2">
                  {documents.slice(0, 3).map((doc: UploadedDocument) => (
                    <div key={doc.id} className="flex items-center justify-between p-2 bg-gray-800 rounded">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-white">{doc.fileName}</p>
                          <p className="text-xs text-gray-400">
                            {format(new Date(doc.createdAt), "MMM d, yyyy")} by {doc.uploadedBy}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {doc.processedStatus === "completed" && (
                          <Badge className="bg-green-600 text-white">
                            {doc.capabilitiesExtracted} extracted
                          </Badge>
                        )}
                        {canDelete('applications') && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteDocumentMutation.mutate(doc.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Capabilities List */}
      <Card className="bg-gray-700 border-gray-600">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg text-white">
              Capabilities ({capabilities.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search capabilities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64 bg-gray-800 border-gray-600 text-white pl-10"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="all" className="bg-gray-800 text-white">All Status</option>
                <option value="in_use" className="bg-gray-800 text-white">In Use</option>
                <option value="available" className="bg-gray-800 text-white">Available</option>
                <option value="deprecated" className="bg-gray-800 text-white">Deprecated</option>
                <option value="planned" className="bg-gray-800 text-white">Planned</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {Object.keys(filteredGroups).length === 0 ? (
            <div className="text-center py-8">
              <Zap className="h-12 w-12 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-400">
                {searchTerm || filterStatus !== "all" 
                  ? "No capabilities match your filters"
                  : "No capabilities found. Upload a document to extract capabilities."}
              </p>
            </div>
          ) : (
            <Accordion type="multiple" className="space-y-2">
              {Object.entries(filteredGroups).map(([area, caps]) => (
                <AccordionItem key={area} value={area} className="bg-gray-800 border-gray-600 rounded-lg">
                  <AccordionTrigger className="px-4 hover:no-underline hover:bg-gray-700 transition-colors">
                    <div className="flex items-center justify-between w-full">
                      <span className="text-white font-medium">{area}</span>
                      <Badge className="bg-gray-600 text-white mr-2">{caps.length}</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-2">
                      {caps.map((capability) => (
                        <div
                          key={capability.id}
                          className="p-3 bg-gray-700 rounded-lg border border-gray-600 hover:border-gray-500 transition-colors cursor-pointer"
                          onClick={() => setSelectedCapability(capability)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                {getCapabilityTypeIcon(capability.capabilityType)}
                                <h4 className="font-medium text-white">{capability.capabilityName}</h4>
                              </div>
                              {capability.description && (
                                <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                                  {capability.description}
                                </p>
                              )}
                              <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                                {capability.interfaceType && (
                                  <span>{capability.interfaceType}</span>
                                )}
                                {capability.protocol && (
                                  <span>{capability.protocol}</span>
                                )}
                                {capability.dataFormat && (
                                  <span>{capability.dataFormat}</span>
                                )}
                                {capability.confidence && (
                                  <span className="flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    {(capability.confidence * 100).toFixed(0)}% confidence
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              {getStatusBadge(capability.status)}
                              {capability.mappedImlId && (
                                <Badge className="bg-purple-600 text-white text-xs">
                                  <Link className="h-3 w-3 mr-1" />
                                  Linked to IML
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>

      {/* Capability Details Dialog */}
      <Dialog open={!!selectedCapability} onOpenChange={() => setSelectedCapability(null)}>
        <DialogContent className="max-w-2xl bg-gray-800 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-xl text-white">
              {selectedCapability?.capabilityName}
            </DialogTitle>
          </DialogHeader>
          {selectedCapability && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-400">Type</Label>
                  <p className="text-white">{selectedCapability.capabilityType}</p>
                </div>
                <div>
                  <Label className="text-gray-400">Area</Label>
                  <p className="text-white">{selectedCapability.area || "Other"}</p>
                </div>
                <div>
                  <Label className="text-gray-400">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedCapability.status)}</div>
                </div>
                <div>
                  <Label className="text-gray-400">Active</Label>
                  <p className="text-white">{selectedCapability.isActive ? "Yes" : "No"}</p>
                </div>
              </div>

              {selectedCapability.description && (
                <div>
                  <Label className="text-gray-400">Description</Label>
                  <p className="text-white mt-1">{selectedCapability.description}</p>
                </div>
              )}

              {selectedCapability.endpoint && (
                <div>
                  <Label className="text-gray-400">Endpoint</Label>
                  <p className="text-white mt-1 font-mono text-sm">{selectedCapability.endpoint}</p>
                </div>
              )}

              {(selectedCapability.sampleRequest || selectedCapability.sampleResponse) && (
                <Tabs defaultValue="request" className="mt-4">
                  <TabsList className="bg-gray-700 border-gray-600">
                    <TabsTrigger value="request" className="data-[state=active]:bg-gray-600 data-[state=active]:text-white text-gray-300">Sample Request</TabsTrigger>
                    <TabsTrigger value="response" className="data-[state=active]:bg-gray-600 data-[state=active]:text-white text-gray-300">Sample Response</TabsTrigger>
                  </TabsList>
                  <TabsContent value="request" className="bg-gray-800 border border-gray-700 rounded-md p-1">
                    <pre className="bg-gray-900 p-3 rounded text-sm text-gray-300 overflow-x-auto border-0">
                      {selectedCapability.sampleRequest || "No sample request available"}
                    </pre>
                  </TabsContent>
                  <TabsContent value="response" className="bg-gray-800 border border-gray-700 rounded-md p-1">
                    <pre className="bg-gray-900 p-3 rounded text-sm text-gray-300 overflow-x-auto border-0">
                      {selectedCapability.sampleResponse || "No sample response available"}
                    </pre>
                  </TabsContent>
                </Tabs>
              )}

              <div className="pt-4 border-t border-gray-700">
                <div className="text-xs text-gray-400">
                  {selectedCapability.extractedFrom && (
                    <p>Extracted from: {selectedCapability.extractedFrom}</p>
                  )}
                  {selectedCapability.extractedDate && (
                    <p>Extracted on: {format(new Date(selectedCapability.extractedDate), "MMM d, yyyy HH:mm")}</p>
                  )}
                  {selectedCapability.extractedBy && (
                    <p>Extracted by: {selectedCapability.extractedBy}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* AutoX Extraction Dialog */}
      <AutoXExtractionDialog
        application={{ id: applicationId, name: "Application" }}
        open={showAutoXDialog}
        onOpenChange={setShowAutoXDialog}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: [`/api/applications/${applicationId}/capabilities`] });
        }}
      />
    </div>
  );
}