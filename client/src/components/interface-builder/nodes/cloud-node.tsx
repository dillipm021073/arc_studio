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

export interface CloudNodeData {
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

function CloudNode({ data, selected }: NodeProps<CloudNodeData>) {
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

  const width = data.width || 200;
  const height = data.height || 120;
  const fillColor = data.fillColor || 'transparent';
  const strokeColor = data.strokeColor || '#ffffff';
  const strokeWidth = data.strokeWidth || 2;
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

  // Cloud shape SVG path
  const createCloudPath = (w: number, h: number) => {
    const scale = Math.min(w / 200, h / 120); // Scale relative to default size
    const cx = w / 2;
    const cy = h / 2;
    
    // Cloud shape made of overlapping circles (simplified)
    // Main body is an ellipse, with smaller circles for cloud bumps
    const mainWidth = w * 0.6;
    const mainHeight = h * 0.4;
    const mainX = cx;
    const mainY = cy;
    
    // Create a path that approximates a cloud using cubic bezier curves
    const path = `
      M ${cx - mainWidth/2} ${cy}
      C ${cx - mainWidth/2 - 20} ${cy - mainHeight/2 - 15}, ${cx - mainWidth/4} ${cy - mainHeight/2 - 25}, ${cx - mainWidth/4} ${cy - mainHeight/2}
      C ${cx - mainWidth/6} ${cy - mainHeight/2 - 20}, ${cx + mainWidth/6} ${cy - mainHeight/2 - 20}, ${cx + mainWidth/4} ${cy - mainHeight/2}
      C ${cx + mainWidth/4} ${cy - mainHeight/2 - 25}, ${cx + mainWidth/2 + 20} ${cy - mainHeight/2 - 15}, ${cx + mainWidth/2} ${cy}
      C ${cx + mainWidth/2 + 15} ${cy + mainHeight/4}, ${cx + mainWidth/3} ${cy + mainHeight/2 + 10}, ${cx + mainWidth/4} ${cy + mainHeight/2}
      C ${cx} ${cy + mainHeight/2 + 15}, ${cx - mainWidth/3} ${cy + mainHeight/2 + 10}, ${cx - mainWidth/4} ${cy + mainHeight/2}
      C ${cx - mainWidth/3} ${cy + mainHeight/2 + 10}, ${cx - mainWidth/2 - 15} ${cy + mainHeight/4}, ${cx - mainWidth/2} ${cy}
      Z
    `;
    
    return path;
  };

  const cloudPath = createCloudPath(width, height);

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          className={`relative group transition-all duration-200 ${data.isResizing ? 'resize overflow-visible' : ''}`}
          style={{
            width: `${width}px`,
            height: `${height}px`,
          }}
          onMouseEnter={() => {
            // Show handles on hover
            const handles = document.querySelectorAll(`[data-nodeid="${data.id}"] .react-flow__handle`);
            handles.forEach(handle => handle.classList.add('visible'));
          }}
          onMouseLeave={() => {
            // Hide handles when not hovering
            const handles = document.querySelectorAll(`[data-nodeid="${data.id}"] .react-flow__handle`);
            handles.forEach(handle => handle.classList.remove('visible'));
          }}
        >
          {/* Connection Points - 4 handles positioned around the cloud */}
          <>
            {/* Top - Can be both source and target */}
            <Handle
              type="source"
              position={Position.Top}
              id="top"
              className="w-4 h-4 rounded-full border-2 border-gray-400 bg-gray-700 hover:bg-blue-500 hover:scale-125 transition-all cursor-crosshair"
              style={{ 
                top: '20%', 
                left: '50%', 
                transform: 'translate(-50%, -50%)',
                zIndex: 10
              }}
            />
            <Handle
              type="target"
              position={Position.Top}
              id="top"
              className="w-4 h-4 rounded-full opacity-0"
              style={{ 
                top: '20%', 
                left: '50%', 
                transform: 'translate(-50%, -50%)',
                zIndex: 10
              }}
            />
            
            {/* Right - Can be both source and target */}
            <Handle
              type="source"
              position={Position.Right}
              id="right"
              className="w-4 h-4 rounded-full border-2 border-gray-400 bg-gray-700 hover:bg-blue-500 hover:scale-125 transition-all cursor-crosshair"
              style={{ 
                right: '15%', 
                top: '50%', 
                transform: 'translate(50%, -50%)',
                zIndex: 10
              }}
            />
            <Handle
              type="target"
              position={Position.Right}
              id="right"
              className="w-4 h-4 rounded-full opacity-0"
              style={{ 
                right: '15%', 
                top: '50%', 
                transform: 'translate(50%, -50%)',
                zIndex: 10
              }}
            />
            
            {/* Bottom - Can be both source and target */}
            <Handle
              type="source"
              position={Position.Bottom}
              id="bottom"
              className="w-4 h-4 rounded-full border-2 border-gray-400 bg-gray-700 hover:bg-blue-500 hover:scale-125 transition-all cursor-crosshair"
              style={{ 
                bottom: '20%', 
                left: '50%', 
                transform: 'translate(-50%, 50%)',
                zIndex: 10
              }}
            />
            <Handle
              type="target"
              position={Position.Bottom}
              id="bottom"
              className="w-4 h-4 rounded-full opacity-0"
              style={{ 
                bottom: '20%', 
                left: '50%', 
                transform: 'translate(-50%, 50%)',
                zIndex: 10
              }}
            />
            
            {/* Left - Can be both source and target */}
            <Handle
              type="source"
              position={Position.Left}
              id="left"
              className="w-4 h-4 rounded-full border-2 border-gray-400 bg-gray-700 hover:bg-blue-500 hover:scale-125 transition-all cursor-crosshair"
              style={{ 
                left: '15%', 
                top: '50%', 
                transform: 'translate(-50%, -50%)',
                zIndex: 10
              }}
            />
            <Handle
              type="target"
              position={Position.Left}
              id="left"
              className="w-4 h-4 rounded-full opacity-0"
              style={{ 
                left: '15%', 
                top: '50%', 
                transform: 'translate(-50%, -50%)',
                zIndex: 10
              }}
            />
          </>
          
          {/* Cloud SVG Shape */}
          <svg
            className="absolute inset-0"
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            style={{ pointerEvents: 'none' }}
          >
            <path
              d={cloudPath}
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </svg>
          
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
                borderRadius: '20px'
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

export default memo(CloudNode);