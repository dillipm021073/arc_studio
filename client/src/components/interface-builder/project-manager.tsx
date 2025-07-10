import { useState, useEffect } from 'react';
import { Node, Edge } from 'reactflow';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Save, 
  FolderOpen, 
  Plus, 
  Clock, 
  Users, 
  BarChart3,
  Eye,
  Download,
  Star,
  Building2,
  CreditCard,
  Heart,
  Wrench,
  Trash2,
  HardDrive,
  Database,
  FileText,
  Import
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import { Project } from '@/types/project';
import { projectStorage, ProjectStorageType, ProjectWithStorage } from '@/services/project-storage';
import { exampleProjects, createEmptyProject } from '@/data/example-projects';

interface ProjectManagerProps {
  currentProject?: Project | null;
  onLoadProject: (project: Project) => void;
  onSaveProject: (projectData: { name: string; description: string; category: string }) => void;
  children: React.ReactNode;
}

export default function ProjectManager({ 
  currentProject, 
  onLoadProject, 
  onSaveProject, 
  children 
}: ProjectManagerProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [newProjectDialogOpen, setNewProjectDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectWithStorage | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<ProjectWithStorage | null>(null);
  
  // Project lists for each storage type
  const [teamProjects, setTeamProjects] = useState<ProjectWithStorage[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [localProjects, setLocalProjects] = useState<ProjectWithStorage[]>([]);
  const [exampleProjectsList, setExampleProjectsList] = useState<ProjectWithStorage[]>([]);
  
  // Loading states
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [loadingLocal, setLoadingLocal] = useState(false);
  const [loadingExamples, setLoadingExamples] = useState(false);
  
  // Save project form state
  const [projectName, setProjectName] = useState(currentProject?.name || '');
  const [projectDescription, setProjectDescription] = useState(currentProject?.description || '');
  const [projectCategory, setProjectCategory] = useState(currentProject?.category || 'Custom');
  const [storageType, setStorageType] = useState<ProjectStorageType>(ProjectStorageType.LOCAL);
  
  // New project form state
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [newProjectTemplate, setNewProjectTemplate] = useState('blank');

  const handleLoadProject = (project: ProjectWithStorage) => {
    console.log('ProjectManager: Loading project:', project);
    onLoadProject(project);
    setOpen(false);
    toast({
      title: 'Project Loaded',
      description: `${project.name} has been loaded successfully from ${project.storageType}`,
    });
  };

  const handleCreateNewProject = async () => {
    if (!newProjectName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Project name is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      const newProject = await projectStorage.createNewProject(
        newProjectName,
        newProjectDescription,
        newProjectTemplate
      );
      
      const projectWithStorage: ProjectWithStorage = {
        ...newProject,
        storageType: ProjectStorageType.LOCAL
      };
      
      onLoadProject(projectWithStorage);
      setNewProjectDialogOpen(false);
      setOpen(false);
      
      // Reset form
      setNewProjectName('');
      setNewProjectDescription('');
      setNewProjectTemplate('blank');
      
      toast({
        title: 'New Project Created',
        description: `${newProjectName} has been created and saved locally`,
      });
    } catch (error) {
      console.error('Failed to create new project:', error);
      toast({
        title: 'Create Failed',
        description: 'Failed to create new project',
        variant: 'destructive'
      });
    }
  };

  const handleSaveProject = () => {
    if (!projectName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Project name is required',
        variant: 'destructive',
      });
      return;
    }

    onSaveProject({
      name: projectName,
      description: projectDescription,
      category: projectCategory as any
    });
    
    setSaveDialogOpen(false);
    toast({
      title: 'Project Saved',
      description: `${projectName} has been saved to ${storageType}`,
    });
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;
    
    try {
      if (projectToDelete.storageType === ProjectStorageType.TEAM) {
        await projectStorage.deleteTeamProject(projectToDelete.id);
        setTeamProjects(prev => prev.filter(p => p.id !== projectToDelete.id));
      } else if (projectToDelete.storageType === ProjectStorageType.LOCAL) {
        await projectStorage.deleteLocalProject(projectToDelete.id);
        setLocalProjects(prev => prev.filter(p => p.id !== projectToDelete.id));
      }
      
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
      setSelectedProject(null);
      
      toast({
        title: 'Project Deleted',
        description: `${projectToDelete.name} has been deleted from ${projectToDelete.storageType}`,
      });
    } catch (error) {
      console.error('Failed to delete project:', error);
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete project',
        variant: 'destructive'
      });
    }
  };
  
  const handleImportToLocal = async () => {
    if (!selectedProject || selectedProject.storageType !== ProjectStorageType.TEAM) return;
    
    try {
      const importedProject = await projectStorage.importFromTeamToLocal(selectedProject.id);
      const projectWithStorage: ProjectWithStorage = {
        ...importedProject,
        storageType: ProjectStorageType.LOCAL
      };
      
      setLocalProjects(prev => [...prev, projectWithStorage]);
      setImportDialogOpen(false);
      
      toast({
        title: 'Project Imported',
        description: `${selectedProject.name} has been imported to local storage`,
      });
    } catch (error) {
      console.error('Failed to import project:', error);
      toast({
        title: 'Import Failed',
        description: 'Failed to import project to local storage',
        variant: 'destructive'
      });
    }
  };

  // Load projects from all storage types when dialog opens
  useEffect(() => {
    if (open) {
      loadAllProjects();
    }
  }, [open]);
  
  const loadAllProjects = async () => {
    // Load team projects with cache busting
    setLoadingTeam(true);
    try {
      // Add timestamp to force fresh data
      const teamProjectsData = await projectStorage.getTeamProjects();
      console.log('ProjectManager: Loaded team projects from API:', teamProjectsData);
      console.log('Team projects count:', teamProjectsData.length);
      const teamProjectsWithStorage = teamProjectsData.map(p => ({ ...p, storageType: ProjectStorageType.TEAM }));
      setTeamProjects(teamProjectsWithStorage);
    } catch (error) {
      console.error('Failed to load team projects:', error);
      toast({
        title: 'Error Loading Team Projects',
        description: 'Failed to load team projects from database',
        variant: 'destructive'
      });
    } finally {
      setLoadingTeam(false);
    }
    
    // Load local projects
    setLoadingLocal(true);
    try {
      const localProjectsData = await projectStorage.getLocalProjects();
      const localProjectsWithStorage = localProjectsData.map(p => ({ ...p, storageType: ProjectStorageType.LOCAL }));
      setLocalProjects(localProjectsWithStorage);
    } catch (error) {
      console.error('Failed to load local projects:', error);
      toast({
        title: 'Error Loading Local Projects',
        description: 'Failed to load local projects from file system',
        variant: 'destructive'
      });
    } finally {
      setLoadingLocal(false);
    }
    
    // Load example projects
    setLoadingExamples(true);
    try {
      const exampleProjectsData = await projectStorage.getExampleProjects();
      const exampleProjectsWithStorage = exampleProjectsData.map(p => ({ ...p, storageType: ProjectStorageType.EXAMPLE }));
      setExampleProjectsList(exampleProjectsWithStorage);
    } catch (error) {
      console.error('Failed to load example projects:', error);
      // Use fallback data from imports
      const fallbackExamples = exampleProjects.map(p => ({ ...p, storageType: ProjectStorageType.EXAMPLE }));
      setExampleProjectsList(fallbackExamples);
    } finally {
      setLoadingExamples(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'E-commerce': return <CreditCard className="h-4 w-4" />;
      case 'Banking': return <Building2 className="h-4 w-4" />;
      case 'Healthcare': return <Heart className="h-4 w-4" />;
      case 'Manufacturing': return <Wrench className="h-4 w-4" />;
      default: return <Star className="h-4 w-4" />;
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'Simple': return 'bg-green-600';
      case 'Medium': return 'bg-yellow-600';
      case 'Complex': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };
  
  const getStorageIcon = (storageType: ProjectStorageType) => {
    switch (storageType) {
      case ProjectStorageType.TEAM: return <Database className="h-4 w-4" />;
      case ProjectStorageType.LOCAL: return <HardDrive className="h-4 w-4" />;
      case ProjectStorageType.EXAMPLE: return <FileText className="h-4 w-4" />;
      default: return <Star className="h-4 w-4" />;
    }
  };
  
  const getStorageLabel = (storageType: ProjectStorageType) => {
    switch (storageType) {
      case ProjectStorageType.TEAM: return 'Team';
      case ProjectStorageType.LOCAL: return 'Local';
      case ProjectStorageType.EXAMPLE: return 'Example';
      default: return 'Unknown';
    }
  };

  // Filter projects based on search query
  const filterProjects = (projects: ProjectWithStorage[]) => {
    if (!searchQuery.trim()) return projects;
    
    const query = searchQuery.toLowerCase();
    return projects.filter(project => 
      project.name.toLowerCase().includes(query) ||
      project.description.toLowerCase().includes(query) ||
      (project.metadata?.tags || []).some(tag => tag.toLowerCase().includes(query))
    );
  };

  const NoResults = ({ type }: { type: string }) => (
    <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
      <svg
        className="h-12 w-12 mb-4 opacity-50"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <h3 className="text-lg font-medium text-white mb-2">No Results Found</h3>
      <p className="text-sm">
        No {type} projects match "{searchQuery}"
      </p>
    </div>
  );

  const ProjectCard = ({ project }: { project: ProjectWithStorage }) => (
    <Card 
      className={`cursor-pointer transition-all duration-200 bg-gray-800 border-gray-700 hover:border-gray-600 hover:shadow-lg ${
        selectedProject?.id === project.id ? 'ring-2 ring-blue-500' : ''
      }`}
      onClick={() => setSelectedProject(project)}
    >
      <CardHeader className="p-3 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 min-w-0">
            {getCategoryIcon(project.category)}
            <CardTitle className="text-sm text-white truncate">{project.name}</CardTitle>
          </div>
          <div className="flex flex-wrap items-center gap-1 justify-end">
            {project.isTeamProject && (
              <Badge variant="outline" className="text-xs border-blue-600 text-blue-400 px-1 py-0">
                <Users className="h-3 w-3" />
              </Badge>
            )}
            <Badge className={`text-xs px-1.5 py-0 ${getComplexityColor(project.metadata?.complexity || 'Simple')} text-white`}>
              {project.metadata?.complexity || 'Simple'}
            </Badge>
          </div>
        </div>
        <CardDescription className="text-xs text-gray-400 line-clamp-2 mt-1">
          {project.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Components: {project.metadata?.nodeCount || 0}</span>
            <span>Connections: {project.metadata?.edgeCount || 0}</span>
          </div>
          
          {(project.metadata?.tags || []).length > 0 && (
            <div className="flex flex-wrap gap-1">
              {(project.metadata?.tags || []).slice(0, 2).map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs border-gray-600 text-gray-400 px-1 py-0">
                  {tag}
                </Badge>
              ))}
              {(project.metadata?.tags || []).length > 2 && (
                <Badge variant="outline" className="text-xs border-gray-600 text-gray-400 px-1 py-0">
                  +{(project.metadata?.tags || []).length - 2}
                </Badge>
              )}
            </div>
          )}
          
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{new Date(project.createdAt).toLocaleDateString()}</span>
            </div>
            <Badge variant="outline" className="text-xs border-gray-600 text-gray-400 px-1 py-0">
              {getStorageIcon(project.storageType)}
              <span className="ml-1">{getStorageLabel(project.storageType)}</span>
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
        <DialogContent className="max-w-5xl h-[90vh] bg-gray-900 border-gray-700 flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-4 flex-shrink-0">
            <DialogTitle className="text-white flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              Project Manager
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Load an existing project or create a new one
            </DialogDescription>
          </DialogHeader>

          {/* Search Bar */}
          <div className="px-6 pb-4 flex-shrink-0">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search projects by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-800 border-gray-700 text-white pl-10"
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          <Tabs defaultValue="team" className="flex-1 flex flex-col overflow-hidden">
            <div className="px-6 flex-shrink-0">
              <TabsList className="grid w-full grid-cols-4 bg-gray-800">
                <TabsTrigger value="team" className="flex items-center gap-1">
                  <Database className="h-4 w-4" />
                  <span className="hidden sm:inline">Team</span>
                </TabsTrigger>
                <TabsTrigger value="local" className="flex items-center gap-1">
                  <HardDrive className="h-4 w-4" />
                  <span className="hidden sm:inline">Local</span>
                </TabsTrigger>
                <TabsTrigger value="examples" className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">Examples</span>
                </TabsTrigger>
                <TabsTrigger value="new" className="flex items-center gap-1">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">New</span>
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="team" className="flex-1 flex flex-col overflow-hidden px-6 pt-4">
              <div className="mb-3 flex-shrink-0">
                <h3 className="text-base font-medium text-white">Common Team Projects</h3>
                <p className="text-xs text-gray-400">Shared projects stored in the database, accessible by all team members</p>
              </div>
              
              {loadingTeam ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-gray-400">Loading team projects...</div>
                </div>
              ) : teamProjects.length > 0 ? (
                <>
                  {filterProjects(teamProjects).length > 0 ? (
                    <ScrollArea className="flex-1 project-manager-scroll">
                      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 p-4">
                        {filterProjects(teamProjects).map((project) => (
                          <ProjectCard key={project.id} project={project} />
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <NoResults type="team" />
                  )}
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center">
                  <div className="text-center text-gray-400">
                    <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium text-white mb-2">No Team Projects</h3>
                    <p className="text-sm">
                      Team projects shared across your organization will appear here.
                    </p>
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="local" className="flex-1 flex flex-col overflow-hidden px-6 pt-4">
              <div className="mb-3 flex-shrink-0">
                <h3 className="text-base font-medium text-white">Local Projects</h3>
                <p className="text-xs text-gray-400">Personal projects stored on your local machine</p>
              </div>
              
              {loadingLocal ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-gray-400">Loading local projects...</div>
                </div>
              ) : localProjects.length > 0 ? (
                <>
                  {filterProjects(localProjects).length > 0 ? (
                    <ScrollArea className="flex-1 project-manager-scroll">
                      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 p-4">
                        {filterProjects(localProjects).map((project) => (
                          <ProjectCard key={project.id} project={project} />
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <NoResults type="local" />
                  )}
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center">
                  <div className="text-center text-gray-400">
                    <HardDrive className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium text-white mb-2">No Local Projects</h3>
                    <p className="text-sm">
                      Your personal projects will be stored locally and appear here. Create a new project to get started.
                    </p>
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="examples" className="flex-1 flex flex-col overflow-hidden px-6 pt-4">
              <div className="mb-3 flex-shrink-0">
                <h3 className="text-base font-medium text-white">Example Projects</h3>
                <p className="text-xs text-gray-400">Pre-built templates and examples to help you get started</p>
              </div>
              
              {loadingExamples ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-gray-400">Loading example projects...</div>
                </div>
              ) : (
                <>
                  {filterProjects(exampleProjectsList).length > 0 ? (
                    <ScrollArea className="flex-1 project-manager-scroll">
                      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 p-4">
                        {filterProjects(exampleProjectsList).map((project) => (
                          <ProjectCard key={project.id} project={project} />
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <NoResults type="example" />
                  )}
                </>
              )}
            </TabsContent>
            
            <TabsContent value="new" className="flex-1 flex flex-col overflow-hidden px-6 pt-4">
              <div className="mb-3 flex-shrink-0">
                <h3 className="text-base font-medium text-white">Create New Project</h3>
                <p className="text-xs text-gray-400">Start fresh with a new interface builder project</p>
              </div>
              
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Plus className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">Create New Project</h3>
                  <p className="text-sm text-gray-400 mb-6 max-w-md">
                    Start with a blank canvas or choose from available templates
                  </p>
                  <Button 
                    onClick={() => setNewProjectDialogOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Project
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Fixed bottom panel for selected project */}
          <div className="border-t border-gray-700 bg-gray-800 p-4 flex-shrink-0">
            {selectedProject ? (
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1 mr-4">
                  <h4 className="font-medium text-white truncate">{selectedProject.name}</h4>
                  <p className="text-sm text-gray-400 truncate">{selectedProject.description}</p>
                  {selectedProject.fileInfo && selectedProject.storageType === ProjectStorageType.LOCAL && (
                    <p className="text-xs text-gray-500 mt-1">
                      {Math.round(selectedProject.fileInfo.size! / 1024)}KB • Last modified: {new Date(selectedProject.fileInfo.lastModified!).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {selectedProject.storageType === ProjectStorageType.TEAM && (
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => setImportDialogOpen(true)}
                      className="border-blue-600 text-blue-400 hover:bg-blue-900/20"
                    >
                      <Import className="h-4 w-4 mr-1" />
                      Import to Local
                    </Button>
                  )}
                  {(selectedProject.storageType === ProjectStorageType.TEAM || 
                    selectedProject.storageType === ProjectStorageType.LOCAL) && (
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setProjectToDelete(selectedProject);
                        setDeleteDialogOpen(true);
                      }}
                      className="border-red-600 text-red-400 hover:bg-red-900/20"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  )}
                  {selectedProject.storageType === ProjectStorageType.EXAMPLE && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="border-gray-600 hover:bg-gray-700"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Preview
                    </Button>
                  )}
                  <Button 
                    size="sm"
                    onClick={() => handleLoadProject(selectedProject)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    {selectedProject.storageType === ProjectStorageType.EXAMPLE ? 'Use Template' : 'Load Project'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-2">
                Select a project to see available actions
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Save Project Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Save className="h-5 w-5" />
              Save Project
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Give your project a name and description
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project-name" className="text-white">Project Name</Label>
              <Input
                id="project-name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Enter project name..."
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-description" className="text-white">Description</Label>
              <Textarea
                id="project-description"
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                placeholder="Describe your project..."
                rows={3}
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-category" className="text-white">Category</Label>
              <select
                id="project-category"
                value={projectCategory}
                onChange={(e) => setProjectCategory(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white"
              >
                <option value="Custom">Custom</option>
                <option value="E-commerce">E-commerce</option>
                <option value="Banking">Banking</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Manufacturing">Manufacturing</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="storage-type" className="text-white">Storage Location</Label>
              <select
                id="storage-type"
                value={storageType}
                onChange={(e) => setStorageType(e.target.value as ProjectStorageType)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white"
              >
                <option value={ProjectStorageType.LOCAL}>Local (Personal)</option>
                <option value={ProjectStorageType.TEAM}>Team (Shared Database)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setSaveDialogOpen(false)}
              className="border-gray-600 hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveProject}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Project
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Project Dialog */}
      <Dialog open={newProjectDialogOpen} onOpenChange={setNewProjectDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create New Project
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Create a new interface builder project
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-project-name" className="text-white">Project Name</Label>
              <Input
                id="new-project-name"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Enter project name..."
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-project-description" className="text-white">Description</Label>
              <Textarea
                id="new-project-description"
                value={newProjectDescription}
                onChange={(e) => setNewProjectDescription(e.target.value)}
                placeholder="Describe your project..."
                rows={3}
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-project-template" className="text-white">Template</Label>
              <select
                id="new-project-template"
                value={newProjectTemplate}
                onChange={(e) => setNewProjectTemplate(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white"
              >
                <option value="blank">Blank Project</option>
                <option value="basic">Basic Template</option>
                <option value="microservices">Microservices Template</option>
                <option value="api-gateway">API Gateway Template</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setNewProjectDialogOpen(false)}
              className="border-gray-600 hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateNewProject}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Project
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import to Local Dialog */}
      <AlertDialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <AlertDialogContent className="bg-gray-800 border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Import to Local Storage</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              This will create a copy of "{selectedProject?.name}" in your local project storage.
              You can then modify it independently without affecting the team version.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleImportToLocal}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              <Import className="h-4 w-4 mr-2" />
              Import to Local
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Project Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-gray-800 border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Project</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to delete "{projectToDelete?.name}"? 
              This action cannot be undone and will permanently remove the project from {projectToDelete?.storageType} storage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Save Project Trigger (hidden, called programmatically) */}
      <Button
        style={{ display: 'none' }}
        onClick={() => setSaveDialogOpen(true)}
        ref={(ref) => {
          if (ref) {
            (window as any).openSaveDialog = () => setSaveDialogOpen(true);
          }
        }}
      />
    </>
  );
}