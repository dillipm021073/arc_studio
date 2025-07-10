import { useState, useEffect } from 'react';
import { Node } from 'reactflow';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import AddPropertyDialog from './add-property-dialog';
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
  Image as ImageIcon,
  Upload
} from 'lucide-react';

interface NodeEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  node: Node | null;
  onSave: (nodeId: string, data: any) => void;
}

export default function NodeEditDialog({ isOpen, onClose, node, onSave }: NodeEditDialogProps) {
  const [editedData, setEditedData] = useState<any>({});
  const [activeTab, setActiveTab] = useState('general');
  const [showAddPropertyDialog, setShowAddPropertyDialog] = useState(false);

  useEffect(() => {
    if (node) {
      setEditedData({
        name: node.data.name || '',
        description: node.data.description || '',
        status: node.data.status || 'active',
        version: node.data.version || '1.0',
        owner: node.data.owner || '',
        team: node.data.team || '',
        environment: node.data.environment || 'production',
        security: node.data.security || 'standard',
        protocol: node.data.protocol || 'https',
        port: node.data.port || '',
        endpoint: node.data.endpoint || '',
        authentication: node.data.authentication || 'token',
        rateLimit: node.data.rateLimit || '',
        timeout: node.data.timeout || '30',
        retryPolicy: node.data.retryPolicy || 'exponential',
        healthCheck: node.data.healthCheck || true,
        monitoring: node.data.monitoring || true,
        logging: node.data.logging || true,
        properties: node.data.properties || {},
        metrics: node.data.metrics || {},
        ...node.data
      });
    }
  }, [node]);

  const handleSave = () => {
    if (node) {
      onSave(node.id, {
        ...node.data,
        ...editedData,
        metrics: editedData.metrics || {},
        isConfigured: true,
        lastModified: new Date().toISOString()
      });
    }
  };

  const getNodeTypeConfig = () => {
    if (!node) return { icon: Settings, color: 'bg-gray-600' };
    
    switch (node.type) {
      case 'application':
        if (node.data.id?.includes('database')) {
          return { icon: Database, color: 'bg-gray-600' };
        } else if (node.data.id?.includes('cloud')) {
          return { icon: Cloud, color: 'bg-cyan-600' };
        } else if (node.data.id?.includes('api')) {
          return { icon: Server, color: 'bg-green-600' };
        }
        return { icon: Server, color: 'bg-blue-600' };
      case 'interface':
        if (node.data.id?.includes('rest') || node.data.id?.includes('graphql')) {
          return { icon: Network, color: 'bg-blue-600' };
        } else if (node.data.id?.includes('message')) {
          return { icon: Zap, color: 'bg-amber-600' };
        }
        return { icon: Network, color: 'bg-purple-600' };
      case 'process':
        return { icon: Activity, color: 'bg-indigo-600' };
      case 'image':
        return { icon: ImageIcon, color: 'bg-violet-600' };
      default:
        return { icon: Settings, color: 'bg-gray-600' };
    }
  };

  if (!node) return null;

  const { icon: Icon, color } = getNodeTypeConfig();

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[70vh] overflow-hidden flex flex-col bg-gray-900 border-gray-700">
        <DialogHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`p-1 rounded ${color}`}>
                <Icon className="h-3 w-3 text-white" />
              </div>
              <div>
                <DialogTitle className="text-white text-base">{node.data.name}</DialogTitle>
                <DialogDescription className="text-gray-400 text-xs">
                  {node.type === 'interface' ? 'Interface' : node.type === 'application' ? 'Application' : 'Process'} Properties
                </DialogDescription>
              </div>
            </div>
            <Badge variant="outline" className="text-xs border-gray-600 text-gray-400">
              {node.id}
            </Badge>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="flex w-full bg-gray-800 h-8 px-1">
              <TabsTrigger value="general" className="data-[state=active]:bg-gray-700 text-xs px-3 py-1 flex-1">
                General
              </TabsTrigger>
              <TabsTrigger value="connection" className="data-[state=active]:bg-gray-700 text-xs px-3 py-1 flex-1">
                Connection
              </TabsTrigger>
              <TabsTrigger value="performance" className="data-[state=active]:bg-gray-700 text-xs px-3 py-1 flex-1">
                Performance
              </TabsTrigger>
              <TabsTrigger value="security" className="data-[state=active]:bg-gray-700 text-xs px-3 py-1 flex-1">
                Security
              </TabsTrigger>
              <TabsTrigger value="advanced" className="data-[state=active]:bg-gray-700 text-xs px-3 py-1 flex-1">
                Advanced
              </TabsTrigger>
              <TabsTrigger value="custom" className="data-[state=active]:bg-gray-700 text-xs px-3 py-1 flex-1">
                Custom Properties
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto p-3">
              <TabsContent value="general" className="mt-0">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-3">
                    <div className="grid gap-1">
                      <Label htmlFor="name" className="text-gray-300 text-xs">Name</Label>
                      <Input
                        id="name"
                        value={editedData.name}
                        onChange={(e) => setEditedData({ ...editedData, name: e.target.value })}
                        className="bg-gray-800 border-gray-700 text-white h-7 text-xs"
                      />
                    </div>
                    
                    {node.type === 'image' && (
                      <>
                        <div className="col-span-2 grid gap-1">
                          <Label className="text-gray-300 text-xs">Current Image</Label>
                          {editedData.imageUrl ? (
                            <div className="relative bg-gray-800 border border-gray-700 rounded p-2">
                              <img 
                                src={editedData.imageUrl} 
                                alt={editedData.alt || 'Image'} 
                                className="max-h-32 mx-auto object-contain"
                              />
                              <div className="flex gap-2 mt-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1"
                                  onClick={() => {
                                    const input = document.createElement('input');
                                    input.type = 'file';
                                    input.accept = 'image/*';
                                    input.onchange = (e) => {
                                      const file = (e.target as HTMLInputElement).files?.[0];
                                      if (file) {
                                        const reader = new FileReader();
                                        reader.onload = (event) => {
                                          setEditedData({ 
                                            ...editedData, 
                                            imageUrl: event.target?.result as string,
                                            label: file.name 
                                          });
                                        };
                                        reader.readAsDataURL(file);
                                      }
                                    };
                                    input.click();
                                  }}
                                >
                                  <Upload className="h-3 w-3 mr-1" />
                                  Replace
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1"
                                  onClick={async () => {
                                    try {
                                      const clipboardItems = await navigator.clipboard.read();
                                      for (const clipboardItem of clipboardItems) {
                                        for (const type of clipboardItem.types) {
                                          if (type.startsWith('image/')) {
                                            const blob = await clipboardItem.getType(type);
                                            const reader = new FileReader();
                                            reader.onload = (event) => {
                                              setEditedData({ 
                                                ...editedData, 
                                                imageUrl: event.target?.result as string,
                                                label: `Pasted Image ${new Date().toLocaleTimeString()}`
                                              });
                                            };
                                            reader.readAsDataURL(blob);
                                            return;
                                          }
                                        }
                                      }
                                      alert('No image found in clipboard');
                                    } catch (err) {
                                      alert('Failed to read clipboard. Try copying an image first.');
                                    }
                                  }}
                                >
                                  Paste
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => {
                                  const input = document.createElement('input');
                                  input.type = 'file';
                                  input.accept = 'image/*';
                                  input.onchange = (e) => {
                                    const file = (e.target as HTMLInputElement).files?.[0];
                                    if (file) {
                                      const reader = new FileReader();
                                      reader.onload = (event) => {
                                        setEditedData({ 
                                          ...editedData, 
                                          imageUrl: event.target?.result as string,
                                          label: file.name 
                                        });
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  };
                                  input.click();
                                }}
                              >
                                <Upload className="h-3 w-3 mr-1" />
                                Upload Image
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={async () => {
                                  try {
                                    const clipboardItems = await navigator.clipboard.read();
                                    for (const clipboardItem of clipboardItems) {
                                      for (const type of clipboardItem.types) {
                                        if (type.startsWith('image/')) {
                                          const blob = await clipboardItem.getType(type);
                                          const reader = new FileReader();
                                          reader.onload = (event) => {
                                            setEditedData({ 
                                              ...editedData, 
                                              imageUrl: event.target?.result as string,
                                              label: `Pasted Image ${new Date().toLocaleTimeString()}`
                                            });
                                          };
                                          reader.readAsDataURL(blob);
                                          return;
                                        }
                                      }
                                    }
                                    alert('No image found in clipboard');
                                  } catch (err) {
                                    alert('Failed to read clipboard. Try copying an image first.');
                                  }
                                }}
                              >
                                Paste from Clipboard
                              </Button>
                            </div>
                          )}
                        </div>
                        
                        <div className="grid gap-1">
                          <Label htmlFor="alt" className="text-gray-300 text-xs">Alt Text</Label>
                          <Input
                            id="alt"
                            value={editedData.alt || ''}
                            onChange={(e) => setEditedData({ ...editedData, alt: e.target.value })}
                            className="bg-gray-800 border-gray-700 text-white h-7 text-xs"
                            placeholder="Image description for accessibility"
                          />
                        </div>
                        
                        <div className="grid gap-1">
                          <Label htmlFor="opacity" className="text-gray-300 text-xs">Opacity</Label>
                          <Input
                            id="opacity"
                            type="number"
                            min="0"
                            max="1"
                            step="0.1"
                            value={editedData.opacity || 1}
                            onChange={(e) => setEditedData({ ...editedData, opacity: parseFloat(e.target.value) })}
                            className="bg-gray-800 border-gray-700 text-white h-7 text-xs"
                          />
                        </div>
                        
                        <div className="grid gap-1">
                          <Label className="text-gray-300 text-xs">Maintain Aspect Ratio</Label>
                          <Switch
                            checked={editedData.maintainAspectRatio ?? true}
                            onCheckedChange={(checked) => setEditedData({ ...editedData, maintainAspectRatio: checked })}
                          />
                        </div>
                      </>
                    )}
                    
                    <div className="grid gap-1">
                      <Label htmlFor="status" className="text-gray-300 text-xs">Status</Label>
                      <Select value={editedData.status} onValueChange={(value) => setEditedData({ ...editedData, status: value })}>
                        <SelectTrigger className="bg-gray-800 border-gray-700 text-white h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700">
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="deprecated">Deprecated</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid gap-1">
                      <Label htmlFor="owner" className="text-gray-300 text-xs">Owner</Label>
                      <Input
                        id="owner"
                        value={editedData.owner}
                        onChange={(e) => setEditedData({ ...editedData, owner: e.target.value })}
                        className="bg-gray-800 border-gray-700 text-white h-7 text-xs"
                        placeholder="john.doe@company.com"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="grid gap-1">
                      <Label htmlFor="description" className="text-gray-300 text-xs">Description</Label>
                      <Textarea
                        id="description"
                        value={editedData.description}
                        onChange={(e) => setEditedData({ ...editedData, description: e.target.value })}
                        className="bg-gray-800 border-gray-700 text-white min-h-[50px] text-xs resize-none"
                      />
                    </div>
                    
                    <div className="grid gap-1">
                      <Label htmlFor="version" className="text-gray-300 text-xs">Version</Label>
                      <Input
                        id="version"
                        value={editedData.version}
                        onChange={(e) => setEditedData({ ...editedData, version: e.target.value })}
                        className="bg-gray-800 border-gray-700 text-white h-7 text-xs"
                      />
                    </div>
                    
                    <div className="grid gap-1">
                      <Label htmlFor="team" className="text-gray-300 text-xs">Team</Label>
                      <Input
                        id="team"
                        value={editedData.team}
                        onChange={(e) => setEditedData({ ...editedData, team: e.target.value })}
                        className="bg-gray-800 border-gray-700 text-white h-7 text-xs"
                        placeholder="Platform Team"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="connection" className="mt-0">
                <div className="grid grid-cols-2 gap-3">
                  {(node.type === 'interface' || node.type === 'application') && (
                  <>
                    {/* Standard endpoint for REST/GraphQL/Web apps */}
                    {!['soap-service', 'ejb-interface', 'plsql-procedure'].includes(node.data.id || '') && (
                      <div className="col-span-2 grid gap-1">
                        <Label htmlFor="endpoint" className="text-gray-300 text-xs">Endpoint URL</Label>
                        <Input
                          id="endpoint"
                          value={editedData.endpoint}
                          onChange={(e) => setEditedData({ ...editedData, endpoint: e.target.value })}
                          className="bg-gray-800 border-gray-700 text-white h-7 text-xs"
                          placeholder="https://api.example.com/v1"
                        />
                      </div>
                    )}

                    {/* SOAP specific fields */}
                    {node.data.id === 'soap-service' && (
                      <>
                        <div className="grid gap-2">
                          <Label htmlFor="wsdlUrl" className="text-gray-300">WSDL URL</Label>
                          <Input
                            id="wsdlUrl"
                            value={editedData.wsdlUrl}
                            onChange={(e) => setEditedData({ ...editedData, wsdlUrl: e.target.value })}
                            className="bg-gray-800 border-gray-700 text-white"
                            placeholder="e.g., https://api.example.com/service?wsdl"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="soapVersion" className="text-gray-300">SOAP Version</Label>
                            <Select value={editedData.soapVersion} onValueChange={(value) => setEditedData({ ...editedData, soapVersion: value })}>
                              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-gray-800 border-gray-700">
                                <SelectItem value="1.1">SOAP 1.1</SelectItem>
                                <SelectItem value="1.2">SOAP 1.2</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="style" className="text-gray-300">Style</Label>
                            <Select value={editedData.style} onValueChange={(value) => setEditedData({ ...editedData, style: value })}>
                              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-gray-800 border-gray-700">
                                <SelectItem value="Document/Literal">Document/Literal</SelectItem>
                                <SelectItem value="RPC/Encoded">RPC/Encoded</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </>
                    )}

                    {/* EJB specific fields */}
                    {node.data.id === 'ejb-interface' && (
                      <>
                        <div className="grid gap-2">
                          <Label htmlFor="jndiName" className="text-gray-300">JNDI Name</Label>
                          <Input
                            id="jndiName"
                            value={editedData.jndiName}
                            onChange={(e) => setEditedData({ ...editedData, jndiName: e.target.value })}
                            className="bg-gray-800 border-gray-700 text-white"
                            placeholder="e.g., ejb/MyService"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="ejbType" className="text-gray-300">EJB Type</Label>
                            <Select value={editedData.ejbType} onValueChange={(value) => setEditedData({ ...editedData, ejbType: value })}>
                              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-gray-800 border-gray-700">
                                <SelectItem value="Stateless Session Bean">Stateless Session</SelectItem>
                                <SelectItem value="Stateful Session Bean">Stateful Session</SelectItem>
                                <SelectItem value="Message Driven Bean">Message Driven</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="transactionType" className="text-gray-300">Transaction</Label>
                            <Select value={editedData.transactionType} onValueChange={(value) => setEditedData({ ...editedData, transactionType: value })}>
                              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-gray-800 border-gray-700">
                                <SelectItem value="Container-Managed">Container-Managed</SelectItem>
                                <SelectItem value="Bean-Managed">Bean-Managed</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </>
                    )}

                    {/* PL/SQL specific fields */}
                    {node.data.id === 'plsql-procedure' && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="schema" className="text-gray-300">Schema</Label>
                            <Input
                              id="schema"
                              value={editedData.schema}
                              onChange={(e) => setEditedData({ ...editedData, schema: e.target.value })}
                              className="bg-gray-800 border-gray-700 text-white"
                              placeholder="e.g., APP_SCHEMA"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="package" className="text-gray-300">Package</Label>
                            <Input
                              id="package"
                              value={editedData.package}
                              onChange={(e) => setEditedData({ ...editedData, package: e.target.value })}
                              className="bg-gray-800 border-gray-700 text-white"
                              placeholder="e.g., PKG_BUSINESS"
                            />
                          </div>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="procedure" className="text-gray-300">Procedure Name</Label>
                          <Input
                            id="procedure"
                            value={editedData.procedure}
                            onChange={(e) => setEditedData({ ...editedData, procedure: e.target.value })}
                            className="bg-gray-800 border-gray-700 text-white"
                            placeholder="e.g., PROCESS_ORDER"
                          />
                        </div>
                      </>
                    )}

                    <div className="grid gap-1">
                      <Label htmlFor="protocol" className="text-gray-300 text-xs">Protocol</Label>
                      <Select value={editedData.protocol} onValueChange={(value) => setEditedData({ ...editedData, protocol: value })}>
                        <SelectTrigger className="bg-gray-800 border-gray-700 text-white h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-700">
                            <SelectItem value="https">HTTPS</SelectItem>
                            <SelectItem value="http">HTTP</SelectItem>
                            <SelectItem value="soap">SOAP</SelectItem>
                            <SelectItem value="ws">WebSocket</SelectItem>
                            <SelectItem value="grpc">gRPC</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                    <div className="grid gap-1">
                      <Label htmlFor="port" className="text-gray-300 text-xs">Port</Label>
                      <Input
                        id="port"
                        value={editedData.port}
                        onChange={(e) => setEditedData({ ...editedData, port: e.target.value })}
                        className="bg-gray-800 border-gray-700 text-white h-7 text-xs"
                        placeholder="443"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="timeout" className="text-gray-300">Timeout (seconds)</Label>
                        <Input
                          id="timeout"
                          type="number"
                          value={editedData.timeout}
                          onChange={(e) => setEditedData({ ...editedData, timeout: e.target.value })}
                          className="bg-gray-800 border-gray-700 text-white"
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="retryPolicy" className="text-gray-300">Retry Policy</Label>
                        <Select value={editedData.retryPolicy} onValueChange={(value) => setEditedData({ ...editedData, retryPolicy: value })}>
                          <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-700">
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="linear">Linear</SelectItem>
                            <SelectItem value="exponential">Exponential</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </>
                )}

                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-white flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Environment
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Select value={editedData.environment} onValueChange={(value) => setEditedData({ ...editedData, environment: value })}>
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="development">Development</SelectItem>
                        <SelectItem value="staging">Staging</SelectItem>
                        <SelectItem value="production">Production</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

              <TabsContent value="performance" className="mt-0">
                <div className="grid grid-cols-3 gap-3">
                  <div className="grid gap-1">
                    <Label htmlFor="uptime" className="text-gray-300 text-xs">Uptime (%)</Label>
                    <Input
                      id="uptime"
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={editedData.metrics?.uptime || ''}
                      onChange={(e) => setEditedData({ 
                        ...editedData, 
                        metrics: { 
                          ...editedData.metrics, 
                          uptime: parseFloat(e.target.value) || 0 
                        } 
                      })}
                      className="bg-gray-800 border-gray-700 text-white h-7 text-xs"
                      placeholder="99.9"
                    />
                  </div>

                  <div className="grid gap-1">
                    <Label htmlFor="responseTime" className="text-gray-300 text-xs">Response (ms)</Label>
                    <Input
                      id="responseTime"
                      type="number"
                      value={editedData.metrics?.responseTime || ''}
                      onChange={(e) => setEditedData({ 
                        ...editedData, 
                        metrics: { 
                          ...editedData.metrics, 
                          responseTime: parseInt(e.target.value) || 0 
                        } 
                      })}
                      className="bg-gray-800 border-gray-700 text-white h-7 text-xs"
                      placeholder="150"
                    />
                  </div>

                  <div className="grid gap-1">
                    <Label htmlFor="throughput" className="text-gray-300 text-xs">Throughput (req/s)</Label>
                    <Input
                      id="throughput"
                      type="number"
                      value={editedData.metrics?.throughput || ''}
                      onChange={(e) => setEditedData({ 
                        ...editedData, 
                        metrics: { 
                          ...editedData.metrics, 
                          throughput: parseInt(e.target.value) || 0 
                        } 
                      })}
                      className="bg-gray-800 border-gray-700 text-white h-7 text-xs"
                      placeholder="1000"
                    />
                  </div>

                  {node?.type === 'process' && (
                    <>
                      <div className="grid gap-1">
                        <Label htmlFor="completionRate" className="text-gray-300 text-xs">Completion (%)</Label>
                        <Input
                          id="completionRate"
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={editedData.metrics?.completionRate || ''}
                          onChange={(e) => setEditedData({ 
                            ...editedData, 
                            metrics: { 
                              ...editedData.metrics, 
                              completionRate: parseFloat(e.target.value) || 0 
                            } 
                          })}
                          className="bg-gray-800 border-gray-700 text-white h-7 text-xs"
                          placeholder="98.5"
                        />
                      </div>

                      <div className="grid gap-1">
                        <Label htmlFor="averageTime" className="text-gray-300 text-xs">Avg Time (hrs)</Label>
                        <Input
                          id="averageTime"
                          type="number"
                          value={editedData.metrics?.averageTime || ''}
                          onChange={(e) => setEditedData({ 
                            ...editedData, 
                            metrics: { 
                              ...editedData.metrics, 
                              averageTime: parseInt(e.target.value) || 0 
                            } 
                          })}
                          className="bg-gray-800 border-gray-700 text-white h-7 text-xs"
                          placeholder="24"
                        />
                      </div>

                      <div className="grid gap-1">
                        <Label htmlFor="errorRate" className="text-gray-300 text-xs">Error Rate (%)</Label>
                        <Input
                          id="errorRate"
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={editedData.metrics?.errorRate || ''}
                          onChange={(e) => setEditedData({ 
                            ...editedData, 
                            metrics: { 
                              ...editedData.metrics, 
                              errorRate: parseFloat(e.target.value) || 0 
                            } 
                          })}
                          className="bg-gray-800 border-gray-700 text-white h-7 text-xs"
                          placeholder="1.2"
                        />
                      </div>
                    </>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="security" className="mt-0">
              <div className="grid gap-4">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-white flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Authentication
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="authentication" className="text-gray-300">Method</Label>
                      <Select value={editedData.authentication} onValueChange={(value) => setEditedData({ ...editedData, authentication: value })}>
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700">
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="token">Bearer Token</SelectItem>
                          <SelectItem value="basic">Basic Auth</SelectItem>
                          <SelectItem value="oauth2">OAuth 2.0</SelectItem>
                          <SelectItem value="apikey">API Key</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="security" className="text-gray-300">Security Level</Label>
                      <Select value={editedData.security} onValueChange={(value) => setEditedData({ ...editedData, security: value })}>
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700">
                          <SelectItem value="public">Public</SelectItem>
                          <SelectItem value="standard">Standard</SelectItem>
                          <SelectItem value="enhanced">Enhanced</SelectItem>
                          <SelectItem value="strict">Strict</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-white flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Rate Limiting
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-2">
                      <Label htmlFor="rateLimit" className="text-gray-300">Requests per minute</Label>
                      <Input
                        id="rateLimit"
                        type="number"
                        value={editedData.rateLimit}
                        onChange={(e) => setEditedData({ ...editedData, rateLimit: e.target.value })}
                        className="bg-gray-700 border-gray-600 text-white"
                        placeholder="e.g., 100"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

              <TabsContent value="advanced" className="mt-0">
              <div className="grid gap-4">
                {node.type === 'image' && (
                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-white">Border & Styling</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-1">
                          <Label htmlFor="borderStyle" className="text-gray-300 text-xs">Border Style</Label>
                          <Select value={editedData.borderStyle || 'solid'} onValueChange={(value) => setEditedData({ ...editedData, borderStyle: value })}>
                            <SelectTrigger className="bg-gray-700 border-gray-600 text-white h-7 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-800 border-gray-700">
                              <SelectItem value="none">None</SelectItem>
                              <SelectItem value="solid">Solid</SelectItem>
                              <SelectItem value="dashed">Dashed</SelectItem>
                              <SelectItem value="dotted">Dotted</SelectItem>
                              <SelectItem value="double">Double</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="grid gap-1">
                          <Label htmlFor="borderWidth" className="text-gray-300 text-xs">Border Width</Label>
                          <Input
                            id="borderWidth"
                            type="number"
                            min="0"
                            max="10"
                            value={editedData.borderWidth || 0}
                            onChange={(e) => setEditedData({ ...editedData, borderWidth: parseInt(e.target.value) })}
                            className="bg-gray-700 border-gray-600 text-white h-7 text-xs"
                          />
                        </div>
                        
                        <div className="grid gap-1">
                          <Label htmlFor="borderColor" className="text-gray-300 text-xs">Border Color</Label>
                          <Input
                            id="borderColor"
                            type="color"
                            value={editedData.borderColor || '#000000'}
                            onChange={(e) => setEditedData({ ...editedData, borderColor: e.target.value })}
                            className="bg-gray-700 border-gray-600 h-7"
                          />
                        </div>
                        
                        <div className="grid gap-1">
                          <Label htmlFor="borderRadius" className="text-gray-300 text-xs">Border Radius</Label>
                          <Input
                            id="borderRadius"
                            type="number"
                            min="0"
                            max="50"
                            value={editedData.borderRadius || 4}
                            onChange={(e) => setEditedData({ ...editedData, borderRadius: parseInt(e.target.value) })}
                            className="bg-gray-700 border-gray-600 text-white h-7 text-xs"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-1">
                          <Label htmlFor="width" className="text-gray-300 text-xs">Width (px)</Label>
                          <Input
                            id="width"
                            type="number"
                            min="50"
                            max="800"
                            value={editedData.width || 200}
                            onChange={(e) => setEditedData({ ...editedData, width: parseInt(e.target.value) })}
                            className="bg-gray-700 border-gray-600 text-white h-7 text-xs"
                          />
                        </div>
                        
                        <div className="grid gap-1">
                          <Label htmlFor="height" className="text-gray-300 text-xs">Height (px)</Label>
                          <Input
                            id="height"
                            type="number"
                            min="50"
                            max="600"
                            value={editedData.height || 150}
                            onChange={(e) => setEditedData({ ...editedData, height: parseInt(e.target.value) })}
                            className="bg-gray-700 border-gray-600 text-white h-7 text-xs"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-white">Monitoring & Observability</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="healthCheck" className="text-gray-300">Health Check Enabled</Label>
                      <Switch
                        id="healthCheck"
                        checked={editedData.healthCheck}
                        onCheckedChange={(checked) => setEditedData({ ...editedData, healthCheck: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="monitoring" className="text-gray-300">Monitoring Enabled</Label>
                      <Switch
                        id="monitoring"
                        checked={editedData.monitoring}
                        onCheckedChange={(checked) => setEditedData({ ...editedData, monitoring: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="logging" className="text-gray-300">Logging Enabled</Label>
                      <Switch
                        id="logging"
                        checked={editedData.logging}
                        onCheckedChange={(checked) => setEditedData({ ...editedData, logging: checked })}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="custom" className="mt-0">
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-white">Custom Properties</h3>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowAddPropertyDialog(true)}
                    className="border-gray-600 hover:bg-gray-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Property
                  </Button>
                </div>

                {/* Property suggestions for quick add */}
                {Object.keys(editedData.properties || {}).length === 0 && node.type && (
                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-gray-400">Quick Add Suggestions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {node.type === 'application' && [
                          { key: 'maxConnections', label: 'Max Connections', type: 'number', value: 100 },
                          { key: 'cacheEnabled', label: 'Cache Enabled', type: 'boolean', value: true },
                          { key: 'region', label: 'Region', type: 'string', value: 'us-east-1' },
                          { key: 'instanceType', label: 'Instance Type', type: 'string', value: 't3.medium' }
                        ].map((suggestion) => (
                          <Button
                            key={suggestion.key}
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditedData({
                                ...editedData,
                                properties: {
                                  ...editedData.properties,
                                  [suggestion.key]: suggestion.value
                                }
                              });
                            }}
                            className="h-8 text-xs border-gray-600 hover:bg-gray-700"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            {suggestion.label}
                          </Button>
                        ))}
                        
                        {node.type === 'interface' && [
                          { key: 'requestTimeout', label: 'Request Timeout', type: 'number', value: 30000 },
                          { key: 'retryEnabled', label: 'Retry Enabled', type: 'boolean', value: true },
                          { key: 'compressionEnabled', label: 'Compression', type: 'boolean', value: false },
                          { key: 'apiVersion', label: 'API Version', type: 'string', value: 'v1' }
                        ].map((suggestion) => (
                          <Button
                            key={suggestion.key}
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditedData({
                                ...editedData,
                                properties: {
                                  ...editedData.properties,
                                  [suggestion.key]: suggestion.value
                                }
                              });
                            }}
                            className="h-8 text-xs border-gray-600 hover:bg-gray-700"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            {suggestion.label}
                          </Button>
                        ))}
                        
                        {node.type === 'process' && [
                          { key: 'priority', label: 'Priority', type: 'number', value: 1 },
                          { key: 'automated', label: 'Automated', type: 'boolean', value: false },
                          { key: 'frequency', label: 'Frequency', type: 'string', value: 'Daily' },
                          { key: 'slaHours', label: 'SLA Hours', type: 'number', value: 24 }
                        ].map((suggestion) => (
                          <Button
                            key={suggestion.key}
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditedData({
                                ...editedData,
                                properties: {
                                  ...editedData.properties,
                                  [suggestion.key]: suggestion.value
                                }
                              });
                            }}
                            className="h-8 text-xs border-gray-600 hover:bg-gray-700"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            {suggestion.label}
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {/* Properties List */}
                <div className="space-y-4">
                  {Object.entries(editedData.properties || node.data.properties || {}).map(([key, value]) => (
                    <Card key={key} className="bg-gray-800 border-gray-700">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <Label htmlFor={`prop-${key}`} className="text-white font-medium capitalize">
                            {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}
                          </Label>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              const { [key]: _, ...restProperties } = editedData.properties || {};
                              setEditedData({
                                ...editedData,
                                properties: restProperties
                              });
                            }}
                            className="h-8 w-8 p-0 text-red-400 hover:bg-red-900/20"
                            title="Remove property"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        {/* Different input types based on value type */}
                        {typeof value === 'boolean' ? (
                          <div className="flex items-center space-x-2">
                            <Switch
                              id={`prop-${key}`}
                              checked={editedData.properties?.[key] ?? value}
                              onCheckedChange={(checked) => {
                                setEditedData({
                                  ...editedData,
                                  properties: {
                                    ...editedData.properties,
                                    [key]: checked
                                  }
                                });
                              }}
                            />
                            <Label htmlFor={`prop-${key}`} className="text-gray-400 text-sm">
                              {editedData.properties?.[key] ? 'Enabled' : 'Disabled'}
                            </Label>
                          </div>
                        ) : typeof value === 'number' ? (
                          <Input
                            id={`prop-${key}`}
                            type="number"
                            value={editedData.properties?.[key] ?? value}
                            onChange={(e) => {
                              setEditedData({
                                ...editedData,
                                properties: {
                                  ...editedData.properties,
                                  [key]: parseInt(e.target.value) || 0
                                }
                              });
                            }}
                            className="bg-gray-700 border-gray-600 text-white"
                          />
                        ) : (
                          <Input
                            id={`prop-${key}`}
                            value={editedData.properties?.[key] ?? value}
                            onChange={(e) => {
                              setEditedData({
                                ...editedData,
                                properties: {
                                  ...editedData.properties,
                                  [key]: e.target.value
                                }
                              });
                            }}
                            className="bg-gray-700 border-gray-600 text-white"
                            placeholder={`Enter ${key}...`}
                          />
                        )}
                      </CardContent>
                    </Card>
                  ))}
                  
                  {Object.keys(editedData.properties || {}).length === 0 && (
                    <Card className="bg-gray-800 border-gray-700">
                      <CardContent className="py-12">
                        <div className="text-center text-gray-400">
                          <Database className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p className="text-sm">No custom properties defined</p>
                          <p className="text-xs mt-1">Click "Add Property" to create one</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>
            </div>
          </Tabs>
        </div>

        <DialogFooter className="mt-2 pt-2 border-t border-gray-700">
          <div className="flex items-center justify-between w-full">
            <div className="text-xs text-gray-500">
              Type: {node.type}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} className="border-gray-600 hover:bg-gray-700 h-7 text-xs px-3">
                Cancel
              </Button>
              <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 h-7 text-xs px-3">
                Save
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    
    <AddPropertyDialog
      isOpen={showAddPropertyDialog}
      onClose={() => setShowAddPropertyDialog(false)}
      onAdd={(key, value) => {
        setEditedData({
          ...editedData,
          properties: {
            ...editedData.properties,
            [key]: value
          }
        });
      }}
      existingKeys={Object.keys(editedData.properties || {})}
    />
  </>
  );
}