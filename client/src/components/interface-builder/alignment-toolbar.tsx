import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  MoreHorizontal,
  MoreVertical,
  Grid3x3,
  Ruler,
  Group,
  Ungroup,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { Node } from 'reactflow';

interface AlignmentToolbarProps {
  selectedNodes: Node[];
  onAlign: (type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void;
  onDistribute: (type: 'horizontal' | 'vertical') => void;
  onGroup?: () => void;
  onUngroup?: () => void;
  onBringToFront?: () => void;
  onSendToBack?: () => void;
  showGrid?: boolean;
  onToggleGrid?: () => void;
  showRulers?: boolean;
  onToggleRulers?: () => void;
  snapToGrid?: boolean;
  onToggleSnapToGrid?: () => void;
}

export default function AlignmentToolbar({
  selectedNodes,
  onAlign,
  onDistribute,
  onGroup,
  onUngroup,
  onBringToFront,
  onSendToBack,
  showGrid = false,
  onToggleGrid,
  showRulers = false,
  onToggleRulers,
  snapToGrid = false,
  onToggleSnapToGrid,
}: AlignmentToolbarProps) {
  const hasSelection = selectedNodes.length > 0;
  const hasMultiSelection = selectedNodes.length > 1;
  const canDistribute = selectedNodes.length > 2;

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1 p-2 bg-gray-800 border border-gray-700 rounded-lg">
        {/* Alignment Tools */}
        <div className="flex items-center gap-1 pr-2 border-r border-gray-600">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onAlign('left')}
                disabled={!hasMultiSelection}
                className="h-8 w-8 p-0"
              >
                <AlignLeft className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Align Left (Ctrl+Shift+L)</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onAlign('center')}
                disabled={!hasMultiSelection}
                className="h-8 w-8 p-0"
              >
                <AlignCenter className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Align Center (Ctrl+Shift+C)</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onAlign('right')}
                disabled={!hasMultiSelection}
                className="h-8 w-8 p-0"
              >
                <AlignRight className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Align Right (Ctrl+Shift+R)</p>
            </TooltipContent>
          </Tooltip>

          <div className="w-px h-6 bg-gray-600 mx-1" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onAlign('top')}
                disabled={!hasMultiSelection}
                className="h-8 w-8 p-0"
              >
                <AlignStartVertical className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Align Top (Ctrl+Shift+T)</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onAlign('middle')}
                disabled={!hasMultiSelection}
                className="h-8 w-8 p-0"
              >
                <AlignCenterVertical className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Align Middle (Ctrl+Shift+M)</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onAlign('bottom')}
                disabled={!hasMultiSelection}
                className="h-8 w-8 p-0"
              >
                <AlignEndVertical className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Align Bottom (Ctrl+Shift+B)</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Distribution Tools */}
        <div className="flex items-center gap-1 px-2 border-r border-gray-600">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDistribute('horizontal')}
                disabled={!canDistribute}
                className="h-8 w-8 p-0"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Distribute Horizontally (Ctrl+Shift+H)</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDistribute('vertical')}
                disabled={!canDistribute}
                className="h-8 w-8 p-0"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Distribute Vertically (Ctrl+Shift+V)</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Grouping Tools */}
        {(onGroup || onUngroup) && (
          <div className="flex items-center gap-1 px-2 border-r border-gray-600">
            {onGroup && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={onGroup}
                    disabled={!hasMultiSelection}
                    className="h-8 w-8 p-0"
                  >
                    <Group className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Group (Ctrl+G)</p>
                </TooltipContent>
              </Tooltip>
            )}

            {onUngroup && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={onUngroup}
                    disabled={!hasSelection}
                    className="h-8 w-8 p-0"
                  >
                    <Ungroup className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Ungroup (Ctrl+Shift+G)</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        )}

        {/* Z-Order Tools */}
        {(onBringToFront || onSendToBack) && (
          <div className="flex items-center gap-1 px-2 border-r border-gray-600">
            {onBringToFront && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={onBringToFront}
                    disabled={!hasSelection}
                    className="h-8 w-8 p-0"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Bring to Front (Ctrl+Shift+])</p>
                </TooltipContent>
              </Tooltip>
            )}

            {onSendToBack && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={onSendToBack}
                    disabled={!hasSelection}
                    className="h-8 w-8 p-0"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Send to Back (Ctrl+Shift+[)</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        )}

        {/* View Tools */}
        <div className="flex items-center gap-1 pl-2">
          {onToggleGrid && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant={showGrid ? 'default' : 'ghost'}
                  onClick={onToggleGrid}
                  className="h-8 w-8 p-0"
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Toggle Grid (Ctrl+Shift+G)</p>
              </TooltipContent>
            </Tooltip>
          )}

          {onToggleRulers && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant={showRulers ? 'default' : 'ghost'}
                  onClick={onToggleRulers}
                  className="h-8 w-8 p-0"
                >
                  <Ruler className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Toggle Rulers (Ctrl+R)</p>
              </TooltipContent>
            </Tooltip>
          )}

          {onToggleSnapToGrid && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant={snapToGrid ? 'default' : 'ghost'}
                  onClick={onToggleSnapToGrid}
                  className="h-8 px-2"
                >
                  Snap
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Toggle Snap to Grid</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}