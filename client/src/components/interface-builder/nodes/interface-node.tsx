import { memo } from 'react';
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
  Activity, 
  Globe,
  MessageSquare,
  FileText,
  Database,
  Zap,
  Layers,
  Code,
  Coffee,
  Network,
  MoreVertical,
  Edit3,
  Copy,
  Trash2
} from 'lucide-react';

const iconMap = {
  'rest-api': Network,
  'graphql-api': Layers,
  'message-queue': MessageSquare,
  'file-transfer': FileText,
  'database-connection': Database,
  'webhook': Zap,
  'soap-service': Code,
  'ejb-interface': Coffee,
  'plsql-procedure': Database,
};

interface InterfaceNodeData {
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
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
}

export default memo(function InterfaceNode({ data, selected }: NodeProps<InterfaceNodeData>) {
  const Icon = iconMap[data.id as keyof typeof iconMap] || Activity;
  
  const getStatusColor = (status: string = 'inactive') => {
    switch (status) {
      case 'active': return 'border-green-500 bg-green-500/10';
      case 'error': return 'border-red-500 bg-red-500/10';
      case 'warning': return 'border-yellow-500 bg-yellow-500/10';
      default: return 'border-gray-500 bg-gray-500/10';
    }
  };

  const getMethodBadgeColor = (method: string) => {
    switch (method?.toUpperCase()) {
      case 'GET': return 'bg-green-600';
      case 'POST': return 'bg-blue-600';
      case 'PUT': return 'bg-yellow-600';
      case 'DELETE': return 'bg-red-600';
      case 'PATCH': return 'bg-purple-600';
      default: return 'bg-gray-600';
    }
  };

  return (
    <>
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
              point.position === 'top' || point.position === 'bottom' ? `${20 + (index * 40)}%` : undefined
          }}
        />
      ))}

      <Card 
        className={`
          w-64 transition-all duration-200 drag-handle cursor-move rounded-2xl
          ${selected ? 'ring-2 ring-blue-500 ring-opacity-75' : ''}
          ${getStatusColor(data.status)}
          bg-gray-800 border-gray-600 hover:border-gray-500
        `}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-lg ${data.color} text-white`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm text-white truncate">
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

        <CardContent className="pt-0 space-y-2">
          {/* Interface-specific properties */}
          {data.properties.method && (
            <div className="flex items-center gap-2">
              <Badge className={`text-xs ${getMethodBadgeColor(data.properties.method)} text-white`}>
                {data.properties.method}
              </Badge>
              <span className="text-xs text-gray-400 truncate">
                {data.properties.endpoint || data.properties.url || data.properties.queueName}
              </span>
            </div>
          )}

          {/* SOAP/WSDL specific */}
          {data.properties.wsdlUrl && (
            <div className="text-xs text-gray-400 truncate">
              <span className="text-gray-500">WSDL:</span> {data.properties.wsdlUrl}
            </div>
          )}

          {/* EJB specific */}
          {data.properties.jndiName && (
            <div className="text-xs text-gray-400">
              <span className="text-gray-500">JNDI:</span> {data.properties.jndiName}
            </div>
          )}

          {/* PL/SQL specific */}
          {data.properties.procedure && (
            <div className="text-xs text-gray-400">
              <span className="text-gray-500">Procedure:</span> {data.properties.procedure}
            </div>
          )}

          {data.properties.contentType && (
            <div className="text-xs text-gray-400">
              <span className="text-gray-500">Type:</span> {data.properties.contentType}
            </div>
          )}

          {data.properties.authentication && (
            <div className="text-xs text-gray-400">
              <span className="text-gray-500">Auth:</span> {data.properties.authentication}
            </div>
          )}

          {data.properties.protocol && (
            <div className="text-xs text-gray-400">
              <span className="text-gray-500">Protocol:</span> {data.properties.protocol}
            </div>
          )}

          {/* Custom Properties Display */}
          {data.properties && Object.keys(data.properties).length > 5 && (
            <div className="pt-1 border-t border-gray-700">
              <div className="grid grid-cols-2 gap-1 text-xs">
                {Object.entries(data.properties)
                  .filter(([key]) => !['method', 'endpoint', 'url', 'queueName', 'contentType', 'authentication', 'protocol', 'wsdlUrl', 'jndiName', 'procedure'].includes(key))
                  .slice(0, 4)
                  .map(([key, value]) => (
                    <div key={key} className="truncate">
                      <span className="text-gray-500">{key}: </span>
                      <span className="text-gray-300">
                        {typeof value === 'boolean' ? (value ? '✓' : '✗') : String(value)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Performance Metrics */}
          {data.metrics && (
            <div className="pt-2 border-t border-gray-700">
              <div className="grid grid-cols-3 gap-1 text-xs">
                {data.metrics.uptime !== undefined && (
                  <div className="text-center">
                    <div className={`font-medium ${
                      data.metrics.uptime >= 99 ? 'text-green-400' :
                      data.metrics.uptime >= 95 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {data.metrics.uptime}%
                    </div>
                    <div className="text-gray-500 text-[10px]">Uptime</div>
                  </div>
                )}
                
                {data.metrics.responseTime !== undefined && (
                  <div className="text-center">
                    <div className={`font-medium ${
                      data.metrics.responseTime <= 100 ? 'text-green-400' :
                      data.metrics.responseTime <= 300 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {data.metrics.responseTime}ms
                    </div>
                    <div className="text-gray-500 text-[10px]">Response</div>
                  </div>
                )}
                
                {data.metrics.throughput !== undefined && (
                  <div className="text-center">
                    <div className="text-blue-400 font-medium">
                      {data.metrics.throughput}
                    </div>
                    <div className="text-gray-500 text-[10px]">RPS</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Configuration status */}
          <div className="flex items-center justify-between pt-1">
            <Badge 
              variant={data.isConfigured ? "default" : "outline"}
              className={`text-xs ${
                data.isConfigured 
                  ? "bg-green-600 text-white" 
                  : "border-gray-600 text-gray-400"
              }`}
            >
              {data.isConfigured ? "Configured" : "Not Configured"}
            </Badge>
            
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
      </Card>

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
              point.position === 'top' || point.position === 'bottom' ? `${20 + (index * 40)}%` : undefined
          }}
        />
      ))}
    </>
  );
});