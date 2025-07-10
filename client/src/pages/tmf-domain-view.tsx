import { useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  NodeTypes,
  EdgeTypes,
  MarkerType,
  Position,
  Panel,
  ReactFlowProvider,
} from "reactflow";
import "reactflow/dist/style.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Filter, Download, RefreshCw, Layers, GitBranch, Box, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { toPng } from 'html-to-image';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import TMFIntegrationPatterns from "@/components/tmf-integration-patterns";

// TM Forum domain colors
const TMF_DOMAIN_COLORS = {
  product: '#8B5CF6', // Purple
  customer: '#10B981', // Green
  service: '#3B82F6', // Blue
  resource: '#F59E0B', // Amber
  partner: '#EC4899', // Pink
  enterprise: '#6B7280', // Gray
};

// TM Forum domain swim lane heights
const SWIMLANE_HEIGHT = 200;
const SWIMLANE_PADDING = 50;

// Custom node for TM Forum domain applications
const TMFDomainNode = ({ data }: { data: any }) => {
  const domainColor = TMF_DOMAIN_COLORS[data.tmfDomain as keyof typeof TMF_DOMAIN_COLORS] || '#94A3B8';
  
  return (
    <div 
      className="relative bg-white border-2 rounded-lg p-4 shadow-lg min-w-[200px]"
      style={{ borderColor: domainColor }}
    >
      <div className="absolute -top-3 left-2 px-2 bg-white">
        <Badge style={{ backgroundColor: domainColor, color: 'white' }}>
          {data.tmfDomain}
        </Badge>
      </div>
      <div className="mt-2">
        <div className="font-semibold text-sm">{data.label}</div>
        {data.tmfSubDomain && (
          <div className="text-xs text-gray-600 mt-1">{data.tmfSubDomain}</div>
        )}
        {data.interfaces && (
          <div className="text-xs text-gray-500 mt-2">
            {data.interfaces} interfaces
          </div>
        )}
      </div>
    </div>
  );
};

// Custom node for swim lanes
const SwimLaneNode = ({ data }: { data: any }) => {
  const domainColor = TMF_DOMAIN_COLORS[data.domain as keyof typeof TMF_DOMAIN_COLORS] || '#94A3B8';
  
  return (
    <div 
      className="w-full h-full border-2 border-dashed rounded-lg"
      style={{ 
        borderColor: domainColor,
        backgroundColor: `${domainColor}10`
      }}
    >
      <div className="p-4">
        <h3 className="text-lg font-semibold" style={{ color: domainColor }}>
          {data.label}
        </h3>
        <p className="text-sm text-gray-600 mt-1">{data.description}</p>
      </div>
    </div>
  );
};

const nodeTypes: NodeTypes = {
  tmfDomain: TMFDomainNode,
  swimLane: SwimLaneNode,
};

