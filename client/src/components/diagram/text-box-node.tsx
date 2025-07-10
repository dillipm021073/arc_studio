import { memo, useState, useRef, useEffect } from "react";
import { NodeProps, Handle, Position } from "reactflow";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { AlignLeft, AlignCenter, AlignRight, Type, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TextBoxNodeData {
  text: string;
  fontSize?: number;
  textAlign?: "left" | "center" | "right";
  fontWeight?: "normal" | "bold";
  fontStyle?: "normal" | "italic";
  color?: string;
  backgroundColor?: string;
  width?: number;
  height?: number;
}

function TextBoxNode({ data, selected, id }: NodeProps<TextBoxNodeData>) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(data.text || "Double-click to edit text");
  const [fontSize, setFontSize] = useState(data.fontSize || 14);
  const [textAlign, setTextAlign] = useState(data.textAlign || "left");
  const [showControls, setShowControls] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dimensions, setDimensions] = useState({
    width: data.width || 200,
    height: data.height || 100
  });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const nodeRef = useRef<HTMLDivElement>(null);
  const startPosRef = useRef({ x: 0, y: 0, width: 0, height: 0 });

  // Update local state when data changes
  useEffect(() => {
    setText(data.text || "Double-click to edit text");
    setFontSize(data.fontSize || 14);
    setTextAlign(data.textAlign || "left");
    if (data.width && data.height) {
      setDimensions({ width: data.width, height: data.height });
    }
  }, [data]);

  // Focus textarea when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    // Update node data through parent component
    if (window.updateNodeData) {
      window.updateNodeData(id, {
        text,
        fontSize,
        textAlign,
        fontWeight: data.fontWeight,
        fontStyle: data.fontStyle,
        color: data.color,
        backgroundColor: data.backgroundColor,
        width: dimensions.width,
        height: dimensions.height,
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsEditing(false);
      handleBlur();
    }
    // Allow Enter for new lines, don't stop editing
    e.stopPropagation();
  };

  const adjustFontSize = (delta: number) => {
    const newSize = Math.max(10, Math.min(48, fontSize + delta));
    setFontSize(newSize);
    if (window.updateNodeData) {
      window.updateNodeData(id, { ...data, fontSize: newSize });
    }
  };

  const cycleAlignment = () => {
    const alignments: ("left" | "center" | "right")[] = ["left", "center", "right"];
    const currentIndex = alignments.indexOf(textAlign);
    const nextAlign = alignments[(currentIndex + 1) % alignments.length];
    setTextAlign(nextAlign);
    if (window.updateNodeData) {
      window.updateNodeData(id, { ...data, textAlign: nextAlign });
    }
  };

  const handleMouseDown = (e: React.MouseEvent, direction: string) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);
    
    startPosRef.current = {
      x: e.clientX,
      y: e.clientY,
      width: dimensions.width,
      height: dimensions.height
    };

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - startPosRef.current.x;
      const dy = e.clientY - startPosRef.current.y;
      
      let newWidth = startPosRef.current.width;
      let newHeight = startPosRef.current.height;

      if (direction.includes('right')) {
        newWidth = Math.max(150, startPosRef.current.width + dx);
      }
      if (direction.includes('left')) {
        newWidth = Math.max(150, startPosRef.current.width - dx);
      }
      if (direction.includes('bottom')) {
        newHeight = Math.max(80, startPosRef.current.height + dy);
      }
      if (direction.includes('top')) {
        newHeight = Math.max(80, startPosRef.current.height - dy);
      }

      setDimensions({ width: newWidth, height: newHeight });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      // Save the new dimensions
      if (window.updateNodeData) {
        window.updateNodeData(id, { 
          ...data,
          width: dimensions.width, 
          height: dimensions.height 
        });
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      ref={nodeRef}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      className="relative"
    >
      {/* Invisible handles for connections if needed */}
      <Handle
        type="target"
        position={Position.Top}
        style={{ opacity: 0, pointerEvents: "none" }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ opacity: 0, pointerEvents: "none" }}
      />

      <Card
        className={cn(
          "p-4 transition-all duration-200",
          selected ? "ring-2 ring-primary ring-offset-2" : "",
          isEditing ? "cursor-text" : isResizing ? "cursor-default" : "cursor-move",
          isResizing && "select-none",
          "bg-yellow-50 border-yellow-200 shadow-md hover:shadow-lg",
          !isResizing && "drag-handle"
        )}
        style={{
          width: `${dimensions.width}px`,
          height: `${dimensions.height}px`,
          backgroundColor: data.backgroundColor || "#fef3c7",
        }}
        onDoubleClick={handleDoubleClick}
      >
        {/* Font size controls - show on hover */}
        {showControls && !isEditing && (
          <div className="absolute -top-10 left-0 right-0 flex items-center justify-center gap-1 bg-white rounded-md shadow-md p-1 border">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation();
                adjustFontSize(-2);
              }}
            >
              <Type className="h-3 w-3" />
              <span className="text-xs">-</span>
            </Button>
            <span className="text-xs px-2 font-mono">{fontSize}px</span>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation();
                adjustFontSize(2);
              }}
            >
              <Type className="h-4 w-4" />
              <span className="text-xs">+</span>
            </Button>
            <div className="w-px h-4 bg-gray-300 mx-1" />
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation();
                cycleAlignment();
              }}
              title={`Text align: ${textAlign}`}
            >
              {textAlign === "left" && <AlignLeft className="h-3 w-3" />}
              {textAlign === "center" && <AlignCenter className="h-3 w-3" />}
              {textAlign === "right" && <AlignRight className="h-3 w-3" />}
            </Button>
          </div>
        )}

        {isEditing ? (
          <Textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="w-full h-full resize-none border-none outline-none bg-transparent p-0 overflow-auto"
            style={{
              fontSize: `${fontSize}px`,
              textAlign: textAlign,
              fontWeight: data.fontWeight || "normal",
              fontStyle: data.fontStyle || "normal",
              color: data.color || "#000",
              lineHeight: 1.5,
            }}
            placeholder="Enter your text..."
          />
        ) : (
          <div
            className="whitespace-pre-wrap break-words overflow-auto h-full"
            style={{
              fontSize: `${fontSize}px`,
              textAlign: textAlign,
              fontWeight: data.fontWeight || "normal",
              fontStyle: data.fontStyle || "normal",
              color: data.color || "#000",
              lineHeight: 1.5,
            }}
          >
            {text || "Double-click to edit text"}
          </div>
        )}

        {/* Resize overlay during resize */}
        {isResizing && (
          <div className="absolute inset-0 bg-blue-500 opacity-10 pointer-events-none rounded" />
        )}

        {/* Resize handles */}
        {showControls && !isEditing && (
          <>
            {/* Bottom-right corner */}
            <div
              className="nodrag absolute -right-2 -bottom-2 w-6 h-6 bg-yellow-400 rounded-full cursor-se-resize opacity-60 hover:opacity-100 flex items-center justify-center border border-yellow-600 z-10"
              onMouseDown={(e) => handleMouseDown(e, 'bottom-right')}
            >
              <GripVertical className="w-3 h-3 rotate-45" />
            </div>
            {/* Right edge */}
            <div
              className="nodrag absolute -right-2 top-1/2 -translate-y-1/2 w-6 h-6 bg-yellow-400 rounded-full cursor-ew-resize opacity-60 hover:opacity-100 flex items-center justify-center border border-yellow-600 z-10"
              onMouseDown={(e) => handleMouseDown(e, 'right')}
            >
              <GripVertical className="w-3 h-3 rotate-90" />
            </div>
            {/* Bottom edge */}
            <div
              className="nodrag absolute left-1/2 -bottom-2 -translate-x-1/2 w-6 h-6 bg-yellow-400 rounded-full cursor-ns-resize opacity-60 hover:opacity-100 flex items-center justify-center border border-yellow-600 z-10"
              onMouseDown={(e) => handleMouseDown(e, 'bottom')}
            >
              <GripVertical className="w-3 h-3" />
            </div>
            {/* Bottom-left corner */}
            <div
              className="nodrag absolute -left-2 -bottom-2 w-6 h-6 bg-yellow-400 rounded-full cursor-sw-resize opacity-60 hover:opacity-100 flex items-center justify-center border border-yellow-600 z-10"
              onMouseDown={(e) => handleMouseDown(e, 'bottom-left')}
            >
              <GripVertical className="w-3 h-3 -rotate-45" />
            </div>
            {/* Left edge */}
            <div
              className="nodrag absolute -left-2 top-1/2 -translate-y-1/2 w-6 h-6 bg-yellow-400 rounded-full cursor-ew-resize opacity-60 hover:opacity-100 flex items-center justify-center border border-yellow-600 z-10"
              onMouseDown={(e) => handleMouseDown(e, 'left')}
            >
              <GripVertical className="w-3 h-3 rotate-90" />
            </div>
            {/* Top edge */}
            <div
              className="nodrag absolute left-1/2 -top-2 -translate-x-1/2 w-6 h-6 bg-yellow-400 rounded-full cursor-ns-resize opacity-60 hover:opacity-100 flex items-center justify-center border border-yellow-600 z-10"
              onMouseDown={(e) => handleMouseDown(e, 'top')}
            >
              <GripVertical className="w-3 h-3" />
            </div>
            {/* Top-left corner */}
            <div
              className="nodrag absolute -left-2 -top-2 w-6 h-6 bg-yellow-400 rounded-full cursor-nw-resize opacity-60 hover:opacity-100 flex items-center justify-center border border-yellow-600 z-10"
              onMouseDown={(e) => handleMouseDown(e, 'top-left')}
            >
              <GripVertical className="w-3 h-3 rotate-45" />
            </div>
            {/* Top-right corner */}
            <div
              className="nodrag absolute -right-2 -top-2 w-6 h-6 bg-yellow-400 rounded-full cursor-ne-resize opacity-60 hover:opacity-100 flex items-center justify-center border border-yellow-600 z-10"
              onMouseDown={(e) => handleMouseDown(e, 'top-right')}
            >
              <GripVertical className="w-3 h-3 -rotate-45" />
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

// Add type declaration for the global updateNodeData function
declare global {
  interface Window {
    updateNodeData: (nodeId: string, data: Partial<TextBoxNodeData>) => void;
  }
}

export default memo(TextBoxNode);