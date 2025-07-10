import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface GenerateBusinessProcessesDialogProps {
  design: {
    id: number;
    name: string;
    hierarchyData: string;
  } | null;
  onClose: () => void;
  onSuccess?: () => void;
}

interface GenerationOptions {
  lob: string;
  product: string;
  version: string;
  domainOwner: string;
  itOwner: string;
  vendorFocal: string;
  includeDescriptions: boolean;
}

export default function GenerateBusinessProcessesDialog({
  design,
  onClose,
  onSuccess,
}: GenerateBusinessProcessesDialogProps) {
  const { toast } = useToast();
  const [options, setOptions] = useState<GenerationOptions>({
    lob: "",
    product: "",
    version: "1.0",
    domainOwner: "",
    itOwner: "",
    vendorFocal: "",
    includeDescriptions: true,
  });

  // Removed LOB fetch query - using input field instead

  // Generate business processes mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/hierarchy-designs/${design?.id}/generate-business-processes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(options),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to generate business processes");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: `Generated ${data.summary.created} business processes successfully`,
      });
      onSuccess?.();
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!design) return null;

  // Parse hierarchy to get preview info
  const getHierarchyPreview = () => {
    try {
      const hierarchy = JSON.parse(design.hierarchyData);
      const countNodes = (nodes: any[], level: string): number => {
        let count = 0;
        nodes.forEach(node => {
          if (node.characteristics?.level === level) count++;
          if (node.children) count += countNodes(node.children, level);
        });
        return count;
      };
      
      return {
        levelA: countNodes(hierarchy, 'A'),
        levelB: countNodes(hierarchy, 'B'),
        levelC: countNodes(hierarchy, 'C'),
        total: countNodes(hierarchy, 'A') + countNodes(hierarchy, 'B') + countNodes(hierarchy, 'C')
      };
    } catch {
      return { levelA: 0, levelB: 0, levelC: 0, total: 0 };
    }
  };

  const preview = getHierarchyPreview();

  return (
    <Dialog open={!!design} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Generate Business Processes from Hierarchy</DialogTitle>
          <DialogDescription>
            Generate business processes from "{design.name}" hierarchy design
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Preview */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This will create <strong>{preview.total}</strong> business processes:
              {preview.levelA > 0 && ` ${preview.levelA} Level A,`}
              {preview.levelB > 0 && ` ${preview.levelB} Level B,`}
              {preview.levelC > 0 && ` ${preview.levelC} Level C`}
            </AlertDescription>
          </Alert>

          {/* Form Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lob">Line of Business *</Label>
              <Input
                id="lob"
                value={options.lob}
                onChange={(e) => setOptions({ ...options, lob: e.target.value })}
                placeholder="Enter line of business"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="product">Product *</Label>
              <Input
                id="product"
                value={options.product}
                onChange={(e) => setOptions({ ...options, product: e.target.value })}
                placeholder="Enter product name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="version">Version</Label>
              <Input
                id="version"
                value={options.version}
                onChange={(e) => setOptions({ ...options, version: e.target.value })}
                placeholder="1.0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="domainOwner">Domain Owner</Label>
              <Input
                id="domainOwner"
                value={options.domainOwner}
                onChange={(e) => setOptions({ ...options, domainOwner: e.target.value })}
                placeholder="Enter domain owner"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="itOwner">IT Owner</Label>
              <Input
                id="itOwner"
                value={options.itOwner}
                onChange={(e) => setOptions({ ...options, itOwner: e.target.value })}
                placeholder="Enter IT owner"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vendorFocal">Vendor Focal</Label>
              <Input
                id="vendorFocal"
                value={options.vendorFocal}
                onChange={(e) => setOptions({ ...options, vendorFocal: e.target.value })}
                placeholder="Enter vendor focal"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="includeDescriptions"
              checked={options.includeDescriptions}
              onCheckedChange={(checked) => setOptions({ ...options, includeDescriptions: checked as boolean })}
            />
            <Label htmlFor="includeDescriptions" className="text-sm font-normal">
              Include process descriptions from hierarchy design
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={generateMutation.isPending}>
            Cancel
          </Button>
          <Button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending || !options.lob || !options.product}
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Generate Business Processes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}