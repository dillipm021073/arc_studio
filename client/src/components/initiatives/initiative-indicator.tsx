import { GitBranch, Globe, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useInitiative } from "./initiative-context";
import { cn } from "@/lib/utils";

interface InitiativeIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

export function InitiativeIndicator({ 
  className, 
  showDetails = true 
}: InitiativeIndicatorProps) {
  const { currentInitiative, isProductionView } = useInitiative();

  if (isProductionView) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="secondary" 
            className={cn(
              "gap-1 bg-green-100 text-green-800 hover:bg-green-200",
              className
            )}
          >
            <Globe className="h-3 w-3" />
            Production
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>Viewing production baseline</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  if (!currentInitiative) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={cn(
              "gap-1 text-muted-foreground",
              className
            )}
          >
            <AlertCircle className="h-3 w-3" />
            No Initiative
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>Select an initiative to make changes</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'draft': return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
      case 'review': return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'cancelled': return 'bg-red-100 text-red-800 hover:bg-red-200';
      default: return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const getPriorityIcon = (priority?: string) => {
    switch (priority) {
      case 'critical': return '🔴';
      case 'high': return '🟠';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '';
    }
  };

  const content = (
    <Badge 
      variant="secondary" 
      className={cn(
        "gap-1",
        getStatusColor(currentInitiative.status),
        className
      )}
    >
      <GitBranch className="h-3 w-3" />
      {showDetails ? (
        <>
          {currentInitiative.name}
          {currentInitiative.priority && (
            <span className="ml-1">{getPriorityIcon(currentInitiative.priority)}</span>
          )}
        </>
      ) : (
        'Initiative'
      )}
    </Badge>
  );

  if (!showDetails) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {content}
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-semibold">{currentInitiative.name}</p>
            {currentInitiative.description && (
              <p className="text-xs text-muted-foreground max-w-xs">
                {currentInitiative.description}
              </p>
            )}
            <p className="text-xs">
              Status: <span className="font-medium">{currentInitiative.status}</span>
            </p>
            {currentInitiative.priority && (
              <p className="text-xs">
                Priority: <span className="font-medium">
                  {getPriorityIcon(currentInitiative.priority)} {currentInitiative.priority}
                </span>
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}