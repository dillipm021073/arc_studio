import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Search, 
  MoreVertical, 
  Eye, 
  Edit, 
  Copy, 
  Trash2, 
  Download,
  FileJson,
  Calendar,
  Tag,
  User,
  Edit2,
  Info,
  Layers
} from "lucide-react";
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

interface HierarchyDesignsListProps {
  onSelectDesign?: (design: HierarchyDesign) => void;
}

export default function HierarchyDesignsList({ onSelectDesign }: HierarchyDesignsListProps) {
  const [search, setSearch] = useState("");
  const [viewingDesign, setViewingDesign] = useState<HierarchyDesign | null>(null);
  const [editingDesign, setEditingDesign] = useState<HierarchyDesign | null>(null);
  const [generatingDesign, setGeneratingDesign] = useState<HierarchyDesign | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Add styles for webkit browsers
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .hierarchy-designs-scroll::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }
      .hierarchy-designs-scroll::-webkit-scrollbar-track {
        background: #1f2937;
        border-radius: 4px;
      }
      .hierarchy-designs-scroll::-webkit-scrollbar-thumb {
        background: #4b5563;
        border-radius: 4px;
      }
      .hierarchy-designs-scroll::-webkit-scrollbar-thumb:hover {
        background: #6b7280;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Fetch hierarchy designs
  const { data: designs = [], isLoading } = useQuery({
    queryKey: ["/api/hierarchy-designs", { search }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      
      const response = await fetch(`/api/hierarchy-designs?${params}`, {
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
        body: JSON.stringify({ name, createdBy: "current-user" }),
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

  const filteredDesigns = designs.filter((design: HierarchyDesign) =>
    design.name.toLowerCase().includes(search.toLowerCase()) ||
    design.description?.toLowerCase().includes(search.toLowerCase()) ||
    design.tags?.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const parseTags = (tags: string) => {
    return tags?.split(', ').filter(Boolean) || [];
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Saved Hierarchy Designs</span>
            <Badge variant="outline">
              {filteredDesigns.length} design{filteredDesigns.length !== 1 ? 's' : ''}
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search designs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredDesigns.length > 3 && (
            <div className="text-sm text-gray-400 mb-2 flex items-center gap-2">
              <Info className="h-4 w-4" />
              Scroll to view all {filteredDesigns.length} designs
            </div>
          )}
          {isLoading ? (
            <div className="text-center py-8 text-gray-400">Loading designs...</div>
          ) : filteredDesigns.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              {search ? "No designs found matching your search." : "No hierarchy designs saved yet."}
            </div>
          ) : (
            <div className="border border-gray-700 rounded-lg overflow-hidden">
              <Table>
                <TableHeader className="sticky top-0 bg-gray-900 z-10">
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
              </Table>
              <div 
                className="hierarchy-designs-scroll max-h-[300px] overflow-y-scroll overflow-x-hidden"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#4b5563 #1f2937'
                }}
              >
                <Table>
                  <TableBody>
                {filteredDesigns.map((design: HierarchyDesign) => (
                  <TableRow key={design.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileJson className="h-4 w-4 text-blue-400" />
                        <div>
                          <div className="font-medium">{design.name}</div>
                          <div className="text-sm text-gray-400">v{design.version}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate" title={design.description}>
                        {design.description || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {parseTags(design.tags).slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {parseTags(design.tags).length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{parseTags(design.tags).length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={design.status === 'published' ? 'default' : 'secondary'}
                        className="capitalize"
                      >
                        {design.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-gray-400">
                        <Calendar className="h-3 w-3" />
                        {formatDate(design.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-gray-400">
                        <Calendar className="h-3 w-3" />
                        {formatDate(design.updatedAt)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setViewingDesign(design)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleRename(design)}>
                            <Edit2 className="mr-2 h-4 w-4" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setEditingDesign(design)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(design)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleExport(design)}>
                            <Download className="mr-2 h-4 w-4" />
                            Export
                          </DropdownMenuItem>
                          {onSelectDesign && (
                            <DropdownMenuItem onClick={() => onSelectDesign(design)}>
                              <FileJson className="mr-2 h-4 w-4" />
                              Load into Editor
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => setGeneratingDesign(design)}>
                            <Layers className="mr-2 h-4 w-4" />
                            Generate Business Processes
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => deleteMutation.mutate(design.id)}
                            className="text-red-600"
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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
                  
                  // Add timestamp and username to the name for updates
                  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
                  const baseName = metadata.name.replace(/_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}_.*$/, ''); // Remove old timestamp if exists
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