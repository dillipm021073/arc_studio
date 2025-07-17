import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileJson, AlertCircle, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ImportProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (project: any) => void;
}

export default function ImportProjectDialog({
  open,
  onOpenChange,
  onImport
}: ImportProjectDialogProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importReferenced, setImportReferenced] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<any>(null);
  const [importPreview, setImportPreview] = useState<any>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      toast({
        title: 'Invalid File',
        description: 'Please select a JSON file exported from Interface Builder',
        variant: 'destructive'
      });
      return;
    }

    setSelectedFile(file);

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Validate file format
      if (!data.version || !data.project || !data.exportDate) {
        throw new Error('Invalid export file format');
      }

      setFileContent(data);
      setImportPreview({
        projectName: data.project.name,
        exportDate: new Date(data.exportDate).toLocaleString(),
        exportedBy: data.exportedBy,
        nodeCount: data.metadata?.nodeCount || 0,
        edgeCount: data.metadata?.edgeCount || 0,
        applicationCount: data.metadata?.applicationCount || 0,
        interfaceCount: data.metadata?.interfaceCount || 0,
        businessProcessCount: data.metadata?.businessProcessCount || 0,
        internalActivityCount: data.metadata?.internalActivityCount || 0
      });
    } catch (error) {
      console.error('File parse error:', error);
      toast({
        title: 'Invalid File',
        description: 'Failed to parse the export file. Please ensure it\'s a valid export.',
        variant: 'destructive'
      });
      setSelectedFile(null);
      setFileContent(null);
      setImportPreview(null);
    }
  };

  const handleImport = async () => {
    if (!fileContent) return;

    setIsImporting(true);

    try {
      const response = await fetch(`/api/interface-builder/projects/import?importReferenced=${importReferenced}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(fileContent)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Import failed');
      }

      const result = await response.json();

      toast({
        title: 'Import Successful',
        description: `Project "${result.project.name}" has been imported successfully`,
      });

      // Convert the server project to client format with proper ID
      const clientProject = {
        ...result.project,
        id: result.project.projectId || result.project.id?.toString(),
        nodes: typeof result.project.nodes === 'string' ? JSON.parse(result.project.nodes) : result.project.nodes,
        edges: typeof result.project.edges === 'string' ? JSON.parse(result.project.edges) : result.project.edges,
        metadata: typeof result.project.metadata === 'string' ? JSON.parse(result.project.metadata) : result.project.metadata
      };

      onImport(clientProject);
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: 'Import Failed',
        description: error instanceof Error ? error.message : 'Failed to import project',
        variant: 'destructive'
      });
    } finally {
      setIsImporting(false);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setFileContent(null);
    setImportPreview(null);
    setImportReferenced(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) resetForm();
    }}>
      <DialogContent className="sm:max-w-[500px] bg-gray-800 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Project
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Import a project that was previously exported from Interface Builder
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="file-input" className="text-gray-300">
              Select Export File
            </Label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full justify-start border-gray-600 hover:bg-gray-700"
              >
                <FileJson className="h-4 w-4 mr-2" />
                {selectedFile ? selectedFile.name : 'Choose file...'}
              </Button>
              <input
                ref={fileInputRef}
                id="file-input"
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>

          {importPreview && (
            <div className="space-y-3">
              <Alert className="bg-gray-700 border-gray-600">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-gray-300">
                  <div className="space-y-1 mt-2">
                    <p><strong>Project:</strong> {importPreview.projectName}</p>
                    <p><strong>Exported:</strong> {importPreview.exportDate}</p>
                    <p><strong>By:</strong> {importPreview.exportedBy}</p>
                  </div>
                </AlertDescription>
              </Alert>

              <div className="bg-gray-700/50 rounded-lg p-3 space-y-2">
                <p className="text-sm font-medium text-gray-300">Import Contents:</p>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-400">
                  <div>• {importPreview.nodeCount} Nodes</div>
                  <div>• {importPreview.edgeCount} Edges</div>
                  {importPreview.applicationCount > 0 && (
                    <div>• {importPreview.applicationCount} Applications</div>
                  )}
                  {importPreview.interfaceCount > 0 && (
                    <div>• {importPreview.interfaceCount} Interfaces</div>
                  )}
                  {importPreview.businessProcessCount > 0 && (
                    <div>• {importPreview.businessProcessCount} Business Processes</div>
                  )}
                  {importPreview.internalActivityCount > 0 && (
                    <div>• {importPreview.internalActivityCount} Internal Activities</div>
                  )}
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="import-referenced"
                  checked={importReferenced}
                  onCheckedChange={(checked) => setImportReferenced(checked as boolean)}
                  className="mt-1"
                />
                <div className="space-y-1">
                  <Label htmlFor="import-referenced" className="text-gray-300 cursor-pointer">
                    Import referenced data
                  </Label>
                  <p className="text-xs text-gray-500">
                    Import applications, interfaces, and other entities referenced in the diagram.
                    If unchecked, only the diagram structure will be imported.
                  </p>
                </div>
              </div>

              <Alert className="bg-yellow-900/20 border-yellow-700">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-300 text-sm">
                  Duplicate entities will be created with modified IDs to avoid conflicts.
                  Existing entities with matching identifiers will be linked automatically.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-gray-600 hover:bg-gray-700"
          >
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!fileContent || isImporting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isImporting ? 'Importing...' : 'Import Project'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}