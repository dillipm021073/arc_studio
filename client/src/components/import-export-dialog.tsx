import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import * as XLSX from 'xlsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  Download, 
  Upload, 
  FileSpreadsheet, 
  AlertCircle, 
  CheckCircle,
  Info,
  Database,
  Plus
} from "lucide-react";

interface ImportExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entity: 'applications' | 'interfaces' | 'business-processes' | 'change-requests' | 'technical-processes';
  entityName: string;
  onImportSuccess?: () => void;
}

export function ImportExportDialog({
  open,
  onOpenChange,
  entity,
  entityName,
  onImportSuccess
}: ImportExportDialogProps) {
  const [mode, setMode] = useState<'export' | 'import'>('export');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importMode, setImportMode] = useState<'incremental' | 'truncate'>('incremental');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [importData, setImportData] = useState<any>(null);
  const [importProgress, setImportProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Export mutation
  const exportMutation = useMutation({
    mutationFn: async () => {
      // For business processes, we have two export options
      let exportUrl = `/api/${entity}/export`;
      if (entity === 'business-processes') {
        exportUrl = `/api/${entity}/export-tree`; // Use tree export for hierarchical data
      }
      
      const response = await fetch(exportUrl, {
        credentials: 'include'
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Export failed' }));
        throw new Error(error.message || `Failed to export ${entityName}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${entity}-export-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => {
      toast({
        title: "Export Successful",
        description: `${entityName} have been exported successfully.`,
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : `Failed to export ${entityName}`,
        variant: "destructive",
      });
    },
  });

  // Import mutation
  const importMutation = useMutation({
    mutationFn: async ({ file, mode }: { file: File; mode: 'incremental' | 'truncate' }) => {
      setImportProgress(50);
      
      // For business processes, use multipart form data
      if (entity === 'business-processes') {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('clearExisting', mode === 'truncate' ? 'true' : 'false');
        
        const response = await fetch(`/api/${entity}/import`, {
          method: "POST",
          body: formData,
          credentials: 'include'
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Import failed");
        }
        
        return response.json();
      } else {
        // For other entities, use JSON import
        const response = await fetch(`/api/${entity}/import`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: importData, mode }),
          credentials: 'include'
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Import failed");
        }
        
        return response.json();
      }
    },
    onSuccess: (result) => {
      setImportProgress(100);
      toast({
        title: "Import Successful",
        description: result.message,
      });
      
      // Show import details
      if (result.details) {
        const details = Object.entries(result.details)
          .map(([key, value]) => `${key}: ${value} records`)
          .join(", ");
        toast({
          title: "Import Details",
          description: details,
          duration: 10000,
        });
      }
      
      // Reset state and close dialog
      setTimeout(() => {
        setImportFile(null);
        setImportData(null);
        setImportProgress(0);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        onOpenChange(false);
        onImportSuccess?.();
      }, 2000);
    },
    onError: (error) => {
      setImportProgress(0);
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to import data",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const isJSON = file.type === 'application/json' || file.name.endsWith('.json');
      const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                     file.type === 'application/vnd.ms-excel' ||
                     file.name.endsWith('.xlsx') || 
                     file.name.endsWith('.xls');
      
      if (!isJSON && !isExcel) {
        toast({
          title: "Invalid File Type",
          description: "Please select a JSON or Excel file",
          variant: "destructive",
        });
        return;
      }
      
      setImportFile(file);
      
      if (isJSON) {
        // Handle JSON file
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target?.result as string);
            
            // Validate data structure
            if (!data.version || !data.entity) {
              throw new Error("Invalid JSON file format");
            }
            
            // Check if the file is for the correct entity
            if (data.entity !== entity) {
              throw new Error(`This file contains ${data.entity} data, not ${entityName} data`);
            }
            
            setImportData(data);
          } catch (error) {
            toast({
              title: "Invalid File",
              description: error instanceof Error ? error.message : "The selected file is not a valid export file",
              variant: "destructive",
            });
            setImportFile(null);
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
          }
        };
        reader.readAsText(file);
      } else if (isExcel) {
        // Handle Excel file
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            
            // Get the first worksheet
            const wsname = workbook.SheetNames[0];
            const ws = workbook.Sheets[wsname];
            
            // Convert to JSON
            const jsonData = XLSX.utils.sheet_to_json(ws);
            
            if (jsonData.length === 0) {
              throw new Error("Excel file is empty");
            }
            
            // Create import data structure similar to JSON export format
            const importData = {
              version: "1.0",
              exportDate: new Date().toISOString(),
              entity: entity,
              data: entity === 'businessProcesses' ? {
                businessProcesses: jsonData,
                businessProcessInterfaces: [],
                imlDiagrams: []
              } : entity === 'changeRequests' ? {
                changeRequests: jsonData,
                changeRequestApplications: [],
                changeRequestInterfaces: []
              } : entity === 'technicalProcesses' ? {
                technicalProcesses: jsonData,
                technicalProcessInterfaces: [],
                technicalProcessDependencies: []
              } : entity === 'applications' ? {
                applications: jsonData
              } : entity === 'interfaces' ? {
                interfaces: jsonData
              } : jsonData
            };
            
            setImportData(importData);
          } catch (error) {
            toast({
              title: "Invalid Excel File",
              description: error instanceof Error ? error.message : "Could not read the Excel file",
              variant: "destructive",
            });
            setImportFile(null);
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
          }
        };
        reader.readAsArrayBuffer(file);
      }
    }
  };

  const handleImport = () => {
    if (importMode === 'truncate') {
      setShowConfirmDialog(true);
    } else {
      performImport();
    }
  };

  const performImport = () => {
    if (importFile) {
      setImportProgress(10);
      importMutation.mutate({ file: importFile, mode: importMode });
    }
  };

  const resetState = () => {
    setMode('export');
    setImportFile(null);
    setImportData(null);
    setImportProgress(0);
    setImportMode('incremental');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <Dialog 
        open={open} 
        onOpenChange={(isOpen) => {
          if (!isOpen) resetState();
          onOpenChange(isOpen);
        }}
      >
        <DialogContent className="sm:max-w-[525px] bg-gray-800 border-gray-700 max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">{mode === 'export' ? 'Export' : 'Import'} {entityName}</DialogTitle>
            <DialogDescription className="text-gray-400">
              {mode === 'export' 
                ? `Export all ${entityName.toLowerCase()} to an Excel (XLSX) file for backup or transfer.`
                : `Import ${entityName.toLowerCase()} from a previously exported JSON or Excel (XLSX) file.`
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Mode Selection */}
            <RadioGroup value={mode} onValueChange={(value) => setMode(value as 'export' | 'import')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="export" id="export" />
                <Label htmlFor="export" className="flex items-center gap-2 cursor-pointer text-gray-300">
                  <Download className="h-4 w-4" />
                  Export {entityName}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="import" id="import" />
                <Label htmlFor="import" className="flex items-center gap-2 cursor-pointer text-gray-300">
                  <Upload className="h-4 w-4" />
                  Import {entityName}
                </Label>
              </div>
            </RadioGroup>

            {/* Export Content */}
            {mode === 'export' && (
              <Alert className="bg-gray-700 border-gray-600">
                <Info className="h-4 w-4 text-blue-400" />
                <AlertTitle className="text-white">Export Information</AlertTitle>
                <AlertDescription className="text-gray-300">
                  {entity === 'business-processes' 
                    ? `This will export all ${entityName.toLowerCase()} with their hierarchical structure, relationships, and interface mappings to an Excel (XLSX) file.`
                    : `This will export all ${entityName.toLowerCase()} and related data to an Excel (XLSX) file with flat structure.`
                  }
                </AlertDescription>
              </Alert>
            )}

            {/* Import Content */}
            {mode === 'import' && (
              <>
                {/* File Selection */}
                <div>
                  <Label htmlFor="import-file" className="text-gray-300">Select Import File</Label>
                  <div className="mt-2">
                    <input
                      ref={fileInputRef}
                      id="import-file"
                      type="file"
                      accept=".json,.xlsx,.xls"
                      onChange={handleFileSelect}
                      className="block w-full text-sm text-gray-300
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-md file:border-0
                        file:text-sm file:font-semibold
                        file:bg-blue-600 file:text-white
                        hover:file:bg-blue-700"
                    />
                  </div>
                  {importFile && (
                    <p className="mt-2 text-sm text-gray-400">
                      Selected: {importFile.name} ({(importFile.size / 1024).toFixed(2)} KB)
                    </p>
                  )}
                </div>

                {/* Import Mode Selection */}
                {importFile && (entity === 'business-processes' || importData) && (
                  <>
                    <div className="space-y-3">
                      <Label className="text-gray-300">Import Mode</Label>
                      <RadioGroup value={importMode} onValueChange={(value) => setImportMode(value as 'incremental' | 'truncate')}>
                        <div className="flex items-start space-x-3">
                          <RadioGroupItem value="incremental" id="incremental-mode" />
                          <div className="grid gap-1">
                            <Label htmlFor="incremental-mode" className="font-normal cursor-pointer">
                              <span className="flex items-center gap-2 text-gray-300">
                                <Plus className="h-4 w-4" />
                                Incremental Import
                              </span>
                            </Label>
                            <p className="text-sm text-gray-400">
                              Add new records without removing existing data.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <RadioGroupItem value="truncate" id="truncate-mode" />
                          <div className="grid gap-1">
                            <Label htmlFor="truncate-mode" className="font-normal cursor-pointer">
                              <span className="flex items-center gap-2 text-red-400">
                                <Database className="h-4 w-4" />
                                Replace All Data
                              </span>
                            </Label>
                            <p className="text-sm text-gray-400">
                              Remove all existing {entityName.toLowerCase()} and replace with imported data.
                            </p>
                          </div>
                        </div>
                      </RadioGroup>
                    </div>

                    {/* Import Progress */}
                    {importProgress > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm text-gray-300">
                          <span>Importing data...</span>
                          <span>{importProgress}%</span>
                        </div>
                        <Progress value={importProgress} />
                      </div>
                    )}
                  </>
                )}

                {/* Import Status */}
                {importMutation.isSuccess && (
                  <Alert className="bg-green-900/50 border-green-700">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <AlertTitle className="text-green-300">Import Successful</AlertTitle>
                    <AlertDescription className="text-green-200">
                      {entityName} have been imported successfully.
                    </AlertDescription>
                  </Alert>
                )}

                {importMutation.isError && (
                  <Alert variant="destructive" className="bg-red-900/50 border-red-700">
                    <AlertCircle className="h-4 w-4 text-red-400" />
                    <AlertTitle className="text-red-300">Import Failed</AlertTitle>
                    <AlertDescription className="text-red-200">
                      {importMutation.error instanceof Error ? importMutation.error.message : "Failed to import data"}
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600">
              Cancel
            </Button>
            {mode === 'export' ? (
              <Button 
                onClick={() => exportMutation.mutate()}
                disabled={exportMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                {exportMutation.isPending ? "Exporting..." : "Export to Excel"}
              </Button>
            ) : (
              <Button
                onClick={handleImport}
                disabled={!importFile || (entity !== 'business-processes' && !importData) || importMutation.isPending}
                className={importMode === 'truncate' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}
              >
                <Upload className="mr-2 h-4 w-4" />
                {importMutation.isPending ? "Importing..." : "Import"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for Truncate Mode */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace All {entityName}?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                This action will <strong className="text-destructive">permanently delete all existing {entityName.toLowerCase()}</strong> and replace them with the contents of the import file.
              </p>
              <p className="mt-3">
                This action cannot be undone. Are you sure you want to continue?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowConfirmDialog(false);
                performImport();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Yes, Replace All Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}