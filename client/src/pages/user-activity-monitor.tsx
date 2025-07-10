import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { withAuth } from "@/contexts/auth-context";
import { 
  Activity, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Filter,
  RefreshCw,
  User,
  Shield,
  TrendingUp,
  FileText,
  Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ActivityLog {
  id: number;
  userId: number;
  username: string;
  activityType: string;
  method?: string;
  endpoint?: string;
  resource?: string;
  resourceId?: number;
  action?: string;
  statusCode?: number;
  errorMessage?: string;
  responseTime?: number;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

interface ActivitySummary {
  activityCounts: Array<{ activityType: string; count: number }>;
  resourceCounts: Array<{ resource: string; action: string; count: number }>;
  recentActivities: ActivityLog[];
}

function UserActivityMonitor() {
  const [filters, setFilters] = useState({
    userId: "",
    username: "",
    activityType: "",
    resource: "",
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
  });
  const [selectedUser, setSelectedUser] = useState<number | null>(null);

  // Fetch users for filter
  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await fetch("/api/users");
      if (!response.ok) throw new Error("Failed to fetch users");
      return response.json();
    },
  });

  // Fetch activity summary
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["activitySummary", selectedUser],
    queryFn: async () => {
      const params = selectedUser ? `?userId=${selectedUser}` : "";
      const response = await fetch(`/api/activity/summary${params}`);
      if (!response.ok) throw new Error("Failed to fetch activity summary");
      return response.json();
    },
  });

  // Fetch activity logs
  const { data: logs = [], isLoading: logsLoading, refetch } = useQuery({
    queryKey: ["activityLogs", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.userId) params.append("userId", filters.userId);
      if (filters.username) params.append("username", filters.username);
      if (filters.activityType) params.append("activityType", filters.activityType);
      if (filters.resource) params.append("resource", filters.resource);
      if (filters.startDate) params.append("startDate", filters.startDate.toISOString());
      if (filters.endDate) params.append("endDate", filters.endDate.toISOString());
      params.append("limit", "200");
      
      const response = await fetch(`/api/activity/logs?${params}`);
      if (!response.ok) throw new Error("Failed to fetch activity logs");
      return response.json();
    },
  });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "login":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "logout":
        return <Activity className="h-4 w-4 text-blue-500" />;
      case "permission_denied":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "data_export":
        return <Download className="h-4 w-4 text-purple-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (statusCode?: number) => {
    if (!statusCode) return null;
    
    if (statusCode >= 200 && statusCode < 300) {
      return <Badge variant="success">Success</Badge>;
    } else if (statusCode >= 400 && statusCode < 500) {
      return <Badge variant="warning">Client Error</Badge>;
    } else if (statusCode >= 500) {
      return <Badge variant="destructive">Server Error</Badge>;
    }
    return <Badge variant="secondary">{statusCode}</Badge>;
  };

  const formatResponseTime = (ms?: number) => {
    if (!ms) return "-";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  if (summaryLoading || logsLoading) {
    return <div className="p-6 bg-gray-900 min-h-screen text-gray-400">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6 bg-gray-900 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">User Activity Monitor</h1>
          <p className="text-gray-400">Track and monitor user activities across the system</p>
        </div>
        <Button onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Total Activities</CardTitle>
            <Activity className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {summary?.activityCounts.reduce((sum: number, item: any) => sum + item.count, 0) || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">API Calls</CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {summary?.activityCounts.find((a: any) => a.activityType === 'api_call')?.count || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Permission Denials</CardTitle>
            <Shield className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {summary?.activityCounts.find((a: any) => a.activityType === 'permission_denied')?.count || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Active Users</CardTitle>
            <User className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {new Set(logs.map((log: ActivityLog) => log.userId)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div>
              <Label className="text-gray-300">User</Label>
              <Select
                value={filters.userId || "all"}
                onValueChange={(value) => setFilters({ ...filters, userId: value === "all" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All users</SelectItem>
                  {users.map((user: any) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.username} ({user.name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-gray-300">Activity Type</Label>
              <Select
                value={filters.activityType || "all"}
                onValueChange={(value) => setFilters({ ...filters, activityType: value === "all" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="api_call">API Call</SelectItem>
                  <SelectItem value="login">Login</SelectItem>
                  <SelectItem value="logout">Logout</SelectItem>
                  <SelectItem value="permission_denied">Permission Denied</SelectItem>
                  <SelectItem value="data_export">Data Export</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-gray-300">Resource</Label>
              <Select
                value={filters.resource || "all"}
                onValueChange={(value) => setFilters({ ...filters, resource: value === "all" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All resources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All resources</SelectItem>
                  <SelectItem value="applications">Applications</SelectItem>
                  <SelectItem value="interfaces">Interfaces</SelectItem>
                  <SelectItem value="business_processes">Business Processes</SelectItem>
                  <SelectItem value="change_requests">Change Requests</SelectItem>
                  <SelectItem value="users">Users</SelectItem>
                  <SelectItem value="roles">Roles</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-gray-300">Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filters.startDate && "text-muted-foreground"
                    )}
                  >
                    {filters.startDate ? format(filters.startDate, "PP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filters.startDate}
                    onSelect={(date) => setFilters({ ...filters, startDate: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label className="text-gray-300">End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filters.endDate && "text-muted-foreground"
                    )}
                  >
                    {filters.endDate ? format(filters.endDate, "PP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filters.endDate}
                    onSelect={(date) => setFilters({ ...filters, endDate: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setFilters({
                  userId: "",
                  username: "",
                  activityType: "",
                  resource: "",
                  startDate: undefined,
                  endDate: undefined,
                })}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Logs Table */}
      <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-gray-800 z-10">
              <TableRow>
                <TableHead className="text-gray-300">Time</TableHead>
                <TableHead className="text-gray-300">User</TableHead>
                <TableHead className="text-gray-300">Activity</TableHead>
                <TableHead className="text-gray-300">Method</TableHead>
                <TableHead className="text-gray-300">Endpoint/Resource</TableHead>
                <TableHead className="text-gray-300">Status</TableHead>
                <TableHead className="text-gray-300">Response Time</TableHead>
                <TableHead className="text-gray-300">IP Address</TableHead>
              </TableRow>
            </TableHeader>
          </Table>
          <div className="max-h-[600px] overflow-y-auto">
            <Table>
              <TableBody>
                {logs.map((log: ActivityLog) => (
                  <TableRow key={log.id} className="border-gray-700">
                    <TableCell className="text-sm text-gray-300">
                      {new Date(log.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-200">{log.username}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getActivityIcon(log.activityType)}
                        <span className="capitalize">{log.activityType.replace(/_/g, " ")}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {log.method && (
                        <Badge variant="outline">{log.method}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-gray-300">
                      {log.endpoint || log.resource || "-"}
                      {log.resourceId && ` (ID: ${log.resourceId})`}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(log.statusCode)}
                      {log.errorMessage && (
                        <div className="text-xs text-red-600 mt-1">{log.errorMessage}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-gray-300">
                        <Clock className="h-3 w-3" />
                        {formatResponseTime(log.responseTime)}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-gray-400">
                      {log.ipAddress}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withAuth(UserActivityMonitor);