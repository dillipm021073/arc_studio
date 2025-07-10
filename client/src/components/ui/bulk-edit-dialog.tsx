import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';

export interface BulkEditField {
  name: string;
  label: string;
  type: 'text' | 'select' | 'textarea' | 'date';
  options?: { value: string; label: string }[];
  currentValues?: any[];
}

interface BulkEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  fields: BulkEditField[];
  onSave: (updates: Record<string, any>) => void;
  itemCount: number;
}

export function BulkEditDialog({
  open,
  onOpenChange,
  title,
  description,
  fields,
  onSave,
  itemCount,
}: BulkEditDialogProps) {
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set());
  const [values, setValues] = useState<Record<string, any>>({});

  const fieldInfo = useMemo(() => {
    return fields.map(field => {
      const uniqueValues = field.currentValues ? [...new Set(field.currentValues)] : [];
      const hasMultipleValues = uniqueValues.length > 1;
      const commonValue = uniqueValues.length === 1 ? uniqueValues[0] : undefined;
      
      return {
        ...field,
        hasMultipleValues,
        commonValue,
        uniqueValues,
      };
    });
  }, [fields]);

  const handleFieldToggle = (fieldName: string, checked: boolean) => {
    const newSelected = new Set(selectedFields);
    if (checked) {
      newSelected.add(fieldName);
    } else {
      newSelected.delete(fieldName);
      const newValues = { ...values };
      delete newValues[fieldName];
      setValues(newValues);
    }
    setSelectedFields(newSelected);
  };

  const handleValueChange = (fieldName: string, value: any) => {
    setValues({ ...values, [fieldName]: value });
  };

  const handleSave = () => {
    const updates: Record<string, any> = {};
    selectedFields.forEach(fieldName => {
      if (fieldName in values) {
        updates[fieldName] = values[fieldName];
      }
    });
    onSave(updates);
    onOpenChange(false);
    setSelectedFields(new Set());
    setValues({});
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description || `Edit ${itemCount} selected item${itemCount !== 1 ? 's' : ''}. Check the fields you want to update.`}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {fieldInfo.map(field => (
            <div key={field.name} className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={field.name}
                  checked={selectedFields.has(field.name)}
                  onCheckedChange={(checked) => handleFieldToggle(field.name, !!checked)}
                />
                <Label htmlFor={field.name} className="font-medium">
                  {field.label}
                  {field.hasMultipleValues && (
                    <span className="text-sm text-muted-foreground ml-2">
                      (multiple values)
                    </span>
                  )}
                </Label>
              </div>
              
              {selectedFields.has(field.name) && (
                <div className="ml-6">
                  {field.type === 'text' && (
                    <Input
                      value={values[field.name] ?? field.commonValue ?? ''}
                      onChange={(e) => handleValueChange(field.name, e.target.value)}
                      placeholder={field.hasMultipleValues ? 'Enter new value' : undefined}
                    />
                  )}
                  
                  {field.type === 'textarea' && (
                    <Textarea
                      value={values[field.name] ?? field.commonValue ?? ''}
                      onChange={(e) => handleValueChange(field.name, e.target.value)}
                      placeholder={field.hasMultipleValues ? 'Enter new value' : undefined}
                      rows={3}
                    />
                  )}
                  
                  {field.type === 'select' && field.options && (
                    <Select
                      value={values[field.name] ?? field.commonValue ?? ''}
                      onValueChange={(value) => handleValueChange(field.name, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a value" />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  
                  {field.type === 'date' && (
                    <Input
                      type="date"
                      value={values[field.name] ?? field.commonValue ?? ''}
                      onChange={(e) => handleValueChange(field.name, e.target.value)}
                    />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={selectedFields.size === 0}
          >
            Update {selectedFields.size} field{selectedFields.size !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}