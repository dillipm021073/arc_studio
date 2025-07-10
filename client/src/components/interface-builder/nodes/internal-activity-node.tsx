import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle,
  XCircle,
  RefreshCw,
  Activity,
  GitBranch,
  Clock
} from 'lucide-react';

interface InternalActivityNodeData {
  id: string;
  activityName: string;
  activityType: string;
  applicationName?: string;
  description?: string;
  preCondition?: string;
  postCondition?: string;
  estimatedDurationMs?: number;
  color?: string;
}

export default memo(function InternalActivityNode({ 
  data, 
  selected 
}: NodeProps<InternalActivityNodeData>) {
  
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'check': return <CheckCircle className="h-5 w-5" />;
      case 'validate': return <XCircle className="h-5 w-5" />;
      case 'transform': return <RefreshCw className="h-5 w-5" />;
      case 'compute': return <Activity className="h-5 w-5" />;
      case 'decide': return <GitBranch className="h-5 w-5" />;
      default: return <Activity className="h-5 w-5" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'check': return 'bg-blue-600';
      case 'validate': return 'bg-purple-600';
      case 'transform': return 'bg-green-600';
      case 'compute': return 'bg-yellow-600';
      case 'decide': return 'bg-orange-600';
      default: return 'bg-gray-600';
    }
  };

  return (
    <div 
      className={`
        min-w-[200px] max-w-[300px] transition-all duration-200 relative
        ${selected ? 'ring-2 ring-orange-500 ring-opacity-75' : ''}
        bg-gray-800 border border-gray-600 hover:border-gray-500
        rounded-2xl shadow-lg
      `}
    >
      {/* Self-referential indicator (loop arrow) */}
      <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
        <svg width="40" height="20" viewBox="0 0 40 20" className="text-gray-500">
          <path
            d="M 10 15 Q 10 5, 20 5 T 30 15"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            markerEnd="url(#arrowhead)"
          />
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                fill="currentColor"
              />
            </marker>
          </defs>
        </svg>
      </div>

      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-4 h-4 rounded-full border-2 border-gray-400 bg-gray-700 hover:bg-gray-600 transition-colors"
        style={{ left: '-6px' }}
      />

      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-full ${getActivityColor(data.activityType)} text-white flex-shrink-0 shadow-lg`}>
            {getActivityIcon(data.activityType)}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white text-sm truncate" title={data.activityName}>
              {data.activityName}
            </h3>
            
            {data.applicationName && (
              <p className="text-xs text-gray-400 mt-1 truncate" title={data.applicationName}>
                {data.applicationName}
              </p>
            )}
            
            {data.description && (
              <p className="text-xs text-gray-300 mt-2 line-clamp-2" title={data.description}>
                {data.description}
              </p>
            )}

            <div className="mt-3 space-y-2">
              {data.preCondition && (
                <div className="text-xs">
                  <span className="text-gray-500">Pre: </span>
                  <span className="text-gray-300 font-mono">{data.preCondition}</span>
                </div>
              )}
              
              {data.postCondition && (
                <div className="text-xs">
                  <span className="text-gray-500">Post: </span>
                  <span className="text-gray-300 font-mono">{data.postCondition}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 mt-3">
              <Badge variant="outline" className="text-xs border-gray-600 text-gray-300 rounded-full px-2">
                Internal
              </Badge>
              
              {data.estimatedDurationMs && (
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock className="h-3 w-3" />
                  {data.estimatedDurationMs}ms
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-4 h-4 rounded-full border-2 border-orange-400 bg-orange-500 hover:bg-orange-400 transition-colors"
        style={{ right: '-6px' }}
      />
    </div>
  );
});