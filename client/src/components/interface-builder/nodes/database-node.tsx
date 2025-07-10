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

export interface DatabaseNodeData {
  label: string;
  type: string;
  width: number;
  height: number;
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  line1?: string;
  line2?: string;
  fontSize?: number;
  textColor?: string;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onUpdate?: (data: any) => void;
  connectionPoints?: {
    input?: Array<{ id: string; type: string; position: string }>;
    output?: Array<{ id: string; type: string; position: string }>;
  };
}

function DatabaseNode({ data, selected }: NodeProps<DatabaseNodeData>) {
  const [isEditingLine1, setIsEditingLine1] = useState(false);
  const [isEditingLine2, setIsEditingLine2] = useState(false);
  const [editingLine1, setEditingLine1] = useState(data.line1 || '');
  const [editingLine2, setEditingLine2] = useState(data.line2 || '');
  const [savedLine1, setSavedLine1] = useState(data.line1 || '');
  const [savedLine2, setSavedLine2] = useState(data.line2 || '');
  const inputRef1 = useRef<HTMLInputElement>(null);
  const inputRef2 = useRef<HTMLInputElement>(null);
  
  const width = data.width || 120;
  const height = data.height || 80;
  const fillColor = data.fillColor || '#2d3748';
  const strokeColor = data.strokeColor || '#ffffff';
  const strokeWidth = data.strokeWidth || 2;
  const fontSize = data.fontSize || 12;
  const textColor = data.textColor || '#ffffff';

  // Focus input when editing starts
  useEffect(() => {
    if (isEditingLine1 && inputRef1.current) {
      inputRef1.current.focus();
      inputRef1.current.select();
    }
  }, [isEditingLine1]);

  useEffect(() => {
    if (isEditingLine2 && inputRef2.current) {
      inputRef2.current.focus();
      inputRef2.current.select();
    }
  }, [isEditingLine2]);

  const handleLine1Submit = () => {
    setSavedLine1(editingLine1);
    const updatedData = { ...data, line1: editingLine1 };
    if (data.onUpdate) {
      data.onUpdate(updatedData);
    }
    setIsEditingLine1(false);
  };

  const handleLine2Submit = () => {
    setSavedLine2(editingLine2);
    const updatedData = { ...data, line2: editingLine2 };
    if (data.onUpdate) {
      data.onUpdate(updatedData);
    }
    setIsEditingLine2(false);
  };

  // Always show connection points for database nodes
  const showConnectionPoints = true;

  // Calculate cylinder dimensions
  const cylinderTop = height * 0.2; // Height of the cylinder top ellipse
  const cylinderBody = height * 0.8; // Height of the cylinder body

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
          {/* Connection Points - 4 handles, one on each side */}
          {showConnectionPoints && (
            <>
              {/* Top - Can be both source and target */}
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
              
              {/* Right - Can be both source and target */}
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
              
              {/* Bottom - Can be both source and target */}
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
              
              {/* Left - Can be both source and target */}
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
          
          {/* Database cylinder shape using SVG */}
          <svg
            width={width}
            height={height}
            className="absolute inset-0"
            style={{ overflow: 'visible' }}
          >
            {/* Cylinder top (ellipse) */}
            <ellipse
              cx={width / 2}
              cy={cylinderTop / 2}
              rx={(width / 2) - strokeWidth}
              ry={cylinderTop / 2 - strokeWidth}
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            
            {/* Cylinder body */}
            <path
              d={`
                M ${strokeWidth} ${cylinderTop / 2}
                L ${strokeWidth} ${height - cylinderTop / 2}
                A ${(width / 2) - strokeWidth} ${cylinderTop / 2 - strokeWidth} 0 0 0 ${width - strokeWidth} ${height - cylinderTop / 2}
                L ${width - strokeWidth} ${cylinderTop / 2}
              `}
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
            />
            
            {/* Bottom ellipse arc (visible part) */}
            <path
              d={`
                M ${strokeWidth} ${height - cylinderTop / 2}
                A ${(width / 2) - strokeWidth} ${cylinderTop / 2 - strokeWidth} 0 0 0 ${width - strokeWidth} ${height - cylinderTop / 2}
              `}
              fill="none"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
          </svg>

          {/* Text content - two lines */}
          <div 
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{
              padding: '8px',
              pointerEvents: 'none'
            }}
          >
            {/* Line 1 */}
            {!isEditingLine1 ? (
              <div
                onClick={() => setIsEditingLine1(true)}
                style={{
                  color: textColor,
                  fontSize: `${fontSize}px`,
                  fontFamily: 'monospace',
                  textAlign: 'center',
                  cursor: 'text',
                  pointerEvents: 'auto',
                  padding: '2px 4px',
                  borderRadius: '2px',
                  minHeight: `${fontSize + 4}px`,
                  width: '90%',
                }}
                className="hover:bg-white hover:bg-opacity-10"
              >
                {savedLine1 || 'Table Name'}
              </div>
            ) : (
              <input
                ref={inputRef1}
                value={editingLine1}
                onChange={(e) => setEditingLine1(e.target.value)}
                onBlur={handleLine1Submit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleLine1Submit();
                  } else if (e.key === 'Escape') {
                    e.preventDefault();
                    setEditingLine1(savedLine1);
                    setIsEditingLine1(false);
                  }
                  e.stopPropagation();
                }}
                className="bg-transparent border border-blue-400 outline-none text-center"
                style={{
                  color: textColor,
                  fontSize: `${fontSize}px`,
                  fontFamily: 'monospace',
                  width: '90%',
                  padding: '2px 4px',
                  pointerEvents: 'auto',
                }}
                placeholder="Table Name"
              />
            )}

            {/* Line 2 */}
            {!isEditingLine2 ? (
              <div
                onClick={() => setIsEditingLine2(true)}
                style={{
                  color: textColor,
                  fontSize: `${fontSize - 2}px`,
                  fontFamily: 'monospace',
                  textAlign: 'center',
                  cursor: 'text',
                  pointerEvents: 'auto',
                  padding: '2px 4px',
                  borderRadius: '2px',
                  minHeight: `${fontSize + 2}px`,
                  width: '90%',
                  opacity: 0.8,
                }}
                className="hover:bg-white hover:bg-opacity-10"
              >
                {savedLine2 || 'Schema'}
              </div>
            ) : (
              <input
                ref={inputRef2}
                value={editingLine2}
                onChange={(e) => setEditingLine2(e.target.value)}
                onBlur={handleLine2Submit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleLine2Submit();
                  } else if (e.key === 'Escape') {
                    e.preventDefault();
                    setEditingLine2(savedLine2);
                    setIsEditingLine2(false);
                  }
                  e.stopPropagation();
                }}
                className="bg-transparent border border-blue-400 outline-none text-center"
                style={{
                  color: textColor,
                  fontSize: `${fontSize - 2}px`,
                  fontFamily: 'monospace',
                  width: '90%',
                  padding: '2px 4px',
                  pointerEvents: 'auto',
                  opacity: 0.8,
                }}
                placeholder="Schema"
              />
            )}
          </div>

          {/* Selection indicator */}
          {selected && (
            <div 
              className="absolute inset-0 border-2 border-blue-500 pointer-events-none"
              style={{
                borderRadius: '8px'
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

export default memo(DatabaseNode);