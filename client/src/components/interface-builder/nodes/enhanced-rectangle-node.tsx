import { memo, useState, useRef, useEffect } from "react";
import { NodeProps, Handle, Position } from "reactflow";
import { Copy, Trash2 } from "lucide-react";
import ResizeHandles from "./resize-handles";
import RotationHandle from "./rotation-handle";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

export interface EnhancedRectangleNodeData {
  label: string;
  type: string;
  width: number;
  height: number;
  rotation?: number;
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
  onUpdate?: (data: any) => void;
  connectionPoints?: {
    input?: Array<{ id: string; type: string; position: string }>;
    output?: Array<{ id: string; type: string; position: string }>;
  };
}

function EnhancedRectangleNode({ data, selected }: NodeProps<EnhancedRectangleNodeData>) {
  const [isEditingText, setIsEditingText] = useState(false);
  const [editingText, setEditingText] = useState(data.text || '');
  const [savedText, setSavedText] = useState(data.text || '');
  const [dimensions, setDimensions] = useState({ width: data.width || 150, height: data.height || 100 });
  const [rotation, setRotation] = useState(data.rotation || 0);
  const [showHandles, setShowHandles] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // Show handles when selected
  useEffect(() => {
    setShowHandles(selected);
  }, [selected]);
  
  // Enable text editing when double-clicked
  const handleDoubleClick = () => {
    if (selected) {
      setIsEditingText(true);
      setEditingText(savedText);
    }
  };
  
  // Focus input when editing starts
  useEffect(() => {
    if (isEditingText && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingText]);

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

  const handleResize = (newWidth: number, newHeight: number) => {
    setDimensions({ width: newWidth, height: newHeight });
    if (data.onUpdate) {
      data.onUpdate({ ...data, width: newWidth, height: newHeight });
    }
  };

  const handleRotate = (newRotation: number) => {
    setRotation(newRotation);
    if (data.onUpdate) {
      data.onUpdate({ ...data, rotation: newRotation });
    }
  };

  const fillColor = data.fillColor || 'transparent';
  const strokeColor = data.strokeColor || '#ffffff';
  const strokeWidth = data.strokeWidth || 1;
  const fontSize = data.fontSize || 14;
  const textColor = data.textColor || '#ffffff';
  const borderRadius = data.borderRadius || 0;
  const padding = data.padding || 12;

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div
          style={{
            position: 'relative',
            width: dimensions.width,
            height: dimensions.height,
            transform: `rotate(${rotation}deg)`,
            transformOrigin: 'center',
          }}
          onDoubleClick={handleDoubleClick}
        >
        {/* Main rectangle */}
        <svg
          width={dimensions.width}
          height={dimensions.height}
          style={{ overflow: 'visible', cursor: 'pointer' }}
        >
          <rect
            x={0}
            y={0}
            width={dimensions.width}
            height={dimensions.height}
            rx={borderRadius}
            ry={borderRadius}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
          
          {/* Text display */}
          {!isEditingText && savedText && (
            <text
              x={dimensions.width / 2}
              y={dimensions.height / 2}
              textAnchor="middle"
              alignmentBaseline="middle"
              fill={textColor}
              fontSize={fontSize}
              fontFamily="sans-serif"
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
              {savedText}
            </text>
          )}
        </svg>

        {/* Text input for editing */}
        {isEditingText && (
          <textarea
            ref={inputRef}
            value={editingText}
            onChange={(e) => setEditingText(e.target.value)}
            onBlur={handleTextSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleTextSubmit();
              }
              if (e.key === 'Escape') {
                setEditingText(savedText);
                setIsEditingText(false);
              }
            }}
            style={{
              position: 'absolute',
              left: padding,
              top: padding,
              width: `${dimensions.width - padding * 2}px`,
              height: `${dimensions.height - padding * 2}px`,
              background: 'rgba(0, 0, 0, 0.8)',
              color: textColor,
              border: '1px solid #4a5568',
              borderRadius: '4px',
              padding: '4px',
              fontSize: `${fontSize}px`,
              fontFamily: 'sans-serif',
              outline: 'none',
              resize: 'none',
              textAlign: data.textAlign || 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          />
        )}

        {/* Resize handles */}
        <ResizeHandles
          width={dimensions.width}
          height={dimensions.height}
          onResize={handleResize}
          visible={showHandles}
          minWidth={30}
          minHeight={30}
          maxWidth={500}
          maxHeight={500}
        />

        {/* Rotation handle */}
        <RotationHandle
          width={dimensions.width}
          height={dimensions.height}
          rotation={rotation}
          onRotate={handleRotate}
          visible={showHandles}
        />

        {/* Connection handles */}
        <Handle
          type="source"
          position={Position.Top}
          style={{ 
            background: '#555', 
            border: '1px solid #fff',
            transform: `rotate(-${rotation}deg)`,
          }}
        />
        <Handle
          type="target"
          position={Position.Top}
          style={{ 
            background: '#555', 
            border: '1px solid #fff',
            transform: `rotate(-${rotation}deg)`,
          }}
        />
        <Handle
          type="source"
          position={Position.Right}
          style={{ 
            background: '#555', 
            border: '1px solid #fff',
            transform: `rotate(-${rotation}deg)`,
          }}
        />
        <Handle
          type="target"
          position={Position.Right}
          style={{ 
            background: '#555', 
            border: '1px solid #fff',
            transform: `rotate(-${rotation}deg)`,
          }}
        />
        <Handle
          type="source"
          position={Position.Bottom}
          style={{ 
            background: '#555', 
            border: '1px solid #fff',
            transform: `rotate(-${rotation}deg)`,
          }}
        />
        <Handle
          type="target"
          position={Position.Bottom}
          style={{ 
            background: '#555', 
            border: '1px solid #fff',
            transform: `rotate(-${rotation}deg)`,
          }}
        />
        <Handle
          type="source"
          position={Position.Left}
          style={{ 
            background: '#555', 
            border: '1px solid #fff',
            transform: `rotate(-${rotation}deg)`,
          }}
        />
        <Handle
          type="target"
          position={Position.Left}
          style={{ 
            background: '#555', 
            border: '1px solid #fff',
            transform: `rotate(-${rotation}deg)`,
          }}
        />
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent>
        <ContextMenuItem onClick={() => data.onDuplicate?.()}>
          <Copy className="mr-2 h-4 w-4" />
          Duplicate
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={() => data.onDelete?.()} className="text-red-500">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

export default memo(EnhancedRectangleNode);