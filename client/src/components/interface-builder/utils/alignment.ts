import { Node } from 'reactflow';

export type AlignmentType = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom';
export type DistributionType = 'horizontal' | 'vertical';

/**
 * Aligns selected nodes based on the alignment type
 */
export function alignNodes(nodes: Node[], alignmentType: AlignmentType): Node[] {
  if (nodes.length < 2) return nodes;

  const selectedNodes = [...nodes];
  let referenceValue: number;

  switch (alignmentType) {
    case 'left':
      // Find the leftmost node
      referenceValue = Math.min(...selectedNodes.map(node => node.position.x));
      return selectedNodes.map(node => ({
        ...node,
        position: { ...node.position, x: referenceValue }
      }));

    case 'center':
      // Calculate average center X position
      const avgCenterX = selectedNodes.reduce((sum, node) => {
        const width = node.data?.width || 150;
        return sum + node.position.x + width / 2;
      }, 0) / selectedNodes.length;
      
      return selectedNodes.map(node => {
        const width = node.data?.width || 150;
        return {
          ...node,
          position: { ...node.position, x: avgCenterX - width / 2 }
        };
      });

    case 'right':
      // Find the rightmost edge
      const rightmostEdge = Math.max(...selectedNodes.map(node => {
        const width = node.data?.width || 150;
        return node.position.x + width;
      }));
      
      return selectedNodes.map(node => {
        const width = node.data?.width || 150;
        return {
          ...node,
          position: { ...node.position, x: rightmostEdge - width }
        };
      });

    case 'top':
      // Find the topmost node
      referenceValue = Math.min(...selectedNodes.map(node => node.position.y));
      return selectedNodes.map(node => ({
        ...node,
        position: { ...node.position, y: referenceValue }
      }));

    case 'middle':
      // Calculate average center Y position
      const avgCenterY = selectedNodes.reduce((sum, node) => {
        const height = node.data?.height || 100;
        return sum + node.position.y + height / 2;
      }, 0) / selectedNodes.length;
      
      return selectedNodes.map(node => {
        const height = node.data?.height || 100;
        return {
          ...node,
          position: { ...node.position, y: avgCenterY - height / 2 }
        };
      });

    case 'bottom':
      // Find the bottommost edge
      const bottommostEdge = Math.max(...selectedNodes.map(node => {
        const height = node.data?.height || 100;
        return node.position.y + height;
      }));
      
      return selectedNodes.map(node => {
        const height = node.data?.height || 100;
        return {
          ...node,
          position: { ...node.position, y: bottommostEdge - height }
        };
      });

    default:
      return selectedNodes;
  }
}

/**
 * Distributes selected nodes evenly based on the distribution type
 */
export function distributeNodes(nodes: Node[], distributionType: DistributionType): Node[] {
  if (nodes.length < 3) return nodes;

  const selectedNodes = [...nodes];

  if (distributionType === 'horizontal') {
    // Sort nodes by x position
    selectedNodes.sort((a, b) => a.position.x - b.position.x);
    
    // Get leftmost and rightmost positions
    const leftmost = selectedNodes[0].position.x;
    const rightmost = selectedNodes[selectedNodes.length - 1].position.x;
    
    // Calculate total width needed for all nodes
    const totalWidth = selectedNodes.reduce((sum, node) => sum + (node.data?.width || 150), 0);
    
    // Calculate available space for gaps
    const availableSpace = rightmost - leftmost + (selectedNodes[selectedNodes.length - 1].data?.width || 150) - totalWidth;
    const gap = availableSpace / (selectedNodes.length - 1);
    
    // Position nodes with equal gaps
    let currentX = leftmost;
    return selectedNodes.map((node, index) => {
      const newNode = {
        ...node,
        position: { ...node.position, x: currentX }
      };
      currentX += (node.data?.width || 150) + gap;
      return newNode;
    });
  } else {
    // Sort nodes by y position
    selectedNodes.sort((a, b) => a.position.y - b.position.y);
    
    // Get topmost and bottommost positions
    const topmost = selectedNodes[0].position.y;
    const bottommost = selectedNodes[selectedNodes.length - 1].position.y;
    
    // Calculate total height needed for all nodes
    const totalHeight = selectedNodes.reduce((sum, node) => sum + (node.data?.height || 100), 0);
    
    // Calculate available space for gaps
    const availableSpace = bottommost - topmost + (selectedNodes[selectedNodes.length - 1].data?.height || 100) - totalHeight;
    const gap = availableSpace / (selectedNodes.length - 1);
    
    // Position nodes with equal gaps
    let currentY = topmost;
    return selectedNodes.map((node, index) => {
      const newNode = {
        ...node,
        position: { ...node.position, y: currentY }
      };
      currentY += (node.data?.height || 100) + gap;
      return newNode;
    });
  }
}

/**
 * Snaps a position to the nearest grid point
 */
export function snapToGrid(position: { x: number; y: number }, gridSize: number = 10): { x: number; y: number } {
  return {
    x: Math.round(position.x / gridSize) * gridSize,
    y: Math.round(position.y / gridSize) * gridSize
  };
}

/**
 * Gets bounding box of selected nodes
 */
export function getNodesBounds(nodes: Node[]): { x: number; y: number; width: number; height: number } {
  if (nodes.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  nodes.forEach(node => {
    const width = node.data?.width || 150;
    const height = node.data?.height || 100;
    
    minX = Math.min(minX, node.position.x);
    minY = Math.min(minY, node.position.y);
    maxX = Math.max(maxX, node.position.x + width);
    maxY = Math.max(maxY, node.position.y + height);
  });

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
}