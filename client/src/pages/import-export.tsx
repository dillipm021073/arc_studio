import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImportExportDialog } from "@/components/import-export-dialog";
import { Link } from "wouter";
import { 
  FileSpreadsheet, 
  Upload, 
  Download, 
  Database,
  Box,
  Plug,
  GitBranch,
  Briefcase,
  Cpu,
  Palette
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";

export default function ImportExport() {
  const [selectedEntity, setSelectedEntity] = useState<'applications' | 'interfaces' | 'business-processes' | 'change-requests' | 'technical-processes' | 'interface-builder' | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showProjectSelector, setShowProjectSelector] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [savedProjects, setSavedProjects] = useState<any[]>([]);
  const { toast } = useToast();

  const entities = [
    {
      id: 'applications',
      name: 'Applications',
      description: 'Export/Import application master list (AML) data',
      icon: Box,
      color: 'text-blue-400 bg-blue-900/50',
    },
    {
      id: 'interfaces',
      name: 'Interfaces',
      description: 'Export/Import interface master list (IML) data',
      icon: Plug,
      color: 'text-green-400 bg-green-900/50',
    },
    {
      id: 'business-processes',
      name: 'Business Processes',
      description: 'Export/Import business process data',
      icon: Briefcase,
      color: 'text-purple-400 bg-purple-900/50',
    },
    {
      id: 'change-requests',
      name: 'Change Requests',
      description: 'Export/Import change request (CR) data',
      icon: GitBranch,
      color: 'text-orange-400 bg-orange-900/50',
    },
    {
      id: 'technical-processes',
      name: 'Technical Processes',
      description: 'Export/Import technical process data',
      icon: Cpu,
      color: 'text-indigo-400 bg-indigo-900/50',
    },
    {
      id: 'interface-builder',
      name: 'Interface Builder Projects',
      description: 'Export/Import interface builder project designs',
      icon: Palette,
      color: 'text-pink-400 bg-pink-900/50',
    },
  ];

  const handleEntityClick = (entityId: 'applications' | 'interfaces' | 'business-processes' | 'change-requests' | 'technical-processes' | 'interface-builder') => {
    if (entityId === 'interface-builder') {
      setSelectedEntity(entityId);
      setShowProjectSelector(true);
    } else {
      setSelectedEntity(entityId);
      setDialogOpen(true);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <nav className="flex" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-2 text-sm text-gray-400">
                <li><Link href="/" className="hover:text-gray-200">Home</Link></li>
                <li className="flex items-center">
                  <span className="mx-2">/</span>
                  <span className="text-white font-medium">Import/Export</span>
                </li>
              </ol>
            </nav>
            <h1 className="text-2xl font-semibold text-white mt-1">Import/Export Data</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Information Card */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Database className="h-5 w-5" />
                Data Management
              </CardTitle>
              <CardDescription className="text-gray-400">
                Export your data to Excel (XLSX) format for backup, analysis, or migration. 
                Import data from previously exported files to restore or transfer data between systems.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Entity Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {entities.map((entity) => {
              const Icon = entity.icon;
              return (
                <Card 
                  key={entity.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow bg-gray-800 border-gray-700 hover:bg-gray-700/50"
                  onClick={() => handleEntityClick(entity.id as any)}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between text-white">
                      <span className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${entity.color}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        {entity.name}
                      </span>
                      <FileSpreadsheet className="h-5 w-5 text-gray-400" />
                    </CardTitle>
                    <CardDescription className="text-gray-400">{entity.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1 bg-gray-700 text-white border-gray-600 hover:bg-gray-600">
                        <Download className="mr-2 h-4 w-4" />
                        Export
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1 bg-gray-700 text-white border-gray-600 hover:bg-gray-600">
                        <Upload className="mr-2 h-4 w-4" />
                        Import
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Instructions */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Instructions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2 text-white">Exporting Data</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-400">
                  <li>Click on the entity type you want to export</li>
                  <li>Select "Export" mode in the dialog</li>
                  <li>Click "Export to Excel" to download the data as an XLSX file</li>
                  <li>The exported file will contain all records with their relationships</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-white">Importing Data</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-400">
                  <li>Click on the entity type you want to import</li>
                  <li>Select "Import" mode in the dialog</li>
                  <li>Choose an Excel (XLSX) or JSON file to import</li>
                  <li>Select import mode:
                    <ul className="list-disc list-inside ml-6 mt-1">
                      <li><strong className="text-gray-300">Incremental</strong>: Add new records without removing existing data</li>
                      <li><strong className="text-gray-300">Replace All</strong>: Remove all existing data and replace with imported data</li>
                    </ul>
                  </li>
                  <li>Click "Import" to process the file</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-white">Important Notes</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-400">
                  <li>Always backup your data before performing a "Replace All" import</li>
                  <li>Exported files include timestamps and can be used for audit purposes</li>
                  <li>Diagrams are not included in exports (use the diagram download feature instead)</li>
                  <li>Excel files should maintain the same column structure as exported files</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Import/Export Dialog */}
      {selectedEntity && selectedEntity !== 'interface-builder' && (
        <ImportExportDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          entity={selectedEntity}
          entityName={entities.find(e => e.id === selectedEntity)?.name || ''}
          onImportSuccess={() => {
            // Could refresh data or show a success message
          }}
        />
      )}

      {/* Interface Builder Project Selector Dialog */}
      <Dialog open={showProjectSelector} onOpenChange={setShowProjectSelector}>
        <DialogContent className="bg-gray-900 border-gray-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Select Interface Builder Project
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Choose a project to export or click "Import Project" to import a new one
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Load projects when dialog opens */}
            {showProjectSelector && (() => {
              const projects = JSON.parse(localStorage.getItem('interface-builder-projects') || '[]');
              if (projects.length === 0) {
                return (
                  <div className="space-y-4">
                    <div className="text-center py-8 text-gray-400">
                      <Palette className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No Interface Builder projects found.</p>
                      <p className="text-sm mt-2">Import a project to get started or create one in the Interface Builder.</p>
                    </div>
                    
                    <div className="flex justify-center">
                      <Button
                        variant="outline"
                        onClick={() => {
                          // Import functionality
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = '.json';
                          input.onchange = async (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (file) {
                              try {
                                const text = await file.text();
                                const importedProject = JSON.parse(text);
                                
                                // Add new ID and timestamps
                                importedProject.id = `project-${Date.now()}`;
                                importedProject.createdAt = new Date().toISOString();
                                importedProject.updatedAt = new Date().toISOString();
                                
                                // Save to localStorage
                                const existingProjects = JSON.parse(localStorage.getItem('interface-builder-projects') || '[]');
                                existingProjects.push(importedProject);
                                localStorage.setItem('interface-builder-projects', JSON.stringify(existingProjects));
                                
                                toast({
                                  title: 'Project Imported',
                                  description: `${importedProject.name} has been imported successfully`,
                                });
                                
                                setShowProjectSelector(false);
                              } catch (error) {
                                toast({
                                  title: 'Import Failed',
                                  description: 'Failed to import project. Please check the file format.',
                                  variant: 'destructive',
                                });
                              }
                            }
                          };
                          input.click();
                        }}
                        className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600"
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Import Project
                      </Button>
                    </div>
                  </div>
                );
              }

              return (
                <>
                  <ScrollArea className="h-[300px] border border-gray-700 rounded-lg p-4">
                    <RadioGroup value={selectedProject?.id} onValueChange={(value) => {
                      const project = projects.find((p: any) => p.id === value);
                      setSelectedProject(project);
                    }}>
                      {projects.map((project: any) => (
                        <div key={project.id} className="mb-3">
                          <Label
                            htmlFor={project.id}
                            className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-gray-800 transition-colors"
                          >
                            <RadioGroupItem value={project.id} id={project.id} className="text-blue-400" />
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-white">{project.name}</span>
                                <span className="text-xs text-gray-500">
                                  {new Date(project.updatedAt || project.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-sm text-gray-400 mt-1">{project.description}</p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                <span>Nodes: {project.nodes?.length || 0}</span>
                                <span>Edges: {project.edges?.length || 0}</span>
                                <span className="capitalize">Category: {project.category || 'Custom'}</span>
                              </div>
                            </div>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </ScrollArea>

                  <div className="flex justify-between gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        // Import functionality
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = '.json';
                        input.onchange = async (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (file) {
                            try {
                              const text = await file.text();
                              const importedProject = JSON.parse(text);
                              
                              // Add new ID and timestamps
                              importedProject.id = `project-${Date.now()}`;
                              importedProject.createdAt = new Date().toISOString();
                              importedProject.updatedAt = new Date().toISOString();
                              
                              // Save to localStorage
                              const existingProjects = JSON.parse(localStorage.getItem('interface-builder-projects') || '[]');
                              existingProjects.push(importedProject);
                              localStorage.setItem('interface-builder-projects', JSON.stringify(existingProjects));
                              
                              toast({
                                title: 'Project Imported',
                                description: `${importedProject.name} has been imported successfully`,
                              });
                              
                              setShowProjectSelector(false);
                            } catch (error) {
                              toast({
                                title: 'Import Failed',
                                description: 'Failed to import project. Please check the file format.',
                                variant: 'destructive',
                              });
                            }
                          }
                        };
                        input.click();
                      }}
                      className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Import Project
                    </Button>

                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setShowProjectSelector(false)}
                        className="border-gray-600 hover:bg-gray-700"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => {
                          if (selectedProject) {
                            // Export the selected project
                            const dataStr = JSON.stringify(selectedProject, null, 2);
                            const dataBlob = new Blob([dataStr], { type: 'application/json' });
                            const url = URL.createObjectURL(dataBlob);
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = `${selectedProject.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_export.json`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            URL.revokeObjectURL(url);
                            
                            toast({
                              title: 'Project Exported',
                              description: `${selectedProject.name} has been exported as JSON`,
                            });
                            
                            setShowProjectSelector(false);
                          } else {
                            toast({
                              title: 'No Project Selected',
                              description: 'Please select a project to export',
                              variant: 'destructive',
                            });
                          }
                        }}
                        disabled={!selectedProject}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Export Selected
                      </Button>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}