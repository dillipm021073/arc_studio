import { Handle, Position } from 'reactflow';

interface EmptyProcessNodeProps {
  data: {
    processName: string;
    processLevel: string;
    description?: string;
    lob?: string;
    product?: string;
  };
}

export default function EmptyProcessNode({ data }: EmptyProcessNodeProps) {
  return (
    <div className="bg-white border-2 border-gray-300 rounded-lg p-4 min-w-[300px] shadow-sm">
      <Handle type="target" position={Position.Top} className="opacity-0" />
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm text-gray-800">
            {data.processName}
          </h3>
          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
            Level {data.processLevel}
          </span>
        </div>
        
        {data.description && (
          <p className="text-xs text-gray-600 italic">
            {data.description}
          </p>
        )}
        
        <div className="flex gap-4 text-xs text-gray-500">
          {data.lob && (
            <div>
              <span className="font-medium">LOB:</span> {data.lob}
            </div>
          )}
          {data.product && (
            <div>
              <span className="font-medium">Product:</span> {data.product}
            </div>
          )}
        </div>
        
        <div className="text-xs text-gray-400 text-center mt-3 pt-3 border-t border-gray-200">
          No interfaces or activities defined
        </div>
      </div>
      
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
}