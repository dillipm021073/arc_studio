import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/use-permissions";
import { 
  FileText, 
  Trash2, 
  Download, 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Upload,
  Eye,
  FileSearch
} from "lucide-react";
import { format } from "date-fns";
import DocumentCapabilitiesDialog from "./document-capabilities-dialog";
import DocumentViewerDialog from "./document-viewer-dialog";

interface CapabilitiesDocumentsDialogProps {
  application: { id: number; name: string } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadClick?: () => void;
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
  extractionStartTime?: string;
  extractionEndTime?: string;
}

export default function CapabilitiesDocumentsDialog({ 
  application, 
  open, 
  onOpenChange,
  onUploadClick 
}: CapabilitiesDocumentsDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { canDelete } = usePermissions();
  const [selectedDocument, setSelectedDocument] = useState<UploadedDocument | null>(null);
  const [viewingDocument, setViewingDocument] = useState<UploadedDocument | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [contextMenuDocument, setContextMenuDocument] = useState<UploadedDocument | null>(null);

  const { data: documents = [], isLoading } = useQuery({
    queryKey: [`/api/applications/${application?.id}/documents`],
    queryFn: async () => {
      if (!application?.id) return [];
      const response = await fetch(`/api/applications/${application.id}/documents`);
      if (!response.ok) throw new Error("Failed to fetch documents");
      return response.json();
    },
    enabled: !!application?.id && open,
  });

  const deleteMutation = useMutation({
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
      queryClient.invalidateQueries({ queryKey: [`/api/applications/${application?.id}/documents`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
      completed: { color: "bg-green-600", icon: <CheckCircle className="h-3 w-3" /> },
      processing: { color: "bg-blue-600", icon: <Clock className="h-3 w-3 animate-spin" /> },
      failed: { color: "bg-red-600", icon: <XCircle className="h-3 w-3" /> },
      pending: { color: "bg-yellow-600", icon: <AlertCircle className="h-3 w-3" /> },
    };

    const config = statusConfig[status] || { color: "bg-gray-600", icon: null };

    return (
      <Badge className={`${config.color} text-white flex items-center gap-1`}>
        {config.icon}
        {status}
      </Badge>
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const calculateProcessingTime = (start?: string, end?: string) => {
    if (!start || !end) return null;
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    const seconds = Math.floor((endTime - startTime) / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-gray-800 border-gray-700 max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl text-white flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Capability Documents - {application?.name}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            View all uploaded documents and their processing status
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {isLoading ? (
            <div className="space-y-4">
              <div className="h-24 bg-gray-700 rounded animate-pulse" />
              <div className="h-24 bg-gray-700 rounded animate-pulse" />
            </div>
          ) : documents.length === 0 ? (
            <Card className="bg-gray-700 border-gray-600">
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-400 mb-4">No documents uploaded yet</p>
                {onUploadClick && (
                  <Button
                    onClick={() => {
                      onOpenChange(false);
                      onUploadClick();
                    }}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Document
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-gray-400">
                  {documents.length} document{documents.length !== 1 ? 's' : ''} found
                </p>
                {onUploadClick && (
                  <Button
                    onClick={() => {
                      onOpenChange(false);
                      onUploadClick();
                    }}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload New
                  </Button>
                )}
              </div>

              {documents.map((doc: UploadedDocument) => (
                <Card 
                  key={doc.id} 
                  className="bg-gray-700 border-gray-600 cursor-pointer hover:border-gray-500 transition-colors"
                  onDoubleClick={() => setSelectedDocument(doc)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setContextMenuPosition({ x: e.clientX, y: e.clientY });
                    setContextMenuDocument(doc);
                  }}
                  title="Double-click to view extracted capabilities, right-click for more options"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div>
                          <CardTitle className="text-base text-white">{doc.fileName}</CardTitle>
                          <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                            <span>{doc.fileType.toUpperCase()}</span>
                            <span>{formatFileSize(doc.fileSize)}</span>
                            <span>by {doc.uploadedBy}</span>
                            <span>{format(new Date(doc.createdAt), "MMM d, yyyy HH:mm")}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(doc.processedStatus)}
                        {canDelete('applications') && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteMutation.mutate(doc.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  {(doc.capabilitiesExtracted !== undefined || doc.extractionNotes) && (
                    <CardContent>
                      <div className="space-y-2">
                        {doc.processedStatus === "completed" && doc.capabilitiesExtracted !== undefined && (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm text-white">
                              {doc.capabilitiesExtracted} capabilities extracted
                            </span>
                            {doc.extractionStartTime && doc.extractionEndTime && (
                              <span className="text-xs text-gray-400">
                                (processed in {calculateProcessingTime(doc.extractionStartTime, doc.extractionEndTime)})
                              </span>
                            )}
                          </div>
                        )}
                        {doc.extractionNotes && (
                          <p className="text-sm text-gray-400">{doc.extractionNotes}</p>
                        )}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
        
        {/* Context Menu */}
        {contextMenuDocument && contextMenuPosition && (
          <DropdownMenu 
            open={!!contextMenuDocument} 
            onOpenChange={(open) => !open && setContextMenuDocument(null)}
          >
            <DropdownMenuTrigger asChild>
              <div 
                style={{ 
                  position: 'fixed', 
                  left: contextMenuPosition.x, 
                  top: contextMenuPosition.y,
                  width: 1,
                  height: 1
                }} 
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-gray-700 border-gray-600">
              <DropdownMenuItem
                onClick={() => {
                  setSelectedDocument(contextMenuDocument);
                  setContextMenuDocument(null);
                }}
                className="text-gray-300 hover:text-white cursor-pointer"
              >
                <FileSearch className="h-4 w-4 mr-2" />
                View Capabilities
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setViewingDocument(contextMenuDocument);
                  setContextMenuDocument(null);
                }}
                className="text-gray-300 hover:text-white cursor-pointer"
              >
                <Eye className="h-4 w-4 mr-2" />
                View Document
              </DropdownMenuItem>
              {canDelete('applications') && (
                <DropdownMenuItem
                  onClick={() => {
                    deleteMutation.mutate(contextMenuDocument.id);
                    setContextMenuDocument(null);
                  }}
                  className="text-red-400 hover:text-red-300 cursor-pointer"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Document
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        
        {/* Document Capabilities Dialog */}
        <DocumentCapabilitiesDialog
          document={selectedDocument}
          open={!!selectedDocument}
          onOpenChange={(open) => !open && setSelectedDocument(null)}
        />
        
        {/* Document Viewer Dialog */}
        <DocumentViewerDialog
          document={viewingDocument}
          applicationId={application?.id || 0}
          open={!!viewingDocument}
          onOpenChange={(open) => !open && setViewingDocument(null)}
        />
      </DialogContent>
    </Dialog>
  );
}