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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus } from 'lucide-react';

interface AddPropertyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (key: string, value: string | number | boolean, type: 'string' | 'number' | 'boolean') => void;
  existingKeys: string[];
}

export default function AddPropertyDialog({ isOpen, onClose, onAdd, existingKeys }: AddPropertyDialogProps) {
  const [propertyName, setPropertyName] = useState('');
  const [propertyType, setPropertyType] = useState<'string' | 'number' | 'boolean'>('string');
  const [propertyValue, setPropertyValue] = useState<string>('');
  const [error, setError] = useState('');

  const handleAdd = () => {
    // Validation
    if (!propertyName.trim()) {
      setError('Property name is required');
      return;
    }
    
    // Convert property name to camelCase
    const key = propertyName.trim()
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s(.)/g, (match, char) => char.toUpperCase())
      .replace(/^(.)/, (match, char) => char.toLowerCase());
    
    if (existingKeys.includes(key)) {
      setError('Property with this name already exists');
      return;
    }
    
    // Convert value based on type
    let value: string | number | boolean = propertyValue;
    if (propertyType === 'number') {
      value = parseFloat(propertyValue) || 0;
    } else if (propertyType === 'boolean') {
      value = propertyValue === 'true';
    }
    
    onAdd(key, value, propertyType);
    handleClose();
  };

  const handleClose = () => {
    setPropertyName('');
    setPropertyType('string');
    setPropertyValue('');
    setError('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Custom Property
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Add a new property to customize this component
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="property-name" className="text-gray-300">
              Property Name
            </Label>
            <Input
              id="property-name"
              value={propertyName}
              onChange={(e) => {
                setPropertyName(e.target.value);
                setError('');
              }}
              placeholder="e.g., Max Connections"
              className="bg-gray-800 border-gray-700 text-white"
            />
            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="property-type" className="text-gray-300">
              Property Type
            </Label>
            <Select value={propertyType} onValueChange={(value: any) => setPropertyType(value)}>
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="string">Text</SelectItem>
                <SelectItem value="number">Number</SelectItem>
                <SelectItem value="boolean">Yes/No</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="property-value" className="text-gray-300">
              Default Value
            </Label>
            {propertyType === 'boolean' ? (
              <Select value={propertyValue} onValueChange={setPropertyValue}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Select value" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="true">Yes</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>
            ) : propertyType === 'number' ? (
              <Input
                id="property-value"
                type="number"
                value={propertyValue}
                onChange={(e) => setPropertyValue(e.target.value)}
                placeholder="0"
                className="bg-gray-800 border-gray-700 text-white"
              />
            ) : (
              <Input
                id="property-value"
                value={propertyValue}
                onChange={(e) => setPropertyValue(e.target.value)}
                placeholder="Enter default value"
                className="bg-gray-800 border-gray-700 text-white"
              />
            )}
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
            onClick={handleAdd}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Property
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}