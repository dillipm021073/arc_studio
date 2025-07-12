import { memo, useState } from "react";
import { Handle, Position, NodeProps, NodeResizer } from "reactflow";
import { FileText, Edit2, Copy, Trash2, Maximize2, ZoomIn, ZoomOut, Code, Download, AlertTriangle } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Badge } from "@/components/ui/badge";
import { ResizeControls } from './ResizeControls';
import { useNodeResize } from './useNodeResize';

export interface UmlNodeData {
  id: string;
  name: string;
  description: string;
  diagramType: string;
  content: string;
  svg: string;
  metadata?: any;
  isFallback?: boolean;
  category: string;
  color: string;
  width?: number;
  height?: number;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onToggleResize?: () => void;
  onUpdate?: (data: Partial<UmlNodeData>) => void;
  isResizing?: boolean;
}

function UmlNode({ data, selected }: NodeProps<UmlNodeData>) {
  const [showSource, setShowSource] = useState(false);

  const { dimensions, handleResize, enlargeNode, shrinkNode, resetSize } = useNodeResize({
    initialWidth: data.width || 600,
    initialHeight: data.height || 400,
    minWidth: 200,
    minHeight: 150,
    maxWidth: 1200,
    maxHeight: 800,
    onUpdate: data.onUpdate,
    nodeData: data
  });

  const handleExportSvg = () => {
    const blob = new Blob([data.svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.name}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopySource = () => {
    navigator.clipboard.writeText(data.content);
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div
          className={`relative transition-all duration-200 ${
            selected 
              ? 'ring-2 ring-blue-500 ring-opacity-50' 
              : ''
          }`}
          style={{ 
            width: dimensions.width, 
            height: dimensions.height,
            minWidth: 200,
            minHeight: 150
          }}
        >
          {/* Minimal header - only show when selected */}
          {selected && (
            <div className="absolute -top-8 left-0 flex items-center gap-2 bg-black/80 text-white px-2 py-1 rounded text-xs z-10">
              <FileText className="h-3 w-3" />
              <span>{data.name}</span>
              {data.isFallback && (
                <AlertTriangle className="h-3 w-3 text-orange-400" title="Fallback view" />
              )}
              <Badge variant="secondary" className="text-xs bg-purple-600 text-white">
                {data.diagramType}
              </Badge>
            </div>
          )}

          {/* Content - full size */}
          <div className="w-full h-full overflow-hidden">
            {showSource ? (
              <div className="h-full w-full bg-white border rounded shadow">
                <pre className="text-xs bg-gray-100 p-2 rounded h-full w-full overflow-auto font-mono">
                  {data.content}
                </pre>
              </div>
            ) : (
              <div 
                className="h-full w-full overflow-auto bg-white rounded"
                style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '10px'
                }}
              >
                <div 
                  dangerouslySetInnerHTML={{ __html: data.svg }}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    width: 'auto',
                    height: 'auto'
                  }}
                />
              </div>
            )}
          </div>

          {/* Resize Controls */}
          {selected && data.isResizing && (
            <ResizeControls
              onEnlarge={enlargeNode}
              onShrink={shrinkNode}
              onReset={resetSize}
            />
          )}

          {/* React Flow Resizer */}
          {selected && (
            <NodeResizer
              minWidth={200}
              minHeight={150}
              onResize={handleResize}
              isVisible={selected}
              lineStyle={{
                borderWidth: 2,
                borderColor: '#3b82f6',
              }}
              handleStyle={{
                width: 8,
                height: 8,
                backgroundColor: '#3b82f6',
                borderRadius: '50%',
              }}
            />
          )}

          {/* Connection Handles */}
          <Handle
            type="target"
            position={Position.Top}
            className="w-3 h-3 bg-purple-500 border-2 border-white"
          />
          <Handle
            type="source"
            position={Position.Bottom}
            className="w-3 h-3 bg-purple-500 border-2 border-white"
          />
          <Handle
            type="target"
            position={Position.Left}
            className="w-3 h-3 bg-purple-500 border-2 border-white"
          />
          <Handle
            type="source"
            position={Position.Right}
            className="w-3 h-3 bg-purple-500 border-2 border-white"
          />
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent>
        <ContextMenuItem onClick={() => setShowSource(!showSource)}>
          <Code className="mr-2 h-4 w-4" />
          {showSource ? 'Show Diagram' : 'Show Source'}
        </ContextMenuItem>
        <ContextMenuItem onClick={handleCopySource}>
          <Copy className="mr-2 h-4 w-4" />
          Copy Source
        </ContextMenuItem>
        <ContextMenuItem onClick={handleExportSvg}>
          <Download className="mr-2 h-4 w-4" />
          Export SVG
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={enlargeNode}>
          <ZoomIn className="mr-2 h-4 w-4" />
          Enlarge
        </ContextMenuItem>
        <ContextMenuItem onClick={shrinkNode}>
          <ZoomOut className="mr-2 h-4 w-4" />
          Shrink
        </ContextMenuItem>
        <ContextMenuItem onClick={resetSize}>
          <Maximize2 className="mr-2 h-4 w-4" />
          Reset Size
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={data.onDuplicate}>
          <Copy className="mr-2 h-4 w-4" />
          Duplicate
        </ContextMenuItem>
        <ContextMenuItem onClick={data.onToggleResize}>
          <Edit2 className="mr-2 h-4 w-4" />
          Toggle Resize Mode
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={data.onDelete} className="text-red-600">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

export default memo(UmlNode);