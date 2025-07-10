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
  Globe,
  Smartphone,
  Server,
  Database,
  Cloud,
  Activity,
  Cpu,
  HardDrive,
  MoreVertical,
  Edit3,
  Trash2,
  Copy,
  Maximize,
  Minimize,
  Building,
  Package
} from 'lucide-react';
import ResizeHandles from './resize-handles';

const iconMap = {
  'web-application': Globe,
  'mobile-app': Smartphone,
  'api-service': Server,
  'database-system': Database,
  'cloud-service': Cloud,
  'legacy-application': Building,
  'weblogic-application': Server,
  'spring-boot-application': Package,
};

interface ApplicationNodeData {
  id: string;
  name: string;
  description: string;
  color: string;
  properties: Record<string, any>;
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
  };
  width?: number;
  height?: number;
  isResizeMode?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onUpdate?: (data: any) => void;
}

export default memo(function ApplicationNode({ data, selected }: NodeProps<ApplicationNodeData>) {
  const Icon = iconMap[data.id as keyof typeof iconMap] || Activity;
  const width = data.width || 288; // Default width (w-72 = 18rem = 288px)
  const height = data.height || 400; // Default height based on content
  
  const getStatusColor = (status: string = 'inactive') => {
    switch (status) {
      case 'active': return 'border-green-500 bg-green-500/10';
      case 'error': return 'border-red-500 bg-red-500/10';
      case 'warning': return 'border-yellow-500 bg-yellow-500/10';
      default: return 'border-gray-500 bg-gray-500/10';
    }
  };

  const getDeploymentIcon = (deployment: string) => {
    switch (deployment?.toLowerCase()) {
      case 'docker': return <Cpu className="h-3 w-3" />;
      case 'kubernetes': return <Cloud className="h-3 w-3" />;
      case 'vm': return <HardDrive className="h-3 w-3" />;
      default: return <Server className="h-3 w-3" />;
    }
  };

  const handleResize = (newWidth: number, newHeight: number) => {
    if (data.onUpdate) {
      data.onUpdate({ width: newWidth, height: newHeight });
    }
  };

  return (
    <div style={{ position: 'relative', width: `${width}px`, height: `${height}px` }}>
      <ResizeHandles
        width={width}
        height={height}
        minWidth={100}
        minHeight={80}
        maxWidth={800}
        maxHeight={1000}
        onResize={handleResize}
        visible={data.isResizeMode || false}
      />
      <Card 
        className={`
          transition-all duration-200 drag-handle cursor-move relative rounded-2xl h-full
          ${selected ? 'ring-2 ring-blue-500 ring-opacity-75' : ''}
          ${getStatusColor(data.status)}
          bg-gray-800 border-gray-600 hover:border-gray-500
        `}
        style={{ width: '100%', height: '100%' }}
      >
      {/* Input Connection Points */}
      {data.connectionPoints.input.map((point, index) => (
        <Handle
          key={`input-${point.id}`}
          type="target"
          position={Position[point.position.charAt(0).toUpperCase() + point.position.slice(1) as keyof typeof Position]}
          id={point.id}
          className="w-3 h-3 rounded-full border-2 border-gray-400 bg-gray-800"
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
              <div className={`${width < 150 ? 'p-1' : 'p-2'} rounded-lg ${data.color} text-white`}>
                <Icon className={width < 150 ? 'h-3 w-3' : width < 200 ? 'h-4 w-4' : 'h-5 w-5'} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={`font-semibold text-white truncate ${width < 150 ? 'text-xs' : width < 200 ? 'text-sm' : 'text-base'}`}>
                  {data.name}
                </h3>
                <p className={`text-gray-400 ${width < 200 ? 'text-[10px]' : 'text-xs'} ${width > 250 ? 'truncate' : 'line-clamp-2'}`}>
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

        <CardContent className={`pt-0 ${height < 150 ? 'hidden' : 'space-y-3'}`}>
          {/* Application Properties */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {data.properties.framework && (
              <div className="space-y-1">
                <span className="text-gray-500">Framework</span>
                <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">
                  {data.properties.framework}
                </Badge>
              </div>
            )}
            
            {data.properties.runtime && (
              <div className="space-y-1">
                <span className="text-gray-500">Runtime</span>
                <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">
                  {data.properties.runtime}
                </Badge>
              </div>
            )}
            
            {data.properties.deployment && (
              <div className="space-y-1">
                <span className="text-gray-500">Deployment</span>
                <div className="flex items-center gap-1">
                  {getDeploymentIcon(data.properties.deployment)}
                  <span className="text-gray-300 text-xs">{data.properties.deployment}</span>
                </div>
              </div>
            )}
            
            {data.properties.scaling && (
              <div className="space-y-1">
                <span className="text-gray-500">Scaling</span>
                <Badge 
                  variant="outline" 
                  className={`text-xs border-gray-600 ${
                    data.properties.scaling === 'Horizontal' ? 'text-green-400' : 'text-yellow-400'
                  }`}
                >
                  {data.properties.scaling}
                </Badge>
              </div>
            )}
          </div>

          {/* Custom Properties Display */}
          {data.properties && Object.keys(data.properties).length > 0 && (
            <div className="space-y-1 pt-2 border-t border-gray-700">
              <div className="text-xs text-gray-500 mb-1">Custom Properties</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(data.properties).slice(0, 4).map(([key, value]) => (
                  <div key={key} className="truncate">
                    <span className="text-gray-500">{key}: </span>
                    <span className="text-gray-300">
                      {typeof value === 'boolean' ? (value ? '✓' : '✗') : String(value)}
                    </span>
                  </div>
                ))}
                {Object.keys(data.properties).length > 4 && (
                  <div className="col-span-2 text-gray-500">+{Object.keys(data.properties).length - 4} more...</div>
                )}
              </div>
            </div>
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
              
              {data.properties.authentication && (
                <Badge variant="outline" className="text-xs border-blue-600 text-blue-400">
                  🔒 Secured
                </Badge>
              )}
            </div>
            
            {data.status && (
              <div className={`w-2 h-2 rounded-full ${
                data.status === 'active' ? 'bg-green-500' :
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
            className="w-3 h-3 rounded-full border-2 border-blue-400 bg-blue-600"
            style={{
              [point.position === 'left' ? 'left' : point.position === 'right' ? 'right' : point.position]: 
                point.position === 'left' || point.position === 'right' ? 
                  `${30 + (index * 25)}%` : 
                  `${20 + (index * 30)}%`
            }}
          />
        ))}
      </Card>
    </div>
  );
});