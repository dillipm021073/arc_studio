import { useState, useEffect } from 'react';
import { Node } from 'reactflow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { interfaceBuilderApi } from '@/services/interface-builder-api';
import { 
  Settings, 
  Network, 
  Shield, 
  Activity,
  Info,
  Zap,
  Database,
  Server,
  Cloud,
  Globe,
  Lock,
  AlertCircle,
  Plus,
  Trash2,
  TrendingUp,
  RotateCw,
  X
} from 'lucide-react';

interface ComponentLibraryItem {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: any;
  color: string;
  properties?: any;
  connectionPoints?: any;
  bestPractices?: string[];
  examples?: string[];
}

interface UnifiedPropertiesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  selectedComponent?: ComponentLibraryItem | null;
  selectedNode?: Node | null;
  onNodeSave?: (nodeId: string, data: any) => void;
  isResizeMode?: boolean;
  onToggleResizeMode?: () => void;
}

export default function UnifiedPropertiesPanel({ 
  isOpen, 
  onClose, 
  selectedComponent, 
  selectedNode, 
  onNodeSave,
  isResizeMode = false,
  onToggleResizeMode
}: UnifiedPropertiesPanelProps) {
  const [editedData, setEditedData] = useState<any>({});
  const [activeTab, setActiveTab] = useState('general');

  // Initialize data when node is selected
  useEffect(() => {
    if (selectedNode) {
      setEditedData({
        name: selectedNode.data.name || '',
        description: selectedNode.data.description || '',
        status: selectedNode.data.status || 'active',
        version: selectedNode.data.version || '1.0',
        owner: selectedNode.data.owner || '',
        team: selectedNode.data.team || '',
        environment: selectedNode.data.environment || 'production',
        security: selectedNode.data.security || 'standard',
        protocol: selectedNode.data.protocol || 'https',
        port: selectedNode.data.port || '',
        endpoint: selectedNode.data.endpoint || '',
        authentication: selectedNode.data.authentication || 'token',
        rateLimit: selectedNode.data.rateLimit || '',
        timeout: selectedNode.data.timeout || '30',
        retryPolicy: selectedNode.data.retryPolicy || 'exponential',
        healthCheck: selectedNode.data.healthCheck || true,
        monitoring: selectedNode.data.monitoring || true,
        logging: selectedNode.data.logging || true,
        properties: selectedNode.data.properties || {},
        metrics: selectedNode.data.metrics || {},
        ...selectedNode.data
      });
      setActiveTab('general');
    }
  }, [selectedNode]);

  const handleSave = () => {
    if (selectedNode && onNodeSave) {
      onNodeSave(selectedNode.id, {
        ...selectedNode.data,
        ...editedData,
        metrics: editedData.metrics || {},
        isConfigured: true,
        lastModified: new Date().toISOString()
      });
    }
  };

  const getNodeTypeConfig = () => {
    if (!selectedNode) return { icon: Settings, color: 'bg-gray-600' };
    
    switch (selectedNode.type) {
      case 'api-service': return { icon: Globe, color: 'bg-blue-600' };
      case 'database-system': return { icon: Database, color: 'bg-green-600' };
      case 'message-queue': return { icon: Network, color: 'bg-purple-600' };
      case 'web-application': return { icon: Globe, color: 'bg-orange-600' };
      case 'cloud-service': return { icon: Cloud, color: 'bg-sky-600' };
      default: return { icon: Server, color: 'bg-gray-600' };
    }
  };

  if (!isOpen) return null;

  return (
    <div className="w-80 bg-gray-900 border-l border-gray-700 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Properties</h3>
          <div className="flex items-center gap-2">
            {/* Resize Mode Toggle */}
            {selectedNode && onToggleResizeMode && (
              <Button
                variant={isResizeMode ? "default" : "ghost"}
                size="sm"
                onClick={onToggleResizeMode}
                className={`h-8 w-8 p-0 ${isResizeMode ? 'bg-blue-600 hover:bg-blue-700' : 'hover:bg-gray-700'}`}
                title="Toggle Resize Mode (R)"
              >
                <RotateCw className="h-4 w-4" />
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-gray-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Resize Mode Indicator */}
        {isResizeMode && selectedNode && (
          <div className="mt-2 p-2 bg-blue-600/20 border border-blue-600/30 rounded-lg">
            <div className="flex items-center gap-2 text-blue-400 text-sm">
              <RotateCw className="h-3 w-3" />
              <span>Resize Mode Active</span>
            </div>
            <p className="text-xs text-blue-300 mt-1">Click and drag node corners to resize</p>
          </div>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {/* Component Library Selection */}
        {selectedComponent && !selectedNode && (
          <div className="p-4 space-y-4">
            {/* Component Info */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${selectedComponent.color} text-white`}>
                    <selectedComponent.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm text-white">{selectedComponent.name}</CardTitle>
                    <Badge variant="outline" className="text-xs text-gray-400 border-gray-600 mt-1">
                      {selectedComponent.category}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-gray-400">{selectedComponent.description}</p>
              </CardContent>
            </Card>

            {/* Properties */}
            {selectedComponent.properties && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-white flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                  {Object.entries(selectedComponent.properties).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center py-1">
                      <span className="text-xs text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                      <span className="text-xs text-white font-mono">{String(value)}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Connection Points */}
            {selectedComponent.connectionPoints && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-white flex items-center gap-2">
                    <Network className="h-4 w-4" />
                    Connection Points
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  {selectedComponent.connectionPoints.input && (
                    <div>
                      <h4 className="text-xs font-medium text-green-400 mb-1">Input</h4>
                      <div className="space-y-1">
                        {selectedComponent.connectionPoints.input.map((point: any, index: number) => (
                          <div key={index} className="flex items-center gap-2 text-xs">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-gray-300">{point.id}</span>
                            <Badge variant="outline" className="text-xs text-gray-400 border-gray-600">
                              {point.type}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {selectedComponent.connectionPoints.output && (
                    <div>
                      <h4 className="text-xs font-medium text-blue-400 mb-1">Output</h4>
                      <div className="space-y-1">
                        {selectedComponent.connectionPoints.output.map((point: any, index: number) => (
                          <div key={index} className="flex items-center gap-2 text-xs">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-gray-300">{point.id}</span>
                            <Badge variant="outline" className="text-xs text-gray-400 border-gray-600">
                              {point.type}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Best Practices */}
            {selectedComponent.bestPractices && selectedComponent.bestPractices.length > 0 && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-white flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Best Practices
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="space-y-1">
                    {selectedComponent.bestPractices.map((practice, index) => (
                      <li key={index} className="text-xs text-gray-400 flex items-start gap-2">
                        <span className="text-yellow-500 mt-0.5">•</span>
                        <span>{practice}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Node Editor */}
        {selectedNode && (
          <div className="p-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-5 bg-gray-800">
                <TabsTrigger value="general" className="text-xs">General</TabsTrigger>
                <TabsTrigger value="connection" className="text-xs">Connection</TabsTrigger>
                <TabsTrigger value="performance" className="text-xs">Performance</TabsTrigger>
                <TabsTrigger value="security" className="text-xs">Security</TabsTrigger>
                <TabsTrigger value="advanced" className="text-xs">Advanced</TabsTrigger>
              </TabsList>

              {/* General Tab */}
              <TabsContent value="general" className="space-y-4 mt-4">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      {(() => {
                        const { icon: Icon, color } = getNodeTypeConfig();
                        return (
                          <div className={`p-2 rounded-lg ${color} text-white`}>
                            <Icon className="h-4 w-4" />
                          </div>
                        );
                      })()}
                      <div>
                        <CardTitle className="text-sm text-white">{selectedNode.type}</CardTitle>
                        <Badge variant="outline" className="text-xs text-gray-400 border-gray-600 mt-1">
                          Node ID: {selectedNode.id}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                <div className="space-y-3">
                  <div>
                    <Label className="text-white text-sm">Name</Label>
                    <Input
                      value={editedData.name || ''}
                      onChange={(e) => setEditedData({ ...editedData, name: e.target.value })}
                      className="bg-gray-800 border-gray-600 text-white"
                      placeholder="Enter component name"
                    />
                  </div>

                  <div>
                    <Label className="text-white text-sm">Description</Label>
                    <Textarea
                      value={editedData.description || ''}
                      onChange={(e) => setEditedData({ ...editedData, description: e.target.value })}
                      className="bg-gray-800 border-gray-600 text-white"
                      placeholder="Enter component description"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-white text-sm">Status</Label>
                      <Select value={editedData.status} onValueChange={(value) => setEditedData({ ...editedData, status: value })}>
                        <SelectTrigger className="bg-gray-800 border-gray-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-600">
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                          <SelectItem value="deprecated">Deprecated</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-white text-sm">Version</Label>
                      <Input
                        value={editedData.version || ''}
                        onChange={(e) => setEditedData({ ...editedData, version: e.target.value })}
                        className="bg-gray-800 border-gray-600 text-white"
                        placeholder="1.0"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-white text-sm">Owner</Label>
                      <Input
                        value={editedData.owner || ''}
                        onChange={(e) => setEditedData({ ...editedData, owner: e.target.value })}
                        className="bg-gray-800 border-gray-600 text-white"
                        placeholder="Team/Person"
                      />
                    </div>

                    <div>
                      <Label className="text-white text-sm">Environment</Label>
                      <Select value={editedData.environment} onValueChange={(value) => setEditedData({ ...editedData, environment: value })}>
                        <SelectTrigger className="bg-gray-800 border-gray-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-600">
                          <SelectItem value="development">Development</SelectItem>
                          <SelectItem value="staging">Staging</SelectItem>
                          <SelectItem value="production">Production</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Connection Tab */}
              <TabsContent value="connection" className="space-y-4 mt-4">
                <div className="space-y-3">
                  <div>
                    <Label className="text-white text-sm">Protocol</Label>
                    <Select value={editedData.protocol} onValueChange={(value) => setEditedData({ ...editedData, protocol: value })}>
                      <SelectTrigger className="bg-gray-800 border-gray-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        <SelectItem value="https">HTTPS</SelectItem>
                        <SelectItem value="http">HTTP</SelectItem>
                        <SelectItem value="soap">SOAP</SelectItem>
                        <SelectItem value="websocket">WebSocket</SelectItem>
                        <SelectItem value="tcp">TCP</SelectItem>
                        <SelectItem value="udp">UDP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-white text-sm">Port</Label>
                      <Input
                        value={editedData.port || ''}
                        onChange={(e) => setEditedData({ ...editedData, port: e.target.value })}
                        className="bg-gray-800 border-gray-600 text-white"
                        placeholder="8080"
                      />
                    </div>

                    <div>
                      <Label className="text-white text-sm">Timeout (seconds)</Label>
                      <Input
                        value={editedData.timeout || ''}
                        onChange={(e) => setEditedData({ ...editedData, timeout: e.target.value })}
                        className="bg-gray-800 border-gray-600 text-white"
                        placeholder="30"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-white text-sm">Endpoint</Label>
                    <Input
                      value={editedData.endpoint || ''}
                      onChange={(e) => setEditedData({ ...editedData, endpoint: e.target.value })}
                      className="bg-gray-800 border-gray-600 text-white"
                      placeholder="/api/v1"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Performance Tab */}
              <TabsContent value="performance" className="space-y-4 mt-4">
                <div className="space-y-3">
                  <div>
                    <Label className="text-white text-sm">Rate Limit (requests/min)</Label>
                    <Input
                      value={editedData.rateLimit || ''}
                      onChange={(e) => setEditedData({ ...editedData, rateLimit: e.target.value })}
                      className="bg-gray-800 border-gray-600 text-white"
                      placeholder="1000"
                    />
                  </div>

                  <div>
                    <Label className="text-white text-sm">Retry Policy</Label>
                    <Select value={editedData.retryPolicy} onValueChange={(value) => setEditedData({ ...editedData, retryPolicy: value })}>
                      <SelectTrigger className="bg-gray-800 border-gray-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="linear">Linear</SelectItem>
                        <SelectItem value="exponential">Exponential</SelectItem>
                        <SelectItem value="fixed">Fixed Delay</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-white text-sm">Health Check</Label>
                      <Switch
                        checked={editedData.healthCheck}
                        onCheckedChange={(checked) => setEditedData({ ...editedData, healthCheck: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="text-white text-sm">Monitoring</Label>
                      <Switch
                        checked={editedData.monitoring}
                        onCheckedChange={(checked) => setEditedData({ ...editedData, monitoring: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="text-white text-sm">Logging</Label>
                      <Switch
                        checked={editedData.logging}
                        onCheckedChange={(checked) => setEditedData({ ...editedData, logging: checked })}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Security Tab */}
              <TabsContent value="security" className="space-y-4 mt-4">
                <div className="space-y-3">
                  <div>
                    <Label className="text-white text-sm">Security Level</Label>
                    <Select value={editedData.security} onValueChange={(value) => setEditedData({ ...editedData, security: value })}>
                      <SelectTrigger className="bg-gray-800 border-gray-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        <SelectItem value="basic">Basic</SelectItem>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-white text-sm">Authentication</Label>
                    <Select value={editedData.authentication} onValueChange={(value) => setEditedData({ ...editedData, authentication: value })}>
                      <SelectTrigger className="bg-gray-800 border-gray-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="basic">Basic Auth</SelectItem>
                        <SelectItem value="token">Token</SelectItem>
                        <SelectItem value="oauth">OAuth</SelectItem>
                        <SelectItem value="jwt">JWT</SelectItem>
                        <SelectItem value="certificate">Certificate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              {/* Advanced Tab */}
              <TabsContent value="advanced" className="space-y-4 mt-4">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-white">Custom Properties</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      {Object.entries(editedData.properties || {}).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-2">
                          <Input
                            value={key}
                            className="bg-gray-700 border-gray-600 text-white text-xs"
                            readOnly
                          />
                          <Input
                            value={String(value)}
                            onChange={(e) => setEditedData({
                              ...editedData,
                              properties: { ...editedData.properties, [key]: e.target.value }
                            })}
                            className="bg-gray-700 border-gray-600 text-white text-xs"
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              const newProps = { ...editedData.properties };
                              delete newProps[key];
                              setEditedData({ ...editedData, properties: newProps });
                            }}
                            className="h-8 w-8 p-0 hover:bg-gray-600"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Save Button */}
            <div className="mt-6 pt-4 border-t border-gray-700">
              <Button 
                onClick={handleSave}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                Save Changes
              </Button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!selectedComponent && !selectedNode && (
          <div className="p-8 text-center">
            <Info className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No Selection</h3>
            <p className="text-gray-400 text-sm">
              Select a component from the library or a node on the canvas to view and edit properties.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}