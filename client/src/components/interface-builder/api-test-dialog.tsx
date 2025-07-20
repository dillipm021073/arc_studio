import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Clock, Loader2, Send, Copy, Save, Plus, Trash2, FolderOpen, FileText, ChevronDown, MoreVertical, Settings, Download, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { EnvironmentVariablesDialog } from './environment-variables-dialog';
import { HeaderAutocomplete } from './header-autocomplete';
import { formatXml, isXmlContent } from '@/lib/xml-formatter';
import './api-test-dialog-styles.css';

interface ApiTestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  interfaceData?: {
    id: string;
    imlNumber: string;
    interfaceType: string;
    endpoint?: string;
    sampleCode?: string;
  };
}

interface Header {
  key: string;
  value: string;
  enabled: boolean;
}

interface QueryParam {
  key: string;
  value: string;
  enabled: boolean;
}

interface TestResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
  time: number;
  size: number;
}

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
const PROTOCOLS = ['HTTP', 'HTTPS', 'SOAP'];
const AUTH_TYPES = ['None', 'Basic Auth', 'Bearer Token', 'API Key'];
const CONTENT_TYPES = [
  'application/json',
  'application/xml',
  'text/xml',
  'application/x-www-form-urlencoded',
  'multipart/form-data',
  'text/plain',
];

