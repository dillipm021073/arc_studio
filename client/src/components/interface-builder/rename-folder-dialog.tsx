import { useState, useEffect } from 'react';
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

interface RenameFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderPath: string;
  currentName: string;
  onRename: (newName: string) => void;
}

export function RenameFolderDialog({
  open,
  onOpenChange,
  folderPath,
  currentName,
  onRename
}: RenameFolderDialogProps) {
  const [newName, setNewName] = useState(currentName);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setNewName(currentName);
      setError('');
    }
  }, [open, currentName]);

  const handleRename = () => {
    const trimmedName = newName.trim();
    
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

    if (trimmedName === currentName) {
      setError('New name must be different from current name');
      return;
    }

    onRename(trimmedName);
    onOpenChange(false);
  };

  const handleClose = () => {
    setNewName(currentName);
    setError('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Folder className="h-5 w-5 text-blue-500" />
            Rename Folder
          </DialogTitle>
          <DialogDescription>
            Enter a new name for the folder
            <div className="mt-2 text-xs">
              Current path: <span className="font-mono">{folderPath}</span>
            </div>
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="folder-name">Folder Name</Label>
            <Input
              id="folder-name"
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                setError('');
              }}
              placeholder="Enter new folder name"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleRename();
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
          <Button onClick={handleRename}>
            Rename
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}