import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";
import { Badge } from "./badge";
import { Calendar, GitBranch, FileText, AlertCircle, Lock } from "lucide-react";
import { Loader2 } from "lucide-react";
import type { Initiative } from "@db/schema";

interface ArtifactInitiativeTooltipProps {
  children: React.ReactNode;
  artifactType: "application" | "interface" | "businessProcess" | "technicalProcess" | "internalActivity";
  artifactId: number;
  artifactState?: string;
  isLocked?: boolean;
  disabled?: boolean;
}

interface ArtifactInitiativeData {
  initiatives: Array<{
    initiative: Initiative;
    changeType: string;
    changeDetails?: string;
    isOrigin: boolean;
    isLocked?: boolean;
    lockedBy?: string;
    lockedAt?: string;
  }>;
  changeRequests: Array<{
    id: number;
    crNumber: string;
    title: string;
    description?: string;
    status: string;
    impactType?: string;
    impactDescription?: string;
    createdAt: string;
  }>;
  locks: Array<{
    initiativeId: string;
    initiativeName: string;
    lockedBy: string;
    lockedByName: string;
    lockedAt: string;
  }>;
}

export function ArtifactInitiativeTooltip({
  children,
  artifactType,
  artifactId,
  artifactState,
  isLocked = false,
  disabled = false
}: ArtifactInitiativeTooltipProps) {
  // Show tooltip for: pending, draft, locked artifacts, or any with potential CR impacts
  const shouldShowTooltip = !disabled && (
    artifactState === "pending" || 
    artifactState === "draft" || 
    isLocked ||
    true // Always check for CR impacts
  );

  const { data, isLoading, error } = useQuery<ArtifactInitiativeData>({
    queryKey: ["artifact-initiatives", artifactType, artifactId],
    queryFn: async () => {
      const response = await fetch(`/api/initiatives/artifact/${artifactType}/${artifactId}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error("Failed to fetch initiative details");
      }
      return response.json();
    },
    enabled: shouldShowTooltip,
    staleTime: 30000, // Cache for 30 seconds
  });

  // Don't show tooltip if disabled
  if (disabled) {
    return <>{children}</>;
  }

  // Only show tooltip if there's actual data to display
  const hasData = data && (
    data.initiatives.length > 0 || 
    data.changeRequests.length > 0 || 
    data.locks.length > 0
  );

  if (!isLoading && !hasData) {
    return <>{children}</>;
  }

  // Render tooltip wrapper
  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          align="start" 
          className="max-w-md p-4 space-y-3"
        >
          {isLoading && (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading initiative details...</span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-red-500">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">Failed to load details</span>
            </div>
          )}

          {!isLoading && !error && !data && (
            <div className="text-sm text-muted-foreground">
              No initiative information available
            </div>
          )}

          {data && data.initiatives.length === 0 && data.changeRequests.length === 0 && (
            <div className="text-sm text-muted-foreground">
              This artifact has pending changes but no associated initiatives
            </div>
          )}

          {data && (data.initiatives.length > 0 || data.changeRequests.length > 0) && (
            <>
              {/* Initiatives Section */}
              {data.initiatives.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 font-medium">
                    <GitBranch className="h-4 w-4" />
                    <span>Active in Initiatives:</span>
                  </div>
                  {data.initiatives.map((item, index) => (
                    <div key={index} className="pl-6 space-y-1 border-l-2 border-muted">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.initiative.name}</span>
                        {item.isOrigin && (
                          <Badge variant="secondary" className="text-xs">Origin</Badge>
                        )}
                      </div>
                      {item.initiative.description && (
                        <p className="text-sm text-muted-foreground">
                          {item.initiative.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          Status: <Badge variant="outline" className="text-xs">
                            {item.initiative.status}
                          </Badge>
                        </span>
                        {item.initiative.targetCompletionDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(item.initiative.targetCompletionDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      {item.changeType && (
                        <div className="text-xs">
                          <span className="text-muted-foreground">Change: </span>
                          <span className="font-medium">{item.changeType}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Locks Section */}
              {data.locks && data.locks.length > 0 && (
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center gap-2 font-medium">
                    <Lock className="h-4 w-4" />
                    <span>Currently Locked:</span>
                  </div>
                  {data.locks.map((lock, index) => (
                    <div key={index} className="pl-6 space-y-1 border-l-2 border-yellow-500">
                      <div className="text-xs">
                        <span className="text-muted-foreground">Initiative: </span>
                        <span className="font-medium">{lock.initiativeName}</span>
                      </div>
                      <div className="text-xs">
                        <span className="text-muted-foreground">Locked by: </span>
                        <span className="font-medium">{lock.lockedByName}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Since: {new Date(lock.lockedAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Change Requests Section */}
              {data.changeRequests.length > 0 && (
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center gap-2 font-medium">
                    <FileText className="h-4 w-4" />
                    <span>Related Change Requests:</span>
                  </div>
                  {data.changeRequests.map((cr) => (
                    <div key={cr.id} className="pl-6 space-y-1 border-l-2 border-muted">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{cr.crNumber}</span>
                        <Badge variant="outline" className="text-xs">{cr.status}</Badge>
                      </div>
                      <p className="text-xs font-medium">{cr.title}</p>
                      {cr.description && (
                        <p className="text-xs text-muted-foreground">{cr.description}</p>
                      )}
                      {cr.impactType && (
                        <div className="text-xs">
                          <span className="text-muted-foreground">Impact: </span>
                          <span className="font-medium">{cr.impactType}</span>
                          {cr.impactDescription && (
                            <span className="text-muted-foreground"> - {cr.impactDescription}</span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}