export function ApiTestDialog({ open, onOpenChange, interfaceData }: ApiTestDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Collections state
  const [collections, setCollections] = useState<any[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<any>(null);
  const [savedRequests, setSavedRequests] = useState<any[]>([]);
  const [currentRequestId, setCurrentRequestId] = useState<number | null>(null);
  const [showCollections, setShowCollections] = useState(true);
  const [savingRequest, setSavingRequest] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveRequestName, setSaveRequestName] = useState('');
  const [saveToCollectionId, setSaveToCollectionId] = useState<number | null>(null);
  const [environments, setEnvironments] = useState<any[]>([]);
  const [currentEnvironmentId, setCurrentEnvironmentId] = useState<number | null>(null);
  const [showEnvironmentDialog, setShowEnvironmentDialog] = useState(false);
  const [environmentVariables, setEnvironmentVariables] = useState<Record<string, string>>({});
  const [globalVariables, setGlobalVariables] = useState<Record<string, string>>({});
  
  // Request state
  const [protocol, setProtocol] = useState('HTTPS');
  const [method, setMethod] = useState('GET');
  const [url, setUrl] = useState('');
  const [headers, setHeaders] = useState<Header[]>([]);
  const [queryParams, setQueryParams] = useState<QueryParam[]>([]);
  const [authType, setAuthType] = useState('None');
  const [authCredentials, setAuthCredentials] = useState({ username: '', password: '', token: '', apiKey: '' });
  const [requestBody, setRequestBody] = useState('');
  const [contentType, setContentType] = useState('application/json');
  const [testScript, setTestScript] = useState('');
  
  // Security & Proxy settings
  const [insecureSkipVerify, setInsecureSkipVerify] = useState(false);
  const [useProxy, setUseProxy] = useState(false);
  const [proxyUrl, setProxyUrl] = useState('');
  const [proxyAuth, setProxyAuth] = useState({ username: '', password: '' });
  const [noProxyHosts, setNoProxyHosts] = useState('');
  
  // Response state
  const [response, setResponse] = useState<TestResponse | null>(null);
  const [responseTab, setResponseTab] = useState('body');

  // Load collections when dialog opens
  useEffect(() => {
    if (open) {
      loadCollections();
    }
  }, [open]);

  const loadCollections = async () => {
    try {
      const response = await api.get('/api/api-test/collections');
      setCollections(response.data);
    } catch (error) {
      console.error('Failed to load collections:', error);
    }
  };

  const loadEnvironmentVariables = async (environmentId: number) => {
    try {
      const response = await api.get(`/api/api-test/environments/${environmentId}/variables`);
      const variables: Record<string, string> = {};
      response.data.forEach((variable: any) => {
        variables[variable.key] = variable.value;
      });
      setEnvironmentVariables(variables);
      
      // TODO: Also load global variables
    } catch (error) {
      console.error('Failed to load environment variables:', error);
    }
  };

  const loadCollection = async (collectionId: number) => {
    try {
      const response = await api.get(`/api/api-test/collections/${collectionId}`);
      setSelectedCollection(response.data.collection);
      setSavedRequests(response.data.requests);
      setCurrentEnvironmentId(response.data.collection.currentEnvironmentId);
      
      // Load environments for the collection
      const envResponse = await api.get(`/api/api-test/collections/${collectionId}/environments`);
      setEnvironments(envResponse.data);
      
      // Load variables for the current environment if set
      if (response.data.collection.currentEnvironmentId) {
        await loadEnvironmentVariables(response.data.collection.currentEnvironmentId);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load collection',
        variant: 'destructive',
      });
    }
  };

  const createCollection = async () => {
    const name = prompt('Collection name:');
    if (!name) return;

    try {
      const response = await api.post('/api/api-test/collections', {
        name,
        description: '',
      });
      
      setCollections([...collections, response.data]);
      setSelectedCollection(response.data);
      setSavedRequests([]);
      
      toast({
        title: 'Collection Created',
        description: `${name} has been created`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create collection',
        variant: 'destructive',
      });
    }
  };

  const handleSaveClick = () => {
    if (collections.length === 0) {
      toast({
        title: 'No Collections',
        description: 'Please create a collection first',
        variant: 'destructive',
      });
      return;
    }
    
    // Pre-fill request name from URL if available
    try {
      const urlObj = new URL(url);
      setSaveRequestName(urlObj.pathname.split('/').filter(Boolean).join(' ') || 'New Request');
    } catch {
      setSaveRequestName('New Request');
    }
    
    // Pre-select current collection or first available
    setSaveToCollectionId(selectedCollection?.id || collections[0]?.id || null);
    setShowSaveDialog(true);
  };

  const saveRequest = async () => {
    if (!saveRequestName || !saveToCollectionId) {
      toast({
        title: 'Missing Information',
        description: 'Please provide a request name and select a collection',
        variant: 'destructive',
      });
      return;
    }

    setSavingRequest(true);
    setShowSaveDialog(false);
    try {
      const requestData = {
        name: saveRequestName,
        method,
        url,
        protocol,
        headers: headers.filter(h => h.enabled && h.key).reduce((acc, h) => ({
          ...acc,
          [h.key]: h.value
        }), {}),
        queryParams: queryParams.filter(p => p.enabled && p.key),
        body: requestBody,
        bodyType: 'raw',
        contentType,
        authType,
        authConfig: authCredentials,
        testScript: testScript,
        settings: {
          insecureSkipVerify,
          useProxy,
          proxyUrl: useProxy ? proxyUrl : '',
          proxyAuth: useProxy ? proxyAuth : { username: '', password: '' },
          noProxyHosts: useProxy ? noProxyHosts : ''
        }
      };

      let response;
      if (currentRequestId) {
        // Update existing request
        response = await api.put(`/api/api-test/requests/${currentRequestId}`, requestData);
      } else {
        // Create new request
        response = await api.post(`/api/api-test/collections/${saveToCollectionId}/requests`, requestData);
      }

      // Reload collection to get updated requests
      await loadCollection(saveToCollectionId);
      setCurrentRequestId(response.data.id);
      
      // Find the collection name for the toast
      const savedToCollection = collections.find(c => c.id === saveToCollectionId);
      
      toast({
        title: 'Request Saved',
        description: `${saveRequestName} has been saved to ${savedToCollection?.name}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save request',
        variant: 'destructive',
      });
    } finally {
      setSavingRequest(false);
    }
  };

  const loadRequest = async (request: any) => {
    setCurrentRequestId(request.id);
    setMethod(request.method);
    setUrl(request.url);
    setProtocol(request.protocol || 'HTTPS');
    
    // Load headers
    if (request.headers) {
      const headerEntries = Object.entries(request.headers).map(([key, value]) => ({
        key,
        value: value as string,
        enabled: true,
      }));
      setHeaders(headerEntries.length > 0 ? headerEntries : [{ key: 'Content-Type', value: 'application/json', enabled: true }]);
    }
    
    // Load query params
    if (request.queryParams) {
      setQueryParams(request.queryParams);
    }
    
    // Load body
    setRequestBody(request.body || '');
    setContentType(request.contentType || 'application/json');
    
    // Load auth
    setAuthType(request.authType || 'None');
    setAuthCredentials(request.authConfig || { username: '', password: '', token: '', apiKey: '' });
    
    // Load test script
    setTestScript(request.testScript || '');
    
    // Load settings
    if (request.settings) {
      setInsecureSkipVerify(request.settings.insecureSkipVerify || false);
      setUseProxy(request.settings.useProxy || false);
      setProxyUrl(request.settings.proxyUrl || '');
      setProxyAuth(request.settings.proxyAuth || { username: '', password: '' });
      setNoProxyHosts(request.settings.noProxyHosts || '');
    } else {
      // Reset settings if not present
      setInsecureSkipVerify(false);
      setUseProxy(false);
      setProxyUrl('');
      setProxyAuth({ username: '', password: '' });
      setNoProxyHosts('');
    }
    
    // Clear response
    setResponse(null);
  };

  const deleteRequest = async (requestId: number) => {
    if (!confirm('Delete this request?')) return;

    try {
      await api.delete(`/api/api-test/requests/${requestId}`);
      await loadCollection(selectedCollection.id);
      
      if (currentRequestId === requestId) {
        // Clear current request if it was deleted
        setCurrentRequestId(null);
        setMethod('GET');
        setUrl('');
        setHeaders([{ key: 'Content-Type', value: 'application/json', enabled: true }]);
        setQueryParams([]);
        setRequestBody('');
        setAuthType('None');
        setAuthCredentials({ username: '', password: '', token: '', apiKey: '' });
        setResponse(null);
      }
      
      toast({
        title: 'Request Deleted',
        description: 'The request has been deleted',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete request',
        variant: 'destructive',
      });
    }
  };

  const newRequest = () => {
    console.log('New request clicked');
    setCurrentRequestId(null);
    setMethod('GET');
    setUrl('');
    setHeaders([{ key: 'Content-Type', value: 'application/json', enabled: true }]);
    setQueryParams([]);
    setRequestBody('');
    setAuthType('None');
    setAuthCredentials({ username: '', password: '', token: '', apiKey: '' });
    setResponse(null);
    setTestScript('');
    setInsecureSkipVerify(false);
    setUseProxy(false);
    setProxyUrl('');
    setProxyAuth({ username: '', password: '' });
    setNoProxyHosts('');
  };

  useEffect(() => {
    if (interfaceData) {
      // Pre-populate from interface data
      if (interfaceData.endpoint) {
        setUrl(interfaceData.endpoint);
      }
      if (interfaceData.interfaceType === 'SOAP') {
        setProtocol('SOAP');
        setContentType('text/xml');
      }
      if (interfaceData.sampleCode) {
        try {
          const sample = JSON.parse(interfaceData.sampleCode);
          if (sample.method) setMethod(sample.method);
          if (sample.headers) {
            setHeaders(Object.entries(sample.headers).map(([key, value]) => ({
              key,
              value: value as string,
              enabled: true,
            })));
          }
          if (sample.body) setRequestBody(JSON.stringify(sample.body, null, 2));
        } catch {
          // If not JSON, use as-is
          setRequestBody(interfaceData.sampleCode);
        }
      }
    }
  }, [interfaceData]);

  const addHeader = () => {
    setHeaders([...headers, { key: '', value: '', enabled: true }]);
  };

  const updateHeader = (index: number, field: keyof Header, value: any) => {
    const newHeaders = [...headers];
    newHeaders[index] = { ...newHeaders[index], [field]: value };
    setHeaders(newHeaders);
  };

  const removeHeader = (index: number) => {
    setHeaders(headers.filter((_, i) => i !== index));
  };

  const addQueryParam = () => {
    setQueryParams([...queryParams, { key: '', value: '', enabled: true }]);
  };

  const updateQueryParam = (index: number, field: keyof QueryParam, value: any) => {
    const newParams = [...queryParams];
    newParams[index] = { ...newParams[index], [field]: value };
    setQueryParams(newParams);
  };

  const removeQueryParam = (index: number) => {
    setQueryParams(queryParams.filter((_, i) => i !== index));
  };

  const buildFullUrl = () => {
    let fullUrl = url;
    const enabledParams = queryParams.filter(p => p.enabled && p.key);
    if (enabledParams.length > 0) {
      const queryString = enabledParams
        .map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)
        .join('&');
      fullUrl += (url.includes('?') ? '&' : '?') + queryString;
    }
    return fullUrl;
  };

  const buildRequestHeaders = () => {
    const requestHeaders: Record<string, string> = {};
    headers.filter(h => h.enabled && h.key).forEach(h => {
      requestHeaders[h.key] = replaceVariables(h.value);
    });

    // Add auth headers
    if (authType === 'Bearer Token' && authCredentials.token) {
      requestHeaders['Authorization'] = `Bearer ${authCredentials.token}`;
    } else if (authType === 'Basic Auth' && authCredentials.username) {
      const encoded = btoa(`${authCredentials.username}:${authCredentials.password}`);
      requestHeaders['Authorization'] = `Basic ${encoded}`;
    } else if (authType === 'API Key' && authCredentials.apiKey) {
      requestHeaders['X-API-Key'] = authCredentials.apiKey;
    }

    return requestHeaders;
  };

  // Replace variables in a string with their values
  const replaceVariables = (text: string): string => {
    if (!text) return text;
    
    // Replace {{variable}} patterns with actual values
    return text.replace(/{{(\w+)}}/g, (match, varName) => {
      // Check environment variables first
      if (environmentVariables[varName] !== undefined) {
        return environmentVariables[varName];
      }
      // Then check global variables
      if (globalVariables[varName] !== undefined) {
        return globalVariables[varName];
      }
      // Return original if not found
      return match;
    });
  };

  const switchEnvironment = async (environmentId: number) => {
    if (!selectedCollection) return;
    
    try {
      await api.put(`/api/api-test/collections/${selectedCollection.id}/current-environment`, {
        environmentId
      });
      
      setCurrentEnvironmentId(environmentId);
      await loadEnvironmentVariables(environmentId);
      toast({
        title: 'Environment Switched',
        description: `Switched to ${environments.find(e => e.id === environmentId)?.displayName}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to switch environment',
        variant: 'destructive',
      });
    }
  };

  const sendRequest = async () => {
    try {
      setLoading(true);
      setResponse(null);

      const fullUrl = buildFullUrl();
      const requestHeaders = buildRequestHeaders();
      
      const startTime = Date.now();
      
      const res = await fetch('/api/interface-builder/test-api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          method,
          url: fullUrl,
          headers: requestHeaders,
          body: ['GET', 'HEAD'].includes(method) ? undefined : replaceVariables(requestBody),
          protocol,
          insecureSkipVerify,
          proxy: useProxy ? {
            url: proxyUrl,
            auth: proxyAuth.username ? proxyAuth : undefined,
            noProxy: noProxyHosts ? noProxyHosts.split(',').map(h => h.trim()) : []
          } : undefined
        }),
      });

      const responseTime = Date.now() - startTime;
      const responseData = await res.json();

      if (responseData.error) {
        toast({
          title: 'Request Failed',
          description: responseData.error,
          variant: 'destructive',
        });
        return;
      }

      setResponse({
        status: responseData.status,
        statusText: responseData.statusText,
        headers: responseData.headers,
        data: responseData.data,
        time: responseTime,
        size: JSON.stringify(responseData.data).length,
      });

    } catch (error) {
      toast({
        title: 'Request Error',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatResponseData = (data: any) => {
    try {
      // Check if it's XML/SOAP content
      if (isXmlContent(data)) {
        return formatXml(data);
      }
      
      // Check if response has isXml flag (from backend)
      if (response?.headers?.['content-type']?.includes('xml') || 
          response?.headers?.['content-type']?.includes('soap')) {
        return formatXml(data);
      }
      
      // Otherwise format as JSON
      if (typeof data === 'object') {
        return JSON.stringify(data, null, 2);
      }
      
      return String(data);
    } catch {
      return String(data);
    }
  };

  const getStatusBadgeVariant = (status: number): "default" | "secondary" | "destructive" | "outline" => {
    if (status >= 200 && status < 300) return 'default';
    if (status >= 300 && status < 400) return 'secondary';
    if (status >= 400 && status < 500) return 'destructive';
    return 'destructive';
  };
  
  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (status >= 300 && status < 400) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    if (status >= 400 && status < 500) return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to clipboard',
      duration: 2000,
    });
  };

  const exportCollection = async () => {
    if (!selectedCollection) return;
    
    try {
      // Get full collection data including all requests and environments
      const response = await api.get(`/api/api-test/collections/${selectedCollection.id}`);
      const envResponse = await api.get(`/api/api-test/collections/${selectedCollection.id}/environments`);
      
      // Get variables for each environment
      const environmentsWithVariables = await Promise.all(
        envResponse.data.map(async (env: any) => {
          const varResponse = await api.get(`/api/api-test/environments/${env.id}/variables`);
          return {
            ...env,
            variables: varResponse.data
          };
        })
      );
      
      const exportData = {
        version: '1.0',
        collection: {
          name: selectedCollection.name,
          description: selectedCollection.description,
          variables: selectedCollection.variables
        },
        environments: environmentsWithVariables,
        requests: response.data.requests
      };
      
      // Create and download file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedCollection.name.replace(/[^a-z0-9]/gi, '_')}_collection.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Collection Exported',
        description: `${selectedCollection.name} has been exported successfully`,
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to export collection',
        variant: 'destructive',
      });
    }
  };

  const importCollection = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        
        // Validate import data
        if (!data.version || !data.collection || !data.requests) {
          throw new Error('Invalid collection format');
        }
        
        // Create new collection
        const collectionResponse = await api.post('/api/api-test/collections', {
          name: `${data.collection.name} (Imported)`,
          description: data.collection.description || '',
          variables: data.collection.variables || {}
        });
        
        const newCollectionId = collectionResponse.data.id;
        
        // Import requests
        for (const request of data.requests) {
          await api.post(`/api/api-test/collections/${newCollectionId}/requests`, {
            ...request,
            id: undefined, // Remove id to create new
            collectionId: undefined // Will be set by API
          });
        }
        
        // TODO: Import custom environments and variables
        
        // Reload collections and select the imported one
        await loadCollections();
        await loadCollection(newCollectionId);
        
        toast({
          title: 'Collection Imported',
          description: `${data.collection.name} has been imported successfully`,
        });
      } catch (error) {
        toast({
          title: 'Import Failed',
          description: error instanceof Error ? error.message : 'Failed to import collection',
          variant: 'destructive',
        });
      }
    };
    
    input.click();
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[90vh] p-0 border-2 border-white/30 shadow-2xl bg-background ring-4 ring-white/10 dark:border-white/20 dark:ring-white/5">
        <div className="px-6 py-4 border-b flex flex-row items-center justify-between bg-gray-50 dark:bg-gray-900/50">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold">API Test Tool</h2>
            {selectedCollection && environments.length > 0 && (
              <div className="flex items-center gap-2">
                <Select 
                  value={currentEnvironmentId?.toString() || ''} 
                  onValueChange={(value) => switchEnvironment(parseInt(value))}
                >
                  <SelectTrigger className="w-[140px] h-8">
                    <SelectValue placeholder="Environment" />
                  </SelectTrigger>
                  <SelectContent>
                    {environments.map(env => (
                      <SelectItem key={env.id} value={env.id.toString()}>
                        <div className="flex items-center gap-2">
                          {env.color && (
                            <div 
                              className="w-2 h-2 rounded-full" 
                              style={{ backgroundColor: env.color }}
                            />
                          )}
                          <span>{env.displayName}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onClick={() => setShowEnvironmentDialog(true)}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={newRequest}>
              <Plus className="h-3 w-3 mr-1" />
              New
            </Button>
            <Button 
              size="sm" 
              variant="default"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleSaveClick}
              disabled={!url || savingRequest}
            >
              {savingRequest ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <Save className="h-3 w-3 mr-1" />
              )}
              Save
            </Button>
          </div>
        </div>
        
        <div className="flex h-[calc(90vh-100px)]">
          {/* Collections Sidebar */}
          {showCollections && (
            <div className="w-64 border-r bg-gray-50 dark:bg-gray-900 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm">Collections</h3>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={importCollection} title="Import Collection">
                    <Download className="h-3 w-3" />
                  </Button>
                  {selectedCollection && (
                    <Button size="sm" variant="ghost" onClick={exportCollection} title="Export Collection">
                      <Upload className="h-3 w-3" />
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={createCollection} title="New Collection">
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              <ScrollArea className="h-[calc(100%-60px)]">
                {collections.length === 0 ? (
                  <div className="text-center text-sm text-muted-foreground py-8">
                    No collections yet.
                    <br />
                    <Button 
                      size="sm" 
                      variant="link" 
                      onClick={createCollection}
                      className="mt-2"
                    >
                      Create your first collection
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {collections.map((collection) => (
                      <div key={collection.id}>
                        <div
                          className={cn(
                            "flex items-center justify-between p-2 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800",
                            selectedCollection?.id === collection.id && "bg-gray-100 dark:bg-gray-800"
                          )}
                          onClick={() => loadCollection(collection.id)}
                        >
                          <div className="flex items-center gap-2 flex-1">
                            <FolderOpen className="h-4 w-4" />
                            <span className="text-sm font-medium flex-1">{collection.name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Badge variant="outline" className="text-xs">
                              {collection.requestCount || 0}
                            </Badge>
                            {selectedCollection?.id === collection.id && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="h-6 w-6 p-0"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <MoreVertical className="h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={exportCollection}>
                                    <Download className="h-3 w-3 mr-2" />
                                    Export Collection
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => {/* TODO: Delete collection */}}>
                                    <Trash2 className="h-3 w-3 mr-2" />
                                    Delete Collection
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </div>
                        
                        {selectedCollection?.id === collection.id && savedRequests.length > 0 && (
                          <div className="ml-4 mt-1 space-y-1">
                            {savedRequests.map((request) => (
                              <div
                                key={request.id}
                                className={cn(
                                  "flex items-center justify-between p-1 px-2 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 group",
                                  currentRequestId === request.id && "bg-blue-50 dark:bg-blue-900/20"
                                )}
                                onClick={() => loadRequest(request)}
                              >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <Badge 
                                    variant="outline" 
                                    className={cn(
                                      "text-xs",
                                      request.method === 'GET' && "text-green-600",
                                      request.method === 'POST' && "text-blue-600",
                                      request.method === 'PUT' && "text-yellow-600",
                                      request.method === 'DELETE' && "text-red-600"
                                    )}
                                  >
                                    {request.method}
                                  </Badge>
                                  <span className="text-xs truncate">{request.name}</span>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteRequest(request.id);
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          )}
          
          {/* Request Panel */}
          <div className="w-[45%] min-w-[500px] border-r flex flex-col">
            <div className="p-4 flex flex-col flex-1 overflow-hidden">
              {/* URL Bar */}
              <div className="flex gap-2 mb-4">
                <Select value={protocol} onValueChange={setProtocol}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROTOCOLS.map(p => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HTTP_METHODS.map(m => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Input
                  placeholder="Enter URL"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="flex-1"
                />
                
                <Button
                  onClick={sendRequest}
                  disabled={loading || !url}
                  className="min-w-[100px] bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send
                    </>
                  )}
                </Button>
              </div>

              <Tabs defaultValue="params" className="flex-1 flex flex-col">
                <TabsList className="grid w-full grid-cols-6 shrink-0">
                  <TabsTrigger value="params">Params</TabsTrigger>
                  <TabsTrigger value="headers">Headers</TabsTrigger>
                  <TabsTrigger value="auth">Auth</TabsTrigger>
                  <TabsTrigger value="body">Body</TabsTrigger>
                  <TabsTrigger value="tests">Tests</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="params" className="space-y-2 overflow-auto flex-1">
                  <div className="flex justify-between items-center mb-2">
                    <Label>Query Parameters</Label>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white h-8 w-8 p-0" onClick={addQueryParam}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {queryParams.map((param, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <Input
                        placeholder="Key"
                        value={param.key}
                        onChange={(e) => updateQueryParam(index, 'key', e.target.value)}
                        className="flex-1"
                      />
                      <Input
                        placeholder="Value"
                        value={param.value}
                        onChange={(e) => updateQueryParam(index, 'value', e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeQueryParam(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="headers" className="space-y-2 overflow-auto flex-1">
                  <div className="flex justify-between items-center mb-2">
                    <Label>Request Headers</Label>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={addHeader}>
                      <Plus className="h-3 w-3 mr-1" />
                      Add Custom
                    </Button>
                  </div>
                  
                  {/* Common Headers Section */}
                  <div className="space-y-3 mb-4">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Common Headers</div>
                    
                    {/* Content-Type Header */}
                    <div className="flex gap-2 items-center">
                      <input
                        type="checkbox"
                        checked={headers.some(h => h.key === 'Content-Type' && h.enabled)}
                        onChange={(e) => {
                          const existing = headers.find(h => h.key === 'Content-Type');
                          if (existing) {
                            const index = headers.indexOf(existing);
                            updateHeader(index, 'enabled', e.target.checked);
                          } else if (e.target.checked) {
                            setHeaders([...headers, { key: 'Content-Type', value: 'application/json', enabled: true }]);
                          }
                        }}
                        className="h-4 w-4"
                      />
                      <div className="font-mono text-sm w-40">Content-Type</div>
                      <Select
                        value={headers.find(h => h.key === 'Content-Type')?.value || 'application/json'}
                        onValueChange={(value) => {
                          const existing = headers.find(h => h.key === 'Content-Type');
                          if (existing) {
                            const index = headers.indexOf(existing);
                            updateHeader(index, 'value', value);
                          } else {
                            setHeaders([...headers, { key: 'Content-Type', value, enabled: true }]);
                          }
                        }}
                        disabled={!headers.some(h => h.key === 'Content-Type' && h.enabled)}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="application/json">application/json</SelectItem>
                          <SelectItem value="application/xml">application/xml</SelectItem>
                          <SelectItem value="text/xml">text/xml</SelectItem>
                          <SelectItem value="text/xml; charset=utf-8">text/xml; charset=utf-8</SelectItem>
                          <SelectItem value="application/x-www-form-urlencoded">application/x-www-form-urlencoded</SelectItem>
                          <SelectItem value="multipart/form-data">multipart/form-data</SelectItem>
                          <SelectItem value="text/plain">text/plain</SelectItem>
                          <SelectItem value="text/html">text/html</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* SOAPAction Header */}
                    <div className="flex gap-2 items-center">
                      <input
                        type="checkbox"
                        checked={headers.some(h => h.key === 'SOAPAction' && h.enabled)}
                        onChange={(e) => {
                          const existing = headers.find(h => h.key === 'SOAPAction');
                          if (existing) {
                            const index = headers.indexOf(existing);
                            updateHeader(index, 'enabled', e.target.checked);
                          } else if (e.target.checked) {
                            setHeaders([...headers, { key: 'SOAPAction', value: '', enabled: true }]);
                          }
                        }}
                        className="h-4 w-4"
                      />
                      <div className="font-mono text-sm w-40">SOAPAction</div>
                      <Input
                        value={headers.find(h => h.key === 'SOAPAction')?.value || ''}
                        onChange={(e) => {
                          const existing = headers.find(h => h.key === 'SOAPAction');
                          if (existing) {
                            const index = headers.indexOf(existing);
                            updateHeader(index, 'value', e.target.value);
                          } else {
                            setHeaders([...headers, { key: 'SOAPAction', value: e.target.value, enabled: true }]);
                          }
                        }}
                        placeholder="Enter SOAP action"
                        disabled={!headers.some(h => h.key === 'SOAPAction' && h.enabled)}
                        className="flex-1"
                      />
                    </div>
                    
                    {/* Accept Header */}
                    <div className="flex gap-2 items-center">
                      <input
                        type="checkbox"
                        checked={headers.some(h => h.key === 'Accept' && h.enabled)}
                        onChange={(e) => {
                          const existing = headers.find(h => h.key === 'Accept');
                          if (existing) {
                            const index = headers.indexOf(existing);
                            updateHeader(index, 'enabled', e.target.checked);
                          } else if (e.target.checked) {
                            setHeaders([...headers, { key: 'Accept', value: 'application/json', enabled: true }]);
                          }
                        }}
                        className="h-4 w-4"
                      />
                      <div className="font-mono text-sm w-40">Accept</div>
                      <Select
                        value={headers.find(h => h.key === 'Accept')?.value || 'application/json'}
                        onValueChange={(value) => {
                          const existing = headers.find(h => h.key === 'Accept');
                          if (existing) {
                            const index = headers.indexOf(existing);
                            updateHeader(index, 'value', value);
                          } else {
                            setHeaders([...headers, { key: 'Accept', value, enabled: true }]);
                          }
                        }}
                        disabled={!headers.some(h => h.key === 'Accept' && h.enabled)}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="application/json">application/json</SelectItem>
                          <SelectItem value="application/xml">application/xml</SelectItem>
                          <SelectItem value="text/xml">text/xml</SelectItem>
                          <SelectItem value="text/html">text/html</SelectItem>
                          <SelectItem value="text/plain">text/plain</SelectItem>
                          <SelectItem value="*/*">*/*</SelectItem>
                          <SelectItem value="application/json, text/plain, */*">application/json, text/plain, */*</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Authorization Header */}
                    <div className="flex gap-2 items-center">
                      <input
                        type="checkbox"
                        checked={headers.some(h => h.key === 'Authorization' && h.enabled)}
                        onChange={(e) => {
                          const existing = headers.find(h => h.key === 'Authorization');
                          if (existing) {
                            const index = headers.indexOf(existing);
                            updateHeader(index, 'enabled', e.target.checked);
                          } else if (e.target.checked) {
                            setHeaders([...headers, { key: 'Authorization', value: 'Bearer ', enabled: true }]);
                          }
                        }}
                        className="h-4 w-4"
                      />
                      <div className="font-mono text-sm w-40">Authorization</div>
                      <Input
                        value={headers.find(h => h.key === 'Authorization')?.value || ''}
                        onChange={(e) => {
                          const existing = headers.find(h => h.key === 'Authorization');
                          if (existing) {
                            const index = headers.indexOf(existing);
                            updateHeader(index, 'value', e.target.value);
                          } else {
                            setHeaders([...headers, { key: 'Authorization', value: e.target.value, enabled: true }]);
                          }
                        }}
                        placeholder="Bearer token or Basic auth"
                        disabled={!headers.some(h => h.key === 'Authorization' && h.enabled)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  
                  {/* Custom Headers Section */}
                  {headers.filter(h => !['Content-Type', 'SOAPAction', 'Accept', 'Authorization'].includes(h.key)).length > 0 && (
                    <>
                      <Separator className="my-4" />
                      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Custom Headers</div>
                      {headers.filter(h => !['Content-Type', 'SOAPAction', 'Accept', 'Authorization'].includes(h.key)).map((header, index) => {
                        const actualIndex = headers.indexOf(header);
                        return (
                          <div key={actualIndex} className="flex gap-2 items-center">
                            <input
                              type="checkbox"
                              checked={header.enabled}
                              onChange={(e) => updateHeader(actualIndex, 'enabled', e.target.checked)}
                              className="h-4 w-4"
                            />
                            <Input
                              placeholder="Header name"
                              value={header.key}
                              onChange={(e) => updateHeader(actualIndex, 'key', e.target.value)}
                              className="w-40"
                            />
                            <Input
                              placeholder="Header value"
                              value={header.value}
                              onChange={(e) => updateHeader(actualIndex, 'value', e.target.value)}
                              className="flex-1"
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => removeHeader(actualIndex)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        );
                      })}
                    </>
                  )}
                </TabsContent>

                <TabsContent value="auth" className="space-y-4 overflow-auto flex-1">
                  <div>
                    <Label>Authentication Type</Label>
                    <Select value={authType} onValueChange={setAuthType}>
                      <SelectTrigger className="w-full mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {AUTH_TYPES.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {authType === 'Basic Auth' && (
                    <>
                      <div>
                        <Label>Username</Label>
                        <Input
                          value={authCredentials.username}
                          onChange={(e) => setAuthCredentials({...authCredentials, username: e.target.value})}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label>Password</Label>
                        <Input
                          type="password"
                          value={authCredentials.password}
                          onChange={(e) => setAuthCredentials({...authCredentials, password: e.target.value})}
                          className="mt-2"
                        />
                      </div>
                    </>
                  )}

                  {authType === 'Bearer Token' && (
                    <div>
                      <Label>Token</Label>
                      <Input
                        value={authCredentials.token}
                        onChange={(e) => setAuthCredentials({...authCredentials, token: e.target.value})}
                        className="mt-2"
                        placeholder="Enter bearer token"
                      />
                    </div>
                  )}

                  {authType === 'API Key' && (
                    <div>
                      <Label>API Key</Label>
                      <Input
                        value={authCredentials.apiKey}
                        onChange={(e) => setAuthCredentials({...authCredentials, apiKey: e.target.value})}
                        className="mt-2"
                        placeholder="Enter API key"
                      />
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="body" className="flex flex-col h-full">
                  <div className="shrink-0 mb-2">
                    <Label>Content Type</Label>
                    <Select value={contentType} onValueChange={setContentType}>
                      <SelectTrigger className="w-full mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CONTENT_TYPES.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 flex flex-col min-h-0">
                    <Label className="mb-2">Request Body</Label>
                    <Textarea
                      value={requestBody}
                      onChange={(e) => setRequestBody(e.target.value)}
                      className="flex-1 font-mono text-sm resize-none"
                      placeholder={contentType === 'application/json' ? '{\n  "key": "value"\n}' : 'Enter request body'}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="tests" className="flex flex-col h-full">
                  <div className="flex flex-col h-full">
                    <Label>Test Script</Label>
                    <p className="text-sm text-muted-foreground mt-1 mb-2">
                      Write JavaScript to test your API response. Available variables: response, status, headers
                    </p>
                    <Textarea
                      value={testScript}
                      onChange={(e) => setTestScript(e.target.value)}
                      className="flex-1 font-mono text-sm resize-none"
                      placeholder={`// Example tests:
// Check status code
pm.test("Status code is 200", () => {
  pm.expect(response.status).to.equal(200);
});

// Check response time
pm.test("Response time is less than 500ms", () => {
  pm.expect(response.time).to.be.below(500);
});

// Check response body
pm.test("Response has required fields", () => {
  const data = response.data;
  pm.expect(data).to.have.property('id');
  pm.expect(data.name).to.be.a('string');
});`}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="settings" className="space-y-4 overflow-auto flex-1">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold mb-2">SSL/TLS Certificate Verification</h3>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="insecure-skip-verify"
                          checked={insecureSkipVerify}
                          onChange={(e) => setInsecureSkipVerify(e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <label htmlFor="insecure-skip-verify" className="text-sm text-muted-foreground">
                          Skip SSL certificate verification (insecure)
                        </label>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        ⚠️ Warning: Only use this for testing with self-signed certificates
                      </p>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="text-sm font-semibold mb-2">Proxy Configuration</h3>
                      <div className="flex items-center space-x-2 mb-4">
                        <input
                          type="checkbox"
                          id="use-proxy"
                          checked={useProxy}
                          onChange={(e) => setUseProxy(e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <label htmlFor="use-proxy" className="text-sm">
                          Use proxy server
                        </label>
                      </div>

                      {useProxy && (
                        <div className="space-y-4 ml-6">
                          <div>
                            <Label>Proxy URL</Label>
                            <Input
                              value={proxyUrl}
                              onChange={(e) => setProxyUrl(e.target.value)}
                              placeholder="http://proxy.example.com:8080"
                              className="mt-1"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Proxy Username (optional)</Label>
                              <Input
                                value={proxyAuth.username}
                                onChange={(e) => setProxyAuth({...proxyAuth, username: e.target.value})}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label>Proxy Password (optional)</Label>
                              <Input
                                type="password"
                                value={proxyAuth.password}
                                onChange={(e) => setProxyAuth({...proxyAuth, password: e.target.value})}
                                className="mt-1"
                              />
                            </div>
                          </div>

                          <div>
                            <Label>No Proxy Hosts</Label>
                            <Input
                              value={noProxyHosts}
                              onChange={(e) => setNoProxyHosts(e.target.value)}
                              placeholder="localhost, 127.0.0.1, *.local"
                              className="mt-1"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Comma-separated list of hosts that should bypass the proxy
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Response Panel */}
          <div className="flex-1 min-w-[400px] flex flex-col overflow-hidden">
            {response ? (
              <>
                <div className="p-4 border-b bg-gray-50 dark:bg-gray-900">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className={cn("font-mono border-0", getStatusColor(response.status))}>
                        {response.status} {response.statusText}
                      </Badge>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {response.time}ms
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {(response.size / 1024).toFixed(2)} KB
                      </div>
                      {(isXmlContent(response.data) || response.headers?.['content-type']?.includes('xml') || response.headers?.['content-type']?.includes('soap')) && (
                        <Badge variant="outline" className="text-xs">
                          XML/SOAP
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(formatResponseData(response.data))}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Save className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <Tabs value={responseTab} onValueChange={setResponseTab} className="flex-1">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="body">Body</TabsTrigger>
                    <TabsTrigger value="headers">Headers</TabsTrigger>
                    <TabsTrigger value="raw">Raw</TabsTrigger>
                  </TabsList>

                  <TabsContent value="body" className="h-full p-4 overflow-hidden">
                    <ScrollArea className="h-[calc(100%-50px)] w-full">
                      <pre className="text-sm font-mono whitespace-pre-wrap break-all">
                        {formatResponseData(response.data)}
                      </pre>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="headers" className="p-4">
                    <div className="space-y-2">
                      {Object.entries(response.headers).map(([key, value]) => (
                        <div key={key} className="flex">
                          <span className="font-mono font-semibold text-sm w-1/3">{key}:</span>
                          <span className="font-mono text-sm text-muted-foreground">{value}</span>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="raw" className="h-full p-4 overflow-hidden">
                    <ScrollArea className="h-[calc(100%-50px)] w-full">
                      <pre className="text-sm font-mono text-muted-foreground whitespace-pre-wrap break-all">
                        {JSON.stringify(response, null, 2)}
                      </pre>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <Send className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>Send a request to see the response</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
    
    {selectedCollection && (
      <EnvironmentVariablesDialog
        open={showEnvironmentDialog}
        onOpenChange={setShowEnvironmentDialog}
        collectionId={selectedCollection.id}
        environments={environments}
        currentEnvironmentId={currentEnvironmentId}
      />
    )}
    
    {/* Save Request Dialog */}
    <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Save Request</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div>
            <Label htmlFor="request-name">Request Name</Label>
            <Input
              id="request-name"
              value={saveRequestName}
              onChange={(e) => setSaveRequestName(e.target.value)}
              placeholder="Enter request name"
              className="mt-2"
            />
          </div>
          
          <div>
            <Label htmlFor="collection-select">Save to Collection</Label>
            <Select 
              value={saveToCollectionId?.toString() || ''} 
              onValueChange={(value) => setSaveToCollectionId(parseInt(value))}
            >
              <SelectTrigger id="collection-select" className="mt-2">
                <SelectValue placeholder="Select a collection" />
              </SelectTrigger>
              <SelectContent>
                {collections.map(collection => (
                  <SelectItem key={collection.id} value={collection.id.toString()}>
                    <div className="flex items-center gap-2">
                      <FolderOpen className="h-4 w-4" />
                      <span>{collection.name}</span>
                      {collection.id === selectedCollection?.id && (
                        <Badge variant="outline" className="ml-2 text-xs">Current</Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
            Cancel
          </Button>
          <Button 
            onClick={saveRequest}
            disabled={!saveRequestName || !saveToCollectionId}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {savingRequest ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  </>
  );
}