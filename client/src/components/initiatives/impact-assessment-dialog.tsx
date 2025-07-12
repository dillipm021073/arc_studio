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
import { ScrollArea } from "@/components/ui/scroll-area";
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
  const { toast } = useToast();

  const generateAssessmentMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/api/initiatives/${initiativeId}/impact-assessment`);
      return response.data;
    },
    onSuccess: (data) => {
      if (data.success) {
        setAssessment(data.assessment);
        setDocumentPath(data.documentPath);
        toast({
          title: "Impact assessment generated",
          description: "The assessment has been generated successfully.",
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
      const response = await api.get(
        `/api/initiatives/${initiativeId}/impact-assessment/download`,
        {
          params: { documentPath },
          responseType: "blob",
        }
      );

      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `impact_assessment_${initiativeName.replace(/[^a-z0-9]/gi, "_")}.md`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Download started",
        description: "The impact assessment document is being downloaded.",
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Failed to download the impact assessment document",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    setAssessment("");
    setDocumentPath("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Impact Assessment</DialogTitle>
          <DialogDescription>
            Generate a comprehensive impact assessment for "{initiativeName}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!assessment && !generateAssessmentMutation.isPending && (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                Click the button below to generate a comprehensive impact assessment using AutoX intelligent analysis.
              </p>
              <Button onClick={() => generateAssessmentMutation.mutate()}>
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
            <>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This assessment was generated using AutoX AI analysis based on the current changes in the initiative.
                </AlertDescription>
              </Alert>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Document
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setAssessment("");
                    generateAssessmentMutation.mutate();
                  }}
                >
                  Regenerate
                </Button>
              </div>

              <ScrollArea className="h-[500px] border rounded-md p-4">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{assessment}</ReactMarkdown>
                </div>
              </ScrollArea>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}