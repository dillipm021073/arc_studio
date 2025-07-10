import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { ChevronRight, ChevronDown, Building2, GitBranch, Users, Hash, MoreVertical, GripVertical, ChevronLeft, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Button } from "@/components/ui/button";
import { Edit, Eye, Network, Copy, Trash2, UserPlus, Clipboard, ClipboardPaste } from "lucide-react";
import { useLocation } from "wouter";
import CommunicationBadge from "@/components/communications/communication-badge";
import { useToast } from "@/hooks/use-toast";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  CollisionDetection,
  pointerWithin,
  rectIntersection,
  getFirstCollision,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useSortable } from '@dnd-kit/sortable';
import { cn } from "@/lib/utils";

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
  onMoveProcess: (processId: number, newParentId: number | null, position?: number) => Promise<void>;
  onCopyPaste?: (sourceProcessId: number, targetParentId: number | null) => Promise<void>;
}

interface SortableTreeNodeProps {
  node: TreeNode;
  depth: number;
  parentSequence: string;
  isExpanded: boolean;
  isSelected: boolean;
  isFocused: boolean;
  onToggleExpanded: (processId: number) => void;
  onSelectNode: (processId: number) => void;
  onEdit: (process: BusinessProcess) => void;
  onView: (process: BusinessProcess) => void;
  onDelete: (process: BusinessProcess) => void;
  onDuplicate: (process: BusinessProcess) => void;
  onCreateChild: (process: BusinessProcess) => void;
  navigate: (path: string) => void;
  expandedNodes: Set<number>;
  selectedNode: number | null;
  focusedNodeId: number | null;
  getStatusBadge: (status: string) => JSX.Element;
  getLevelColor: (level: string) => string;
  renderTreeNode: (node: TreeNode, depth: number, parentSequence: string) => JSX.Element;
  copiedProcess: BusinessProcess | null;
  onCopy: (process: BusinessProcess) => void;
  onPaste: (targetProcess: BusinessProcess) => void;
  onFocus: (processId: number) => void;
  onMoveProcess: (processId: number, newParentId: number | null, position?: number) => Promise<void>;
  allNodes: TreeNode[];
  findParentNode: (nodes: TreeNode[], childId: number) => TreeNode | null;
  findNodeById: (nodes: TreeNode[], id: number) => TreeNode | null;
  getSiblings: (nodeId: number) => TreeNode[];
}

