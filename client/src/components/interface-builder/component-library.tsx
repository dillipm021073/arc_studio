import { useState, useRef, useEffect } from "react";
import { 
  Database, 
  Globe, 
  MessageSquare, 
  FileText, 
  Zap, 
  Cloud,
  Server,
  Smartphone,
  Layers,
  GitBranch,
  Building2,
  Workflow,
  Activity,
  Code,
  Coffee,
  Building,
  Network,
  Clock,
  ChevronUp,
  ChevronDown,
  Type,
  Minus,
  Circle,
  Square,
  Triangle,
  Package,
  CheckCircle,
  Shield,
  RefreshCw,
  Layout,
  Users,
  MoveRight,
  Box,
  Image as ImageIcon,
  Folder
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface ComponentTemplate {
  id: string;
  type: 'interface' | 'application' | 'process' | 'text' | 'line' | 'shape' | 'uml' | 'internalActivity' | 'decision' | 'rectangle' | 'container' | 'roundedRectangle' | 'image';
  category: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  properties: Record<string, any>;
  connectionPoints?: {
    input: Array<{ id: string; type: string; position: 'top' | 'bottom' | 'left' | 'right' }>;
    output: Array<{ id: string; type: string; position: 'top' | 'bottom' | 'left' | 'right' }>;
  };
  defaultData?: any;
}

const componentTemplates: ComponentTemplate[] = [
  // Internal Activities
  {
    id: 'check-activity',
    name: 'Check Activity',
    category: 'Internal Activities',
    type: 'internalActivity',
    description: 'Internal check or validation',
    icon: CheckCircle,
    defaultData: {
      activityName: 'Check Data',
      activityType: 'check',
      description: 'Verify data exists',
      preCondition: '',
      postCondition: '',
      estimatedDurationMs: 100
    }
  },
  {
    id: 'validate-activity',
    name: 'Validate Activity',
    category: 'Internal Activities',
    type: 'internalActivity',
    description: 'Validate business rules',
    icon: Shield,
    defaultData: {
      activityName: 'Validate Rules',
      activityType: 'validate',
      description: 'Apply business validation',
      preCondition: '',
      postCondition: '',
      estimatedDurationMs: 200
    }
  },
  {
    id: 'transform-activity',
    name: 'Transform Activity',
    category: 'Internal Activities',
    type: 'internalActivity',
    description: 'Transform or convert data',
    icon: RefreshCw,
    defaultData: {
      activityName: 'Transform Data',
      activityType: 'transform',
      description: 'Convert data format',
      preCondition: '',
      postCondition: '',
      estimatedDurationMs: 150
    }
  },
  // Decision Points
  {
    id: 'data-decision',
    name: 'Data Decision',
    category: 'Decision Points',
    type: 'decision',
    description: 'Decision based on data',
    icon: GitBranch,
    defaultData: {
      name: 'Data Check',
      decisionType: 'data_check',
      evaluationLogic: 'data.exists',
      possibleOutcomes: ['exists', 'not_exists']
    }
  },
  {
    id: 'business-decision',
    name: 'Business Rule',
    category: 'Decision Points',
    type: 'decision',
    description: 'Business rule decision',
    icon: GitBranch,
    defaultData: {
      name: 'Business Rule',
      decisionType: 'business_rule',
      evaluationLogic: 'amount <= limit',
      possibleOutcomes: ['approved', 'rejected', 'review']
    }
  },
  {
    id: 'technical-decision',
    name: 'Technical Check',
    category: 'Decision Points',
    type: 'decision',
    description: 'Technical validation',
    icon: GitBranch,
    defaultData: {
      name: 'Tech Check',
      decisionType: 'technical_check',
      evaluationLogic: 'response.status === 200',
      possibleOutcomes: ['success', 'failure', 'timeout']
    }
  },
  // Interface Components
  {
    id: 'rest-api',
    type: 'interface',
    category: 'API',
    name: 'REST API',
    description: 'RESTful web service interface',
    icon: Network,
    color: 'bg-blue-500',
    properties: {
      method: 'GET',
      endpoint: '/api/resource',
      contentType: 'application/json',
      authentication: 'Bearer Token'
    },
    connectionPoints: {
      input: [{ id: 'request', type: 'http', position: 'left' }],
      output: [{ id: 'response', type: 'http', position: 'right' }]
    }
  },
  {
    id: 'graphql-api',
    type: 'interface',
    category: 'API',
    name: 'GraphQL',
    description: 'GraphQL query interface',
    icon: Layers,
    color: 'bg-purple-500',
    properties: {
      endpoint: '/graphql',
      schema: 'Query { users { id name } }',
      authentication: 'API Key'
    },
    connectionPoints: {
      input: [{ id: 'query', type: 'graphql', position: 'left' }],
      output: [{ id: 'result', type: 'json', position: 'right' }]
    }
  },
  {
    id: 'message-queue',
    type: 'interface',
    category: 'Messaging',
    name: 'Message Queue',
    description: 'Asynchronous message queue',
    icon: MessageSquare,
    color: 'bg-orange-500',
    properties: {
      queueName: 'events.queue',
      protocol: 'AMQP',
      durability: 'persistent',
      routing: 'topic'
    },
    connectionPoints: {
      input: [{ id: 'publish', type: 'message', position: 'left' }],
      output: [{ id: 'consume', type: 'message', position: 'right' }]
    }
  },
  {
    id: 'enterprise-service-bus',
    type: 'interface',
    category: 'Integration',
    name: 'Enterprise Service Bus',
    description: 'Central integration hub for enterprise services',
    icon: GitBranch,
    color: 'bg-indigo-500',
    properties: {
      platform: 'IBM ESB',
      protocols: ['SOAP', 'REST', 'JMS'],
      transformation: 'XSLT/JSON',
      routing: 'Content-based',
      monitoring: 'Real-time',
      adapters: ['SAP', 'Oracle', 'Salesforce']
    },
    connectionPoints: {
      input: [
        { id: 'service-in', type: 'multi-protocol', position: 'left' },
        { id: 'adapter-in', type: 'adapter', position: 'top' }
      ],
      output: [
        { id: 'service-out', type: 'multi-protocol', position: 'right' },
        { id: 'adapter-out', type: 'adapter', position: 'bottom' }
      ]
    },
    bestPractices: [
      'Implement service versioning strategy',
      'Use canonical data model for transformations',
      'Enable message tracking and auditing',
      'Configure error handling and retry policies',
      'Monitor performance metrics'
    ],
    examples: [
      'Route orders from e-commerce to fulfillment systems',
      'Transform data between different enterprise applications',
      'Orchestrate complex business processes'
    ]
  },
  {
    id: 'file-transfer',
    type: 'interface',
    category: 'Data',
    name: 'File Transfer',
    description: 'File-based data exchange',
    icon: FileText,
    color: 'bg-green-500',
    properties: {
      protocol: 'SFTP',
      format: 'CSV',
      schedule: 'Daily',
      encryption: 'AES-256'
    },
    connectionPoints: {
      input: [{ id: 'upload', type: 'file', position: 'left' }],
      output: [{ id: 'download', type: 'file', position: 'right' }]
    }
  },
  {
    id: 'database-connection',
    type: 'interface',
    category: 'Data',
    name: 'Database',
    description: 'Direct database connection',
    icon: Database,
    color: 'bg-gray-500',
    properties: {
      type: 'PostgreSQL',
      connection: 'JDBC',
      poolSize: 10,
      timeout: 30
    },
    connectionPoints: {
      input: [{ id: 'query', type: 'sql', position: 'left' }],
      output: [{ id: 'result', type: 'dataset', position: 'right' }]
    }
  },
  {
    id: 'webhook',
    type: 'interface',
    category: 'API',
    name: 'Webhook',
    description: 'Event-driven HTTP callback',
    icon: Zap,
    color: 'bg-yellow-500',
    properties: {
      url: '/webhook/callback',
      method: 'POST',
      events: ['created', 'updated', 'deleted'],
      retries: 3
    },
    connectionPoints: {
      input: [{ id: 'trigger', type: 'event', position: 'left' }],
      output: [{ id: 'notify', type: 'http', position: 'right' }]
    }
  },
  {
    id: 'soap-service',
    type: 'interface',
    category: 'API',
    name: 'SOAP Service',
    description: 'SOAP/XML web service interface',
    icon: Code,
    color: 'bg-orange-500',
    properties: {
      wsdlUrl: 'https://api.example.com/service?wsdl',
      soapVersion: '1.2',
      protocol: 'HTTPS',
      authentication: 'WS-Security',
      encoding: 'UTF-8',
      style: 'Document/Literal'
    },
    connectionPoints: {
      input: [{ id: 'soap-request', type: 'xml', position: 'left' }],
      output: [{ id: 'soap-response', type: 'xml', position: 'right' }]
    }
  },
  {
    id: 'ejb-interface',
    type: 'interface',
    category: 'Enterprise',
    name: 'EJB Interface',
    description: 'Enterprise JavaBeans remote interface',
    icon: Coffee,
    color: 'bg-red-600',
    properties: {
      ejbType: 'Stateless Session Bean',
      jndiName: 'ejb/MyService',
      transactionType: 'Container-Managed',
      securityRole: 'authenticated-user',
      poolSize: '10-50',
      timeout: '30s'
    },
    connectionPoints: {
      input: [{ id: 'ejb-call', type: 'rmi', position: 'left' }],
      output: [{ id: 'ejb-response', type: 'object', position: 'right' }]
    }
  },
  {
    id: 'plsql-procedure',
    type: 'interface',
    category: 'Data',
    name: 'PL/SQL Procedure',
    description: 'Oracle PL/SQL stored procedure interface',
    icon: Database,
    color: 'bg-red-700',
    properties: {
      database: 'Oracle 19c',
      schema: 'APP_SCHEMA',
      package: 'PKG_BUSINESS_LOGIC',
      procedure: 'PROCESS_ORDER',
      connectionPool: 'JNDI/OracleDS',
      timeout: '60s'
    },
    connectionPoints: {
      input: [{ id: 'pl-sql-input', type: 'parameters', position: 'left' }],
      output: [{ id: 'pl-sql-output', type: 'cursor', position: 'right' }]
    }
  },

  // Application Components
  {
    id: 'web-application',
    type: 'application',
    category: 'Frontend',
    name: 'Web Application',
    description: 'Browser-based user interface',
    icon: Globe,
    color: 'bg-blue-600',
    properties: {
      framework: 'React',
      hosting: 'CloudFront',
      authentication: 'OAuth 2.0',
      responsive: true
    },
    connectionPoints: {
      input: [{ id: 'api-calls', type: 'http', position: 'bottom' }],
      output: [{ id: 'user-actions', type: 'event', position: 'top' }]
    }
  },
  {
    id: 'enterprise-portal',
    type: 'application',
    category: 'Frontend',
    name: 'Enterprise Portal',
    description: 'Unified enterprise application portal',
    icon: Layout,
    color: 'bg-purple-700',
    properties: {
      platform: 'SharePoint/Liferay',
      authentication: 'SSO/SAML',
      personalization: 'Role-based',
      widgets: ['Dashboard', 'Reports', 'Workflows'],
      integration: 'Enterprise Services',
      multiTenant: true
    },
    connectionPoints: {
      input: [
        { id: 'sso-auth', type: 'saml', position: 'left' },
        { id: 'api-integration', type: 'http', position: 'bottom' }
      ],
      output: [
        { id: 'user-events', type: 'event', position: 'top' },
        { id: 'service-calls', type: 'http', position: 'right' }
      ]
    },
    bestPractices: [
      'Implement single sign-on (SSO) for seamless access',
      'Use role-based access control (RBAC)',
      'Enable responsive design for mobile access',
      'Implement widget-based architecture'
    ],
    examples: [
      'Employee self-service portal',
      'Customer portal with order tracking',
      'Partner collaboration portal'
    ]
  },
  {
    id: 'salesforce-portal',
    type: 'application',
    category: 'CRM',
    name: 'Salesforce Portal',
    description: 'Salesforce customer/partner portal',
    icon: Users,
    color: 'bg-blue-500',
    properties: {
      type: 'Experience Cloud',
      template: 'Customer Service',
      authentication: 'Salesforce Identity',
      features: ['Cases', 'Knowledge Base', 'Community'],
      customization: 'Lightning Components',
      mobileEnabled: true
    },
    connectionPoints: {
      input: [
        { id: 'salesforce-api', type: 'rest', position: 'left' },
        { id: 'external-data', type: 'http', position: 'bottom' }
      ],
      output: [
        { id: 'crm-data', type: 'rest', position: 'right' },
        { id: 'analytics', type: 'event', position: 'top' }
      ]
    },
    bestPractices: [
      'Leverage Salesforce Lightning Design System',
      'Implement proper data security and sharing rules',
      'Use Salesforce Connect for external data integration',
      'Enable community moderation features'
    ],
    examples: [
      'Customer self-service portal with case management',
      'Partner portal for deal registration',
      'Community forum for product support'
    ]
  },
  {
    id: 'mobile-app',
    type: 'application',
    category: 'Frontend',
    name: 'Mobile App',
    description: 'Native or hybrid mobile application',
    icon: Smartphone,
    color: 'bg-purple-600',
    properties: {
      platform: 'iOS/Android',
      framework: 'React Native',
      offline: true,
      pushNotifications: true
    },
    connectionPoints: {
      input: [{ id: 'api-calls', type: 'http', position: 'bottom' }],
      output: [{ id: 'user-actions', type: 'event', position: 'top' }]
    }
  },
  {
    id: 'api-service',
    type: 'application',
    category: 'Backend',
    name: 'API Service',
    description: 'Microservice or API backend',
    icon: Server,
    color: 'bg-green-600',
    properties: {
      runtime: 'Node.js',
      framework: 'Express',
      deployment: 'Docker',
      scaling: 'Horizontal'
    },
    connectionPoints: {
      input: [
        { id: 'http-requests', type: 'http', position: 'left' },
        { id: 'messages', type: 'message', position: 'top' }
      ],
      output: [
        { id: 'http-responses', type: 'http', position: 'right' },
        { id: 'database', type: 'sql', position: 'bottom' }
      ]
    }
  },
  {
    id: 'database-system',
    type: 'application',
    category: 'Data',
    name: 'Database',
    description: 'Data storage and management system',
    icon: Database,
    color: 'bg-gray-600',
    properties: {
      type: 'PostgreSQL',
      version: '15',
      replication: 'Master-Slave',
      backup: 'Daily'
    },
    connectionPoints: {
      input: [{ id: 'connections', type: 'sql', position: 'top' }],
      output: [{ id: 'data', type: 'dataset', position: 'bottom' }]
    }
  },
  {
    id: 'cloud-service',
    type: 'application',
    category: 'Cloud',
    name: 'Cloud Service',
    description: 'Third-party cloud service',
    icon: Cloud,
    color: 'bg-blue-400',
    properties: {
      provider: 'AWS',
      service: 'Lambda',
      region: 'us-east-1',
      sla: '99.9%'
    },
    connectionPoints: {
      input: [{ id: 'api-calls', type: 'http', position: 'left' }],
      output: [{ id: 'responses', type: 'http', position: 'right' }]
    }
  },
  {
    id: 'legacy-application',
    type: 'application',
    category: 'Enterprise',
    name: 'On-Premise Legacy',
    description: 'Legacy on-premise enterprise application',
    icon: Building,
    color: 'bg-gray-600',
    properties: {
      platform: 'Mainframe/AS400',
      language: 'COBOL/RPG',
      database: 'DB2/IMS',
      integration: 'File Transfer/MQ',
      maintenance: 'Extended Support',
      deployment: 'On-Premise'
    },
    connectionPoints: {
      input: [{ id: 'batch-input', type: 'batch', position: 'left' }],
      output: [
        { id: 'file-output', type: 'file', position: 'right' },
        { id: 'mq-output', type: 'message', position: 'bottom' }
      ]
    }
  },
  {
    id: 'weblogic-application',
    type: 'application',
    category: 'Enterprise',
    name: 'WebLogic Application',
    description: 'Oracle WebLogic Server J2EE application',
    icon: Server,
    color: 'bg-red-600',
    properties: {
      version: 'WebLogic 14c',
      javaVersion: 'JDK 11',
      clustering: 'Multi-node',
      deployment: 'EAR/WAR',
      jndi: 'Configured',
      datasource: 'Connection Pool'
    },
    connectionPoints: {
      input: [
        { id: 'http-in', type: 'http', position: 'top' },
        { id: 'jms-in', type: 'jms', position: 'left' }
      ],
      output: [
        { id: 'ejb-out', type: 'ejb', position: 'right' },
        { id: 'jdbc-out', type: 'jdbc', position: 'bottom' }
      ]
    }
  },
  {
    id: 'spring-boot-application',
    type: 'application',
    category: 'Enterprise',
    name: 'Spring Boot Application',
    description: 'Spring Boot microservice with SOAP/REST, DB, batch/daemon capabilities',
    icon: Package,
    color: 'bg-green-600',
    properties: {
      framework: 'Spring Boot',
      buildTool: 'Maven/Gradle',
      springVersion: '3.2.x',
      javaVersion: 'JDK 17/21',
      database: 'JPA/Hibernate',
      apiTypes: ['REST', 'SOAP', 'GraphQL'],
      runMode: ['Web', 'Batch', 'Daemon'],
      containerization: 'Docker',
      features: ['Spring Security', 'Spring Data JPA', 'Spring Cloud', 'Actuator', 'OpenAPI/Swagger', 'Circuit Breaker', 'Service Discovery'],
      security: 'OAuth2/JWT',
      monitoring: 'Actuator/Micrometer',
      deployment: 'JAR/Docker/K8s'
    },
    connectionPoints: {
      input: [
        { id: 'http-rest', type: 'http', position: 'left' },
        { id: 'soap-xml', type: 'xml', position: 'left' },
        { id: 'message-queue', type: 'message', position: 'top' },
        { id: 'batch-trigger', type: 'schedule', position: 'top' }
      ],
      output: [
        { id: 'rest-response', type: 'http', position: 'right' },
        { id: 'soap-response', type: 'xml', position: 'right' },
        { id: 'database-conn', type: 'jdbc', position: 'bottom' },
        { id: 'events-out', type: 'event', position: 'bottom' }
      ]
    }
  },

  // Business Process Components
  {
    id: 'level-a-process',
    type: 'process',
    category: 'Business',
    name: 'Level A Process',
    description: 'Strategic business process',
    icon: Building2,
    color: 'bg-indigo-500',
    properties: {
      level: 'A',
      lob: 'Customer Service',
      owner: 'Business Owner',
      criticality: 'High'
    },
    connectionPoints: {
      input: [{ id: 'inputs', type: 'data', position: 'left' }],
      output: [{ id: 'outputs', type: 'data', position: 'right' }]
    }
  },
  {
    id: 'level-b-process',
    type: 'process',
    category: 'Business',
    name: 'Level B Process',
    description: 'Operational business process',
    icon: Workflow,
    color: 'bg-purple-400',
    properties: {
      level: 'B',
      parent: 'Level A Process',
      sequence: 1,
      automation: 'Partial'
    },
    connectionPoints: {
      input: [{ id: 'inputs', type: 'data', position: 'left' }],
      output: [{ id: 'outputs', type: 'data', position: 'right' }]
    }
  },
  {
    id: 'level-c-process',
    type: 'process',
    category: 'Business',
    name: 'Level C Process',
    description: 'Tactical business process',
    icon: Activity,
    color: 'bg-pink-400',
    properties: {
      level: 'C',
      parent: 'Level B Process',
      sequence: 1,
      automation: 'Manual'
    },
    connectionPoints: {
      input: [{ id: 'inputs', type: 'data', position: 'left' }],
      output: [{ id: 'outputs', type: 'data', position: 'right' }]
    }
  }
];

interface ComponentLibraryProps {
  onComponentSelect: (component: ComponentTemplate) => void;
}

export default function ComponentLibrary({ onComponentSelect }: ComponentLibraryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [activeTab, setActiveTab] = useState("interface");
  const [scrollStates, setScrollStates] = useState<Record<string, { canScrollUp: boolean; canScrollDown: boolean }>>({
    interface: { canScrollUp: false, canScrollDown: false },
    application: { canScrollUp: false, canScrollDown: false },
    process: { canScrollUp: false, canScrollDown: false },
    tools: { canScrollUp: false, canScrollDown: false },
    uml: { canScrollUp: false, canScrollDown: false }
  });
  const scrollRefs = useRef<Record<string, HTMLDivElement | null>>({
    interface: null,
    application: null,
    process: null,
    tools: null,
    uml: null
  });

  const categories = ["all", "API", "Enterprise", "Messaging", "Data", "Frontend", "Backend", "Cloud", "Business", "Media", "Geometric Tools", "UML"];
  
  // Add more components to demonstrate scrolling
  const additionalComponents: ComponentTemplate[] = [
    {
      id: 'api-gateway',
      type: 'interface',
      category: 'API',
      name: 'API Gateway',
      description: 'Centralized API management and routing',
      icon: Network,
      color: 'bg-indigo-500',
      properties: {
        provider: 'Kong/Apigee',
        rateLimit: 'Configurable',
        authentication: 'Multiple',
        loadBalancing: 'Round Robin'
      },
      connectionPoints: {
        input: [{ id: 'client-requests', type: 'http', position: 'left' }],
        output: [{ id: 'backend-services', type: 'http', position: 'right' }]
      }
    },
    {
      id: 'notification-service',
      type: 'application',
      category: 'Backend',
      name: 'Notification Service',
      description: 'Multi-channel notification delivery',
      icon: MessageSquare,
      color: 'bg-yellow-600',
      properties: {
        channels: 'Email/SMS/Push',
        queueing: 'Enabled',
        templates: 'Configured',
        tracking: 'Full Analytics'
      },
      connectionPoints: {
        input: [{ id: 'triggers', type: 'event', position: 'left' }],
        output: [{ id: 'notifications', type: 'multi-channel', position: 'right' }]
      }
    },
    {
      id: 'etl-pipeline',
      type: 'interface',
      category: 'Data',
      name: 'ETL Pipeline',
      description: 'Extract, Transform, Load data processing',
      icon: GitBranch,
      color: 'bg-teal-600',
      properties: {
        schedule: 'Cron-based',
        dataSource: 'Multiple',
        transformation: 'Custom Scripts',
        destination: 'Data Warehouse'
      },
      connectionPoints: {
        input: [{ id: 'data-sources', type: 'batch', position: 'left' }],
        output: [{ id: 'data-warehouse', type: 'batch', position: 'right' }]
      }
    },
    {
      id: 'cache-layer',
      type: 'application',
      category: 'Backend',
      name: 'Cache Layer',
      description: 'Distributed caching service',
      icon: Zap,
      color: 'bg-orange-500',
      properties: {
        type: 'Redis/Memcached',
        evictionPolicy: 'LRU',
        persistence: 'Optional',
        clustering: 'Enabled'
      },
      connectionPoints: {
        input: [{ id: 'cache-requests', type: 'tcp', position: 'left' }],
        output: [{ id: 'cache-responses', type: 'tcp', position: 'right' }]
      }
    },
    {
      id: 'batch-processor',
      type: 'application',
      category: 'Backend',
      name: 'Batch Processor',
      description: 'Scheduled batch job processing',
      icon: Clock,
      color: 'bg-gray-500',
      properties: {
        scheduler: 'Quartz',
        concurrency: 'Configurable',
        monitoring: 'Enabled',
        retryPolicy: 'Exponential Backoff'
      },
      connectionPoints: {
        input: [{ id: 'job-triggers', type: 'schedule', position: 'top' }],
        output: [{ id: 'job-results', type: 'batch', position: 'bottom' }]
      }
    },
    {
      id: 'text-box',
      type: 'text',
      category: 'Geometric Tools',
      name: 'Text Box',
      description: 'Rich text annotation with formatting',
      icon: Type,
      color: 'bg-amber-500',
      properties: {
        text: 'Double-click to edit text',
        fontSize: 16,
        fontFamily: 'sans-serif',
        fontWeight: 'normal',
        fontStyle: 'normal',
        textDecoration: 'none',
        textAlign: 'left',
        color: '#000000',
        backgroundColor: '#ffffff',
        borderRadius: 4,
        padding: 16,
        width: 200,
        height: 100
      },
      connectionPoints: {
        input: [],
        output: []
      }
    },
    {
      id: 'container-box',
      type: 'container',
      category: 'Geometric Tools',
      name: 'Container Box',
      description: 'Large resizable container that can hold other components',
      icon: Layout,
      color: 'bg-orange-500',
      properties: {
        width: 400,
        height: 300,
        fillColor: 'rgba(255, 153, 102, 0.2)',
        strokeColor: '#ff9966',
        strokeWidth: 2,
        borderRadius: 15,
        title: 'Container',
        titleFontSize: 18,
        titleColor: '#ffffff',
        opacity: 0.9,
        minWidth: 200,
        minHeight: 150,
        maxWidth: 800,
        maxHeight: 600,
        allowNesting: true,
        zIndex: -1
      },
      connectionPoints: {
        input: [
          { id: 'top', type: 'data', position: 'top' },
          { id: 'right', type: 'data', position: 'right' },
          { id: 'bottom', type: 'data', position: 'bottom' },
          { id: 'left', type: 'data', position: 'left' }
        ],
        output: [
          { id: 'top', type: 'data', position: 'top' },
          { id: 'right', type: 'data', position: 'right' },
          { id: 'bottom', type: 'data', position: 'bottom' },
          { id: 'left', type: 'data', position: 'left' }
        ]
      }
    },
    {
      id: 'rectangle',
      type: 'rectangle',
      category: 'Geometric Tools',
      name: 'Rectangle',
      description: 'Basic rectangle with text and connections',
      icon: Square,
      color: 'bg-orange-500',
      properties: {
        width: 150,
        height: 100,
        fillColor: '#ff9966',
        strokeColor: '#ffffff',
        strokeWidth: 2,
        borderRadius: 0,
        text: 'Rectangle',
        fontSize: 14,
        textColor: '#ffffff',
        textAlign: 'center',
        padding: 12,
        wordWrap: true
      },
      connectionPoints: {
        input: [
          { id: 'top', type: 'data', position: 'top' },
          { id: 'right', type: 'data', position: 'right' },
          { id: 'bottom', type: 'data', position: 'bottom' },
          { id: 'left', type: 'data', position: 'left' }
        ],
        output: [
          { id: 'top', type: 'data', position: 'top' },
          { id: 'right', type: 'data', position: 'right' },
          { id: 'bottom', type: 'data', position: 'bottom' },
          { id: 'left', type: 'data', position: 'left' }
        ]
      }
    },
    {
      id: 'rounded-rectangle',
      type: 'roundedRectangle',
      category: 'Geometric Tools',
      name: 'Rounded Rectangle',
      description: 'Rectangle with customizable rounded corners',
      icon: Square,
      color: 'bg-blue-500',
      properties: {
        width: 150,
        height: 80,
        fillColor: '#3b82f6',
        strokeColor: '#ffffff',
        strokeWidth: 2,
        borderRadius: 20,
        text: 'Rounded Box',
        fontSize: 14,
        textColor: '#ffffff',
        textAlign: 'center',
        padding: 12,
        wordWrap: true
      },
      connectionPoints: {
        input: [
          { id: 'top', type: 'data', position: 'top' },
          { id: 'right', type: 'data', position: 'right' },
          { id: 'bottom', type: 'data', position: 'bottom' },
          { id: 'left', type: 'data', position: 'left' }
        ],
        output: [
          { id: 'top', type: 'data', position: 'top' },
          { id: 'right', type: 'data', position: 'right' },
          { id: 'bottom', type: 'data', position: 'bottom' },
          { id: 'left', type: 'data', position: 'left' }
        ]
      }
    },
    {
      id: 'circle',
      type: 'shape',
      category: 'Geometric Tools',
      name: 'Circle',
      description: 'Circle shape for diagrams',
      icon: Circle,
      color: 'bg-blue-500',
      properties: {
        radius: 50,
        fillColor: '#ffffff',
        strokeColor: '#000000',
        strokeWidth: 2
      },
      connectionPoints: {
        input: [],
        output: []
      }
    },
    {
      id: 'drawing-box',
      type: 'shape',
      category: 'Geometric Tools',
      name: 'Drawing Box',
      description: 'Simple box with text and connections',
      icon: Box,
      color: 'bg-gray-500',
      properties: {
        width: 150,
        height: 100,
        fillColor: 'transparent',
        strokeColor: '#ffffff',
        strokeWidth: 1,
        borderRadius: 0,
        text: '',
        fontSize: 14,
        textColor: '#ffffff',
        textAlign: 'center',
        padding: 12,
        wordWrap: true,
        resizable: true
      },
      connectionPoints: {
        input: [
          { id: 'top', type: 'data', position: 'top' },
          { id: 'right', type: 'data', position: 'right' },
          { id: 'bottom', type: 'data', position: 'bottom' },
          { id: 'left', type: 'data', position: 'left' }
        ],
        output: [
          { id: 'top', type: 'data', position: 'top' },
          { id: 'right', type: 'data', position: 'right' },
          { id: 'bottom', type: 'data', position: 'bottom' },
          { id: 'left', type: 'data', position: 'left' }
        ]
      }
    },
    {
      id: 'database',
      type: 'shape',
      category: 'Geometric Tools',
      name: 'Database',
      description: 'Database cylinder shape with editable text',
      icon: Database,
      color: 'bg-indigo-500',
      properties: {
        width: 120,
        height: 80,
        fillColor: '#2d3748',
        strokeColor: '#ffffff',
        strokeWidth: 2,
        line1: 'Table Name',
        line2: 'Schema',
        fontSize: 12,
        textColor: '#ffffff'
      },
      connectionPoints: {
        input: [
          { id: 'top', type: 'data', position: 'top' },
          { id: 'right', type: 'data', position: 'right' },
          { id: 'bottom', type: 'data', position: 'bottom' },
          { id: 'left', type: 'data', position: 'left' }
        ],
        output: [
          { id: 'top', type: 'data', position: 'top' },
          { id: 'right', type: 'data', position: 'right' },
          { id: 'bottom', type: 'data', position: 'bottom' },
          { id: 'left', type: 'data', position: 'left' }
        ]
      }
    },
    {
      id: 'triangle',
      type: 'shape',
      category: 'Geometric Tools',
      name: 'Triangle',
      description: 'Triangular shape with multiple variants',
      icon: Triangle,
      color: 'bg-green-500',
      properties: {
        width: 120,
        height: 100,
        fillColor: 'transparent',
        strokeColor: '#ffffff',
        strokeWidth: 2,
        triangleType: 'equilateral',
        text: '',
        fontSize: 14,
        textColor: '#ffffff'
      },
      connectionPoints: {
        input: [
          { id: 'top', type: 'data', position: 'top' },
          { id: 'right', type: 'data', position: 'right' },
          { id: 'bottom', type: 'data', position: 'bottom' },
          { id: 'left', type: 'data', position: 'left' }
        ],
        output: [
          { id: 'top', type: 'data', position: 'top' },
          { id: 'right', type: 'data', position: 'right' },
          { id: 'bottom', type: 'data', position: 'bottom' },
          { id: 'left', type: 'data', position: 'left' }
        ]
      }
    },
    {
      id: 'ellipse',
      type: 'shape',
      category: 'Geometric Tools',
      name: 'Ellipse',
      description: 'Oval shape for diagrams',
      icon: Circle,
      color: 'bg-purple-500',
      properties: {
        width: 150,
        height: 100,
        fillColor: 'transparent',
        strokeColor: '#ffffff',
        strokeWidth: 2,
        text: '',
        fontSize: 14,
        textColor: '#ffffff'
      },
      connectionPoints: {
        input: [
          { id: 'top', type: 'data', position: 'top' },
          { id: 'right', type: 'data', position: 'right' },
          { id: 'bottom', type: 'data', position: 'bottom' },
          { id: 'left', type: 'data', position: 'left' }
        ],
        output: [
          { id: 'top', type: 'data', position: 'top' },
          { id: 'right', type: 'data', position: 'right' },
          { id: 'bottom', type: 'data', position: 'bottom' },
          { id: 'left', type: 'data', position: 'left' }
        ]
      }
    },
    {
      id: 'pentagon',
      type: 'shape',
      category: 'Geometric Tools',
      name: 'Pentagon',
      description: 'Five-sided polygon shape',
      icon: Package,
      color: 'bg-red-500',
      properties: {
        width: 120,
        height: 120,
        fillColor: 'transparent',
        strokeColor: '#ffffff',
        strokeWidth: 2,
        text: '',
        fontSize: 14,
        textColor: '#ffffff'
      },
      connectionPoints: {
        input: [
          { id: 'top', type: 'data', position: 'top' },
          { id: 'right', type: 'data', position: 'right' },
          { id: 'bottom', type: 'data', position: 'bottom' },
          { id: 'left', type: 'data', position: 'left' }
        ],
        output: [
          { id: 'top', type: 'data', position: 'top' },
          { id: 'right', type: 'data', position: 'right' },
          { id: 'bottom', type: 'data', position: 'bottom' },
          { id: 'left', type: 'data', position: 'left' }
        ]
      }
    },
    {
      id: 'hexagon',
      type: 'shape',
      category: 'Geometric Tools',
      name: 'Hexagon',
      description: 'Six-sided polygon shape',
      icon: Square,
      color: 'bg-yellow-500',
      properties: {
        width: 120,
        height: 100,
        fillColor: 'transparent',
        strokeColor: '#ffffff',
        strokeWidth: 2,
        text: '',
        fontSize: 14,
        textColor: '#ffffff'
      },
      connectionPoints: {
        input: [
          { id: 'top', type: 'data', position: 'top' },
          { id: 'right', type: 'data', position: 'right' },
          { id: 'bottom', type: 'data', position: 'bottom' },
          { id: 'left', type: 'data', position: 'left' }
        ],
        output: [
          { id: 'top', type: 'data', position: 'top' },
          { id: 'right', type: 'data', position: 'right' },
          { id: 'bottom', type: 'data', position: 'bottom' },
          { id: 'left', type: 'data', position: 'left' }
        ]
      }
    },
    {
      id: 'parallelogram',
      type: 'shape',
      category: 'Geometric Tools',
      name: 'Parallelogram',
      description: 'Slanted rectangle shape',
      icon: Square,
      color: 'bg-cyan-500',
      properties: {
        width: 150,
        height: 80,
        fillColor: 'transparent',
        strokeColor: '#ffffff',
        strokeWidth: 2,
        skewAngle: 20,
        text: '',
        fontSize: 14,
        textColor: '#ffffff'
      },
      connectionPoints: {
        input: [
          { id: 'top', type: 'data', position: 'top' },
          { id: 'right', type: 'data', position: 'right' },
          { id: 'bottom', type: 'data', position: 'bottom' },
          { id: 'left', type: 'data', position: 'left' }
        ],
        output: [
          { id: 'top', type: 'data', position: 'top' },
          { id: 'right', type: 'data', position: 'right' },
          { id: 'bottom', type: 'data', position: 'bottom' },
          { id: 'left', type: 'data', position: 'left' }
        ]
      }
    },
    {
      id: 'trapezoid',
      type: 'shape',
      category: 'Geometric Tools',
      name: 'Trapezoid',
      description: 'Four-sided shape with parallel sides',
      icon: Square,
      color: 'bg-orange-500',
      properties: {
        width: 150,
        height: 80,
        fillColor: 'transparent',
        strokeColor: '#ffffff',
        strokeWidth: 2,
        topWidth: 0.6,
        text: '',
        fontSize: 14,
        textColor: '#ffffff'
      },
      connectionPoints: {
        input: [
          { id: 'top', type: 'data', position: 'top' },
          { id: 'right', type: 'data', position: 'right' },
          { id: 'bottom', type: 'data', position: 'bottom' },
          { id: 'left', type: 'data', position: 'left' }
        ],
        output: [
          { id: 'top', type: 'data', position: 'top' },
          { id: 'right', type: 'data', position: 'right' },
          { id: 'bottom', type: 'data', position: 'bottom' },
          { id: 'left', type: 'data', position: 'left' }
        ]
      }
    },
    {
      id: 'star',
      type: 'shape',
      category: 'Geometric Tools',
      name: 'Star',
      description: 'Star shape with configurable points',
      icon: Square,
      color: 'bg-pink-500',
      properties: {
        width: 120,
        height: 120,
        fillColor: 'transparent',
        strokeColor: '#ffffff',
        strokeWidth: 2,
        points: 5,
        innerRadius: 0.4,
        text: '',
        fontSize: 14,
        textColor: '#ffffff'
      },
      connectionPoints: {
        input: [
          { id: 'top', type: 'data', position: 'top' },
          { id: 'right', type: 'data', position: 'right' },
          { id: 'bottom', type: 'data', position: 'bottom' },
          { id: 'left', type: 'data', position: 'left' }
        ],
        output: [
          { id: 'top', type: 'data', position: 'top' },
          { id: 'right', type: 'data', position: 'right' },
          { id: 'bottom', type: 'data', position: 'bottom' },
          { id: 'left', type: 'data', position: 'left' }
        ]
      }
    },
    {
      id: 'diamond',
      type: 'shape',
      category: 'Geometric Tools',
      name: 'Diamond',
      description: 'Diamond/rhombus shape',
      icon: Square,
      color: 'bg-teal-500',
      properties: {
        width: 120,
        height: 120,
        fillColor: 'transparent',
        strokeColor: '#ffffff',
        strokeWidth: 2,
        text: '',
        fontSize: 14,
        textColor: '#ffffff'
      },
      connectionPoints: {
        input: [
          { id: 'top', type: 'data', position: 'top' },
          { id: 'right', type: 'data', position: 'right' },
          { id: 'bottom', type: 'data', position: 'bottom' },
          { id: 'left', type: 'data', position: 'left' }
        ],
        output: [
          { id: 'top', type: 'data', position: 'top' },
          { id: 'right', type: 'data', position: 'right' },
          { id: 'bottom', type: 'data', position: 'bottom' },
          { id: 'left', type: 'data', position: 'left' }
        ]
      }
    },
    {
      id: 'arrow',
      type: 'shape',
      category: 'Geometric Tools',
      name: 'Arrow',
      description: 'Directional arrow shape',
      icon: MoveRight,
      color: 'bg-indigo-500',
      properties: {
        width: 150,
        height: 60,
        fillColor: '#4a5568',
        strokeColor: '#ffffff',
        strokeWidth: 2,
        text: '',
        fontSize: 14,
        textColor: '#ffffff',
        arrowDirection: 'right',
        arrowStyle: 'single',
        headSize: 20
      },
      connectionPoints: {
        input: [
          { id: 'top', type: 'data', position: 'top' },
          { id: 'right', type: 'data', position: 'right' },
          { id: 'bottom', type: 'data', position: 'bottom' },
          { id: 'left', type: 'data', position: 'left' }
        ],
        output: [
          { id: 'top', type: 'data', position: 'top' },
          { id: 'right', type: 'data', position: 'right' },
          { id: 'bottom', type: 'data', position: 'bottom' },
          { id: 'left', type: 'data', position: 'left' }
        ]
      }
    },
    {
      id: 'cloud',
      type: 'shape',
      category: 'Geometric Tools',
      name: 'Cloud',
      description: 'Cloud shape with editable text and 4 connection points',
      icon: Cloud,
      color: 'bg-sky-500',
      properties: {
        width: 200,
        height: 120,
        fillColor: 'transparent',
        strokeColor: '#ffffff',
        strokeWidth: 2,
        text: '',
        fontSize: 14,
        textColor: '#ffffff',
        textAlign: 'center',
        padding: 12,
        wordWrap: true
      },
      connectionPoints: {
        input: [
          { id: 'top', type: 'data', position: 'top' },
          { id: 'right', type: 'data', position: 'right' },
          { id: 'bottom', type: 'data', position: 'bottom' },
          { id: 'left', type: 'data', position: 'left' }
        ],
        output: [
          { id: 'top', type: 'data', position: 'top' },
          { id: 'right', type: 'data', position: 'right' },
          { id: 'bottom', type: 'data', position: 'bottom' },
          { id: 'left', type: 'data', position: 'left' }
        ]
      }
    },
    {
      id: 'image',
      type: 'image',
      category: 'Media',
      name: 'Image',
      description: 'Upload and display images in your diagram',
      icon: ImageIcon,
      color: 'bg-violet-500',
      properties: {
        imageUrl: '',
        alt: 'Image',
        label: '',
        opacity: 1,
        borderStyle: 'solid',
        borderWidth: 0,
        borderColor: '#000000',
        maintainAspectRatio: true,
        width: 200,
        height: 150
      },
      connectionPoints: {
        input: [
          { id: 'top', type: 'data', position: 'top' },
          { id: 'bottom', type: 'data', position: 'bottom' }
        ],
        output: [
          { id: 'top', type: 'data', position: 'top' },
          { id: 'bottom', type: 'data', position: 'bottom' }
        ]
      }
    },
    {
      id: 'uml-folder',
      type: 'uml',
      category: 'UML',
      name: 'UML Diagrams',
      description: 'Create and manage PlantUML diagrams',
      icon: Folder,
      color: 'bg-purple-600',
      properties: {
        diagramType: 'folder',
        folderName: 'UML Diagrams',
        description: 'PlantUML sequence diagrams and more'
      },
      connectionPoints: {
        input: [],
        output: []
      }
    }
  ];
  
  // Combine original and additional components
  const allComponentTemplates = [...componentTemplates, ...additionalComponents];

  const filteredComponents = allComponentTemplates.filter(component => {
    const matchesSearch = component.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         component.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || component.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const groupedComponents = filteredComponents.reduce((acc, component) => {
    // Group text, line, shape, container, roundedRectangle, rectangle, and image types under "tools"
    const groupType = ['text', 'line', 'shape', 'container', 'roundedRectangle', 'rectangle', 'image'].includes(component.type) ? 'tools' : component.type;
    if (!acc[groupType]) acc[groupType] = [];
    acc[groupType].push(component);
    return acc;
  }, {} as Record<string, ComponentTemplate[]>);

  // Check if content is scrollable and update scroll indicators
  const checkScrollability = (type: string) => {
    const container = scrollRefs.current[type];
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const canScrollUp = scrollTop > 0;
    const canScrollDown = scrollTop + clientHeight < scrollHeight - 5; // 5px threshold


    setScrollStates(prev => ({
      ...prev,
      [type]: { canScrollUp, canScrollDown }
    }));
  };

  // Handle scroll events
  const handleScroll = (type: string) => {
    checkScrollability(type);
  };

  // Smooth scroll function
  const scrollToDirection = (type: string, direction: 'up' | 'down') => {
    const container = scrollRefs.current[type];
    if (!container) return;

    const scrollAmount = 200; // Scroll 200px at a time
    const targetScroll = direction === 'up' 
      ? container.scrollTop - scrollAmount 
      : container.scrollTop + scrollAmount;

    container.scrollTo({
      top: targetScroll,
      behavior: 'smooth'
    });
  };

  // Check scrollability on mount and when content changes
  useEffect(() => {
    // Small delay to ensure DOM is fully rendered
    const timer = setTimeout(() => {
      Object.keys(scrollRefs.current).forEach(type => {
        checkScrollability(type);
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [filteredComponents, selectedCategory]);

  // Check scrollability when active tab changes
  useEffect(() => {
    const timer = setTimeout(() => {
      checkScrollability(activeTab);
    }, 50);

    return () => clearTimeout(timer);
  }, [activeTab]);

  // Use ResizeObserver to detect when content size changes
  useEffect(() => {
    const observers: ResizeObserver[] = [];

    Object.entries(scrollRefs.current).forEach(([type, element]) => {
      if (element) {
        const observer = new ResizeObserver(() => {
          checkScrollability(type);
        });
        observer.observe(element);
        observers.push(observer);
      }
    });

    return () => {
      observers.forEach(observer => observer.disconnect());
    };
  }, []);

  const handleDragStart = (event: React.DragEvent, component: ComponentTemplate) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(component));
    event.dataTransfer.effectAllowed = 'move';
  };

  const ComponentCard = ({ component }: { component: ComponentTemplate }) => {
    const Icon = component.icon;
    
    return (
      <Card 
        className="cursor-grab active:cursor-grabbing hover:shadow-lg transition-all duration-200 bg-gray-800 border-gray-700 hover:border-gray-600"
        draggable
        onDragStart={(e) => handleDragStart(e, component)}
        onClick={() => onComponentSelect(component)}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${component.color} text-white`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-sm text-white truncate">{component.name}</CardTitle>
              <Badge variant="outline" className="text-xs mt-1 text-gray-400 border-gray-600">
                {component.category}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-xs text-gray-400 line-clamp-2">{component.description}</p>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="w-80 h-full bg-gray-900 border-r border-gray-700 flex flex-col overflow-hidden">
      <div className="p-4 border-b border-gray-700 flex-shrink-0">
        <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <GitBranch className="h-5 w-5 text-blue-500" />
          Component Library
          <Badge variant="outline" className="text-xs border-gray-600 text-gray-400 ml-auto">
            {filteredComponents.length} items
          </Badge>
        </h2>
        
        <Input
          placeholder="Search components..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mb-3 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
        />

        <div className="flex flex-wrap gap-1">
          {categories.map(category => (
            <Badge
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              className={`cursor-pointer text-xs ${
                selectedCategory === category 
                  ? "bg-blue-600 text-white" 
                  : "text-gray-400 border-gray-600 hover:bg-gray-700"
              }`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-5 bg-gray-800 mx-4 mt-4 mb-2 flex-shrink-0" style={{ width: 'calc(100% - 2rem)' }}>
            <TabsTrigger value="interface" className="text-xs">Interfaces</TabsTrigger>
            <TabsTrigger value="application" className="text-xs">Apps</TabsTrigger>
            <TabsTrigger value="process" className="text-xs">Process</TabsTrigger>
            <TabsTrigger value="tools" className="text-xs">Tools</TabsTrigger>
            <TabsTrigger value="uml" className="text-xs">UML</TabsTrigger>
          </TabsList>
          
          <div className="flex-1 overflow-hidden min-h-0">
            {Object.entries(groupedComponents).map(([type, components]) => (
              <TabsContent key={type} value={type} className="h-full relative">
                  {/* Custom scrollable container without visible scrollbar */}
                  <div 
                    ref={el => scrollRefs.current[type] = el}
                    className="absolute inset-0 overflow-y-auto no-scrollbar"
                    onScroll={() => handleScroll(type)}
                    style={{
                      scrollbarWidth: 'none', // Firefox
                      msOverflowStyle: 'none', // IE and Edge
                    }}
                  >
                    <div className="px-4 py-2 space-y-2">
                      {components.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <p className="text-sm">No components in this category</p>
                        </div>
                      ) : (
                        <>
                          {components.map((component, index) => (
                            <div key={component.id} className="relative">
                              <ComponentCard component={component} />
                              {index < components.length - 1 && (
                                <div className="h-2" />
                              )}
                            </div>
                          ))}
                          {/* Bottom padding to ensure last item is fully visible */}
                          <div className="h-8" />
                        </>
                      )}
                    </div>
                  </div>
                  
                {/* Scroll Indicators - moved outside the display:contents div */}
                {/* Top scroll indicator */}
                {scrollStates[type]?.canScrollUp && (
                  <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none">
                    <div className="h-12 bg-gradient-to-b from-gray-900 to-transparent" />
                    <button
                      onClick={() => scrollToDirection(type, 'up')}
                      className="absolute top-2 left-1/2 transform -translate-x-1/2 pointer-events-auto
                               bg-gray-800 hover:bg-gray-700 text-white rounded-full p-1 
                               shadow-lg transition-all duration-200 hover:scale-110"
                      title="Scroll up"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                  </div>
                )}
                
                {/* Bottom scroll indicator */}
                {scrollStates[type]?.canScrollDown && (
                  <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none">
                    <div className="h-12 bg-gradient-to-t from-gray-900 to-transparent" />
                    <button
                      onClick={() => scrollToDirection(type, 'down')}
                      className="absolute bottom-2 left-1/2 transform -translate-x-1/2 pointer-events-auto
                               bg-gray-800 hover:bg-gray-700 text-white rounded-full p-1 
                               shadow-lg transition-all duration-200 hover:scale-110"
                      title="Scroll down"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </TabsContent>
            ))}
          </div>
        </Tabs>
      </div>

      <div className="p-4 border-t border-gray-700 bg-gray-800/50">
        <div className="text-xs text-gray-400 text-center">
          💡 Drag components to canvas or click to select
        </div>
      </div>
    </div>
  );
}