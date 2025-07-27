import { FC } from 'react';
import { EdgeProps, getBezierPath, getSmoothStepPath } from 'reactflow';

const OrgChartCustomEdge: FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}) => {
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <path
        id={id}
        style={{
          ...style,
          stroke: '#ffffff',
          strokeWidth: 2,
          fill: 'none',
        }}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
      />
      {/* Add a second path for better visibility */}
      <path
        style={{
          stroke: 'rgba(255, 255, 255, 0.3)',
          strokeWidth: 4,
          fill: 'none',
        }}
        d={edgePath}
      />
    </>
  );
};

export default OrgChartCustomEdge;