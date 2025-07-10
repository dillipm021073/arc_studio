import { memo } from "react";
import { NodeProps } from "reactflow";
import CircleNode from "./circle-node";
import RectangleNode from "./rectangle-node";
import DatabaseNode from "./database-node";
import TriangleNode from "./triangle-node";
import EllipseNode from "./ellipse-node";
import PentagonNode from "./pentagon-node";
import HexagonNode from "./hexagon-node";
import ParallelogramNode from "./parallelogram-node";
import TrapezoidNode from "./trapezoid-node";
import StarNode from "./star-node";
import DiamondNode from "./diamond-node";
import ArrowNode from "./arrow-node";
import CloudNode from "./cloud-node";

export interface ShapeNodeData {
  id: string;
  label: string;
  type: string;
  // Circle properties
  radius?: number;
  // Rectangle properties
  width?: number;
  height?: number;
  borderRadius?: number;
  // Database properties
  line1?: string;
  line2?: string;
  // Triangle properties
  triangleType?: 'equilateral' | 'right' | 'isosceles';
  // Parallelogram properties
  skewAngle?: number;
  // Trapezoid properties
  topWidth?: number;
  // Star properties
  points?: number;
  innerRadius?: number;
  // Arrow properties
  arrowDirection?: 'right' | 'left' | 'up' | 'down';
  arrowStyle?: 'single' | 'double';
  headSize?: number;
  // Common properties
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  fontSize?: number;
  textColor?: string;
  text?: string;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onToggleResize?: () => void;
  isResizing?: boolean;
  onUpdate?: (data: any) => void;
}

function ShapeNode(props: NodeProps<ShapeNodeData>) {
  // Determine which shape to render based on the data.id
  switch (props.data.id) {
    case 'circle':
      return <CircleNode {...props as any} />;
    case 'rectangle':
    case 'drawing-box':
      return <RectangleNode {...props as any} />;
    case 'database':
      return <DatabaseNode {...props as any} />;
    case 'triangle':
      return <TriangleNode {...props as any} />;
    case 'ellipse':
      return <EllipseNode {...props as any} />;
    case 'pentagon':
      return <PentagonNode {...props as any} />;
    case 'hexagon':
      return <HexagonNode {...props as any} />;
    case 'parallelogram':
      return <ParallelogramNode {...props as any} />;
    case 'trapezoid':
      return <TrapezoidNode {...props as any} />;
    case 'star':
      return <StarNode {...props as any} />;
    case 'diamond':
      return <DiamondNode {...props as any} />;
    case 'arrow':
      return <ArrowNode {...props as any} />;
    case 'cloud':
      return <CloudNode {...props as any} />;
    default:
      // Default to rectangle if shape type is not specified
      return <RectangleNode {...props as any} />;
  }
}

export default memo(ShapeNode);