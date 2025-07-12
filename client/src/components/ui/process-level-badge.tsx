import { Badge, type BadgeProps } from "@/components/ui/badge";
import { getProcessLevelIcon, getProcessIconProps, getProcessLevelDescription } from "@/lib/business-process-utils";
import { cn } from "@/lib/utils";

interface ProcessLevelBadgeProps extends Omit<BadgeProps, 'children'> {
  level: string;
  showIcon?: boolean;
  showText?: boolean;
  iconClassName?: string;
}

export function ProcessLevelBadge({ 
  level, 
  showIcon = true, 
  showText = true,
  iconClassName,
  className,
  variant = "outline",
  ...props 
}: ProcessLevelBadgeProps) {
  const ProcessIcon = getProcessLevelIcon(level);
  
  // Determine badge color based on level
  const levelColor = level.toUpperCase() === 'A' ? 'bg-blue-700 text-white border-blue-600' :
                    level.toUpperCase() === 'B' ? 'bg-purple-700 text-white border-purple-600' :
                    level.toUpperCase() === 'C' ? 'bg-pink-700 text-white border-pink-600' :
                    'bg-gray-700 text-white border-gray-600';

  return (
    <Badge 
      className={cn(levelColor, className)} 
      variant={variant}
      title={getProcessLevelDescription(level)}
      {...props}
    >
      {showIcon && (
        <ProcessIcon 
          {...getProcessIconProps(cn("h-3 w-3", showText && "mr-1", iconClassName))} 
        />
      )}
      {showText && `Level ${level.toUpperCase()}`}
    </Badge>
  );
}