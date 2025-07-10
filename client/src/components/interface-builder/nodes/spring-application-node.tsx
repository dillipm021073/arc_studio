import { memo, useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Settings, 
  MoreVertical,
  Edit3,
  Trash2,
  Copy,
  Zap,
  Database,
  Globe,
  Code,
  Clock,
  Activity,
  Shield,
  Package,
  Server
} from 'lucide-react';

interface SpringApplicationNodeData {
  id: string;
  name: string;
  description: string;
  color: string;
  properties: {
    framework: string;
    buildTool: string;
    springVersion: string;
    javaVersion: string;
    database?: string;
    apiTypes: string[];
    runMode: string[];
    containerization?: string;
    features: string[];
    security?: string;
    monitoring?: string;
    deployment?: string;
  };
  connectionPoints: {
    input: Array<{ id: string; type: string; position: 'top' | 'bottom' | 'left' | 'right' }>;
    output: Array<{ id: string; type: string; position: 'top' | 'bottom' | 'left' | 'right' }>;
  };
  isConfigured?: boolean;
  status?: 'active' | 'inactive' | 'error' | 'warning';
  metrics?: {
    uptime?: number;
    responseTime?: number;
    throughput?: number;
    cpuUsage?: number;
    memoryUsage?: number;
  };
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
}

