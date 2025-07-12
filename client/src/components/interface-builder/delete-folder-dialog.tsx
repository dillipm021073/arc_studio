import { useState, useEffect } from 'react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Folder, FileText, AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface DeleteFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderPath: string;
  onDelete: () => void;
}

interface ProjectInfo {
  name: string;
  id: string;
  category: string;
}

export function DeleteFolderDialog({
  open,
  onOpenChange,
  folderPath,
  onDelete
}: DeleteFolderDialogProps) {
  const [projectsToDelete, setProjectsToDelete] = useState<ProjectInfo[]>([]);
  const [subfolders, setSubfolders] = useState<string[]>([]);

  // Fetch projects in this folder and all subfolders
  const { data: affectedData } = useQuery({
    queryKey: ['folder-delete-impact', folderPath],
    queryFn: async () => {
      const response = await fetch(`/api/interface-builder/folders/${encodeURIComponent(folderPath)}/impact`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch folder impact');
      return response.json();
    },
    enabled: open && !!folderPath
  });

  useEffect(() => {
    if (affectedData) {
      setProjectsToDelete(affectedData.projects || []);
      setSubfolders(affectedData.subfolders || []);
    }
  }, [affectedData]);

  const handleDelete = () => {
    onDelete();
    onOpenChange(false);
  };

  const totalItems = projectsToDelete.length + subfolders.length;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Delete Folder Confirmation
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>Are you sure you want to delete the folder <strong className="font-mono">{folderPath}</strong>?</p>
            <p className="text-red-600 font-medium">
              This action cannot be undone and will permanently delete:
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 my-4">
          {subfolders.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Folder className="h-4 w-4" />
                Subfolders ({subfolders.length})
              </h4>
              <ScrollArea className="h-32 border rounded-md p-2">
                {subfolders.map(folder => (
                  <div key={folder} className="flex items-center gap-2 py-1">
                    <Folder className="h-3 w-3 text-blue-500" />
                    <span className="text-sm font-mono">{folder}</span>
                  </div>
                ))}
              </ScrollArea>
            </div>
          )}

          {projectsToDelete.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Projects ({projectsToDelete.length})
              </h4>
              <ScrollArea className="h-32 border rounded-md p-2">
                {projectsToDelete.map(project => (
                  <div key={project.id} className="flex items-center justify-between py-1">
                    <span className="text-sm">{project.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {project.category}
                    </Badge>
                  </div>
                ))}
              </ScrollArea>
            </div>
          )}

          {totalItems === 0 && (
            <div className="text-center py-4 text-gray-500">
              <Folder className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>This folder is empty</p>
            </div>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700"
          >
            Delete {totalItems > 0 && `(${totalItems} items)`}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}