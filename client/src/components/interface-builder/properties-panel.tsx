import { useState, useEffect } from 'react';
import { Node } from 'reactflow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  Palette, 
  Type, 
  Square, 
  Sun, 
  Droplet,
  PaintBucket,
  Minus,
  ArrowRight,
  RefreshCw,
  X
} from 'lucide-react';

interface PropertiesPanelProps {
  selectedNodes: Node[];
  onUpdate: (nodeId: string, data: any) => void;
}

const predefinedColors = [
  '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00',
  '#FF00FF', '#00FFFF', '#808080', '#800000', '#008000', '#000080',
  '#808000', '#800080', '#008080', '#C0C0C0', '#FF6B6B', '#4ECDC4',
  '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
];

const fillPatterns = [
  { value: 'solid', label: 'Solid', icon: Square },
  { value: 'none', label: 'None', icon: X },
  { value: 'gradient', label: 'Gradient', icon: Droplet },
  { value: 'pattern', label: 'Pattern', icon: PaintBucket },
];

const lineStyles = [
  { value: 'solid', label: 'Solid', icon: Minus },
  { value: 'dashed', label: 'Dashed', icon: Minus },
  { value: 'dotted', label: 'Dotted', icon: Minus },
  { value: 'double', label: 'Double', icon: Minus },
];

const arrowStyles = [
  { value: 'none', label: 'None' },
  { value: 'arrow', label: 'Arrow' },
  { value: 'diamond', label: 'Diamond' },
  { value: 'circle', label: 'Circle' },
];