function SortableTreeNode({
  node,
  depth,
  parentSequence,
  isExpanded,
  isSelected,
  isFocused,
  onToggleExpanded,
  onSelectNode,
  onEdit,
  onView,
  onDelete,
  onDuplicate,
  onCreateChild,
  navigate,
  expandedNodes,
  selectedNode,
  focusedNodeId,
  getStatusBadge,
  getLevelColor,
  renderTreeNode,
  copiedProcess,
  onCopy,
  onPaste,
  onFocus,
  onMoveProcess,
  allNodes,
  findParentNode,
  findNodeById,
  getSiblings,
}: SortableTreeNodeProps) {
  const { process, children, sequenceNumber } = node;
  const hasChildren = children.length > 0;
  const currentSequence = parentSequence 
    ? `${parentSequence}.${sequenceNumber || 1}` 
    : `${sequenceNumber || 1}.0`;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
    active,
  } = useSortable({ 
    id: process.id,
    data: {
      type: 'process',
      process,
      depth,
      hasChildren,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Determine if this is a valid drop target
  const canDrop = useMemo(() => {
    if (!active || active.id === process.id) return false;
    
    const activeData = active.data.current;
    if (!activeData) return false;
    
    // Can't drop on Level C processes (they can't have children)
    if (process.level === 'C') return false;
    
    // Can't drop a process on its own descendant
    // This check would need to be more sophisticated in production
    return true;
  }, [active, process]);

  return (
    <div ref={setNodeRef} style={style} className="w-full">
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            className={cn(
              "flex items-center justify-between p-3 rounded-lg border-l-4 transition-all cursor-pointer",
              getLevelColor(process.level),
              isSelected ? 'bg-gray-700' : 'bg-gray-800 hover:bg-gray-700',
              isOver && canDrop && 'ring-2 ring-blue-500 ring-offset-2 ring-offset-gray-900',
              isFocused && 'ring-2 ring-purple-500 ring-offset-2 ring-offset-gray-900',
              "mb-1"
            )}
            style={{ marginLeft: `${depth * 24}px` }}
            onClick={() => {
              onSelectNode(process.id);
              onFocus(process.id);
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              onView(process);
            }}
            tabIndex={isFocused ? 0 : -1}
            onFocus={() => onFocus(process.id)}
            role="treeitem"
            aria-expanded={hasChildren ? isExpanded : undefined}
            aria-selected={isSelected}
            aria-label={`${process.businessProcess}, Level ${process.level}, ${process.status}`}
            data-node-id={process.id}
            title="Double-click to view details or right-click for menu. Use arrow keys to navigate."
          >
        <div className="flex items-center flex-1 min-w-0">
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            className="mr-2 cursor-grab active:cursor-grabbing text-gray-400 hover:text-white"
          >
            <GripVertical size={16} />
          </div>

          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpanded(process.id);
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

          {/* Quick Navigation Buttons */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <TooltipProvider>
              {/* Move to parent level button */}
              {process.level !== 'A' && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-gray-400 hover:text-white"
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          const parent = findParentNode(allNodes, process.id);
                          if (parent) {
                            const grandParent = findParentNode(allNodes, parent.process.id);
                            const grandParentId = grandParent?.process.id || null;
                            await onMoveProcess(process.id, grandParentId);
                            onSelectNode(process.id);
                          }
                        } catch (error) {
                          console.error('Failed to move process to parent level:', error);
                        }
                      }}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="bg-gray-700 text-white border-gray-600">
                    <p>Move to parent level</p>
                  </TooltipContent>
                </Tooltip>
              )}

              {/* Move up in siblings button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-gray-400 hover:text-white disabled:opacity-50"
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        const parent = findParentNode(allNodes, process.id);
                        const parentId = parent?.process.id || null;
                        const siblings = getSiblings(process.id);
                        const currentIndex = siblings.findIndex(s => s.process.id === process.id);
                        
                        if (currentIndex > 0) {
                          // Position is 0-based in the API, so currentIndex - 1 moves it up
                          await onMoveProcess(process.id, parentId, currentIndex - 1);
                          onSelectNode(process.id);
                        }
                      } catch (error) {
                        console.error('Failed to move process up:', error);
                      }
                    }}
                    disabled={!sequenceNumber || sequenceNumber === 1}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-gray-700 text-white border-gray-600">
                  <p>Move up</p>
                </TooltipContent>
              </Tooltip>

              {/* Move down in siblings button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-gray-400 hover:text-white disabled:opacity-50"
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        const parent = findParentNode(allNodes, process.id);
                        const parentId = parent?.process.id || null;
                        const siblings = getSiblings(process.id);
                        const currentIndex = siblings.findIndex(s => s.process.id === process.id);
                        
                        if (currentIndex < siblings.length - 1) {
                          // Position is 0-based in the API, so currentIndex + 2 moves it down
                          // (we need +2 because we're moving it after the next sibling)
                          await onMoveProcess(process.id, parentId, currentIndex + 2);
                          onSelectNode(process.id);
                        }
                      } catch (error) {
                        console.error('Failed to move process down:', error);
                      }
                    }}
                    disabled={(() => {
                      const siblings = getSiblings(process.id);
                      const currentIndex = siblings.findIndex(s => s.process.id === process.id);
                      return currentIndex === siblings.length - 1;
                    })()}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-gray-700 text-white border-gray-600">
                  <p>Move down</p>
                </TooltipContent>
              </Tooltip>

              {/* Move into previous sibling button */}
              {process.level !== 'C' && sequenceNumber && sequenceNumber > 1 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-gray-400 hover:text-white"
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          const siblings = getSiblings(process.id);
                          const currentIndex = siblings.findIndex(s => s.process.id === process.id);
                          
                          if (currentIndex > 0) {
                            const previousSibling = siblings[currentIndex - 1];
                            // Move this process to be a child of the previous sibling
                            await onMoveProcess(process.id, previousSibling.process.id);
                            onSelectNode(process.id);
                          }
                        } catch (error) {
                          console.error('Failed to move process into previous sibling:', error);
                        }
                      }}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="bg-gray-700 text-white border-gray-600">
                    <p>Move into previous sibling</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </TooltipProvider>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4 text-gray-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(process);
                }}
                className="text-gray-300 hover:text-white hover:bg-gray-700"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onView(process);
                }}
                className="text-gray-300 hover:text-white hover:bg-gray-700"
              >
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/business-processes/${process.id}/diagram`);
                }}
                className="text-gray-300 hover:text-white hover:bg-gray-700"
              >
                <Network className="mr-2 h-4 w-4" />
                View IML Diagram
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onCopy(process);
                }}
                className="text-gray-300 hover:text-white hover:bg-gray-700"
              >
                <Clipboard className="mr-2 h-4 w-4" />
                Copy {hasChildren ? '(with children)' : ''}
              </DropdownMenuItem>
              {copiedProcess && process.level !== 'C' && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onPaste(process);
                  }}
                  className="text-gray-300 hover:text-white hover:bg-gray-700"
                >
                  <ClipboardPaste className="mr-2 h-4 w-4" />
                  Paste as child
                </DropdownMenuItem>
              )}
              {process.level !== 'C' && (
                <>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onCreateChild(process);
                    }}
                    className="text-green-400 hover:text-green-300 hover:bg-gray-700"
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Level {process.level === 'A' ? 'B' : 'C'} Process
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate(process);
                }}
                className="text-gray-300 hover:text-white hover:bg-gray-700"
              >
                <Copy className="mr-2 h-4 w-4" />
                Duplicate and Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(process);
                }}
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
        <ContextMenuContent className="bg-gray-800 border-gray-700 w-56">
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
          <ContextMenuItem
            onClick={() => onCopy(process)}
            className="text-gray-300 hover:text-white hover:bg-gray-700"
          >
            <Clipboard className="mr-2 h-4 w-4" />
            Copy {hasChildren ? '(with children)' : ''}
          </ContextMenuItem>
          {copiedProcess && process.level !== 'C' && (
            <ContextMenuItem
              onClick={() => onPaste(process)}
              className="text-gray-300 hover:text-white hover:bg-gray-700"
            >
              <ClipboardPaste className="mr-2 h-4 w-4" />
              Paste as child
            </ContextMenuItem>
          )}
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
          <SortableContext
            items={children.map(child => child.process.id)}
            strategy={verticalListSortingStrategy}
          >
            {children.map(child => renderTreeNode(child, depth + 1, currentSequence))}
          </SortableContext>
        </div>
      )}
    </div>
  );
}

export default function BusinessProcessTreeViewDnd({
  processes,
  relationships,
  searchTerm,
  onEdit,
  onView,
  onDelete,
  onDuplicate,
  onCreateChild,
  onMoveProcess,
  onCopyPaste,
}: BusinessProcessTreeViewProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());
  const [selectedNode, setSelectedNode] = useState<number | null>(null);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [copiedProcess, setCopiedProcess] = useState<BusinessProcess | null>(null);
  const [focusedNodeId, setFocusedNodeId] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  const handleCopy = (process: BusinessProcess) => {
    setCopiedProcess(process);
    toast({
      title: "Process copied",
      description: `"${process.businessProcess}" ${
        findNodeById(filteredTree, process.id)?.children.length ? 'and its children have' : 'has'
      } been copied to clipboard`,
    });
  };

  const handlePaste = async (targetProcess: BusinessProcess) => {
    if (!copiedProcess || !onCopyPaste) return;

    if (targetProcess.level === 'C') {
      toast({
        title: "Cannot paste here",
        description: "Level C processes cannot have children",
        variant: "destructive",
      });
      return;
    }

    // Check if pasting would create correct hierarchy
    const copiedLevel = copiedProcess.level;
    const targetLevel = targetProcess.level;
    
    if (targetLevel === 'A' && copiedLevel !== 'B') {
      toast({
        title: "Invalid paste",
        description: "Only Level B processes can be children of Level A",
        variant: "destructive",
      });
      return;
    }
    
    if (targetLevel === 'B' && copiedLevel !== 'C') {
      toast({
        title: "Invalid paste",
        description: "Only Level C processes can be children of Level B",
        variant: "destructive",
      });
      return;
    }

    try {
      await onCopyPaste(copiedProcess.id, targetProcess.id);
      toast({
        title: "Process pasted",
        description: `"${copiedProcess.businessProcess}" has been pasted as a child of "${targetProcess.businessProcess}"`,
      });
      // Expand the target node to show the pasted process
      setExpandedNodes(prev => new Set(Array.from(prev).concat(targetProcess.id)));
    } catch (error) {
      toast({
        title: "Paste failed",
        description: "Failed to paste the process",
        variant: "destructive",
      });
    }
  };

  // Scroll focused node into view
  useEffect(() => {
    if (focusedNodeId) {
      // Use a timeout to ensure DOM is updated
      setTimeout(() => {
        const element = document.querySelector(`[data-node-id="${focusedNodeId}"]`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          // Also focus the element for keyboard navigation
          (element as HTMLElement).focus();
        }
      }, 100);
    }
  }, [focusedNodeId]);

  // Initialize focus on first node
  useEffect(() => {
    if (!focusedNodeId && filteredTree.length > 0) {
      setFocusedNodeId(filteredTree[0].process.id);
    }
  }, [filteredTree, focusedNodeId]);

  // Keyboard navigation and shortcuts
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      // Only handle shortcuts when tree view is visible
      const currentFocusedId = focusedNodeId || selectedNode;
      if (!currentFocusedId) return;

      const currentNode = findNodeById(filteredTree, currentFocusedId);
      if (!currentNode) return;

      // Navigation keys
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          if (e.shiftKey) {
            // Move node down within siblings
            const siblings = getSiblings(currentFocusedId);
            const currentIndex = getNodeIndex(currentFocusedId, siblings);
            if (currentIndex < siblings.length - 1) {
              const parent = findParentNode(filteredTree, currentFocusedId);
              const parentId = parent?.process.id || null;
              try {
                await onMoveProcess(currentFocusedId, parentId, currentIndex + 2);
                toast({
                  title: "Node moved",
                  description: "Process moved down successfully",
                });
              } catch (error) {
                toast({
                  title: "Move failed",
                  description: "Failed to move the process",
                  variant: "destructive",
                });
              }
            }
          } else {
            // Navigate to next visible node
            const nextNode = getNextVisibleNode(currentFocusedId);
            if (nextNode) {
              setFocusedNodeId(nextNode.process.id);
              setSelectedNode(nextNode.process.id);
            }
          }
          break;

        case 'ArrowUp':
          e.preventDefault();
          if (e.shiftKey) {
            // Move node up within siblings
            const siblings = getSiblings(currentFocusedId);
            const currentIndex = getNodeIndex(currentFocusedId, siblings);
            if (currentIndex > 0) {
              const parent = findParentNode(filteredTree, currentFocusedId);
              const parentId = parent?.process.id || null;
              try {
                await onMoveProcess(currentFocusedId, parentId, currentIndex - 1);
                toast({
                  title: "Node moved",
                  description: "Process moved up successfully",
                });
              } catch (error) {
                toast({
                  title: "Move failed",
                  description: "Failed to move the process",
                  variant: "destructive",
                });
              }
            }
          } else {
            // Navigate to previous visible node
            const prevNode = getPreviousVisibleNode(currentFocusedId);
            if (prevNode) {
              setFocusedNodeId(prevNode.process.id);
              setSelectedNode(prevNode.process.id);
            }
          }
          break;

        case 'ArrowRight':
          e.preventDefault();
          if (currentNode.children.length > 0) {
            if (!expandedNodes.has(currentFocusedId)) {
              // Expand node
              toggleExpanded(currentFocusedId);
            } else {
              // Move to first child
              setFocusedNodeId(currentNode.children[0].process.id);
              setSelectedNode(currentNode.children[0].process.id);
            }
          }
          break;

        case 'ArrowLeft':
          e.preventDefault();
          if (expandedNodes.has(currentFocusedId) && currentNode.children.length > 0) {
            // Collapse node
            toggleExpanded(currentFocusedId);
          } else {
            // Move to parent
            const parent = findParentNode(filteredTree, currentFocusedId);
            if (parent) {
              setFocusedNodeId(parent.process.id);
              setSelectedNode(parent.process.id);
            }
          }
          break;

        case 'Enter':
          e.preventDefault();
          // Open edit dialog
          onEdit(currentNode.process);
          break;

        case ' ':
          e.preventDefault();
          // Toggle expansion
          if (currentNode.children.length > 0) {
            toggleExpanded(currentFocusedId);
          }
          break;

        case 'Home':
          e.preventDefault();
          if (e.ctrlKey) {
            // Jump to first node in tree
            const visibleNodes = getVisibleNodes();
            if (visibleNodes.length > 0) {
              setFocusedNodeId(visibleNodes[0].process.id);
              setSelectedNode(visibleNodes[0].process.id);
            }
          } else {
            // Jump to first sibling
            const siblings = getSiblings(currentFocusedId);
            if (siblings.length > 0) {
              setFocusedNodeId(siblings[0].process.id);
              setSelectedNode(siblings[0].process.id);
            }
          }
          break;

        case 'End':
          e.preventDefault();
          if (e.ctrlKey) {
            // Jump to last node in tree
            const visibleNodes = getVisibleNodes();
            if (visibleNodes.length > 0) {
              setFocusedNodeId(visibleNodes[visibleNodes.length - 1].process.id);
              setSelectedNode(visibleNodes[visibleNodes.length - 1].process.id);
            }
          } else {
            // Jump to last sibling
            const siblings = getSiblings(currentFocusedId);
            if (siblings.length > 0) {
              setFocusedNodeId(siblings[siblings.length - 1].process.id);
              setSelectedNode(siblings[siblings.length - 1].process.id);
            }
          }
          break;

        case 'Delete':
          e.preventDefault();
          // Delete node
          onDelete(currentNode.process);
          break;
      }

      // Ctrl+C or Cmd+C for copy
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault();
        const selectedProcess = processes.find(p => p.id === currentFocusedId);
        if (selectedProcess) {
          handleCopy(selectedProcess);
        }
      }

      // Ctrl+V or Cmd+V for paste
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault();
        if (copiedProcess) {
          const selectedProcess = processes.find(p => p.id === currentFocusedId);
          if (selectedProcess && selectedProcess.level !== 'C') {
            handlePaste(selectedProcess);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedNodeId, selectedNode, copiedProcess, processes, filteredTree, expandedNodes]);

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

  const findNodeById = (nodes: TreeNode[], id: number): TreeNode | null => {
    for (const node of nodes) {
      if (node.process.id === id) return node;
      const found = findNodeById(node.children, id);
      if (found) return found;
    }
    return null;
  };

  const findParentNode = (nodes: TreeNode[], childId: number): TreeNode | null => {
    for (const node of nodes) {
      if (node.children.some(child => child.process.id === childId)) {
        return node;
      }
      const found = findParentNode(node.children, childId);
      if (found) return found;
    }
    return null;
  };

  // Helper functions for keyboard navigation
  const getAllNodesFlat = (nodes: TreeNode[]): TreeNode[] => {
    const result: TreeNode[] = [];
    const traverse = (nodeList: TreeNode[]) => {
      for (const node of nodeList) {
        result.push(node);
        if (expandedNodes.has(node.process.id) && node.children.length > 0) {
          traverse(node.children);
        }
      }
    };
    traverse(nodes);
    return result;
  };

  const getVisibleNodes = (): TreeNode[] => {
    return getAllNodesFlat(filteredTree);
  };

  const getNextVisibleNode = (currentId: number): TreeNode | null => {
    const visibleNodes = getVisibleNodes();
    const currentIndex = visibleNodes.findIndex(node => node.process.id === currentId);
    if (currentIndex === -1 || currentIndex === visibleNodes.length - 1) return null;
    return visibleNodes[currentIndex + 1];
  };

  const getPreviousVisibleNode = (currentId: number): TreeNode | null => {
    const visibleNodes = getVisibleNodes();
    const currentIndex = visibleNodes.findIndex(node => node.process.id === currentId);
    if (currentIndex <= 0) return null;
    return visibleNodes[currentIndex - 1];
  };

  const getSiblings = (nodeId: number): TreeNode[] => {
    const node = findNodeById(filteredTree, nodeId);
    if (!node) return [];
    
    const parent = findParentNode(filteredTree, nodeId);
    if (!parent) {
      // Root level nodes
      return filteredTree;
    }
    return parent.children;
  };

  const getNodeIndex = (nodeId: number, siblings: TreeNode[]): number => {
    return siblings.findIndex(node => node.process.id === nodeId);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    const activeId = active.id as number;
    const overId = over.id as number;

    const activeNode = findNodeById(filteredTree, activeId);
    const overNode = findNodeById(filteredTree, overId);

    if (!activeNode || !overNode) return;

    // Check if we're dropping on a valid parent
    if (overNode.process.level === 'C') {
      console.log("Cannot drop on Level C process");
      return;
    }

    try {
      await onMoveProcess(activeId, overId);
    } catch (error) {
      console.error("Failed to move process:", error);
    }
  };

  const renderTreeNode = (node: TreeNode, depth: number = 0, parentSequence: string = ''): JSX.Element => {
    const { process, children, sequenceNumber } = node;
    const hasChildren = children.length > 0;
    const isExpanded = expandedNodes.has(process.id);
    const isSelected = selectedNode === process.id;
    const isFocused = focusedNodeId === process.id;

    return (
      <SortableTreeNode
        key={process.id}
        node={node}
        depth={depth}
        parentSequence={parentSequence}
        isExpanded={isExpanded}
        isSelected={isSelected}
        isFocused={isFocused}
        onToggleExpanded={toggleExpanded}
        onSelectNode={setSelectedNode}
        onEdit={onEdit}
        onView={onView}
        onDelete={onDelete}
        onDuplicate={onDuplicate}
        onCreateChild={onCreateChild}
        navigate={navigate}
        expandedNodes={expandedNodes}
        selectedNode={selectedNode}
        focusedNodeId={focusedNodeId}
        getStatusBadge={getStatusBadge}
        getLevelColor={getLevelColor}
        renderTreeNode={renderTreeNode}
        copiedProcess={copiedProcess}
        onCopy={handleCopy}
        onPaste={handlePaste}
        onFocus={setFocusedNodeId}
        onMoveProcess={onMoveProcess}
        allNodes={filteredTree}
        findParentNode={findParentNode}
        findNodeById={findNodeById}
        getSiblings={getSiblings}
      />
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

  const activeNode = activeId ? findNodeById(filteredTree, activeId) : null;

  return (
    <div className="relative">
      {/* Keyboard navigation instructions */}
      <div className="mb-4 p-3 bg-gray-800 rounded-lg border border-gray-700">
        <p className="text-sm text-gray-400">
          <span className="font-semibold text-gray-300">Keyboard Navigation:</span> Use arrow keys to navigate, 
          Space to expand/collapse, Enter to edit, Shift+↑↓ to reorder, Delete to remove
        </p>
      </div>
      
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={filteredTree.map(node => node.process.id)}
          strategy={verticalListSortingStrategy}
        >
          <div 
            className="space-y-1"
            role="tree"
            aria-label="Business Process Tree"
          >
            {filteredTree.map(node => renderTreeNode(node))}
          </div>
        </SortableContext>
        
        <DragOverlay>
          {activeNode && (
            <div className={cn(
              "flex items-center p-3 rounded-lg border-l-4 bg-gray-800 shadow-lg",
              getLevelColor(activeNode.process.level)
            )}>
              <span className="font-medium text-white">{activeNode.process.businessProcess}</span>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}