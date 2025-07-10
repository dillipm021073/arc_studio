import { useState, useCallback, useEffect } from 'react';

interface ResizeHandlesProps {
  width: number;
  height: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  onResize: (width: number, height: number) => void;
  visible: boolean;
  maintainAspectRatio?: boolean;
}

type HandlePosition = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';

export default function ResizeHandles({
  width,
  height,
  minWidth = 30,
  minHeight = 30,
  maxWidth = 500,
  maxHeight = 500,
  onResize,
  visible,
  maintainAspectRatio = false,
}: ResizeHandlesProps) {
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<HandlePosition | null>(null);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [startSize, setStartSize] = useState({ width: 0, height: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent, handle: HandlePosition) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeHandle(handle);
    setStartPos({ x: e.clientX, y: e.clientY });
    setStartSize({ width, height });
  }, [width, height]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !resizeHandle) return;

    const deltaX = e.clientX - startPos.x;
    const deltaY = e.clientY - startPos.y;
    
    let newWidth = startSize.width;
    let newHeight = startSize.height;

    // Calculate new dimensions based on handle position
    switch (resizeHandle) {
      case 'n':
        newHeight = Math.max(minHeight, Math.min(maxHeight, startSize.height - deltaY));
        break;
      case 'ne':
        newWidth = Math.max(minWidth, Math.min(maxWidth, startSize.width + deltaX));
        newHeight = Math.max(minHeight, Math.min(maxHeight, startSize.height - deltaY));
        break;
      case 'e':
        newWidth = Math.max(minWidth, Math.min(maxWidth, startSize.width + deltaX));
        break;
      case 'se':
        newWidth = Math.max(minWidth, Math.min(maxWidth, startSize.width + deltaX));
        newHeight = Math.max(minHeight, Math.min(maxHeight, startSize.height + deltaY));
        break;
      case 's':
        newHeight = Math.max(minHeight, Math.min(maxHeight, startSize.height + deltaY));
        break;
      case 'sw':
        newWidth = Math.max(minWidth, Math.min(maxWidth, startSize.width - deltaX));
        newHeight = Math.max(minHeight, Math.min(maxHeight, startSize.height + deltaY));
        break;
      case 'w':
        newWidth = Math.max(minWidth, Math.min(maxWidth, startSize.width - deltaX));
        break;
      case 'nw':
        newWidth = Math.max(minWidth, Math.min(maxWidth, startSize.width - deltaX));
        newHeight = Math.max(minHeight, Math.min(maxHeight, startSize.height - deltaY));
        break;
    }

    // Maintain aspect ratio if required
    if (maintainAspectRatio && (resizeHandle === 'ne' || resizeHandle === 'se' || resizeHandle === 'sw' || resizeHandle === 'nw')) {
      const aspectRatio = startSize.width / startSize.height;
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        newHeight = newWidth / aspectRatio;
      } else {
        newWidth = newHeight * aspectRatio;
      }
    }

    onResize(newWidth, newHeight);
  }, [isResizing, resizeHandle, startPos, startSize, minWidth, minHeight, maxWidth, maxHeight, maintainAspectRatio, onResize]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    setResizeHandle(null);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = getCursor(resizeHandle);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = 'default';
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp, resizeHandle]);

  const getCursor = (handle: HandlePosition | null): string => {
    switch (handle) {
      case 'n':
      case 's':
        return 'ns-resize';
      case 'e':
      case 'w':
        return 'ew-resize';
      case 'ne':
      case 'sw':
        return 'nesw-resize';
      case 'nw':
      case 'se':
        return 'nwse-resize';
      default:
        return 'default';
    }
  };

  if (!visible) return null;

  const handleSize = 8;
  const handleStyle = {
    position: 'absolute' as const,
    width: `${handleSize}px`,
    height: `${handleSize}px`,
    background: '#3b82f6',
    border: '1px solid #ffffff',
    borderRadius: '2px',
    cursor: 'pointer',
    zIndex: 10,
  };

  const handles: { position: HandlePosition; style: React.CSSProperties }[] = [
    {
      position: 'n',
      style: {
        ...handleStyle,
        top: `-${handleSize / 2}px`,
        left: `${width / 2 - handleSize / 2}px`,
        cursor: 'ns-resize',
      },
    },
    {
      position: 'ne',
      style: {
        ...handleStyle,
        top: `-${handleSize / 2}px`,
        right: `-${handleSize / 2}px`,
        cursor: 'nesw-resize',
      },
    },
    {
      position: 'e',
      style: {
        ...handleStyle,
        top: `${height / 2 - handleSize / 2}px`,
        right: `-${handleSize / 2}px`,
        cursor: 'ew-resize',
      },
    },
    {
      position: 'se',
      style: {
        ...handleStyle,
        bottom: `-${handleSize / 2}px`,
        right: `-${handleSize / 2}px`,
        cursor: 'nwse-resize',
      },
    },
    {
      position: 's',
      style: {
        ...handleStyle,
        bottom: `-${handleSize / 2}px`,
        left: `${width / 2 - handleSize / 2}px`,
        cursor: 'ns-resize',
      },
    },
    {
      position: 'sw',
      style: {
        ...handleStyle,
        bottom: `-${handleSize / 2}px`,
        left: `-${handleSize / 2}px`,
        cursor: 'nesw-resize',
      },
    },
    {
      position: 'w',
      style: {
        ...handleStyle,
        top: `${height / 2 - handleSize / 2}px`,
        left: `-${handleSize / 2}px`,
        cursor: 'ew-resize',
      },
    },
    {
      position: 'nw',
      style: {
        ...handleStyle,
        top: `-${handleSize / 2}px`,
        left: `-${handleSize / 2}px`,
        cursor: 'nwse-resize',
      },
    },
  ];

  return (
    <>
      {/* Selection outline */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: `${width}px`,
          height: `${height}px`,
          border: '1px dashed #3b82f6',
          pointerEvents: 'none',
        }}
      />
      
      {/* Resize handles */}
      {handles.map(({ position, style }) => (
        <div
          key={position}
          style={style}
          onMouseDown={(e) => handleMouseDown(e, position)}
        />
      ))}
    </>
  );
}