export default function PropertiesPanel({ selectedNodes, onUpdate }: PropertiesPanelProps) {
  const [activeTab, setActiveTab] = useState('shape');
  
  // Get common properties from selected nodes
  const getCommonProperty = (property: string, defaultValue: any = '') => {
    if (selectedNodes.length === 0) return defaultValue;
    const firstValue = selectedNodes[0].data[property] ?? defaultValue;
    const allSame = selectedNodes.every(node => (node.data[property] ?? defaultValue) === firstValue);
    return allSame ? firstValue : defaultValue;
  };

  // Update all selected nodes
  const updateSelectedNodes = (updates: any) => {
    selectedNodes.forEach(node => {
      onUpdate(node.id, { ...node.data, ...updates });
    });
  };

  if (selectedNodes.length === 0) {
    return (
      <Card className="w-80 h-full bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Properties</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400 text-sm">Select a shape to edit its properties</p>
        </CardContent>
      </Card>
    );
  }

  const selectedCount = selectedNodes.length;
  const nodeType = selectedNodes[0].type;

  return (
    <Card className="w-80 h-full bg-gray-800 border-gray-700 overflow-y-auto">
      <CardHeader>
        <CardTitle className="text-white">
          Properties
          {selectedCount > 1 && (
            <span className="text-sm font-normal text-gray-400 ml-2">
              ({selectedCount} selected)
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 bg-gray-700">
            <TabsTrigger value="shape">Shape</TabsTrigger>
            <TabsTrigger value="text">Text</TabsTrigger>
            <TabsTrigger value="effects">Effects</TabsTrigger>
          </TabsList>

          {/* Shape Properties */}
          <TabsContent value="shape" className="space-y-4">
            {/* Fill Color */}
            <div>
              <Label className="text-white mb-2 flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Fill
              </Label>
              <div className="flex gap-2">
                <Select
                  value={getCommonProperty('fillPattern', 'solid')}
                  onValueChange={(value) => updateSelectedNodes({ fillPattern: value })}
                >
                  <SelectTrigger className="w-32 bg-gray-700 border-gray-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fillPatterns.map(pattern => (
                      <SelectItem key={pattern.value} value={pattern.value}>
                        <div className="flex items-center gap-2">
                          <pattern.icon className="h-4 w-4" />
                          {pattern.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2 bg-gray-700 border-gray-600"
                    >
                      <div
                        className="w-4 h-4 rounded border border-gray-400"
                        style={{ backgroundColor: getCommonProperty('fillColor', '#ffffff') }}
                      />
                      {getCommonProperty('fillColor', '#ffffff')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 bg-gray-800 border-gray-700">
                    <div className="grid grid-cols-6 gap-2 mb-4">
                      {predefinedColors.map(color => (
                        <button
                          key={color}
                          className="w-8 h-8 rounded border border-gray-600 hover:scale-110 transition-transform"
                          style={{ backgroundColor: color }}
                          onClick={() => updateSelectedNodes({ fillColor: color })}
                        />
                      ))}
                    </div>
                    <Input
                      type="color"
                      value={getCommonProperty('fillColor', '#ffffff')}
                      onChange={(e) => updateSelectedNodes({ fillColor: e.target.value })}
                      className="w-full h-10"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              {/* Opacity */}
              <div className="mt-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Opacity</span>
                  <span className="text-white">{getCommonProperty('fillOpacity', 100)}%</span>
                </div>
                <Slider
                  value={[getCommonProperty('fillOpacity', 100)]}
                  onValueChange={([value]) => updateSelectedNodes({ fillOpacity: value })}
                  max={100}
                  step={5}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Stroke Properties */}
            <div>
              <Label className="text-white mb-2">Border</Label>
              <div className="space-y-2">
                {/* Stroke Color */}
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="flex-1 justify-start gap-2 bg-gray-700 border-gray-600"
                      >
                        <div
                          className="w-4 h-4 rounded border border-gray-400"
                          style={{ backgroundColor: getCommonProperty('strokeColor', '#000000') }}
                        />
                        {getCommonProperty('strokeColor', '#000000')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 bg-gray-800 border-gray-700">
                      <div className="grid grid-cols-6 gap-2 mb-4">
                        {predefinedColors.map(color => (
                          <button
                            key={color}
                            className="w-8 h-8 rounded border border-gray-600 hover:scale-110 transition-transform"
                            style={{ backgroundColor: color }}
                            onClick={() => updateSelectedNodes({ strokeColor: color })}
                          />
                        ))}
                      </div>
                      <Input
                        type="color"
                        value={getCommonProperty('strokeColor', '#000000')}
                        onChange={(e) => updateSelectedNodes({ strokeColor: e.target.value })}
                        className="w-full h-10"
                      />
                    </PopoverContent>
                  </Popover>
                  
                  <Select
                    value={getCommonProperty('strokeStyle', 'solid')}
                    onValueChange={(value) => updateSelectedNodes({ strokeStyle: value })}
                  >
                    <SelectTrigger className="w-32 bg-gray-700 border-gray-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {lineStyles.map(style => (
                        <SelectItem key={style.value} value={style.value}>
                          {style.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Stroke Width */}
                <div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Width</span>
                    <span className="text-white">{getCommonProperty('strokeWidth', 1)}px</span>
                  </div>
                  <Slider
                    value={[getCommonProperty('strokeWidth', 1)]}
                    onValueChange={([value]) => updateSelectedNodes({ strokeWidth: value })}
                    min={0}
                    max={10}
                    step={0.5}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Size & Position */}
            <div>
              <Label className="text-white mb-2">Size & Position</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-gray-400">Width</Label>
                  <Input
                    type="number"
                    value={getCommonProperty('width', 150)}
                    onChange={(e) => updateSelectedNodes({ width: parseInt(e.target.value) })}
                    className="bg-gray-700 border-gray-600"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-400">Height</Label>
                  <Input
                    type="number"
                    value={getCommonProperty('height', 100)}
                    onChange={(e) => updateSelectedNodes({ height: parseInt(e.target.value) })}
                    className="bg-gray-700 border-gray-600"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-400">X</Label>
                  <Input
                    type="number"
                    value={Math.round(selectedNodes[0].position.x)}
                    onChange={(e) => {
                      const newX = parseInt(e.target.value);
                      selectedNodes.forEach(node => {
                        onUpdate(node.id, { 
                          ...node.data,
                          position: { ...node.position, x: newX }
                        });
                      });
                    }}
                    className="bg-gray-700 border-gray-600"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-400">Y</Label>
                  <Input
                    type="number"
                    value={Math.round(selectedNodes[0].position.y)}
                    onChange={(e) => {
                      const newY = parseInt(e.target.value);
                      selectedNodes.forEach(node => {
                        onUpdate(node.id, { 
                          ...node.data,
                          position: { ...node.position, y: newY }
                        });
                      });
                    }}
                    className="bg-gray-700 border-gray-600"
                  />
                </div>
              </div>
              
              {/* Rotation */}
              <div className="mt-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400 flex items-center gap-1">
                    <RefreshCw className="h-3 w-3" />
                    Rotation
                  </span>
                  <span className="text-white">{getCommonProperty('rotation', 0)}°</span>
                </div>
                <Slider
                  value={[getCommonProperty('rotation', 0)]}
                  onValueChange={([value]) => updateSelectedNodes({ rotation: value })}
                  min={0}
                  max={360}
                  step={15}
                  className="mt-1"
                />
              </div>
            </div>
          </TabsContent>

          {/* Text Properties */}
          <TabsContent value="text" className="space-y-4">
            <div>
              <Label className="text-white mb-2 flex items-center gap-2">
                <Type className="h-4 w-4" />
                Text Content
              </Label>
              <Input
                value={getCommonProperty('text', '')}
                onChange={(e) => updateSelectedNodes({ text: e.target.value })}
                placeholder="Enter text..."
                className="bg-gray-700 border-gray-600"
              />
            </div>

            <div>
              <Label className="text-white mb-2">Font</Label>
              <div className="space-y-2">
                <Select
                  value={getCommonProperty('fontFamily', 'sans-serif')}
                  onValueChange={(value) => updateSelectedNodes({ fontFamily: value })}
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sans-serif">Sans Serif</SelectItem>
                    <SelectItem value="serif">Serif</SelectItem>
                    <SelectItem value="monospace">Monospace</SelectItem>
                    <SelectItem value="Arial">Arial</SelectItem>
                    <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                    <SelectItem value="Courier New">Courier New</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label className="text-xs text-gray-400">Size</Label>
                    <Input
                      type="number"
                      value={getCommonProperty('fontSize', 14)}
                      onChange={(e) => updateSelectedNodes({ fontSize: parseInt(e.target.value) })}
                      min={8}
                      max={72}
                      className="bg-gray-700 border-gray-600"
                    />
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs text-gray-400">Color</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start gap-2 bg-gray-700 border-gray-600"
                        >
                          <div
                            className="w-4 h-4 rounded border border-gray-400"
                            style={{ backgroundColor: getCommonProperty('textColor', '#000000') }}
                          />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 bg-gray-800 border-gray-700">
                        <div className="grid grid-cols-6 gap-2 mb-4">
                          {predefinedColors.map(color => (
                            <button
                              key={color}
                              className="w-8 h-8 rounded border border-gray-600 hover:scale-110 transition-transform"
                              style={{ backgroundColor: color }}
                              onClick={() => updateSelectedNodes({ textColor: color })}
                            />
                          ))}
                        </div>
                        <Input
                          type="color"
                          value={getCommonProperty('textColor', '#000000')}
                          onChange={(e) => updateSelectedNodes({ textColor: e.target.value })}
                          className="w-full h-10"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-gray-400">Alignment</Label>
                  <Select
                    value={getCommonProperty('textAlign', 'center')}
                    onValueChange={(value) => updateSelectedNodes({ textAlign: value })}
                  >
                    <SelectTrigger className="bg-gray-700 border-gray-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm text-gray-300">
                    <input
                      type="checkbox"
                      checked={getCommonProperty('fontWeight', 'normal') === 'bold'}
                      onChange={(e) => updateSelectedNodes({ fontWeight: e.target.checked ? 'bold' : 'normal' })}
                      className="rounded border-gray-600"
                    />
                    Bold
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-300">
                    <input
                      type="checkbox"
                      checked={getCommonProperty('fontStyle', 'normal') === 'italic'}
                      onChange={(e) => updateSelectedNodes({ fontStyle: e.target.checked ? 'italic' : 'normal' })}
                      className="rounded border-gray-600"
                    />
                    Italic
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-300">
                    <input
                      type="checkbox"
                      checked={getCommonProperty('textDecoration', 'none') === 'underline'}
                      onChange={(e) => updateSelectedNodes({ textDecoration: e.target.checked ? 'underline' : 'none' })}
                      className="rounded border-gray-600"
                    />
                    Underline
                  </label>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Effects */}
          <TabsContent value="effects" className="space-y-4">
            <div>
              <Label className="text-white mb-2 flex items-center gap-2">
                <Sun className="h-4 w-4" />
                Shadow
              </Label>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Enable Shadow</span>
                  <Switch
                    checked={getCommonProperty('shadowEnabled', false)}
                    onCheckedChange={(checked) => updateSelectedNodes({ shadowEnabled: checked })}
                  />
                </div>
                
                {getCommonProperty('shadowEnabled', false) && (
                  <>
                    <div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Offset X</span>
                        <span className="text-white">{getCommonProperty('shadowOffsetX', 2)}px</span>
                      </div>
                      <Slider
                        value={[getCommonProperty('shadowOffsetX', 2)]}
                        onValueChange={([value]) => updateSelectedNodes({ shadowOffsetX: value })}
                        min={-20}
                        max={20}
                        step={1}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Offset Y</span>
                        <span className="text-white">{getCommonProperty('shadowOffsetY', 2)}px</span>
                      </div>
                      <Slider
                        value={[getCommonProperty('shadowOffsetY', 2)]}
                        onValueChange={([value]) => updateSelectedNodes({ shadowOffsetY: value })}
                        min={-20}
                        max={20}
                        step={1}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Blur</span>
                        <span className="text-white">{getCommonProperty('shadowBlur', 4)}px</span>
                      </div>
                      <Slider
                        value={[getCommonProperty('shadowBlur', 4)]}
                        onValueChange={([value]) => updateSelectedNodes({ shadowBlur: value })}
                        min={0}
                        max={20}
                        step={1}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-xs text-gray-400">Shadow Color</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start gap-2 bg-gray-700 border-gray-600"
                          >
                            <div
                              className="w-4 h-4 rounded border border-gray-400"
                              style={{ backgroundColor: getCommonProperty('shadowColor', '#000000') }}
                            />
                            {getCommonProperty('shadowColor', '#000000')}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 bg-gray-800 border-gray-700">
                          <div className="grid grid-cols-6 gap-2 mb-4">
                            {predefinedColors.map(color => (
                              <button
                                key={color}
                                className="w-8 h-8 rounded border border-gray-600 hover:scale-110 transition-transform"
                                style={{ backgroundColor: color }}
                                onClick={() => updateSelectedNodes({ shadowColor: color })}
                              />
                            ))}
                          </div>
                          <Input
                            type="color"
                            value={getCommonProperty('shadowColor', '#000000')}
                            onChange={(e) => updateSelectedNodes({ shadowColor: e.target.value })}
                            className="w-full h-10"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div>
              <Label className="text-white mb-2">Corner Radius</Label>
              <div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Radius</span>
                  <span className="text-white">{getCommonProperty('borderRadius', 0)}px</span>
                </div>
                <Slider
                  value={[getCommonProperty('borderRadius', 0)]}
                  onValueChange={([value]) => updateSelectedNodes({ borderRadius: value })}
                  min={0}
                  max={50}
                  step={1}
                  className="mt-1"
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}