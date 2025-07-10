import { Handle, Position, NodeProps, NodeResizer } from 'reactflow';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Layers, Maximize2 } from 'lucide-react';

export interface ProcessGroupNodeData {
  businessProcess: any;
  childInterfaces: any[];
  parentProcesses?: any[];
}

export default function ProcessGroupNode({ data, selected, id }: NodeProps<ProcessGroupNodeData>) {
  const { businessProcess, childInterfaces = [], parentProcesses = [] } = data;

  // Handle case where businessProcess is not provided
  if (!businessProcess) {
    return null;
  }

  return (
    <div 
      className="relative p-3 rounded-lg drag-handle"
      onDoubleClick={(e) => {
        e.stopPropagation();
        // Trigger the double-click handler on the node itself
        // React Flow will handle this through onNodeDoubleClick
      }}
      style={{
        border: selected 
          ? '2px dashed rgba(59, 130, 246, 0.8)' 
          : '2px dashed rgba(59, 130, 246, 0.4)',
        backgroundColor: selected 
          ? 'rgba(30, 41, 59, 0.25)' 
          : 'rgba(30, 41, 59, 0.15)',
        minWidth: '300px',
        minHeight: '200px',
        backdropFilter: 'blur(1px)',
        zIndex: -5, // Process boxes should be in background
        width: '100%',
        height: '100%'
      }}
    >
      {/* Node Resizer - only visible when selected */}
      {selected && (
        <NodeResizer
          color="rgba(59, 130, 246, 0.8)"
          isVisible={selected}
          minWidth={250}
          minHeight={150}
          handleStyle={{
            width: '8px',
            height: '8px',
            backgroundColor: 'rgba(59, 130, 246, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.8)',
            borderRadius: '2px'
          }}
        />
      )}
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      
      {/* Header - positioned at top */}
      <div 
        className="absolute top-2 left-2 right-2 flex items-center justify-between p-2 rounded bg-slate-800/80 border border-blue-500/50"
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-blue-400" />
          <span className="text-sm font-medium text-white">{businessProcess?.businessProcess || 'Process'}</span>
          {selected && <Maximize2 className="h-3 w-3 text-blue-400 ml-1" title="Resizable" />}
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-blue-600 text-white text-xs">Level {businessProcess?.level || 'A'}</Badge>
          {selected && (
            <Badge className="bg-green-600 text-white text-xs">
              Resizable
            </Badge>
          )}
        </div>
      </div>

      {/* Process Info - positioned at bottom */}
      <div 
        className="absolute bottom-2 left-2 text-xs text-gray-300 bg-slate-800/80 p-2 rounded border border-blue-500/30"
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        <p><span className="text-blue-400">LOB:</span> {businessProcess?.lob || 'N/A'}</p>
        <p><span className="text-blue-400">Product:</span> {businessProcess?.product || 'N/A'}</p>
        <p><span className="text-blue-400">Interfaces:</span> {childInterfaces.length}</p>
        {parentProcesses.length > 0 && (
          <p className="mt-1 text-blue-400">
            Shared by: {parentProcesses.map(p => p.businessProcess).join(', ')}
          </p>
        )}
      </div>

      {/* Interface area indicator */}
      <div className="absolute inset-0 top-12 bottom-16 border border-dashed border-blue-400/20 rounded m-2 bg-blue-500/3" style={{ pointerEvents: 'none' }}>
        <div className="absolute top-2 left-2 text-xs text-blue-400/50 font-medium">
          Process Interfaces
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </div>
  );
}