import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Trash2, 
  ChevronDown, 
  ChevronRight, 
  Copy, 
  Save,
  Download,
  RotateCcw,
  Users,
  ArrowUp,
  ArrowDown,
  FileJson,
  Upload,
  AlertTriangle
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface HierarchyNode {
  id: string;
  name: string;
  characteristics: Record<string, string>;
  children: HierarchyNode[];
  expanded?: boolean;
}

interface HierarchyBuilderProps {
  initialHierarchy?: HierarchyNode[];
  initialMetadata?: {
    name?: string;
    description?: string;
    tags?: string;
  };
  onSave?: (hierarchy: HierarchyNode[], metadata: any) => void;
  readOnly?: boolean;
}

const defaultCharacteristics = {
  "description": ""
};

export default function BusinessProcessHierarchyBuilder({ 
  initialHierarchy = [], 
  initialMetadata,
  onSave,
  readOnly = false 
}: HierarchyBuilderProps) {
  const nodeCounter = useRef(0);
  const { toast } = useToast();

  function createNode(name?: string): HierarchyNode {
    return {
      id: `node-${nodeCounter.current++}`,
      name: name || `Node ${nodeCounter.current}`,
      characteristics: { ...defaultCharacteristics },
      children: [],
      expanded: true
    };
  }

  const [hierarchy, setHierarchy] = useState<HierarchyNode[]>(
    initialHierarchy.length > 0 ? initialHierarchy : [createNode()]
  );
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [jsonOutput, setJsonOutput] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [designName, setDesignName] = useState(initialMetadata?.name || "");
  const [designDescription, setDesignDescription] = useState(initialMetadata?.description || "");
  const [designTags, setDesignTags] = useState(initialMetadata?.tags || "");
  const [jsonError, setJsonError] = useState<string | null>(null);

  const generateJSON = useCallback(() => {
    // Add automatic levels to hierarchy before serializing
    const addLevelsToHierarchy = (nodes: HierarchyNode[], depth = 0): HierarchyNode[] => {
      return nodes.map(node => ({
        ...node,
        characteristics: {
          ...node.characteristics,
          level: depth === 0 ? 'A' : depth === 1 ? 'B' : depth === 2 ? 'C' : 'D+'
        },
        children: addLevelsToHierarchy(node.children, depth + 1)
      }));
    };

    const hierarchyWithLevels = addLevelsToHierarchy(hierarchy);
    const output = JSON.stringify(hierarchyWithLevels, null, 2);
    setJsonOutput(output);
    setJsonError(null);
    return output;
  }, [hierarchy]);

  const generateFromJSON = useCallback(() => {
    try {
      if (!jsonOutput.trim()) {
        setJsonError("JSON input is empty");
        return;
      }

      const parsedHierarchy = JSON.parse(jsonOutput);
      
      // Validate the structure
      if (!Array.isArray(parsedHierarchy)) {
        setJsonError("JSON must be an array of hierarchy nodes");
        return;
      }

      // Validate each node has required properties
      const validateNode = (node: any, path = ""): boolean => {
        if (!node || typeof node !== 'object') {
          setJsonError(`Invalid node at ${path}: must be an object`);
          return false;
        }
        if (!node.id || typeof node.id !== 'string') {
          setJsonError(`Invalid node at ${path}: missing or invalid 'id' property`);
          return false;
        }
        if (!node.name || typeof node.name !== 'string') {
          setJsonError(`Invalid node at ${path}: missing or invalid 'name' property`);
          return false;
        }
        if (!node.characteristics || typeof node.characteristics !== 'object') {
          setJsonError(`Invalid node at ${path}: missing or invalid 'characteristics' property`);
          return false;
        }
        if (!Array.isArray(node.children)) {
          setJsonError(`Invalid node at ${path}: 'children' must be an array`);
          return false;
        }

        // Validate children recursively
        for (let i = 0; i < node.children.length; i++) {
          if (!validateNode(node.children[i], `${path}.children[${i}]`)) {
            return false;
          }
        }
        return true;
      };

      for (let i = 0; i < parsedHierarchy.length; i++) {
        if (!validateNode(parsedHierarchy[i], `[${i}]`)) {
          return;
        }
      }

      // Update node counter to avoid ID conflicts
      const updateNodeCounter = (nodes: HierarchyNode[]) => {
        nodes.forEach(node => {
          const nodeNum = parseInt(node.id.replace('node-', ''));
          if (!isNaN(nodeNum) && nodeNum >= nodeCounter.current) {
            nodeCounter.current = nodeNum + 1;
          }
          if (node.children.length > 0) {
            updateNodeCounter(node.children);
          }
        });
      };

      updateNodeCounter(parsedHierarchy);
      setHierarchy(parsedHierarchy);
      setJsonError(null);
      setSelectedNodeId(null);

      toast({
        title: "Success",
        description: "Hierarchy updated from JSON successfully",
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Invalid JSON format";
      setJsonError(errorMessage);
      toast({
        title: "Invalid JSON",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [jsonOutput, toast]);

  const findNodePath = useCallback((nodes: HierarchyNode[], targetId: string, path: number[] = []): number[] | null => {
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i].id === targetId) {
        return [...path, i];
      }
      const childPath = findNodePath(nodes[i].children, targetId, [...path, i]);
      if (childPath) return childPath;
    }
    return null;
  }, []);

  const updateNodeAtPath = useCallback((nodes: HierarchyNode[], path: number[], updater: (node: HierarchyNode) => HierarchyNode): HierarchyNode[] => {
    if (path.length === 0) return nodes;
    
    const [index, ...restPath] = path;
    return nodes.map((node, i) => {
      if (i === index) {
        if (restPath.length === 0) {
          return updater(node);
        } else {
          return {
            ...node,
            children: updateNodeAtPath(node.children, restPath, updater)
          };
        }
      }
      return node;
    });
  }, []);

  const addChild = useCallback((parentId: string) => {
    setHierarchy(prev => {
      const addChildRecursive = (nodes: HierarchyNode[]): HierarchyNode[] => {
        return nodes.map(node => {
          if (node.id === parentId) {
            return {
              ...node,
              children: [...node.children, createNode()],
              expanded: true
            };
          }
          if (node.children.length > 0) {
            return {
              ...node,
              children: addChildRecursive(node.children)
            };
          }
          return node;
        });
      };
      
      return addChildRecursive(prev);
    });
  }, []);

  const addSibling = useCallback((nodeId: string) => {
    setHierarchy(prev => {
      let siblingAdded = false;
      
      const addSiblingRecursive = (nodes: HierarchyNode[]): HierarchyNode[] => {
        const result: HierarchyNode[] = [];
        
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];
          result.push({
            ...node,
            children: addSiblingRecursive(node.children)
          });
          
          // Add sibling after this node if it matches our target
          if (node.id === nodeId && !siblingAdded) {
            result.push(createNode());
            siblingAdded = true;
          }
        }
        
        return result;
      };
      
      return addSiblingRecursive(prev);
    });
  }, []);

  const deleteNode = useCallback((nodeId: string) => {
    setHierarchy(prev => {
      const deleteNodeRecursive = (nodes: HierarchyNode[]): HierarchyNode[] => {
        return nodes
          .filter(node => node.id !== nodeId)
          .map(node => ({
            ...node,
            children: deleteNodeRecursive(node.children)
          }));
      };
      
      return deleteNodeRecursive(prev);
    });
  }, []);

  const updateNode = useCallback((nodeId: string, updates: Partial<HierarchyNode>) => {
    setHierarchy(prev => {
      const updateNodeRecursive = (nodes: HierarchyNode[]): HierarchyNode[] => {
        return nodes.map(node => {
          if (node.id === nodeId) {
            return { ...node, ...updates };
          }
          if (node.children.length > 0) {
            return {
              ...node,
              children: updateNodeRecursive(node.children)
            };
          }
          return node;
        });
      };
      
      return updateNodeRecursive(prev);
    });
  }, []);

  const toggleExpanded = useCallback((nodeId: string) => {
    setHierarchy(prev => {
      const updateNodeRecursive = (nodes: HierarchyNode[]): HierarchyNode[] => {
        return nodes.map(node => {
          if (node.id === nodeId) {
            return { ...node, expanded: !node.expanded };
          }
          if (node.children.length > 0) {
            return {
              ...node,
              children: updateNodeRecursive(node.children)
            };
          }
          return node;
        });
      };
      
      return updateNodeRecursive(prev);
    });
  }, []);

  const expandAll = useCallback(() => {
    const expandNode = (node: HierarchyNode): HierarchyNode => ({
      ...node,
      expanded: true,
      children: node.children.map(expandNode)
    });
    setHierarchy(prev => prev.map(expandNode));
  }, []);

  const collapseAll = useCallback(() => {
    const collapseNode = (node: HierarchyNode): HierarchyNode => ({
      ...node,
      expanded: false,
      children: node.children.map(collapseNode)
    });
    setHierarchy(prev => prev.map(collapseNode));
  }, []);

  const handleSave = useCallback(async () => {
    if (!designName.trim()) {
      toast({
        title: "Error",
        description: "Please provide a name for the hierarchy design",
        variant: "destructive",
      });
      return;
    }

    // Use current JSON output as the source of truth, or generate if empty
    const finalJsonOutput = jsonOutput.trim() || generateJSON();
    let finalHierarchy = hierarchy;
    
    // If JSON was manually edited, parse it as the final hierarchy
    if (jsonOutput.trim() && jsonOutput !== JSON.stringify(hierarchy, null, 2)) {
      try {
        finalHierarchy = JSON.parse(jsonOutput);
      } catch (error) {
        toast({
          title: "Invalid JSON",
          description: "Please fix JSON errors before saving",
          variant: "destructive",
        });
        return;
      }
    }

    const metadata = {
      name: designName,
      description: designDescription,
      tags: designTags.split(',').map(tag => tag.trim()).filter(Boolean),
      nodeCount: finalJsonOutput.match(/"id":/g)?.length || 0,
      maxDepth: calculateMaxDepth(finalHierarchy)
    };

    try {
      await onSave?.(finalHierarchy, metadata);
      setIsDialogOpen(false);
      setDesignName("");
      setDesignDescription("");
      setDesignTags("");
      toast({
        title: "Success",
        description: "Hierarchy design saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save hierarchy design",
        variant: "destructive",
      });
    }
  }, [hierarchy, designName, designDescription, designTags, generateJSON, onSave, toast]);

  const calculateMaxDepth = (nodes: HierarchyNode[], depth = 0): number => {
    if (nodes.length === 0) return depth;
    return Math.max(...nodes.map(node => 
      node.children.length > 0 ? calculateMaxDepth(node.children, depth + 1) : depth + 1
    ));
  };

  const copyToClipboard = useCallback(() => {
    const json = generateJSON();
    navigator.clipboard.writeText(json);
    toast({
      title: "Copied",
      description: "JSON copied to clipboard",
    });
  }, [generateJSON, toast]);

  const renderNode = (node: HierarchyNode, depth = 0) => {
    const isSelected = selectedNodeId === node.id;
    const hasChildren = node.children.length > 0;
    const isExpanded = node.expanded !== false;

    return (
      <div key={node.id} className="relative">
        <div 
          className={`border rounded-lg p-4 mb-2 transition-all ${
            isSelected ? 'border-blue-500 bg-blue-900/20' : 'border-gray-700 hover:border-gray-600 bg-gray-800'
          }`}
          style={{ marginLeft: depth * 20 }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {hasChildren && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpanded(node.id);
                  }}
                  className="p-0 h-6 w-6"
                  disabled={readOnly}
                >
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
              )}
              <Input
                value={node.name}
                onChange={(e) => {
                  e.stopPropagation();
                  updateNode(node.id, { name: e.target.value });
                }}
                onFocus={(e) => {
                  e.stopPropagation();
                  setSelectedNodeId(node.id);
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedNodeId(node.id);
                }}
                className="font-medium bg-gray-700 border-gray-600 text-white"
                placeholder="Node name"
                disabled={readOnly}
              />
              <Badge variant="outline" className="border-gray-600 text-gray-300 ml-2">
                Level {depth === 0 ? 'A' : depth === 1 ? 'B' : depth === 2 ? 'C' : 'D+'}
              </Badge>
            </div>
            
            {!readOnly && (
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    addChild(node.id);
                  }}
                  title="Add Child"
                >
                  <Plus className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    addSibling(node.id);
                  }}
                  title="Add Sibling"
                  className="text-purple-600"
                >
                  <Users className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNode(node.id);
                  }}
                  title="Delete"
                  className="text-red-600"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>

          {/* Node Description */}
          <div className="space-y-2">
            <Input
              value={node.characteristics.description || ""}
              onChange={(e) => {
                e.stopPropagation();
                updateNode(node.id, {
                  characteristics: { ...node.characteristics, description: e.target.value }
                });
              }}
              onFocus={(e) => {
                e.stopPropagation();
                setSelectedNodeId(node.id);
              }}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedNodeId(node.id);
              }}
              placeholder="Enter process description (optional)"
              className="text-sm bg-gray-700 border-gray-600 text-white"
              disabled={readOnly}
            />
          </div>
        </div>

        {/* Render children */}
        {hasChildren && isExpanded && (
          <div className="ml-4">
            {node.children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      {/* Hierarchy Editor */}
      <Card className="flex flex-col bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-white">
            <span>Hierarchy Editor</span>
            <div className="flex gap-2">
              <Badge variant="outline" className="border-gray-600 text-gray-300">
                {JSON.stringify(hierarchy).match(/"id":/g)?.length || 0} nodes
              </Badge>
              <Badge variant="outline" className="border-gray-600 text-gray-300">
                Max depth: {calculateMaxDepth(hierarchy)}
              </Badge>
            </div>
          </CardTitle>
          <div className="flex gap-2 flex-wrap">
            {!readOnly && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setHierarchy([...hierarchy, createNode()])}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Root
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={expandAll}
                >
                  <ChevronDown className="h-4 w-4 mr-1" />
                  Expand All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={collapseAll}
                >
                  <ChevronRight className="h-4 w-4 mr-1" />
                  Collapse All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setHierarchy([createNode()])}
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Reset
                </Button>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto">
          <div className="space-y-2">
            {hierarchy.map(node => renderNode(node))}
          </div>
        </CardContent>
      </Card>

      {/* JSON Output */}
      <Card className="flex flex-col bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">JSON Output</CardTitle>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={generateJSON}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <FileJson className="h-4 w-4 mr-1" />
              Generate JSON
            </Button>
            {!readOnly && (
              <Button
                variant="outline"
                size="sm"
                onClick={generateFromJSON}
                className={jsonError ? "border-red-500 text-red-600" : "border-gray-600 text-gray-300 hover:bg-gray-700"}
              >
                <Upload className="h-4 w-4 mr-1" />
                Generate from JSON
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={copyToClipboard}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <Copy className="h-4 w-4 mr-1" />
              Copy
            </Button>
            {!readOnly && onSave && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={generateJSON}
                  >
                    <Save className="h-4 w-4 mr-1" />
                    Save Design
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Save Hierarchy Design</DialogTitle>
                    <DialogDescription>
                      Provide details for your hierarchy design to save it for future use.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={designName}
                        onChange={(e) => setDesignName(e.target.value)}
                        placeholder="Enter design name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={designDescription}
                        onChange={(e) => setDesignDescription(e.target.value)}
                        placeholder="Enter design description"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="tags">Tags (comma-separated)</Label>
                      <Input
                        id="tags"
                        value={designTags}
                        onChange={(e) => setDesignTags(e.target.value)}
                        placeholder="e.g., financial, process, template"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleSave}>
                        Save Design
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          {jsonError && (
            <div className="mb-2 p-2 bg-red-900/20 border border-red-600 rounded text-red-400 text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span>{jsonError}</span>
            </div>
          )}
          <Textarea
            value={jsonOutput}
            onChange={(e) => {
              setJsonOutput(e.target.value);
              if (jsonError) setJsonError(null); // Clear error when user starts typing
            }}
            readOnly={readOnly}
            className={`flex-1 min-h-[400px] font-mono text-sm bg-gray-900 border-gray-600 text-white ${jsonError ? 'border-red-500' : ''}`}
            placeholder={readOnly ? "JSON structure will be displayed here" : "Edit JSON directly or click 'Generate JSON' to sync from hierarchy"}
          />
        </CardContent>
      </Card>
    </div>
  );
}