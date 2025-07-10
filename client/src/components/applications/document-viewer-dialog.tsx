import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Download, ExternalLink, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DocumentViewerDialogProps {
  document: {
    id: number;
    fileName: string;
    fileType: string;
    fileSize: number;
  } | null;
  applicationId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function DocumentViewerDialog({
  document,
  applicationId,
  open,
  onOpenChange
}: DocumentViewerDialogProps) {
  const { toast } = useToast();
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && document) {
      loadDocument();
    }
    return () => {
      if (documentUrl) {
        URL.revokeObjectURL(documentUrl);
      }
    };
  }, [open, document]);

  const loadDocument = async () => {
    if (!document) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/applications/${applicationId}/documents/${document.id}/download`);
      if (!response.ok) {
        throw new Error("Failed to load document");
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setDocumentUrl(url);
    } catch (error) {
      toast({
        title: "Error loading document",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!documentUrl || !document) return;
    
    const link = document.createElement("a");
    link.href = documentUrl;
    link.download = document.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenInNewTab = () => {
    if (!documentUrl) return;
    window.open(documentUrl, "_blank");
  };

  const getViewerContent = () => {
    if (!document || !documentUrl) return null;

    const fileType = document.fileType.toLowerCase();

    if (fileType === "pdf") {
      return (
        <iframe
          src={documentUrl}
          className="w-full h-full"
          title={document.fileName}
        />
      );
    } else if (["png", "jpg", "jpeg", "gif", "bmp", "svg"].includes(fileType)) {
      return (
        <div className="flex items-center justify-center h-full bg-gray-900">
          <img
            src={documentUrl}
            alt={document.fileName}
            className="max-w-full max-h-full object-contain"
          />
        </div>
      );
    } else if (["txt", "text", "log", "json", "xml", "csv"].includes(fileType)) {
      return (
        <iframe
          src={documentUrl}
          className="w-full h-full bg-white"
          title={document.fileName}
        />
      );
    } else {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-400">
          <FileText className="h-16 w-16 mb-4" />
          <p className="text-lg mb-2">Preview not available for {fileType.toUpperCase()} files</p>
          <p className="text-sm mb-6">You can download the file to view it</p>
          <Button onClick={handleDownload} className="bg-blue-600 hover:bg-blue-700">
            <Download className="h-4 w-4 mr-2" />
            Download {document.fileName}
          </Button>
        </div>
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[90vw] h-[90vh] bg-gray-800 border-gray-700 p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl text-white flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {document?.fileName || "Document Viewer"}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleOpenInNewTab}
                disabled={!documentUrl}
                className="text-gray-400 hover:text-white"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDownload}
                disabled={!documentUrl}
                className="text-gray-400 hover:text-white"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden bg-gray-900">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-400">Loading document...</div>
            </div>
          ) : (
            getViewerContent()
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}