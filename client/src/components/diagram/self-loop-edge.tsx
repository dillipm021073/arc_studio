import { memo } from "react";
import { EdgeProps, EdgeLabelRenderer } from "reactflow";

interface SelfLoopEdgeData {
  isInternalActivity?: boolean;
  activity?: {
    id: number;
    activityName: string;
    activityType: string;
    description?: string;
    sequenceNumber: number;
  };
  sequenceNumber: number;
  yPosition: number;
}

function SelfLoopEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
  style,
  markerEnd,
}: EdgeProps<SelfLoopEdgeData>) {
  if (!data?.activity) return null;

  const { activity, yPosition } = data;
  
  // Debug logging
  console.log('SelfLoopEdge rendering:', {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    yPosition,
    activity: activity?.activityName
  });
  
  // Calculate the center X position between source and target
  // For a self-loop, these should be the same, but let's use sourceX
  const centerX = sourceX;
  const actualY = yPosition || sourceY;
  
  // Calculate self-loop path parameters
  const loopWidth = 100;
  const loopHeight = 50;
  
  // Create a self-referential loop on the right side
  const startX = centerX;
  const startY = actualY;
  
  // Create a curved path that loops to the right and back
  const path = `
    M ${startX},${startY}
    C ${startX + loopWidth},${startY}
      ${startX + loopWidth},${startY + loopHeight}
      ${startX},${startY + loopHeight}
    L ${startX},${startY + loopHeight}
  `;
  
  // Position for the label (right side of the loop)
  const labelX = startX + loopWidth + 15;
  const labelY = startY + loopHeight / 2;

  // Format description with word wrapping
  const formatDescription = (text?: string) => {
    if (!text || text.length <= 40) return text;
    
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    words.forEach((word) => {
      if ((currentLine + ' ' + word).length > 40) {
        lines.push(currentLine.trim());
        currentLine = word;
      } else {
        currentLine += (currentLine ? ' ' : '') + word;
      }
    });
    if (currentLine) lines.push(currentLine);
    
    return lines.slice(0, 3); // Max 3 lines
  };

  const descriptionLines = formatDescription(activity.description);

  return (
    <>
      <path
        id={id}
        style={{
          ...style,
          fill: 'none',
          stroke: style?.stroke || '#16a34a',
          strokeWidth: style?.strokeWidth || 2,
        }}
        className="react-flow__edge-path"
        d={path}
        markerEnd={markerEnd}
      />
      
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <div className="bg-green-50 px-3 py-2 rounded border border-green-300 shadow-sm max-w-[200px]">
            <div className="text-xs">
              <div className="font-semibold flex items-center gap-1">
                <span className="text-green-600">#{data.sequenceNumber}</span>
                <span className="text-green-700">⚙️ {activity.activityName}</span>
              </div>
              <div className="text-green-600 text-[10px]">{activity.activityType}</div>
              {descriptionLines && (
                <div className="text-gray-600 text-[10px] mt-1">
                  {Array.isArray(descriptionLines) ? (
                    descriptionLines.map((line, i) => (
                      <div key={i}>{line}</div>
                    ))
                  ) : (
                    descriptionLines
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export default memo(SelfLoopEdge);