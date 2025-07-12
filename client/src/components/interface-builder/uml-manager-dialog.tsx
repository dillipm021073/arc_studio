import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from '@/components/ui/context-menu';
import {
  Folder,
  FolderOpen,
  FileText,
  Plus,
  Edit2,
  Trash2,
  ChevronRight,
  ChevronDown,
  Search,
  Copy,
  Eye,
  Code,
  Download,
  Share2,
  FolderPlus
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CreateFolderDialog } from './create-folder-dialog';
import { RenameFolderDialog } from './rename-folder-dialog';
import { DeleteFolderDialog } from './delete-folder-dialog';
import { UmlDiagramEditor } from './uml-diagram-editor';
import { api } from '@/lib/api';

interface UmlFolder {
  id: number;
  name: string;
  description?: string;
  parentId?: number;
  path: string;
  children?: UmlFolder[];
  diagrams?: UmlDiagram[];
  isExpanded?: boolean;
}

interface UmlDiagram {
  id: number;
  folderId: number;
  name: string;
  description?: string;
  content: string;
  diagramType: string;
  createdAt: string;
  updatedAt: string;
}

interface UmlManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRenderDiagram?: (diagram: UmlDiagram) => void;
}

export function UmlManagerDialog({ open, onOpenChange, onRenderDiagram }: UmlManagerDialogProps) {
  const { toast } = useToast();
  const [folders, setFolders] = useState<UmlFolder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<UmlFolder | null>(null);
  const [selectedDiagram, setSelectedDiagram] = useState<UmlDiagram | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Dialog states
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [renameFolderOpen, setRenameFolderOpen] = useState(false);
  const [deleteFolderOpen, setDeleteFolderOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [targetFolder, setTargetFolder] = useState<UmlFolder | null>(null);

  // Load folders and diagrams
  useEffect(() => {
    if (open) {
      loadFolders();
    }
  }, [open]);

  const loadFolders = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/uml/folders');
      setFolders(response.data);
      
      // Auto-select first folder if none selected
      if (!selectedFolder && response.data.length > 0) {
        setSelectedFolder(response.data[0]);
      }
    } catch (error) {
      console.error('Failed to load folders:', error);
      toast({
        title: 'Error',
        description: 'Failed to load UML folders',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadDiagrams = async (folderId: number) => {
    try {
      const response = await api.get(`/api/uml/folders/${folderId}/diagrams`);
      // Update folder with diagrams
      setFolders(prev => updateFolderDiagrams(prev, folderId, response.data));
    } catch (error) {
      console.error('Failed to load diagrams:', error);
    }
  };

  const updateFolderDiagrams = (folders: UmlFolder[], folderId: number, diagrams: UmlDiagram[]): UmlFolder[] => {
    return folders.map(folder => {
      if (folder.id === folderId) {
        return { ...folder, diagrams };
      }
      if (folder.children) {
        return { ...folder, children: updateFolderDiagrams(folder.children, folderId, diagrams) };
      }
      return folder;
    });
  };

  const toggleFolder = (folder: UmlFolder) => {
    setFolders(prev => toggleFolderExpanded(prev, folder.id));
    if (!folder.diagrams) {
      loadDiagrams(folder.id);
    }
  };

  const toggleFolderExpanded = (folders: UmlFolder[], folderId: number): UmlFolder[] => {
    return folders.map(folder => {
      if (folder.id === folderId) {
        return { ...folder, isExpanded: !folder.isExpanded };
      }
      if (folder.children) {
        return { ...folder, children: toggleFolderExpanded(folder.children, folderId) };
      }
      return folder;
    });
  };

  const handleCreateFolder = (parentFolder?: UmlFolder) => {
    setTargetFolder(parentFolder || null);
    setCreateFolderOpen(true);
  };

  const handleRenameFolder = (folder: UmlFolder) => {
    setTargetFolder(folder);
    setRenameFolderOpen(true);
  };

  const handleDeleteFolder = (folder: UmlFolder) => {
    setTargetFolder(folder);
    setDeleteFolderOpen(true);
  };

  const handleCreateDiagram = () => {
    if (!selectedFolder) {
      toast({
        title: 'No folder selected',
        description: 'Please select a folder first',
        variant: 'destructive'
      });
      return;
    }
    
    setSelectedDiagram({
      id: 0,
      folderId: selectedFolder.id,
      name: 'New Diagram',
      content: '@startuml\n\nactor User\nparticipant System\n\nUser -> System: Request\nSystem --> User: Response\n\n@enduml',
      diagramType: 'sequence',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    setEditorOpen(true);
  };

  const handleEditDiagram = (diagram: UmlDiagram) => {
    setSelectedDiagram(diagram);
    setEditorOpen(true);
  };

  const handleRenderDiagram = (diagram: UmlDiagram) => {
    if (onRenderDiagram) {
      onRenderDiagram(diagram);
      onOpenChange(false);
    }
  };

  const renderFolderTree = (folders: UmlFolder[], level = 0) => {
    return folders.map(folder => (
      <div key={folder.id} style={{ marginLeft: `${level * 16}px` }}>
        <ContextMenu>
          <ContextMenuTrigger>
            <div
              className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-800 ${
                selectedFolder?.id === folder.id ? 'bg-gray-800' : ''
              }`}
              onClick={() => {
                setSelectedFolder(folder);
                toggleFolder(folder);
              }}
            >
              {folder.isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              {folder.isExpanded ? (
                <FolderOpen className="h-4 w-4 text-yellow-600" />
              ) : (
                <Folder className="h-4 w-4 text-yellow-600" />
              )}
              <span className="text-sm">{folder.name}</span>
              {folder.diagrams && (
                <Badge variant="secondary" className="ml-auto text-xs">
                  {folder.diagrams.length}
                </Badge>
              )}
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem onClick={() => handleCreateFolder(folder)}>
              <FolderPlus className="mr-2 h-4 w-4" />
              New Subfolder
            </ContextMenuItem>
            <ContextMenuItem onClick={() => handleRenameFolder(folder)}>
              <Edit2 className="mr-2 h-4 w-4" />
              Rename
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem 
              onClick={() => handleDeleteFolder(folder)}
              className="text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
        
        {folder.isExpanded && folder.diagrams && (
          <div style={{ marginLeft: `${(level + 1) * 16 + 20}px` }}>
            {folder.diagrams.map(diagram => (
              <ContextMenu key={diagram.id}>
                <ContextMenuTrigger>
                  <div
                    className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-800 ${
                      selectedDiagram?.id === diagram.id ? 'bg-gray-800' : ''
                    }`}
                    onClick={() => setSelectedDiagram(diagram)}
                    onDoubleClick={() => handleEditDiagram(diagram)}
                  >
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">{diagram.name}</span>
                    <Badge variant="outline" className="ml-auto text-xs">
                      {diagram.diagramType}
                    </Badge>
                  </div>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem onClick={() => handleEditDiagram(diagram)}>
                    <Edit2 className="mr-2 h-4 w-4" />
                    Edit
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => handleRenderDiagram(diagram)}>
                    <Eye className="mr-2 h-4 w-4" />
                    Render on Canvas
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem>
                    <Copy className="mr-2 h-4 w-4" />
                    Duplicate
                  </ContextMenuItem>
                  <ContextMenuItem>
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem className="text-red-600">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            ))}
          </div>
        )}
        
        {folder.isExpanded && folder.children && renderFolderTree(folder.children, level + 1)}
      </div>
    ));
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl h-[80vh] bg-gray-900 text-white">
          <DialogHeader>
            <DialogTitle>UML Diagram Manager</DialogTitle>
            <DialogDescription>
              Create and manage PlantUML diagrams with folders
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-3 gap-4 h-full">
            {/* Folder Tree */}
            <div className="col-span-1 border-r border-gray-800 pr-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold">Folders</h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleCreateFolder()}
                >
                  <FolderPlus className="h-4 w-4" />
                </Button>
              </div>
              
              <ScrollArea className="h-[calc(100%-60px)]">
                {loading ? (
                  <div className="text-center text-gray-500">Loading...</div>
                ) : folders.length === 0 ? (
                  <div className="text-center text-gray-500">
                    <p>No folders yet</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCreateFolder()}
                      className="mt-2"
                    >
                      Create First Folder
                    </Button>
                  </div>
                ) : (
                  renderFolderTree(folders)
                )}
              </ScrollArea>
            </div>

            {/* Diagram List */}
            <div className="col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold">
                    {selectedFolder ? `${selectedFolder.name} Diagrams` : 'Select a Folder'}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Search diagrams..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64 bg-gray-800 border-gray-700"
                    prefix={<Search className="h-4 w-4 text-gray-500" />}
                  />
                  <Button
                    size="sm"
                    onClick={handleCreateDiagram}
                    disabled={!selectedFolder}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    New Diagram
                  </Button>
                </div>
              </div>

              <Separator className="mb-4" />

              {selectedDiagram && (
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{selectedDiagram.name}</h4>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEditDiagram(selectedDiagram)}>
                        <Edit2 className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleRenderDiagram(selectedDiagram)}>
                        <Eye className="h-4 w-4 mr-1" />
                        Render
                      </Button>
                    </div>
                  </div>
                  {selectedDiagram.description && (
                    <p className="text-sm text-gray-400 mb-2">{selectedDiagram.description}</p>
                  )}
                  <div className="bg-gray-900 rounded p-2">
                    <pre className="text-xs text-gray-300 overflow-x-auto">
                      {selectedDiagram.content.substring(0, 200)}...
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sub-dialogs */}
      <CreateFolderDialog
        open={createFolderOpen}
        onOpenChange={setCreateFolderOpen}
        parentFolder={targetFolder}
        onFolderCreated={loadFolders}
      />
      
      <RenameFolderDialog
        open={renameFolderOpen}
        onOpenChange={setRenameFolderOpen}
        folder={targetFolder}
        onFolderRenamed={loadFolders}
      />
      
      <DeleteFolderDialog
        open={deleteFolderOpen}
        onOpenChange={setDeleteFolderOpen}
        folder={targetFolder}
        onFolderDeleted={loadFolders}
      />
      
      {selectedDiagram && (
        <UmlDiagramEditor
          open={editorOpen}
          onOpenChange={setEditorOpen}
          diagram={selectedDiagram}
          onSave={(updatedDiagram) => {
            if (selectedFolder) {
              loadDiagrams(selectedFolder.id);
            }
            setEditorOpen(false);
          }}
        />
      )}
    </>
  );
}