export default memo(function SpringApplicationNode({ data, selected }: NodeProps<SpringApplicationNodeData>) {
  const [showDetails, setShowDetails] = useState(false);
  
  const getStatusColor = (status: string = 'inactive') => {
    switch (status) {
      case 'active': return 'border-green-500 bg-green-500/10';
      case 'error': return 'border-red-500 bg-red-500/10';
      case 'warning': return 'border-yellow-500 bg-yellow-500/10';
      default: return 'border-gray-500 bg-gray-500/10';
    }
  };

  const getApiTypeIcon = (apiType: string) => {
    switch (apiType) {
      case 'REST': return <Globe className="h-3 w-3" />;
      case 'SOAP': return <Code className="h-3 w-3" />;
      case 'GraphQL': return <Zap className="h-3 w-3" />;
      default: return <Activity className="h-3 w-3" />;
    }
  };

  const getRunModeIcon = (mode: string) => {
    switch (mode) {
      case 'Batch': return <Clock className="h-3 w-3" />;
      case 'Daemon': return <Server className="h-3 w-3" />;
      case 'Web': return <Globe className="h-3 w-3" />;
      default: return <Activity className="h-3 w-3" />;
    }
  };

  return (
    <Card 
      className={`
        w-80 transition-all duration-200 drag-handle cursor-move relative
        ${selected ? 'ring-2 ring-blue-500 ring-opacity-75' : ''}
        ${getStatusColor(data.status)}
        bg-gray-800 border-gray-600 hover:border-gray-500
      `}
    >
      {/* Input Connection Points */}
      {data.connectionPoints.input.map((point, index) => (
        <Handle
          key={`input-${point.id}`}
          type="target"
          position={Position[point.position.charAt(0).toUpperCase() + point.position.slice(1) as keyof typeof Position]}
          id={point.id}
          className="w-3 h-3 border-2 border-gray-400 bg-gray-800"
          style={{
            [point.position === 'left' ? 'left' : point.position === 'right' ? 'right' : point.position]: 
              point.position === 'left' || point.position === 'right' ? 
                `${30 + (index * 25)}%` : 
                `${20 + (index * 30)}%`
          }}
        />
      ))}
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-lg ${data.color} text-white`}>
                <Zap className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white truncate">
                  {data.name}
                </h3>
                <p className="text-xs text-gray-400 truncate">
                  {data.description}
                </p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-6 w-6 p-0 hover:bg-gray-700"
                >
                  <MoreVertical className="h-3 w-3 text-gray-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-gray-800 border-gray-700" align="end">
                <DropdownMenuItem 
                  onClick={data.onEdit}
                  className="text-gray-300 hover:bg-gray-700 cursor-pointer"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit Properties
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={data.onDuplicate}
                  className="text-gray-300 hover:bg-gray-700 cursor-pointer"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-gray-300 hover:bg-gray-700 cursor-pointer"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  {showDetails ? 'Hide' : 'Show'} Details
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-gray-700" />
                <DropdownMenuItem 
                  onClick={data.onDelete}
                  className="text-red-400 hover:bg-red-900/20 cursor-pointer"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="pt-0 space-y-3">
          {/* Core Spring Properties */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="space-y-1">
              <span className="text-gray-500">Framework</span>
              <Badge variant="outline" className="text-xs border-green-600 text-green-400">
                {data.properties.framework}
              </Badge>
            </div>
            
            <div className="space-y-1">
              <span className="text-gray-500">Build Tool</span>
              <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">
                {data.properties.buildTool}
              </Badge>
            </div>
            
            <div className="space-y-1">
              <span className="text-gray-500">Spring</span>
              <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">
                {data.properties.springVersion}
              </Badge>
            </div>
            
            <div className="space-y-1">
              <span className="text-gray-500">Java</span>
              <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">
                {data.properties.javaVersion}
              </Badge>
            </div>
          </div>

          {/* API Types */}
          <div className="space-y-1">
            <span className="text-xs text-gray-500">API Types</span>
            <div className="flex flex-wrap gap-1">
              {data.properties.apiTypes.map((apiType) => (
                <Badge 
                  key={apiType}
                  variant="outline" 
                  className="text-xs border-blue-600 text-blue-400"
                >
                  <span className="mr-1">{getApiTypeIcon(apiType)}</span>
                  {apiType}
                </Badge>
              ))}
            </div>
          </div>

          {/* Run Modes */}
          <div className="space-y-1">
            <span className="text-xs text-gray-500">Run Modes</span>
            <div className="flex flex-wrap gap-1">
              {data.properties.runMode.map((mode) => (
                <Badge 
                  key={mode}
                  variant="outline" 
                  className="text-xs border-purple-600 text-purple-400"
                >
                  <span className="mr-1">{getRunModeIcon(mode)}</span>
                  {mode}
                </Badge>
              ))}
            </div>
          </div>

          {/* Features */}
          {data.properties.features.length > 0 && (
            <div className="space-y-1 pt-2 border-t border-gray-700">
              <div className="text-xs text-gray-500">Features</div>
              <div className="flex flex-wrap gap-1">
                {data.properties.features.slice(0, showDetails ? undefined : 3).map((feature) => (
                  <Badge 
                    key={feature}
                    variant="outline" 
                    className="text-xs border-gray-600 text-gray-400"
                  >
                    {feature}
                  </Badge>
                ))}
                {!showDetails && data.properties.features.length > 3 && (
                  <Badge variant="outline" className="text-xs border-gray-600 text-gray-500">
                    +{data.properties.features.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Additional Details (when expanded) */}
          {showDetails && (
            <>
              {data.properties.database && (
                <div className="space-y-1 pt-2 border-t border-gray-700">
                  <div className="flex items-center gap-2">
                    <Database className="h-3 w-3 text-gray-500" />
                    <span className="text-xs text-gray-500">Database</span>
                  </div>
                  <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">
                    {data.properties.database}
                  </Badge>
                </div>
              )}

              {data.properties.security && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Shield className="h-3 w-3 text-gray-500" />
                    <span className="text-xs text-gray-500">Security</span>
                  </div>
                  <Badge variant="outline" className="text-xs border-amber-600 text-amber-400">
                    {data.properties.security}
                  </Badge>
                </div>
              )}

              {data.properties.containerization && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Package className="h-3 w-3 text-gray-500" />
                    <span className="text-xs text-gray-500">Container</span>
                  </div>
                  <Badge variant="outline" className="text-xs border-cyan-600 text-cyan-400">
                    {data.properties.containerization}
                  </Badge>
                </div>
              )}
            </>
          )}

          {/* Metrics */}
          {data.metrics && (
            <div className="space-y-2 pt-2 border-t border-gray-700">
              <div className="text-xs text-gray-500">Performance Metrics</div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {data.metrics.uptime !== undefined && (
                  <div className="text-center">
                    <div className={`font-medium ${
                      data.metrics.uptime >= 99 ? 'text-green-400' :
                      data.metrics.uptime >= 95 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {data.metrics.uptime}%
                    </div>
                    <div className="text-gray-500">Uptime</div>
                  </div>
                )}
                
                {data.metrics.responseTime !== undefined && (
                  <div className="text-center">
                    <div className={`font-medium ${
                      data.metrics.responseTime <= 200 ? 'text-green-400' :
                      data.metrics.responseTime <= 500 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {data.metrics.responseTime}ms
                    </div>
                    <div className="text-gray-500">Response</div>
                  </div>
                )}
                
                {data.metrics.throughput !== undefined && (
                  <div className="text-center">
                    <div className="text-blue-400 font-medium">
                      {data.metrics.throughput}
                    </div>
                    <div className="text-gray-500">RPS</div>
                  </div>
                )}
              </div>
              
              {showDetails && (data.metrics.cpuUsage !== undefined || data.metrics.memoryUsage !== undefined) && (
                <div className="grid grid-cols-2 gap-2 text-xs pt-2">
                  {data.metrics.cpuUsage !== undefined && (
                    <div className="text-center">
                      <div className={`font-medium ${
                        data.metrics.cpuUsage <= 60 ? 'text-green-400' :
                        data.metrics.cpuUsage <= 80 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {data.metrics.cpuUsage}%
                      </div>
                      <div className="text-gray-500">CPU</div>
                    </div>
                  )}
                  
                  {data.metrics.memoryUsage !== undefined && (
                    <div className="text-center">
                      <div className={`font-medium ${
                        data.metrics.memoryUsage <= 60 ? 'text-green-400' :
                        data.metrics.memoryUsage <= 80 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {data.metrics.memoryUsage}%
                      </div>
                      <div className="text-gray-500">Memory</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Status and Configuration */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <Badge 
                variant={data.isConfigured ? "default" : "outline"}
                className={`text-xs ${
                  data.isConfigured 
                    ? "bg-green-600 text-white" 
                    : "border-gray-600 text-gray-400"
                }`}
              >
                {data.isConfigured ? "Configured" : "Setup Required"}
              </Badge>
              
              {data.properties.security && (
                <Badge variant="outline" className="text-xs border-amber-600 text-amber-400">
                  🔒 Secured
                </Badge>
              )}
            </div>
            
            {data.status && (
              <div className={`w-2 h-2 rounded-full ${
                data.status === 'active' ? 'bg-green-500 animate-pulse' :
                data.status === 'error' ? 'bg-red-500' :
                data.status === 'warning' ? 'bg-yellow-500' :
                'bg-gray-500'
              }`} />
            )}
          </div>
        </CardContent>
        
        {/* Output Connection Points */}
        {data.connectionPoints.output.map((point, index) => (
          <Handle
            key={`output-${point.id}`}
            type="source"
            position={Position[point.position.charAt(0).toUpperCase() + point.position.slice(1) as keyof typeof Position]}
            id={point.id}
            className="w-3 h-3 border-2 border-blue-400 bg-blue-600"
            style={{
              [point.position === 'left' ? 'left' : point.position === 'right' ? 'right' : point.position]: 
                point.position === 'left' || point.position === 'right' ? 
                  `${30 + (index * 25)}%` : 
                  `${20 + (index * 30)}%`
            }}
          />
        ))}
      </Card>
  );
});