import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

interface N8nNodeData {
  label: string;
  icon?: string;
  color?: string;
  subLabel?: string;
}

export default memo(function N8nStyleNode({ 
  data, 
  selected 
}: NodeProps<N8nNodeData>) {
  return (
    <div
      style={{
        background: '#404040',
        border: `2px solid ${selected ? '#ff6d5a' : '#303030'}`,
        borderRadius: '15px',
        minWidth: '180px',
        boxShadow: selected ? '0 0 0 2px #ff6d5a40' : '0 2px 5px rgba(0,0,0,0.3)',
        transition: 'all 0.2s',
        cursor: 'pointer',
      }}
    >
      {/* Left Handle */}
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: '#303030',
          width: '14px',
          height: '14px',
          border: '2px solid #303030',
          borderRadius: '50%',
          left: '-8px',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#ff6d5a';
          e.currentTarget.style.borderColor = '#ff6d5a';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#303030';
          e.currentTarget.style.borderColor = '#303030';
        }}
      />
      
      {/* Content */}
      <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        {data.icon && (
          <div style={{
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
          }}>
            {data.icon}
          </div>
        )}
        <div>
          <div style={{
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: '500',
            lineHeight: '1.2',
          }}>
            {data.label}
          </div>
          {data.subLabel && (
            <div style={{
              color: '#909090',
              fontSize: '12px',
              marginTop: '2px',
            }}>
              {data.subLabel}
            </div>
          )}
        </div>
      </div>
      
      {/* Right Handle */}
      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: '#303030',
          width: '14px',
          height: '14px',
          border: '2px solid #303030',
          borderRadius: '50%',
          right: '-8px',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#ff6d5a';
          e.currentTarget.style.borderColor = '#ff6d5a';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#303030';
          e.currentTarget.style.borderColor = '#303030';
        }}
      />
    </div>
  );
});