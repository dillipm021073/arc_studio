import { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen, Plus, Edit2, Trash2, FolderPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from '@/components/ui/context-menu';
import { useAuth } from '@/contexts/auth-context';

interface FolderTreeProps {
  folders: string[];
  currentPath: string;
  onFolderSelect: (path: string) => void;
  onCreateFolder: (parentPath: string) => void;
  onRenameFolder?: (oldPath: string, newName: string) => void;
  onDeleteFolder?: (path: string) => void;
}

interface FolderNode {
  name: string;
  path: string;
  children: FolderNode[];
}

export function FolderTree({ 
  folders, 
  currentPath, 
  onFolderSelect, 
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder 
}: FolderTreeProps) {
  const { user } = useAuth();
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [folderStructure, setFolderStructure] = useState<FolderNode[]>([]);
  
  // Check if user has permission to modify folders
  const canModifyFolders = user?.role === 'Admin' || user?.role === 'admin' || user?.role === 'Manager';

  useEffect(() => {
    // Build hierarchical folder structure from flat paths
    const root: FolderNode = { name: '/', path: '/', children: [] };
    const nodeMap = new Map<string, FolderNode>();
    nodeMap.set('/', root);

    // Sort folders to ensure parents come before children
    const sortedFolders = [...folders].sort();

    sortedFolders.forEach(folderPath => {
      const parts = folderPath.split('/').filter(Boolean);
      let currentPath = '';
      let parentNode = root;

      parts.forEach((part, index) => {
        currentPath += `/${part}`;
        
        if (!nodeMap.has(currentPath)) {
          const newNode: FolderNode = {
            name: part,
            path: currentPath,
            children: []
          };
          parentNode.children.push(newNode);
          nodeMap.set(currentPath, newNode);
        }
        
        parentNode = nodeMap.get(currentPath)!;
      });
    });

    setFolderStructure(root.children);

    // Auto-expand folders in current path
    if (currentPath && currentPath !== '/') {
      const pathParts = currentPath.split('/').filter(Boolean);
      const expandPaths = new Set<string>();
      let buildPath = '';
      pathParts.forEach(part => {
        buildPath += `/${part}`;
        expandPaths.add(buildPath);
      });
      setExpandedFolders(expandPaths);
    }
  }, [folders, currentPath]);

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const renderFolder = (folder: FolderNode, level: number = 0) => {
    const isExpanded = expandedFolders.has(folder.path);
    const isSelected = currentPath === folder.path;
    const hasChildren = folder.children.length > 0;

    const folderContent = (
      <div
        className={cn(
          "flex items-center gap-1 px-2 py-1 hover:bg-gray-700 cursor-pointer rounded",
          isSelected && "bg-gray-700"
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        <button
          onClick={() => toggleFolder(folder.path)}
          className="p-0.5 hover:bg-gray-600 rounded"
          style={{ visibility: hasChildren ? 'visible' : 'hidden' }}
        >
          {isExpanded ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
        </button>
        
        <div
          className="flex items-center gap-2 flex-1"
          onClick={() => onFolderSelect(folder.path)}
        >
          {isExpanded ? (
            <FolderOpen className="h-4 w-4 text-blue-400" />
          ) : (
            <Folder className="h-4 w-4 text-blue-400" />
          )}
          <span className="text-sm">{folder.name}</span>
        </div>

        {canModifyFolders && (
          <Button
            size="sm"
            variant="ghost"
            className="opacity-0 hover:opacity-100 p-0.5 h-auto"
            onClick={(e) => {
              e.stopPropagation();
              onCreateFolder(folder.path);
            }}
          >
            <Plus className="h-3 w-3" />
          </Button>
        )}
      </div>
    );

    return (
      <div key={folder.path}>
        <ContextMenu>
          <ContextMenuTrigger asChild>
            {folderContent}
          </ContextMenuTrigger>
          <ContextMenuContent className="w-56">
            <ContextMenuItem 
              onClick={() => onCreateFolder(folder.path)}
              disabled={!canModifyFolders}
            >
              <FolderPlus className="mr-2 h-4 w-4" />
              New Subfolder
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem 
              onClick={() => onRenameFolder?.(folder.path, folder.name)}
              disabled={!canModifyFolders || !onRenameFolder}
            >
              <Edit2 className="mr-2 h-4 w-4" />
              Rename
            </ContextMenuItem>
            <ContextMenuItem 
              onClick={() => onDeleteFolder?.(folder.path)}
              disabled={!canModifyFolders || !onDeleteFolder}
              className="text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Folder
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>

        {isExpanded && hasChildren && (
          <div>
            {folder.children.map(child => renderFolder(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full overflow-y-auto">
      {/* Root folder */}
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            className={cn(
              "flex items-center gap-2 px-2 py-1 hover:bg-gray-700 cursor-pointer rounded",
              currentPath === '/' && "bg-gray-700"
            )}
            onClick={() => onFolderSelect('/')}
          >
            <Folder className="h-4 w-4 text-blue-400" />
            <span className="text-sm flex-1">All Projects</span>
            {canModifyFolders && (
              <Button
                size="sm"
                variant="ghost"
                className="opacity-0 hover:opacity-100 p-0.5 h-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  onCreateFolder('/');
                }}
              >
                <Plus className="h-3 w-3" />
              </Button>
            )}
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-56">
          <ContextMenuItem 
            onClick={() => onCreateFolder('/')}
            disabled={!canModifyFolders}
          >
            <FolderPlus className="mr-2 h-4 w-4" />
            New Folder
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {/* Folder tree */}
      {folderStructure.map(folder => renderFolder(folder))}
    </div>
  );
}