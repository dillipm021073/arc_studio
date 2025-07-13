import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Download, FileText, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";

interface ImpactAssessmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initiativeId: string;
  initiativeName: string;
}

export function ImpactAssessmentDialog({
  open,
  onOpenChange,
  initiativeId,
  initiativeName,
}: ImpactAssessmentDialogProps) {
  const [assessment, setAssessment] = useState<string>("");
  const [documentPath, setDocumentPath] = useState<string>("");
  const [documentFilename, setDocumentFilename] = useState<string>("");
  const { toast } = useToast();

  const generateAssessmentMutation = useMutation({
    mutationFn: async (forceRegenerate = false) => {
      const response = await api.post(`/api/initiatives/${initiativeId}/impact-assessment`, {
        forceRegenerate
      });
      return response.data;
    },
    onSuccess: (data) => {
      if (data.success) {
        setAssessment(data.assessment);
        setDocumentPath(data.documentPath);
        setDocumentFilename(data.filename || "");
        toast({
          title: data.fromCache ? "Impact assessment loaded" : "Impact assessment generated",
          description: data.fromCache 
            ? "Loaded existing assessment from cache." 
            : "The assessment has been generated successfully.",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Generation failed",
        description: error.response?.data?.error || "Failed to generate impact assessment",
        variant: "destructive",
      });
    },
  });

  const handleDownload = async () => {
    try {
      // Construct the download URL
      const downloadUrl = documentFilename
        ? `/api/initiatives/${initiativeId}/impact-assessment/download-by-name/${documentFilename}`
        : `/api/initiatives/${initiativeId}/impact-assessment/download?${new URLSearchParams({ documentPath }).toString()}`;
      
      // Use native fetch for blob download
      const response = await fetch(downloadUrl, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Download failed');
      }

      // Get the blob from the response
      const blob = await response.blob();
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const downloadFilename = documentFilename || `impact_assessment_${initiativeName.replace(/[^a-z0-9]/gi, "_")}.md`;
      link.setAttribute("download", downloadFilename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Download started",
        description: "The impact assessment document is being downloaded.",
      });
    } catch (error: any) {
      console.error("Download error:", {
        error: error.message,
        documentPath,
        documentFilename
      });
      
      toast({
        title: "Download failed",
        description: error.message || "Failed to download the impact assessment document. Please try regenerating the assessment.",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    setAssessment("");
    setDocumentPath("");
    setDocumentFilename("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl h-[90vh] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Impact Assessment</DialogTitle>
          <DialogDescription>
            Generate a comprehensive impact assessment for "{initiativeName}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {!assessment && !generateAssessmentMutation.isPending && (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                Click the button below to generate a comprehensive impact assessment using AutoX intelligent analysis.
              </p>
              <Button onClick={() => generateAssessmentMutation.mutate(false)}>
                Generate Impact Assessment
              </Button>
            </div>
          )}

          {generateAssessmentMutation.isPending && (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">
                Analyzing changes and generating impact assessment...
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                This may take a few moments.
              </p>
            </div>
          )}

          {assessment && (
            <div className="flex flex-col gap-4 flex-1 overflow-hidden">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This assessment was generated using AutoX AI analysis based on the current changes in the initiative.
                </AlertDescription>
              </Alert>

              <div className="flex justify-end gap-2 flex-shrink-0">
                <Button variant="outline" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Document
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setAssessment("");
                    generateAssessmentMutation.mutate(true);
                  }}
                >
                  Regenerate
                </Button>
              </div>

              <ScrollArea className="flex-1 border rounded-md">
                <div className="p-4">
                  <div className="prose prose-sm dark:prose-invert min-w-0" style={{ whiteSpace: 'pre-wrap' }}>
                    <ReactMarkdown>{assessment}</ReactMarkdown>
                  </div>
                </div>
                <ScrollBar orientation="vertical" />
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}