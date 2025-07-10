import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import crypto from "crypto";
import { 
  users,
  applications, 
  interfaces, 
  businessProcesses,
  businessProcessInterfaces,
  changeRequests,
  changeRequestApplications,
  changeRequestInterfaces,
  conversations,
  conversationLinks,
  conversationParticipants,
  communicationComments,
  communicationMentions,
  communicationAttachments,
  interfaceComments,
  interfaceVersions,
  interfaceConsumerDescriptions,
  imlDiagrams
} from "../shared/schema";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/aml_iml",
});

const db = drizzle(pool);

async function cleanDatabase() {
  console.log("🧹 Cleaning database...");
  
  // Delete in correct order to respect foreign key constraints
  await db.delete(communicationMentions);
  await db.delete(communicationAttachments);
  await db.delete(communicationComments);
  await db.delete(conversationParticipants);
  await db.delete(conversationLinks);
  await db.delete(conversations);
  
  await db.delete(imlDiagrams);
  await db.delete(interfaceConsumerDescriptions);
  await db.delete(interfaceVersions);
  await db.delete(interfaceComments);
  await db.delete(businessProcessInterfaces);
  
  await db.delete(changeRequestInterfaces);
  await db.delete(changeRequestApplications);
  await db.delete(changeRequests);
  
  await db.delete(interfaces);
  await db.delete(businessProcesses);
  await db.delete(applications);
  await db.delete(users);
  
  console.log("✓ Database cleaned");
}

