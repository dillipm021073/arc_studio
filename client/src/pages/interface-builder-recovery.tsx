import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Search, 
  Download, 
  Upload, 
  RefreshCw, 
  Database,
  HardDrive,
  AlertCircle,
  CheckCircle,
  FileJson
} from 'lucide-react';
import { 
  recoverInterfaceBuilderProjects, 
  restoreProjects, 
  exportProjectsAsBackup 
} from '@/utils/recover-interface-builder-projects';
import { useToast } from '@/hooks/use-toast';

export default function InterfaceBuilderRecovery() {
  const { toast } = useToast();
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveredProjects, setRecoveredProjects] = useState<any[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<Set<number>>(new Set());
  const [isRestoring, setIsRestoring] = useState(false);

  const handleRecover = async () => {
    setIsRecovering(true);
    try {
      const projects = await recoverInterfaceBuilderProjects();
      setRecoveredProjects(projects);
      
      if (projects.length === 0) {
        toast({
          title: "No projects found",
          description: "Could not find any projects to recover",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Recovery complete",
          description: `Found ${projects.length} project(s) that can be recovered`,
        });
      }
    } catch (error) {
      console.error('Recovery error:', error);
      toast({
        title: "Recovery failed",
        description: "An error occurred during recovery",
        variant: "destructive"
      });
    } finally {
      setIsRecovering(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedProjects.size === recoveredProjects.length) {
      setSelectedProjects(new Set());
    } else {
      setSelectedProjects(new Set(recoveredProjects.map((_, i) => i)));
    }
  };

  const handleRestore = async () => {
    const projectsToRestore = recoveredProjects.filter((_, i) => selectedProjects.has(i));
    
    if (projectsToRestore.length === 0) {
      toast({
        title: "No projects selected",
        description: "Please select projects to restore",
        variant: "destructive"
      });
      return;
    }

    setIsRestoring(true);
    try {
      const result = await restoreProjects(projectsToRestore);
      
      toast({
        title: "Restoration complete",
        description: `Restored ${result.restored} project(s), ${result.failed} failed`,
      });

      // Refresh the recovery list
      await handleRecover();
    } catch (error) {
      console.error('Restore error:', error);
      toast({
        title: "Restoration failed",
        description: "An error occurred during restoration",
        variant: "destructive"
      });
    } finally {
      setIsRestoring(false);
    }
  };

  const handleExportBackup = () => {
    const projectsToExport = selectedProjects.size > 0
      ? recoveredProjects.filter((_, i) => selectedProjects.has(i))
      : recoveredProjects;

    if (projectsToExport.length === 0) {
      toast({
        title: "No projects to export",
        description: "No projects available for backup",
        variant: "destructive"
      });
      return;
    }

    exportProjectsAsBackup(projectsToExport);
    toast({
      title: "Backup exported",
      description: `Exported ${projectsToExport.length} project(s) as backup`,
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-6 w-6" />
            Interface Builder Project Recovery
          </CardTitle>
          <CardDescription>
            Recover lost Interface Builder projects from browser storage and database
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>How Recovery Works</AlertTitle>
            <AlertDescription>
              This tool searches for Interface Builder projects in:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Browser localStorage (temporary saves)</li>
                <li>Browser IndexedDB (offline storage)</li>
                <li>Application database (saved projects)</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Button 
              onClick={handleRecover}
              disabled={isRecovering}
              className="flex items-center gap-2"
            >
              {isRecovering ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Search for Projects
                </>
              )}
            </Button>

            {recoveredProjects.length > 0 && (
              <>
                <Button
                  variant="outline"
                  onClick={handleSelectAll}
                >
                  {selectedProjects.size === recoveredProjects.length ? 'Deselect All' : 'Select All'}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleExportBackup}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export Backup
                </Button>

                <Button
                  onClick={handleRestore}
                  disabled={isRestoring || selectedProjects.size === 0}
                  className="flex items-center gap-2"
                >
                  {isRestoring ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Restoring...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Restore Selected
                    </>
                  )}
                </Button>
              </>
            )}
          </div>

          {recoveredProjects.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                Found {recoveredProjects.length} Project(s)
              </h3>
              
              <div className="space-y-2">
                {recoveredProjects.map((project, index) => (
                  <Card 
                    key={index} 
                    className={`cursor-pointer transition-colors ${
                      selectedProjects.has(index) ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' : ''
                    }`}
                    onClick={() => {
                      const newSelected = new Set(selectedProjects);
                      if (newSelected.has(index)) {
                        newSelected.delete(index);
                      } else {
                        newSelected.add(index);
                      }
                      setSelectedProjects(newSelected);
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h4 className="font-semibold flex items-center gap-2">
                            {project.name}
                            {project.metadata?.source === 'database' && (
                              <Badge variant="success" className="text-xs">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                In Database
                              </Badge>
                            )}
                            {project.metadata?.source === 'localStorage-canvas' && (
                              <Badge variant="secondary" className="text-xs">
                                <HardDrive className="h-3 w-3 mr-1" />
                                Unsaved Canvas
                              </Badge>
                            )}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {project.description || 'No description'}
                          </p>
                          <div className="flex gap-4 text-xs text-muted-foreground">
                            <span>{project.nodes?.length || 0} nodes</span>
                            <span>{project.edges?.length || 0} edges</span>
                            <span>Updated: {new Date(project.updatedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedProjects.has(index)}
                            onChange={() => {}}
                            className="h-4 w-4"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {!isRecovering && recoveredProjects.length === 0 && (
            <Alert>
              <FileJson className="h-4 w-4" />
              <AlertTitle>No projects found yet</AlertTitle>
              <AlertDescription>
                Click "Search for Projects" to scan for recoverable Interface Builder projects.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}