const TMFDomainViewContent = () => {
  const { toast } = useToast();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedView, setSelectedView] = useState<'domain' | 'interaction' | 'process'>('domain');
  const [filterDomain, setFilterDomain] = useState<string>('all');
  const [showSwimLanes, setShowSwimLanes] = useState(true);
  const [showPatterns, setShowPatterns] = useState(false);

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

  // Generate nodes and edges based on selected view
  useEffect(() => {
    if (appsLoading || interfacesLoading) return;

    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    if (selectedView === 'domain') {
      // Domain-centric view with swim lanes
      const domains = ['product', 'customer', 'service', 'resource', 'partner', 'enterprise'];
      
      // Create swim lanes
      if (showSwimLanes) {
        domains.forEach((domain, index) => {
          newNodes.push({
            id: `swimlane-${domain}`,
            type: 'swimLane',
            position: { x: 0, y: index * (SWIMLANE_HEIGHT + SWIMLANE_PADDING) },
            data: {
              domain,
              label: domain.charAt(0).toUpperCase() + domain.slice(1) + ' Domain',
              description: getSwimLaneDescription(domain),
            },
            style: {
              width: 1200,
              height: SWIMLANE_HEIGHT,
              zIndex: -1,
            },
            draggable: false,
            selectable: false,
          });
        });
      }

      // Group applications by domain
      const appsByDomain = applications.reduce((acc: any, app: any) => {
        const domain = app.tmfDomain || 'enterprise';
        if (!acc[domain]) acc[domain] = [];
        acc[domain].push(app);
        return acc;
      }, {});

      // Create application nodes
      Object.entries(appsByDomain).forEach(([domain, domainApps]: [string, any]) => {
        const domainIndex = domains.indexOf(domain);
        (domainApps as any[]).forEach((app, index) => {
          if (filterDomain !== 'all' && domain !== filterDomain) return;

          const interfaceCount = interfaces.filter(
            (iface: any) => iface.providerApplicationId === app.id || iface.consumerApplicationId === app.id
          ).length;

          newNodes.push({
            id: `app-${app.id}`,
            type: 'tmfDomain',
            position: {
              x: 100 + (index % 4) * 250,
              y: domainIndex * (SWIMLANE_HEIGHT + SWIMLANE_PADDING) + 50,
            },
            data: {
              ...app,
              label: app.name,
              tmfDomain: domain,
              interfaces: interfaceCount,
            },
          });
        });
      });

      // Create edges for interfaces
      interfaces.forEach((iface: any) => {
        const providerNode = newNodes.find(n => n.id === `app-${iface.providerApplicationId}`);
        const consumerNode = newNodes.find(n => n.id === `app-${iface.consumerApplicationId}`);
        
        if (providerNode && consumerNode) {
          newEdges.push({
            id: `edge-${iface.id}`,
            source: `app-${iface.providerApplicationId}`,
            target: `app-${iface.consumerApplicationId}`,
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#94A3B8', strokeWidth: 2 },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 20,
              height: 20,
            },
            label: iface.interfaceType,
            labelStyle: { fontSize: 10 },
          });
        }
      });
    } else if (selectedView === 'interaction') {
      // Domain interaction view - shows how domains interact with each other
      const domainInteractions: Map<string, Set<string>> = new Map();
      const domainNodeMap: Map<string, Node> = new Map();
      
      // Create domain nodes
      const domains = ['product', 'customer', 'service', 'resource', 'partner', 'enterprise'];
      domains.forEach((domain, index) => {
        const domainApps = applications.filter((app: any) => (app.tmfDomain || 'enterprise') === domain);
        if (filterDomain === 'all' || domain === filterDomain) {
          const node: Node = {
            id: `domain-${domain}`,
            type: 'tmfDomain',
            position: {
              x: 200 + (index % 3) * 350,
              y: 100 + Math.floor(index / 3) * 300,
            },
            data: {
              label: domain.charAt(0).toUpperCase() + domain.slice(1) + ' Domain',
              tmfDomain: domain,
              interfaces: 0,
              applications: domainApps.length,
            },
            style: {
              width: 250,
              height: 150,
            },
          };
          newNodes.push(node);
          domainNodeMap.set(domain, node);
        }
      });
      
      // Analyze domain interactions through interfaces
      interfaces.forEach((iface: any) => {
        const providerApp = applications.find((app: any) => app.id === iface.providerApplicationId);
        const consumerApp = applications.find((app: any) => app.id === iface.consumerApplicationId);
        
        if (providerApp && consumerApp) {
          const providerDomain = providerApp.tmfDomain || 'enterprise';
          const consumerDomain = consumerApp.tmfDomain || 'enterprise';
          
          if (providerDomain !== consumerDomain) {
            const key = `${providerDomain}-${consumerDomain}`;
            if (!domainInteractions.has(key)) {
              domainInteractions.set(key, new Set());
            }
            domainInteractions.get(key)?.add(iface.interfaceType);
          }
        }
      });
      
      // Create edges for domain interactions
      domainInteractions.forEach((interfaceTypes, key) => {
        const [sourceDomain, targetDomain] = key.split('-');
        if (domainNodeMap.has(sourceDomain) && domainNodeMap.has(targetDomain)) {
          newEdges.push({
            id: `domain-edge-${key}`,
            source: `domain-${sourceDomain}`,
            target: `domain-${targetDomain}`,
            type: 'smoothstep',
            animated: true,
            style: { 
              stroke: '#94A3B8', 
              strokeWidth: Math.min(interfaceTypes.size * 2, 8),
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 20,
              height: 20,
            },
            label: `${interfaceTypes.size} interface type(s)`,
            labelStyle: { fontSize: 12, fontWeight: 'bold' },
          });
        }
      });
    } else if (selectedView === 'process') {
      // Process-oriented view - shows applications grouped by business processes
      // This would require fetching business process data
      // For now, we'll create a placeholder view
      const processGroups = [
        { id: 'order-to-cash', name: 'Order to Cash', y: 50 },
        { id: 'lead-to-order', name: 'Lead to Order', y: 300 },
        { id: 'trouble-to-resolve', name: 'Trouble to Resolve', y: 550 },
        { id: 'usage-to-cash', name: 'Usage to Cash', y: 800 },
      ];
      
      processGroups.forEach((process) => {
        newNodes.push({
          id: `process-${process.id}`,
          type: 'swimLane',
          position: { x: 0, y: process.y },
          data: {
            domain: 'process',
            label: process.name,
            description: 'End-to-end business process',
          },
          style: {
            width: 1200,
            height: 200,
            zIndex: -1,
          },
          draggable: false,
          selectable: false,
        });
      });
      
      // Add applications to process lanes based on their capabilities
      applications.forEach((app: any, index: number) => {
        if (filterDomain !== 'all' && (app.tmfDomain || 'enterprise') !== filterDomain) return;
        
        // Simple assignment logic - in reality, this would be based on actual process mapping
        const processIndex = index % processGroups.length;
        const process = processGroups[processIndex];
        
        newNodes.push({
          id: `app-${app.id}`,
          type: 'tmfDomain',
          position: {
            x: 100 + (index % 4) * 250,
            y: process.y + 50,
          },
          data: {
            ...app,
            label: app.name,
            tmfDomain: app.tmfDomain || 'enterprise',
          },
        });
      });
    }

    setNodes(newNodes);
    setEdges(newEdges);
  }, [applications, interfaces, selectedView, filterDomain, showSwimLanes, appsLoading, interfacesLoading]);

  const getSwimLaneDescription = (domain: string) => {
    const descriptions: Record<string, string> = {
      product: 'Product lifecycle, catalog, and offering management',
      customer: 'Customer relationship and experience management',
      service: 'Service design, fulfillment, and assurance',
      resource: 'Network and IT resource management',
      partner: 'Partner and supplier relationship management',
      enterprise: 'Enterprise governance and support systems',
    };
    return descriptions[domain] || '';
  };

  const handleExportImage = useCallback(async () => {
    const element = document.querySelector('.react-flow') as HTMLElement;
    if (!element) return;

    try {
      const dataUrl = await toPng(element, {
        backgroundColor: '#ffffff',
        width: element.offsetWidth,
        height: element.offsetHeight,
      });

      const link = document.createElement('a');
      link.download = `tmf-domain-view-${new Date().toISOString().split('T')[0]}.png`;
      link.href = dataUrl;
      link.click();
      
      toast({
        title: "Success",
        description: "Domain view exported as image",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export image",
        variant: "destructive",
      });
    }
  }, [toast]);

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: true,
        }}
      >
        <Panel position="top-left" className="bg-white p-4 rounded-lg shadow-lg">
          <div className="space-y-4">
            <Tabs value={selectedView} onValueChange={(v) => setSelectedView(v as any)}>
              <TabsList>
                <TabsTrigger value="domain">Domain View</TabsTrigger>
                <TabsTrigger value="interaction">Interaction View</TabsTrigger>
                <TabsTrigger value="process">Process View</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <Select value={filterDomain} onValueChange={setFilterDomain}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by domain" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Domains</SelectItem>
                  <SelectItem value="product">Product</SelectItem>
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                  <SelectItem value="resource">Resource</SelectItem>
                  <SelectItem value="partner">Partner</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSwimLanes(!showSwimLanes)}
              >
                <Layers className="w-4 h-4 mr-2" />
                {showSwimLanes ? 'Hide' : 'Show'} Swim Lanes
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPatterns(true)}
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Integration Patterns
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportImage}
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </Panel>

        <Background variant="dots" gap={12} size={1} />
        <Controls />
        <MiniMap 
          nodeColor={(node) => {
            if (node.type === 'swimLane') return '#e2e8f0';
            const domain = node.data?.tmfDomain;
            return TMF_DOMAIN_COLORS[domain as keyof typeof TMF_DOMAIN_COLORS] || '#94A3B8';
          }}
        />
      </ReactFlow>

      {/* Integration Patterns Dialog */}
      <Dialog open={showPatterns} onOpenChange={setShowPatterns}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>TM Forum Integration Patterns</DialogTitle>
          </DialogHeader>
          <TMFIntegrationPatterns />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default function TMFDomainView() {
  return (
    <div className="flex flex-col h-screen">
      <div className="p-6 border-b">
        <h1 className="text-3xl font-bold">TM Forum Domain View</h1>
        <p className="text-gray-600 mt-2">
          Visualize your application architecture from a TM Forum domain perspective
        </p>
      </div>
      
      <div className="flex-1 p-6">
        <Card className="h-full">
          <CardContent className="p-0 h-full">
            <ReactFlowProvider>
              <TMFDomainViewContent />
            </ReactFlowProvider>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}