import React from 'react';
import { ZoomIn, ZoomOut } from 'lucide-react';

interface ResizeControlsProps {
  onEnlarge: () => void;
  onShrink: () => void;
  visible?: boolean;
}

export const ResizeControls: React.FC<ResizeControlsProps> = ({ 
  onEnlarge, 
  onShrink,
  visible = true
}) => {
  if (!visible) return null;

  return (
    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onShrink();
        }}
        className="p-1 bg-gray-800 text-white rounded hover:bg-gray-700"
        title="Shrink (20%)"
      >
        <ZoomOut className="h-4 w-4" />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onEnlarge();
        }}
        className="p-1 bg-gray-800 text-white rounded hover:bg-gray-700"
        title="Enlarge (20%)"
      >
        <ZoomIn className="h-4 w-4" />
      </button>
    </div>
  );
};