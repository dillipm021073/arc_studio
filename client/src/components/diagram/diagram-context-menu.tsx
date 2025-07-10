import { useEffect, useRef } from "react";
import { Copy, Trash2, Clipboard, Edit, Info, Type, Palette, ArrowUp, ArrowDown, ChevronUp, ChevronDown } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

interface DiagramContextMenuProps {
  children: React.ReactNode;
  onCopy: () => void;
  onPaste: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onViewDetails: () => void;
  onAddTextBox?: () => void;
  onTextFormatting?: () => void;
  onBringToFront?: () => void;
  onSendToBack?: () => void;
  onBringForward?: () => void;
  onSendBackward?: () => void;
  hasCopiedNode: boolean;
  isTextNode?: boolean;
  currentLayer?: number;
  maxLayer?: number;
  minLayer?: number;
}

export default function DiagramContextMenu({
  children,
  onCopy,
  onPaste,
  onDelete,
  onEdit,
  onViewDetails,
  onAddTextBox,
  onTextFormatting,
  onBringToFront,
  onSendToBack,
  onBringForward,
  onSendBackward,
  hasCopiedNode,
  isTextNode = false,
  currentLayer = 1,
  maxLayer = 100,
  minLayer = 0,
}: DiagramContextMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        {onAddTextBox && (
          <>
            <ContextMenuItem onClick={onAddTextBox}>
              <Type className="mr-2 h-4 w-4" />
              Add Text Box
            </ContextMenuItem>
            <ContextMenuSeparator />
          </>
        )}
        <ContextMenuItem onClick={onViewDetails}>
          <Info className="mr-2 h-4 w-4" />
          View Details
          <ContextMenuShortcut>Double Click</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem onClick={onEdit}>
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </ContextMenuItem>
        {isTextNode && onTextFormatting && (
          <ContextMenuItem onClick={onTextFormatting}>
            <Palette className="mr-2 h-4 w-4" />
            Format & Resize
            <ContextMenuShortcut>Font, Color & Size</ContextMenuShortcut>
          </ContextMenuItem>
        )}
        <ContextMenuSeparator />
        
        {/* Layering Controls */}
        {(onBringToFront || onSendToBack || onBringForward || onSendBackward) && (
          <>
            {onBringToFront && (
              <ContextMenuItem 
                onClick={onBringToFront}
                disabled={currentLayer >= maxLayer}
              >
                <ArrowUp className="mr-2 h-4 w-4" />
                Bring to Front
                <ContextMenuShortcut>Layer {maxLayer}</ContextMenuShortcut>
              </ContextMenuItem>
            )}
            {onBringForward && (
              <ContextMenuItem 
                onClick={onBringForward}
                disabled={currentLayer >= maxLayer}
              >
                <ChevronUp className="mr-2 h-4 w-4" />
                Bring Forward
                <ContextMenuShortcut>Layer {currentLayer + 1}</ContextMenuShortcut>
              </ContextMenuItem>
            )}
            {onSendBackward && (
              <ContextMenuItem 
                onClick={onSendBackward}
                disabled={currentLayer <= minLayer}
              >
                <ChevronDown className="mr-2 h-4 w-4" />
                Send Backward
                <ContextMenuShortcut>Layer {currentLayer - 1}</ContextMenuShortcut>
              </ContextMenuItem>
            )}
            {onSendToBack && (
              <ContextMenuItem 
                onClick={onSendToBack}
                disabled={currentLayer <= minLayer}
              >
                <ArrowDown className="mr-2 h-4 w-4" />
                Send to Back
                <ContextMenuShortcut>Layer {minLayer}</ContextMenuShortcut>
              </ContextMenuItem>
            )}
            <ContextMenuSeparator />
          </>
        )}
        
        <ContextMenuItem onClick={onCopy}>
          <Copy className="mr-2 h-4 w-4" />
          Copy
          <ContextMenuShortcut>⌘C</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem onClick={onPaste} disabled={!hasCopiedNode}>
          <Clipboard className="mr-2 h-4 w-4" />
          Paste
          <ContextMenuShortcut>⌘V</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={onDelete} className="text-destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
          <ContextMenuShortcut>Del</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}