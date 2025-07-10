import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { 
  Cloud, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Clock,
  Sparkles,
  History,
  Download,
  Code,
  Database,
  Globe,
  Key,
  Shield
} from "lucide-react";
import { format } from "date-fns";

interface AutoXExtractionDialogProps {
  application: { id: number; name: string } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface ExtractionHistory {
  id: number;
  filename: string;
  fileType: string;
  status: string;
  startedAt: string;
  completedAt?: string;
  resultSummary?: {
    totalExtracted: number;
    modules?: string[];
  };
  error?: string;
}

export default function AutoXExtractionDialog({ 
  application, 
  open, 
  onOpenChange,
  onSuccess 
}: AutoXExtractionDialogProps) {
  const [activeTab, setActiveTab] = useState("extract");
  const [filename, setFilename] = useState("");
  const [fileType, setFileType] = useState("pdf");
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState(0);
  const [extractionResult, setExtractionResult] = useState<any>(null);
  const [hasCredentials, setHasCredentials] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // Check if user has AutoX credentials
  const { data: userSettings } = useQuery<{ autoXApiKey?: string; autoXUsername?: string }>({
    queryKey: ["/api/users/me"],
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  useEffect(() => {
    if (userSettings) {
      setHasCredentials(!!(userSettings.autoXApiKey && userSettings.autoXUsername));
    }
  }, [userSettings]);

  // Fetch extraction history
  const { data: history = [], isLoading: loadingHistory } = useQuery<ExtractionHistory[]>({
    queryKey: [`/api/applications/${application?.id}/extraction-history`],
    enabled: !!application?.id && open,
  });

  const extractMutation = useMutation({
    mutationFn: async ({ filename, fileType }: { filename: string; fileType: string }) => {
      if (!hasCredentials) {
        throw new Error("AutoX credentials not configured");
      }

      const response = await fetch(`/api/applications/${application?.id}/extract-autox`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ 
          filename, 
          fileType,
          autoXApiKey: userSettings?.autoXApiKey,
          autoXUsername: userSettings?.autoXUsername
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to extract capabilities");
      }

      return response.json();
    },
    onSuccess: (data) => {
      setExtractionResult(data);
      toast({
        title: "Extraction completed successfully",
        description: `Extracted ${data.totalExtracted} capabilities from ${filename}`,
      });
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: [`/api/applications/${application?.id}/capabilities`] });
      queryClient.invalidateQueries({ queryKey: [`/api/applications/${application?.id}/extraction-history`] });
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Extraction failed",
        description: error.message,
        variant: "destructive",
      });
      setExtractionProgress(0);
    },
  });

  const handleExtract = async () => {
    if (!filename || !application) return;

    setIsExtracting(true);
    setExtractionProgress(10);
    setExtractionResult(null);
    
    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setExtractionProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 20;
      });
    }, 2000);
    
    try {
      await extractMutation.mutateAsync({ filename, fileType });
      setExtractionProgress(100);
    } finally {
      clearInterval(progressInterval);
      setIsExtracting(false);
    }
  };

  const handleClose = () => {
    if (!isExtracting) {
      setFilename("");
      setFileType("pdf");
      setExtractionProgress(0);
      setExtractionResult(null);
      setActiveTab("extract");
      onOpenChange(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-600 text-white"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case "processing":
        return <Badge className="bg-blue-600 text-white"><Clock className="h-3 w-3 mr-1 animate-spin" />Processing</Badge>;
      case "failed":
        return <Badge className="bg-red-600 text-white"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      default:
        return <Badge className="bg-gray-600 text-white">{status}</Badge>;
    }
  };

  const getCapabilityIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      REST: <Globe className="h-4 w-4" />,
      SOAP: <Code className="h-4 w-4" />,
      Database: <Database className="h-4 w-4" />,
      Authentication: <Key className="h-4 w-4" />,
      Security: <Shield className="h-4 w-4" />,
    };
    return icons[type] || <FileText className="h-4 w-4" />;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl bg-gray-800 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-xl text-white flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            AutoX AI Capability Extraction
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Extract capabilities from documents uploaded to AutoX Cloud
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-2 bg-gray-700">
            <TabsTrigger value="extract" className="data-[state=active]:bg-gray-600">
              <Sparkles className="h-4 w-4 mr-2" />
              New Extraction
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-gray-600">
              <History className="h-4 w-4 mr-2" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="extract" className="space-y-4 mt-4">
            {!hasCredentials ? (
              <Alert className="bg-amber-900/20 border-amber-600">
                <AlertCircle className="h-4 w-4 text-amber-400" />
                <AlertDescription className="text-amber-300">
                  <p className="font-semibold mb-2">AutoX Credentials Required</p>
                  <p className="text-sm mb-3">
                    You need to configure your AutoX API credentials before you can extract capabilities.
                  </p>
                  <Button
                    onClick={() => setLocation("/settings")}
                    size="sm"
                    variant="outline"
                    className="bg-amber-600 hover:bg-amber-700 text-white border-amber-500"
                  >
                    Go to Settings
                  </Button>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="bg-blue-900/20 border-blue-600">
                <AlertCircle className="h-4 w-4 text-blue-400" />
                <AlertDescription className="text-blue-300">
                  <p className="font-semibold mb-2">AutoX AI Extraction</p>
                  <p className="text-sm">AutoX uses advanced AI to analyze documents and extract:</p>
                  <ul className="mt-2 ml-4 text-sm list-disc">
                    <li>Web services and API endpoints</li>
                    <li>Integration protocols and data formats</li>
                    <li>Authentication methods and security requirements</li>
                    <li>Third-party services and dependencies</li>
                    <li>Complete technical specifications</li>
                  </ul>
                  <p className="text-sm mt-2">
                    <strong>Note:</strong> Documents must be uploaded to AutoX first through their web interface.
                  </p>
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div>
                <Label htmlFor="filename" className="text-gray-300">
                  Document Filename (as stored in AutoX)
                </Label>
                <Input
                  id="filename"
                  type="text"
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  placeholder="e.g., dillipm-API_Documentation.pdf"
                  disabled={isExtracting || !hasCredentials}
                  className="mt-2 bg-gray-700 border-gray-600 text-white"
                />
                <p className="mt-1 text-xs text-gray-400">
                  Enter the exact filename as it appears in AutoX (may include username prefix)
                </p>
              </div>

              <div>
                <Label htmlFor="fileType" className="text-gray-300">
                  File Type
                </Label>
                <Select value={fileType} onValueChange={setFileType} disabled={isExtracting || !hasCredentials}>
                  <SelectTrigger className="mt-2 bg-gray-700 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF Document</SelectItem>
                    <SelectItem value="word">Word Document (DOCX/DOC)</SelectItem>
                    <SelectItem value="text">Text File</SelectItem>
                    <SelectItem value="excel">Excel Spreadsheet</SelectItem>
                    <SelectItem value="image">Image (PNG/JPG)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isExtracting && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Extracting capabilities...</span>
                  <span className="text-white">{Math.round(extractionProgress)}%</span>
                </div>
                <Progress value={extractionProgress} className="h-2" />
                {extractionProgress < 30 && (
                  <p className="text-xs text-gray-400">Sending request to AutoX...</p>
                )}
                {extractionProgress >= 30 && extractionProgress < 80 && (
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <Sparkles className="h-3 w-3 animate-pulse" />
                    AI is analyzing the document...
                  </p>
                )}
                {extractionProgress >= 80 && (
                  <p className="text-xs text-gray-400">Processing results...</p>
                )}
              </div>
            )}

            {extractionResult && (
              <div className="space-y-4 border-t border-gray-700 pt-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Extraction Results
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-700 rounded p-3">
                    <p className="text-sm text-gray-400">Total Capabilities</p>
                    <p className="text-2xl font-bold text-white">{extractionResult.totalExtracted}</p>
                  </div>
                  <div className="bg-gray-700 rounded p-3">
                    <p className="text-sm text-gray-400">Modules Found</p>
                    <p className="text-2xl font-bold text-white">
                      {Object.keys(extractionResult.modules || {}).length}
                    </p>
                  </div>
                </div>

                {extractionResult.capabilities && extractionResult.capabilities.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-300 mb-2">Sample Capabilities:</h4>
                    <ScrollArea className="h-48 bg-gray-700 rounded p-3">
                      <div className="space-y-2">
                        {extractionResult.capabilities.slice(0, 5).map((cap: any, index: number) => (
                          <div key={index} className="bg-gray-800 rounded p-2">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-2">
                                {getCapabilityIcon(cap.type)}
                                <span className="text-sm font-medium text-white">{cap.name}</span>
                              </div>
                              <Badge className="text-xs">{cap.type}</Badge>
                            </div>
                            {cap.description && (
                              <p className="text-xs text-gray-400 mt-1">{cap.description}</p>
                            )}
                          </div>
                        ))}
                        {extractionResult.capabilities.length > 5 && (
                          <p className="text-xs text-gray-400 text-center py-2">
                            ... and {extractionResult.capabilities.length - 5} more
                          </p>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isExtracting}
                className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
              >
                Close
              </Button>
              <Button
                onClick={handleExtract}
                disabled={!filename || isExtracting || !!extractionResult || !hasCredentials}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isExtracting ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Extracting...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Extract with AutoX
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            {loadingHistory ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-gray-700 rounded animate-pulse" />
                ))}
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <History className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No extraction history yet</p>
              </div>
            ) : (
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {history.map((item) => (
                    <div key={item.id} className="bg-gray-700 rounded p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-gray-400" />
                            <span className="font-medium text-white">{item.filename}</span>
                            {getStatusBadge(item.status)}
                          </div>
                          <div className="mt-2 text-sm text-gray-400">
                            <p>Started: {format(new Date(item.startedAt), "PPp")}</p>
                            {item.completedAt && (
                              <p>Completed: {format(new Date(item.completedAt), "PPp")}</p>
                            )}
                            {item.resultSummary && (
                              <p className="text-green-400">
                                Extracted: {item.resultSummary.totalExtracted} capabilities
                              </p>
                            )}
                            {item.error && (
                              <p className="text-red-400">Error: {item.error}</p>
                            )}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {item.fileType}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}