import HierarchyHtmlEditor from "./hierarchy-html-editor";
import HierarchyTreeView from "./hierarchy-tree-view";

interface HierarchyDualViewProps {
  hierarchy: any[];
  title: string;
}

export default function HierarchyDualView({ hierarchy, title }: HierarchyDualViewProps) {
  return (
    <div className="flex gap-4 h-full">
      {/* Left side - Detailed view */}
      <div className="flex-1 h-full">
        <HierarchyHtmlEditor
          initialHierarchy={hierarchy}
          readOnly={true}
        />
      </div>
      
      {/* Right side - Tree view */}
      <div className="flex-1 h-full">
        <HierarchyTreeView
          hierarchy={hierarchy}
          title={`${title} - Tree View`}
        />
      </div>
    </div>
  );
}