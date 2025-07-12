import { memo } from 'react';
import { NodeProps, Handle, Position } from 'reactflow';

interface SvgBackgroundNodeData {
  svg: string;
  width?: number;
  height?: number;
  label?: string;
}

const SvgBackgroundNode = memo(({ data }: NodeProps<SvgBackgroundNodeData>) => {
  const { svg, width = 800, height = 600, label } = data;

  return (
    <>
      {/* Invisible handles for connections */}
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
      
      {/* SVG content directly without any container */}
      <div 
        style={{ 
          width: `${width}px`, 
          height: `${height}px`,
          position: 'relative'
        }}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      
      {/* Optional label */}
      {label && (
        <div 
          style={{
            position: 'absolute',
            bottom: -25,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            whiteSpace: 'nowrap'
          }}
        >
          {label}
        </div>
      )}
    </>
  );
});

SvgBackgroundNode.displayName = 'SvgBackgroundNode';

export default SvgBackgroundNode;