async function seedRealisticData() {
  try {
    await cleanDatabase();
    
    console.log("🌱 Starting to seed realistic data...");

    // Create users - Using same hash method as auth.ts
    const hashPassword = (password: string): string => {
      return crypto.createHash('sha256').update(password).digest('hex');
    };
    
    const usersData = [
      { username: "admin", email: "admin@company.com", passwordHash: hashPassword("admin123"), name: "System Administrator", role: "admin" },
      { username: "john.architect", email: "john.architect@company.com", passwordHash: hashPassword("password123"), name: "John Smith", role: "architect" },
      { username: "sarah.pm", email: "sarah.pm@company.com", passwordHash: hashPassword("password123"), name: "Sarah Johnson", role: "pm" },
      { username: "mike.dev", email: "mike.dev@company.com", passwordHash: hashPassword("password123"), name: "Mike Chen", role: "developer" },
      { username: "lisa.test", email: "lisa.test@company.com", passwordHash: hashPassword("password123"), name: "Lisa Anderson", role: "tester" },
      { username: "david.analyst", email: "david.analyst@company.com", passwordHash: hashPassword("password123"), name: "David Brown", role: "analyst" }
    ];

    await db.insert(users).values(usersData);
    console.log("✓ Created users");

    // Create 20 realistic applications
    const applicationsData = [
      // Core Business Systems
      {
        amlNumber: "AML-2020-001",
        name: "Customer Relationship Management",
        description: "Central CRM system managing all customer interactions, sales pipelines, and support tickets",
        lob: "Sales & Marketing",
        os: "Linux",
        deployment: "cloud",
        uptime: "99.95",
        purpose: "Manage customer relationships, track sales opportunities, and provide customer support",
        providesExtInterface: true,
        provInterfaceType: "REST API",
        consumesExtInterfaces: true,
        consInterfaceType: "REST, SOAP",
        status: "active",
        firstActiveDate: new Date("2020-01-15"),
        lastChangeDate: new Date("2024-11-20")
      },
      {
        amlNumber: "AML-2018-001",
        name: "Enterprise Resource Planning",
        description: "Core ERP system handling finance, HR, procurement, and supply chain management",
        lob: "Corporate Services",
        os: "Windows Server",
        deployment: "on-premise",
        uptime: "99.90",
        purpose: "Integrate and manage core business processes across the organization",
        providesExtInterface: true,
        provInterfaceType: "SOAP, Database",
        consumesExtInterfaces: true,
        consInterfaceType: "REST, File",
        status: "active",
        firstActiveDate: new Date("2018-06-01"),
        lastChangeDate: new Date("2024-10-15")
      },
      {
        amlNumber: "AML-2021-001",
        name: "E-Commerce Platform",
        description: "Online shopping platform with product catalog, cart, and checkout functionality",
        lob: "Digital Commerce",
        os: "Linux",
        deployment: "cloud",
        uptime: "99.99",
        purpose: "Enable online sales, manage product catalog, and process customer orders",
        providesExtInterface: true,
        provInterfaceType: "GraphQL, REST",
        consumesExtInterfaces: true,
        consInterfaceType: "REST, Messaging",
        status: "active",
        firstActiveDate: new Date("2021-03-10"),
        lastChangeDate: new Date("2024-12-01")
      },
      
      // Financial Systems
      {
        amlNumber: "AML-2019-001",
        name: "Payment Gateway",
        description: "Secure payment processing system supporting multiple payment methods",
        lob: "Finance",
        os: "Linux",
        deployment: "cloud",
        uptime: "99.99",
        purpose: "Process credit card payments, handle refunds, and manage recurring billing",
        providesExtInterface: true,
        provInterfaceType: "REST API",
        consumesExtInterfaces: true,
        consInterfaceType: "REST",
        status: "active",
        firstActiveDate: new Date("2019-11-01"),
        lastChangeDate: new Date("2024-11-25")
      },
      {
        amlNumber: "AML-2019-002",
        name: "Financial Reporting System",
        description: "Comprehensive financial reporting and analytics platform",
        lob: "Finance",
        os: "Windows Server",
        deployment: "on-premise",
        uptime: "99.80",
        purpose: "Generate financial reports, perform analytics, and ensure regulatory compliance",
        providesExtInterface: true,
        provInterfaceType: "REST, File",
        consumesExtInterfaces: true,
        consInterfaceType: "Database, File",
        status: "active",
        firstActiveDate: new Date("2019-01-20"),
        lastChangeDate: new Date("2024-09-30")
      },
      
      // Operations Systems
      {
        amlNumber: "AML-2020-002",
        name: "Inventory Management System",
        description: "Real-time inventory tracking across warehouses and retail locations",
        lob: "Supply Chain",
        os: "Linux",
        deployment: "cloud",
        uptime: "99.85",
        purpose: "Track inventory levels, manage stock movements, and optimize warehouse operations",
        providesExtInterface: true,
        provInterfaceType: "REST, Messaging",
        consumesExtInterfaces: true,
        consInterfaceType: "Messaging, Database",
        status: "active",
        firstActiveDate: new Date("2020-07-15"),
        lastChangeDate: new Date("2024-11-10")
      },
      {
        amlNumber: "AML-2020-003",
        name: "Order Management System",
        description: "End-to-end order processing from placement to fulfillment",
        lob: "Operations",
        os: "Linux",
        deployment: "cloud",
        uptime: "99.92",
        purpose: "Process orders, manage fulfillment, and track shipments",
        providesExtInterface: true,
        provInterfaceType: "SOAP, REST",
        consumesExtInterfaces: true,
        consInterfaceType: "REST, Messaging",
        status: "active",
        firstActiveDate: new Date("2020-09-01"),
        lastChangeDate: new Date("2024-12-05")
      },
      
      // Customer Service
      {
        amlNumber: "AML-2021-002",
        name: "Customer Support Portal",
        description: "Self-service portal for customers to manage accounts and submit tickets",
        lob: "Customer Service",
        os: "Linux",
        deployment: "cloud",
        uptime: "99.88",
        purpose: "Provide self-service capabilities and support ticket management",
        providesExtInterface: false,
        provInterfaceType: null,
        consumesExtInterfaces: true,
        consInterfaceType: "REST API",
        status: "active",
        firstActiveDate: new Date("2021-02-01"),
        lastChangeDate: new Date("2024-10-20")
      },
      {
        amlNumber: "AML-2020-004",
        name: "Contact Center Platform",
        description: "Omnichannel contact center with voice, chat, and email support",
        lob: "Customer Service",
        os: "Windows Server",
        deployment: "cloud",
        uptime: "99.95",
        purpose: "Handle customer interactions across multiple channels",
        providesExtInterface: true,
        provInterfaceType: "REST, WebSocket",
        consumesExtInterfaces: true,
        consInterfaceType: "REST",
        status: "active",
        firstActiveDate: new Date("2020-05-15"),
        lastChangeDate: new Date("2024-11-15")
      },
      
      // Analytics and Reporting
      {
        amlNumber: "AML-2021-003",
        name: "Business Intelligence Platform",
        description: "Enterprise BI platform for dashboards and analytics",
        lob: "Analytics",
        os: "Linux",
        deployment: "cloud",
        uptime: "99.70",
        purpose: "Provide business insights through dashboards and reports",
        providesExtInterface: true,
        provInterfaceType: "REST API",
        consumesExtInterfaces: true,
        consInterfaceType: "Database, REST",
        status: "active",
        firstActiveDate: new Date("2021-08-01"),
        lastChangeDate: new Date("2024-10-25")
      },
      {
        amlNumber: "AML-2018-002",
        name: "Data Warehouse",
        description: "Central repository for enterprise data analytics",
        lob: "Data Management",
        os: "Linux",
        deployment: "on-premise",
        uptime: "99.60",
        purpose: "Store and manage enterprise data for analytics and reporting",
        providesExtInterface: true,
        provInterfaceType: "Database",
        consumesExtInterfaces: true,
        consInterfaceType: "File, Messaging",
        status: "active",
        firstActiveDate: new Date("2018-03-01"),
        lastChangeDate: new Date("2024-09-15")
      },
      
      // Marketing Systems
      {
        amlNumber: "AML-2021-004",
        name: "Marketing Automation Platform",
        description: "Automated marketing campaigns and lead nurturing",
        lob: "Marketing",
        os: "Linux",
        deployment: "cloud",
        uptime: "99.82",
        purpose: "Automate marketing campaigns and track customer engagement",
        providesExtInterface: true,
        provInterfaceType: "REST API",
        consumesExtInterfaces: true,
        consInterfaceType: "REST, Webhook",
        status: "active",
        firstActiveDate: new Date("2021-11-01"),
        lastChangeDate: new Date("2024-11-30")
      },
      {
        amlNumber: "AML-2020-005",
        name: "Content Management System",
        description: "Enterprise CMS for website and digital content",
        lob: "Marketing",
        os: "Linux",
        deployment: "cloud",
        uptime: "99.90",
        purpose: "Manage website content and digital assets",
        providesExtInterface: true,
        provInterfaceType: "REST, GraphQL",
        consumesExtInterfaces: true,
        consInterfaceType: "REST",
        status: "active",
        firstActiveDate: new Date("2020-04-15"),
        lastChangeDate: new Date("2024-10-10")
      },
      
      // HR Systems
      {
        amlNumber: "AML-2017-001",
        name: "Human Resources Information System",
        description: "Core HR system for employee management and payroll",
        lob: "Human Resources",
        os: "Windows Server",
        deployment: "on-premise",
        uptime: "99.75",
        purpose: "Manage employee records, payroll, and benefits",
        providesExtInterface: true,
        provInterfaceType: "SOAP, File",
        consumesExtInterfaces: true,
        consInterfaceType: "File",
        status: "active",
        firstActiveDate: new Date("2017-01-01"),
        lastChangeDate: new Date("2024-08-20")
      },
      {
        amlNumber: "AML-2022-001",
        name: "Learning Management System",
        description: "Employee training and certification platform",
        lob: "Human Resources",
        os: "Linux",
        deployment: "cloud",
        uptime: "99.50",
        purpose: "Deliver training content and track employee certifications",
        providesExtInterface: false,
        provInterfaceType: null,
        consumesExtInterfaces: true,
        consInterfaceType: "REST, SAML",
        status: "active",
        firstActiveDate: new Date("2022-03-01"),
        lastChangeDate: new Date("2024-09-05")
      },
      
      // Security and Compliance
      {
        amlNumber: "AML-2019-003",
        name: "Identity Management System",
        description: "Enterprise identity and access management platform",
        lob: "IT Security",
        os: "Linux",
        deployment: "on-premise",
        uptime: "99.98",
        purpose: "Manage user identities and access permissions across systems",
        providesExtInterface: true,
        provInterfaceType: "LDAP, SAML, OAuth",
        consumesExtInterfaces: false,
        consInterfaceType: null,
        status: "active",
        firstActiveDate: new Date("2019-06-01"),
        lastChangeDate: new Date("2024-11-05")
      },
      {
        amlNumber: "AML-2020-006",
        name: "Security Information Event Management",
        description: "SIEM platform for security monitoring and incident response",
        lob: "IT Security",
        os: "Linux",
        deployment: "on-premise",
        uptime: "99.95",
        purpose: "Monitor security events and manage incident response",
        providesExtInterface: true,
        provInterfaceType: "REST, Syslog",
        consumesExtInterfaces: true,
        consInterfaceType: "Syslog, REST",
        status: "active",
        firstActiveDate: new Date("2020-02-01"),
        lastChangeDate: new Date("2024-10-30")
      },
      
      // Mobile and Communication
      {
        amlNumber: "AML-2021-005",
        name: "Mobile Application Backend",
        description: "Backend services for company mobile applications",
        lob: "Digital",
        os: "Linux",
        deployment: "cloud",
        uptime: "99.91",
        purpose: "Provide backend services for mobile applications",
        providesExtInterface: true,
        provInterfaceType: "REST, GraphQL",
        consumesExtInterfaces: true,
        consInterfaceType: "REST",
        status: "active",
        firstActiveDate: new Date("2021-06-15"),
        lastChangeDate: new Date("2024-12-01")
      },
      {
        amlNumber: "AML-2021-006",
        name: "Notification Service",
        description: "Multi-channel notification delivery system",
        lob: "Infrastructure",
        os: "Linux",
        deployment: "cloud",
        uptime: "99.89",
        purpose: "Send notifications via email, SMS, and push notifications",
        providesExtInterface: true,
        provInterfaceType: "REST, Messaging",
        consumesExtInterfaces: true,
        consInterfaceType: "SMTP, REST",
        status: "active",
        firstActiveDate: new Date("2021-09-01"),
        lastChangeDate: new Date("2024-11-20")
      },
      
      // Legacy System
      {
        amlNumber: "AML-2010-001",
        name: "Legacy Billing System",
        description: "Older billing system being phased out",
        lob: "Finance",
        os: "AIX",
        deployment: "on-premise",
        uptime: "98.50",
        purpose: "Handle legacy billing processes for older accounts",
        providesExtInterface: true,
        provInterfaceType: "File",
        consumesExtInterfaces: false,
        consInterfaceType: null,
        status: "deprecated",
        firstActiveDate: new Date("2010-01-01"),
        lastChangeDate: new Date("2024-06-01")
      }
    ];

    const insertedApps = await db.insert(applications).values(applicationsData).returning();
    console.log("✓ Created 20 applications");

    // Create 10 business processes
    const businessProcessesData = [
      {
        businessProcess: "Customer Onboarding Process",
        lob: "Sales & Marketing",
        product: "Customer Acquisition",
        version: "2.0",
        domainOwner: "Sarah Johnson",
        itOwner: "Mike Chen",
        vendorFocal: "TechCorp Solutions",
        status: "active"
      },
      {
        businessProcess: "Order to Cash Process",
        lob: "Operations",
        product: "Order Management",
        version: "3.5",
        domainOwner: "David Brown",
        itOwner: "John Smith",
        vendorFocal: "Enterprise Systems Inc",
        status: "active"
      },
      {
        businessProcess: "Inventory Replenishment Process",
        lob: "Supply Chain",
        product: "Inventory Management",
        version: "1.8",
        domainOwner: "Lisa Anderson",
        itOwner: "Mike Chen",
        vendorFocal: "LogiTech Solutions",
        status: "active"
      },
      {
        businessProcess: "Financial Reconciliation Process",
        lob: "Finance",
        product: "Financial Operations",
        version: "2.2",
        domainOwner: "Robert Wilson",
        itOwner: "John Smith",
        vendorFocal: "FinTech Partners",
        status: "active"
      },
      {
        businessProcess: "Customer Support Ticket Process",
        lob: "Customer Service",
        product: "Support Management",
        version: "1.5",
        domainOwner: "Emma Davis",
        itOwner: "Sarah Thompson",
        vendorFocal: "ServicePro Inc",
        status: "active"
      },
      {
        businessProcess: "Employee Onboarding Process",
        lob: "Human Resources",
        product: "HR Management",
        version: "1.2",
        domainOwner: "Michael Brown",
        itOwner: "Lisa Anderson",
        vendorFocal: "HR Solutions Ltd",
        status: "active"
      },
      {
        businessProcess: "Marketing Campaign Process",
        lob: "Marketing",
        product: "Campaign Management",
        version: "2.0",
        domainOwner: "Jennifer Lee",
        itOwner: "Mike Chen",
        vendorFocal: "MarketPro Agency",
        status: "active"
      },
      {
        businessProcess: "Security Incident Response Process",
        lob: "IT Security",
        product: "Security Management",
        version: "3.0",
        domainOwner: "Thomas Garcia",
        itOwner: "John Smith",
        vendorFocal: "SecureNet Corp",
        status: "active"
      },
      {
        businessProcess: "Product Returns Process",
        lob: "Operations",
        product: "Returns Management",
        version: "1.0",
        domainOwner: "David Brown",
        itOwner: "Sarah Thompson",
        vendorFocal: "Enterprise Systems Inc",
        status: "active"
      },
      {
        businessProcess: "Data Analytics Process",
        lob: "Analytics",
        product: "Business Intelligence",
        version: "2.5",
        domainOwner: "Rachel Martinez",
        itOwner: "Mike Chen",
        vendorFocal: "DataInsights Pro",
        status: "active"
      }
    ];

    const insertedBPs = await db.insert(businessProcesses).values(businessProcessesData).returning();
    console.log("✓ Created 10 business processes");

    // Create 30 interfaces
    const interfacesData = [
      // CRM Interfaces
      {
        imlNumber: "IML-2024-001",
        description: "Customer data synchronization API providing real-time updates of customer profiles, preferences, and interaction history. Supports both full and incremental sync modes.",
        providerApplicationId: insertedApps[0].id, // CRM
        consumerApplicationId: insertedApps[2].id, // E-Commerce
        interfaceType: "REST",
        middleware: "None",
        version: "2.1",
        lob: "Sales & Marketing",
        businessProcessName: "Customer Onboarding Process",
        customerFocal: "Sarah Johnson",
        providerOwner: "CRM Team",
        consumerOwner: "E-Commerce Team",
        status: "active",
        sampleCode: "GET /api/v2/customers/{customerId}\nAuthorization: Bearer {token}\n\nResponse:\n{\n  'customerId': '12345',\n  'name': 'John Doe',\n  'email': 'john@example.com',\n  'preferences': {...}\n}",
        connectivitySteps: "1. Obtain API credentials from CRM team\n2. Configure OAuth 2.0 authentication\n3. Test connectivity using /api/v2/health endpoint\n4. Verify SSL certificate",
        interfaceTestSteps: "1. Call GET /api/v2/customers with test ID\n2. Verify response schema\n3. Test pagination with large datasets\n4. Validate error handling"
      },
      {
        imlNumber: "IML-2024-002",
        description: "Order processing SOAP service for creating, updating, and cancelling orders. Includes support for complex order types and bulk operations.",
        providerApplicationId: insertedApps[6].id, // Order Management
        consumerApplicationId: insertedApps[2].id, // E-Commerce
        interfaceType: "SOAP",
        middleware: "WSO2",
        version: "3.0",
        lob: "Operations",
        businessProcessName: "Order to Cash Process",
        customerFocal: "David Brown",
        providerOwner: "Order Management Team",
        consumerOwner: "E-Commerce Team",
        status: "active",
        sampleCode: "<soap:Envelope>\n  <soap:Body>\n    <CreateOrder>\n      <OrderDetails>...</OrderDetails>\n    </CreateOrder>\n  </soap:Body>\n</soap:Envelope>",
        connectivitySteps: "1. Import WSDL from https://orders.company.com/soap/v3?wsdl\n2. Configure WS-Security headers\n3. Test with SoapUI",
        interfaceTestSteps: "1. Create test order\n2. Query order status\n3. Update order\n4. Cancel order"
      },
      {
        imlNumber: "IML-2024-003",
        description: "Real-time inventory updates via Kafka messaging. Publishes stock level changes, movements, and adjustments with exactly-once delivery guarantee.",
        providerApplicationId: insertedApps[5].id, // Inventory Management
        consumerApplicationId: insertedApps[6].id, // Order Management
        interfaceType: "Messaging",
        middleware: "Apache Kafka",
        version: "1.5",
        lob: "Supply Chain",
        businessProcessName: "Inventory Replenishment Process",
        customerFocal: "Lisa Anderson",
        providerOwner: "Inventory Team",
        consumerOwner: "Order Team",
        status: "active",
        sampleCode: "Topic: inventory-updates\nMessage Format:\n{\n  'eventType': 'STOCK_UPDATE',\n  'sku': 'PROD-123',\n  'warehouse': 'WH-01',\n  'quantity': 150,\n  'timestamp': '2024-01-15T10:30:00Z'\n}",
        connectivitySteps: "1. Request Kafka cluster access\n2. Configure consumer group\n3. Set up SSL certificates\n4. Test connectivity with kafka-console-consumer",
        interfaceTestSteps: "1. Subscribe to test topic\n2. Verify message consumption\n3. Test error handling and retries\n4. Validate message ordering"
      },
      {
        imlNumber: "IML-2024-004",
        description: "GraphQL API for flexible product catalog queries. Supports complex filtering, sorting, and relationship traversal for product data.",
        providerApplicationId: insertedApps[2].id, // E-Commerce
        consumerApplicationId: insertedApps[17].id, // Mobile Backend
        interfaceType: "GraphQL",
        middleware: "None",
        version: "1.2",
        lob: "Digital Commerce",
        businessProcessName: "Order to Cash Process",
        customerFocal: "Jennifer Lee",
        providerOwner: "E-Commerce Team",
        consumerOwner: "Mobile Team",
        status: "active",
        sampleCode: "query GetProduct($id: ID!) {\n  product(id: $id) {\n    name\n    price\n    inventory {\n      available\n      warehouse\n    }\n  }\n}",
        connectivitySteps: "1. Obtain GraphQL endpoint URL\n2. Configure API key authentication\n3. Test with GraphQL playground",
        interfaceTestSteps: "1. Execute sample queries\n2. Test mutations\n3. Verify subscription functionality\n4. Check query depth limits"
      },
      {
        imlNumber: "IML-2024-005",
        description: "Nightly batch file transfer for financial transactions. Transfers encrypted files containing daily sales, refunds, and adjustments.",
        providerApplicationId: insertedApps[3].id, // Payment Gateway
        consumerApplicationId: insertedApps[4].id, // Financial Reporting
        interfaceType: "File",
        middleware: "None",
        version: "2.0",
        lob: "Finance",
        businessProcessName: "Financial Reconciliation Process",
        customerFocal: "Robert Wilson",
        providerOwner: "Payment Team",
        consumerOwner: "Finance Team",
        status: "active",
        sampleCode: "File Format: CSV\nNaming: TXN_YYYYMMDD_HHMMSS.csv\nFields: transaction_id,amount,currency,status,timestamp\nEncryption: PGP",
        connectivitySteps: "1. Set up SFTP credentials\n2. Configure PGP keys\n3. Test file transfer\n4. Verify file permissions",
        interfaceTestSteps: "1. Transfer test file\n2. Validate file format\n3. Check encryption/decryption\n4. Verify file archival"
      },
      {
        imlNumber: "IML-2024-006",
        description: "Database replication interface for analytics. Provides read-only access to operational data with 15-minute replication lag.",
        providerApplicationId: insertedApps[1].id, // ERP
        consumerApplicationId: insertedApps[10].id, // Data Warehouse
        interfaceType: "Database",
        middleware: "None",
        version: "1.0",
        lob: "Data Management",
        businessProcessName: "Data Analytics Process",
        customerFocal: "Rachel Martinez",
        providerOwner: "ERP Team",
        consumerOwner: "Data Team",
        status: "active",
        sampleCode: "Connection String: jdbc:postgresql://replica.db.company.com:5432/erp_replica\nSchema: public\nTables: customers, orders, products, transactions",
        connectivitySteps: "1. Request database access\n2. Configure connection pool\n3. Test connectivity\n4. Verify read-only permissions",
        interfaceTestSteps: "1. Execute test queries\n2. Verify data freshness\n3. Check query performance\n4. Test connection resilience"
      },
      {
        imlNumber: "IML-2024-007",
        description: "Payment processing API for credit card transactions. Supports authorization, capture, refund, and recurring billing operations.",
        providerApplicationId: insertedApps[3].id, // Payment Gateway
        consumerApplicationId: insertedApps[2].id, // E-Commerce
        interfaceType: "REST",
        middleware: "None",
        version: "3.5",
        lob: "Finance",
        businessProcessName: "Order to Cash Process",
        customerFocal: "David Brown",
        providerOwner: "Payment Team",
        consumerOwner: "E-Commerce Team",
        status: "active",
        sampleCode: "POST /api/v3/payments/authorize\n{\n  'amount': 99.99,\n  'currency': 'USD',\n  'card_token': 'tok_1234567890',\n  'reference': 'ORD-12345'\n}",
        connectivitySteps: "1. Register merchant account\n2. Obtain API keys\n3. Configure webhook endpoints\n4. Enable PCI compliance mode",
        interfaceTestSteps: "1. Test card authorization\n2. Perform capture\n3. Process refund\n4. Verify webhook delivery"
      },
      {
        imlNumber: "IML-2024-008",
        description: "Customer notification API for multi-channel messaging. Sends emails, SMS, and push notifications based on customer preferences.",
        providerApplicationId: insertedApps[18].id, // Notification Service
        consumerApplicationId: insertedApps[6].id, // Order Management
        interfaceType: "REST",
        middleware: "PSB",
        version: "2.0",
        lob: "Infrastructure",
        businessProcessName: "Order to Cash Process",
        customerFocal: "David Brown",
        providerOwner: "Platform Team",
        consumerOwner: "Order Team",
        status: "active",
        sampleCode: "POST /api/v2/notifications/send\n{\n  'recipient': 'customer@example.com',\n  'template': 'order_confirmation',\n  'data': {...},\n  'channels': ['email', 'sms']\n}",
        connectivitySteps: "1. Create notification account\n2. Configure templates\n3. Set up API authentication\n4. Test delivery",
        interfaceTestSteps: "1. Send test notification\n2. Verify delivery status\n3. Check template rendering\n4. Test channel fallback"
      },
      {
        imlNumber: "IML-2024-009",
        description: "HR data synchronization for employee management. Transfers employee records, org structure, and compensation data.",
        providerApplicationId: insertedApps[13].id, // HRIS
        consumerApplicationId: insertedApps[1].id, // ERP
        interfaceType: "SOAP",
        middleware: "PCE",
        version: "2.5",
        lob: "Human Resources",
        businessProcessName: "Employee Onboarding Process",
        customerFocal: "Michael Brown",
        providerOwner: "HR Team",
        consumerOwner: "ERP Team",
        status: "active",
        sampleCode: "<GetEmployee>\n  <EmployeeId>EMP001</EmployeeId>\n  <IncludeCompensation>true</IncludeCompensation>\n</GetEmployee>",
        connectivitySteps: "1. Configure VPN access\n2. Import WSDL\n3. Set up certificates\n4. Test connectivity",
        interfaceTestSteps: "1. Query employee data\n2. Test data sync\n3. Verify field mapping\n4. Check error handling"
      },
      {
        imlNumber: "IML-2024-010",
        description: "Marketing automation integration for lead management. Syncs leads, tracks engagement, and updates campaign responses.",
        providerApplicationId: insertedApps[11].id, // Marketing Automation
        consumerApplicationId: insertedApps[0].id, // CRM
        interfaceType: "REST",
        middleware: "None",
        version: "1.8",
        lob: "Marketing",
        businessProcessName: "Marketing Campaign Process",
        customerFocal: "Jennifer Lee",
        providerOwner: "Marketing Team",
        consumerOwner: "CRM Team",
        status: "active",
        sampleCode: "GET /api/leads?campaign_id=CAMP-2024-001\nPOST /api/leads/{id}/activities",
        connectivitySteps: "1. Generate API token\n2. Configure webhook URLs\n3. Test authentication\n4. Verify rate limits",
        interfaceTestSteps: "1. Sync test leads\n2. Track activities\n3. Update lead scores\n4. Test webhook events"
      },
      {
        imlNumber: "IML-2024-011",
        description: "Identity management integration using SAML. Provides single sign-on and user provisioning capabilities.",
        providerApplicationId: insertedApps[15].id, // Identity Management
        consumerApplicationId: insertedApps[14].id, // LMS
        interfaceType: "SAML",
        middleware: "WSO2",
        version: "2.0",
        lob: "IT Security",
        businessProcessName: "Employee Onboarding Process",
        customerFocal: "Thomas Garcia",
        providerOwner: "Security Team",
        consumerOwner: "HR Team",
        status: "active",
        sampleCode: "SAML Assertion containing:\n- NameID\n- Email\n- Groups\n- Attributes",
        connectivitySteps: "1. Exchange metadata\n2. Configure certificates\n3. Set up attribute mapping\n4. Test SSO flow",
        interfaceTestSteps: "1. Test SSO login\n2. Verify attributes\n3. Test logout\n4. Check session timeout"
      },
      {
        imlNumber: "IML-2024-012",
        description: "Business intelligence data extract for executive dashboards. Provides aggregated metrics and KPIs.",
        providerApplicationId: insertedApps[9].id, // BI Platform
        consumerApplicationId: insertedApps[17].id, // Mobile Backend
        interfaceType: "REST",
        middleware: "None",
        version: "1.5",
        lob: "Analytics",
        businessProcessName: "Data Analytics Process",
        customerFocal: "Rachel Martinez",
        providerOwner: "Analytics Team",
        consumerOwner: "Mobile Team",
        status: "active",
        sampleCode: "GET /api/v1/dashboards/executive/metrics?period=MTD",
        connectivitySteps: "1. Request API access\n2. Configure OAuth\n3. Test endpoints\n4. Cache configuration",
        interfaceTestSteps: "1. Query metrics\n2. Verify calculations\n3. Test filters\n4. Check performance"
      },
      {
        imlNumber: "IML-2024-013",
        description: "Contact center integration for customer interaction history. Provides call recordings, transcripts, and interaction metadata.",
        providerApplicationId: insertedApps[8].id, // Contact Center
        consumerApplicationId: insertedApps[0].id, // CRM
        interfaceType: "REST",
        middleware: "None",
        version: "2.2",
        lob: "Customer Service",
        businessProcessName: "Customer Support Ticket Process",
        customerFocal: "Emma Davis",
        providerOwner: "Contact Center Team",
        consumerOwner: "CRM Team",
        status: "active",
        sampleCode: "GET /api/v2/interactions/{customerId}\nGET /api/v2/recordings/{interactionId}",
        connectivitySteps: "1. Configure API keys\n2. Set up IP whitelist\n3. Test connectivity\n4. Configure callbacks",
        interfaceTestSteps: "1. Query interactions\n2. Retrieve recordings\n3. Test real-time events\n4. Verify data retention"
      },
      {
        imlNumber: "IML-2024-014",
        description: "Security event streaming for SIEM integration. Streams application logs and security events in real-time.",
        providerApplicationId: insertedApps[2].id, // E-Commerce
        consumerApplicationId: insertedApps[16].id, // SIEM
        interfaceType: "Syslog",
        middleware: "None",
        version: "1.0",
        lob: "IT Security",
        businessProcessName: "Security Incident Response Process",
        customerFocal: "Thomas Garcia",
        providerOwner: "E-Commerce Team",
        consumerOwner: "Security Team",
        status: "active",
        sampleCode: "Syslog Format: RFC5424\nFacility: 16 (local0)\nSeverity: Info to Critical",
        connectivitySteps: "1. Configure syslog client\n2. Set up TLS\n3. Test log delivery\n4. Verify parsing",
        interfaceTestSteps: "1. Send test logs\n2. Verify receipt\n3. Check parsing rules\n4. Test alert generation"
      },
      {
        imlNumber: "IML-2024-015",
        description: "Content delivery API for CMS integration. Provides access to digital assets, pages, and content metadata.",
        providerApplicationId: insertedApps[12].id, // CMS
        consumerApplicationId: insertedApps[17].id, // Mobile Backend
        interfaceType: "GraphQL",
        middleware: "None",
        version: "2.0",
        lob: "Marketing",
        businessProcessName: "Marketing Campaign Process",
        customerFocal: "Jennifer Lee",
        providerOwner: "Content Team",
        consumerOwner: "Mobile Team",
        status: "active",
        sampleCode: "query GetContent($slug: String!) {\n  page(slug: $slug) {\n    title\n    content\n    assets {\n      url\n      type\n    }\n  }\n}",
        connectivitySteps: "1. Obtain GraphQL endpoint\n2. Configure CDN\n3. Set up caching\n4. Test queries",
        interfaceTestSteps: "1. Query content\n2. Test mutations\n3. Verify caching\n4. Check CDN delivery"
      },
      {
        imlNumber: "IML-2024-016",
        description: "Financial reporting data feed. Provides transaction summaries and financial metrics for reporting.",
        providerApplicationId: insertedApps[4].id, // Financial Reporting
        consumerApplicationId: insertedApps[9].id, // BI Platform
        interfaceType: "Database",
        middleware: "None",
        version: "1.2",
        lob: "Finance",
        businessProcessName: "Financial Reconciliation Process",
        customerFocal: "Robert Wilson",
        providerOwner: "Finance Team",
        consumerOwner: "Analytics Team",
        status: "active",
        sampleCode: "View: financial_summary\nRefresh: Every 4 hours\nFields: period, revenue, expenses, profit_margin",
        connectivitySteps: "1. Request DB access\n2. Configure read replica\n3. Test queries\n4. Monitor performance",
        interfaceTestSteps: "1. Query views\n2. Verify data accuracy\n3. Test refresh cycle\n4. Check indexes"
      },
      {
        imlNumber: "IML-2024-017",
        description: "Order fulfillment messaging for warehouse operations. Sends pick, pack, and ship instructions to warehouses.",
        providerApplicationId: insertedApps[6].id, // Order Management
        consumerApplicationId: insertedApps[5].id, // Inventory Management
        interfaceType: "Messaging",
        middleware: "RabbitMQ",
        version: "2.5",
        lob: "Operations",
        businessProcessName: "Order to Cash Process",
        customerFocal: "David Brown",
        providerOwner: "Order Team",
        consumerOwner: "Warehouse Team",
        status: "active",
        sampleCode: "Queue: order-fulfillment\nMessage: {\n  'orderId': 'ORD-123',\n  'items': [...],\n  'warehouse': 'WH-01',\n  'priority': 'standard'\n}",
        connectivitySteps: "1. Configure message broker\n2. Set up queues\n3. Test connectivity\n4. Configure DLQ",
        interfaceTestSteps: "1. Send test messages\n2. Verify processing\n3. Test error handling\n4. Check throughput"
      },
      {
        imlNumber: "IML-2024-018",
        description: "Customer portal authentication API. Provides secure authentication and session management for self-service portal.",
        providerApplicationId: insertedApps[15].id, // Identity Management
        consumerApplicationId: insertedApps[7].id, // Customer Portal
        interfaceType: "OAuth",
        middleware: "WSO2",
        version: "2.0",
        lob: "IT Security",
        businessProcessName: "Customer Onboarding Process",
        customerFocal: "Sarah Johnson",
        providerOwner: "Security Team",
        consumerOwner: "Portal Team",
        status: "active",
        sampleCode: "OAuth 2.0 Flow:\n1. Authorization: /oauth/authorize\n2. Token: /oauth/token\n3. Refresh: /oauth/refresh",
        connectivitySteps: "1. Register OAuth client\n2. Configure redirect URIs\n3. Test auth flow\n4. Set up PKCE",
        interfaceTestSteps: "1. Test authorization\n2. Verify tokens\n3. Test refresh\n4. Check revocation"
      },
      {
        imlNumber: "IML-2024-019",
        description: "Returns processing API for managing product returns. Handles RMA creation, status updates, and refund processing.",
        providerApplicationId: insertedApps[6].id, // Order Management
        consumerApplicationId: insertedApps[7].id, // Customer Portal
        interfaceType: "REST",
        middleware: "None",
        version: "1.0",
        lob: "Operations",
        businessProcessName: "Product Returns Process",
        customerFocal: "David Brown",
        providerOwner: "Order Team",
        consumerOwner: "Portal Team",
        status: "active",
        sampleCode: "POST /api/v1/returns\n{\n  'orderId': 'ORD-123',\n  'items': [...],\n  'reason': 'defective',\n  'comments': '...'\n}",
        connectivitySteps: "1. Configure API access\n2. Set up webhooks\n3. Test endpoints\n4. Configure limits",
        interfaceTestSteps: "1. Create RMA\n2. Update status\n3. Process refund\n4. Test notifications"
      },
      {
        imlNumber: "IML-2024-020",
        description: "Legacy billing data export. Batch file transfer of billing data from legacy system.",
        providerApplicationId: insertedApps[19].id, // Legacy Billing
        consumerApplicationId: insertedApps[4].id, // Financial Reporting
        interfaceType: "File",
        middleware: "IBM MQ",
        version: "1.0",
        lob: "Finance",
        businessProcessName: "Financial Reconciliation Process",
        customerFocal: "Robert Wilson",
        providerOwner: "Legacy Team",
        consumerOwner: "Finance Team",
        status: "deprecated",
        sampleCode: "File: BILL_YYYYMMDD.DAT\nFormat: Fixed width\nSchedule: Daily at 2 AM",
        connectivitySteps: "1. Access mainframe\n2. Schedule job\n3. Configure FTP\n4. Test transfer",
        interfaceTestSteps: "1. Generate test file\n2. Transfer file\n3. Parse data\n4. Validate totals"
      },
      {
        imlNumber: "IML-2024-021",
        description: "Employee directory synchronization. Syncs employee data for internal directory and org chart.",
        providerApplicationId: insertedApps[13].id, // HRIS
        consumerApplicationId: insertedApps[15].id, // Identity Management
        interfaceType: "LDAP",
        middleware: "None",
        version: "1.5",
        lob: "Human Resources",
        businessProcessName: "Employee Onboarding Process",
        customerFocal: "Michael Brown",
        providerOwner: "HR Team",
        consumerOwner: "Security Team",
        status: "active",
        sampleCode: "LDAP Sync:\nBase DN: ou=employees,dc=company,dc=com\nFilter: (objectClass=person)\nAttributes: cn, mail, department, manager",
        connectivitySteps: "1. Configure LDAP bind\n2. Set up SSL/TLS\n3. Test queries\n4. Schedule sync",
        interfaceTestSteps: "1. Query directory\n2. Verify attributes\n3. Test updates\n4. Check deletions"
      },
      {
        imlNumber: "IML-2024-022",
        description: "Mobile app configuration API. Provides dynamic configuration and feature flags for mobile applications.",
        providerApplicationId: insertedApps[17].id, // Mobile Backend
        consumerApplicationId: insertedApps[18].id, // Notification Service
        interfaceType: "REST",
        middleware: "Redis",
        version: "1.2",
        lob: "Digital",
        businessProcessName: "Customer Onboarding Process",
        customerFocal: "Sarah Johnson",
        providerOwner: "Mobile Team",
        consumerOwner: "Platform Team",
        status: "active",
        sampleCode: "GET /api/v1/config/{app_version}\nResponse: {\n  'features': {...},\n  'endpoints': {...},\n  'settings': {...}\n}",
        connectivitySteps: "1. Register app\n2. Configure versions\n3. Test endpoints\n4. Set up caching",
        interfaceTestSteps: "1. Query config\n2. Test versioning\n3. Verify caching\n4. Test fallback"
      },
      {
        imlNumber: "IML-2024-023",
        description: "Warehouse management integration for inventory updates. Real-time inventory movements and adjustments.",
        providerApplicationId: insertedApps[5].id, // Inventory Management
        consumerApplicationId: insertedApps[1].id, // ERP
        interfaceType: "REST",
        middleware: "None",
        version: "2.0",
        lob: "Supply Chain",
        businessProcessName: "Inventory Replenishment Process",
        customerFocal: "Lisa Anderson",
        providerOwner: "Inventory Team",
        consumerOwner: "ERP Team",
        status: "active",
        sampleCode: "POST /api/v2/inventory/movements\n{\n  'type': 'adjustment',\n  'sku': 'PROD-123',\n  'quantity': -10,\n  'reason': 'damaged'\n}",
        connectivitySteps: "1. Configure API keys\n2. Set up webhooks\n3. Test endpoints\n4. Monitor rate limits",
        interfaceTestSteps: "1. Create movement\n2. Query inventory\n3. Test webhooks\n4. Verify sync"
      },
      {
        imlNumber: "IML-2024-024",
        description: "Marketing content syndication. Distributes marketing content to various channels and partners.",
        providerApplicationId: insertedApps[12].id, // CMS
        consumerApplicationId: insertedApps[11].id, // Marketing Automation
        interfaceType: "REST",
        middleware: "None",
        version: "1.8",
        lob: "Marketing",
        businessProcessName: "Marketing Campaign Process",
        customerFocal: "Jennifer Lee",
        providerOwner: "Content Team",
        consumerOwner: "Marketing Team",
        status: "active",
        sampleCode: "GET /api/v1/content/feed?type=marketing&format=json",
        connectivitySteps: "1. Configure API access\n2. Set up content types\n3. Test feed\n4. Configure cache",
        interfaceTestSteps: "1. Query feed\n2. Test filters\n3. Verify updates\n4. Check performance"
      },
      {
        imlNumber: "IML-2024-025",
        description: "Customer feedback integration. Collects and distributes customer feedback across systems.",
        providerApplicationId: insertedApps[7].id, // Customer Portal
        consumerApplicationId: insertedApps[8].id, // Contact Center
        interfaceType: "Webhook",
        middleware: "None",
        version: "1.0",
        lob: "Customer Service",
        businessProcessName: "Customer Support Ticket Process",
        customerFocal: "Emma Davis",
        providerOwner: "Portal Team",
        consumerOwner: "Contact Center Team",
        status: "active",
        sampleCode: "POST /webhooks/feedback\n{\n  'customerId': '12345',\n  'rating': 4,\n  'comments': '...',\n  'timestamp': '2024-01-15T10:30:00Z'\n}",
        connectivitySteps: "1. Register webhook\n2. Configure retry logic\n3. Test delivery\n4. Set up monitoring",
        interfaceTestSteps: "1. Send test event\n2. Verify delivery\n3. Test retries\n4. Check signatures"
      },
      {
        imlNumber: "IML-2024-026",
        description: "Analytics data pipeline for customer insights. Streams customer behavior data for analytics.",
        providerApplicationId: insertedApps[2].id, // E-Commerce
        consumerApplicationId: insertedApps[10].id, // Data Warehouse
        interfaceType: "Streaming",
        middleware: "Apache Kafka",
        version: "2.0",
        lob: "Analytics",
        businessProcessName: "Data Analytics Process",
        customerFocal: "Rachel Martinez",
        providerOwner: "E-Commerce Team",
        consumerOwner: "Data Team",
        status: "active",
        sampleCode: "Kinesis Stream: customer-events\nSchema: {\n  'eventType': 'page_view',\n  'customerId': '12345',\n  'data': {...}\n}",
        connectivitySteps: "1. Configure stream access\n2. Set up consumers\n3. Test throughput\n4. Monitor lag",
        interfaceTestSteps: "1. Produce events\n2. Consume stream\n3. Verify processing\n4. Test scaling"
      },
      {
        imlNumber: "IML-2024-027",
        description: "Training enrollment API for employee development. Manages course enrollments and completion tracking.",
        providerApplicationId: insertedApps[14].id, // LMS
        consumerApplicationId: insertedApps[13].id, // HRIS
        interfaceType: "REST",
        middleware: "None",
        version: "1.3",
        lob: "Human Resources",
        businessProcessName: "Employee Onboarding Process",
        customerFocal: "Michael Brown",
        providerOwner: "Learning Team",
        consumerOwner: "HR Team",
        status: "active",
        sampleCode: "POST /api/v1/enrollments\n{\n  'employeeId': 'EMP001',\n  'courseId': 'COURSE-123',\n  'dueDate': '2024-03-01'\n}",
        connectivitySteps: "1. Configure API access\n2. Set up authentication\n3. Test endpoints\n4. Configure webhooks",
        interfaceTestSteps: "1. Create enrollment\n2. Update progress\n3. Complete course\n4. Query reports"
      },
      {
        imlNumber: "IML-2024-028",
        description: "Security scan results API. Provides vulnerability scan results and security metrics.",
        providerApplicationId: insertedApps[16].id, // SIEM
        consumerApplicationId: insertedApps[9].id, // BI Platform
        interfaceType: "REST",
        middleware: "None",
        version: "1.5",
        lob: "IT Security",
        businessProcessName: "Security Incident Response Process",
        customerFocal: "Thomas Garcia",
        providerOwner: "Security Team",
        consumerOwner: "Analytics Team",
        status: "active",
        sampleCode: "GET /api/v1/scans/latest?severity=high",
        connectivitySteps: "1. Configure API token\n2. Set up TLS\n3. Test queries\n4. Configure alerts",
        interfaceTestSteps: "1. Query scans\n2. Filter results\n3. Test pagination\n4. Verify metrics"
      },
      {
        imlNumber: "IML-2024-029",
        description: "Partner data exchange for B2B integration. Exchanges product and inventory data with business partners.",
        providerApplicationId: insertedApps[1].id, // ERP
        consumerApplicationId: insertedApps[11].id, // Marketing Automation
        interfaceType: "EDI",
        middleware: "IBM MQ",
        version: "1.0",
        lob: "Operations",
        businessProcessName: "Order to Cash Process",
        customerFocal: "David Brown",
        providerOwner: "ERP Team",
        consumerOwner: "Marketing Team",
        status: "active",
        sampleCode: "EDI 850: Purchase Order\nEDI 810: Invoice\nEDI 856: Advance Ship Notice",
        connectivitySteps: "1. Configure VAN\n2. Set up certificates\n3. Test transactions\n4. Monitor mailbox",
        interfaceTestSteps: "1. Send test 850\n2. Receive 810\n3. Process 856\n4. Verify ACKs"
      },
      {
        imlNumber: "IML-2024-030",
        description: "Mobile push notification integration. Sends targeted push notifications to mobile app users.",
        providerApplicationId: insertedApps[18].id, // Notification Service
        consumerApplicationId: insertedApps[17].id, // Mobile Backend
        interfaceType: "REST",
        middleware: "None",
        version: "2.5",
        lob: "Digital",
        businessProcessName: "Customer Onboarding Process",
        customerFocal: "Sarah Johnson",
        providerOwner: "Platform Team",
        consumerOwner: "Mobile Team",
        status: "active",
        sampleCode: "POST /api/v2/push/send\n{\n  'deviceTokens': [...],\n  'message': {...},\n  'data': {...},\n  'priority': 'high'\n}",
        connectivitySteps: "1. Configure FCM/APNS\n2. Register app\n3. Test delivery\n4. Monitor metrics",
        interfaceTestSteps: "1. Send test push\n2. Verify delivery\n3. Test data payload\n4. Check analytics"
      }
    ];

    const insertedInterfaces = await db.insert(interfaces).values(interfacesData).returning();
    console.log("✓ Created 30 interfaces");

    // Create business process interface mappings
    const bpInterfaceMappings = [
      // Customer Onboarding Process
      { businessProcessId: insertedBPs[0].id, interfaceId: insertedInterfaces[0].id, sequenceNumber: 1, description: "Retrieve customer data" },
      { businessProcessId: insertedBPs[0].id, interfaceId: insertedInterfaces[17].id, sequenceNumber: 2, description: "Authenticate customer" },
      { businessProcessId: insertedBPs[0].id, interfaceId: insertedInterfaces[29].id, sequenceNumber: 3, description: "Send welcome notification" },
      
      // Order to Cash Process
      { businessProcessId: insertedBPs[1].id, interfaceId: insertedInterfaces[1].id, sequenceNumber: 1, description: "Create order" },
      { businessProcessId: insertedBPs[1].id, interfaceId: insertedInterfaces[6].id, sequenceNumber: 2, description: "Process payment" },
      { businessProcessId: insertedBPs[1].id, interfaceId: insertedInterfaces[16].id, sequenceNumber: 3, description: "Send to fulfillment" },
      { businessProcessId: insertedBPs[1].id, interfaceId: insertedInterfaces[7].id, sequenceNumber: 4, description: "Send confirmation" },
      
      // Inventory Replenishment Process
      { businessProcessId: insertedBPs[2].id, interfaceId: insertedInterfaces[2].id, sequenceNumber: 1, description: "Monitor inventory levels" },
      { businessProcessId: insertedBPs[2].id, interfaceId: insertedInterfaces[22].id, sequenceNumber: 2, description: "Update ERP" },
      { businessProcessId: insertedBPs[2].id, interfaceId: insertedInterfaces[5].id, sequenceNumber: 3, description: "Generate replenishment order" },
      
      // Financial Reconciliation Process
      { businessProcessId: insertedBPs[3].id, interfaceId: insertedInterfaces[4].id, sequenceNumber: 1, description: "Collect transactions" },
      { businessProcessId: insertedBPs[3].id, interfaceId: insertedInterfaces[15].id, sequenceNumber: 2, description: "Generate reports" },
      { businessProcessId: insertedBPs[3].id, interfaceId: insertedInterfaces[19].id, sequenceNumber: 3, description: "Process legacy billing" },
      
      // Customer Support Ticket Process
      { businessProcessId: insertedBPs[4].id, interfaceId: insertedInterfaces[12].id, sequenceNumber: 1, description: "Retrieve interaction history" },
      { businessProcessId: insertedBPs[4].id, interfaceId: insertedInterfaces[24].id, sequenceNumber: 2, description: "Collect feedback" },
      { businessProcessId: insertedBPs[4].id, interfaceId: insertedInterfaces[7].id, sequenceNumber: 3, description: "Send updates" },
      
      // Employee Onboarding Process
      { businessProcessId: insertedBPs[5].id, interfaceId: insertedInterfaces[8].id, sequenceNumber: 1, description: "Create employee record" },
      { businessProcessId: insertedBPs[5].id, interfaceId: insertedInterfaces[20].id, sequenceNumber: 2, description: "Provision access" },
      { businessProcessId: insertedBPs[5].id, interfaceId: insertedInterfaces[26].id, sequenceNumber: 3, description: "Enroll in training" },
      
      // Marketing Campaign Process
      { businessProcessId: insertedBPs[6].id, interfaceId: insertedInterfaces[9].id, sequenceNumber: 1, description: "Sync leads" },
      { businessProcessId: insertedBPs[6].id, interfaceId: insertedInterfaces[23].id, sequenceNumber: 2, description: "Distribute content" },
      { businessProcessId: insertedBPs[6].id, interfaceId: insertedInterfaces[14].id, sequenceNumber: 3, description: "Deliver to mobile" },
      
      // Security Incident Response Process
      { businessProcessId: insertedBPs[7].id, interfaceId: insertedInterfaces[13].id, sequenceNumber: 1, description: "Collect security events" },
      { businessProcessId: insertedBPs[7].id, interfaceId: insertedInterfaces[27].id, sequenceNumber: 2, description: "Analyze vulnerabilities" },
      { businessProcessId: insertedBPs[7].id, interfaceId: insertedInterfaces[10].id, sequenceNumber: 3, description: "Update access controls" },
      
      // Product Returns Process
      { businessProcessId: insertedBPs[8].id, interfaceId: insertedInterfaces[18].id, sequenceNumber: 1, description: "Create RMA" },
      { businessProcessId: insertedBPs[8].id, interfaceId: insertedInterfaces[2].id, sequenceNumber: 2, description: "Update inventory" },
      { businessProcessId: insertedBPs[8].id, interfaceId: insertedInterfaces[6].id, sequenceNumber: 3, description: "Process refund" },
      
      // Data Analytics Process
      { businessProcessId: insertedBPs[9].id, interfaceId: insertedInterfaces[5].id, sequenceNumber: 1, description: "Extract operational data" },
      { businessProcessId: insertedBPs[9].id, interfaceId: insertedInterfaces[25].id, sequenceNumber: 2, description: "Stream customer events" },
      { businessProcessId: insertedBPs[9].id, interfaceId: insertedInterfaces[11].id, sequenceNumber: 3, description: "Generate dashboards" }
    ];

    await db.insert(businessProcessInterfaces).values(bpInterfaceMappings);
    console.log("✓ Created business process interface mappings");

    // Create 10 change requests
    const changeRequestsData = [
      {
        crNumber: "CR-2024-001",
        title: "Upgrade Payment Gateway API to v4.0",
        description: "Upgrade payment gateway integration to support new 3D Secure 2.0 authentication and improve transaction success rates",
        reason: "Regulatory compliance requirement for Strong Customer Authentication (SCA) and improved security",
        benefit: "Reduced fraud, improved conversion rates, and regulatory compliance",
        status: "approved",
        priority: "high",
        owner: "Mike Chen",
        requestedBy: "Robert Wilson",
        approvedBy: "John Smith",
        targetDate: new Date("2024-03-31"),
        completedDate: null,
        createdAt: new Date("2024-01-15")
      },
      {
        crNumber: "CR-2024-002",
        title: "Implement Real-time Inventory Sync",
        description: "Replace batch inventory updates with real-time streaming to reduce out-of-stock situations",
        reason: "Customer complaints about items showing in-stock but being unavailable at checkout",
        benefit: "Improved customer experience and reduced cart abandonment",
        status: "in_progress",
        priority: "high",
        owner: "Lisa Anderson",
        requestedBy: "David Brown",
        approvedBy: "Sarah Johnson",
        targetDate: new Date("2024-02-28"),
        completedDate: null,
        createdAt: new Date("2024-01-20")
      },
      {
        crNumber: "CR-2024-003",
        title: "Add GraphQL Support to Mobile APIs",
        description: "Implement GraphQL endpoints for mobile app to reduce over-fetching and improve performance",
        reason: "Mobile app performance issues due to multiple API calls",
        benefit: "50% reduction in mobile app load times and bandwidth usage",
        status: "under_review",
        priority: "medium",
        owner: "Sarah Thompson",
        requestedBy: "Mobile Team Lead",
        approvedBy: null,
        targetDate: new Date("2024-04-15"),
        completedDate: null,
        createdAt: new Date("2024-02-01")
      },
      {
        crNumber: "CR-2024-004",
        title: "Decommission Legacy Billing System",
        description: "Complete migration from legacy billing system and decommission the old infrastructure",
        reason: "High maintenance costs and security vulnerabilities in legacy system",
        benefit: "Annual savings of $200k and improved security posture",
        status: "approved",
        priority: "medium",
        owner: "John Smith",
        requestedBy: "Finance Director",
        approvedBy: "CTO",
        targetDate: new Date("2024-06-30"),
        completedDate: null,
        createdAt: new Date("2024-02-10")
      },
      {
        crNumber: "CR-2024-005",
        title: "Implement OAuth 2.0 for Partner APIs",
        description: "Replace basic authentication with OAuth 2.0 for all partner-facing APIs",
        reason: "Security audit findings and partner requirements",
        benefit: "Enhanced security and simplified partner onboarding",
        status: "completed",
        priority: "high",
        owner: "Security Team",
        requestedBy: "Partner Management",
        approvedBy: "CISO",
        targetDate: new Date("2024-01-31"),
        completedDate: new Date("2024-01-28"),
        createdAt: new Date("2023-12-15")
      },
      {
        crNumber: "CR-2024-006",
        title: "Add Multi-language Support to Customer Portal",
        description: "Implement internationalization for customer portal supporting 5 additional languages",
        reason: "Expansion into new geographic markets",
        benefit: "Access to 10M+ new potential customers",
        status: "draft",
        priority: "medium",
        owner: "Portal Team",
        requestedBy: "Business Development",
        approvedBy: null,
        targetDate: new Date("2024-05-30"),
        completedDate: null,
        createdAt: new Date("2024-02-15")
      },
      {
        crNumber: "CR-2024-007",
        title: "Upgrade Data Warehouse Infrastructure",
        description: "Migrate data warehouse to cloud-based solution for improved scalability",
        reason: "Current infrastructure reaching capacity limits",
        benefit: "3x performance improvement and elastic scaling",
        status: "submitted",
        priority: "high",
        owner: "Data Team",
        requestedBy: "Analytics Director",
        approvedBy: null,
        targetDate: new Date("2024-04-30"),
        completedDate: null,
        createdAt: new Date("2024-02-20")
      },
      {
        crNumber: "CR-2024-008",
        title: "Implement Webhook Retry Mechanism",
        description: "Add automatic retry logic for failed webhook deliveries across all integrations",
        reason: "Partner complaints about missed webhook notifications",
        benefit: "99.9% webhook delivery guarantee",
        status: "in_progress",
        priority: "medium",
        owner: "Integration Team",
        requestedBy: "Partner Success",
        approvedBy: "Engineering Manager",
        targetDate: new Date("2024-03-15"),
        completedDate: null,
        createdAt: new Date("2024-02-05")
      },
      {
        crNumber: "CR-2024-009",
        title: "Add Kafka Streaming for Order Events",
        description: "Implement Kafka-based event streaming for real-time order processing",
        reason: "Need for real-time order visibility and event-driven architecture",
        benefit: "Real-time order tracking and improved system decoupling",
        status: "rejected",
        priority: "low",
        owner: "Architecture Team",
        requestedBy: "Operations",
        approvedBy: null,
        targetDate: new Date("2024-07-31"),
        completedDate: null,
        createdAt: new Date("2024-01-25")
      },
      {
        crNumber: "CR-2024-010",
        title: "Implement API Rate Limiting",
        description: "Add rate limiting to all public APIs to prevent abuse and ensure fair usage",
        reason: "Recent DDoS attempts and resource exhaustion incidents",
        benefit: "Improved API stability and fair resource allocation",
        status: "completed",
        priority: "critical",
        owner: "Platform Team",
        requestedBy: "Security Team",
        approvedBy: "CTO",
        targetDate: new Date("2024-02-15"),
        completedDate: new Date("2024-02-14"),
        createdAt: new Date("2024-02-01")
      }
    ];

    const insertedCRs = await db.insert(changeRequests).values(changeRequestsData).returning();
    console.log("✓ Created 10 change requests");

    // Link change requests to applications and interfaces
    const crApplicationLinks = [
      // CR-001: Payment Gateway Upgrade
      { changeRequestId: insertedCRs[0].id, applicationId: insertedApps[3].id, impactType: "modification", impactDescription: "API version upgrade required" },
      { changeRequestId: insertedCRs[0].id, applicationId: insertedApps[2].id, impactType: "testing", impactDescription: "Integration testing needed" },
      
      // CR-002: Real-time Inventory
      { changeRequestId: insertedCRs[1].id, applicationId: insertedApps[5].id, impactType: "modification", impactDescription: "Implement streaming publisher" },
      { changeRequestId: insertedCRs[1].id, applicationId: insertedApps[6].id, impactType: "modification", impactDescription: "Implement streaming consumer" },
      
      // CR-004: Decommission Legacy
      { changeRequestId: insertedCRs[3].id, applicationId: insertedApps[19].id, impactType: "decommission", impactDescription: "System to be retired" },
      { changeRequestId: insertedCRs[3].id, applicationId: insertedApps[4].id, impactType: "modification", impactDescription: "Remove legacy integration" }
    ];

    const crInterfaceLinks = [
      // CR-001: Payment Gateway Upgrade
      { changeRequestId: insertedCRs[0].id, interfaceId: insertedInterfaces[6].id, impactType: "version_change", impactDescription: "Upgrade to v4.0" },
      
      // CR-002: Real-time Inventory
      { changeRequestId: insertedCRs[1].id, interfaceId: insertedInterfaces[2].id, impactType: "modification", impactDescription: "Change from batch to streaming" },
      { changeRequestId: insertedCRs[1].id, interfaceId: insertedInterfaces[22].id, impactType: "modification", impactDescription: "Add real-time sync" },
      
      // CR-004: Decommission Legacy
      { changeRequestId: insertedCRs[3].id, interfaceId: insertedInterfaces[19].id, impactType: "deprecation", impactDescription: "Interface to be retired" },
      
      // CR-005: OAuth Implementation
      { changeRequestId: insertedCRs[4].id, interfaceId: insertedInterfaces[0].id, impactType: "modification", impactDescription: "Add OAuth support" },
      { changeRequestId: insertedCRs[4].id, interfaceId: insertedInterfaces[28].id, impactType: "modification", impactDescription: "Replace basic auth" }
    ];

    await db.insert(changeRequestApplications).values(crApplicationLinks);
    await db.insert(changeRequestInterfaces).values(crInterfaceLinks);
    console.log("✓ Created change request impact mappings");

    // Create 20 conversations
    const conversationsData = [
      {
        title: "Payment Gateway 3D Secure 2.0 Implementation",
        description: "Discussion about implementing new authentication requirements for payment processing",
        status: "open",
        priority: "high",
        createdBy: "robert.wilson@company.com",
        assignedTo: "mike.chen@company.com",
        createdAt: new Date("2024-01-15"),
        updatedAt: new Date("2024-02-10")
      },
      {
        title: "Customer API Performance Degradation",
        description: "Investigating slow response times reported by multiple consumers of the customer API",
        status: "resolved",
        priority: "critical",
        createdBy: "support@company.com",
        assignedTo: "john.architect@company.com",
        createdAt: new Date("2024-02-01"),
        updatedAt: new Date("2024-02-05"),
        resolvedAt: new Date("2024-02-05")
      },
      {
        title: "Inventory Sync Data Discrepancies",
        description: "Warehouse reporting mismatches between system inventory and physical counts",
        status: "open",
        priority: "high",
        createdBy: "warehouse.manager@company.com",
        assignedTo: "lisa.anderson@company.com",
        createdAt: new Date("2024-02-08"),
        updatedAt: new Date("2024-02-12")
      },
      {
        title: "New Business Process Integration Requirements",
        description: "Planning session for integrating returns management process with existing systems",
        status: "pending",
        priority: "medium",
        createdBy: "david.analyst@company.com",
        assignedTo: "sarah.pm@company.com",
        createdAt: new Date("2024-01-20"),
        updatedAt: new Date("2024-02-15")
      },
      {
        title: "Mobile API GraphQL Migration Strategy",
        description: "Technical discussion on migrating mobile APIs from REST to GraphQL",
        status: "open",
        priority: "medium",
        createdBy: "mobile.lead@company.com",
        assignedTo: "mike.dev@company.com",
        createdAt: new Date("2024-02-05"),
        updatedAt: new Date("2024-02-11")
      },
      {
        title: "Security Audit Findings - Authentication",
        description: "Addressing security audit findings related to API authentication mechanisms",
        status: "closed",
        priority: "critical",
        createdBy: "security.auditor@company.com",
        assignedTo: "john.architect@company.com",
        createdAt: new Date("2023-12-10"),
        updatedAt: new Date("2024-01-05"),
        resolvedAt: new Date("2024-01-05")
      },
      {
        title: "Order Processing Interface Enhancement",
        description: "Customer requesting support for bulk order processing and partial shipments",
        status: "open",
        priority: "medium",
        createdBy: "customer.success@company.com",
        assignedTo: "mike.dev@company.com",
        createdAt: new Date("2024-02-10"),
        updatedAt: new Date("2024-02-12")
      },
      {
        title: "Data Warehouse Performance Issues",
        description: "Analytics team reporting slow query performance during peak hours",
        status: "pending",
        priority: "high",
        createdBy: "analytics.team@company.com",
        assignedTo: "john.architect@company.com",
        createdAt: new Date("2024-02-07"),
        updatedAt: new Date("2024-02-11")
      },
      {
        title: "Legacy System Migration Planning",
        description: "Discussing timeline and approach for migrating off legacy billing system",
        status: "open",
        priority: "medium",
        createdBy: "finance.director@company.com",
        assignedTo: "sarah.pm@company.com",
        createdAt: new Date("2024-01-25"),
        updatedAt: new Date("2024-02-10")
      },
      {
        title: "Notification Service Delivery Issues",
        description: "Some customers not receiving email notifications for order updates",
        status: "resolved",
        priority: "high",
        createdBy: "support@company.com",
        assignedTo: "mike.dev@company.com",
        createdAt: new Date("2024-02-03"),
        updatedAt: new Date("2024-02-06"),
        resolvedAt: new Date("2024-02-06")
      },
      {
        title: "Partner API Rate Limiting Requirements",
        description: "Partner requesting increased rate limits for their integration",
        status: "open",
        priority: "low",
        createdBy: "partner@external.com",
        assignedTo: "john.architect@company.com",
        createdAt: new Date("2024-02-09"),
        updatedAt: new Date("2024-02-10")
      },
      {
        title: "Marketing Automation Integration Issues",
        description: "Lead sync failing intermittently between marketing platform and CRM",
        status: "open",
        priority: "medium",
        createdBy: "marketing.ops@company.com",
        assignedTo: "lisa.test@company.com",
        createdAt: new Date("2024-02-11"),
        updatedAt: new Date("2024-02-12")
      },
      {
        title: "GDPR Compliance for Customer Data API",
        description: "Implementing data privacy requirements for customer data access",
        status: "closed",
        priority: "high",
        createdBy: "legal@company.com",
        assignedTo: "john.architect@company.com",
        createdAt: new Date("2024-01-10"),
        updatedAt: new Date("2024-01-30"),
        resolvedAt: new Date("2024-01-30")
      },
      {
        title: "Mobile Push Notification Delays",
        description: "Users reporting delays in receiving push notifications",
        status: "resolved",
        priority: "medium",
        createdBy: "mobile.support@company.com",
        assignedTo: "mike.dev@company.com",
        createdAt: new Date("2024-02-04"),
        updatedAt: new Date("2024-02-07"),
        resolvedAt: new Date("2024-02-07")
      },
      {
        title: "HR System Integration Planning",
        description: "Planning integration between new HR system and existing infrastructure",
        status: "pending",
        priority: "medium",
        createdBy: "hr.director@company.com",
        assignedTo: "sarah.pm@company.com",
        createdAt: new Date("2024-01-30"),
        updatedAt: new Date("2024-02-08")
      },
      {
        title: "E-commerce Checkout Flow Issues",
        description: "Customers experiencing errors during payment processing",
        status: "open",
        priority: "critical",
        createdBy: "support@company.com",
        assignedTo: "mike.chen@company.com",
        createdAt: new Date("2024-02-12"),
        updatedAt: new Date("2024-02-12")
      },
      {
        title: "Business Intelligence Dashboard Requirements",
        description: "Gathering requirements for new executive dashboard",
        status: "open",
        priority: "low",
        createdBy: "executive.assistant@company.com",
        assignedTo: "david.analyst@company.com",
        createdAt: new Date("2024-02-06"),
        updatedAt: new Date("2024-02-10")
      },
      {
        title: "Contact Center Integration Upgrade",
        description: "Planning upgrade to support omnichannel customer interactions",
        status: "pending",
        priority: "medium",
        createdBy: "contact.center@company.com",
        assignedTo: "sarah.pm@company.com",
        createdAt: new Date("2024-01-28"),
        updatedAt: new Date("2024-02-05")
      },
      {
        title: "API Documentation Update Request",
        description: "Partners requesting updated documentation for recent API changes",
        status: "closed",
        priority: "low",
        createdBy: "partner.success@company.com",
        assignedTo: "mike.dev@company.com",
        createdAt: new Date("2024-01-15"),
        updatedAt: new Date("2024-01-20"),
        resolvedAt: new Date("2024-01-20")
      },
      {
        title: "Inventory Replenishment Algorithm Review",
        description: "Reviewing and optimizing the automatic replenishment calculations",
        status: "open",
        priority: "medium",
        createdBy: "supply.chain@company.com",
        assignedTo: "lisa.anderson@company.com",
        createdAt: new Date("2024-02-08"),
        updatedAt: new Date("2024-02-11")
      }
    ];

    const insertedConversations = await db.insert(conversations).values(conversationsData).returning();
    console.log("✓ Created 20 conversations");

    // Create conversation links
    const conversationLinksData = [
      // Payment Gateway discussion
      { conversationId: insertedConversations[0].id, entityType: "change_request", entityId: insertedCRs[0].id },
      { conversationId: insertedConversations[0].id, entityType: "interface", entityId: insertedInterfaces[6].id },
      { conversationId: insertedConversations[0].id, entityType: "application", entityId: insertedApps[3].id },
      
      // Customer API Performance
      { conversationId: insertedConversations[1].id, entityType: "interface", entityId: insertedInterfaces[0].id },
      { conversationId: insertedConversations[1].id, entityType: "application", entityId: insertedApps[0].id },
      
      // Inventory Sync Issues
      { conversationId: insertedConversations[2].id, entityType: "interface", entityId: insertedInterfaces[2].id },
      { conversationId: insertedConversations[2].id, entityType: "change_request", entityId: insertedCRs[1].id },
      { conversationId: insertedConversations[2].id, entityType: "business_process", entityId: insertedBPs[2].id },
      
      // Returns Process
      { conversationId: insertedConversations[3].id, entityType: "business_process", entityId: insertedBPs[8].id },
      { conversationId: insertedConversations[3].id, entityType: "interface", entityId: insertedInterfaces[18].id },
      
      // Mobile API Migration
      { conversationId: insertedConversations[4].id, entityType: "change_request", entityId: insertedCRs[2].id },
      { conversationId: insertedConversations[4].id, entityType: "application", entityId: insertedApps[17].id },
      
      // Security Audit
      { conversationId: insertedConversations[5].id, entityType: "change_request", entityId: insertedCRs[4].id },
      { conversationId: insertedConversations[5].id, entityType: "application", entityId: insertedApps[15].id },
      
      // Order Processing Enhancement
      { conversationId: insertedConversations[6].id, entityType: "interface", entityId: insertedInterfaces[1].id },
      { conversationId: insertedConversations[6].id, entityType: "business_process", entityId: insertedBPs[1].id },
      
      // Data Warehouse Performance
      { conversationId: insertedConversations[7].id, entityType: "application", entityId: insertedApps[10].id },
      { conversationId: insertedConversations[7].id, entityType: "change_request", entityId: insertedCRs[6].id },
      
      // Legacy Migration
      { conversationId: insertedConversations[8].id, entityType: "application", entityId: insertedApps[19].id },
      { conversationId: insertedConversations[8].id, entityType: "change_request", entityId: insertedCRs[3].id },
      
      // Notification Issues
      { conversationId: insertedConversations[9].id, entityType: "interface", entityId: insertedInterfaces[7].id },
      { conversationId: insertedConversations[9].id, entityType: "application", entityId: insertedApps[18].id },
      
      // Partner API Limits
      { conversationId: insertedConversations[10].id, entityType: "change_request", entityId: insertedCRs[9].id },
      
      // Marketing Integration
      { conversationId: insertedConversations[11].id, entityType: "interface", entityId: insertedInterfaces[9].id },
      { conversationId: insertedConversations[11].id, entityType: "business_process", entityId: insertedBPs[6].id },
      
      // GDPR Compliance
      { conversationId: insertedConversations[12].id, entityType: "interface", entityId: insertedInterfaces[0].id },
      { conversationId: insertedConversations[12].id, entityType: "application", entityId: insertedApps[0].id },
      
      // Push Notification
      { conversationId: insertedConversations[13].id, entityType: "interface", entityId: insertedInterfaces[29].id },
      
      // HR Integration
      { conversationId: insertedConversations[14].id, entityType: "business_process", entityId: insertedBPs[5].id },
      
      // Checkout Issues
      { conversationId: insertedConversations[15].id, entityType: "interface", entityId: insertedInterfaces[6].id },
      { conversationId: insertedConversations[15].id, entityType: "application", entityId: insertedApps[2].id },
      
      // BI Dashboard
      { conversationId: insertedConversations[16].id, entityType: "business_process", entityId: insertedBPs[9].id },
      
      // Contact Center
      { conversationId: insertedConversations[17].id, entityType: "application", entityId: insertedApps[8].id },
      
      // API Documentation
      { conversationId: insertedConversations[18].id, entityType: "interface", entityId: insertedInterfaces[0].id },
      
      // Inventory Algorithm
      { conversationId: insertedConversations[19].id, entityType: "business_process", entityId: insertedBPs[2].id },
      { conversationId: insertedConversations[19].id, entityType: "application", entityId: insertedApps[5].id }
    ];

    await db.insert(conversationLinks).values(conversationLinksData);
    console.log("✓ Created conversation links");

    // Create participants
    const participantsData = [
      // Payment Gateway discussion participants
      { conversationId: insertedConversations[0].id, participantName: "Robert Wilson", participantRole: "customer" },
      { conversationId: insertedConversations[0].id, participantName: "Mike Chen", participantRole: "vendor" },
      { conversationId: insertedConversations[0].id, participantName: "Payment Provider Rep", participantRole: "vendor" },
      
      // Customer API Performance participants
      { conversationId: insertedConversations[1].id, participantName: "Support Team", participantRole: "customer" },
      { conversationId: insertedConversations[1].id, participantName: "John Smith", participantRole: "architect" },
      { conversationId: insertedConversations[1].id, participantName: "DevOps Team", participantRole: "vendor" },
      
      // Inventory Sync participants
      { conversationId: insertedConversations[2].id, participantName: "Warehouse Manager", participantRole: "customer" },
      { conversationId: insertedConversations[2].id, participantName: "Lisa Anderson", participantRole: "vendor" },
      { conversationId: insertedConversations[2].id, participantName: "Integration Team", participantRole: "vendor" },
      
      // Business Process participants
      { conversationId: insertedConversations[3].id, participantName: "David Brown", participantRole: "customer" },
      { conversationId: insertedConversations[3].id, participantName: "Sarah Johnson", participantRole: "pm" },
      { conversationId: insertedConversations[3].id, participantName: "Business Analyst", participantRole: "analyst" },
      
      // Mobile API participants
      { conversationId: insertedConversations[4].id, participantName: "Mobile Team Lead", participantRole: "customer" },
      { conversationId: insertedConversations[4].id, participantName: "Mike Chen", participantRole: "vendor" },
      
      // E-commerce checkout participants
      { conversationId: insertedConversations[15].id, participantName: "Customer Support", participantRole: "customer" },
      { conversationId: insertedConversations[15].id, participantName: "Payment Team", participantRole: "vendor" },
      { conversationId: insertedConversations[15].id, participantName: "E-commerce Team", participantRole: "vendor" }
    ];

    await db.insert(conversationParticipants).values(participantsData);
    console.log("✓ Created conversation participants");

    // Create communication comments
    const commentsData = [
      // Payment Gateway discussion comments
      {
        conversationId: insertedConversations[0].id,
        content: "We need to implement 3D Secure 2.0 by March 31st to comply with new regulations. This will affect all card payments processed through our platform.",
        author: "robert.wilson@company.com",
        createdAt: new Date("2024-01-15T10:00:00")
      },
      {
        conversationId: insertedConversations[0].id,
        content: "I've reviewed the payment gateway documentation. The upgrade will require:\n1. Updating to API v4.0\n2. Implementing the new authentication flow\n3. Updating our checkout UI to handle 3DS challenges\n4. Extensive testing with various card types",
        author: "mike.chen@company.com",
        createdAt: new Date("2024-01-16T14:30:00")
      },
      {
        conversationId: insertedConversations[0].id,
        content: "The payment provider has confirmed they can provide a test environment by January 25th. We should plan for at least 2 weeks of testing before the production rollout.",
        author: "payment.rep@provider.com",
        createdAt: new Date("2024-01-17T09:15:00")
      },
      
      // Customer API Performance comments
      {
        conversationId: insertedConversations[1].id,
        content: "We're seeing response times exceeding 5 seconds for customer profile API calls during peak hours (9 AM - 5 PM EST). Multiple customers have reported timeouts affecting their operations.",
        author: "support@company.com",
        createdAt: new Date("2024-02-01T08:00:00")
      },
      {
        conversationId: insertedConversations[1].id,
        content: "I've analyzed the API performance metrics. The issue appears to be:\n- Database connection pool exhaustion\n- Lack of caching for frequently accessed data\n- Missing database indexes on customer_id fields\n\nI'm implementing fixes now.",
        author: "john.architect@company.com",
        createdAt: new Date("2024-02-01T11:30:00")
      },
      {
        conversationId: insertedConversations[1].id,
        content: "Performance improvements have been deployed:\n- Increased connection pool size\n- Added Redis caching layer\n- Created necessary indexes\n\nResponse times are now averaging 200ms. Will continue monitoring.",
        author: "john.architect@company.com",
        createdAt: new Date("2024-02-05T16:00:00")
      },
      
      // Inventory Sync comments
      {
        conversationId: insertedConversations[2].id,
        content: "We're experiencing significant discrepancies between system inventory and physical counts:\n- SKU-12345: System shows 150, actual is 142\n- SKU-67890: System shows 75, actual is 81\n- SKU-54321: System shows 200, actual is 195\n\nThis is causing order fulfillment issues.",
        author: "warehouse.manager@company.com",
        createdAt: new Date("2024-02-08T07:30:00")
      },
      {
        conversationId: insertedConversations[2].id,
        content: "I've identified a race condition in our inventory update process. When multiple orders are processed simultaneously, some inventory decrements are being lost. Working on implementing proper locking mechanism.",
        author: "lisa.anderson@company.com",
        createdAt: new Date("2024-02-08T14:00:00")
      },
      {
        conversationId: insertedConversations[2].id,
        content: "The real-time inventory sync project (CR-2024-002) should address these issues. We're moving from batch updates to event streaming with exactly-once delivery guarantees.",
        author: "lisa.anderson@company.com",
        createdAt: new Date("2024-02-09T10:00:00")
      },
      
      // Order Enhancement comments
      {
        conversationId: insertedConversations[6].id,
        content: "Our B2B customers are requesting the ability to:\n1. Submit orders with 100+ line items in a single request\n2. Track partial shipments for large orders\n3. Receive automated notifications for each shipment\n\nThis is becoming a competitive disadvantage.",
        author: "customer.success@company.com",
        createdAt: new Date("2024-02-10T09:00:00")
      },
      {
        conversationId: insertedConversations[6].id,
        content: "I can implement bulk order processing by:\n- Adding a new bulk endpoint that accepts order arrays\n- Implementing batch processing with transaction support\n- Adding webhook notifications for shipment updates\n\nEstimated effort: 3 weeks",
        author: "mike.dev@company.com",
        createdAt: new Date("2024-02-11T15:30:00")
      },
      
      // E-commerce Checkout Issue
      {
        conversationId: insertedConversations[15].id,
        content: "URGENT: Multiple customers reporting payment failures at checkout. Error rate has spiked to 15% in the last hour. This is causing significant revenue impact.",
        author: "support@company.com",
        createdAt: new Date("2024-02-12T14:00:00")
      },
      {
        conversationId: insertedConversations[15].id,
        content: "I'm seeing timeout errors from the payment gateway. It looks like they're experiencing high latency. I've increased our timeout threshold and implemented retry logic as a temporary fix.",
        author: "mike.chen@company.com",
        createdAt: new Date("2024-02-12T14:30:00")
      },
      {
        conversationId: insertedConversations[15].id,
        content: "Payment provider has confirmed they had a partial outage. They've resolved the issue on their end. Our retry logic helped minimize the impact. Error rate is back to normal at 0.5%.",
        author: "payment.team@company.com",
        createdAt: new Date("2024-02-12T16:00:00")
      },
      
      // Legacy Migration Planning
      {
        conversationId: insertedConversations[8].id,
        content: "The legacy billing system is costing us $20k/month in maintenance and poses significant security risks. We need to accelerate the migration timeline.",
        author: "finance.director@company.com",
        createdAt: new Date("2024-01-25T10:00:00")
      },
      {
        conversationId: insertedConversations[8].id,
        content: "Migration plan:\n1. Phase 1 (Feb): Migrate historical data\n2. Phase 2 (Mar): Parallel run with data validation\n3. Phase 3 (Apr): Migrate active accounts\n4. Phase 4 (May): Decommission legacy system\n\nRisk: Some legacy interfaces may need updates.",
        author: "sarah.pm@company.com",
        createdAt: new Date("2024-01-26T14:00:00")
      },
      
      // Marketing Integration Issue
      {
        conversationId: insertedConversations[11].id,
        content: "Lead sync between Marketing Automation and CRM is failing intermittently. About 20% of leads are not being transferred, causing follow-up delays.",
        author: "marketing.ops@company.com",
        createdAt: new Date("2024-02-11T11:00:00")
      },
      {
        conversationId: insertedConversations[11].id,
        content: "I've found the issue - the marketing platform is rate limiting our API calls during bulk syncs. I'll implement exponential backoff and batch processing to stay within limits.",
        author: "lisa.test@company.com",
        createdAt: new Date("2024-02-12T09:30:00")
      }
    ];

    await db.insert(communicationComments).values(commentsData);
    console.log("✓ Created communication comments");

    console.log("\n✅ Realistic test data seeding completed successfully!");
    console.log("\nDatabase now contains:");
    console.log("- 6 users (admin, architects, PMs, developers, testers)");
    console.log("- 20 realistic applications across different business domains");
    console.log("- 30 interfaces with detailed technical specifications");
    console.log("- 10 business processes mapped to interfaces");
    console.log("- 10 change requests in various states");
    console.log("- 20 conversations with realistic discussions");
    console.log("- Multiple comments showing real-world scenarios");
    
    console.log("\nYou can now login with:");
    console.log("- Username: admin, Password: admin123");
    console.log("- Username: john.architect, Password: password123");
    console.log("- Username: sarah.pm, Password: password123");
    console.log("- Username: mike.dev, Password: password123");

  } catch (error) {
    console.error("❌ Error seeding realistic data:", error);
  } finally {
    await pool.end();
  }
}

seedRealisticData();