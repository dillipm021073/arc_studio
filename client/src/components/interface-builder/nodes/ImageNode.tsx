import React, { memo, useEffect, useState } from 'react';
import { Handle, Position, NodeProps, NodeResizer } from 'reactflow';
import { Maximize2, Minimize2, ZoomIn, ZoomOut } from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { ResizeControls } from './ResizeControls';
import { useNodeResize } from './useNodeResize';

interface ImageNodeData {
  label: string;
  imageUrl?: string;
  alt?: string;
  opacity?: number;
  borderStyle?: string;
  borderWidth?: number;
  borderColor?: string;
  maintainAspectRatio?: boolean;
  width?: number;
  height?: number;
  onUpdate?: (data: any) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
}

export const ImageNode = memo(({ data, selected, id }: NodeProps<ImageNodeData>) => {
  const {
    label,
    imageUrl,
    alt = 'Image',
    opacity = 1,
    borderStyle = 'solid',
    borderWidth = 0,
    borderColor = '#000000',
    maintainAspectRatio = true,
  } = data;

  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const { dimensions, handleResize, enlargeNode, shrinkNode, resetSize } = useNodeResize({
    initialWidth: 200,
    initialHeight: 150,
    minWidth: 100,
    minHeight: 75,
    maxWidth: 1200,
    maxHeight: 900,
    onUpdate: data.onUpdate,
    nodeData: data
  });
  
  const width = isFullscreen ? window.innerWidth * 0.8 : dimensions.width;
  const height = isFullscreen ? window.innerHeight * 0.8 : dimensions.height;

  // Wrap resize functions to check fullscreen
  const handleResizeWithCheck = (event: any, params: any) => {
    if (!isFullscreen) {
      handleResize(event, params);
    }
  };

  const enlargeImage = () => {
    if (!isFullscreen) {
      enlargeNode();
    }
  };

  const shrinkImage = () => {
    if (!isFullscreen) {
      shrinkNode();
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleImageUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (data.onUpdate) {
            data.onUpdate({
              ...data,
              imageUrl: event.target?.result as string,
              label: file.name
            });
          }
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const handlePaste = async (e: ClipboardEvent) => {
    // Only handle paste if this node is selected
    if (!selected) return;

    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault();
        const blob = item.getAsFile();
        
        if (blob) {
          const reader = new FileReader();
          reader.onload = (event) => {
            if (data.onUpdate) {
              data.onUpdate({
                ...data,
                imageUrl: event.target?.result as string,
                label: `Pasted Image ${new Date().toLocaleTimeString()}`
              });
            }
          };
          reader.readAsDataURL(blob);
        }
        break;
      }
    }
  };

  // Add paste event listener when node is selected
  useEffect(() => {
    if (selected) {
      document.addEventListener('paste', handlePaste);
      return () => {
        document.removeEventListener('paste', handlePaste);
      };
    }
  }, [selected, data.onUpdate]);

  // Add keyboard shortcuts for fullscreen
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (selected && e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    
    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [selected, isFullscreen]);

  return (
    <>
      {/* Fullscreen backdrop */}
      {isFullscreen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-80 z-40"
          onClick={() => setIsFullscreen(false)}
        />
      )}
      
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
          className={`bg-white rounded-lg shadow-md p-2 cursor-pointer relative group ${
            selected ? 'ring-2 ring-blue-500' : ''
          } ${isFullscreen ? 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50' : ''}`}
          style={{
            opacity,
            border: borderWidth > 0 ? `${borderWidth}px ${borderStyle} ${borderColor}` : 'none',
            width: `${width}px`,
            height: `${height}px`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onDoubleClick={handleImageUpload}
        >
          {/* Node Resizer */}
          {selected && !isFullscreen && (
            <NodeResizer
              color="#a855f7"
              isVisible={selected}
              minWidth={100}
              minHeight={75}
              maxWidth={1200}
              maxHeight={900}
              onResize={handleResizeWithCheck}
              keepAspectRatio={maintainAspectRatio}
            />
          )}

          {/* Resize controls overlay */}
          {selected && imageUrl && !isFullscreen && (
            <ResizeControls
              onEnlarge={enlargeImage}
              onShrink={shrinkImage}
              visible={true}
            />
          )}
          
          {/* Fullscreen button */}
          {selected && imageUrl && (
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFullscreen();
                }}
                className="p-1 bg-gray-800 text-white rounded hover:bg-gray-700"
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                style={{ marginLeft: isFullscreen ? 0 : '68px' }}
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>
            </div>
          )}

          <Handle type="target" position={Position.Top} className="w-3 h-3" />
          
          {imageUrl ? (
        <img
          src={imageUrl}
          alt={alt}
          style={{
            maxWidth: '100%',
            maxHeight: maintainAspectRatio ? '100%' : undefined,
            width: maintainAspectRatio ? 'auto' : '100%',
            height: maintainAspectRatio ? 'auto' : '100%',
            objectFit: maintainAspectRatio ? 'contain' : 'fill'
          }}
        />
      ) : (
        <div className="flex flex-col items-center justify-center text-gray-400 text-center">
          <svg
            className="w-12 h-12 mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span className="text-sm font-medium">Double-click to upload</span>
          <span className="text-xs mt-1">or select & paste (Ctrl+V)</span>
        </div>
      )}
      
      {label && (
        <div className="mt-2 text-sm font-medium text-gray-700">{label}</div>
      )}
      
          <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="bg-gray-800 border-gray-700">
        <ContextMenuItem
          onClick={() => {
            enlargeImage();
          }}
          className="text-gray-300 hover:text-white hover:bg-gray-700"
        >
          <ZoomIn className="mr-2 h-4 w-4" />
          Enlarge (20%)
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() => {
            shrinkImage();
          }}
          className="text-gray-300 hover:text-white hover:bg-gray-700"
        >
          <ZoomOut className="mr-2 h-4 w-4" />
          Shrink (20%)
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() => {
            toggleFullscreen();
          }}
          className="text-gray-300 hover:text-white hover:bg-gray-700"
        >
          {isFullscreen ? (
            <>
              <Minimize2 className="mr-2 h-4 w-4" />
              Exit Fullscreen
            </>
          ) : (
            <>
              <Maximize2 className="mr-2 h-4 w-4" />
              Fullscreen
            </>
          )}
        </ContextMenuItem>
        <ContextMenuSeparator className="bg-gray-700" />
        <ContextMenuItem
          onClick={resetSize}
          className="text-gray-300 hover:text-white hover:bg-gray-700"
        >
          Reset Size
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
    </>
  );
});

ImageNode.displayName = 'ImageNode';