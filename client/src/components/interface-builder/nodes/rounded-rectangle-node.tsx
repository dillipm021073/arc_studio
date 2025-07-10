import { memo, useState, useRef, useEffect } from "react";
import { NodeProps, Handle, Position, NodeResizer } from "reactflow";
import { Copy, Trash2, SendToBack, ZoomIn, ZoomOut } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { ResizeControls } from './ResizeControls';
import { useNodeResize } from './useNodeResize';

export interface RoundedRectangleNodeData {
  label: string;
  type: string;
  width: number;
  height: number;
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  borderRadius: number;
  text?: string;
  fontSize?: number;
  textColor?: string;
  textAlign?: 'left' | 'center' | 'right';
  padding?: number;
  wordWrap?: boolean;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onToggleResize?: () => void;
  isResizing?: boolean;
  onUpdate?: (data: any) => void;
  zIndex?: number;
}

function RoundedRectangleNode({ data, selected }: NodeProps<RoundedRectangleNodeData>) {
  const [isEditingText, setIsEditingText] = useState(false);
  const [editingText, setEditingText] = useState(data.text || '');
  const [savedText, setSavedText] = useState(data.text || '');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { dimensions, handleResize, enlargeNode, shrinkNode, resetSize } = useNodeResize({
    initialWidth: 150,
    initialHeight: 80,
    minWidth: 100,
    minHeight: 50,
    maxWidth: 500,
    maxHeight: 300,
    onUpdate: data.onUpdate,
    nodeData: data
  });

  // Enable text editing when selected
  useEffect(() => {
    if (selected && !isEditingText) {
      setIsEditingText(true);
      setEditingText(savedText);
    } else if (!selected && isEditingText) {
      // Save the text before closing the editor
      if (editingText.trim() !== savedText) {
        setSavedText(editingText);
        const updatedData = { ...data, text: editingText };
        if (data.onUpdate) {
          data.onUpdate(updatedData);
        }
      }
      setIsEditingText(false);
    }
  }, [selected]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditingText && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingText]);

  // Sync with external text updates
  useEffect(() => {
    if (data.text !== undefined && data.text !== savedText) {
      setSavedText(data.text);
      setEditingText(data.text);
    }
  }, [data.text]);

  const width = dimensions.width;
  const height = dimensions.height;
  const fillColor = data.fillColor || '#ff9966';
  const strokeColor = data.strokeColor || '#ffffff';
  const strokeWidth = data.strokeWidth || 2;
  const borderRadius = data.borderRadius || 20;
  const fontSize = data.fontSize || 14;
  const textColor = data.textColor || '#ffffff';
  const padding = data.padding || 12;
  const textAlign = data.textAlign || 'center';

  const handleTextSubmit = () => {
    if (editingText.trim() !== savedText) {
      setSavedText(editingText);
      const updatedData = { ...data, text: editingText };
      if (data.onUpdate) {
        data.onUpdate(updatedData);
      }
    }
    setIsEditingText(false);
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          className={`relative group transition-all duration-200`}
          style={{
            width: `${width}px`,
            height: `${height}px`,
            zIndex: data.zIndex || 0
          }}
        >
          {/* Node Resizer */}
          {selected && (
            <NodeResizer
              color="#ff9966"
              isVisible={selected}
              minWidth={100}
              minHeight={50}
              maxWidth={500}
              maxHeight={300}
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
          
          <div
            className="absolute inset-0"
            style={{ 
              border: `${strokeWidth}px solid ${strokeColor}`,
              borderRadius: `${borderRadius}px`,
              backgroundColor: fillColor,
              pointerEvents: 'none'
            }}
          />
          
          {/* Text content - only show when not editing */}
          {savedText && !isEditingText && (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                padding: `${padding}px`,
                pointerEvents: 'none'
              }}
            >
              <div
                style={{
                  color: textColor,
                  fontSize: `${fontSize}px`,
                  fontFamily: 'sans-serif',
                  textAlign: textAlign,
                  wordBreak: data.wordWrap ? 'break-word' : 'normal',
                  whiteSpace: data.wordWrap ? 'pre-wrap' : 'nowrap',
                  lineHeight: 1.2,
                }}
              >
                {savedText}
              </div>
            </div>
          )}

          {/* Text editing input - show when selected */}
          {isEditingText && (
            <div
              className="absolute inset-0 p-2"
              style={{
                padding: `${padding}px`,
              }}
            >
              <textarea
                ref={inputRef}
                value={editingText}
                onChange={(e) => setEditingText(e.target.value)}
                onBlur={handleTextSubmit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleTextSubmit();
                  } else if (e.key === 'Escape') {
                    e.preventDefault();
                    setEditingText(savedText);
                    setIsEditingText(false);
                  }
                  // Stop propagation to prevent canvas shortcuts
                  e.stopPropagation();
                }}
                className="w-full h-full bg-transparent border-none outline-none resize-none"
                style={{
                  color: textColor,
                  fontSize: `${fontSize}px`,
                  textAlign: 'center',
                  fontFamily: 'sans-serif',
                }}
                placeholder="Type here..."
              />
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

export default memo(RoundedRectangleNode);