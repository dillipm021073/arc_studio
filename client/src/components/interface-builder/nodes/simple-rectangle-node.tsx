import { memo, useState, useRef, useEffect } from "react";
import { NodeProps, Handle, Position } from "reactflow";
import { Copy, Trash2 } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

export interface RectangleNodeData {
  label: string;
  type: string;
  width: number;
  height: number;
  color?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  fillOpacity?: number;
  text?: string;
  fontSize?: number;
  textColor?: string;
  fontWeight?: string;
  textAlign?: 'left' | 'center' | 'right';
  padding?: number;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onUpdate?: (data: any) => void;
}

function SimpleRectangleNode({ data, selected }: NodeProps<RectangleNodeData>) {
  const [isEditingText, setIsEditingText] = useState(false);
  const [editingText, setEditingText] = useState(data.text || '');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  const width = data.width || 150;
  const height = data.height || 100;
  const fillColor = data.color || 'transparent';
  const strokeColor = data.borderColor || '#ffffff';
  const strokeWidth = data.borderWidth || 1;
  const borderRadius = data.borderRadius || 0;
  const fillOpacity = data.fillOpacity || 1;
  const fontSize = data.fontSize || 14;
  const fontWeight = data.fontWeight || 'normal';
  const textColor = data.textColor || '#ffffff';
  const padding = data.padding || 12;
  const textAlign = data.textAlign || 'center';

  // Handle text editing when node is selected
  useEffect(() => {
    if (selected && !isEditingText) {
      setIsEditingText(true);
      setEditingText(data.text || '');
    } else if (!selected && isEditingText) {
      handleTextSubmit();
    }
  }, [selected]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditingText && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingText]);

  const handleTextSubmit = () => {
    if (editingText !== data.text) {
      if (data.onUpdate) {
        data.onUpdate({ ...data, text: editingText });
      }
    }
    setIsEditingText(false);
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          className="relative group"
          style={{
            width: `${width}px`,
            height: `${height}px`,
          }}
        >
          {/* Top handle */}
          <Handle
            type="source"
            position={Position.Top}
            id="top"
            className="w-3 h-3"
            style={{
              background: '#555',
              border: '1px solid #fff',
              top: -5,
              opacity: 0,
              transition: 'opacity 0.2s',
            }}
          />
          <Handle
            type="target"
            position={Position.Top}
            id="top"
            className="w-3 h-3"
            style={{
              background: '#555',
              border: '1px solid #fff',
              top: -5,
              opacity: 0,
              transition: 'opacity 0.2s',
            }}
          />
          
          {/* Right handle */}
          <Handle
            type="source"
            position={Position.Right}
            id="right"
            className="w-3 h-3"
            style={{
              background: '#555',
              border: '1px solid #fff',
              right: -5,
              opacity: 0,
              transition: 'opacity 0.2s',
            }}
          />
          <Handle
            type="target"
            position={Position.Right}
            id="right"
            className="w-3 h-3"
            style={{
              background: '#555',
              border: '1px solid #fff',
              right: -5,
              opacity: 0,
              transition: 'opacity 0.2s',
            }}
          />
          
          {/* Bottom handle */}
          <Handle
            type="source"
            position={Position.Bottom}
            id="bottom"
            className="w-3 h-3"
            style={{
              background: '#555',
              border: '1px solid #fff',
              bottom: -5,
              opacity: 0,
              transition: 'opacity 0.2s',
            }}
          />
          <Handle
            type="target"
            position={Position.Bottom}
            id="bottom"
            className="w-3 h-3"
            style={{
              background: '#555',
              border: '1px solid #fff',
              bottom: -5,
              opacity: 0,
              transition: 'opacity 0.2s',
            }}
          />
          
          {/* Left handle */}
          <Handle
            type="source"
            position={Position.Left}
            id="left"
            className="w-3 h-3"
            style={{
              background: '#555',
              border: '1px solid #fff',
              left: -5,
              opacity: 0,
              transition: 'opacity 0.2s',
            }}
          />
          <Handle
            type="target"
            position={Position.Left}
            id="left"
            className="w-3 h-3"
            style={{
              background: '#555',
              border: '1px solid #fff',
              left: -5,
              opacity: 0,
              transition: 'opacity 0.2s',
            }}
          />
          
          {/* Rectangle shape */}
          <div
            className="absolute inset-0"
            style={{ 
              backgroundColor: fillColor,
              border: `${strokeWidth}px solid ${strokeColor}`,
              borderRadius: `${borderRadius}px`,
              opacity: fillOpacity,
            }}
          />
          
          {/* Text content */}
          {!isEditingText && data.text && (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                padding: `${padding}px`,
                pointerEvents: 'none',
              }}
            >
              <div
                style={{
                  color: textColor,
                  fontSize: `${fontSize}px`,
                  fontWeight: fontWeight,
                  fontFamily: 'sans-serif',
                  textAlign: textAlign,
                  wordBreak: 'break-word',
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.2,
                }}
              >
                {data.text}
              </div>
            </div>
          )}

          {/* Text editing input */}
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
                    setEditingText(data.text || '');
                    setIsEditingText(false);
                  }
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

          {/* Show handles on hover */}
          <style jsx>{`
            .group:hover .react-flow__handle {
              opacity: 1 !important;
            }
          `}</style>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="bg-gray-800 border-gray-700">
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

export default memo(SimpleRectangleNode);