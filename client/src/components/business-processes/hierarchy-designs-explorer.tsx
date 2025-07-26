import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Search, Grid3x3, List, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import HierarchyFolderTree from "./hierarchy-folder-tree";
import HierarchyFileList from "./hierarchy-file-list";
import { useAuth } from "@/contexts/auth-context";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import HierarchyHtmlEditor from "./hierarchy-html-editor";
import GenerateBusinessProcessesDialog from "./generate-business-processes-dialog";

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

interface HierarchyDesignsExplorerProps {
  onSelectDesign?: (design: HierarchyDesign) => void;
  showCreateButton?: boolean;
}

export default function HierarchyDesignsExplorer({ 
  onSelectDesign,
  showCreateButton = false 
}: HierarchyDesignsExplorerProps) {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedFolder, setSelectedFolder] = useState<string>("my-designs");
  const [viewingDesign, setViewingDesign] = useState<HierarchyDesign | null>(null);
  const [editingDesign, setEditingDesign] = useState<HierarchyDesign | null>(null);
  const [generatingDesign, setGeneratingDesign] = useState<HierarchyDesign | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch hierarchy designs
  const { data: designs = [], isLoading } = useQuery({
    queryKey: ["/api/hierarchy-designs"],
    queryFn: async () => {
      const response = await fetch(`/api/hierarchy-designs`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch hierarchy designs");
      return response.json();
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/hierarchy-designs/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to delete design");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hierarchy-designs"] });
      toast({
        title: "Success",
        description: "Hierarchy design deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Duplicate mutation
  const duplicateMutation = useMutation({
    mutationFn: async ({ id, name }: { id: number; name: string }) => {
      const response = await fetch(`/api/hierarchy-designs/${id}/duplicate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, createdBy: user?.username || "unknown" }),
      });
      if (!response.ok) throw new Error("Failed to duplicate design");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hierarchy-designs"] });
      toast({
        title: "Success",
        description: "Hierarchy design duplicated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Rename mutation
  const renameMutation = useMutation({
    mutationFn: async ({ id, name }: { id: number; name: string }) => {
      const response = await fetch(`/api/hierarchy-designs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name }),
      });
      if (!response.ok) throw new Error("Failed to rename design");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hierarchy-designs"] });
      toast({
        title: "Success",
        description: "Hierarchy design renamed successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Group designs by user and filter
  const { userFolders, filteredDesigns } = useMemo(() => {
    const folders = new Map<string, HierarchyDesign[]>();
    const currentUsername = user?.username || "unknown";
    
    // Initialize folders
    folders.set(currentUsername, []);
    folders.set("templates", []);
    
    // Group designs
    designs.forEach((design: HierarchyDesign) => {
      if (design.isTemplate) {
        const templates = folders.get("templates") || [];
        templates.push(design);
        folders.set("templates", templates);
      } else {
        const username = design.createdBy || "unknown";
        if (!folders.has(username)) {
          folders.set(username, []);
        }
        const userDesigns = folders.get(username) || [];
        userDesigns.push(design);
        folders.set(username, userDesigns);
      }
    });

    // Get designs for selected folder
    let folderDesigns: HierarchyDesign[] = [];
    if (selectedFolder === "my-designs") {
      folderDesigns = folders.get(currentUsername) || [];
    } else if (selectedFolder === "templates") {
      folderDesigns = folders.get("templates") || [];
    } else if (selectedFolder.startsWith("user-")) {
      const username = selectedFolder.replace("user-", "");
      folderDesigns = folders.get(username) || [];
    } else if (selectedFolder === "all") {
      folderDesigns = designs;
    }

    // Apply search filter
    const filtered = folderDesigns.filter((design: HierarchyDesign) =>
      !search || 
      design.name.toLowerCase().includes(search.toLowerCase()) ||
      design.description?.toLowerCase().includes(search.toLowerCase()) ||
      design.tags?.toLowerCase().includes(search.toLowerCase())
    );

    return { userFolders: folders, filteredDesigns: filtered };
  }, [designs, selectedFolder, search, user]);

  const handleExport = async (design: HierarchyDesign) => {
    try {
      const response = await fetch(`/api/hierarchy-designs/${design.id}/export`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to export design");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${design.name.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: "Design exported successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export design",
        variant: "destructive",
      });
    }
  };

  const handleDuplicate = (design: HierarchyDesign) => {
    const newName = prompt("Enter name for the duplicated design:", `${design.name} (Copy)`);
    if (newName) {
      duplicateMutation.mutate({ id: design.id, name: newName });
    }
  };

  const handleRename = (design: HierarchyDesign) => {
    const newName = prompt("Enter new name for the design:", design.name);
    if (newName && newName !== design.name) {
      renameMutation.mutate({ id: design.id, name: newName });
    }
  };

  const handleDelete = (design: HierarchyDesign) => {
    if (confirm(`Are you sure you want to delete "${design.name}"? This action cannot be undone.`)) {
      deleteMutation.mutate(design.id);
    }
  };

  const currentUsername = user?.username || "unknown";

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Hierarchy Designs</h2>
        {showCreateButton && (
          <Button onClick={() => onSelectDesign?.(null as any)}>
            <Plus className="mr-2 h-4 w-4" />
            New Design
          </Button>
        )}
      </div>

      {/* Search and View Controls */}
      <div className="flex items-center gap-4 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search designs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("grid")}
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Left Panel - Folder Tree */}
        <Card className="w-64 flex-shrink-0">
          <HierarchyFolderTree
            userFolders={userFolders}
            currentUsername={currentUsername}
            selectedFolder={selectedFolder}
            onSelectFolder={setSelectedFolder}
          />
        </Card>

        {/* Right Panel - File List */}
        <Card className="flex-1 overflow-hidden">
          <HierarchyFileList
            designs={filteredDesigns}
            viewMode={viewMode}
            isLoading={isLoading}
            currentUsername={currentUsername}
            onView={setViewingDesign}
            onEdit={setEditingDesign}
            onRename={handleRename}
            onDuplicate={handleDuplicate}
            onDelete={handleDelete}
            onExport={handleExport}
            onGenerateProcesses={setGeneratingDesign}
            onSelectDesign={onSelectDesign}
          />
        </Card>
      </div>

      {/* View Design Dialog */}
      <Dialog open={!!viewingDesign} onOpenChange={(open) => !open && setViewingDesign(null)}>
        <DialogContent className="max-w-[95vw] w-[95vw] max-h-[95vh] h-[95vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>{viewingDesign?.name}</DialogTitle>
            <DialogDescription>
              {viewingDesign?.description}
            </DialogDescription>
          </DialogHeader>
          {viewingDesign && (
            <div className="flex-1 overflow-auto min-h-0">
              <HierarchyHtmlEditor
                initialHierarchy={JSON.parse(viewingDesign.hierarchyData)}
                readOnly={true}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Design Dialog */}
      <Dialog open={!!editingDesign} onOpenChange={(open) => !open && setEditingDesign(null)}>
        <DialogContent className="max-w-[95vw] w-[95vw] max-h-[95vh] h-[95vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Edit {editingDesign?.name}</DialogTitle>
            <DialogDescription>
              Make changes to your hierarchy design
            </DialogDescription>
          </DialogHeader>
          {editingDesign && (
            <div className="flex-1 overflow-auto min-h-0">
              <HierarchyHtmlEditor
                initialHierarchy={JSON.parse(editingDesign.hierarchyData)}
                initialMetadata={{
                  name: editingDesign.name,
                  description: editingDesign.description || "",
                  tags: editingDesign.tags || ""
                }}
                readOnly={false}
                onSave={async (hierarchy, metadata) => {
                  // Get current user from localStorage or session
                  const currentUser = localStorage.getItem('username') || 'unknown';
                  
                  if (metadata.overwriteId) {
                    // Update existing design
                    const response = await fetch(`/api/hierarchy-designs/${metadata.overwriteId}`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      credentials: "include",
                      body: JSON.stringify({
                        name: metadata.name,
                        description: metadata.description,
                        hierarchyData: JSON.stringify(hierarchy),
                        tags: Array.isArray(metadata.tags) ? metadata.tags.join(', ') : metadata.tags,
                      }),
                    });
                    if (!response.ok) throw new Error("Failed to update design");
                  } else {
                    // Update the current design
                    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
                    const baseName = metadata.name.replace(/_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}_.*$/, '');
                    const enhancedName = `${baseName}_${timestamp}_${currentUser}`;
                    
                    const response = await fetch(`/api/hierarchy-designs/${editingDesign.id}`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      credentials: "include",
                      body: JSON.stringify({
                        name: enhancedName,
                        description: metadata.description,
                        hierarchyData: JSON.stringify(hierarchy),
                        tags: Array.isArray(metadata.tags) ? metadata.tags.join(', ') : metadata.tags,
                      }),
                    });
                    if (!response.ok) throw new Error("Failed to update design");
                  }
                  
                  queryClient.invalidateQueries({ queryKey: ["/api/hierarchy-designs"] });
                  setEditingDesign(null);
                }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Generate Business Processes Dialog */}
      <GenerateBusinessProcessesDialog
        design={generatingDesign}
        onClose={() => setGeneratingDesign(null)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["/api/business-processes"] });
        }}
      />
    </div>
  );
}