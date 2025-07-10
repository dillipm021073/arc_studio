import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Type,
  Palette,
  Square,
  Maximize2,
} from "lucide-react";

interface TextNodeData {
  text: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  fontStyle: string;
  textDecoration: string;
  textAlign: string;
  color: string;
  backgroundColor: string;
  borderRadius: number;
  padding: number;
  width: number;
  height: number;
}

interface TextEditorDialogProps {
  open: boolean;
  onClose: () => void;
  initialData: TextNodeData;
  onSave: (data: TextNodeData) => void;
}

export default function TextEditorDialog({
  open,
  onClose,
  initialData,
  onSave,
}: TextEditorDialogProps) {
  const [data, setData] = useState<TextNodeData>(initialData);

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const handleSave = () => {
    onSave(data);
    onClose();
  };

  const updateData = (updates: Partial<TextNodeData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const toggleFormat = (format: 'bold' | 'italic' | 'underline') => {
    switch (format) {
      case 'bold':
        updateData({ fontWeight: data.fontWeight === 'bold' ? 'normal' : 'bold' });
        break;
      case 'italic':
        updateData({ fontStyle: data.fontStyle === 'italic' ? 'normal' : 'italic' });
        break;
      case 'underline':
        updateData({ textDecoration: data.textDecoration === 'underline' ? 'none' : 'underline' });
        break;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Type className="h-5 w-5" />
            Text Editor
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Text Input */}
          <div className="space-y-2">
            <Label htmlFor="text" className="text-gray-300">Text Content</Label>
            <Textarea
              id="text"
              value={data.text}
              onChange={(e) => updateData({ text: e.target.value })}
              placeholder="Enter your text here..."
              className="min-h-[150px] bg-gray-800 border-gray-700 text-white placeholder-gray-500"
              style={{
                fontFamily: data.fontFamily,
                fontSize: `${data.fontSize}px`,
                fontWeight: data.fontWeight,
                fontStyle: data.fontStyle,
                textDecoration: data.textDecoration,
                textAlign: data.textAlign as any,
                color: data.color,
              }}
            />
          </div>

          {/* Formatting Toolbar */}
          <div className="space-y-2">
            <Label className="text-gray-300 flex items-center gap-2">
              <Type className="h-4 w-4" />
              Text Formatting
            </Label>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Font Size */}
              <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2">
                <Label className="text-gray-400 text-sm">Size:</Label>
                <Input
                  type="number"
                  value={data.fontSize}
                  onChange={(e) => updateData({ fontSize: parseInt(e.target.value) || 16 })}
                  className="w-16 h-8 bg-gray-700 border-gray-600 text-white"
                  min="8"
                  max="72"
                />
              </div>

              {/* Font Family */}
              <Select value={data.fontFamily} onValueChange={(value) => updateData({ fontFamily: value })}>
                <SelectTrigger className="w-40 h-8 bg-gray-800 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="sans-serif" className="text-gray-300">Sans Serif</SelectItem>
                  <SelectItem value="serif" className="text-gray-300">Serif</SelectItem>
                  <SelectItem value="monospace" className="text-gray-300">Monospace</SelectItem>
                  <SelectItem value="cursive" className="text-gray-300">Display</SelectItem>
                  <SelectItem value="fantasy" className="text-gray-300">Handwriting</SelectItem>
                </SelectContent>
              </Select>

              {/* Format Buttons */}
              <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1">
                <Button
                  size="sm"
                  variant={data.fontWeight === 'bold' ? 'secondary' : 'ghost'}
                  onClick={() => toggleFormat('bold')}
                  className="h-8 w-8 p-0"
                >
                  <Bold className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant={data.fontStyle === 'italic' ? 'secondary' : 'ghost'}
                  onClick={() => toggleFormat('italic')}
                  className="h-8 w-8 p-0"
                >
                  <Italic className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant={data.textDecoration === 'underline' ? 'secondary' : 'ghost'}
                  onClick={() => toggleFormat('underline')}
                  className="h-8 w-8 p-0"
                >
                  <Underline className="h-4 w-4" />
                </Button>
              </div>

              {/* Alignment */}
              <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1">
                <Button
                  size="sm"
                  variant={data.textAlign === 'left' ? 'secondary' : 'ghost'}
                  onClick={() => updateData({ textAlign: 'left' })}
                  className="h-8 w-8 p-0"
                >
                  <AlignLeft className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant={data.textAlign === 'center' ? 'secondary' : 'ghost'}
                  onClick={() => updateData({ textAlign: 'center' })}
                  className="h-8 w-8 p-0"
                >
                  <AlignCenter className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant={data.textAlign === 'right' ? 'secondary' : 'ghost'}
                  onClick={() => updateData({ textAlign: 'right' })}
                  className="h-8 w-8 p-0"
                >
                  <AlignRight className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant={data.textAlign === 'justify' ? 'secondary' : 'ghost'}
                  onClick={() => updateData({ textAlign: 'justify' })}
                  className="h-8 w-8 p-0"
                >
                  <AlignJustify className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Colors */}
          <div className="space-y-2">
            <Label className="text-gray-300 flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Colors
            </Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="textColor" className="text-gray-400 text-sm">Text Color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="textColor"
                    type="color"
                    value={data.color}
                    onChange={(e) => updateData({ color: e.target.value })}
                    className="h-10 w-20 cursor-pointer bg-gray-800 border-gray-700"
                  />
                  <Input
                    type="text"
                    value={data.color}
                    onChange={(e) => updateData({ color: e.target.value })}
                    className="flex-1 bg-gray-800 border-gray-700 text-white"
                    placeholder="#000000"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bgColor" className="text-gray-400 text-sm">Background Color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="bgColor"
                    type="color"
                    value={data.backgroundColor}
                    onChange={(e) => updateData({ backgroundColor: e.target.value })}
                    className="h-10 w-20 cursor-pointer bg-gray-800 border-gray-700"
                  />
                  <Input
                    type="text"
                    value={data.backgroundColor}
                    onChange={(e) => updateData({ backgroundColor: e.target.value })}
                    className="flex-1 bg-gray-800 border-gray-700 text-white"
                    placeholder="#FFFFFF"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Box Properties */}
          <div className="space-y-2">
            <Label className="text-gray-300 flex items-center gap-2">
              <Square className="h-4 w-4" />
              Box Properties
            </Label>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="borderRadius" className="text-gray-400 text-sm">
                  Border Radius: {data.borderRadius}px
                </Label>
                <Slider
                  id="borderRadius"
                  min={0}
                  max={50}
                  step={1}
                  value={[data.borderRadius]}
                  onValueChange={([value]) => updateData({ borderRadius: value })}
                  className="bg-gray-800"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="padding" className="text-gray-400 text-sm">
                  Padding: {data.padding}px
                </Label>
                <Slider
                  id="padding"
                  min={0}
                  max={50}
                  step={1}
                  value={[data.padding]}
                  onValueChange={([value]) => updateData({ padding: value })}
                  className="bg-gray-800"
                />
              </div>
            </div>
          </div>

          {/* Size */}
          <div className="space-y-2">
            <Label className="text-gray-300 flex items-center gap-2">
              <Maximize2 className="h-4 w-4" />
              Size
            </Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="width" className="text-gray-400 text-sm">Width</Label>
                <Input
                  id="width"
                  type="number"
                  value={data.width}
                  onChange={(e) => updateData({ width: parseInt(e.target.value) || 200 })}
                  className="bg-gray-800 border-gray-700 text-white"
                  min="50"
                  max="800"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height" className="text-gray-400 text-sm">Height</Label>
                <Input
                  id="height"
                  type="number"
                  value={data.height}
                  onChange={(e) => updateData({ height: parseInt(e.target.value) || 100 })}
                  className="bg-gray-800 border-gray-700 text-white"
                  min="30"
                  max="600"
                />
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label className="text-gray-300">Preview</Label>
            <div className="border border-gray-700 rounded-lg p-4 bg-gray-800">
              <div
                style={{
                  width: `${data.width}px`,
                  height: `${data.height}px`,
                  backgroundColor: data.backgroundColor,
                  color: data.color,
                  borderRadius: `${data.borderRadius}px`,
                  padding: `${data.padding}px`,
                  fontFamily: data.fontFamily,
                  fontSize: `${data.fontSize}px`,
                  fontWeight: data.fontWeight,
                  fontStyle: data.fontStyle,
                  textDecoration: data.textDecoration,
                  textAlign: data.textAlign as any,
                  overflow: 'auto',
                  margin: '0 auto',
                }}
                className="border border-gray-600"
              >
                {data.text || 'Preview text'}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} className="border-gray-700 text-gray-300">
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}