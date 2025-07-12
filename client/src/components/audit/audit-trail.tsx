import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { format, formatDistanceToNow } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Activity, 
  GitBranch, 
  User, 
  Clock, 
  FileText,
  Package,
  ArrowRight,
  Filter
} from "lucide-react";
import { useInitiative } from "../initiatives/initiative-context";
import { VersionComparisonDialog } from "./version-comparison-dialog";
import { cn } from "@/lib/utils";

interface AuditEntry {
  id: number;
  timestamp: string;
  artifactType: string;
  artifactId: number;
  artifactName: string;
  action: string;
  changeType: 'create' | 'update' | 'delete' | 'baseline' | 'checkout' | 'checkin';
  versionFrom?: number;
  versionTo?: number;
  userId: number;
  userName: string;
  userEmail: string;
  initiativeId?: string;
  initiativeName?: string;
  changeReason?: string;
  changedFields?: string[];
  metadata?: Record<string, any>;
}

interface AuditTrailProps {
  artifactType?: string;
  artifactId?: number;
  limit?: number;
}

export function AuditTrail({ 
  artifactType, 
  artifactId,
  limit = 50 
}: AuditTrailProps) {
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterUser, setFilterUser] = useState<string>("all");
  const { currentInitiative } = useInitiative();

  // Fetch audit trail
  const { data: auditData, isLoading } = useQuery({
    queryKey: ['audit-trail', artifactType, artifactId, currentInitiative?.initiativeId, limit],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (artifactType) params.append('artifactType', artifactType);
      if (artifactId) params.append('artifactId', artifactId.toString());
      if (currentInitiative) params.append('initiativeId', currentInitiative.initiativeId);
      params.append('limit', limit.toString());

      const response = await api.get(`/api/audit/trail?${params}`);
      return response.data;
    }
  });

  // Extract unique users for filter
  const uniqueUsers: string[] = Array.from(
    new Set(auditData?.entries?.map((e: AuditEntry) => e.userName) || [])
  );

  // Filter entries
  const filteredEntries = auditData?.entries?.filter((entry: AuditEntry) => {
    if (filterType !== 'all' && entry.changeType !== filterType) return false;
    if (filterUser !== 'all' && entry.userName !== filterUser) return false;
    return true;
  }) || [];

  const getActionIcon = (changeType: string) => {
    switch (changeType) {
      case 'create': return <Package className="h-4 w-4 text-green-600" />;
      case 'update': return <FileText className="h-4 w-4 text-blue-600" />;
      case 'delete': return <Package className="h-4 w-4 text-red-600" />;
      case 'baseline': return <GitBranch className="h-4 w-4 text-purple-600" />;
      case 'checkout': return <ArrowRight className="h-4 w-4 text-orange-600" />;
      case 'checkin': return <ArrowRight className="h-4 w-4 text-teal-600 rotate-180" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getActionLabel = (entry: AuditEntry) => {
    switch (entry.changeType) {
      case 'create': return 'Created';
      case 'update': return 'Updated';
      case 'delete': return 'Deleted';
      case 'baseline': return 'Baselined';
      case 'checkout': return 'Checked out';
      case 'checkin': return 'Checked in';
      default: return entry.action;
    }
  };

  const getChangeTypeColor = (changeType: string) => {
    switch (changeType) {
      case 'create': return 'text-green-600 bg-green-50';
      case 'update': return 'text-blue-600 bg-blue-50';
      case 'delete': return 'text-red-600 bg-red-50';
      case 'baseline': return 'text-purple-600 bg-purple-50';
      case 'checkout': return 'text-orange-600 bg-orange-50';
      case 'checkin': return 'text-teal-600 bg-teal-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Audit Trail</h3>
          <Badge variant="secondary">{filteredEntries.length} entries</Badge>
        </div>

        <div className="flex items-center gap-2">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="create">Created</SelectItem>
              <SelectItem value="update">Updated</SelectItem>
              <SelectItem value="delete">Deleted</SelectItem>
              <SelectItem value="baseline">Baselined</SelectItem>
              <SelectItem value="checkout">Checkouts</SelectItem>
              <SelectItem value="checkin">Checkins</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterUser} onValueChange={setFilterUser}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter by user" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All users</SelectItem>
              {uniqueUsers.map(user => (
                <SelectItem key={user} value={user}>{user}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px]">Timestamp</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Artifact</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Initiative</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEntries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No audit entries found
                </TableCell>
              </TableRow>
            ) : (
              filteredEntries.map((entry: AuditEntry) => (
                <TableRow key={entry.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">
                          {format(new Date(entry.timestamp), 'MMM d, yyyy')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(entry.timestamp), 'HH:mm:ss')}
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getActionIcon(entry.changeType)}
                      <Badge 
                        variant="secondary" 
                        className={cn("text-xs", getChangeTypeColor(entry.changeType))}
                      >
                        {getActionLabel(entry)}
                      </Badge>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div>
                      <div className="font-medium">{entry.artifactName}</div>
                      <div className="text-xs text-muted-foreground">
                        {entry.artifactType} #{entry.artifactId}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    {entry.versionFrom && entry.versionTo && entry.versionFrom !== entry.versionTo ? (
                      <div className="flex items-center gap-1 text-sm">
                        <span>v{entry.versionFrom}</span>
                        <ArrowRight className="h-3 w-3" />
                        <span>v{entry.versionTo}</span>
                      </div>
                    ) : (
                      <span className="text-sm">
                        v{entry.versionTo || entry.versionFrom || '-'}
                      </span>
                    )}
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-3 w-3 text-muted-foreground" />
                      <div>
                        <div className="text-sm">{entry.userName}</div>
                        <div className="text-xs text-muted-foreground">
                          {entry.userEmail}
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    {entry.initiativeName ? (
                      <div className="flex items-center gap-1">
                        <GitBranch className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{entry.initiativeName}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedEntry(entry)}
                      >
                        Details
                      </Button>
                      {entry.versionFrom && entry.versionTo && entry.versionFrom !== entry.versionTo && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedEntry(entry);
                            setShowComparison(true);
                          }}
                        >
                          Compare
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Details Dialog */}
      <Dialog 
        open={!!selectedEntry && !showComparison} 
        onOpenChange={(open) => !open && setSelectedEntry(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Audit Entry Details</DialogTitle>
            <DialogDescription>
              Detailed information about this change
            </DialogDescription>
          </DialogHeader>

          {selectedEntry && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Timestamp
                  </label>
                  <p className="text-sm">
                    {format(new Date(selectedEntry.timestamp), 'PPP HH:mm:ss')}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Action
                  </label>
                  <div className="flex items-center gap-2">
                    {getActionIcon(selectedEntry.changeType)}
                    <span className="text-sm">{getActionLabel(selectedEntry)}</span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Artifact
                  </label>
                  <p className="text-sm">
                    {selectedEntry.artifactType} - {selectedEntry.artifactName}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Version
                  </label>
                  <p className="text-sm">
                    {selectedEntry.versionFrom && selectedEntry.versionTo && selectedEntry.versionFrom !== selectedEntry.versionTo ? (
                      <>v{selectedEntry.versionFrom} → v{selectedEntry.versionTo}</>
                    ) : (
                      <>v{selectedEntry.versionTo || selectedEntry.versionFrom || '-'}</>
                    )}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    User
                  </label>
                  <p className="text-sm">
                    {selectedEntry.userName} ({selectedEntry.userEmail})
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Initiative
                  </label>
                  <p className="text-sm">
                    {selectedEntry.initiativeName || 'N/A'}
                  </p>
                </div>
              </div>

              {selectedEntry.changeReason && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Change Reason
                  </label>
                  <p className="text-sm mt-1">{selectedEntry.changeReason}</p>
                </div>
              )}

              {selectedEntry.changedFields && selectedEntry.changedFields.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Changed Fields
                  </label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedEntry.changedFields.map((field, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {field}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedEntry.metadata && Object.keys(selectedEntry.metadata).length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Additional Information
                  </label>
                  <pre className="text-xs mt-1 p-2 bg-muted rounded">
                    {JSON.stringify(selectedEntry.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Version Comparison Dialog */}
      {selectedEntry && showComparison && selectedEntry.versionFrom != null && selectedEntry.versionTo != null && (
        <VersionComparisonDialog
          open={showComparison}
          onOpenChange={setShowComparison}
          artifactType={selectedEntry.artifactType}
          artifactId={selectedEntry.artifactId}
          versionFrom={selectedEntry.versionFrom}
          versionTo={selectedEntry.versionTo}
        />
      )}
    </div>
  );
}