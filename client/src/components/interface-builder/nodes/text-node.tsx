import { memo, useState } from "react";
import { Handle, Position, NodeProps, NodeResizer } from "reactflow";
import { Type, Edit2, Copy, Trash2, Maximize2, ZoomIn, ZoomOut } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import TextEditorDialog from "../text-editor-dialog";
import { ResizeControls } from './ResizeControls';
import { useNodeResize } from './useNodeResize';

export interface TextNodeData {
  label: string;
  type: string;
  text: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  fontStyle: string;
  textDecoration: string;
  textAlign: string;
  color: string;
  backgroundColor: string;
  borderRadius: number;
  padding: number;
  width: number;
  height: number;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onToggleResize?: () => void;
  onUpdate?: (data: Partial<TextNodeData>) => void;
  isResizing?: boolean;
}

function TextNode({ data, selected }: NodeProps<TextNodeData>) {
  const [isEditing, setIsEditing] = useState(false);

  const { dimensions, handleResize, enlargeNode, shrinkNode, resetSize } = useNodeResize({
    initialWidth: 200,
    initialHeight: 100,
    minWidth: 50,
    minHeight: 30,
    maxWidth: 800,
    maxHeight: 600,
    onUpdate: data.onUpdate,
    nodeData: data
  });

  const handleSave = (updatedData: Omit<TextNodeData, 'label' | 'type' | 'onDelete' | 'onDuplicate' | 'onToggleResize' | 'onUpdate' | 'isResizing'>) => {
    // Update the node data through the parent
    if (data.onUpdate) {
      data.onUpdate(updatedData);
    }
    setIsEditing(false);
  };

  const nodeStyle = {
    width: `${dimensions.width}px`,
    height: `${dimensions.height}px`,
    backgroundColor: data.backgroundColor || '#ffffff',
    color: data.color || '#000000',
    borderRadius: `${data.borderRadius || 4}px`,
    padding: `${data.padding || 16}px`,
    fontFamily: data.fontFamily || 'sans-serif',
    fontSize: `${data.fontSize || 16}px`,
    fontWeight: data.fontWeight || 'normal',
    fontStyle: data.fontStyle || 'normal',
    textDecoration: data.textDecoration || 'none',
    textAlign: (data.textAlign || 'left') as any,
  };

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            className={`relative group transition-all duration-200 cursor-move ${
              selected ? 'ring-2 ring-blue-500' : ''
            }`}
            style={{
              ...nodeStyle,
              overflow: 'hidden',
              userSelect: 'none', // Prevent text selection during drag
            }}
            onDoubleClick={() => setIsEditing(true)}
          >
            {/* Node Resizer */}
            {selected && (
              <NodeResizer
                color="#3b82f6"
                isVisible={selected}
                minWidth={50}
                minHeight={30}
                maxWidth={800}
                maxHeight={600}
                onResize={handleResize}
              />
            )}

            {/* Resize Controls */}
            <ResizeControls
              onEnlarge={enlargeNode}
              onShrink={shrinkNode}
              visible={selected}
            />
            {/* Simple display of text */}
            <div 
              className="w-full h-full overflow-auto whitespace-pre-wrap break-words"
              style={{
                padding: dimensions.width < 100 ? '4px' : '8px',
                fontSize: dimensions.width < 100 || dimensions.height < 50 ? `${Math.max(10, data.fontSize * 0.7)}px` : `${data.fontSize}px`,
                pointerEvents: 'none', // Allow drag events to pass through to parent
              }}
            >
              {data.text || 'Double-click to edit'}
            </div>

            {/* Edit hint on hover */}
            {!isEditing && (
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                <div className="bg-gray-800 text-white px-3 py-1 rounded-md text-sm flex items-center gap-2">
                  <Edit2 className="h-3 w-3" />
                  Double-click to edit
                </div>
              </div>
            )}


            {/* Node handles - hidden for text nodes */}
            <Handle
              type="target"
              position={Position.Top}
              className="opacity-0 pointer-events-none"
            />
            <Handle
              type="source"
              position={Position.Bottom}
              className="opacity-0 pointer-events-none"
            />
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="bg-gray-800 border-gray-700">
          <ContextMenuItem
            onClick={() => setIsEditing(true)}
            className="text-gray-300 hover:text-white hover:bg-gray-700"
          >
            <Edit2 className="mr-2 h-4 w-4" />
            Edit Text
          </ContextMenuItem>
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

      {/* Text Editor Dialog */}
      <TextEditorDialog
        open={isEditing}
        onClose={() => setIsEditing(false)}
        initialData={{
          text: data.text || '',
          fontSize: data.fontSize || 16,
          fontFamily: data.fontFamily || 'sans-serif',
          fontWeight: data.fontWeight || 'normal',
          fontStyle: data.fontStyle || 'normal',
          textDecoration: data.textDecoration || 'none',
          textAlign: data.textAlign || 'left',
          color: data.color || '#000000',
          backgroundColor: data.backgroundColor || '#ffffff',
          borderRadius: data.borderRadius || 4,
          padding: data.padding || 16,
          width: dimensions.width,
          height: dimensions.height,
        }}
        onSave={handleSave}
      />
    </>
  );
}

export default memo(TextNode);