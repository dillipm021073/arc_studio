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

interface CreateFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentPath: string;
  onCreateFolder: (folderName: string) => void;
}

export function CreateFolderDialog({
  open,
  onOpenChange,
  parentPath,
  onCreateFolder
}: CreateFolderDialogProps) {
  const [folderName, setFolderName] = useState('');
  const [error, setError] = useState('');

  const handleCreate = () => {
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

    onCreateFolder(trimmedName);
    setFolderName('');
    setError('');
    onOpenChange(false);
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
            Create a new folder to organize your projects
            {parentPath !== '/' && (
              <div className="mt-2 text-xs">
                Parent folder: <span className="font-mono">{parentPath}</span>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="folder-name">Folder Name</Label>
            <Input
              id="folder-name"
              value={folderName}
              onChange={(e) => {
                setFolderName(e.target.value);
                setError('');
              }}
              placeholder="Enter folder name"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
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
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleCreate}>
            Create Folder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}