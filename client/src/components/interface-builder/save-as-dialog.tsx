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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Save, Users, Folder } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

interface SaveAsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (projectData: {
    name: string;
    description: string;
    category: 'ecommerce' | 'finance' | 'blog' | 'enterprise' | 'custom';
    storageLocation: 'team' | 'local';
    folderPath?: string;
  }) => void;
  existingName?: string;
  existingDescription?: string;
  existingCategory?: string;
  currentFolderPath?: string;
}

export default function SaveAsDialog({
  isOpen,
  onClose,
  onSave,
  existingName = '',
  existingDescription = '',
  existingCategory = 'custom',
  currentFolderPath = '/'
}: SaveAsDialogProps) {
  const { user } = useAuth();
  const isManagerOrAdmin = user?.role === 'Manager' || user?.role === 'Admin';
  
  const [formData, setFormData] = useState({
    name: existingName ? `${existingName} (Copy)` : 'New Project',
    description: existingDescription || 'A new interface design project',
    category: existingCategory as any || 'custom',
    storageLocation: 'team' as 'team' | 'local',
    folderPath: currentFolderPath
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [folders, setFolders] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadFolders();
    }
  }, [isOpen]);

  const loadFolders = async () => {
    try {
      const response = await fetch('/api/interface-builder/folders', {
        credentials: 'include'
      });
      if (response.ok) {
        const folderList = await response.json();
        setFolders(folderList);
      }
    } catch (error) {
      console.error('Failed to load folders:', error);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required';
    }
    
    if (formData.name.length > 50) {
      newErrors.name = 'Project name must be less than 50 characters';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (formData.description.length > 200) {
      newErrors.description = 'Description must be less than 200 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave(formData);
      onClose();
    }
  };

  const handleClose = () => {
    setFormData({
      name: existingName ? `${existingName} (Copy)` : 'New Project',
      description: existingDescription || 'A new interface design project',
      category: existingCategory as any || 'custom',
      storageLocation: 'team' as 'team' | 'local',
      folderPath: currentFolderPath
    });
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md bg-gray-900 border-gray-700">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Save className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-white">Save As New Project</DialogTitle>
              <DialogDescription className="text-gray-400">
                Create a new project with the current canvas design
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-gray-300">
              Project Name
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (errors.name) setErrors({ ...errors, name: '' });
              }}
              className="bg-gray-800 border-gray-700 text-white"
              placeholder="Enter project name"
            />
            {errors.name && (
              <p className="text-red-400 text-sm">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-gray-300">
              Description
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => {
                setFormData({ ...formData, description: e.target.value });
                if (errors.description) setErrors({ ...errors, description: '' });
              }}
              className="bg-gray-800 border-gray-700 text-white min-h-[80px]"
              placeholder="Describe your project"
            />
            {errors.description && (
              <p className="text-red-400 text-sm">{errors.description}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category" className="text-gray-300">
              Category
            </Label>
            <Select 
              value={formData.category} 
              onValueChange={(value: any) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="ecommerce">E-commerce</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
                <SelectItem value="blog">Blog/CMS</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="storageLocation" className="text-gray-300">
              Storage Location
            </Label>
            <Select 
              value={formData.storageLocation} 
              onValueChange={(value: 'team' | 'local') => setFormData({ ...formData, storageLocation: value })}
            >
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="local">Local Storage</SelectItem>
                <SelectItem value="team">Team Project</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              {formData.storageLocation === 'team' 
                ? 'Team projects are visible to all users in your organization'
                : 'Local projects are stored on your device and only visible to you'}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="folder" className="text-gray-300">
              <Folder className="h-3 w-3 inline mr-1" />
              Folder
            </Label>
            <Select 
              value={formData.folderPath} 
              onValueChange={(value) => setFormData({ ...formData, folderPath: value })}
            >
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="/">Root (All Projects)</SelectItem>
                {folders.map(folder => (
                  <SelectItem key={folder} value={folder}>
                    {folder}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              Organize your project in folders for better management
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            className="border-gray-600 hover:bg-gray-700"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="h-4 w-4 mr-2" />
            Save as New Project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}