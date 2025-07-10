import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, GitBranch, Zap, Database, Cloud, Lock } from "lucide-react";

// TM Forum standard integration patterns
const INTEGRATION_PATTERNS = {
  'api-gateway': {
    name: 'API Gateway Pattern',
    description: 'Centralized API management for cross-domain integration',
    domains: ['service', 'resource'],
    icon: Cloud,
    characteristics: [
      'Single entry point for external consumers',
      'API versioning and lifecycle management',
      'Rate limiting and throttling',
      'Security and authentication',
    ],
    tmfApis: ['TMF640', 'TMF641', 'TMF642'],
  },
  'event-driven': {
    name: 'Event-Driven Integration',
    description: 'Asynchronous communication using event streams',
    domains: ['product', 'customer', 'service'],
    icon: Zap,
    characteristics: [
      'Loose coupling between domains',
      'Real-time event propagation',
      'Event sourcing capabilities',
      'Scalable message distribution',
    ],
    tmfApis: ['TMF688', 'TMF724'],
  },
  'service-mesh': {
    name: 'Service Mesh Pattern',
    description: 'Microservices communication infrastructure',
    domains: ['service', 'resource'],
    icon: GitBranch,
    characteristics: [
      'Service-to-service communication',
      'Traffic management and load balancing',
      'Service discovery',
      'Observability and monitoring',
    ],
    tmfApis: ['TMF640', 'TMF639'],
  },
  'data-federation': {
    name: 'Data Federation Pattern',
    description: 'Virtual integration of distributed data sources',
    domains: ['customer', 'product', 'enterprise'],
    icon: Database,
    characteristics: [
      'Unified data access layer',
      'Query optimization across domains',
      'Data virtualization',
      'Metadata management',
    ],
    tmfApis: ['TMF620', 'TMF622'],
  },
  'orchestration': {
    name: 'Process Orchestration',
    description: 'End-to-end business process coordination',
    domains: ['product', 'service', 'resource'],
    icon: GitBranch,
    characteristics: [
      'Cross-domain process flows',
      'State management',
      'Compensation handling',
      'SLA monitoring',
    ],
    tmfApis: ['TMF641', 'TMF640', 'TMF633'],
  },
};

// TM Forum Open APIs mapping
const TMF_APIS = {
  'TMF620': { name: 'Product Catalog Management', domain: 'product' },
  'TMF622': { name: 'Product Ordering', domain: 'product' },
  'TMF633': { name: 'Service Catalog Management', domain: 'service' },
  'TMF639': { name: 'Resource Inventory', domain: 'resource' },
  'TMF640': { name: 'Service Activation', domain: 'service' },
  'TMF641': { name: 'Service Ordering', domain: 'service' },
  'TMF642': { name: 'Alarm Management', domain: 'service' },
  'TMF688': { name: 'Event Management', domain: 'enterprise' },
  'TMF724': { name: 'Customer Event Management', domain: 'customer' },
};

