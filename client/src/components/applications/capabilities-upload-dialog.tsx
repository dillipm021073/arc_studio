import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Clock
} from "lucide-react";

interface UploadResponse {
  id?: number;
  capabilitiesExtracted?: number;
  capabilitiesFailed?: number;
  message?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
}

interface CapabilitiesUploadDialogProps {
  application: { id: number; name: string } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function CapabilitiesUploadDialog({ 
  application, 
  open, 
  onOpenChange,
  onSuccess 
}: CapabilitiesUploadDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isFallbackMode, setIsFallbackMode] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // AutoX fallback extraction
  const autoXFallbackMutation = useMutation<UploadResponse, Error, string>({
    mutationFn: async (filename: string) => {
      const response = await fetch(`/api/applications/${application?.id}/extract-autox`, {
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
      setUploadProgress(100);
      
      setTimeout(() => {
        toast({
          title: "Document processed via AutoX fallback",
          description: (
            <div className="space-y-1">
              <p>Extracted {data.capabilitiesExtracted || 0} capabilities using AutoX AI</p>
              <p className="text-yellow-400">Regular parsing failed, used AutoX as backup</p>
            </div>
          ),
        });
        
        // Invalidate queries and reset state
        queryClient.invalidateQueries({ queryKey: [`/api/applications/${application?.id}/capabilities`] });
        queryClient.invalidateQueries({ queryKey: [`/api/applications/${application?.id}/documents`] });
        
        setSelectedFile(null);
        setUploadProgress(0);
        setIsFallbackMode(false);
        onOpenChange(false);
        
        if (onSuccess) {
          onSuccess();
        }
      }, 500);
    },
    onError: (error: Error) => {
      toast({
        title: "Both parsing methods failed",
        description: `Regular parsing and AutoX extraction both failed: ${error.message}`,
        variant: "destructive",
      });
      setUploadProgress(0);
      setIsFallbackMode(false);
    },
  });

  const uploadMutation = useMutation<UploadResponse, Error, File>({
    mutationFn: async (file: File) => {
      console.log("Starting upload for application:", application?.id);
      console.log("File to upload:", file.name, file.size);
      
      const formData = new FormData();
      formData.append("document", file);

      const url = `/api/applications/${application?.id}/upload-capabilities`;
      console.log("Upload URL:", url);
      
      try {
        // Track upload progress using XMLHttpRequest for better control
        return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          
          // Track upload progress
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              // File upload: 0-25%
              const uploadPercent = Math.round((event.loaded / event.total) * 25);
              setUploadProgress(uploadPercent);
            }
          };
          
          xhr.onloadend = () => {
            if (xhr.status === 200) {
              try {
                const response = JSON.parse(xhr.responseText);
                resolve(response);
              } catch (error) {
                reject(new Error("Failed to parse response"));
              }
            } else {
              try {
                const error = JSON.parse(xhr.responseText);
                reject(new Error(error.message || "Failed to upload document"));
              } catch {
                reject(new Error("Failed to upload document"));
              }
            }
          };
          
          xhr.onerror = () => {
            reject(new Error("Network error during upload"));
          };
          
          // Set up realistic progress simulation for server processing
          xhr.onload = () => {
            if (xhr.status === 200) {
              // File uploaded (25%), now simulate server processing stages
              let currentProgress = 25;
              const progressInterval = setInterval(() => {
                if (currentProgress < 50) {
                  // PDF parsing phase: 25-50%
                  currentProgress += 2;
                } else if (currentProgress < 75) {
                  // AutoX processing phase: 50-75% (slower)
                  currentProgress += 1;
                } else if (currentProgress < 95) {
                  // Result processing phase: 75-95%
                  currentProgress += 2;
                } else {
                  // Stop at 95% until actual completion
                  clearInterval(progressInterval);
                }
                setUploadProgress(Math.min(currentProgress, 95));
              }, 300);
              
              // Store interval ID to clear it on completion
              (window as any).__uploadProgressInterval = progressInterval;
            }
          };
          
          xhr.open("POST", url);
          xhr.withCredentials = true; // Include cookies
          xhr.send(formData);
        });
      } catch (error) {
        console.error("Upload error:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      // Clear any running progress interval
      if ((window as any).__uploadProgressInterval) {
        clearInterval((window as any).__uploadProgressInterval);
        delete (window as any).__uploadProgressInterval;
      }
      
      // Complete the progress
      setUploadProgress(100);
      
      // Show success after a brief delay
      setTimeout(() => {
        toast({
          title: "Document processed successfully",
          description: (
            <div className="space-y-1">
              <p>Extracted {data.capabilitiesExtracted || 0} capabilities</p>
              {data.capabilitiesFailed && data.capabilitiesFailed > 0 && (
                <p className="text-yellow-400">{data.capabilitiesFailed} capabilities failed to save</p>
              )}
            </div>
          ),
        });
        
        // Invalidate queries
        queryClient.invalidateQueries({ queryKey: [`/api/applications/${application?.id}/capabilities`] });
        queryClient.invalidateQueries({ queryKey: [`/api/applications/${application?.id}/documents`] });
        
        // Reset state
        setSelectedFile(null);
        setUploadProgress(0);
        onOpenChange(false);
        
        // Call success callback if provided
        if (onSuccess) {
          onSuccess();
        }
      }, 500);
    },
    onError: (error: Error) => {
      // Clear any running progress interval
      if ((window as any).__uploadProgressInterval) {
        clearInterval((window as any).__uploadProgressInterval);
        delete (window as any).__uploadProgressInterval;
      }
      
      // Check if we should try AutoX fallback
      if (selectedFile && !isFallbackMode) {
        console.log("Regular parsing failed, trying AutoX fallback...");
        setIsFallbackMode(true);
        setUploadProgress(50); // Reset to 50% for AutoX processing
        
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
        setUploadProgress(0);
        setIsFallbackMode(false);
      }
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (25MB limit)
      if (file.size > 25 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a file smaller than 25MB",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !application) return;

    setIsUploading(true);
    setUploadProgress(10);
    
    try {
      await uploadMutation.mutateAsync(selectedFile);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      setSelectedFile(null);
      setUploadProgress(0);
      setIsFallbackMode(false);
      onOpenChange(false);
    }
  };

  const acceptedFormats = ".pdf,.docx,.doc,.txt,.xlsx,.xls";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl bg-gray-800 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-xl text-white flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Capability Document
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Upload a document for {application?.name} to automatically extract capabilities using AI
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <Alert className="bg-blue-900/20 border-blue-600">
            <AlertCircle className="h-4 w-4 text-blue-400" />
            <AlertDescription className="text-blue-300">
              Our AI will analyze the document and extract:
              <ul className="mt-2 ml-4 text-sm list-disc">
                <li>External interfaces (provided and consumed)</li>
                <li>APIs, services, and functions</li>
                <li>Data formats and protocols</li>
                <li>Integration points</li>
                <li>Sample code and documentation</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div>
            <Label htmlFor="file-upload" className="text-gray-300">
              Select Document
            </Label>
            <Input
              id="file-upload"
              type="file"
              accept={acceptedFormats}
              onChange={handleFileSelect}
              disabled={isUploading}
              className="mt-2 bg-gray-700 border-gray-600 text-white file:bg-gray-600 file:text-white file:border-0 file:rounded-md file:px-4 file:py-2 hover:file:bg-gray-500"
            />
            <p className="mt-1 text-xs text-gray-400">
              Accepted formats: PDF, DOCX, DOC, TXT, XLSX, XLS (max 25MB)
            </p>
          </div>

          {selectedFile && (
            <div className="p-3 bg-gray-700 rounded-lg border border-gray-600">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-gray-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{selectedFile.name}</p>
                  <p className="text-xs text-gray-400">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                {!isUploading && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedFile(null)}
                    className="text-gray-400 hover:text-white"
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          )}

          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Processing document...</span>
                <span className="text-white">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
              {uploadProgress < 25 && (
                <p className="text-xs text-gray-400">Uploading document...</p>
              )}
              {uploadProgress >= 25 && uploadProgress < 50 && (
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <Clock className="h-3 w-3 animate-spin" />
                  Parsing document content...
                </p>
              )}
              {uploadProgress >= 50 && uploadProgress < 75 && (
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <Clock className="h-3 w-3 animate-spin" />
                  {isFallbackMode ? "AutoX AI fallback extraction..." : "AutoX AI is analyzing capabilities..."}
                </p>
              )}
              {uploadProgress >= 75 && uploadProgress < 100 && (
                <p className="text-xs text-gray-400">
                  {isFallbackMode ? "Processing AutoX fallback results..." : "Processing AutoX results..."}
                </p>
              )}
              {uploadProgress >= 100 && (
                <p className="text-xs text-gray-400">Saving extracted capabilities...</p>
              )}
              {isFallbackMode && (
                <p className="text-xs text-yellow-400 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Regular parsing failed, using AutoX as backup
                </p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isUploading}
              className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
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
        </div>
      </DialogContent>
    </Dialog>
  );
}