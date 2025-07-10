import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Box, 
  Plug, 
  GitBranch, 
  AlertTriangle, 
  Download, 
  Plus,
  Search,
  Filter,
  Edit,
  Eye,
  MessageSquare,
  Clock,
  User,
  Calendar
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

interface DashboardMetrics {
  totalApplications: number;
  activeInterfaces: number;
  pendingChanges: number;
  criticalIssues: number;
}

interface RecentChange {
  id: number;
  title: string;
  description: string;
  status: string;
  owner: string;
  date: string;
  impactedApps: number;
}

interface Application {
  id: number;
  name: string;
  description: string;
  os: string;
  deployment: string;
  uptime: string;
  status: string;
  lastChangeDate: string;
}

export default function Dashboard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: metrics, isLoading: metricsLoading } = useQuery<DashboardMetrics>({
    queryKey: ["/api/dashboard/metrics"],
  });

  // Check for pending decommissions
  const { data: pendingDecommissions } = useQuery({
    queryKey: ["/api/applications/pending-decommission"],
    refetchInterval: 60000, // Check every minute
  });

  useEffect(() => {
    if (pendingDecommissions && pendingDecommissions.length > 0) {
      toast({
        title: "Pending Decommissions",
        description: `${pendingDecommissions.length} application(s) are due for decommissioning today.`,
        variant: "destructive",
        action: (
          <Link href="/applications">
            <Button variant="outline" size="sm" className="text-white">
              View
            </Button>
          </Link>
        ),
      });
    }
  }, [pendingDecommissions, toast]);

  const { data: recentChanges, isLoading: changesLoading } = useQuery<RecentChange[]>({
    queryKey: ["/api/dashboard/recent-changes"],
  });

  const { data: applications, isLoading: applicationsLoading } = useQuery<Application[]>({
    queryKey: ["/api/applications"],
  });

  const { data: communicationMetrics, isLoading: commMetricsLoading } = useQuery({
    queryKey: ["/api/dashboard/communication-metrics"],
  });

  const { data: recentCommunications, isLoading: commLoading } = useQuery({
    queryKey: ["/api/dashboard/recent-communications"],
  });

  const getStatusColor = (status: string) => {
    // For application status (Applications Management table)
    if (['active', 'inactive', 'maintenance', 'deprecated'].includes(status.toLowerCase())) {
      switch (status.toLowerCase()) {
        case 'active': return 'bg-green-600 text-white';
        case 'inactive': return 'bg-red-600 text-white';
        case 'maintenance': return 'bg-blue-600 text-white';
        case 'deprecated': return 'bg-gray-600 text-white';
        case 'decommissioned': return 'bg-gray-600 text-white';
        default: return 'bg-orange-600 text-white';
      }
    }
    
    // For change request status (Recent Change Requests section)
    switch (status.toLowerCase()) {
      case 'draft': return 'bg-gray-600 text-white';
      case 'submitted': return 'bg-blue-600 text-white';
      case 'under_review': return 'bg-yellow-600 text-white';
      case 'approved': return 'bg-green-600 text-white';
      case 'in_progress': return 'bg-blue-500 text-white';
      case 'completed': return 'bg-green-500 text-white';
      case 'rejected': return 'bg-red-600 text-white';
      case 'cancelled': return 'bg-gray-500 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const getDeploymentColor = (deployment: string) => {
    switch (deployment.toLowerCase()) {
      case 'cloud': return 'bg-blue-600 text-white';
      case 'on-premise': return 'bg-orange-600 text-white';
      case 'on_premise': return 'bg-orange-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <nav className="flex" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-2 text-sm text-gray-400">
                <li><Link href="/" className="hover:text-gray-200">Home</Link></li>
                <li className="flex items-center">
                  <span className="mx-2">/</span>
                  <span className="text-white font-medium">Dashboard</span>
                </li>
              </ol>
            </nav>
            <h1 className="text-2xl font-semibold text-white mt-1">Enterprise Overview</h1>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              <Download className="mr-2" size={16} />
              Export Report
            </Button>
            <Link href="/applications">
              <Button className="bg-blue-600 text-white hover:bg-blue-700">
                <Plus className="mr-2" size={16} />
                New Application
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        {/* Pending Decommission Alert */}
        {pendingDecommissions && pendingDecommissions.length > 0 && (
          <div className="mb-6 bg-orange-900 border border-orange-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-orange-400" />
                <div>
                  <h3 className="text-sm font-semibold text-orange-300">Pending Decommissions</h3>
                  <p className="text-sm text-orange-200">
                    {pendingDecommissions.length} application(s) scheduled for decommissioning today
                  </p>
                </div>
              </div>
              <Link href="/applications">
                <Button size="sm" variant="outline" className="text-orange-300 border-orange-600 hover:bg-orange-800">
                  Review Applications
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Box className="text-white" size={16} />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-400">Total Applications</p>
                  <p className="text-2xl font-semibold text-white">
                    {metricsLoading ? "..." : metrics?.totalApplications || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                    <Plug className="text-white" size={16} />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-400">Active Interfaces</p>
                  <p className="text-2xl font-semibold text-white">
                    {metricsLoading ? "..." : metrics?.activeInterfaces || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-amber-600 rounded-lg flex items-center justify-center">
                    <GitBranch className="text-white" size={16} />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-400">Pending Changes</p>
                  <p className="text-2xl font-semibold text-white">
                    {metricsLoading ? "..." : metrics?.pendingChanges || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="text-white" size={16} />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-400">Critical Issues</p>
                  <p className="text-2xl font-semibold text-white">
                    {metricsLoading ? "..." : metrics?.criticalIssues || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                    <MessageSquare className="text-white" size={16} />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-400">Active Discussions</p>
                  <p className="text-2xl font-semibold text-white">
                    {commMetricsLoading ? "..." : communicationMetrics?.activeConversations || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Recent Communications */}
          <div className="lg:col-span-1">
            <Card className="bg-gray-800 border-gray-700">
              <div className="px-6 py-4 border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-white">Recent Communications</h3>
                  <Link href="/communications" className="text-sm text-blue-400 hover:text-blue-300">
                    View all
                  </Link>
                </div>
              </div>
              <div className="p-6">
                {commLoading ? (
                  <div className="text-center py-4 text-gray-400">Loading communications...</div>
                ) : !recentCommunications || recentCommunications.length === 0 ? (
                  <div className="text-center py-4 text-gray-400">No recent communications</div>
                ) : (
                  <div className="space-y-4">
                    {recentCommunications.slice(0, 5).map((comm: any) => (
                      <div key={comm.id} className="border-l-2 border-purple-600 pl-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{comm.title}</p>
                            {comm.latestComment && (
                              <div className="mt-1">
                                <p className="text-xs text-gray-400 line-clamp-2">
                                  {comm.latestComment.content}
                                </p>
                                <div className="flex items-center mt-1 text-xs text-gray-500">
                                  <User className="h-3 w-3 mr-1" />
                                  <span>{comm.latestComment.author}</span>
                                  <Clock className="h-3 w-3 ml-2 mr-1" />
                                  <span>{new Date(comm.latestComment.createdAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                            )}
                            {comm.linkedEntities && comm.linkedEntities.length > 0 && (
                              <div className="mt-1 text-xs text-gray-500">
                                Linked to: {comm.linkedEntities.map((e: any) => `${e.entityType} #${e.entityId}`).join(', ')}
                              </div>
                            )}
                          </div>
                          <Badge className={
                            comm.status === 'open' ? 'bg-blue-600 text-white text-xs' :
                            comm.status === 'resolved' ? 'bg-green-600 text-white text-xs' :
                            comm.status === 'pending' ? 'bg-yellow-600 text-white text-xs' :
                            'bg-gray-600 text-white text-xs'
                          }>
                            {comm.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Recent Changes */}
          <div className="lg:col-span-1">
            <Card className="bg-gray-800 border-gray-700">
              <div className="px-6 py-4 border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-white">Recent Change Requests</h3>
                  <Link href="/change-requests" className="text-sm text-blue-400 hover:text-blue-300">
                    View all
                  </Link>
                </div>
              </div>
              <div className="p-6">
                {changesLoading ? (
                  <div className="text-center py-4 text-gray-400">Loading recent changes...</div>
                ) : !recentChanges || recentChanges.length === 0 ? (
                  <div className="text-center py-4 text-gray-400">No recent changes found</div>
                ) : (
                  <div className="space-y-6">
                    {recentChanges.map((change) => (
                      <div key={change.id} className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-white">{change.title}</p>
                            <Badge className={getStatusColor(change.status)}>
                              {change.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-400 mt-1">{change.description}</p>
                          <div className="flex items-center mt-2 text-xs text-gray-400">
                            <span>{change.owner}</span>
                            <span className="mx-2">•</span>
                            <span>{change.date}</span>
                            <span className="mx-2">•</span>
                            <span>{change.impactedApps} applications affected</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* System Health */}
          <div>
            <Card className="bg-gray-800 border-gray-700">
              <div className="px-6 py-4 border-b border-gray-700">
                <h3 className="text-lg font-medium text-white">System Health</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                      <span className="text-sm font-medium text-white">Core Applications</span>
                    </div>
                    <span className="text-sm text-gray-400">98.7%</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                      <span className="text-sm font-medium text-white">Interface Connections</span>
                    </div>
                    <span className="text-sm text-gray-400">94.2%</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                      <span className="text-sm font-medium text-white">Data Integrity</span>
                    </div>
                    <span className="text-sm text-gray-400">99.1%</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                      <span className="text-sm font-medium text-white">Legacy Systems</span>
                    </div>
                    <span className="text-sm text-gray-400">87.3%</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Applications Table */}
        <Card className="bg-gray-800 border-gray-700">
          <div className="px-6 py-4 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-white">Applications Management</h3>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search applications..."
                    className="w-64 pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="text-gray-400" size={16} />
                  </div>
                </div>
                <Button variant="outline" size="sm" className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600">
                  <Filter className="mr-2" size={16} />
                  Filter
                </Button>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Application
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    OS/Platform
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Deployment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Uptime
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Last Change
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {applicationsLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-400">
                      Loading applications...
                    </td>
                  </tr>
                ) : !applications || applications.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-400">
                      No applications found. <Link href="/applications" className="text-blue-400 hover:underline">Create your first application</Link>
                    </td>
                  </tr>
                ) : (
                  applications.slice(0, 10).map((app) => (
                    <tr key={app.id} className="hover:bg-gray-700/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
                              <Box className="text-white" size={16} />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-white">{app.name}</div>
                            <div className="text-sm text-gray-400">{app.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {app.os}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={getDeploymentColor(app.deployment)}>
                          {app.deployment}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {app.uptime}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={getStatusColor(app.status)}>
                          {app.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {new Date(app.lastChangeDate).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {applications && applications.length > 10 && (
            <div className="px-6 py-4 border-t border-gray-700">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-400">
                  Showing 1 to 10 of {applications.length} applications
                </div>
                <Link href="/applications" className="text-blue-400 hover:text-blue-300">
                  View all applications
                </Link>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
