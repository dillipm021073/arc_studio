import { memo } from 'react';

interface ResizeHandlesProps {
  nodeId: string;
  isResizeMode: boolean;
  bounds: { width: number; height: number };
  onResize: (nodeId: string, width: number, height: number) => void;
}

export default memo(function ResizeHandles({ 
  nodeId, 
  isResizeMode, 
  bounds, 
  onResize 
}: ResizeHandlesProps) {
  if (!isResizeMode) return null;

  const handleMouseDown = (corner: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = bounds.width;
    const startHeight = bounds.height;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      let newWidth = startWidth;
      let newHeight = startHeight;

      switch (corner) {
        case 'se': // bottom-right
          newWidth = Math.max(50, startWidth + deltaX);
          newHeight = Math.max(30, startHeight + deltaY);
          break;
        case 'sw': // bottom-left
          newWidth = Math.max(50, startWidth - deltaX);
          newHeight = Math.max(30, startHeight + deltaY);
          break;
        case 'ne': // top-right
          newWidth = Math.max(50, startWidth + deltaX);
          newHeight = Math.max(30, startHeight - deltaY);
          break;
        case 'nw': // top-left
          newWidth = Math.max(50, startWidth - deltaX);
          newHeight = Math.max(30, startHeight - deltaY);
          break;
        case 'e': // right
          newWidth = Math.max(50, startWidth + deltaX);
          break;
        case 'w': // left
          newWidth = Math.max(50, startWidth - deltaX);
          break;
        case 's': // bottom
          newHeight = Math.max(30, startHeight + deltaY);
          break;
        case 'n': // top
          newHeight = Math.max(30, startHeight - deltaY);
          break;
      }

      onResize(nodeId, newWidth, newHeight);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleStyle = "absolute w-3 h-3 bg-orange-500 border-2 border-orange-300 rounded-sm cursor-pointer hover:bg-orange-400 z-10";

  return (
    <>
      {/* Corner handles */}
      <div 
        className={`${handleStyle} -top-1.5 -left-1.5 cursor-nw-resize`}
        onMouseDown={handleMouseDown('nw')}
      />
      <div 
        className={`${handleStyle} -top-1.5 -right-1.5 cursor-ne-resize`}
        onMouseDown={handleMouseDown('ne')}
      />
      <div 
        className={`${handleStyle} -bottom-1.5 -left-1.5 cursor-sw-resize`}
        onMouseDown={handleMouseDown('sw')}
      />
      <div 
        className={`${handleStyle} -bottom-1.5 -right-1.5 cursor-se-resize`}
        onMouseDown={handleMouseDown('se')}
      />

      {/* Edge handles */}
      <div 
        className={`${handleStyle} -top-1.5 left-1/2 transform -translate-x-1/2 cursor-n-resize`}
        onMouseDown={handleMouseDown('n')}
      />
      <div 
        className={`${handleStyle} -bottom-1.5 left-1/2 transform -translate-x-1/2 cursor-s-resize`}
        onMouseDown={handleMouseDown('s')}
      />
      <div 
        className={`${handleStyle} -left-1.5 top-1/2 transform -translate-y-1/2 cursor-w-resize`}
        onMouseDown={handleMouseDown('w')}
      />
      <div 
        className={`${handleStyle} -right-1.5 top-1/2 transform -translate-y-1/2 cursor-e-resize`}
        onMouseDown={handleMouseDown('e')}
      />

      {/* Mode indicator */}
      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-orange-800 text-orange-200 px-2 py-1 rounded text-xs whitespace-nowrap">
        Resize Mode - Drag handles
      </div>
    </>
  );
});