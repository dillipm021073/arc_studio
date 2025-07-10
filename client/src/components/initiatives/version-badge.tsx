import { Clock, CheckCircle, GitBranch, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface VersionInfo {
  versionNumber: number;
  isBaseline: boolean;
  isModified?: boolean;
  hasConflicts?: boolean;
  lastModified?: string;
  modifiedBy?: string;
  initiativeName?: string;
}

interface VersionBadgeProps {
  version: VersionInfo;
  className?: string;
  showTooltip?: boolean;
}

export function VersionBadge({ 
  version, 
  className,
  showTooltip = true 
}: VersionBadgeProps) {
  const getIcon = () => {
    if (version.hasConflicts) {
      return <AlertCircle className="h-3 w-3" />;
    }
    if (version.isBaseline) {
      return <CheckCircle className="h-3 w-3" />;
    }
    if (version.isModified) {
      return <GitBranch className="h-3 w-3" />;
    }
    return <Clock className="h-3 w-3" />;
  };

  const getVariant = () => {
    if (version.hasConflicts) return "destructive";
    if (version.isBaseline) return "default";
    if (version.isModified) return "secondary";
    return "outline";
  };

  const getLabel = () => {
    if (version.hasConflicts) return `v${version.versionNumber} (conflicts)`;
    if (version.isBaseline) return `v${version.versionNumber} (baseline)`;
    if (version.isModified) return `v${version.versionNumber} (modified)`;
    return `v${version.versionNumber}`;
  };

  const badge = (
    <Badge 
      variant={getVariant()} 
      className={cn("gap-1 text-xs", className)}
    >
      {getIcon()}
      {getLabel()}
    </Badge>
  );

  if (!showTooltip) {
    return badge;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {badge}
      </TooltipTrigger>
      <TooltipContent>
        <div className="space-y-1 text-xs">
          <p>Version: {version.versionNumber}</p>
          {version.isBaseline && (
            <p className="text-green-600">Production baseline</p>
          )}
          {version.isModified && !version.isBaseline && (
            <p className="text-blue-600">Modified in initiative</p>
          )}
          {version.hasConflicts && (
            <p className="text-red-600">Has conflicts with baseline</p>
          )}
          {version.initiativeName && (
            <p>Initiative: {version.initiativeName}</p>
          )}
          {version.lastModified && (
            <p>Modified: {new Date(version.lastModified).toLocaleDateString()}</p>
          )}
          {version.modifiedBy && (
            <p>By: {version.modifiedBy}</p>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}