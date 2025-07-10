import { memo, useState, useRef, useEffect } from "react";
import { NodeProps, Handle, Position } from "reactflow";
import { Copy, Trash2, Type } from "lucide-react";
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
  connectionPoints?: {
    input?: Array<{ id: string; type: string; position: string }>;
    output?: Array<{ id: string; type: string; position: string }>;
  };
}

function RectangleNode({ data, selected }: NodeProps<RectangleNodeData>) {
  const [isEditingText, setIsEditingText] = useState(false);
  const [editingText, setEditingText] = useState(data.text || '');
  const [savedText, setSavedText] = useState(data.text || '');
  const textRef = useRef<SVGTextElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // Enable text editing when selected
  useEffect(() => {
    if (selected && !isEditingText) {
      setIsEditingText(true);
      setEditingText(savedText);
    } else if (!selected && isEditingText) {
      // Save the text before closing the editor
      console.log('Rectangle node text edit complete. Old:', savedText, 'New:', editingText);
      if (editingText.trim() !== savedText) {
        setSavedText(editingText);
        const updatedData = { ...data, text: editingText };
        console.log('Calling onUpdate with:', updatedData);
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
  const width = data.width || 150;
  const height = data.height || 100;
  const fillColor = 'transparent';
  const strokeColor = '#ffffff';
  const strokeWidth = 1;
  // Scale font size based on dimensions
  const baseFontSize = data.fontSize || 14;
  const scaleFactor = Math.min(width / 150, height / 100);
  const fontSize = width < 80 || height < 60 ? Math.max(10, baseFontSize * scaleFactor) : baseFontSize;
  const textColor = '#ffffff';
  const basePadding = data.padding || 12;
  const padding = width < 80 || height < 60 ? Math.max(4, basePadding * scaleFactor) : basePadding;
  const textAlign = data.textAlign || 'center';
  const wordWrap = data.wordWrap || false;

  const handleTextSubmit = () => {
    console.log('=== TEXT SUBMIT ===');
    console.log('Node ID:', data.id);
    console.log('Old text:', savedText);
    console.log('New text:', editingText);
    
    if (editingText.trim() !== savedText) {
      setSavedText(editingText);
      const updatedData = { ...data, text: editingText };
      console.log('Updating node with:', updatedData);
      if (data.onUpdate) {
        data.onUpdate(updatedData);
      }
    }
    setIsEditingText(false);
  };

  // Function to wrap text
  const wrapText = (text: string, maxWidth: number) => {
    if (!data.wordWrap) return [text];
    
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return [text];
    
    context.font = `${fontSize}px sans-serif`;
    
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = context.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines.length > 0 ? lines : [text];
  };

  const maxTextWidth = width - 2 * padding;
  const textLines = wrapText(savedText || '', maxTextWidth);
  
  // Always show connection points for drawing boxes
  const showConnectionPoints = true;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          className={`relative group transition-all duration-200 ${data.isResizing ? 'resize overflow-visible' : ''}`}
          style={{
            width: `${width}px`,
            height: `${height}px`,
          }}
          onMouseEnter={(e) => {
            // Make handles more visible on hover
            const node = e.currentTarget;
            const handles = node.querySelectorAll('.react-flow__handle');
            handles.forEach(handle => {
              handle.style.opacity = '1';
            });
          }}
          onMouseLeave={(e) => {
            // Hide handles when not hovering
            const node = e.currentTarget;
            const handles = node.querySelectorAll('.react-flow__handle');
            handles.forEach(handle => {
              handle.style.opacity = '0';
            });
          }}
        >
          {/* Connection Points - 4 handles, one on each side */}
          {showConnectionPoints && (
            <>
              {/* Top - Can be both source and target */}
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
              
              {/* Right - Can be both source and target */}
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
              
              {/* Bottom - Can be both source and target */}
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
              
              {/* Left - Can be both source and target */}
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
          )}
          
          <div
            className="absolute inset-0"
            style={{ 
              border: `${strokeWidth}px solid ${strokeColor}`,
              borderRadius: '15px',
              background: fillColor,
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
                  textAlign: textAlign || 'center',
                  wordBreak: wordWrap ? 'break-word' : 'normal',
                  whiteSpace: wordWrap ? 'pre-wrap' : 'nowrap',
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
                borderRadius: '0px'
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

export default memo(RectangleNode);