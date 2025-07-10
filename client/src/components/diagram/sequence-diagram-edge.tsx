import { memo } from "react";
import { EdgeProps, getStraightPath, EdgeLabelRenderer } from "reactflow";

interface SequenceDiagramEdgeData {
  interface: any;
  sequenceNumber: number;
}

function SequenceDiagramEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
  style,
}: EdgeProps<SequenceDiagramEdgeData>) {
  const [edgePath, labelX, labelY] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

  if (!data?.interface) return null;

  const { interface: iml } = data;
  
  // Determine arrow direction based on interface type and flow
  const isFileInterface = iml.interfaceType?.toLowerCase() === 'file';
  const isFilePush = isFileInterface && iml.description?.toLowerCase().includes('push');
  const isFilePull = isFileInterface && iml.description?.toLowerCase().includes('pull');
  
  // For online interfaces: consumer → provider (consumer calls provider)
  // For file push: provider → consumer (provider pushes to consumer)
  // For file pull: consumer → provider (consumer pulls from provider)
  let arrowDirection = 'forward'; // default for online
  if (isFilePush) {
    arrowDirection = 'forward'; // provider to consumer
  } else if (isFilePull || !isFileInterface) {
    arrowDirection = 'forward'; // consumer to provider
  }

  // Use the y position from data if available
  const yPos = data.yPosition || sourceY;
  
  // Adjust arrow to point to bottom of IML box
  // IML box is positioned above the line and has approximately 60-70px height
  const arrowYPos = yPos + 40; // Move arrow down to align with bottom of IML box
  
  // Swap sourceX and targetX to correct the arrow direction
  // React Flow provides these swapped, so we need to correct them
  const correctedSourceX = targetX;
  const correctedTargetX = sourceX;
  
  // Create a straight horizontal line at the adjusted y position
  const straightPath = `M ${correctedSourceX},${arrowYPos} L ${correctedTargetX},${arrowYPos}`;
  
  // Calculate label position
  const labelPosX = (correctedSourceX + correctedTargetX) / 2;
  const labelPosY = yPos - 10; // Keep IML box at original position

  return (
    <>
      <path
        id={id}
        style={{
          ...style,
          strokeWidth: 2,
          stroke: iml.status === 'active' ? '#10b981' : '#6b7280',
        }}
        className="react-flow__edge-path"
        d={straightPath}
        markerEnd={markerEnd}
      />
      
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelPosX}px, ${labelPosY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <div className="bg-white px-3 py-2 rounded-lg border-2 border-gray-300 shadow-md relative cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]">
            {/* Status indicator dot */}
            <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${iml.status === 'active' ? 'bg-green-500' : 'bg-gray-400'} border-2 border-white`} />
            
            {/* Interface type color bar */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-md ${isFileInterface ? 'bg-amber-500' : 'bg-blue-500'}`} />
            
            <div className="text-xs ml-1">
              <div className="flex items-center gap-1">
                <span className="text-primary font-bold">#{data.sequenceNumber}</span>
                <span className="font-bold">{iml.imlNumber}</span>
              </div>
              <div className="text-gray-600 font-semibold text-xs uppercase tracking-wider">{iml.interfaceType}</div>
              {iml.description && (
                <div className="text-gray-700 max-w-[150px] truncate" title={iml.description}>{iml.description}</div>
              )}
            </div>
          </div>
        </div>
      </EdgeLabelRenderer>

      {/* Return arrow for synchronous calls */}
      {!isFileInterface && (
        <>
          <path
            style={{
              strokeWidth: 1,
              stroke: '#9ca3af',
              strokeDasharray: '5,5',
            }}
            className="react-flow__edge-path"
            d={`M ${correctedTargetX},${arrowYPos + 30} L ${correctedSourceX},${arrowYPos + 30}`}
            markerEnd="url(#arrow-return)"
          />
          <EdgeLabelRenderer>
            <div
              style={{
                position: 'absolute',
                transform: `translate(-50%, -50%) translate(${labelPosX}px, ${arrowYPos + 20}px)`,
              }}
              className="text-xs text-gray-500"
            >
              ok
            </div>
          </EdgeLabelRenderer>
        </>
      )}
    </>
  );
}

export default memo(SequenceDiagramEdge);