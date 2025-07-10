import { memo, useState, useRef, useEffect } from "react";
import { NodeProps, Handle, Position, NodeResizer } from "reactflow";
import { Copy, Trash2, Maximize2, Minimize2, SendToBack, ZoomIn, ZoomOut } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { ResizeControls } from './ResizeControls';
import { useNodeResize } from './useNodeResize';

export interface ContainerNodeData {
  label: string;
  type: string;
  width: number;
  height: number;
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  borderRadius: number;
  title?: string;
  titleFontSize?: number;
  titleColor?: string;
  opacity?: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onUpdate?: (data: any) => void;
  isResizing?: boolean;
  allowNesting?: boolean;
  zIndex?: number;
}

function ContainerNode({ data, selected }: NodeProps<ContainerNodeData>) {
  const [isResizing, setIsResizing] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitle, setEditingTitle] = useState(data.title || 'Container');
  const titleInputRef = useRef<HTMLInputElement>(null);

  const { dimensions, handleResize, enlargeNode, shrinkNode, resetSize } = useNodeResize({
    initialWidth: 400,
    initialHeight: 300,
    minWidth: data.minWidth || 200,
    minHeight: data.minHeight || 150,
    maxWidth: data.maxWidth || 800,
    maxHeight: data.maxHeight || 600,
    onUpdate: data.onUpdate,
    nodeData: data
  });

  const width = dimensions.width;
  const height = dimensions.height;
  const fillColor = data.fillColor || 'rgba(255, 153, 102, 0.2)';
  const strokeColor = data.strokeColor || '#ff9966';
  const strokeWidth = data.strokeWidth || 2;
  const borderRadius = data.borderRadius || 15;
  const opacity = data.opacity || 0.9;
  const title = editingTitle;
  const titleFontSize = data.titleFontSize || 18;
  const titleColor = data.titleColor || '#ffffff';

  // Focus input when editing starts
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  // Update title when data changes
  useEffect(() => {
    if (data.title && data.title !== editingTitle && !isEditingTitle) {
      setEditingTitle(data.title);
    }
  }, [data.title]);

  const handleTitleSubmit = () => {
    if (data.onUpdate && editingTitle !== data.title) {
      data.onUpdate({
        ...data,
        title: editingTitle
      });
    }
    setIsEditingTitle(false);
  };

  const handleTitleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditingTitle(true);
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          className="relative group"
          style={{
            width: `${width}px`,
            height: `${height}px`,
            zIndex: data.zIndex || -1, // Send to back by default
          }}
        >
          {/* Node Resizer */}
          {selected && (
            <NodeResizer
              color="#ff9966"
              isVisible={selected}
              minWidth={data.minWidth || 200}
              minHeight={data.minHeight || 150}
              maxWidth={data.maxWidth || 800}
              maxHeight={data.maxHeight || 600}
              onResize={handleResize}
            />
          )}

          {/* Resize Controls */}
          <ResizeControls
            onEnlarge={enlargeNode}
            onShrink={shrinkNode}
            visible={selected}
          />

          {/* Connection Points - 4 handles, one on each side */}
          <>
            <Handle
              type="source"
              position={Position.Top}
              id="top"
              className="w-3 h-3 bg-blue-500 border-2 border-gray-700"
              style={{ 
                top: '-8px', 
                left: '50%', 
                transform: 'translateX(-50%)',
                zIndex: 10
              }}
            />
            <Handle
              type="target"
              position={Position.Top}
              id="top"
              className="w-2 h-2 bg-transparent"
              style={{ 
                top: '-6px', 
                left: '50%', 
                transform: 'translateX(-50%)',
                zIndex: 11
              }}
            />
            
            <Handle
              type="source"
              position={Position.Right}
              id="right"
              className="w-3 h-3 bg-blue-500 border-2 border-gray-700"
              style={{ 
                right: '-8px', 
                top: '50%', 
                transform: 'translateY(-50%)',
                zIndex: 10
              }}
            />
            <Handle
              type="target"
              position={Position.Right}
              id="right"
              className="w-2 h-2 bg-transparent"
              style={{ 
                right: '-6px', 
                top: '50%', 
                transform: 'translateY(-50%)',
                zIndex: 11
              }}
            />
            
            <Handle
              type="source"
              position={Position.Bottom}
              id="bottom"
              className="w-3 h-3 bg-blue-500 border-2 border-gray-700"
              style={{ 
                bottom: '-8px', 
                left: '50%', 
                transform: 'translateX(-50%)',
                zIndex: 10
              }}
            />
            <Handle
              type="target"
              position={Position.Bottom}
              id="bottom"
              className="w-2 h-2 bg-transparent"
              style={{ 
                bottom: '-6px', 
                left: '50%', 
                transform: 'translateX(-50%)',
                zIndex: 11
              }}
            />
            
            <Handle
              type="source"
              position={Position.Left}
              id="left"
              className="w-3 h-3 bg-blue-500 border-2 border-gray-700"
              style={{ 
                left: '-8px', 
                top: '50%', 
                transform: 'translateY(-50%)',
                zIndex: 10
              }}
            />
            <Handle
              type="target"
              position={Position.Left}
              id="left"
              className="w-2 h-2 bg-transparent"
              style={{ 
                left: '-6px', 
                top: '50%', 
                transform: 'translateY(-50%)',
                zIndex: 11
              }}
            />
          </>
          
          {/* Container Box */}
          <div
            className="absolute inset-0"
            style={{ 
              border: `${strokeWidth}px solid ${strokeColor}`,
              borderRadius: `${borderRadius}px`,
              backgroundColor: fillColor,
              opacity: opacity,
              pointerEvents: 'all'
            }}
          />
          
          {/* Title */}
          {title && (
            <div
              className="absolute top-0 left-0 right-0 p-3 cursor-text"
              style={{
                borderTopLeftRadius: `${borderRadius}px`,
                borderTopRightRadius: `${borderRadius}px`,
                backgroundColor: strokeColor,
                pointerEvents: 'all'
              }}
              onClick={handleTitleClick}
            >
              {isEditingTitle ? (
                <input
                  ref={titleInputRef}
                  type="text"
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  onBlur={handleTitleSubmit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleTitleSubmit();
                    } else if (e.key === 'Escape') {
                      e.preventDefault();
                      setEditingTitle(data.title || 'Container');
                      setIsEditingTitle(false);
                    }
                    e.stopPropagation();
                  }}
                  className="bg-transparent border-none outline-none w-full text-center"
                  style={{
                    color: titleColor,
                    fontSize: `${titleFontSize}px`,
                    fontWeight: 'bold',
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <div
                  style={{
                    color: titleColor,
                    fontSize: `${titleFontSize}px`,
                    fontWeight: 'bold',
                    textAlign: 'center',
                  }}
                >
                  {title}
                </div>
              )}
            </div>
          )}

          {/* Selection indicator */}
          {selected && (
            <div 
              className="absolute inset-0 border-2 border-blue-500 pointer-events-none"
              style={{
                borderRadius: `${borderRadius}px`
              }}
            />
          )}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="bg-gray-800 border-gray-700">
        <ContextMenuItem
          onClick={enlargeNode}
          className="text-gray-300 hover:text-white hover:bg-gray-700"
        >
          <ZoomIn className="mr-2 h-4 w-4" />
          Enlarge (20%)
        </ContextMenuItem>
        <ContextMenuItem
          onClick={shrinkNode}
          className="text-gray-300 hover:text-white hover:bg-gray-700"
        >
          <ZoomOut className="mr-2 h-4 w-4" />
          Shrink (20%)
        </ContextMenuItem>
        <ContextMenuItem
          onClick={resetSize}
          className="text-gray-300 hover:text-white hover:bg-gray-700"
        >
          Reset Size
        </ContextMenuItem>
        <ContextMenuSeparator className="bg-gray-700" />
        <ContextMenuItem
          onClick={() => {
            if (data.onUpdate) {
              data.onUpdate({
                ...data,
                zIndex: -5
              });
            }
          }}
          className="text-gray-300 hover:text-white hover:bg-gray-700"
        >
          <SendToBack className="mr-2 h-4 w-4" />
          Send to Background
        </ContextMenuItem>
        <ContextMenuItem
          onClick={data.onDuplicate}
          className="text-gray-300 hover:text-white hover:bg-gray-700"
        >
          <Copy className="mr-2 h-4 w-4" />
          Duplicate
        </ContextMenuItem>
        <ContextMenuSeparator className="bg-gray-700" />
        <ContextMenuItem
          onClick={data.onDelete}
          className="text-red-400 hover:text-red-300 hover:bg-gray-700"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

export default memo(ContainerNode);