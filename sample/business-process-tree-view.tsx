import { useState, useMemo } from "react";
import { ChevronRight, ChevronDown, Building2, GitBranch, Users, Hash, MoreVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Edit, Eye, Network, Copy, Trash2, UserPlus } from "lucide-react";
import { useLocation } from "wouter";
import CommunicationBadge from "@/components/communications/communication-badge";

interface BusinessProcess {
  id: number;
  businessProcess: string;
  lob: string;
  product: string;
  version: string;
  level: string;
  domainOwner: string | null;
  itOwner: string | null;
  vendorFocal: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface ProcessRelationship {
  parentProcessId: number;
  childProcessId: number;
  sequenceNumber: number;
}

interface TreeNode {
  process: BusinessProcess;
  children: TreeNode[];
  sequenceNumber?: number;
}

interface BusinessProcessTreeViewProps {
  processes: BusinessProcess[];
  relationships: ProcessRelationship[];
  searchTerm: string;
  onEdit: (process: BusinessProcess) => void;
  onView: (process: BusinessProcess) => void;
  onDelete: (process: BusinessProcess) => void;
  onDuplicate: (process: BusinessProcess) => void;
  onCreateChild: (process: BusinessProcess) => void;
}

export default function BusinessProcessTreeView({
  processes,
  relationships,
  searchTerm,
  onEdit,
  onView,
  onDelete,
  onDuplicate,
  onCreateChild,
}: BusinessProcessTreeViewProps) {
  const [, navigate] = useLocation();
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());
  const [selectedNode, setSelectedNode] = useState<number | null>(null);

  // Build tree structure
  const processTree = useMemo(() => {
    const processMap = new Map<number, BusinessProcess>();
    processes.forEach(p => processMap.set(p.id, p));

    // Create a map of parent to children
    const childrenMap = new Map<number, { process: BusinessProcess; sequenceNumber: number }[]>();
    
    relationships.forEach(rel => {
      const child = processMap.get(rel.childProcessId);
      if (child) {
        if (!childrenMap.has(rel.parentProcessId)) {
          childrenMap.set(rel.parentProcessId, []);
        }
        childrenMap.get(rel.parentProcessId)?.push({
          process: child,
          sequenceNumber: rel.sequenceNumber
        });
      }
    });

    // Sort children by sequence number
    childrenMap.forEach(children => {
      children.sort((a, b) => a.sequenceNumber - b.sequenceNumber);
    });

    // Build tree recursively
    const buildTree = (processId: number): TreeNode => {
      const process = processMap.get(processId)!;
      const children = childrenMap.get(processId) || [];
      
      return {
        process,
        children: children.map(child => ({
          ...buildTree(child.process.id),
          sequenceNumber: child.sequenceNumber
        }))
      };
    };

    // Find root nodes (Level A processes without parents)
    const rootProcesses = processes.filter(p => {
      if (p.level !== 'A') return false;
      return !relationships.some(rel => rel.childProcessId === p.id);
    });

    // Sort root processes by name
    rootProcesses.sort((a, b) => a.businessProcess.localeCompare(b.businessProcess));

    return rootProcesses.map(p => buildTree(p.id));
  }, [processes, relationships]);

  // Filter tree based on search term
  const filteredTree = useMemo(() => {
    if (!searchTerm) return processTree;

    const searchLower = searchTerm.toLowerCase();
    
    const filterTree = (node: TreeNode): TreeNode | null => {
      const matchesSearch = 
        node.process.businessProcess.toLowerCase().includes(searchLower) ||
        node.process.lob.toLowerCase().includes(searchLower) ||
        node.process.product.toLowerCase().includes(searchLower) ||
        (node.process.domainOwner?.toLowerCase().includes(searchLower) ?? false) ||
        (node.process.itOwner?.toLowerCase().includes(searchLower) ?? false);

      const filteredChildren = node.children
        .map(child => filterTree(child))
        .filter(child => child !== null) as TreeNode[];

      if (matchesSearch || filteredChildren.length > 0) {
        return {
          ...node,
          children: filteredChildren
        };
      }

      return null;
    };

    return processTree
      .map(node => filterTree(node))
      .filter(node => node !== null) as TreeNode[];
  }, [processTree, searchTerm]);

