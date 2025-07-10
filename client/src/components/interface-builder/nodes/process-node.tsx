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
  Building2,
  Workflow,
  Activity,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  MoreVertical,
  Edit3,
  Copy,
  Trash2
} from 'lucide-react';

const iconMap = {
  'level-a-process': Building2,
  'level-b-process': Workflow,
  'level-c-process': Activity,
};

interface ProcessNodeData {
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
    completionRate?: number;
    averageTime?: number;
    errorRate?: number;
  };
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
}

export default memo(function ProcessNode({ data, selected }: NodeProps<ProcessNodeData>) {
  const Icon = iconMap[data.id as keyof typeof iconMap] || Activity;
  
  const getStatusColor = (status: string = 'inactive') => {
    switch (status) {
      case 'active': return 'border-green-500 bg-green-500/10';
      case 'error': return 'border-red-500 bg-red-500/10';
      case 'warning': return 'border-yellow-500 bg-yellow-500/10';
      default: return 'border-gray-500 bg-gray-500/10';
    }
  };

  const getLevelBadgeColor = (level: string) => {
    switch (level) {
      case 'A': return 'bg-indigo-600 text-white';
      case 'B': return 'bg-purple-600 text-white';
      case 'C': return 'bg-pink-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const getAutomationIcon = (automation: string) => {
    switch (automation?.toLowerCase()) {
      case 'full': return <CheckCircle className="h-3 w-3 text-green-400" />;
      case 'partial': return <AlertCircle className="h-3 w-3 text-yellow-400" />;
      case 'manual': return <Users className="h-3 w-3 text-blue-400" />;
      default: return <Activity className="h-3 w-3 text-gray-400" />;
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
          w-80 transition-all duration-200 drag-handle cursor-move rounded-2xl
          ${selected ? 'ring-2 ring-blue-500 ring-opacity-75' : ''}
          ${getStatusColor(data.status)}
          bg-gray-800 border-gray-600 hover:border-gray-500
        `}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-lg ${data.color} text-white`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-white truncate">
                    {data.name}
                  </h3>
                  {data.properties.level && (
                    <Badge className={`text-xs ${getLevelBadgeColor(data.properties.level)}`}>
                      Level {data.properties.level}
                    </Badge>
                  )}
                </div>
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

        <CardContent className="pt-0 space-y-3">
          {/* Process Properties */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {data.properties.lob && (
              <div className="space-y-1">
                <span className="text-gray-500">LOB</span>
                <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">
                  {data.properties.lob}
                </Badge>
              </div>
            )}
            
            {data.properties.owner && (
              <div className="space-y-1">
                <span className="text-gray-500">Owner</span>
                <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">
                  {data.properties.owner}
                </Badge>
              </div>
            )}
            
            {data.properties.criticality && (
              <div className="space-y-1">
                <span className="text-gray-500">Criticality</span>
                <Badge 
                  variant="outline" 
                  className={`text-xs border-gray-600 ${
                    data.properties.criticality === 'High' ? 'text-red-400' :
                    data.properties.criticality === 'Medium' ? 'text-yellow-400' : 'text-green-400'
                  }`}
                >
                  {data.properties.criticality}
                </Badge>
              </div>
            )}
            
            {data.properties.automation && (
              <div className="space-y-1">
                <span className="text-gray-500">Automation</span>
                <div className="flex items-center gap-1">
                  {getAutomationIcon(data.properties.automation)}
                  <span className="text-gray-300 text-xs">{data.properties.automation}</span>
                </div>
              </div>
            )}
          </div>

          {/* Sequence and Parent Info */}
          {(data.properties.parent || data.properties.sequence) && (
            <div className="space-y-1 pt-2 border-t border-gray-700">
              <div className="text-xs text-gray-500">Hierarchy</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {data.properties.parent && (
                  <div>
                    <span className="text-gray-500">Parent:</span>
                    <span className="text-gray-300 ml-1">{data.properties.parent}</span>
                  </div>
                )}
                {data.properties.sequence && (
                  <div>
                    <span className="text-gray-500">Seq:</span>
                    <Badge variant="outline" className="text-xs border-blue-600 text-blue-400 ml-1">
                      #{data.properties.sequence}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Custom Properties Display */}
          {data.properties && Object.keys(data.properties).filter(key => !['level', 'parent', 'sequence', 'lob', 'owner', 'criticality', 'automation', 'compliance'].includes(key)).length > 0 && (
            <div className="space-y-1 pt-2 border-t border-gray-700">
              <div className="text-xs text-gray-500">Custom Properties</div>
              <div className="grid grid-cols-2 gap-1 text-xs">
                {Object.entries(data.properties)
                  .filter(([key]) => !['level', 'parent', 'sequence', 'lob', 'owner', 'criticality', 'automation', 'compliance'].includes(key))
                  .slice(0, 4)
                  .map(([key, value]) => (
                    <div key={key} className="truncate">
                      <span className="text-gray-500">{key}: </span>
                      <span className="text-gray-300">
                        {typeof value === 'boolean' ? (value ? '✓' : '✗') : String(value)}
                      </span>
                    </div>
                  ))}
                {Object.keys(data.properties).filter(key => !['level', 'parent', 'sequence', 'lob', 'owner', 'criticality', 'automation', 'compliance'].includes(key)).length > 4 && (
                  <div className="col-span-2 text-gray-500">+{Object.keys(data.properties).filter(key => !['level', 'parent', 'sequence', 'lob', 'owner', 'criticality', 'automation', 'compliance'].includes(key)).length - 4} more...</div>
                )}
              </div>
            </div>
          )}

          {/* Process Metrics */}
          {data.metrics && (
            <div className="space-y-2 pt-2 border-t border-gray-700">
              <div className="text-xs text-gray-500">Process Metrics</div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {data.metrics.completionRate !== undefined && (
                  <div className="text-center">
                    <div className={`font-medium ${
                      data.metrics.completionRate >= 95 ? 'text-green-400' :
                      data.metrics.completionRate >= 80 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {data.metrics.completionRate}%
                    </div>
                    <div className="text-gray-500">Complete</div>
                  </div>
                )}
                
                {data.metrics.averageTime !== undefined && (
                  <div className="text-center">
                    <div className="text-blue-400 font-medium flex items-center justify-center gap-1">
                      <Clock className="h-3 w-3" />
                      {data.metrics.averageTime}h
                    </div>
                    <div className="text-gray-500">Avg Time</div>
                  </div>
                )}
                
                {data.metrics.errorRate !== undefined && (
                  <div className="text-center">
                    <div className={`font-medium ${
                      data.metrics.errorRate <= 1 ? 'text-green-400' :
                      data.metrics.errorRate <= 5 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {data.metrics.errorRate}%
                    </div>
                    <div className="text-gray-500">Errors</div>
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
              
              {data.properties.compliance && (
                <Badge variant="outline" className="text-xs border-purple-600 text-purple-400">
                  🛡️ Compliant
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