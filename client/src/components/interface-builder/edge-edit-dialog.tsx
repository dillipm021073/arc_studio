import { useState, useEffect } from 'react';
import { Edge } from 'reactflow';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { 
  Network, 
  Shield, 
  Activity,
  Zap,
  Globe,
  Lock,
  TrendingUp,
  ArrowLeftRight,
  ArrowRight
} from 'lucide-react';

interface EdgeEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  edge: Edge | null;
  onSave: (edgeId: string, data: any) => void;
}

export default function EdgeEditDialog({ isOpen, onClose, edge, onSave }: EdgeEditDialogProps) {
  const [editedData, setEditedData] = useState<any>({});
  const [activeTab, setActiveTab] = useState('connection');

  useEffect(() => {
    if (edge) {
      setEditedData({
        connectionType: edge.data?.connectionType || 'API Call',
        dataFlow: edge.data?.dataFlow || 'bidirectional',
        protocol: edge.data?.protocol || 'HTTPS',
        security: edge.data?.security || 'standard',
        bandwidth: edge.data?.bandwidth || '',
        latency: edge.data?.latency || '',
        throughput: edge.data?.throughput || '',
        authentication: edge.data?.authentication || 'none',
        encrypted: edge.data?.encrypted || false,
        compressed: edge.data?.compressed || false,
        monitored: edge.data?.monitored || true,
        ...edge.data
      });
    }
  }, [edge]);

  const handleSave = () => {
    if (edge) {
      onSave(edge.id, {
        ...edge.data,
        ...editedData,
        lastModified: new Date().toISOString()
      });
    }
  };

  if (!edge) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[60vh] overflow-hidden flex flex-col bg-gray-900 border-gray-700">
        <DialogHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded bg-purple-600">
                <Network className="h-3 w-3 text-white" />
              </div>
              <div>
                <DialogTitle className="text-white text-base">Connection Properties</DialogTitle>
                <DialogDescription className="text-gray-400 text-xs">
                  Configure the interface connection settings
                </DialogDescription>
              </div>
            </div>
            <Badge variant="outline" className="text-xs border-gray-600 text-gray-400">
              {edge.id.substring(0, 8)}...
            </Badge>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="flex w-full bg-gray-800 h-8 px-1">
              <TabsTrigger value="connection" className="data-[state=active]:bg-gray-700 text-xs px-3 py-1 flex-1">
                Connection
              </TabsTrigger>
              <TabsTrigger value="performance" className="data-[state=active]:bg-gray-700 text-xs px-3 py-1 flex-1">
                Performance
              </TabsTrigger>
              <TabsTrigger value="security" className="data-[state=active]:bg-gray-700 text-xs px-3 py-1 flex-1">
                Security
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto p-3">
              <TabsContent value="connection" className="mt-0">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-3">
                    <div className="grid gap-1">
                      <Label htmlFor="connectionType" className="text-gray-300 text-xs">Connection Type</Label>
                      <Select value={editedData.connectionType} onValueChange={(value) => setEditedData({ ...editedData, connectionType: value })}>
                        <SelectTrigger className="bg-gray-800 border-gray-700 text-white h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700">
                          <SelectItem value="API Call">API Call</SelectItem>
                          <SelectItem value="HTTP Request">HTTP Request</SelectItem>
                          <SelectItem value="Service Call">Service Call</SelectItem>
                          <SelectItem value="Database Query">Database Query</SelectItem>
                          <SelectItem value="Message">Message</SelectItem>
                          <SelectItem value="Event">Event</SelectItem>
                          <SelectItem value="File Transfer">File Transfer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-1">
                      <Label htmlFor="protocol" className="text-gray-300 text-xs">Protocol</Label>
                      <Select value={editedData.protocol} onValueChange={(value) => setEditedData({ ...editedData, protocol: value })}>
                        <SelectTrigger className="bg-gray-800 border-gray-700 text-white h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700">
                          <SelectItem value="HTTPS">HTTPS</SelectItem>
                          <SelectItem value="HTTP">HTTP</SelectItem>
                          <SelectItem value="SOAP">SOAP</SelectItem>
                          <SelectItem value="WebSocket">WebSocket</SelectItem>
                          <SelectItem value="gRPC">gRPC</SelectItem>
                          <SelectItem value="AMQP">AMQP</SelectItem>
                          <SelectItem value="Kafka">Kafka</SelectItem>
                          <SelectItem value="TCP">TCP</SelectItem>
                          <SelectItem value="SQL">SQL</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="grid gap-1">
                      <Label htmlFor="dataFlow" className="text-gray-300 text-xs">Data Flow</Label>
                      <Select value={editedData.dataFlow} onValueChange={(value) => setEditedData({ ...editedData, dataFlow: value })}>
                        <SelectTrigger className="bg-gray-800 border-gray-700 text-white h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700">
                          <SelectItem value="unidirectional">Unidirectional →</SelectItem>
                          <SelectItem value="bidirectional">Bidirectional ↔</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-1">
                      <Label htmlFor="authentication" className="text-gray-300 text-xs">Authentication</Label>
                      <Select value={editedData.authentication} onValueChange={(value) => setEditedData({ ...editedData, authentication: value })}>
                        <SelectTrigger className="bg-gray-800 border-gray-700 text-white h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700">
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="basic">Basic Auth</SelectItem>
                          <SelectItem value="bearer">Bearer Token</SelectItem>
                          <SelectItem value="oauth2">OAuth 2.0</SelectItem>
                          <SelectItem value="apikey">API Key</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="performance" className="mt-0">
                <div className="grid grid-cols-3 gap-3">
                  <div className="grid gap-1">
                    <Label htmlFor="latency" className="text-gray-300 text-xs">Latency (ms)</Label>
                    <Input
                      id="latency"
                      type="number"
                      value={editedData.latency}
                      onChange={(e) => setEditedData({ ...editedData, latency: parseInt(e.target.value) || 0 })}
                      className="bg-gray-800 border-gray-700 text-white h-7 text-xs"
                      placeholder="50"
                    />
                  </div>

                  <div className="grid gap-1">
                    <Label htmlFor="throughput" className="text-gray-300 text-xs">Throughput (req/s)</Label>
                    <Input
                      id="throughput"
                      type="number"
                      value={editedData.throughput}
                      onChange={(e) => setEditedData({ ...editedData, throughput: parseInt(e.target.value) || 0 })}
                      className="bg-gray-800 border-gray-700 text-white h-7 text-xs"
                      placeholder="1000"
                    />
                  </div>

                  <div className="grid gap-1">
                    <Label htmlFor="bandwidth" className="text-gray-300 text-xs">Bandwidth</Label>
                    <Input
                      id="bandwidth"
                      value={editedData.bandwidth}
                      onChange={(e) => setEditedData({ ...editedData, bandwidth: e.target.value })}
                      className="bg-gray-800 border-gray-700 text-white h-7 text-xs"
                      placeholder="100 Mbps"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="security" className="mt-0">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-1">
                      <Label htmlFor="security" className="text-gray-300 text-xs">Security Level</Label>
                      <Select value={editedData.security} onValueChange={(value) => setEditedData({ ...editedData, security: value })}>
                        <SelectTrigger className="bg-gray-800 border-gray-700 text-white h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700">
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="standard">Standard</SelectItem>
                          <SelectItem value="encrypted">Encrypted</SelectItem>
                          <SelectItem value="enhanced">Enhanced</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-gray-800 rounded">
                      <Label htmlFor="encrypted" className="text-gray-300 text-xs">Encryption Enabled</Label>
                      <Switch
                        id="encrypted"
                        checked={editedData.encrypted || editedData.security === 'encrypted'}
                        onCheckedChange={(checked) => setEditedData({ ...editedData, encrypted: checked })}
                        className="scale-75"
                      />
                    </div>

                    <div className="flex items-center justify-between p-2 bg-gray-800 rounded">
                      <Label htmlFor="compressed" className="text-gray-300 text-xs">Compression Enabled</Label>
                      <Switch
                        id="compressed"
                        checked={editedData.compressed}
                        onCheckedChange={(checked) => setEditedData({ ...editedData, compressed: checked })}
                        className="scale-75"
                      />
                    </div>

                    <div className="flex items-center justify-between p-2 bg-gray-800 rounded">
                      <Label htmlFor="monitored" className="text-gray-300 text-xs">Monitoring Enabled</Label>
                      <Switch
                        id="monitored"
                        checked={editedData.monitored}
                        onCheckedChange={(checked) => setEditedData({ ...editedData, monitored: checked })}
                        className="scale-75"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <DialogFooter className="mt-2 pt-2 border-t border-gray-700">
          <div className="flex items-center justify-between w-full">
            <div className="text-xs text-gray-500">
              Connection Edge
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
  );
}