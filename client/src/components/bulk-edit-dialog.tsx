import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export interface BulkEditField {
  key: string;
  label: string;
  type: "text" | "select" | "boolean";
  options?: Array<{ value: string; label: string }>;
  currentValues?: Set<any>;
}

interface BulkEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  fields: BulkEditField[];
  onSubmit: (updates: Record<string, any>) => void;
  entityName: string;
}

export function BulkEditDialog({
  open,
  onOpenChange,
  selectedCount,
  fields,
  onSubmit,
  entityName,
}: BulkEditDialogProps) {
  const [updates, setUpdates] = React.useState<Record<string, any>>({});
  const [enabledFields, setEnabledFields] = React.useState<Set<string>>(new Set());

  const handleFieldToggle = (fieldKey: string, enabled: boolean) => {
    setEnabledFields((prev) => {
      const next = new Set(prev);
      if (enabled) {
        next.add(fieldKey);
      } else {
        next.delete(fieldKey);
        // Remove the update when field is disabled
        setUpdates((prev) => {
          const next = { ...prev };
          delete next[fieldKey];
          return next;
        });
      }
      return next;
    });
  };

  const handleFieldChange = (fieldKey: string, value: any) => {
    setUpdates((prev) => ({
      ...prev,
      [fieldKey]: value,
    }));
  };

  const handleSubmit = () => {
    // Only submit fields that are enabled
    const enabledUpdates: Record<string, any> = {};
    enabledFields.forEach((fieldKey) => {
      if (fieldKey in updates) {
        enabledUpdates[fieldKey] = updates[fieldKey];
      }
    });
    onSubmit(enabledUpdates);
    onOpenChange(false);
    // Reset state
    setUpdates({});
    setEnabledFields(new Set());
  };

  const hasUpdates = enabledFields.size > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-gray-800 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white">
            Bulk Edit {selectedCount} {entityName}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Select the fields you want to update. Only the enabled fields will be modified.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert className="bg-blue-900/20 border-blue-800">
            <Info className="h-4 w-4 text-blue-400" />
            <AlertDescription className="text-blue-300">
              Changes will be applied to all {selectedCount} selected items. 
              Fields with mixed values across selected items will show "Mixed values".
            </AlertDescription>
          </Alert>

          {fields.map((field) => {
            const isEnabled = enabledFields.has(field.key);
            const hasMixedValues = field.currentValues && field.currentValues.size > 1;

            return (
              <div
                key={field.key}
                className={`space-y-2 p-3 rounded-lg border transition-colors ${
                  isEnabled
                    ? "bg-gray-700/50 border-gray-600"
                    : "bg-gray-800/50 border-gray-700"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`enable-${field.key}`}
                    checked={isEnabled}
                    onCheckedChange={(checked) =>
                      handleFieldToggle(field.key, !!checked)
                    }
                    className="border-gray-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  />
                  <Label
                    htmlFor={`enable-${field.key}`}
                    className="text-sm font-medium text-gray-300 cursor-pointer"
                  >
                    {field.label}
                  </Label>
                  {hasMixedValues && (
                    <span className="text-xs text-yellow-400">(Mixed values)</span>
                  )}
                </div>

                {isEnabled && (
                  <div className="ml-6">
                    {field.type === "text" && (
                      <Input
                        id={field.key}
                        value={updates[field.key] || ""}
                        onChange={(e) => handleFieldChange(field.key, e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white"
                        placeholder={hasMixedValues ? "Enter new value..." : ""}
                      />
                    )}

                    {field.type === "select" && field.options && (
                      <Select
                        value={updates[field.key] || ""}
                        onValueChange={(value) => handleFieldChange(field.key, value)}
                      >
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                          <SelectValue placeholder="Select a value..." />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700">
                          {field.options.map((option) => (
                            <SelectItem
                              key={option.value}
                              value={option.value}
                              className="text-gray-300 hover:text-white hover:bg-gray-700"
                            >
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {field.type === "boolean" && (
                      <Select
                        value={String(updates[field.key] || "")}
                        onValueChange={(value) =>
                          handleFieldChange(field.key, value === "true")
                        }
                      >
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                          <SelectValue placeholder="Select a value..." />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700">
                          <SelectItem
                            value="true"
                            className="text-gray-300 hover:text-white hover:bg-gray-700"
                          >
                            Yes
                          </SelectItem>
                          <SelectItem
                            value="false"
                            className="text-gray-300 hover:text-white hover:bg-gray-700"
                          >
                            No
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {!hasUpdates && (
            <Alert className="bg-yellow-900/20 border-yellow-800">
              <AlertCircle className="h-4 w-4 text-yellow-400" />
              <AlertDescription className="text-yellow-300">
                No fields selected. Enable at least one field to apply changes.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!hasUpdates}
            className="bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Apply Changes to {selectedCount} Items
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}