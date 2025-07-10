import { memo, useState } from "react";
import { NodeProps, Handle, Position } from "reactflow";
import { Circle, Copy, Trash2, Palette, Edit2, Maximize2 } from "lucide-react";
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

export interface CircleNodeData {
  label: string;
  type: string;
  radius: number;
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onToggleResize?: () => void;
  isResizing?: boolean;
}

function CircleNode({ data, selected }: NodeProps<CircleNodeData>) {
  const [showSettings, setShowSettings] = useState(false);
  const [localData, setLocalData] = useState({
    radius: data.radius || 50,
    fillColor: data.fillColor || '#ffffff',
    strokeColor: data.strokeColor || '#000000',
    strokeWidth: data.strokeWidth || 2,
  });

  const applySettings = () => {
    Object.assign(data, localData);
    setShowSettings(false);
  };

  const diameter = (data.radius || localData.radius) * 2;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          className={`relative group transition-all duration-200 ${
            selected ? 'z-10' : 'z-0'
          } ${data.isResizing ? 'resize overflow-visible' : ''}`}
          style={{
            width: `${diameter}px`,
            height: `${diameter}px`,
          }}
        >
          {/* Connection Points - 4 handles, one on each side */}
          <>
            {/* Top */}
            <Handle
              type="source"
              position={Position.Top}
              id="top"
              className="w-4 h-4 rounded-full border-2 border-gray-400 bg-gray-700 hover:bg-blue-500 hover:scale-125 transition-all cursor-crosshair"
              style={{ 
                top: '-8px', 
                left: '50%', 
                transform: 'translateX(-50%)',
                zIndex: 10
              }}
            />
            <Handle
              type="target"
              position={Position.Top}
              id="top"
              className="w-4 h-4 rounded-full opacity-0"
              style={{ 
                top: '-8px', 
                left: '50%', 
                transform: 'translateX(-50%)',
                zIndex: 10
              }}
            />
            
            {/* Right */}
            <Handle
              type="source"
              position={Position.Right}
              id="right"
              className="w-4 h-4 rounded-full border-2 border-gray-400 bg-gray-700 hover:bg-blue-500 hover:scale-125 transition-all cursor-crosshair"
              style={{ 
                right: '-8px', 
                top: '50%', 
                transform: 'translateY(-50%)',
                zIndex: 10
              }}
            />
            <Handle
              type="target"
              position={Position.Right}
              id="right"
              className="w-4 h-4 rounded-full opacity-0"
              style={{ 
                right: '-8px', 
                top: '50%', 
                transform: 'translateY(-50%)',
                zIndex: 10
              }}
            />
            
            {/* Bottom */}
            <Handle
              type="source"
              position={Position.Bottom}
              id="bottom"
              className="w-4 h-4 rounded-full border-2 border-gray-400 bg-gray-700 hover:bg-blue-500 hover:scale-125 transition-all cursor-crosshair"
              style={{ 
                bottom: '-8px', 
                left: '50%', 
                transform: 'translateX(-50%)',
                zIndex: 10
              }}
            />
            <Handle
              type="target"
              position={Position.Bottom}
              id="bottom"
              className="w-4 h-4 rounded-full opacity-0"
              style={{ 
                bottom: '-8px', 
                left: '50%', 
                transform: 'translateX(-50%)',
                zIndex: 10
              }}
            />
            
            {/* Left */}
            <Handle
              type="source"
              position={Position.Left}
              id="left"
              className="w-4 h-4 rounded-full border-2 border-gray-400 bg-gray-700 hover:bg-blue-500 hover:scale-125 transition-all cursor-crosshair"
              style={{ 
                left: '-8px', 
                top: '50%', 
                transform: 'translateY(-50%)',
                zIndex: 10
              }}
            />
            <Handle
              type="target"
              position={Position.Left}
              id="left"
              className="w-4 h-4 rounded-full opacity-0"
              style={{ 
                left: '-8px', 
                top: '50%', 
                transform: 'translateY(-50%)',
                zIndex: 10
              }}
            />
          </>

          <svg
            width={diameter}
            height={diameter}
            className="absolute inset-0"
            style={{ overflow: 'visible' }}
          >
            <circle
              cx={data.radius || localData.radius}
              cy={data.radius || localData.radius}
              r={(data.radius || localData.radius) - (data.strokeWidth || localData.strokeWidth) / 2}
              fill={data.fillColor || localData.fillColor}
              stroke={data.strokeColor || localData.strokeColor}
              strokeWidth={data.strokeWidth || localData.strokeWidth}
              className={`transition-all duration-200 ${
                selected ? 'filter drop-shadow-lg' : ''
              }`}
            />
          </svg>

          {/* Selection indicator */}
          {selected && (
            <div className="absolute inset-0 border-2 border-blue-500 rounded-full pointer-events-none" />
          )}

          {/* Settings button */}
          {selected && (
            <Popover open={showSettings} onOpenChange={setShowSettings}>
              <PopoverTrigger asChild>
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Palette className="h-4 w-4 mr-1" />
                  Style
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 bg-gray-800 border-gray-700" onClick={(e) => e.stopPropagation()}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300">Radius: {localData.radius}px</Label>
                    <Slider
                      min={20}
                      max={150}
                      step={5}
                      value={[localData.radius]}
                      onValueChange={([value]) => setLocalData({ ...localData, radius: value })}
                      className="bg-gray-700"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-300">Fill Color</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={localData.fillColor}
                        onChange={(e) => setLocalData({ ...localData, fillColor: e.target.value })}
                        className="h-10 w-20 cursor-pointer bg-gray-700 border-gray-600"
                      />
                      <Input
                        type="text"
                        value={localData.fillColor}
                        onChange={(e) => setLocalData({ ...localData, fillColor: e.target.value })}
                        className="flex-1 bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-300">Stroke Color</Label>
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
                    <Label className="text-gray-300">Stroke Width: {localData.strokeWidth}px</Label>
                    <Slider
                      min={0}
                      max={20}
                      step={1}
                      value={[localData.strokeWidth]}
                      onValueChange={([value]) => setLocalData({ ...localData, strokeWidth: value })}
                      className="bg-gray-700"
                    />
                  </div>

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
          onClick={data.onToggleResize}
          className="text-gray-300 hover:text-white hover:bg-gray-700"
        >
          <Maximize2 className="mr-2 h-4 w-4" />
          {data.isResizing ? 'Disable Resize' : 'Enable Resize'}
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

export default memo(CircleNode);