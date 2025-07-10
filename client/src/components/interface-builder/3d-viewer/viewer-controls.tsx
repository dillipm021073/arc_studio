import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Eye,
  EyeOff,
  Layers,
  Activity,
  Palette,
  Settings,
  Play,
  Pause,
  SkipBack,
  Info
} from 'lucide-react';

interface ViewerControlsProps {
  onResetView?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onToggleAnimation?: (enabled: boolean) => void;
  onToggleLabels?: (enabled: boolean) => void;
  onToggleGrid?: (enabled: boolean) => void;
  onToggleConnections?: (enabled: boolean) => void;
  onSpeedChange?: (speed: number) => void;
  animationEnabled?: boolean;
  labelsEnabled?: boolean;
  gridEnabled?: boolean;
  connectionsEnabled?: boolean;
  animationSpeed?: number;
  nodeCount?: number;
  edgeCount?: number;
}

export default function ViewerControls({
  onResetView,
  onZoomIn,
  onZoomOut,
  onToggleAnimation,
  onToggleLabels,
  onToggleGrid,
  onToggleConnections,
  onSpeedChange,
  animationEnabled = true,
  labelsEnabled = true,
  gridEnabled = true,
  connectionsEnabled = true,
  animationSpeed = 1,
  nodeCount = 0,
  edgeCount = 0
}: ViewerControlsProps) {
  const [selectedLayer, setSelectedLayer] = useState('all');

  return (
    <Card className="bg-gray-800/95 border-gray-700 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm text-white flex items-center gap-2">
          <Eye className="h-4 w-4" />
          3D Viewer Controls
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-gray-700/50 p-2 rounded">
            <div className="text-gray-400">Nodes</div>
            <div className="text-white font-medium">{nodeCount}</div>
          </div>
          <div className="bg-gray-700/50 p-2 rounded">
            <div className="text-gray-400">Connections</div>
            <div className="text-white font-medium">{edgeCount}</div>
          </div>
        </div>

        <Separator className="bg-gray-700" />

        {/* Camera Controls */}
        <div className="space-y-2">
          <Label className="text-xs text-gray-400 uppercase tracking-wide">Camera</Label>
          <div className="flex gap-1">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={onResetView}
              className="flex-1 border-gray-600 hover:bg-gray-700 text-xs"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={onZoomIn}
              className="border-gray-600 hover:bg-gray-700"
            >
              <ZoomIn className="h-3 w-3" />
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={onZoomOut}
              className="border-gray-600 hover:bg-gray-700"
            >
              <ZoomOut className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* View Options */}
        <div className="space-y-3">
          <Label className="text-xs text-gray-400 uppercase tracking-wide">Display</Label>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="labels" className="text-xs text-white">Node Labels</Label>
            <Switch 
              id="labels"
              checked={labelsEnabled}
              onCheckedChange={onToggleLabels}
              className="data-[state=checked]:bg-blue-600"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="connections" className="text-xs text-white">Connections</Label>
            <Switch 
              id="connections"
              checked={connectionsEnabled}
              onCheckedChange={onToggleConnections}
              className="data-[state=checked]:bg-blue-600"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="grid" className="text-xs text-white">Grid Helper</Label>
            <Switch 
              id="grid"
              checked={gridEnabled}
              onCheckedChange={onToggleGrid}
              className="data-[state=checked]:bg-blue-600"
            />
          </div>
        </div>

        <Separator className="bg-gray-700" />

        {/* Animation Controls */}
        <div className="space-y-3">
          <Label className="text-xs text-gray-400 uppercase tracking-wide">Animation</Label>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="animation" className="text-xs text-white">Enable Animation</Label>
            <Switch 
              id="animation"
              checked={animationEnabled}
              onCheckedChange={onToggleAnimation}
              className="data-[state=checked]:bg-blue-600"
            />
          </div>
          
          {animationEnabled && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-white">Speed</Label>
                <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">
                  {animationSpeed}x
                </Badge>
              </div>
              <Slider
                value={[animationSpeed]}
                onValueChange={(value) => onSpeedChange?.(value[0])}
                max={3}
                min={0.1}
                step={0.1}
                className="w-full"
              />
            </div>
          )}
        </div>

        <Separator className="bg-gray-700" />

        {/* Layer Filters */}
        <div className="space-y-2">
          <Label className="text-xs text-gray-400 uppercase tracking-wide">Layers</Label>
          <div className="grid grid-cols-2 gap-1">
            <Button
              size="sm"
              variant={selectedLayer === 'all' ? 'default' : 'outline'}
              onClick={() => setSelectedLayer('all')}
              className="text-xs border-gray-600 hover:bg-gray-700"
            >
              <Layers className="h-3 w-3 mr-1" />
              All
            </Button>
            <Button
              size="sm"
              variant={selectedLayer === 'apps' ? 'default' : 'outline'}
              onClick={() => setSelectedLayer('apps')}
              className="text-xs border-gray-600 hover:bg-gray-700"
            >
              <Activity className="h-3 w-3 mr-1" />
              Apps
            </Button>
            <Button
              size="sm"
              variant={selectedLayer === 'interfaces' ? 'default' : 'outline'}
              onClick={() => setSelectedLayer('interfaces')}
              className="text-xs border-gray-600 hover:bg-gray-700"
            >
              <Palette className="h-3 w-3 mr-1" />
              APIs
            </Button>
            <Button
              size="sm"
              variant={selectedLayer === 'processes' ? 'default' : 'outline'}
              onClick={() => setSelectedLayer('processes')}
              className="text-xs border-gray-600 hover:bg-gray-700"
            >
              <Settings className="h-3 w-3 mr-1" />
              Process
            </Button>
          </div>
        </div>

        <Separator className="bg-gray-700" />

        {/* Legend */}
        <div className="space-y-2">
          <Label className="text-xs text-gray-400 uppercase tracking-wide">Legend</Label>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span className="text-gray-300">Web/Mobile Apps</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-gray-300">Backend Services</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 bg-gray-500 rounded"></div>
              <span className="text-gray-300">Databases</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 bg-orange-500 rounded"></div>
              <span className="text-gray-300">Message Queues</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 bg-indigo-500 rounded"></div>
              <span className="text-gray-300">Business Processes</span>
            </div>
          </div>
        </div>

        {/* Help */}
        <div className="bg-blue-900/20 p-2 rounded border border-blue-800/30">
          <div className="flex items-start gap-2">
            <Info className="h-3 w-3 text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-300">
              <div className="font-medium mb-1">Controls:</div>
              <div>• Left click + drag: Rotate</div>
              <div>• Right click + drag: Pan</div>
              <div>• Scroll: Zoom in/out</div>
              <div>• Click nodes: Select</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}