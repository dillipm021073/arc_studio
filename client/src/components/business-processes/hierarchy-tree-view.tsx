import { useState } from "react";
import { ChevronDown, ChevronRight, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface HierarchyNode {
  id: string;
  name: string;
  characteristics: Record<string, string>;
  children: HierarchyNode[];
  expanded?: boolean;
}

interface HierarchyTreeViewProps {
  hierarchy: HierarchyNode[];
  title?: string;
}

export default function HierarchyTreeView({ hierarchy, title = "Process Hierarchy" }: HierarchyTreeViewProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const toggleExpanded = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const expandAll = () => {
    const allNodeIds = new Set<string>();
    const collectNodeIds = (nodes: HierarchyNode[]) => {
      nodes.forEach(node => {
        allNodeIds.add(node.id);
        if (node.children.length > 0) {
          collectNodeIds(node.children);
        }
      });
    };
    collectNodeIds(hierarchy);
    setExpandedNodes(allNodeIds);
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  const renderNode = (node: HierarchyNode, depth = 0) => {
    const hasChildren = node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const paddingLeft = depth * 24;

    return (
      <div key={node.id} className="select-none">
        <div 
          className="flex items-center py-2 px-2 hover:bg-gray-700 rounded-sm cursor-pointer transition-colors"
          style={{ paddingLeft: `${paddingLeft + 8}px` }}
          onClick={() => hasChildren && toggleExpanded(node.id)}
        >
          <div className="flex items-center gap-2 flex-1">
            {hasChildren ? (
              <Button
                variant="ghost"
                size="sm"
                className="p-0 h-5 w-5 hover:bg-gray-600 text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpanded(node.id);
                }}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            ) : (
              <div className="w-5 h-5 flex items-center justify-center">
                <FileText className="h-3 w-3 text-gray-400" />
              </div>
            )}
            
            <span className="text-sm font-medium text-white truncate">
              {node.name}
            </span>
            
            {/* Show automatic level based on depth */}
            <span className="text-xs text-gray-300 bg-gray-700 px-2 py-1 rounded ml-2">
              Level {depth === 0 ? 'A' : depth === 1 ? 'B' : depth === 2 ? 'C' : 'D+'}
            </span>
          </div>
        </div>

        {/* Render children if expanded */}
        {hasChildren && isExpanded && (
          <div>
            {node.children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const totalNodes = () => {
    const count = (nodes: HierarchyNode[]): number => {
      return nodes.reduce((total, node) => total + 1 + count(node.children), 0);
    };
    return count(hierarchy);
  };

  const maxDepth = () => {
    const depth = (nodes: HierarchyNode[], currentDepth = 0): number => {
      if (nodes.length === 0) return currentDepth;
      return Math.max(...nodes.map(node => 
        node.children.length > 0 ? depth(node.children, currentDepth + 1) : currentDepth + 1
      ));
    };
    return depth(hierarchy);
  };

  if (!hierarchy || hierarchy.length === 0) {
    return (
      <Card className="w-full h-full bg-gray-800 border-gray-700 flex items-center justify-center">
        <CardContent className="p-8 text-center text-gray-400">
          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-500" />
          <p>No hierarchy data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full h-full bg-gray-800 border-gray-700 flex flex-col">
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg text-white">{title}</CardTitle>
            <div className="flex gap-4 text-sm text-gray-400 mt-1">
              <span>{totalNodes()} processes</span>
              <span>{maxDepth()} levels deep</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={expandAll}
              className="text-xs border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <ChevronDown className="h-3 w-3 mr-1" />
              Expand All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={collapseAll}
              className="text-xs border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <ChevronRight className="h-3 w-3 mr-1" />
              Collapse All
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 flex-1 flex flex-col min-h-0">
        <div className="border border-gray-700 rounded-lg bg-gray-900 flex-1 overflow-auto p-2">
          {hierarchy.map(node => renderNode(node))}
        </div>
      </CardContent>
    </Card>
  );
}