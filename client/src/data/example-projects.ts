import { Node, Edge } from 'reactflow';

export interface InterfaceProject {
  id: string;
  name: string;
  description: string;
  category: 'E-commerce' | 'Banking' | 'Healthcare' | 'Manufacturing' | 'Custom' | 'ecommerce' | 'finance' | 'blog' | 'enterprise' | 'custom';
  version?: string;
  createdAt: string;
  updatedAt?: string;
  nodes: Node[];
  edges: Edge[];
  metadata: {
    version?: string;
    author?: string;
    nodeCount: number;
    edgeCount: number;
    complexity: 'Simple' | 'Medium' | 'Complex';
    tags: string[];
  };
  isTeamProject?: boolean;
}

export const exampleProjects: InterfaceProject[] = [
  {
    id: 'ecommerce-platform',
    name: 'E-commerce Platform Architecture',
    description: 'Complete e-commerce system with web frontend, mobile app, payment processing, and inventory management',
    category: 'E-commerce',
    version: '1.0',
    createdAt: '2024-01-15T10:00:00Z',
    metadata: {
      nodeCount: 12,
      edgeCount: 15,
      complexity: 'Complex',
      tags: ['microservices', 'api-gateway', 'database', 'payment', 'mobile']
    },
    nodes: [
      {
        id: 'web-app-1',
        type: 'application',
        position: { x: 100, y: 100 },
        data: {
          id: 'web-application',
          name: 'E-commerce Web App',
          description: 'Customer-facing web application',
          color: 'bg-blue-600',
          type: 'web-application',
          properties: {
            framework: 'React',
            hosting: 'AWS CloudFront',
            authentication: 'OAuth 2.0',
            responsive: true
          },
          connectionPoints: {
            input: [{ id: 'user-requests', type: 'http', position: 'bottom' }],
            output: [{ id: 'api-calls', type: 'http', position: 'right' }]
          },
          isConfigured: true,
          status: 'active',
          metrics: {
            uptime: 99.8,
            responseTime: 120,
            throughput: 1500
          }
        },
        dragHandle: '.drag-handle'
      },
      {
        id: 'mobile-app-1',
        type: 'application',
        position: { x: 100, y: 300 },
        data: {
          id: 'mobile-app',
          name: 'E-commerce Mobile App',
          description: 'iOS/Android mobile application',
          color: 'bg-purple-600',
          type: 'mobile-app',
          properties: {
            platform: 'iOS/Android',
            framework: 'React Native',
            offline: true,
            pushNotifications: true
          },
          connectionPoints: {
            input: [{ id: 'user-actions', type: 'event', position: 'bottom' }],
            output: [{ id: 'api-calls', type: 'http', position: 'right' }]
          },
          isConfigured: true,
          status: 'active',
          metrics: {
            uptime: 99.5,
            responseTime: 200,
            throughput: 800
          }
        },
        dragHandle: '.drag-handle'
      },
      {
        id: 'api-gateway-1',
        type: 'interface',
        position: { x: 400, y: 200 },
        data: {
          id: 'rest-api',
          name: 'API Gateway',
          description: 'Central API gateway for all services',
          color: 'bg-blue-500',
          type: 'rest-api',
          properties: {
            method: 'ALL',
            endpoint: '/api/v1/*',
            contentType: 'application/json',
            authentication: 'JWT Bearer'
          },
          connectionPoints: {
            input: [{ id: 'client-requests', type: 'http', position: 'left' }],
            output: [{ id: 'service-calls', type: 'http', position: 'right' }]
          },
          isConfigured: true,
          status: 'active'
        },
        dragHandle: '.drag-handle'
      },
      {
        id: 'user-service-1',
        type: 'application',
        position: { x: 700, y: 50 },
        data: {
          id: 'api-service',
          name: 'User Service',
          description: 'User authentication and profile management',
          color: 'bg-green-600',
          type: 'api-service',
          properties: {
            runtime: 'Node.js',
            framework: 'Express',
            deployment: 'Docker',
            scaling: 'Horizontal'
          },
          connectionPoints: {
            input: [{ id: 'api-requests', type: 'http', position: 'left' }],
            output: [{ id: 'db-queries', type: 'sql', position: 'bottom' }]
          },
          isConfigured: true,
          status: 'active',
          metrics: {
            uptime: 99.9,
            responseTime: 80,
            throughput: 2000
          }
        },
        dragHandle: '.drag-handle'
      },
      {
        id: 'product-service-1',
        type: 'application',
        position: { x: 700, y: 200 },
        data: {
          id: 'api-service',
          name: 'Product Service',
          description: 'Product catalog and inventory management',
          color: 'bg-green-600',
          type: 'api-service',
          properties: {
            runtime: 'Java',
            framework: 'Spring Boot',
            deployment: 'Kubernetes',
            scaling: 'Horizontal'
          },
          connectionPoints: {
            input: [{ id: 'api-requests', type: 'http', position: 'left' }],
            output: [{ id: 'db-queries', type: 'sql', position: 'bottom' }]
          },
          isConfigured: true,
          status: 'active',
          metrics: {
            uptime: 99.7,
            responseTime: 95,
            throughput: 1200
          }
        },
        dragHandle: '.drag-handle'
      },
      {
        id: 'order-service-1',
        type: 'application',
        position: { x: 700, y: 350 },
        data: {
          id: 'api-service',
          name: 'Order Service',
          description: 'Order processing and management',
          color: 'bg-green-600',
          type: 'api-service',
          properties: {
            runtime: 'Python',
            framework: 'FastAPI',
            deployment: 'Docker',
            scaling: 'Vertical'
          },
          connectionPoints: {
            input: [{ id: 'api-requests', type: 'http', position: 'left' }],
            output: [
              { id: 'db-queries', type: 'sql', position: 'bottom' },
              { id: 'payment-requests', type: 'http', position: 'right' }
            ]
          },
          isConfigured: true,
          status: 'active',
          metrics: {
            uptime: 99.6,
            responseTime: 150,
            throughput: 500
          }
        },
        dragHandle: '.drag-handle'
      },
      {
        id: 'payment-gateway-1',
        type: 'application',
        position: { x: 1000, y: 350 },
        data: {
          id: 'cloud-service',
          name: 'Payment Gateway',
          description: 'Third-party payment processing',
          color: 'bg-blue-400',
          type: 'cloud-service',
          properties: {
            provider: 'Stripe',
            service: 'Payment API',
            region: 'us-east-1',
            sla: '99.95%'
          },
          connectionPoints: {
            input: [{ id: 'payment-requests', type: 'http', position: 'left' }],
            output: [{ id: 'payment-responses', type: 'http', position: 'left' }]
          },
          isConfigured: true,
          status: 'active',
          metrics: {
            uptime: 99.95,
            responseTime: 300,
            throughput: 200
          }
        },
        dragHandle: '.drag-handle'
      },
      {
        id: 'user-db-1',
        type: 'application',
        position: { x: 700, y: 500 },
        data: {
          id: 'database-system',
          name: 'User Database',
          description: 'PostgreSQL database for user data',
          color: 'bg-gray-600',
          type: 'database-system',
          properties: {
            type: 'PostgreSQL',
            version: '15',
            replication: 'Master-Slave',
            backup: 'Daily'
          },
          connectionPoints: {
            input: [{ id: 'queries', type: 'sql', position: 'top' }],
            output: [{ id: 'results', type: 'dataset', position: 'top' }]
          },
          isConfigured: true,
          status: 'active',
          metrics: {
            uptime: 99.9,
            responseTime: 25,
            throughput: 5000
          }
        },
        dragHandle: '.drag-handle'
      },
      {
        id: 'product-db-1',
        type: 'application',
        position: { x: 900, y: 500 },
        data: {
          id: 'database-system',
          name: 'Product Database',
          description: 'MongoDB for product catalog',
          color: 'bg-gray-600',
          type: 'database-system',
          properties: {
            type: 'MongoDB',
            version: '6.0',
            replication: 'Replica Set',
            backup: 'Continuous'
          },
          connectionPoints: {
            input: [{ id: 'queries', type: 'nosql', position: 'top' }],
            output: [{ id: 'results', type: 'dataset', position: 'top' }]
          },
          isConfigured: true,
          status: 'active',
          metrics: {
            uptime: 99.8,
            responseTime: 35,
            throughput: 3000
          }
        },
        dragHandle: '.drag-handle'
      },
      {
        id: 'order-process-1',
        type: 'process',
        position: { x: 100, y: 600 },
        data: {
          id: 'level-a-process',
          name: 'Order Fulfillment Process',
          description: 'End-to-end order processing workflow',
          color: 'bg-indigo-500',
          type: 'level-a-process',
          properties: {
            level: 'A',
            lob: 'E-commerce Operations',
            owner: 'Operations Manager',
            criticality: 'High'
          },
          connectionPoints: {
            input: [{ id: 'order-inputs', type: 'data', position: 'left' }],
            output: [{ id: 'fulfillment-outputs', type: 'data', position: 'right' }]
          },
          isConfigured: true,
          status: 'active',
          metrics: {
            completionRate: 98.5,
            averageTime: 24,
            errorRate: 1.2
          }
        },
        dragHandle: '.drag-handle'
      },
      {
        id: 'inventory-sync-1',
        type: 'interface',
        position: { x: 1100, y: 200 },
        data: {
          id: 'message-queue',
          name: 'Inventory Sync Queue',
          description: 'Real-time inventory updates',
          color: 'bg-orange-500',
          type: 'message-queue',
          properties: {
            queueName: 'inventory.updates',
            protocol: 'AMQP',
            durability: 'persistent',
            routing: 'topic'
          },
          connectionPoints: {
            input: [{ id: 'inventory-updates', type: 'message', position: 'left' }],
            output: [{ id: 'sync-notifications', type: 'message', position: 'right' }]
          },
          isConfigured: true,
          status: 'active'
        },
        dragHandle: '.drag-handle'
      },
      {
        id: 'notification-service-1',
        type: 'application',
        position: { x: 1300, y: 200 },
        data: {
          id: 'api-service',
          name: 'Notification Service',
          description: 'Email and SMS notifications',
          color: 'bg-green-600',
          type: 'api-service',
          properties: {
            runtime: 'Node.js',
            framework: 'Express',
            deployment: 'Serverless',
            scaling: 'Auto'
          },
          connectionPoints: {
            input: [{ id: 'notification-requests', type: 'message', position: 'left' }],
            output: [{ id: 'external-apis', type: 'http', position: 'right' }]
          },
          isConfigured: true,
          status: 'active',
          metrics: {
            uptime: 99.7,
            responseTime: 500,
            throughput: 100
          }
        },
        dragHandle: '.drag-handle'
      }
    ],
    edges: [
      {
        id: 'web-to-gateway',
        source: 'web-app-1',
        target: 'api-gateway-1',
        sourceHandle: 'api-calls',
        targetHandle: 'client-requests',
        type: 'smoothstep',
        data: {
          connectionType: 'HTTP Request',
          dataFlow: 'bidirectional',
          protocol: 'HTTPS',
          security: 'encrypted',
          bandwidth: '100 Mbps',
          latency: 50
        },
        style: { stroke: '#3b82f6', strokeWidth: 2 },
        animated: true
      },
      {
        id: 'mobile-to-gateway',
        source: 'mobile-app-1',
        target: 'api-gateway-1',
        sourceHandle: 'api-calls',
        targetHandle: 'client-requests',
        type: 'smoothstep',
        data: {
          connectionType: 'API Call',
          dataFlow: 'bidirectional',
          protocol: 'HTTPS',
          security: 'encrypted',
          bandwidth: '50 Mbps',
          latency: 80
        },
        style: { stroke: '#8b5cf6', strokeWidth: 2 },
        animated: true
      },
      {
        id: 'gateway-to-user-service',
        source: 'api-gateway-1',
        target: 'user-service-1',
        sourceHandle: 'service-calls',
        targetHandle: 'api-requests',
        type: 'smoothstep',
        data: {
          connectionType: 'Service Call',
          dataFlow: 'bidirectional',
          protocol: 'HTTP',
          latency: 20,
          throughput: 2000
        },
        style: { stroke: '#10b981', strokeWidth: 2 },
        animated: true
      },
      {
        id: 'gateway-to-product-service',
        source: 'api-gateway-1',
        target: 'product-service-1',
        sourceHandle: 'service-calls',
        targetHandle: 'api-requests',
        type: 'smoothstep',
        data: {
          connectionType: 'Service Call',
          dataFlow: 'bidirectional',
          protocol: 'HTTP',
          latency: 25,
          throughput: 1200
        },
        style: { stroke: '#10b981', strokeWidth: 2 },
        animated: true
      },
      {
        id: 'gateway-to-order-service',
        source: 'api-gateway-1',
        target: 'order-service-1',
        sourceHandle: 'service-calls',
        targetHandle: 'api-requests',
        type: 'smoothstep',
        data: {
          connectionType: 'Service Call',
          dataFlow: 'bidirectional',
          protocol: 'HTTP',
          latency: 30,
          throughput: 500
        },
        style: { stroke: '#10b981', strokeWidth: 2 },
        animated: true
      },
      {
        id: 'user-service-to-db',
        source: 'user-service-1',
        target: 'user-db-1',
        sourceHandle: 'db-queries',
        targetHandle: 'queries',
        type: 'smoothstep',
        data: {
          connectionType: 'Database Query',
          dataFlow: 'bidirectional',
          protocol: 'PostgreSQL',
          latency: 15,
          throughput: 5000
        },
        style: { stroke: '#6b7280', strokeWidth: 2 },
        animated: true
      },
      {
        id: 'product-service-to-db',
        source: 'product-service-1',
        target: 'product-db-1',
        sourceHandle: 'db-queries',
        targetHandle: 'queries',
        type: 'smoothstep',
        data: {
          connectionType: 'Database Query',
          dataFlow: 'bidirectional',
          protocol: 'MongoDB',
          latency: 20,
          throughput: 3000
        },
        style: { stroke: '#6b7280', strokeWidth: 2 },
        animated: true
      },
      {
        id: 'order-service-to-payment',
        source: 'order-service-1',
        target: 'payment-gateway-1',
        sourceHandle: 'payment-requests',
        targetHandle: 'payment-requests',
        type: 'smoothstep',
        data: {
          connectionType: 'Payment Request',
          dataFlow: 'bidirectional',
          protocol: 'HTTPS',
          security: 'encrypted',
          latency: 200,
          throughput: 200
        },
        style: { stroke: '#3b82f6', strokeWidth: 2 },
        animated: true
      },
      {
        id: 'product-service-to-queue',
        source: 'product-service-1',
        target: 'inventory-sync-1',
        sourceHandle: 'inventory-updates',
        targetHandle: 'inventory-updates',
        type: 'smoothstep',
        data: {
          connectionType: 'Message',
          dataFlow: 'unidirectional',
          protocol: 'AMQP',
          latency: 10,
          throughput: 1000
        },
        style: { stroke: '#f59e0b', strokeWidth: 2 },
        animated: true
      },
      {
        id: 'queue-to-notification',
        source: 'inventory-sync-1',
        target: 'notification-service-1',
        sourceHandle: 'sync-notifications',
        targetHandle: 'notification-requests',
        type: 'smoothstep',
        data: {
          connectionType: 'Message',
          dataFlow: 'unidirectional',
          protocol: 'AMQP',
          latency: 15,
          throughput: 100
        },
        style: { stroke: '#f59e0b', strokeWidth: 2 },
        animated: true
      }
    ]
  },
  {
    id: 'banking-core',
    name: 'Banking Core System',
    description: 'Modern banking architecture with account management, transactions, and compliance',
    category: 'Banking',
    version: '2.1',
    createdAt: '2024-01-20T14:30:00Z',
    metadata: {
      nodeCount: 8,
      edgeCount: 10,
      complexity: 'Complex',
      tags: ['banking', 'compliance', 'security', 'transactions']
    },
    nodes: [
      {
        id: 'banking-web-1',
        type: 'application',
        position: { x: 100, y: 150 },
        data: {
          id: 'web-application',
          name: 'Online Banking Portal',
          description: 'Customer web banking interface',
          color: 'bg-blue-600',
          type: 'web-application',
          properties: {
            framework: 'Angular',
            hosting: 'Azure CDN',
            authentication: 'Multi-Factor',
            responsive: true
          },
          connectionPoints: {
            input: [{ id: 'user-requests', type: 'http', position: 'bottom' }],
            output: [{ id: 'api-calls', type: 'http', position: 'right' }]
          },
          isConfigured: true,
          status: 'active',
          metrics: {
            uptime: 99.99,
            responseTime: 80,
            throughput: 5000
          }
        },
        dragHandle: '.drag-handle'
      },
      {
        id: 'core-banking-api',
        type: 'interface',
        position: { x: 400, y: 150 },
        data: {
          id: 'rest-api',
          name: 'Core Banking API',
          description: 'Secure banking operations API',
          color: 'bg-blue-500',
          type: 'rest-api',
          properties: {
            method: 'ALL',
            endpoint: '/banking/v2/*',
            contentType: 'application/json',
            authentication: 'OAuth 2.0 + TLS'
          },
          connectionPoints: {
            input: [{ id: 'client-requests', type: 'http', position: 'left' }],
            output: [{ id: 'core-services', type: 'http', position: 'right' }]
          },
          isConfigured: true,
          status: 'active'
        },
        dragHandle: '.drag-handle'
      },
      {
        id: 'account-service',
        type: 'application',
        position: { x: 700, y: 50 },
        data: {
          id: 'api-service',
          name: 'Account Service',
          description: 'Account management and balance queries',
          color: 'bg-green-600',
          type: 'api-service',
          properties: {
            runtime: 'Java',
            framework: 'Spring Boot',
            deployment: 'Kubernetes',
            scaling: 'Horizontal'
          },
          connectionPoints: {
            input: [{ id: 'account-requests', type: 'http', position: 'left' }],
            output: [{ id: 'db-operations', type: 'sql', position: 'bottom' }]
          },
          isConfigured: true,
          status: 'active',
          metrics: {
            uptime: 99.95,
            responseTime: 45,
            throughput: 10000
          }
        },
        dragHandle: '.drag-handle'
      },
      {
        id: 'transaction-service',
        type: 'application',
        position: { x: 700, y: 250 },
        data: {
          id: 'api-service',
          name: 'Transaction Service',
          description: 'Payment processing and transfers',
          color: 'bg-green-600',
          type: 'api-service',
          properties: {
            runtime: 'C#',
            framework: '.NET Core',
            deployment: 'Docker',
            scaling: 'Vertical'
          },
          connectionPoints: {
            input: [{ id: 'transaction-requests', type: 'http', position: 'left' }],
            output: [
              { id: 'db-operations', type: 'sql', position: 'bottom' },
              { id: 'compliance-events', type: 'message', position: 'right' }
            ]
          },
          isConfigured: true,
          status: 'active',
          metrics: {
            uptime: 99.98,
            responseTime: 100,
            throughput: 2000
          }
        },
        dragHandle: '.drag-handle'
      },
      {
        id: 'core-banking-db',
        type: 'application',
        position: { x: 700, y: 450 },
        data: {
          id: 'database-system',
          name: 'Core Banking Database',
          description: 'Oracle database for banking data',
          color: 'bg-gray-600',
          type: 'database-system',
          properties: {
            type: 'Oracle',
            version: '21c',
            replication: 'Active-Passive',
            backup: 'Real-time'
          },
          connectionPoints: {
            input: [{ id: 'banking-queries', type: 'sql', position: 'top' }],
            output: [{ id: 'banking-data', type: 'dataset', position: 'top' }]
          },
          isConfigured: true,
          status: 'active',
          metrics: {
            uptime: 99.99,
            responseTime: 15,
            throughput: 15000
          }
        },
        dragHandle: '.drag-handle'
      },
      {
        id: 'compliance-queue',
        type: 'interface',
        position: { x: 1000, y: 250 },
        data: {
          id: 'message-queue',
          name: 'Compliance Queue',
          description: 'Regulatory compliance event stream',
          color: 'bg-orange-500',
          type: 'message-queue',
          properties: {
            queueName: 'compliance.events',
            protocol: 'Kafka',
            durability: 'persistent',
            routing: 'partitioned'
          },
          connectionPoints: {
            input: [{ id: 'compliance-events', type: 'message', position: 'left' }],
            output: [{ id: 'audit-stream', type: 'message', position: 'right' }]
          },
          isConfigured: true,
          status: 'active'
        },
        dragHandle: '.drag-handle'
      },
      {
        id: 'compliance-service',
        type: 'application',
        position: { x: 1300, y: 250 },
        data: {
          id: 'api-service',
          name: 'Compliance Service',
          description: 'AML and regulatory compliance monitoring',
          color: 'bg-green-600',
          type: 'api-service',
          properties: {
            runtime: 'Python',
            framework: 'Django',
            deployment: 'VM',
            scaling: 'Manual'
          },
          connectionPoints: {
            input: [{ id: 'audit-events', type: 'message', position: 'left' }],
            output: [{ id: 'compliance-reports', type: 'file', position: 'bottom' }]
          },
          isConfigured: true,
          status: 'active',
          metrics: {
            uptime: 99.9,
            responseTime: 1000,
            throughput: 50
          }
        },
        dragHandle: '.drag-handle'
      },
      {
        id: 'kyc-process',
        type: 'process',
        position: { x: 100, y: 400 },
        data: {
          id: 'level-a-process',
          name: 'KYC Verification Process',
          description: 'Customer identity verification workflow',
          color: 'bg-indigo-500',
          type: 'level-a-process',
          properties: {
            level: 'A',
            lob: 'Risk Management',
            owner: 'Compliance Officer',
            criticality: 'High'
          },
          connectionPoints: {
            input: [{ id: 'customer-data', type: 'data', position: 'left' }],
            output: [{ id: 'verification-result', type: 'data', position: 'right' }]
          },
          isConfigured: true,
          status: 'active',
          metrics: {
            completionRate: 96.8,
            averageTime: 72,
            errorRate: 2.1
          }
        },
        dragHandle: '.drag-handle'
      }
    ],
    edges: [
      {
        id: 'web-to-api',
        source: 'banking-web-1',
        target: 'core-banking-api',
        type: 'smoothstep',
        data: {
          connectionType: 'HTTPS Request',
          dataFlow: 'bidirectional',
          protocol: 'HTTPS',
          security: 'encrypted',
          latency: 30
        },
        style: { stroke: '#3b82f6', strokeWidth: 2 },
        animated: true
      },
      {
        id: 'api-to-account',
        source: 'core-banking-api',
        target: 'account-service',
        type: 'smoothstep',
        data: {
          connectionType: 'Service Call',
          dataFlow: 'bidirectional',
          protocol: 'HTTPS',
          latency: 15
        },
        style: { stroke: '#10b981', strokeWidth: 2 },
        animated: true
      },
      {
        id: 'api-to-transaction',
        source: 'core-banking-api',
        target: 'transaction-service',
        type: 'smoothstep',
        data: {
          connectionType: 'Service Call',
          dataFlow: 'bidirectional',
          protocol: 'HTTPS',
          latency: 20
        },
        style: { stroke: '#10b981', strokeWidth: 2 },
        animated: true
      },
      {
        id: 'account-to-db',
        source: 'account-service',
        target: 'core-banking-db',
        type: 'smoothstep',
        data: {
          connectionType: 'Database Query',
          dataFlow: 'bidirectional',
          protocol: 'Oracle SQL',
          latency: 8
        },
        style: { stroke: '#6b7280', strokeWidth: 2 },
        animated: true
      },
      {
        id: 'transaction-to-db',
        source: 'transaction-service',
        target: 'core-banking-db',
        type: 'smoothstep',
        data: {
          connectionType: 'Database Query',
          dataFlow: 'bidirectional',
          protocol: 'Oracle SQL',
          latency: 10
        },
        style: { stroke: '#6b7280', strokeWidth: 2 },
        animated: true
      },
      {
        id: 'transaction-to-compliance',
        source: 'transaction-service',
        target: 'compliance-queue',
        type: 'smoothstep',
        data: {
          connectionType: 'Compliance Event',
          dataFlow: 'unidirectional',
          protocol: 'Kafka',
          latency: 5
        },
        style: { stroke: '#f59e0b', strokeWidth: 2 },
        animated: true
      },
      {
        id: 'compliance-queue-to-service',
        source: 'compliance-queue',
        target: 'compliance-service',
        type: 'smoothstep',
        data: {
          connectionType: 'Audit Stream',
          dataFlow: 'unidirectional',
          protocol: 'Kafka',
          latency: 5
        },
        style: { stroke: '#f59e0b', strokeWidth: 2 },
        animated: true
      }
    ]
  },
  {
    id: 'simple-blog',
    name: 'Simple Blog Platform',
    description: 'Basic blog platform with content management and user comments',
    category: 'Custom',
    version: '1.0',
    createdAt: '2024-01-25T09:15:00Z',
    metadata: {
      nodeCount: 5,
      edgeCount: 4,
      complexity: 'Simple',
      tags: ['blog', 'cms', 'simple', 'web']
    },
    nodes: [
      {
        id: 'blog-frontend',
        type: 'application',
        position: { x: 200, y: 100 },
        data: {
          id: 'web-application',
          name: 'Blog Frontend',
          description: 'Public blog interface',
          color: 'bg-blue-600',
          type: 'web-application',
          properties: {
            framework: 'Next.js',
            hosting: 'Vercel',
            authentication: 'NextAuth',
            responsive: true
          },
          connectionPoints: {
            input: [{ id: 'user-requests', type: 'http', position: 'bottom' }],
            output: [{ id: 'api-calls', type: 'http', position: 'right' }]
          },
          isConfigured: true,
          status: 'active',
          metrics: {
            uptime: 99.5,
            responseTime: 200,
            throughput: 100
          }
        },
        dragHandle: '.drag-handle'
      },
      {
        id: 'blog-api',
        type: 'application',
        position: { x: 500, y: 100 },
        data: {
          id: 'api-service',
          name: 'Blog API',
          description: 'Content management API',
          color: 'bg-green-600',
          type: 'api-service',
          properties: {
            runtime: 'Node.js',
            framework: 'Express',
            deployment: 'Heroku',
            scaling: 'Vertical'
          },
          connectionPoints: {
            input: [{ id: 'api-requests', type: 'http', position: 'left' }],
            output: [{ id: 'db-queries', type: 'sql', position: 'bottom' }]
          },
          isConfigured: true,
          status: 'active',
          metrics: {
            uptime: 99.2,
            responseTime: 150,
            throughput: 200
          }
        },
        dragHandle: '.drag-handle'
      },
      {
        id: 'blog-database',
        type: 'application',
        position: { x: 500, y: 300 },
        data: {
          id: 'database-system',
          name: 'Blog Database',
          description: 'SQLite database for content',
          color: 'bg-gray-600',
          type: 'database-system',
          properties: {
            type: 'SQLite',
            version: '3.39',
            replication: 'None',
            backup: 'Daily'
          },
          connectionPoints: {
            input: [{ id: 'queries', type: 'sql', position: 'top' }],
            output: [{ id: 'results', type: 'dataset', position: 'top' }]
          },
          isConfigured: true,
          status: 'active',
          metrics: {
            uptime: 99.8,
            responseTime: 10,
            throughput: 500
          }
        },
        dragHandle: '.drag-handle'
      },
      {
        id: 'content-process',
        type: 'process',
        position: { x: 200, y: 400 },
        data: {
          id: 'level-b-process',
          name: 'Content Publishing',
          description: 'Blog post creation and publishing workflow',
          color: 'bg-purple-400',
          type: 'level-b-process',
          properties: {
            level: 'B',
            parent: 'Content Management',
            sequence: 1,
            automation: 'Partial'
          },
          connectionPoints: {
            input: [{ id: 'content-input', type: 'data', position: 'left' }],
            output: [{ id: 'published-content', type: 'data', position: 'right' }]
          },
          isConfigured: true,
          status: 'active',
          metrics: {
            completionRate: 94.2,
            averageTime: 2,
            errorRate: 1.8
          }
        },
        dragHandle: '.drag-handle'
      }
    ],
    edges: [
      {
        id: 'frontend-to-api',
        source: 'blog-frontend',
        target: 'blog-api',
        type: 'smoothstep',
        data: {
          connectionType: 'API Call',
          dataFlow: 'bidirectional',
          protocol: 'HTTPS',
          latency: 80
        },
        style: { stroke: '#3b82f6', strokeWidth: 2 },
        animated: true
      },
      {
        id: 'api-to-database',
        source: 'blog-api',
        target: 'blog-database',
        type: 'smoothstep',
        data: {
          connectionType: 'Database Query',
          dataFlow: 'bidirectional',
          protocol: 'SQLite',
          latency: 5
        },
        style: { stroke: '#6b7280', strokeWidth: 2 },
        animated: true
      }
    ]
  }
];

export const createEmptyProject = (): Omit<InterfaceProject, 'id' | 'createdAt'> => ({
  name: 'New Project',
  description: 'A new interface design project',
  category: 'Custom',
  version: '1.0',
  nodes: [],
  edges: [],
  metadata: {
    nodeCount: 0,
    edgeCount: 0,
    complexity: 'Simple',
    tags: []
  }
});