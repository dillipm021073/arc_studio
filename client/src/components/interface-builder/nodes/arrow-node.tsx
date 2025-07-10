import { memo, useState, useEffect, useRef } from "react";
import { Handle, Position, NodeProps } from "reactflow";

interface ArrowNodeData {
  width?: number;
  height?: number;
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  text?: string;
  fontSize?: number;
  textColor?: string;
  arrowDirection?: 'right' | 'left' | 'up' | 'down';
  arrowStyle?: 'single' | 'double';
  headSize?: number;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onUpdate?: (data: any) => void;
}

function ArrowNode({ data, selected }: NodeProps<ArrowNodeData>) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(data.text || '');
  const inputRef = useRef<HTMLInputElement>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  const width = data.width || 150;
  const height = data.height || 60;
  const fillColor = data.fillColor || '#4a5568';
  const strokeColor = data.strokeColor || '#ffffff';
  const strokeWidth = data.strokeWidth || 2;
  const fontSize = data.fontSize || 14;
  const textColor = data.textColor || '#ffffff';
  const arrowDirection = data.arrowDirection || 'right';
  const arrowStyle = data.arrowStyle || 'single';
  const headSize = data.headSize || 20;

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setText(data.text || '');
  }, [data.text]);

  const handleDoubleClick = () => {
    if (selected) {
      setIsEditing(true);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
  };

  const handleTextBlur = () => {
    setIsEditing(false);
    if (data.onUpdate) {
      data.onUpdate({ ...data, text });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTextBlur();
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  const handleDelete = () => {
    if (data.onDelete) {
      data.onDelete();
    }
    closeContextMenu();
  };

  const handleDuplicate = () => {
    if (data.onDuplicate) {
      data.onDuplicate();
    }
    closeContextMenu();
  };

  // Calculate arrow path based on direction
  const getArrowPath = () => {
    const bodyWidth = width - headSize;
    const bodyHeight = height * 0.6;
    const bodyOffset = (height - bodyHeight) / 2;

    switch (arrowDirection) {
      case 'right':
        return `
          M 0 ${bodyOffset}
          L ${bodyWidth} ${bodyOffset}
          L ${bodyWidth} 0
          L ${width} ${height / 2}
          L ${bodyWidth} ${height}
          L ${bodyWidth} ${height - bodyOffset}
          L 0 ${height - bodyOffset}
          Z
        `;
      case 'left':
        return `
          M ${headSize} 0
          L ${headSize} ${bodyOffset}
          L ${width} ${bodyOffset}
          L ${width} ${height - bodyOffset}
          L ${headSize} ${height - bodyOffset}
          L ${headSize} ${height}
          L 0 ${height / 2}
          Z
        `;
      case 'down':
        return `
          M ${bodyOffset} 0
          L ${bodyOffset} ${height - headSize}
          L 0 ${height - headSize}
          L ${width / 2} ${height}
          L ${width} ${height - headSize}
          L ${width - bodyOffset} ${height - headSize}
          L ${width - bodyOffset} 0
          Z
        `;
      case 'up':
        return `
          M 0 ${headSize}
          L ${bodyOffset} ${headSize}
          L ${bodyOffset} ${height}
          L ${width - bodyOffset} ${height}
          L ${width - bodyOffset} ${headSize}
          L ${width} ${headSize}
          L ${width / 2} 0
          Z
        `;
      default:
        return '';
    }
  };

  // Get text position based on arrow direction
  const getTextPosition = () => {
    switch (arrowDirection) {
      case 'right':
      case 'left':
        return { x: width / 2, y: height / 2 };
      case 'up':
        return { x: width / 2, y: height / 2 + headSize / 4 };
      case 'down':
        return { x: width / 2, y: height / 2 - headSize / 4 };
      default:
        return { x: width / 2, y: height / 2 };
    }
  };

  const textPos = getTextPosition();

  return (
    <div
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
      style={{ position: 'relative' }}
    >
      <svg
        width={width}
        height={height}
        style={{ overflow: 'visible', cursor: 'pointer' }}
      >
        {/* Arrow shape */}
        <path
          d={getArrowPath()}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
        />

        {/* Double arrow head if needed */}
        {arrowStyle === 'double' && (
          <path
            d={getArrowPath()}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            transform={`translate(${arrowDirection === 'right' || arrowDirection === 'left' ? -headSize * 1.5 : 0}, ${arrowDirection === 'up' || arrowDirection === 'down' ? -headSize * 1.5 : 0})`}
            opacity={0.7}
          />
        )}

        {/* Text */}
        {!isEditing && (
          <text
            x={textPos.x}
            y={textPos.y}
            textAnchor="middle"
            alignmentBaseline="middle"
            fill={textColor}
            fontSize={fontSize}
            fontFamily="sans-serif"
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            {text}
          </text>
        )}
      </svg>

      {/* Text input for editing */}
      {isEditing && (
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={handleTextChange}
          onBlur={handleTextBlur}
          onKeyDown={handleKeyDown}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: `${width * 0.8}px`,
            textAlign: 'center',
            background: 'rgba(0, 0, 0, 0.8)',
            color: textColor,
            border: '1px solid #4a5568',
            borderRadius: '4px',
            padding: '4px',
            fontSize: `${fontSize}px`,
            fontFamily: 'sans-serif',
            outline: 'none',
          }}
          onClick={(e) => e.stopPropagation()}
        />
      )}

      {/* Connection handles */}
      <Handle
        type="source"
        position={Position.Top}
        style={{ background: '#555', border: '1px solid #fff' }}
      />
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: '#555', border: '1px solid #fff' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: '#555', border: '1px solid #fff' }}
      />
      <Handle
        type="target"
        position={Position.Right}
        style={{ background: '#555', border: '1px solid #fff' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: '#555', border: '1px solid #fff' }}
      />
      <Handle
        type="target"
        position={Position.Bottom}
        style={{ background: '#555', border: '1px solid #fff' }}
      />
      <Handle
        type="source"
        position={Position.Left}
        style={{ background: '#555', border: '1px solid #fff' }}
      />
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: '#555', border: '1px solid #fff' }}
      />

      {/* Context Menu */}
      {contextMenu && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999,
            }}
            onClick={closeContextMenu}
            onContextMenu={(e) => {
              e.preventDefault();
              closeContextMenu();
            }}
          />
          <div
            style={{
              position: 'fixed',
              top: contextMenu.y,
              left: contextMenu.x,
              background: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '4px',
              padding: '4px 0',
              zIndex: 1000,
              minWidth: '120px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
            }}
          >
            <button
              onClick={handleDuplicate}
              style={{
                display: 'block',
                width: '100%',
                padding: '8px 16px',
                background: 'none',
                border: 'none',
                color: '#fff',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '14px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#333';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none';
              }}
            >
              Duplicate
            </button>
            <button
              onClick={handleDelete}
              style={{
                display: 'block',
                width: '100%',
                padding: '8px 16px',
                background: 'none',
                border: 'none',
                color: '#ff6b6b',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '14px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#333';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none';
              }}
            >
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default memo(ArrowNode);