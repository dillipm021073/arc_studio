import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { TreePine, GitBranch, Sparkles } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type HierarchyViewMode = "tree" | "orgchart" | "mindmap";

interface HierarchyViewToggleProps {
  value: HierarchyViewMode;
  onValueChange: (value: HierarchyViewMode) => void;
}

export default function HierarchyViewToggle({
  value,
  onValueChange,
}: HierarchyViewToggleProps) {
  return (
    <TooltipProvider>
      <ToggleGroup
        type="single"
        value={value}
        onValueChange={(v) => v && onValueChange(v as HierarchyViewMode)}
        className="justify-start"
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <ToggleGroupItem
              value="tree"
              aria-label="Tree view"
              className="data-[state=on]:bg-gray-700"
            >
              <TreePine className="h-4 w-4" />
            </ToggleGroupItem>
          </TooltipTrigger>
          <TooltipContent>
            <p>Tree View</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <ToggleGroupItem
              value="orgchart"
              aria-label="Organization chart view"
              className="data-[state=on]:bg-gray-700"
            >
              <GitBranch className="h-4 w-4" />
            </ToggleGroupItem>
          </TooltipTrigger>
          <TooltipContent>
            <p>Organization Chart</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <ToggleGroupItem
              value="mindmap"
              aria-label="Mind map view"
              className="data-[state=on]:bg-gray-700"
            >
              <Sparkles className="h-4 w-4" />
            </ToggleGroupItem>
          </TooltipTrigger>
          <TooltipContent>
            <p>Mind Map</p>
          </TooltipContent>
        </Tooltip>
      </ToggleGroup>
    </TooltipProvider>
  );
}