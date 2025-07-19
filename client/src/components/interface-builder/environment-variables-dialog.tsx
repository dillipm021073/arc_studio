import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2, Eye, EyeOff, Save, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

interface EnvironmentVariablesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collectionId: number;
  environments: any[];
  currentEnvironmentId: number | null;
}

interface Variable {
  id?: number;
  key: string;
  value: string;
  type: string;
  isSecret: boolean;
  description?: string;
}

export function EnvironmentVariablesDialog({
  open,
  onOpenChange,
  collectionId,
  environments,
  currentEnvironmentId,
}: EnvironmentVariablesDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedEnvironmentId, setSelectedEnvironmentId] = useState<number | null>(currentEnvironmentId);
  const [variables, setVariables] = useState<Variable[]>([]);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (open && selectedEnvironmentId) {
      loadVariables(selectedEnvironmentId);
    }
  }, [open, selectedEnvironmentId]);

  const loadVariables = async (environmentId: number) => {
    setLoading(true);
    try {
      const response = await api.get(`/api/api-test/environments/${environmentId}/variables`);
      setVariables(response.data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load environment variables',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addVariable = () => {
    setVariables([
      ...variables,
      { key: '', value: '', type: 'string', isSecret: false },
    ]);
  };

  const updateVariable = (index: number, field: keyof Variable, value: any) => {
    const updated = [...variables];
    updated[index] = { ...updated[index], [field]: value };
    setVariables(updated);
  };

  const removeVariable = (index: number) => {
    setVariables(variables.filter((_, i) => i !== index));
  };

  const saveVariable = async (variable: Variable, index: number) => {
    if (!selectedEnvironmentId || !variable.key) return;

    setSaving(true);
    try {
      const response = await api.post(`/api/api-test/environments/${selectedEnvironmentId}/variables`, {
        key: variable.key,
        value: variable.value,
        type: variable.type,
        isSecret: variable.isSecret,
        description: variable.description,
      });

      // Update the variable with the saved data
      const updated = [...variables];
      updated[index] = response.data;
      setVariables(updated);

      toast({
        title: 'Variable Saved',
        description: `${variable.key} has been saved`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save variable',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteVariable = async (variable: Variable, index: number) => {
    if (!variable.id) {
      // Just remove from local state if not saved yet
      removeVariable(index);
      return;
    }

    try {
      await api.delete(`/api/api-test/variables/${variable.id}`);
      removeVariable(index);
      toast({
        title: 'Variable Deleted',
        description: `${variable.key} has been deleted`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete variable',
        variant: 'destructive',
      });
    }
  };

  const toggleSecretVisibility = (key: string) => {
    setShowSecrets({
      ...showSecrets,
      [key]: !showSecrets[key],
    });
  };

  const selectedEnvironment = environments.find(env => env.id === selectedEnvironmentId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Environment Variables</DialogTitle>
        </DialogHeader>

        <Tabs
          value={selectedEnvironmentId?.toString() || ''}
          onValueChange={(value) => setSelectedEnvironmentId(parseInt(value))}
        >
          <TabsList className="grid grid-cols-4 w-full">
            {environments.map(env => (
              <TabsTrigger key={env.id} value={env.id.toString()}>
                <div className="flex items-center gap-2">
                  {env.color && (
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: env.color }}
                    />
                  )}
                  <span>{env.displayName}</span>
                </div>
              </TabsTrigger>
            ))}
          </TabsList>

          {environments.map(env => (
            <TabsContent key={env.id} value={env.id.toString()} className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Variables for {env.displayName} environment
                </p>
                <Button size="sm" onClick={addVariable}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Variable
                </Button>
              </div>

              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {variables.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No variables defined yet.
                      </div>
                    ) : (
                      variables.map((variable, index) => (
                        <div key={index} className="border rounded-lg p-4 space-y-3">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Key</Label>
                              <Input
                                value={variable.key}
                                onChange={(e) => updateVariable(index, 'key', e.target.value)}
                                placeholder="Variable name (e.g., API_KEY)"
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label>Type</Label>
                              <div className="flex gap-2 items-center mt-1">
                                <select
                                  value={variable.type}
                                  onChange={(e) => updateVariable(index, 'type', e.target.value)}
                                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                                >
                                  <option value="string">String</option>
                                  <option value="number">Number</option>
                                  <option value="boolean">Boolean</option>
                                </select>
                                <label className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={variable.isSecret}
                                    onChange={(e) => updateVariable(index, 'isSecret', e.target.checked)}
                                  />
                                  <span className="text-sm">Secret</span>
                                </label>
                              </div>
                            </div>
                          </div>

                          <div>
                            <Label>Value</Label>
                            <div className="relative mt-1">
                              <Input
                                type={variable.isSecret && !showSecrets[variable.key] ? 'password' : 'text'}
                                value={variable.value}
                                onChange={(e) => updateVariable(index, 'value', e.target.value)}
                                placeholder="Variable value"
                              />
                              {variable.isSecret && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                                  onClick={() => toggleSecretVisibility(variable.key)}
                                >
                                  {showSecrets[variable.key] ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </Button>
                              )}
                            </div>
                          </div>

                          <div>
                            <Label>Description (optional)</Label>
                            <Textarea
                              value={variable.description || ''}
                              onChange={(e) => updateVariable(index, 'description', e.target.value)}
                              placeholder="What is this variable used for?"
                              className="mt-1 min-h-[60px]"
                            />
                          </div>

                          <div className="flex justify-between items-center">
                            <div className="text-sm text-muted-foreground">
                              Use as: <code className="bg-muted px-1 py-0.5 rounded">{`{{${variable.key}}}`}</code>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => saveVariable(variable, index)}
                                disabled={!variable.key || saving}
                              >
                                {saving ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Save className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteVariable(variable, index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}