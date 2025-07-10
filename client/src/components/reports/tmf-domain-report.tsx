import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart, PieChart, Pie, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Filter, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

// TM Forum domain colors
const TMF_DOMAIN_COLORS = {
  product: '#8B5CF6',
  customer: '#10B981',
  service: '#3B82F6',
  resource: '#F59E0B',
  partner: '#EC4899',
  enterprise: '#6B7280',
};

export default function TMFDomainReport() {
  // Fetch applications with TM Forum domain data
  const { data: applications = [], isLoading: appsLoading } = useQuery({
    queryKey: ["/api/applications", { includeTmfDomains: true }],
    queryFn: async () => {
      const response = await fetch("/api/applications?includeTmfDomains=true");
      if (!response.ok) throw new Error("Failed to fetch applications");
      return response.json();
    },
  });

  // Fetch interfaces with domain interaction data
  const { data: interfaces = [], isLoading: interfacesLoading } = useQuery({
    queryKey: ["/api/interfaces", { includeTmfDomains: true }],
    queryFn: async () => {
      const response = await fetch("/api/interfaces?includeTmfDomains=true");
      if (!response.ok) throw new Error("Failed to fetch interfaces");
      return response.json();
    },
  });

  // Calculate domain statistics
  const domainStats = applications.reduce((acc: any, app: any) => {
    const domain = app.tmfDomain || 'enterprise';
    if (!acc[domain]) {
      acc[domain] = {
        count: 0,
        active: 0,
        interfaces: 0,
        capabilities: [],
      };
    }
    acc[domain].count++;
    if (app.status === 'active') acc[domain].active++;
    return acc;
  }, {});

  // Calculate interface statistics by domain
  interfaces.forEach((iface: any) => {
    const providerApp = applications.find((app: any) => app.id === iface.providerApplicationId);
    if (providerApp) {
      const domain = providerApp.tmfDomain || 'enterprise';
      if (domainStats[domain]) {
        domainStats[domain].interfaces++;
      }
    }
  });

  // Prepare data for charts
  const domainChartData = Object.entries(domainStats).map(([domain, stats]: [string, any]) => ({
    name: domain.charAt(0).toUpperCase() + domain.slice(1),
    applications: stats.count,
    activeApplications: stats.active,
    interfaces: stats.interfaces,
  }));

  const domainPieData = Object.entries(domainStats).map(([domain, stats]: [string, any]) => ({
    name: domain.charAt(0).toUpperCase() + domain.slice(1),
    value: stats.count,
    color: TMF_DOMAIN_COLORS[domain as keyof typeof TMF_DOMAIN_COLORS],
  }));

  // Calculate domain interaction matrix
  const domainInteractions: Record<string, Record<string, number>> = {};
  interfaces.forEach((iface: any) => {
    const providerApp = applications.find((app: any) => app.id === iface.providerApplicationId);
    const consumerApp = applications.find((app: any) => app.id === iface.consumerApplicationId);
    
    if (providerApp && consumerApp) {
      const providerDomain = providerApp.tmfDomain || 'enterprise';
      const consumerDomain = consumerApp.tmfDomain || 'enterprise';
      
      if (!domainInteractions[providerDomain]) {
        domainInteractions[providerDomain] = {};
      }
      if (!domainInteractions[providerDomain][consumerDomain]) {
        domainInteractions[providerDomain][consumerDomain] = 0;
      }
      domainInteractions[providerDomain][consumerDomain]++;
    }
  });

  const exportReport = () => {
    // Create CSV content
    const csvContent = [
      ['TM Forum Domain Analysis Report'],
      ['Generated on:', new Date().toISOString()],
      [''],
      ['Domain Statistics'],
      ['Domain', 'Total Applications', 'Active Applications', 'Interfaces'],
      ...domainChartData.map(d => [d.name, d.applications, d.activeApplications, d.interfaces]),
      [''],
      ['Domain Interactions'],
      ['Provider Domain', 'Consumer Domain', 'Interface Count'],
      ...Object.entries(domainInteractions).flatMap(([provider, consumers]) =>
        Object.entries(consumers).map(([consumer, count]) => [provider, consumer, count])
      ),
    ].map(row => row.join(',')).join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tmf-domain-report-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (appsLoading || interfacesLoading) {
    return <div className="p-4">Loading TM Forum domain data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">TM Forum Domain Analysis</h2>
          <p className="text-gray-600">Architecture analysis from TM Forum domain perspective</p>
        </div>
        <Button onClick={exportReport} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(domainStats).map(([domain, stats]: [string, any]) => (
          <Card key={domain}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>{domain.charAt(0).toUpperCase() + domain.slice(1)} Domain</span>
                <Badge 
                  style={{ 
                    backgroundColor: TMF_DOMAIN_COLORS[domain as keyof typeof TMF_DOMAIN_COLORS],
                    color: 'white'
                  }}
                >
                  {stats.count}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Active Applications</span>
                  <span className="font-medium">{stats.active}</span>
                </div>
                <Progress 
                  value={(stats.active / stats.count) * 100} 
                  className="h-2"
                />
                <div className="flex justify-between text-sm pt-2">
                  <span>Interfaces</span>
                  <span className="font-medium">{stats.interfaces}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="distribution" className="space-y-4">
        <TabsList>
          <TabsTrigger value="distribution">Domain Distribution</TabsTrigger>
          <TabsTrigger value="interactions">Domain Interactions</TabsTrigger>
          <TabsTrigger value="capabilities">Capabilities</TabsTrigger>
        </TabsList>

        <TabsContent value="distribution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Application Distribution by Domain</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium mb-4">Bar Chart View</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={domainChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="applications" fill="#3B82F6" />
                      <Bar dataKey="activeApplications" fill="#10B981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-4">Distribution Overview</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={domainPieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {domainPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cross-Domain Interface Interactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Provider Domain
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Consumer Domain
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Interface Count
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Integration Type
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Object.entries(domainInteractions).flatMap(([provider, consumers]) =>
                      Object.entries(consumers).map(([consumer, count]) => (
                        <tr key={`${provider}-${consumer}`}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge 
                              style={{ 
                                backgroundColor: TMF_DOMAIN_COLORS[provider as keyof typeof TMF_DOMAIN_COLORS],
                                color: 'white'
                              }}
                            >
                              {provider}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge 
                              style={{ 
                                backgroundColor: TMF_DOMAIN_COLORS[consumer as keyof typeof TMF_DOMAIN_COLORS],
                                color: 'white'
                              }}
                            >
                              {consumer}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-medium">{count}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-600">
                              {provider === consumer ? 'Intra-domain' : 'Cross-domain'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="capabilities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Domain Capabilities Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(domainStats).map(([domain, stats]: [string, any]) => {
                  const domainApps = applications.filter((app: any) => (app.tmfDomain || 'enterprise') === domain);
                  const capabilities = [...new Set(domainApps.map((app: any) => app.tmfCapability).filter(Boolean))];
                  
                  return (
                    <div key={domain} className="border rounded-lg p-4">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Badge 
                          style={{ 
                            backgroundColor: TMF_DOMAIN_COLORS[domain as keyof typeof TMF_DOMAIN_COLORS],
                            color: 'white'
                          }}
                        >
                          {domain}
                        </Badge>
                        <span>{domain.charAt(0).toUpperCase() + domain.slice(1)} Domain Capabilities</span>
                      </h4>
                      {capabilities.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {capabilities.map((capability: string) => (
                            <Badge key={capability} variant="outline">
                              {capability}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No capabilities defined</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}