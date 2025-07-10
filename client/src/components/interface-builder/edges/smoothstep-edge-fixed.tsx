import { memo } from 'react';
import { EdgeProps, getSmoothStepPath, EdgeLabelRenderer } from 'reactflow';

// Fixed smoothstep edge that corrects the sourceX/targetX swap issue in React Flow
export default memo(function SmoothstepEdgeFixed({
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
  markerStart,
  label,
  labelStyle,
  labelShowBg = true,
  labelBgStyle,
  labelBgPadding,
  labelBgBorderRadius,
}: EdgeProps) {
  // For interface builder, don't swap coordinates
  // Use them as provided by React Flow since handles are properly positioned
  
  // Calculate the edge path
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
  });

  return (
    <>
      <path
        id={id}
        style={style}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
        markerStart={markerStart}
      />
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              fontSize: 12,
              pointerEvents: 'all',
              ...labelStyle,
            }}
            className="nodrag nopan"
          >
            {labelShowBg && (
              <div
                style={{
                  position: 'absolute',
                  inset: `-${labelBgPadding?.[1] || 2}px -${labelBgPadding?.[0] || 4}px`,
                  borderRadius: labelBgBorderRadius || 4,
                  ...labelBgStyle,
                }}
              />
            )}
            <span style={{ position: 'relative' }}>{label}</span>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
});