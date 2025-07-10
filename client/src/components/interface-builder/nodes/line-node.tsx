import { memo, useState, useCallback, useRef, useEffect } from "react";
import { NodeProps } from "reactflow";
import { Minus, Copy, Trash2, Palette, Edit2 } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";

export interface LineNodeData {
  label: string;
  type: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  strokeColor: string;
  strokeWidth: number;
  strokeStyle: 'solid' | 'dashed' | 'dotted';
  arrowHead?: boolean;
  arrowSize?: number;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onUpdate?: (data: any) => void;
}

function LineNode({ data, selected, id }: NodeProps<LineNodeData>) {
  const [isDragging, setIsDragging] = useState<'start' | 'end' | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [localData, setLocalData] = useState({
    strokeColor: data.strokeColor || '#000000',
    strokeWidth: data.strokeWidth || 2,
    strokeStyle: data.strokeStyle || 'solid',
    arrowHead: data.arrowHead !== false,
    arrowSize: data.arrowSize || 10,
  });
  const svgRef = useRef<SVGSVGElement>(null);

  // Calculate line bounds
  const startX = data.startX ?? 0;
  const startY = data.startY ?? 0;
  const endX = data.endX ?? 100;
  const endY = data.endY ?? 0;
  
  const minX = Math.min(startX, endX);
  const minY = Math.min(startY, endY);
  const maxX = Math.max(startX, endX);
  const maxY = Math.max(startY, endY);
  const width = Math.max(maxX - minX + 40, 140); // Add padding for handles, min width
  const height = Math.max(maxY - minY + 40, 40); // Add padding for handles, min height

  // Adjust coordinates relative to SVG viewport
  const adjustedStartX = startX - minX + 20;
  const adjustedStartY = startY - minY + 20;
  const adjustedEndX = endX - minX + 20;
  const adjustedEndY = endY - minY + 20;

  const handleMouseDown = useCallback((e: React.MouseEvent, point: 'start' | 'end') => {
    e.stopPropagation();
    setIsDragging(point);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Force update by triggering React Flow's node update
    const newData = { ...data };
    if (isDragging === 'start') {
      newData.startX = x + minX - 20;
      newData.startY = y + minY - 20;
    } else {
      newData.endX = x + minX - 20;
      newData.endY = y + minY - 20;
    }
    
    // This will trigger a re-render
    Object.assign(data, newData);
  }, [isDragging, data, minX, minY]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(null);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const applySettings = () => {
    Object.assign(data, localData);
    if (data.onUpdate) {
      data.onUpdate(localData);
    }
    setShowSettings(false);
  };

  const getStrokeDasharray = () => {
    switch (localData.strokeStyle) {
      case 'dashed':
        return '10,5';
      case 'dotted':
        return '2,3';
      default:
        return undefined;
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          className={`relative transition-all duration-200 ${
            selected ? 'z-10' : 'z-0'
          }`}
          style={{
            width: `${width}px`,
            height: `${height}px`,
          }}
        >
          <svg
            ref={svgRef}
            width={width}
            height={height}
            className="absolute inset-0"
            style={{ overflow: 'visible' }}
          >
            {/* Arrow marker definition */}
            {(data.arrowHead || localData.arrowHead) && (
              <defs>
                <marker
                  id={`arrow-${id}`}
                  markerWidth={data.arrowSize || localData.arrowSize}
                  markerHeight={data.arrowSize || localData.arrowSize}
                  refX={(data.arrowSize || localData.arrowSize) - 1}
                  refY={(data.arrowSize || localData.arrowSize) / 2}
                  orient="auto"
                  markerUnits="strokeWidth"
                >
                  <path
                    d={`M0,0 L0,${data.arrowSize || localData.arrowSize} L${data.arrowSize || localData.arrowSize},${(data.arrowSize || localData.arrowSize) / 2} z`}
                    fill={data.strokeColor || localData.strokeColor}
                  />
                </marker>
              </defs>
            )}
            
            {/* Main line */}
            <line
              x1={adjustedStartX}
              y1={adjustedStartY}
              x2={adjustedEndX}
              y2={adjustedEndY}
              stroke={data.strokeColor || localData.strokeColor}
              strokeWidth={data.strokeWidth || localData.strokeWidth}
              strokeDasharray={getStrokeDasharray()}
              markerEnd={(data.arrowHead || localData.arrowHead) ? `url(#arrow-${id})` : undefined}
              className={`transition-all duration-200 ${
                selected ? 'filter drop-shadow-lg' : ''
              }`}
            />

            {/* Invisible wider line for easier selection */}
            <line
              x1={adjustedStartX}
              y1={adjustedStartY}
              x2={adjustedEndX}
              y2={adjustedEndY}
              stroke="transparent"
              strokeWidth={Math.max(20, (data.strokeWidth || localData.strokeWidth) + 10)}
              className="cursor-pointer"
            />

            {/* Start point handle */}
            {selected && (
              <>
                <circle
                  cx={adjustedStartX}
                  cy={adjustedStartY}
                  r="8"
                  fill="#3b82f6"
                  stroke="white"
                  strokeWidth="2"
                  className="cursor-move"
                  onMouseDown={(e) => handleMouseDown(e, 'start')}
                />
                <circle
                  cx={adjustedEndX}
                  cy={adjustedEndY}
                  r="8"
                  fill="#3b82f6"
                  stroke="white"
                  strokeWidth="2"
                  className="cursor-move"
                  onMouseDown={(e) => handleMouseDown(e, 'end')}
                />
              </>
            )}
          </svg>

          {/* Settings button */}
          {selected && (
            <Popover open={showSettings} onOpenChange={setShowSettings}>
              <PopoverTrigger asChild>
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Palette className="h-4 w-4 mr-1" />
                  Style
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 bg-gray-800 border-gray-700" onClick={(e) => e.stopPropagation()}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300">Color</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={localData.strokeColor}
                        onChange={(e) => setLocalData({ ...localData, strokeColor: e.target.value })}
                        className="h-10 w-20 cursor-pointer bg-gray-700 border-gray-600"
                      />
                      <Input
                        type="text"
                        value={localData.strokeColor}
                        onChange={(e) => setLocalData({ ...localData, strokeColor: e.target.value })}
                        className="flex-1 bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-300">Width: {localData.strokeWidth}px</Label>
                    <Slider
                      min={1}
                      max={20}
                      step={1}
                      value={[localData.strokeWidth]}
                      onValueChange={([value]) => setLocalData({ ...localData, strokeWidth: value })}
                      className="bg-gray-700"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-300">Style</Label>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={localData.strokeStyle === 'solid' ? 'default' : 'outline'}
                        onClick={() => setLocalData({ ...localData, strokeStyle: 'solid' })}
                        className="flex-1"
                      >
                        Solid
                      </Button>
                      <Button
                        size="sm"
                        variant={localData.strokeStyle === 'dashed' ? 'default' : 'outline'}
                        onClick={() => setLocalData({ ...localData, strokeStyle: 'dashed' })}
                        className="flex-1"
                      >
                        Dashed
                      </Button>
                      <Button
                        size="sm"
                        variant={localData.strokeStyle === 'dotted' ? 'default' : 'outline'}
                        onClick={() => setLocalData({ ...localData, strokeStyle: 'dotted' })}
                        className="flex-1"
                      >
                        Dotted
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="arrowHead"
                      checked={localData.arrowHead}
                      onChange={(e) => setLocalData({ ...localData, arrowHead: e.target.checked })}
                      className="rounded border-gray-600"
                    />
                    <Label htmlFor="arrowHead" className="text-gray-300 cursor-pointer">Show arrow head</Label>
                  </div>

                  {localData.arrowHead && (
                    <div className="space-y-2">
                      <Label className="text-gray-300">Arrow Size: {localData.arrowSize}px</Label>
                      <Slider
                        min={5}
                        max={20}
                        step={1}
                        value={[localData.arrowSize]}
                        onValueChange={([value]) => setLocalData({ ...localData, arrowSize: value })}
                        className="bg-gray-700"
                      />
                    </div>
                  )}

                  <Button onClick={applySettings} className="w-full bg-blue-600 hover:bg-blue-700">
                    Apply
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="bg-gray-800 border-gray-700">
        <ContextMenuItem
          onClick={() => setShowSettings(true)}
          className="text-gray-300 hover:text-white hover:bg-gray-700"
        >
          <Edit2 className="mr-2 h-4 w-4" />
          Edit Style
        </ContextMenuItem>
        <ContextMenuItem
          onClick={data.onDuplicate}
          className="text-gray-300 hover:text-white hover:bg-gray-700"
        >
          <Copy className="mr-2 h-4 w-4" />
          Duplicate
        </ContextMenuItem>
        <ContextMenuSeparator className="bg-gray-700" />
        <ContextMenuItem
          onClick={data.onDelete}
          className="text-red-400 hover:text-red-300 hover:bg-gray-700"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

export default memo(LineNode);