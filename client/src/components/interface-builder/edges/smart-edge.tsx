import { memo } from 'react';
import { EdgeProps, getSmoothStepPath, EdgeLabelRenderer } from 'reactflow';
import { Badge } from '@/components/ui/badge';

interface SmartEdgeData {
  connectionType?: string;
  dataFlow?: 'unidirectional' | 'bidirectional';
  protocol?: string;
  security?: string;
  bandwidth?: string;
  latency?: string;
  errorRate?: number;
  throughput?: number;
}

export default memo(function SmartEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  markerEnd,
}: EdgeProps<SmartEdgeData>) {
  // For interface builder, use coordinates as provided by React Flow
  // No swapping needed since handles are properly positioned
  
  // Calculate the edge path with sharp corners for n8n-style
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 0, // Sharp corners for n8n-style
  });

  // Dynamic edge styling based on connection type and performance
  const getEdgeStyle = () => {
    const baseStyle = {
      strokeWidth: 2,
      stroke: style?.stroke || '#94a3b8', // Ensure default stroke color
      fill: 'none', // Ensure no fill on path
      ...style,
    };

    // Color coding based on connection type
    if (data?.connectionType) {
      switch (data.connectionType) {
        case 'HTTP Request':
        case 'REST Request':
          baseStyle.stroke = '#3b82f6'; // Blue
          break;
        case 'API Call':
          baseStyle.stroke = '#8b5cf6'; // Purple
          break;
        case 'Service Call':
          baseStyle.stroke = '#10b981'; // Green
          break;
        case 'Message':
          baseStyle.stroke = '#f59e0b'; // Orange
          break;
        case 'Database Query':
          baseStyle.stroke = '#6b7280'; // Gray
          break;
        default:
          baseStyle.stroke = '#6366f1'; // Indigo
      }
    }

    // Performance-based styling
    if (data?.errorRate !== undefined) {
      if (data.errorRate > 5) {
        baseStyle.stroke = '#ef4444'; // Red for high error rate
        baseStyle.strokeDasharray = '5,5'; // Dashed for errors
      } else if (data.errorRate > 1) {
        baseStyle.stroke = '#f59e0b'; // Orange for medium error rate
      }
    }

    // Security styling
    if (data?.security === 'encrypted') {
      baseStyle.strokeWidth = 3;
      baseStyle.filter = 'drop-shadow(0 0 2px rgba(34, 197, 94, 0.5))';
    }

    return baseStyle;
  };

  const getConnectionLabel = () => {
    if (data?.connectionType) {
      return data.connectionType;
    }
    return null;
  };

  const getPerformanceColor = () => {
    if (data?.errorRate !== undefined) {
      if (data.errorRate > 5) return 'bg-red-600';
      if (data.errorRate > 1) return 'bg-yellow-600';
      return 'bg-green-600';
    }
    return 'bg-blue-600';
  };

  const shouldShowLabel = () => {
    return data?.connectionType || data?.protocol || data?.bandwidth;
  };

  return (
    <g>
      {/* Invisible wider path for better interaction */}
      <path
        id={`${id}-interaction`}
        style={{
          ...getEdgeStyle(),
          strokeWidth: 20,
          stroke: 'transparent',
          fill: 'none',
          pointerEvents: 'stroke',
        }}
        className="react-flow__edge-interaction"
        d={edgePath}
      />
      {/* Visible edge path */}
      <path
        id={id}
        style={getEdgeStyle()}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
      />
      
      {/* Bidirectional arrow for bidirectional data flow */}
      {data?.dataFlow === 'bidirectional' && (
        <path
          style={getEdgeStyle()}
          className="react-flow__edge-path"
          d={edgePath}
          markerStart={markerEnd}
        />
      )}

      {/* Edge label with connection information */}
      {shouldShowLabel() && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              fontSize: 10,
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            <div className="flex flex-col items-center gap-1">
              {/* Main connection type badge */}
              {getConnectionLabel() && (
                <Badge 
                  className={`text-xs px-2 py-1 ${getPerformanceColor()} text-white shadow-lg border-0`}
                >
                  {getConnectionLabel()}
                </Badge>
              )}
              
              {/* Protocol and technical details */}
              {(data?.protocol || data?.bandwidth) && (
                <div className="flex gap-1">
                  {data?.protocol && (
                    <Badge 
                      variant="outline" 
                      className="text-xs px-1 py-0 bg-gray-800/90 border-gray-600 text-gray-300"
                    >
                      {data.protocol}
                    </Badge>
                  )}
                  {data?.bandwidth && (
                    <Badge 
                      variant="outline" 
                      className="text-xs px-1 py-0 bg-gray-800/90 border-gray-600 text-gray-300"
                    >
                      {data.bandwidth}
                    </Badge>
                  )}
                </div>
              )}
              
              {/* Performance metrics */}
              {(data?.latency || data?.throughput) && (
                <div className="flex gap-1">
                  {data?.latency && (
                    <Badge 
                      variant="outline" 
                      className="text-xs px-1 py-0 bg-blue-800/90 border-blue-600 text-blue-300"
                    >
                      {data.latency}ms
                    </Badge>
                  )}
                  {data?.throughput && (
                    <Badge 
                      variant="outline" 
                      className="text-xs px-1 py-0 bg-green-800/90 border-green-600 text-green-300"
                    >
                      {data.throughput} RPS
                    </Badge>
                  )}
                </div>
              )}
              
              {/* Error rate warning */}
              {data?.errorRate !== undefined && data.errorRate > 1 && (
                <Badge 
                  variant="outline" 
                  className="text-xs px-1 py-0 bg-red-800/90 border-red-600 text-red-300"
                >
                  ⚠️ {data.errorRate}% errors
                </Badge>
              )}
              
              {/* Security indicator */}
              {data?.security && (
                <Badge 
                  variant="outline" 
                  className="text-xs px-1 py-0 bg-green-800/90 border-green-600 text-green-300"
                >
                  🔒 {data.security}
                </Badge>
              )}
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </g>
  );
});