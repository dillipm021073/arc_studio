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

export interface TriangleNodeData {
  label: string;
  type: string;
  width: number;
  height: number;
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  text?: string;
  fontSize?: number;
  textColor?: string;
  triangleType?: 'equilateral' | 'right' | 'isosceles';
  onDelete?: () => void;
  onDuplicate?: () => void;
  onUpdate?: (data: any) => void;
  connectionPoints?: {
    input?: Array<{ id: string; type: string; position: string }>;
    output?: Array<{ id: string; type: string; position: string }>;
  };
}

function TriangleNode({ data, selected }: NodeProps<TriangleNodeData>) {
  const [isEditingText, setIsEditingText] = useState(false);
  const [editingText, setEditingText] = useState(data.text || '');
  const [savedText, setSavedText] = useState(data.text || '');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
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

  const width = data.width || 120;
  const height = data.height || 100;
  const fillColor = data.fillColor || 'transparent';
  const strokeColor = data.strokeColor || '#ffffff';
  const strokeWidth = data.strokeWidth || 2;
  const fontSize = data.fontSize || 14;
  const textColor = data.textColor || '#ffffff';
  const triangleType = data.triangleType || 'equilateral';

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

  // Calculate triangle points based on type
  const getTrianglePoints = () => {
    switch (triangleType) {
      case 'right':
        // Right triangle - right angle at bottom left
        return `${strokeWidth},${height - strokeWidth} ${width - strokeWidth},${height - strokeWidth} ${strokeWidth},${strokeWidth}`;
      case 'isosceles':
        // Isosceles triangle - symmetrical
        return `${width / 2},${strokeWidth} ${width - strokeWidth},${height - strokeWidth} ${strokeWidth},${height - strokeWidth}`;
      case 'equilateral':
      default:
        // Equilateral triangle
        return `${width / 2},${strokeWidth} ${width - strokeWidth},${height - strokeWidth} ${strokeWidth},${height - strokeWidth}`;
    }
  };

  // Calculate text position (centroid of triangle)
  const getTextPosition = () => {
    switch (triangleType) {
      case 'right':
        return { x: width / 3, y: height / 2 };
      case 'isosceles':
      case 'equilateral':
      default:
        return { x: width / 2, y: height * 0.6 };
    }
  };

  const textPosition = getTextPosition();
  const showConnectionPoints = true;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          className={`relative group transition-all duration-200`}
          style={{
            width: `${width}px`,
            height: `${height}px`,
          }}
        >
          {/* Connection Points */}
          {showConnectionPoints && (
            <>
              {/* Top */}
              <Handle
                type="source"
                position={Position.Top}
                id="top"
                className="w-4 h-4 rounded-full border-2 border-gray-400 bg-gray-700 hover:bg-blue-500 hover:scale-125 transition-all cursor-crosshair"
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
                className="w-4 h-4 rounded-full opacity-0"
                style={{ 
                  top: '-8px', 
                  left: '50%', 
                  transform: 'translateX(-50%)',
                  zIndex: 10
                }}
              />
              
              {/* Right */}
              <Handle
                type="source"
                position={Position.Right}
                id="right"
                className="w-4 h-4 rounded-full border-2 border-gray-400 bg-gray-700 hover:bg-blue-500 hover:scale-125 transition-all cursor-crosshair"
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
                className="w-4 h-4 rounded-full opacity-0"
                style={{ 
                  right: '-8px', 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  zIndex: 10
                }}
              />
              
              {/* Bottom */}
              <Handle
                type="source"
                position={Position.Bottom}
                id="bottom"
                className="w-4 h-4 rounded-full border-2 border-gray-400 bg-gray-700 hover:bg-blue-500 hover:scale-125 transition-all cursor-crosshair"
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
                className="w-4 h-4 rounded-full opacity-0"
                style={{ 
                  bottom: '-8px', 
                  left: '50%', 
                  transform: 'translateX(-50%)',
                  zIndex: 10
                }}
              />
              
              {/* Left */}
              <Handle
                type="source"
                position={Position.Left}
                id="left"
                className="w-4 h-4 rounded-full border-2 border-gray-400 bg-gray-700 hover:bg-blue-500 hover:scale-125 transition-all cursor-crosshair"
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
                className="w-4 h-4 rounded-full opacity-0"
                style={{ 
                  left: '-8px', 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  zIndex: 10
                }}
              />
            </>
          )}
          
          {/* Triangle shape using SVG */}
          <svg
            width={width}
            height={height}
            className="absolute inset-0"
            style={{ overflow: 'visible' }}
          >
            <polygon
              points={getTrianglePoints()}
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
            />
          </svg>
          
          {/* Text content - only show when not editing */}
          {savedText && !isEditingText && (
            <div
              className="absolute flex items-center justify-center"
              style={{
                left: `${textPosition.x}px`,
                top: `${textPosition.y}px`,
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none'
              }}
            >
              <div
                style={{
                  color: textColor,
                  fontSize: `${fontSize}px`,
                  fontFamily: 'sans-serif',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                }}
              >
                {savedText}
              </div>
            </div>
          )}

          {/* Text editing input - show when selected */}
          {isEditingText && (
            <div
              className="absolute"
              style={{
                left: `${textPosition.x}px`,
                top: `${textPosition.y}px`,
                transform: 'translate(-50%, -50%)',
                width: '80%',
                maxWidth: `${width - 20}px`,
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
                  e.stopPropagation();
                }}
                className="w-full bg-transparent border-none outline-none resize-none text-center"
                style={{
                  color: textColor,
                  fontSize: `${fontSize}px`,
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
                clipPath: `polygon(${getTrianglePoints()})`
              }}
            />
          )}

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

export default memo(TriangleNode);