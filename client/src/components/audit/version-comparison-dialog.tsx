import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  GitCompare, 
  Plus, 
  Minus, 
  Edit, 
  AlertCircle,
  CheckCircle,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";

interface VersionComparisonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  artifactType: string;
  artifactId: number;
  versionFrom: number;
  versionTo: number;
}

interface FieldChange {
  field: string;
  path: string[];
  type: 'added' | 'removed' | 'modified' | 'unchanged';
  oldValue?: any;
  newValue?: any;
  subChanges?: FieldChange[];
}

interface VersionComparison {
  artifactType: string;
  artifactId: number;
  artifactName: string;
  versionFrom: {
    number: number;
    createdAt: string;
    createdBy: string;
    isBaseline: boolean;
  };
  versionTo: {
    number: number;
    createdAt: string;
    createdBy: string;
    isBaseline: boolean;
  };
  changes: FieldChange[];
  summary: {
    added: number;
    removed: number;
    modified: number;
    unchanged: number;
  };
}

export function VersionComparisonDialog({
  open,
  onOpenChange,
  artifactType,
  artifactId,
  versionFrom,
  versionTo
}: VersionComparisonDialogProps) {
  const { data: comparison, isLoading } = useQuery({
    queryKey: ['version-comparison', artifactType, artifactId, versionFrom, versionTo],
    queryFn: async () => {
      const response = await api.get(
        `/api/audit/compare-versions?type=${artifactType}&id=${artifactId}&from=${versionFrom}&to=${versionTo}`
      );
      return response.data as VersionComparison;
    },
    enabled: open
  });

  const getChangeIcon = (type: string) => {
    switch (type) {
      case 'added': return <Plus className="h-4 w-4 text-green-600" />;
      case 'removed': return <Minus className="h-4 w-4 text-red-600" />;
      case 'modified': return <Edit className="h-4 w-4 text-blue-600" />;
      default: return <CheckCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getChangeColor = (type: string) => {
    switch (type) {
      case 'added': return 'text-green-600 bg-green-50';
      case 'removed': return 'text-red-600 bg-red-50';
      case 'modified': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const renderValue = (value: any): string => {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  const renderFieldChange = (change: FieldChange, depth: number = 0) => (
    <div
      key={change.field}
      className={cn(
        "border-l-2 py-2",
        depth > 0 && "ml-4",
        change.type === 'added' && "border-green-400",
        change.type === 'removed' && "border-red-400",
        change.type === 'modified' && "border-blue-400",
        change.type === 'unchanged' && "border-gray-200"
      )}
    >
      <div className="flex items-start gap-2 px-3">
        {getChangeIcon(change.type)}
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{change.field}</span>
            <Badge 
              variant="secondary" 
              className={cn("text-xs", getChangeColor(change.type))}
            >
              {change.type}
            </Badge>
          </div>

          {change.type === 'modified' && (
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Old Value</label>
                <pre className="text-xs p-2 bg-red-50 rounded border border-red-200 overflow-x-auto">
                  {renderValue(change.oldValue)}
                </pre>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">New Value</label>
                <pre className="text-xs p-2 bg-green-50 rounded border border-green-200 overflow-x-auto">
                  {renderValue(change.newValue)}
                </pre>
              </div>
            </div>
          )}

          {change.type === 'added' && (
            <div className="mt-2">
              <pre className="text-xs p-2 bg-green-50 rounded border border-green-200 overflow-x-auto">
                {renderValue(change.newValue)}
              </pre>
            </div>
          )}

          {change.type === 'removed' && (
            <div className="mt-2">
              <pre className="text-xs p-2 bg-red-50 rounded border border-red-200 overflow-x-auto">
                {renderValue(change.oldValue)}
              </pre>
            </div>
          )}

          {change.subChanges && change.subChanges.length > 0 && (
            <div className="mt-2 space-y-2">
              {change.subChanges.map(subChange => 
                renderFieldChange(subChange, depth + 1)
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitCompare className="h-5 w-5" />
            Version Comparison
          </DialogTitle>
          <DialogDescription>
            {comparison ? (
              <>
                Comparing {comparison.artifactType} "{comparison.artifactName}" 
                v{comparison.versionFrom.number} → v{comparison.versionTo.number}
              </>
            ) : (
              'Loading comparison...'
            )}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : comparison ? (
          <div className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-4 gap-4">
              <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-900">
                    {comparison.summary.added} Added
                  </span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                <div className="flex items-center gap-2">
                  <Minus className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium text-red-900">
                    {comparison.summary.removed} Removed
                  </span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                <div className="flex items-center gap-2">
                  <Edit className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">
                    {comparison.summary.modified} Modified
                  </span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">
                    {comparison.summary.unchanged} Unchanged
                  </span>
                </div>
              </div>
            </div>

            {/* Version Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg border">
                <h4 className="font-medium text-sm mb-2">From Version</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Version:</span>
                    <Badge variant={comparison.versionFrom.isBaseline ? "default" : "secondary"}>
                      v{comparison.versionFrom.number}
                      {comparison.versionFrom.isBaseline && " (baseline)"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {new Date(comparison.versionFrom.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    By: {comparison.versionFrom.createdBy}
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg border">
                <h4 className="font-medium text-sm mb-2">To Version</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Version:</span>
                    <Badge variant={comparison.versionTo.isBaseline ? "default" : "secondary"}>
                      v{comparison.versionTo.number}
                      {comparison.versionTo.isBaseline && " (baseline)"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {new Date(comparison.versionTo.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    By: {comparison.versionTo.createdBy}
                  </div>
                </div>
              </div>
            </div>

            {/* Changes */}
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">
                  All Changes ({comparison.changes.length})
                </TabsTrigger>
                <TabsTrigger value="added">
                  Added ({comparison.summary.added})
                </TabsTrigger>
                <TabsTrigger value="modified">
                  Modified ({comparison.summary.modified})
                </TabsTrigger>
                <TabsTrigger value="removed">
                  Removed ({comparison.summary.removed})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all">
                <ScrollArea className="h-[300px] rounded-md border p-4">
                  {comparison.changes.length === 0 ? (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        No changes detected between these versions.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="space-y-4">
                      {comparison.changes.map(change => renderFieldChange(change))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="added">
                <ScrollArea className="h-[300px] rounded-md border p-4">
                  <div className="space-y-4">
                    {comparison.changes
                      .filter(c => c.type === 'added')
                      .map(change => renderFieldChange(change))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="modified">
                <ScrollArea className="h-[300px] rounded-md border p-4">
                  <div className="space-y-4">
                    {comparison.changes
                      .filter(c => c.type === 'modified')
                      .map(change => renderFieldChange(change))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="removed">
                <ScrollArea className="h-[300px] rounded-md border p-4">
                  <div className="space-y-4">
                    {comparison.changes
                      .filter(c => c.type === 'removed')
                      .map(change => renderFieldChange(change))}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load version comparison.
            </AlertDescription>
          </Alert>
        )}
      </DialogContent>
    </Dialog>
  );
}