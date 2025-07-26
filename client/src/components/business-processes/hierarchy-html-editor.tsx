import { useRef, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

interface HierarchyHtmlEditorProps {
  initialHierarchy?: any[];
  initialMetadata?: {
    name?: string;
    description?: string;
    tags?: string;
  };
  onSave?: (hierarchy: any[], metadata: any) => void;
  readOnly?: boolean;
}

export default function HierarchyHtmlEditor({
  initialHierarchy = [],
  initialMetadata,
  onSave,
  readOnly = false
}: HierarchyHtmlEditorProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { toast } = useToast();

  const handleMessage = useCallback((event: MessageEvent) => {
    if (event.origin !== window.location.origin) return;
    
    if (event.data.type === 'SAVE_HIERARCHY_DESIGN') {
      const { data } = event.data;
      
      try {
        const hierarchy = JSON.parse(data.hierarchyData);
        const metadata = {
          name: data.name,
          description: data.description,
          tags: data.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean),
          nodeCount: data.hierarchyData.match(/"id":/g)?.length || 0,
          maxDepth: calculateMaxDepth(hierarchy),
          overwriteId: data.overwriteId // Pass the overwrite ID if present
        };

        onSave?.(hierarchy, metadata);
        
        toast({
          title: "Success",
          description: data.overwriteId ? "Hierarchy design updated successfully" : "Hierarchy design saved successfully",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to save hierarchy design",
          variant: "destructive",
        });
      }
    }
  }, [onSave, toast]);

  const calculateMaxDepth = (nodes: any[], depth = 0): number => {
    if (!nodes || nodes.length === 0) return depth;
    return Math.max(...nodes.map(node => 
      node.children?.length > 0 ? calculateMaxDepth(node.children, depth + 1) : depth + 1
    ));
  };

  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleMessage]);

  useEffect(() => {
    if (iframeRef.current?.contentWindow) {
      // Wait a bit for iframe to load
      setTimeout(() => {
        // Load hierarchy with readOnly flag if available
        if (initialHierarchy.length > 0) {
          iframeRef.current?.contentWindow?.postMessage({
            type: 'LOAD_HIERARCHY_DESIGN',
            hierarchyData: JSON.stringify(initialHierarchy),
            readOnly: readOnly  // Send readOnly with the load message
          }, '*');
        } else {
          // Just set read-only mode if no hierarchy
          iframeRef.current?.contentWindow?.postMessage({
            type: 'SET_READ_ONLY',
            readOnly: readOnly
          }, '*');
        }
      }, 500);
    }
  }, [initialHierarchy, readOnly]);

  useEffect(() => {
    if (initialMetadata && iframeRef.current?.contentWindow) {
      setTimeout(() => {
        const iframe = iframeRef.current;
        if (iframe?.contentDocument) {
          const nameInput = iframe.contentDocument.getElementById('design-name') as HTMLInputElement;
          const descInput = iframe.contentDocument.getElementById('design-description') as HTMLInputElement;
          const tagsInput = iframe.contentDocument.getElementById('design-tags') as HTMLInputElement;
          
          if (nameInput) nameInput.value = initialMetadata.name || '';
          if (descInput) descInput.value = initialMetadata.description || '';
          if (tagsInput) tagsInput.value = initialMetadata.tags || '';
        }
      }, 600);
    }
  }, [initialMetadata]);

  return (
    <div className="w-full h-full min-h-0">
      <iframe
        ref={iframeRef}
        src="/hierarchy-editor.html"
        className="w-full h-full border-0 rounded-lg"
        style={{ minHeight: '500px', height: '100%' }}
        title="Hierarchy Editor"
      />
    </div>
  );
}