export default function TMFIntegrationPatterns() {
  const [selectedPattern, setSelectedPattern] = useState<string>('api-gateway');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">TM Forum Integration Patterns</h2>
        <p className="text-gray-600">
          Standard patterns for integrating applications across TM Forum domains
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          These patterns follow TM Forum's Open Digital Architecture (ODA) principles
          and leverage standard TMF Open APIs for interoperability.
        </AlertDescription>
      </Alert>

      <Tabs value={selectedPattern} onValueChange={setSelectedPattern}>
        <TabsList className="grid grid-cols-5 w-full">
          {Object.entries(INTEGRATION_PATTERNS).map(([key, pattern]) => (
            <TabsTrigger key={key} value={key} className="text-xs">
              {pattern.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.entries(INTEGRATION_PATTERNS).map(([key, pattern]) => {
          const Icon = pattern.icon;
          
          return (
            <TabsContent key={key} value={key} className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Icon className="w-6 h-6 text-blue-600" />
                    {pattern.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600">{pattern.description}</p>

                  <div>
                    <h4 className="font-medium mb-2">Applicable Domains</h4>
                    <div className="flex gap-2">
                      {pattern.domains.map(domain => (
                        <Badge key={domain} variant="secondary">
                          {domain.charAt(0).toUpperCase() + domain.slice(1)}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Key Characteristics</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                      {pattern.characteristics.map((char, index) => (
                        <li key={index}>{char}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Relevant TMF Open APIs</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {pattern.tmfApis.map(apiId => {
                        const api = TMF_APIS[apiId as keyof typeof TMF_APIS];
                        return (
                          <div key={apiId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div>
                              <span className="font-mono text-sm">{apiId}</span>
                              <p className="text-xs text-gray-600">{api?.name}</p>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {api?.domain}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Pattern Implementation Guide */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Implementation Guidelines</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {key === 'api-gateway' && (
                      <>
                        <div>
                          <h5 className="font-medium mb-1">Security Considerations</h5>
                          <ul className="text-sm text-gray-600 space-y-1">
                            <li>• Implement OAuth 2.0 / OpenID Connect for authentication</li>
                            <li>• Use API keys for service-to-service communication</li>
                            <li>• Enable TLS/SSL for all endpoints</li>
                            <li>• Implement rate limiting per consumer</li>
                          </ul>
                        </div>
                        <div>
                          <h5 className="font-medium mb-1">Best Practices</h5>
                          <ul className="text-sm text-gray-600 space-y-1">
                            <li>• Version APIs following TMF guidelines (v1, v2, etc.)</li>
                            <li>• Implement circuit breakers for resilience</li>
                            <li>• Use API documentation (OpenAPI/Swagger)</li>
                            <li>• Monitor API usage and performance metrics</li>
                          </ul>
                        </div>
                      </>
                    )}
                    
                    {key === 'event-driven' && (
                      <>
                        <div>
                          <h5 className="font-medium mb-1">Event Design</h5>
                          <ul className="text-sm text-gray-600 space-y-1">
                            <li>• Follow TMF Event Management API (TMF688) standards</li>
                            <li>• Use CloudEvents specification for event format</li>
                            <li>• Implement event schemas with versioning</li>
                            <li>• Design for idempotency and event deduplication</li>
                          </ul>
                        </div>
                        <div>
                          <h5 className="font-medium mb-1">Infrastructure</h5>
                          <ul className="text-sm text-gray-600 space-y-1">
                            <li>• Use message brokers (Kafka, RabbitMQ, etc.)</li>
                            <li>• Implement dead letter queues for failed events</li>
                            <li>• Consider event store for event sourcing</li>
                            <li>• Monitor event flow and processing lag</li>
                          </ul>
                        </div>
                      </>
                    )}

                    {key === 'service-mesh' && (
                      <>
                        <div>
                          <h5 className="font-medium mb-1">Mesh Configuration</h5>
                          <ul className="text-sm text-gray-600 space-y-1">
                            <li>• Deploy sidecar proxies for each service</li>
                            <li>• Configure service discovery and registry</li>
                            <li>• Implement mutual TLS (mTLS) between services</li>
                            <li>• Set up traffic policies and routing rules</li>
                          </ul>
                        </div>
                        <div>
                          <h5 className="font-medium mb-1">Observability</h5>
                          <ul className="text-sm text-gray-600 space-y-1">
                            <li>• Enable distributed tracing (Jaeger, Zipkin)</li>
                            <li>• Collect service metrics (Prometheus)</li>
                            <li>• Implement service health checks</li>
                            <li>• Create service dependency maps</li>
                          </ul>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>

      {/* TMF API Reference */}
      <Card>
        <CardHeader>
          <CardTitle>TMF Open API Quick Reference</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(TMF_APIS).map(([apiId, api]) => (
              <div key={apiId} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <span className="font-mono text-sm font-medium">{apiId}</span>
                  <p className="text-xs text-gray-600">{api.name}</p>
                </div>
                <Badge variant="outline">{api.domain}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}