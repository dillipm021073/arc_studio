import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ArtifactState, ArtifactVisuals, getArtifactVisuals } from "@/lib/artifact-state-utils";
import { cn } from "@/lib/utils";

interface ArtifactStatusBadgeProps {
  state: ArtifactState;
  showIcon?: boolean;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function ArtifactStatusBadge({ 
  state, 
  showIcon = true, 
  showText = true,
  size = 'sm' 
}: ArtifactStatusBadgeProps) {
  const visuals = getArtifactVisuals(state);
  
  if (state.state === 'production' && !showText) return null;

  const IconComponent = visuals.iconComponent;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="secondary" 
            className={cn(
              "flex items-center gap-1",
              visuals.badgeColor,
              size === 'sm' && "text-xs px-2 py-0.5",
              size === 'md' && "text-sm px-2 py-1", 
              size === 'lg' && "text-base px-3 py-1"
            )}
          >
            {showIcon && IconComponent && (
              <IconComponent className={cn(
                visuals.iconColor,
                size === 'sm' && "h-3 w-3",
                size === 'md' && "h-4 w-4",
                size === 'lg' && "h-5 w-5"
              )} />
            )}
            {showText && visuals.badgeText && (
              <span>{visuals.badgeText}</span>
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{visuals.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface ArtifactStatusIndicatorProps {
  state: ArtifactState;
  initiativeName?: string;
}

export function ArtifactStatusIndicator({ state, initiativeName }: ArtifactStatusIndicatorProps) {
  const visuals = getArtifactVisuals(state);
  const IconComponent = visuals.iconComponent;

  if (!IconComponent) return null;

  let tooltipText = visuals.tooltip;
  if (initiativeName && (state.isCheckedOut || state.hasInitiativeChanges)) {
    tooltipText += ` in ${initiativeName}`;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <IconComponent className={cn("h-4 w-4", visuals.iconColor)} />
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface StatusColumnProps {
  state: ArtifactState;
  compact?: boolean;
}

export function StatusColumn({ state, compact = false }: StatusColumnProps) {
  const visuals = getArtifactVisuals(state);
  const IconComponent = visuals.iconComponent;

  return (
    <div className="flex items-center gap-2">
      {IconComponent && (
        <IconComponent className={cn("h-4 w-4", visuals.iconColor)} />
      )}
      {!compact && (
        <Badge 
          variant="secondary" 
          className={cn("text-xs", visuals.statusColor)}
        >
          {visuals.statusText}
        </Badge>
      )}
    </div>
  );
}