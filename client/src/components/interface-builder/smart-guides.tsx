import { useEffect, useState } from 'react';
import { Node } from 'reactflow';

interface SmartGuidesProps {
  nodes: Node[];
  activeNodeId: string | null;
  threshold?: number;
}

interface Guide {
  type: 'vertical' | 'horizontal';
  position: number;
  nodes: string[];
}

export default function SmartGuides({ nodes, activeNodeId, threshold = 5 }: SmartGuidesProps) {
  const [guides, setGuides] = useState<Guide[]>([]);

  useEffect(() => {
    if (!activeNodeId) {
      setGuides([]);
      return;
    }

    const activeNode = nodes.find(n => n.id === activeNodeId);
    if (!activeNode) {
      setGuides([]);
      return;
    }

    const newGuides: Guide[] = [];
    const otherNodes = nodes.filter(n => n.id !== activeNodeId);

    const activeWidth = activeNode.data?.width || 150;
    const activeHeight = activeNode.data?.height || 100;
    const activeCenterX = activeNode.position.x + activeWidth / 2;
    const activeCenterY = activeNode.position.y + activeHeight / 2;
    const activeRight = activeNode.position.x + activeWidth;
    const activeBottom = activeNode.position.y + activeHeight;

    // Check alignment with other nodes
    otherNodes.forEach(node => {
      const width = node.data?.width || 150;
      const height = node.data?.height || 100;
      const centerX = node.position.x + width / 2;
      const centerY = node.position.y + height / 2;
      const right = node.position.x + width;
      const bottom = node.position.y + height;

      // Vertical guides (left edge alignment)
      if (Math.abs(activeNode.position.x - node.position.x) < threshold) {
        const existingGuide = newGuides.find(g => g.type === 'vertical' && Math.abs(g.position - node.position.x) < 1);
        if (existingGuide) {
          existingGuide.nodes.push(node.id);
        } else {
          newGuides.push({
            type: 'vertical',
            position: node.position.x,
            nodes: [activeNodeId, node.id]
          });
        }
      }

      // Vertical guides (center alignment)
      if (Math.abs(activeCenterX - centerX) < threshold) {
        const existingGuide = newGuides.find(g => g.type === 'vertical' && Math.abs(g.position - centerX) < 1);
        if (existingGuide) {
          existingGuide.nodes.push(node.id);
        } else {
          newGuides.push({
            type: 'vertical',
            position: centerX,
            nodes: [activeNodeId, node.id]
          });
        }
      }

      // Vertical guides (right edge alignment)
      if (Math.abs(activeRight - right) < threshold) {
        const existingGuide = newGuides.find(g => g.type === 'vertical' && Math.abs(g.position - right) < 1);
        if (existingGuide) {
          existingGuide.nodes.push(node.id);
        } else {
          newGuides.push({
            type: 'vertical',
            position: right,
            nodes: [activeNodeId, node.id]
          });
        }
      }

      // Horizontal guides (top edge alignment)
      if (Math.abs(activeNode.position.y - node.position.y) < threshold) {
        const existingGuide = newGuides.find(g => g.type === 'horizontal' && Math.abs(g.position - node.position.y) < 1);
        if (existingGuide) {
          existingGuide.nodes.push(node.id);
        } else {
          newGuides.push({
            type: 'horizontal',
            position: node.position.y,
            nodes: [activeNodeId, node.id]
          });
        }
      }

      // Horizontal guides (center alignment)
      if (Math.abs(activeCenterY - centerY) < threshold) {
        const existingGuide = newGuides.find(g => g.type === 'horizontal' && Math.abs(g.position - centerY) < 1);
        if (existingGuide) {
          existingGuide.nodes.push(node.id);
        } else {
          newGuides.push({
            type: 'horizontal',
            position: centerY,
            nodes: [activeNodeId, node.id]
          });
        }
      }

      // Horizontal guides (bottom edge alignment)
      if (Math.abs(activeBottom - bottom) < threshold) {
        const existingGuide = newGuides.find(g => g.type === 'horizontal' && Math.abs(g.position - bottom) < 1);
        if (existingGuide) {
          existingGuide.nodes.push(node.id);
        } else {
          newGuides.push({
            type: 'horizontal',
            position: bottom,
            nodes: [activeNodeId, node.id]
          });
        }
      }
    });

    setGuides(newGuides);
  }, [nodes, activeNodeId, threshold]);

  if (guides.length === 0) return null;

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1000,
      }}
    >
      {guides.map((guide, index) => {
        if (guide.type === 'vertical') {
          return (
            <line
              key={`v-${index}`}
              x1={guide.position}
              y1={0}
              x2={guide.position}
              y2="100%"
              stroke="#3b82f6"
              strokeWidth="1"
              strokeDasharray="5,5"
              opacity="0.7"
            />
          );
        } else {
          return (
            <line
              key={`h-${index}`}
              x1={0}
              y1={guide.position}
              x2="100%"
              y2={guide.position}
              stroke="#3b82f6"
              strokeWidth="1"
              strokeDasharray="5,5"
              opacity="0.7"
            />
          );
        }
      })}
    </svg>
  );
}