import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import HierarchyHtmlEditor from "./hierarchy-html-editor";
import HierarchyTreeView from "./hierarchy-tree-view";
import HierarchyOrgChartView from "./hierarchy-org-chart-view-simple";
import HierarchyMindMapView from "./hierarchy-mindmap-view";
import HierarchyViewToggle, { HierarchyViewMode } from "./hierarchy-view-toggle";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface HierarchyDualViewProps {
  hierarchy: any[];
  title: string;
  selectedDesignId?: number;
  onSave?: (hierarchy: any[], metadata: any) => void;
}

export default function HierarchyDualView({ hierarchy, title, selectedDesignId, onSave }: HierarchyDualViewProps) {
  const [viewMode, setViewMode] = useState<HierarchyViewMode>("tree");
  const [collapsedPanel, setCollapsedPanel] = useState<"left" | "right" | null>(null);
  const params = useParams();
  const { toast } = useToast();
  const businessProcessId = params.id ? parseInt(params.id as string) : undefined;

  const saveDiagramMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post("/api/hierarchy-diagrams", {
        name: `${title} - ${data.type.toUpperCase()}`,
        businessProcessId,
        viewType: data.type,
        diagramData: data,
        description: `Saved ${data.type} visualization for ${title}`
      });
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Diagram saved successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save diagram",
        variant: "destructive",
      });
    },
  });

  const handleSaveDiagram = (data: any) => {
    saveDiagramMutation.mutate(data);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + [ to focus left panel
      if ((e.ctrlKey || e.metaKey) && e.key === '[') {
        e.preventDefault();
        setCollapsedPanel(collapsedPanel === "right" ? null : "right");
      }
      // Ctrl/Cmd + ] to focus right panel
      else if ((e.ctrlKey || e.metaKey) && e.key === ']') {
        e.preventDefault();
        setCollapsedPanel(collapsedPanel === "left" ? null : "left");
      }
      // Ctrl/Cmd + \ to reset panels
      else if ((e.ctrlKey || e.metaKey) && e.key === '\\') {
        e.preventDefault();
        setCollapsedPanel(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [collapsedPanel]);

  const renderVisualization = () => {
    switch (viewMode) {
      case "orgchart":
        return (
          <HierarchyOrgChartView
            hierarchy={hierarchy}
            title={`${title} - Organization Chart`}
            onSave={handleSaveDiagram}
          />
        );
      case "mindmap":
        return (
          <HierarchyMindMapView
            hierarchy={hierarchy}
            title={`${title} - Mind Map`}
            onSave={handleSaveDiagram}
          />
        );
      case "tree":
      default:
        return (
          <HierarchyTreeView
            hierarchy={hierarchy}
            title={`${title} - Tree View`}
          />
        );
    }
  };

  return (
    <div className="h-full relative">
      <PanelGroup direction="horizontal" className="h-full">
        {/* Left Panel - Editor */}
        <Panel 
          defaultSize={50} 
          minSize={20}
          collapsible={true}
          collapsedSize={0}
          onCollapse={() => setCollapsedPanel("left")}
          onExpand={() => setCollapsedPanel(null)}
        >
          <div className="h-full relative">
            <HierarchyHtmlEditor
              initialHierarchy={hierarchy}
              readOnly={!onSave} // Read-only if no onSave provided
              onSave={onSave}
              initialMetadata={selectedDesignId ? { name: title } : undefined}
            />
            {/* Expand button when collapsed */}
            {collapsedPanel === "left" && (
              <Button
                size="sm"
                variant="secondary"
                className="absolute top-1/2 -translate-y-1/2 -right-4 z-10"
                onClick={() => setCollapsedPanel(null)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </Panel>

        {/* Resize Handle */}
        <PanelResizeHandle className="w-2 bg-gray-700 hover:bg-gray-600 transition-colors relative group cursor-col-resize">
          <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-1 bg-gray-600 group-hover:bg-gray-500" />
          {/* Chevron buttons on the handle */}
          <TooltipProvider>
            <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 flex items-center gap-0 bg-gray-700 rounded-md border border-gray-600 shadow-md">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 hover:bg-gray-600 rounded-r-none"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCollapsedPanel(collapsedPanel === "right" ? null : "right");
                    }}
                  >
                    <ChevronLeft className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>{collapsedPanel === "right" ? "Show Both Panels" : "Focus on Visualization"}</p>
                  <p className="text-xs text-gray-400">Ctrl+[</p>
                </TooltipContent>
              </Tooltip>
              <div className="w-px h-4 bg-gray-600" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 hover:bg-gray-600 rounded-l-none"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCollapsedPanel(collapsedPanel === "left" ? null : "left");
                    }}
                  >
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>{collapsedPanel === "left" ? "Show Both Panels" : "Focus on Editor"}</p>
                  <p className="text-xs text-gray-400">Ctrl+]</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </PanelResizeHandle>

        {/* Right Panel - Visualization */}
        <Panel 
          defaultSize={50} 
          minSize={20}
          collapsible={true}
          collapsedSize={0}
          onCollapse={() => setCollapsedPanel("right")}
          onExpand={() => setCollapsedPanel(null)}
        >
          <div className="h-full flex flex-col gap-2 relative">
            <Card className="bg-gray-800 border-gray-700 p-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400 ml-2">View Mode:</span>
                <HierarchyViewToggle
                  value={viewMode}
                  onValueChange={setViewMode}
                />
              </div>
            </Card>
            <div className="flex-1">
              {renderVisualization()}
            </div>
            {/* Expand button when collapsed */}
            {collapsedPanel === "right" && (
              <Button
                size="sm"
                variant="secondary"
                className="absolute top-1/2 -translate-y-1/2 -left-4 z-10"
                onClick={() => setCollapsedPanel(null)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
          </div>
        </Panel>
      </PanelGroup>
    </div>
  );
}