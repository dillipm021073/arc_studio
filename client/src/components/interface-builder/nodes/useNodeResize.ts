import { useState, useCallback } from 'react';

interface UseNodeResizeProps {
  initialWidth?: number;
  initialHeight?: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  onUpdate?: (data: any) => void;
  nodeData?: any;
}

export const useNodeResize = ({
  initialWidth = 150,
  initialHeight = 100,
  minWidth = 80,
  minHeight = 60,
  maxWidth = 800,
  maxHeight = 600,
  onUpdate,
  nodeData
}: UseNodeResizeProps) => {
  const [dimensions, setDimensions] = useState({
    width: nodeData?.width || initialWidth,
    height: nodeData?.height || initialHeight
  });

  const handleResize = useCallback((event: any, params: any) => {
    setDimensions({
      width: params.width,
      height: params.height
    });
    
    if (onUpdate) {
      onUpdate({
        ...nodeData,
        width: params.width,
        height: params.height
      });
    }
  }, [onUpdate, nodeData]);

  const enlargeNode = useCallback(() => {
    const newWidth = Math.min(dimensions.width * 1.2, maxWidth);
    const newHeight = Math.min(dimensions.height * 1.2, maxHeight);
    setDimensions({ width: newWidth, height: newHeight });
    
    if (onUpdate) {
      onUpdate({
        ...nodeData,
        width: newWidth,
        height: newHeight
      });
    }
  }, [dimensions, maxWidth, maxHeight, onUpdate, nodeData]);

  const shrinkNode = useCallback(() => {
    const newWidth = Math.max(dimensions.width * 0.8, minWidth);
    const newHeight = Math.max(dimensions.height * 0.8, minHeight);
    setDimensions({ width: newWidth, height: newHeight });
    
    if (onUpdate) {
      onUpdate({
        ...nodeData,
        width: newWidth,
        height: newHeight
      });
    }
  }, [dimensions, minWidth, minHeight, onUpdate, nodeData]);

  const resetSize = useCallback(() => {
    setDimensions({ width: initialWidth, height: initialHeight });
    
    if (onUpdate) {
      onUpdate({
        ...nodeData,
        width: initialWidth,
        height: initialHeight
      });
    }
  }, [initialWidth, initialHeight, onUpdate, nodeData]);

  return {
    dimensions,
    handleResize,
    enlargeNode,
    shrinkNode,
    resetSize
  };
};