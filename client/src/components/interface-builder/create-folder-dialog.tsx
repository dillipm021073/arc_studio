import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Folder } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UmlFolder {
  id: number;
  name: string;
  path: string;
}

interface CreateFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentFolder?: UmlFolder | null;
  onFolderCreated: () => void;
}

export function CreateFolderDialog({
  open,
  onOpenChange,
  parentFolder,
  onFolderCreated
}: CreateFolderDialogProps) {
  const [folderName, setFolderName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleCreate = async () => {
    const trimmedName = folderName.trim();
    
    if (!trimmedName) {
      setError('Folder name is required');
      return;
    }
    
    if (trimmedName.includes('/')) {
      setError('Folder name cannot contain forward slashes');
      return;
    }
    
    if (trimmedName === '.' || trimmedName === '..') {
      setError('Invalid folder name');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/uml/folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: trimmedName,
          description: '',
          parentId: parentFolder?.id || null
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create folder');
      }

      toast({
        title: 'Success',
        description: `Folder "${trimmedName}" created successfully`,
      });

      setFolderName('');
      setError('');
      onOpenChange(false);
      onFolderCreated();
    } catch (err: any) {
      setError(err.message || 'Failed to create folder');
      toast({
        title: 'Error',
        description: err.message || 'Failed to create folder',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFolderName('');
    setError('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Folder className="h-5 w-5 text-blue-500" />
            Create New Folder
          </DialogTitle>
          <DialogDescription>
            Create a new folder to organize your UML diagrams
            {parentFolder && (
              <div className="mt-2 text-xs">
                Parent folder: <span className="font-mono">{parentFolder.name}</span>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="folder-name">Folder Name</Label>
            <Input
              id="folder-name"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="Enter folder name"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isLoading) {
                  handleCreate();
                }
              }}
            />
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={isLoading || !folderName.trim()}
          >
            {isLoading ? 'Creating...' : 'Create Folder'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}