  const toggleExpanded = (processId: number) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(processId)) {
        newSet.delete(processId);
      } else {
        newSet.add(processId);
      }
      return newSet;
    });
  };

  const getStatusBadge = (status: string) => {
    const className = 
      status === "new" ? "bg-purple-600 text-white" :
      status === "active" ? "bg-green-600 text-white" :
      status === "inactive" ? "bg-red-600 text-white" :
      status === "maintenance" ? "bg-blue-600 text-white" :
      "bg-orange-600 text-white";
    
    return <Badge className={className}>{status}</Badge>;
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'A': return 'border-l-blue-500';
      case 'B': return 'border-l-purple-500';
      case 'C': return 'border-l-pink-500';
      default: return 'border-l-gray-500';
    }
  };

  const renderTreeNode = (node: TreeNode, depth: number = 0, parentSequence: string = '') => {
    const { process, children, sequenceNumber } = node;
    const hasChildren = children.length > 0;
    const isExpanded = expandedNodes.has(process.id);
    const isSelected = selectedNode === process.id;
    const currentSequence = parentSequence 
      ? `${parentSequence}.${sequenceNumber || 1}` 
      : `${sequenceNumber || 1}.0`;

    return (
      <div key={process.id} className="w-full">
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <div
              className={`
                flex items-center justify-between p-3 rounded-lg border-l-4 
                ${getLevelColor(process.level)}
                ${isSelected ? 'bg-gray-700' : 'bg-gray-800 hover:bg-gray-700'}
                transition-colors cursor-pointer mb-1
              `}
              style={{ marginLeft: `${depth * 24}px` }}
              onClick={() => setSelectedNode(process.id)}
            >
              <div className="flex items-center flex-1 min-w-0">
                {hasChildren && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpanded(process.id);
                    }}
                    className="mr-2 text-gray-400 hover:text-white transition-colors"
                  >
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                )}
                {!hasChildren && <div className="w-5 mr-2" />}
                
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Badge variant="outline" className="text-xs bg-gray-700">
                    <Hash className="h-3 w-3 mr-1" />
                    {currentSequence}
                  </Badge>
                  
                  <span className="font-medium text-white truncate">{process.businessProcess}</span>
                  
                  <Badge className="bg-gray-700 text-white" variant="outline">
                    Level {process.level}
                  </Badge>
                  
                  {getStatusBadge(process.status)}
                  
                  <CommunicationBadge 
                    entityType="business_process" 
                    entityId={process.id} 
                    entityName={process.businessProcess}
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 ml-4">
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  {process.lob && (
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {process.lob}
                    </span>
                  )}
                  {process.domainOwner && (
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {process.domainOwner}
                    </span>
                  )}
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4 text-gray-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                    <DropdownMenuItem
                      onClick={() => onEdit(process)}
                      className="text-gray-300 hover:text-white hover:bg-gray-700"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onView(process)}
                      className="text-gray-300 hover:text-white hover:bg-gray-700"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => navigate(`/business-processes/${process.id}/diagram`)}
                      className="text-gray-300 hover:text-white hover:bg-gray-700"
                    >
                      <Network className="mr-2 h-4 w-4" />
                      View IML Diagram
                    </DropdownMenuItem>
                    <DropdownMenuTrigger />
                    {process.level !== 'C' && (
                      <>
                        <DropdownMenuItem
                          onClick={() => onCreateChild(process)}
                          className="text-green-400 hover:text-green-300 hover:bg-gray-700"
                        >
                          <UserPlus className="mr-2 h-4 w-4" />
                          Add Level {process.level === 'A' ? 'B' : 'C'} Process
                        </DropdownMenuItem>
                        <DropdownMenuTrigger />
                      </>
                    )}
                    <DropdownMenuItem
                      onClick={() => onDuplicate(process)}
                      className="text-gray-300 hover:text-white hover:bg-gray-700"
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Duplicate and Edit
                    </DropdownMenuItem>
                    <DropdownMenuTrigger />
                    <DropdownMenuItem
                      onClick={() => onDelete(process)}
                      className="text-red-400 hover:text-red-300 hover:bg-gray-700"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent className="bg-gray-800 border-gray-700">
            <ContextMenuItem
              onClick={() => onEdit(process)}
              className="text-gray-300 hover:text-white hover:bg-gray-700"
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => onView(process)}
              className="text-gray-300 hover:text-white hover:bg-gray-700"
            >
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => navigate(`/business-processes/${process.id}/diagram`)}
              className="text-gray-300 hover:text-white hover:bg-gray-700"
            >
              <Network className="mr-2 h-4 w-4" />
              View IML Diagram
            </ContextMenuItem>
            <ContextMenuSeparator className="bg-gray-700" />
            {process.level !== 'C' && (
              <>
                <ContextMenuItem
                  onClick={() => onCreateChild(process)}
                  className="text-green-400 hover:text-green-300 hover:bg-gray-700"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Level {process.level === 'A' ? 'B' : 'C'} Process
                </ContextMenuItem>
                <ContextMenuSeparator className="bg-gray-700" />
              </>
            )}
            <ContextMenuItem
              onClick={() => onDuplicate(process)}
              className="text-gray-300 hover:text-white hover:bg-gray-700"
            >
              <Copy className="mr-2 h-4 w-4" />
              Duplicate and Edit
            </ContextMenuItem>
            <ContextMenuSeparator className="bg-gray-700" />
            <ContextMenuItem
              onClick={() => onDelete(process)}
              className="text-red-400 hover:text-red-300 hover:bg-gray-700"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>

        {isExpanded && children.length > 0 && (
          <div className="mt-1">
            {children.map(child => renderTreeNode(child, depth + 1, currentSequence))}
          </div>
        )}
      </div>
    );
  };

  if (filteredTree.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <GitBranch className="h-12 w-12 mb-4 text-gray-600" />
        <p className="text-lg font-medium">No business processes found</p>
        <p className="text-sm mt-2">
          {searchTerm ? "Try adjusting your search" : "Create your first business process to get started"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {filteredTree.map(node => renderTreeNode(node))}
    </div>
  );
}