import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { 
  Type, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  Bold,
  Italic,
  Palette,
  Maximize2
} from "lucide-react";

interface TextFormattingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentSettings: {
    fontSize?: number;
    textAlign?: "left" | "center" | "right";
    fontWeight?: "normal" | "bold";
    fontStyle?: "normal" | "italic";
    color?: string;
    backgroundColor?: string;
    width?: number;
    height?: number;
  };
  onApply: (settings: any) => void;
}

const presetColors = [
  { name: "Black", value: "#000000" },
  { name: "White", value: "#FFFFFF" },
  { name: "Red", value: "#DC2626" },
  { name: "Blue", value: "#2563EB" },
  { name: "Green", value: "#16A34A" },
  { name: "Yellow", value: "#CA8A04" },
  { name: "Purple", value: "#9333EA" },
  { name: "Gray", value: "#6B7280" },
];

const backgroundColors = [
  { name: "Default Yellow", value: "#FEF3C7" },
  { name: "White", value: "#FFFFFF" },
  { name: "Light Blue", value: "#DBEAFE" },
  { name: "Light Green", value: "#D1FAE5" },
  { name: "Light Red", value: "#FEE2E2" },
  { name: "Light Purple", value: "#E9D5FF" },
  { name: "Light Gray", value: "#F3F4F6" },
  { name: "None", value: "transparent" },
];

export function TextFormattingDialog({
  open,
  onOpenChange,
  currentSettings,
  onApply,
}: TextFormattingDialogProps) {
  const [fontSize, setFontSize] = useState(currentSettings.fontSize || 14);
  const [textAlign, setTextAlign] = useState(currentSettings.textAlign || "left");
  const [fontWeight, setFontWeight] = useState(currentSettings.fontWeight || "normal");
  const [fontStyle, setFontStyle] = useState(currentSettings.fontStyle || "normal");
  const [color, setColor] = useState(currentSettings.color || "#000000");
  const [backgroundColor, setBackgroundColor] = useState(currentSettings.backgroundColor || "#FEF3C7");
  const [width, setWidth] = useState(currentSettings.width || 200);
  const [height, setHeight] = useState(currentSettings.height || 100);

  const handleApply = () => {
    onApply({
      fontSize,
      textAlign,
      fontWeight,
      fontStyle,
      color,
      backgroundColor,
      width,
      height,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Text Box Formatting & Size</DialogTitle>
          <DialogDescription>
            Customize the appearance and dimensions of your text box
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Font Size */}
          <div className="space-y-2">
            <Label htmlFor="font-size" className="flex items-center gap-2">
              <Type className="h-4 w-4" />
              Font Size: {fontSize}px
            </Label>
            <Slider
              id="font-size"
              min={10}
              max={48}
              step={1}
              value={[fontSize]}
              onValueChange={(value) => setFontSize(value[0])}
              className="w-full"
            />
          </div>

          {/* Text Alignment */}
          <div className="space-y-2">
            <Label>Text Alignment</Label>
            <RadioGroup value={textAlign} onValueChange={(value: any) => setTextAlign(value)}>
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="left" id="align-left" />
                  <Label htmlFor="align-left" className="flex items-center gap-1 cursor-pointer">
                    <AlignLeft className="h-4 w-4" />
                    Left
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="center" id="align-center" />
                  <Label htmlFor="align-center" className="flex items-center gap-1 cursor-pointer">
                    <AlignCenter className="h-4 w-4" />
                    Center
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="right" id="align-right" />
                  <Label htmlFor="align-right" className="flex items-center gap-1 cursor-pointer">
                    <AlignRight className="h-4 w-4" />
                    Right
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Font Style */}
          <div className="space-y-2">
            <Label>Font Style</Label>
            <div className="flex gap-2">
              <Button
                variant={fontWeight === "bold" ? "default" : "outline"}
                size="sm"
                onClick={() => setFontWeight(fontWeight === "bold" ? "normal" : "bold")}
              >
                <Bold className="h-4 w-4" />
              </Button>
              <Button
                variant={fontStyle === "italic" ? "default" : "outline"}
                size="sm"
                onClick={() => setFontStyle(fontStyle === "italic" ? "normal" : "italic")}
              >
                <Italic className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Text Color */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Text Color
            </Label>
            <div className="flex gap-2 flex-wrap">
              {presetColors.map((presetColor) => (
                <button
                  key={presetColor.value}
                  className={`w-8 h-8 rounded border-2 ${
                    color === presetColor.value ? "border-primary" : "border-gray-300"
                  }`}
                  style={{ backgroundColor: presetColor.value }}
                  onClick={() => setColor(presetColor.value)}
                  title={presetColor.name}
                />
              ))}
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-8 h-8 rounded border-2 border-gray-300 cursor-pointer"
                title="Custom color"
              />
            </div>
          </div>

          {/* Background Color */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Background Color
            </Label>
            <div className="flex gap-2 flex-wrap">
              {backgroundColors.map((bgColor) => (
                <button
                  key={bgColor.value}
                  className={`w-8 h-8 rounded border-2 ${
                    backgroundColor === bgColor.value ? "border-primary" : "border-gray-300"
                  }`}
                  style={{ 
                    backgroundColor: bgColor.value === "transparent" ? "white" : bgColor.value,
                    backgroundImage: bgColor.value === "transparent" 
                      ? "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)"
                      : "none",
                    backgroundSize: "8px 8px",
                    backgroundPosition: "0 0, 0 4px, 4px -4px, -4px 0px"
                  }}
                  onClick={() => setBackgroundColor(bgColor.value)}
                  title={bgColor.name}
                />
              ))}
              <input
                type="color"
                value={backgroundColor === "transparent" ? "#FFFFFF" : backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="w-8 h-8 rounded border-2 border-gray-300 cursor-pointer"
                title="Custom color"
              />
            </div>
          </div>

          {/* Box Size */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Maximize2 className="h-4 w-4" />
              Box Size
            </Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="width" className="text-sm">Width</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="width"
                    type="number"
                    min={100}
                    max={800}
                    value={width}
                    onChange={(e) => setWidth(Number(e.target.value))}
                    className="w-20"
                  />
                  <span className="text-sm text-gray-500">px</span>
                </div>
              </div>
              <div>
                <Label htmlFor="height" className="text-sm">Height</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="height"
                    type="number"
                    min={50}
                    max={600}
                    value={height}
                    onChange={(e) => setHeight(Number(e.target.value))}
                    className="w-20"
                  />
                  <span className="text-sm text-gray-500">px</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setWidth(200);
                  setHeight(100);
                }}
              >
                Small
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setWidth(300);
                  setHeight(150);
                }}
              >
                Medium
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setWidth(400);
                  setHeight(200);
                }}
              >
                Large
              </Button>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label>Preview</Label>
            <div 
              className="p-4 border rounded-lg overflow-auto"
              style={{
                backgroundColor: backgroundColor === "transparent" ? "#f9fafb" : backgroundColor,
                width: Math.min(width, 450) + "px",
                height: Math.min(height, 200) + "px",
              }}
            >
              <p
                style={{
                  fontSize: `${fontSize}px`,
                  textAlign: textAlign,
                  fontWeight: fontWeight,
                  fontStyle: fontStyle,
                  color: color,
                }}
              >
                This is a preview of your text formatting
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleApply}>
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}