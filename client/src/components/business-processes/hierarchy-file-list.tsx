import { FileJson, MoreVertical, Eye, Edit, Copy, Trash2, Download, Layers, Clock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface HierarchyDesign {
  id: number;
  name: string;
  description: string;
  hierarchyData: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  tags: string;
  isTemplate: boolean;
  templateCategory: string;
  version: string;
  status: string;
}

interface HierarchyFileListProps {
  designs: HierarchyDesign[];
  viewMode: "grid" | "list";
  isLoading: boolean;
  currentUsername: string;
  onView: (design: HierarchyDesign) => void;
  onEdit: (design: HierarchyDesign) => void;
  onRename: (design: HierarchyDesign) => void;
  onDuplicate: (design: HierarchyDesign) => void;
  onDelete: (design: HierarchyDesign) => void;
  onExport: (design: HierarchyDesign) => void;
  onGenerateProcesses: (design: HierarchyDesign) => void;
  onSelectDesign?: (design: HierarchyDesign) => void;
}

export default function HierarchyFileList({
  designs,
  viewMode,
  isLoading,
  currentUsername,
  onView,
  onEdit,
  onRename,
  onDuplicate,
  onDelete,
  onExport,
  onGenerateProcesses,
  onSelectDesign,
}: HierarchyFileListProps) {
  const canEdit = (design: HierarchyDesign) => {
    return design.createdBy === currentUsername && !design.isTemplate;
  };

  const formatFileName = (name: string) => {
    // Remove timestamp and username suffixes if present
    return name.replace(/_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}_.*$/, '');
  };

  const DesignContextMenu = ({ design, children }: { design: HierarchyDesign; children: React.ReactNode }) => (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        <ContextMenuItem onClick={() => onView(design)}>
          <Eye className="mr-2 h-4 w-4" />
          View
        </ContextMenuItem>
        {canEdit(design) && (
          <>
            <ContextMenuItem onClick={() => onEdit(design)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </ContextMenuItem>
            <ContextMenuItem onClick={() => onRename(design)}>
              <Edit className="mr-2 h-4 w-4" />
              Rename
            </ContextMenuItem>
          </>
        )}
        <ContextMenuItem onClick={() => onDuplicate(design)}>
          <Copy className="mr-2 h-4 w-4" />
          Duplicate
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onExport(design)}>
          <Download className="mr-2 h-4 w-4" />
          Export
        </ContextMenuItem>
        {onSelectDesign && (
          <ContextMenuItem onClick={() => onSelectDesign(design)}>
            <FileJson className="mr-2 h-4 w-4" />
            Load into Editor
          </ContextMenuItem>
        )}
        <ContextMenuItem onClick={() => onGenerateProcesses(design)}>
          <Layers className="mr-2 h-4 w-4" />
          Generate Business Processes
        </ContextMenuItem>
        {canEdit(design) && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem 
              onClick={() => onDelete(design)}
              className="text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400">Loading designs...</div>
      </div>
    );
  }

  if (designs.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400">No designs found</div>
      </div>
    );
  }

  if (viewMode === "grid") {
    return (
      <ScrollArea className="h-full">
        <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {designs.map((design) => (
            <DesignContextMenu key={design.id} design={design}>
              <div
                className="group relative bg-gray-800 rounded-lg p-4 hover:bg-gray-700 cursor-pointer transition-colors"
                onDoubleClick={() => onView(design)}
              >
                <div className="flex flex-col items-center text-center space-y-2">
                  <FileJson className="h-12 w-12 text-blue-400" />
                  <div className="w-full">
                    <div className="font-medium text-sm truncate" title={formatFileName(design.name)}>
                      {formatFileName(design.name)}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {formatDistanceToNow(new Date(design.updatedAt), { addSuffix: true })}
                    </div>
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onView(design)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </DropdownMenuItem>
                    {canEdit(design) && (
                      <>
                        <DropdownMenuItem onClick={() => onEdit(design)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onRename(design)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Rename
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuItem onClick={() => onDuplicate(design)}>
                      <Copy className="mr-2 h-4 w-4" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onExport(design)}>
                      <Download className="mr-2 h-4 w-4" />
                      Export
                    </DropdownMenuItem>
                    {onSelectDesign && (
                      <DropdownMenuItem onClick={() => onSelectDesign(design)}>
                        <FileJson className="mr-2 h-4 w-4" />
                        Load into Editor
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => onGenerateProcesses(design)}>
                      <Layers className="mr-2 h-4 w-4" />
                      Generate Business Processes
                    </DropdownMenuItem>
                    {canEdit(design) && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => onDelete(design)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </DesignContextMenu>
          ))}
        </div>
      </ScrollArea>
    );
  }

  // List view
  return (
    <ScrollArea className="h-full">
      <div className="p-4">
        <div className="space-y-1">
          {designs.map((design) => (
            <DesignContextMenu key={design.id} design={design}>
              <div
                className={cn(
                  "flex items-center gap-3 p-3 rounded hover:bg-gray-700 cursor-pointer group",
                  "transition-colors"
                )}
                onDoubleClick={() => onView(design)}
              >
                <FileJson className="h-5 w-5 text-blue-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate" title={formatFileName(design.name)}>
                    {formatFileName(design.name)}
                  </div>
                  {design.description && (
                    <div className="text-sm text-gray-400 truncate" title={design.description}>
                      {design.description}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {design.createdBy}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(design.updatedAt), { addSuffix: true })}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onView(design)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </DropdownMenuItem>
                    {canEdit(design) && (
                      <>
                        <DropdownMenuItem onClick={() => onEdit(design)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onRename(design)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Rename
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuItem onClick={() => onDuplicate(design)}>
                      <Copy className="mr-2 h-4 w-4" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onExport(design)}>
                      <Download className="mr-2 h-4 w-4" />
                      Export
                    </DropdownMenuItem>
                    {onSelectDesign && (
                      <DropdownMenuItem onClick={() => onSelectDesign(design)}>
                        <FileJson className="mr-2 h-4 w-4" />
                        Load into Editor
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => onGenerateProcesses(design)}>
                      <Layers className="mr-2 h-4 w-4" />
                      Generate Business Processes
                    </DropdownMenuItem>
                    {canEdit(design) && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => onDelete(design)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </DesignContextMenu>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}