import 'dotenv/config';
import { db } from "./db";
import { 
  users, 
  applications, 
  interfaces, 
  businessProcesses,
  businessProcessInterfaces,
  changeRequests,
  changeRequestApplications,
  changeRequestInterfaces,
  interfaceComments,
  interfaceVersions
} from "@shared/schema";
import crypto from "crypto";

// Helper function for password hashing
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function seedBusinessData() {
  try {
    console.log("🌱 Seeding business data for E-Commerce Platform...");
    
    // Clear existing data (in reverse order of dependencies)
    await db.delete(interfaceVersions);
    await db.delete(interfaceComments);
    await db.delete(changeRequestInterfaces);
    await db.delete(changeRequestApplications);
    await db.delete(businessProcessInterfaces);
    await db.delete(changeRequests);
    await db.delete(interfaces);
    await db.delete(businessProcesses);
    await db.delete(applications);
    
    console.log("✅ Cleared existing business data");

    // Create Applications for E-Commerce Platform
    console.log("📦 Creating applications...");
    
    const [
      orderManagementSystem,
      inventoryService,
      paymentGateway,
      customerPortal,
      shippingService,
      notificationService,
      analyticsEngine,
      productCatalog,
      userAuthService,
      warehouseSystem
    ] = await db.insert(applications).values([
      {
        amlNumber: "AML-BUS-001",
        name: "Order Management System",
        description: "Core system for processing and managing customer orders",
        os: "Linux",
        deployment: "cloud",
        uptime: "99.95",
        purpose: "Manages the complete order lifecycle from placement to fulfillment",
        providesExtInterface: true,
        provInterfaceType: "REST API, Message Queue",
        consumesExtInterfaces: true,
        consInterfaceType: "REST API, Database",
        status: "active",
        firstActiveDate: new Date("2020-01-15"),
      },
      {
        amlNumber: "AML-BUS-002",
        name: "Inventory Service",
        description: "Real-time inventory tracking and management system",
        os: "Linux",
        deployment: "cloud",
        uptime: "99.90",
        purpose: "Tracks product availability and manages stock levels across warehouses",
        providesExtInterface: true,
        provInterfaceType: "REST API, GraphQL",
        consumesExtInterfaces: true,
        consInterfaceType: "Database, Message Queue",
        status: "active",
        firstActiveDate: new Date("2020-03-01"),
      },
      {
        amlNumber: "AML-BUS-003",
        name: "Payment Gateway",
        description: "Secure payment processing system supporting multiple payment methods",
        os: "Linux",
        deployment: "cloud",
        uptime: "99.99",
        purpose: "Processes payments, refunds, and manages transaction security",
        providesExtInterface: true,
        provInterfaceType: "REST API",
        consumesExtInterfaces: true,
        consInterfaceType: "REST API",
        status: "active",
        firstActiveDate: new Date("2019-11-01"),
      },
      {
        amlNumber: "AML-BUS-004",
        name: "Customer Portal",
        description: "Web application for customer interactions and self-service",
        os: "Linux",
        deployment: "cloud",
        uptime: "99.85",
        purpose: "Provides customer-facing interface for browsing, ordering, and account management",
        providesExtInterface: false,
        provInterfaceType: null,
        consumesExtInterfaces: true,
        consInterfaceType: "REST API, GraphQL",
        status: "active",
        firstActiveDate: new Date("2019-10-01"),
      },
      {
        amlNumber: "AML-BUS-005",
        name: "Shipping Service",
        description: "Integration with shipping carriers and tracking management",
        os: "Windows",
        deployment: "on-premise",
        uptime: "99.80",
        purpose: "Manages shipping labels, tracking, and carrier integrations",
        providesExtInterface: true,
        provInterfaceType: "REST API, SOAP",
        consumesExtInterfaces: true,
        consInterfaceType: "REST API, SOAP",
        status: "active",
        firstActiveDate: new Date("2020-06-15"),
      },
      {
        amlNumber: "AML-BUS-006",
        name: "Notification Service",
        description: "Multi-channel notification system (Email, SMS, Push)",
        os: "Linux",
        deployment: "cloud",
        uptime: "99.70",
        purpose: "Sends transactional and marketing notifications to customers",
        providesExtInterface: true,
        provInterfaceType: "REST API, Message Queue",
        consumesExtInterfaces: true,
        consInterfaceType: "Message Queue",
        status: "active",
        firstActiveDate: new Date("2020-08-01"),
      },
      {
        amlNumber: "AML-BUS-007",
        name: "Analytics Engine",
        description: "Business intelligence and reporting platform",
        os: "Linux",
        deployment: "cloud",
        uptime: "99.50",
        purpose: "Provides real-time analytics and business insights",
        providesExtInterface: true,
        provInterfaceType: "REST API, GraphQL",
        consumesExtInterfaces: true,
        consInterfaceType: "Database, Message Queue",
        status: "active",
        firstActiveDate: new Date("2021-01-10"),
      },
      {
        amlNumber: "AML-BUS-008",
        name: "Product Catalog",
        description: "Master product information management system",
        os: "Linux",
        deployment: "cloud",
        uptime: "99.88",
        purpose: "Manages product information, categories, and pricing",
        providesExtInterface: true,
        provInterfaceType: "REST API, GraphQL",
        consumesExtInterfaces: true,
        consInterfaceType: "Database",
        status: "active",
        firstActiveDate: new Date("2019-09-01"),
      },
      {
        amlNumber: "AML-BUS-009",
        name: "User Authentication Service",
        description: "Centralized authentication and authorization service",
        os: "Linux",
        deployment: "cloud",
        uptime: "99.99",
        purpose: "Manages user authentication, sessions, and access control",
        providesExtInterface: true,
        provInterfaceType: "REST API",
        consumesExtInterfaces: false,
        consInterfaceType: null,
        status: "active",
        firstActiveDate: new Date("2019-08-15"),
      },
      {
        amlNumber: "AML-BUS-010",
        name: "Warehouse Management System",
        description: "Legacy system for warehouse operations",
        os: "Windows",
        deployment: "on-premise",
        uptime: "98.50",
        purpose: "Manages warehouse operations, picking, and packing",
        providesExtInterface: true,
        provInterfaceType: "SOAP, Database",
        consumesExtInterfaces: true,
        consInterfaceType: "SOAP",
        status: "maintenance",
        firstActiveDate: new Date("2018-01-01"),
      }
    ]).returning();

    console.log("✅ Created 10 applications");

    // Create Interfaces
    console.log("🔌 Creating interfaces...");
    
    const interfacesList = await db.insert(interfaces).values([
      {
        imlNumber: "IML-2024-001",
        providerApplicationId: orderManagementSystem.id,
        consumerApplicationId: customerPortal.id,
        interfaceType: "REST",
        middleware: "None",
        version: "2.1",
        businessProcessName: "Order Placement",
        customerFocal: "John Smith",
        providerOwner: "Order Team",
        consumerOwner: "Portal Team",
        status: "active",
        sampleCode: `// Order Creation Endpoint
POST /api/v2/orders
Headers: 
  Authorization: Bearer {token}
  Content-Type: application/json

Body:
{
  "customerId": "123456",
  "items": [
    {
      "productId": "PROD-001",
      "quantity": 2,
      "price": 29.99
    }
  ],
  "shippingAddress": {
    "street": "123 Main St",
    "city": "New York",
    "zipCode": "10001"
  }
}

Response: 
{
  "orderId": "ORD-789012",
  "status": "PENDING",
  "totalAmount": 59.98
}`,
        connectivitySteps: "1. Obtain API key from Order Management team\n2. Configure base URL: https://api.orders.company.com\n3. Test connectivity with GET /api/v2/health\n4. Verify authentication with sample order creation",
        interfaceTestSteps: "1. Create test customer account\n2. Add test products to cart\n3. Submit order via API\n4. Verify order appears in OMS\n5. Check inventory deduction\n6. Validate order status updates"
      },
      {
        imlNumber: "IML-2024-002",
        providerApplicationId: inventoryService.id,
        consumerApplicationId: orderManagementSystem.id,
        interfaceType: "GraphQL",
        middleware: "None",
        version: "1.0",
        businessProcessName: "Inventory Check",
        customerFocal: "Sarah Johnson",
        providerOwner: "Inventory Team",
        consumerOwner: "Order Team",
        status: "active",
        sampleCode: `# Inventory Query
query CheckInventory($productIds: [String!]!) {
  products(ids: $productIds) {
    id
    name
    availableQuantity
    warehouseStock {
      warehouseId
      quantity
      location
    }
  }
}

# Variables
{
  "productIds": ["PROD-001", "PROD-002"]
}`,
        connectivitySteps: "1. GraphQL endpoint: https://inventory.company.com/graphql\n2. Use Bearer token authentication\n3. Test with introspection query\n4. Verify schema access",
        interfaceTestSteps: "1. Query known product IDs\n2. Verify stock levels match database\n3. Test real-time updates after order\n4. Check warehouse distribution logic"
      },
      {
        imlNumber: "IML-2024-003",
        providerApplicationId: paymentGateway.id,
        consumerApplicationId: orderManagementSystem.id,
        interfaceType: "REST",
        version: "3.0",
        businessProcessName: "Payment Processing",
        customerFocal: "Mike Chen",
        providerOwner: "Payment Team",
        consumerOwner: "Order Team",
        status: "active",
        sampleCode: `// Process Payment
POST /api/v3/payments/charge
Headers:
  X-API-Key: {api_key}
  X-Idempotency-Key: {unique_key}

Body:
{
  "amount": 59.98,
  "currency": "USD",
  "orderId": "ORD-789012",
  "paymentMethod": {
    "type": "CARD",
    "token": "tok_visa_4242"
  }
}`,
        connectivitySteps: "1. Request API credentials from Payment team\n2. Configure webhook URLs for callbacks\n3. Test in sandbox environment first\n4. Verify SSL certificate pinning",
        interfaceTestSteps: "1. Test with test card numbers\n2. Verify success and failure scenarios\n3. Test refund functionality\n4. Validate webhook callbacks\n5. Check idempotency handling"
      },
      {
        imlNumber: "IML-2024-004",
        providerApplicationId: orderManagementSystem.id,
        consumerApplicationId: shippingService.id,
        interfaceType: "messaging",
        version: "1.5",
        businessProcessName: "Order Fulfillment",
        customerFocal: "Lisa Wong",
        providerOwner: "Order Team",
        consumerOwner: "Shipping Team",
        status: "active",
        sampleCode: `// RabbitMQ Message Format
Exchange: orders.events
Routing Key: order.ready_to_ship
Message:
{
  "eventType": "ORDER_READY_TO_SHIP",
  "timestamp": "2024-01-15T10:30:00Z",
  "orderId": "ORD-789012",
  "items": [...],
  "shippingDetails": {
    "method": "STANDARD",
    "address": {...}
  }
}`,
        connectivitySteps: "1. RabbitMQ connection: amqp://mq.company.com:5672\n2. Create queue binding to orders.events exchange\n3. Set up dead letter queue for failures\n4. Configure message TTL",
        interfaceTestSteps: "1. Publish test message to queue\n2. Verify message consumption\n3. Test retry mechanism\n4. Validate shipping label generation"
      },
      {
        imlNumber: "IML-2024-005",
        providerApplicationId: shippingService.id,
        consumerApplicationId: notificationService.id,
        interfaceType: "REST",
        version: "1.2",
        businessProcessName: "Shipping Updates",
        customerFocal: "Tom Davis",
        providerOwner: "Shipping Team",
        consumerOwner: "Notification Team",
        status: "active"
      },
      {
        imlNumber: "IML-2024-006",
        providerApplicationId: userAuthService.id,
        consumerApplicationId: customerPortal.id,
        interfaceType: "REST",
        version: "2.0",
        businessProcessName: "User Authentication",
        customerFocal: "Anna Lee",
        providerOwner: "Auth Team",
        consumerOwner: "Portal Team",
        status: "active"
      },
      {
        imlNumber: "IML-2024-007",
        providerApplicationId: productCatalog.id,
        consumerApplicationId: customerPortal.id,
        interfaceType: "GraphQL",
        version: "1.3",
        businessProcessName: "Product Browse",
        customerFocal: "David Kim",
        providerOwner: "Catalog Team",
        consumerOwner: "Portal Team",
        status: "active"
      },
      {
        imlNumber: "IML-2024-008",
        providerApplicationId: analyticsEngine.id,
        consumerApplicationId: orderManagementSystem.id,
        interfaceType: "REST",
        version: "1.0",
        businessProcessName: "Order Analytics",
        customerFocal: "Rachel Green",
        providerOwner: "Analytics Team",
        consumerOwner: "Order Team",
        status: "under_review"
      },
      {
        imlNumber: "IML-2024-009",
        providerApplicationId: warehouseSystem.id,
        consumerApplicationId: inventoryService.id,
        interfaceType: "SOAP",
        version: "1.0",
        businessProcessName: "Warehouse Sync",
        customerFocal: "Bob Wilson",
        providerOwner: "Warehouse Team",
        consumerOwner: "Inventory Team",
        status: "deprecated"
      },
      {
        imlNumber: "IML-2024-010",
        providerApplicationId: notificationService.id,
        consumerApplicationId: customerPortal.id,
        interfaceType: "messaging",
        version: "2.0",
        businessProcessName: "Customer Notifications",
        customerFocal: "Carol White",
        providerOwner: "Notification Team", 
        consumerOwner: "Portal Team",
        status: "active"
      }
    ]).returning();

    console.log("✅ Created 10 interfaces");

    // Create Business Processes
    console.log("💼 Creating business processes...");
    
    const [orderToCash, returnProcess, inventoryReplenishment] = await db.insert(businessProcesses).values([
      {
        businessProcess: "Order to Cash",
        lob: "E-Commerce",
        product: "Online Store",
        version: "2.0",
        domainOwner: "James Miller",
        itOwner: "Technology Operations",
        vendorFocal: "Acme Consulting",
        status: "active"
      },
      {
        businessProcess: "Return and Refund",
        lob: "E-Commerce", 
        product: "Customer Service",
        version: "1.5",
        domainOwner: "Patricia Brown",
        itOwner: "Technology Operations",
        vendorFocal: "Tech Solutions Inc",
        status: "active"
      },
      {
        businessProcess: "Inventory Replenishment",
        lob: "Supply Chain",
        product: "Warehouse Operations",
        version: "1.0",
        domainOwner: "Robert Taylor",
        itOwner: "Supply Chain IT",
        vendorFocal: null,
        status: "active"
      }
    ]).returning();

    console.log("✅ Created 3 business processes");

    // Map interfaces to business processes
    console.log("🔗 Mapping interfaces to business processes...");
    
    await db.insert(businessProcessInterfaces).values([
      // Order to Cash process flow
      { businessProcessId: orderToCash.id, interfaceId: interfacesList[5].id, sequenceNumber: 1 }, // User Auth
      { businessProcessId: orderToCash.id, interfaceId: interfacesList[6].id, sequenceNumber: 2 }, // Product Browse
      { businessProcessId: orderToCash.id, interfaceId: interfacesList[0].id, sequenceNumber: 3 }, // Order Placement
      { businessProcessId: orderToCash.id, interfaceId: interfacesList[1].id, sequenceNumber: 4 }, // Inventory Check
      { businessProcessId: orderToCash.id, interfaceId: interfacesList[2].id, sequenceNumber: 5 }, // Payment Processing
      { businessProcessId: orderToCash.id, interfaceId: interfacesList[3].id, sequenceNumber: 6 }, // Order Fulfillment
      { businessProcessId: orderToCash.id, interfaceId: interfacesList[4].id, sequenceNumber: 7 }, // Shipping Updates
      
      // Return process
      { businessProcessId: returnProcess.id, interfaceId: interfacesList[0].id, sequenceNumber: 1 },
      { businessProcessId: returnProcess.id, interfaceId: interfacesList[3].id, sequenceNumber: 2 },
      { businessProcessId: returnProcess.id, interfaceId: interfacesList[2].id, sequenceNumber: 3 },
      
      // Inventory replenishment
      { businessProcessId: inventoryReplenishment.id, interfaceId: interfacesList[8].id, sequenceNumber: 1 },
      { businessProcessId: inventoryReplenishment.id, interfaceId: interfacesList[1].id, sequenceNumber: 2 }
    ]);

    console.log("✅ Mapped interfaces to business processes");

    // Create Change Requests
    console.log("📝 Creating change requests...");
    
    const changeRequestsList = await db.insert(changeRequests).values([
      {
        crNumber: "CR-2024-001",
        title: "Upgrade Payment Gateway to v4.0",
        description: "Upgrade payment gateway to support new PCI DSS 4.0 compliance requirements and add support for digital wallets",
        reason: "Regulatory compliance and new payment method support",
        benefit: "Improved security, reduced transaction fees, support for Apple Pay and Google Pay",
        status: "approved",
        priority: "high",
        owner: "Mike Chen",
        requestedBy: "Finance Department",
        approvedBy: "CTO",
        targetDate: new Date("2024-02-15")
      },
      {
        crNumber: "CR-2024-002", 
        title: "Implement Real-time Inventory Sync",
        description: "Replace batch inventory updates with real-time synchronization between warehouse and inventory service",
        reason: "Reduce overselling incidents and improve customer experience",
        benefit: "99% reduction in overselling, real-time stock visibility",
        status: "in_progress",
        priority: "critical",
        owner: "Sarah Johnson",
        requestedBy: "Operations Team",
        approvedBy: "VP Operations",
        targetDate: new Date("2024-01-30")
      },
      {
        crNumber: "CR-2024-003",
        title: "Add Multi-language Support to Customer Portal",
        description: "Implement internationalization for Spanish, French, and German markets",
        reason: "Business expansion to European markets",
        benefit: "Access to 150M+ new potential customers",
        status: "submitted",
        priority: "medium",
        owner: "Portal Team",
        requestedBy: "Business Development",
        targetDate: new Date("2024-03-01")
      },
      {
        crNumber: "CR-2024-004",
        title: "Migrate Order Management to Kubernetes",
        description: "Containerize OMS and deploy on Kubernetes for better scalability",
        reason: "Current infrastructure reaching capacity limits",
        benefit: "Auto-scaling, improved reliability, 50% cost reduction",
        status: "under_review",
        priority: "high",
        owner: "DevOps Team",
        requestedBy: "Infrastructure Team",
        targetDate: new Date("2024-02-28")
      },
      {
        crNumber: "CR-2024-005",
        title: "Deprecate Legacy Warehouse SOAP Interface",
        description: "Replace SOAP interface with modern REST API",
        reason: "Legacy system maintenance burden and security vulnerabilities",
        benefit: "Reduced maintenance cost, improved performance",
        status: "draft",
        priority: "medium",
        owner: "Integration Team",
        requestedBy: "Security Team",
        targetDate: new Date("2024-04-01")
      }
    ]).returning();

    console.log("✅ Created 5 change requests");

    // Map Change Requests to Applications and Interfaces
    console.log("🔄 Creating change request impacts...");
    
    await db.insert(changeRequestApplications).values([
      // CR-001: Payment Gateway Upgrade
      { 
        changeRequestId: changeRequestsList[0].id, 
        applicationId: paymentGateway.id,
        impactType: "modification",
        impactDescription: "Core system upgrade to v4.0"
      },
      { 
        changeRequestId: changeRequestsList[0].id, 
        applicationId: orderManagementSystem.id,
        impactType: "modification", 
        impactDescription: "Update payment integration library"
      },
      
      // CR-002: Real-time Inventory
      { 
        changeRequestId: changeRequestsList[1].id, 
        applicationId: inventoryService.id,
        impactType: "modification",
        impactDescription: "Implement real-time event streaming"
      },
      { 
        changeRequestId: changeRequestsList[1].id, 
        applicationId: warehouseSystem.id,
        impactType: "modification",
        impactDescription: "Add webhook support for inventory changes"
      },
      { 
        changeRequestId: changeRequestsList[1].id, 
        applicationId: orderManagementSystem.id,
        impactType: "testing",
        impactDescription: "Regression testing for inventory checks"
      },
      
      // CR-003: Multi-language
      { 
        changeRequestId: changeRequestsList[2].id, 
        applicationId: customerPortal.id,
        impactType: "modification",
        impactDescription: "Add i18n framework and translations"
      },
      { 
        changeRequestId: changeRequestsList[2].id, 
        applicationId: notificationService.id,
        impactType: "modification",
        impactDescription: "Template updates for multiple languages"
      },
      
      // CR-004: Kubernetes Migration
      { 
        changeRequestId: changeRequestsList[3].id, 
        applicationId: orderManagementSystem.id,
        impactType: "modification",
        impactDescription: "Containerization and deployment changes"
      }
    ]);

    await db.insert(changeRequestInterfaces).values([
      // CR-001: Payment Gateway impacts
      { 
        changeRequestId: changeRequestsList[0].id, 
        interfaceId: interfacesList[2].id, // Payment Processing
        impactType: "version_change",
        impactDescription: "API version upgrade from v3.0 to v4.0"
      },
      
      // CR-002: Inventory impacts
      { 
        changeRequestId: changeRequestsList[1].id, 
        interfaceId: interfacesList[1].id, // Inventory Check
        impactType: "modification",
        impactDescription: "Add real-time subscription support"
      },
      { 
        changeRequestId: changeRequestsList[1].id, 
        interfaceId: interfacesList[8].id, // Warehouse Sync
        impactType: "modification",
        impactDescription: "Change from batch to real-time"
      },
      
      // CR-005: SOAP Deprecation
      { 
        changeRequestId: changeRequestsList[4].id, 
        interfaceId: interfacesList[8].id, // Warehouse SOAP
        impactType: "deprecation",
        impactDescription: "Interface will be retired"
      }
    ]);

    console.log("✅ Created change request impact mappings");

    // Add some interface comments
    console.log("💬 Adding interface comments...");
    
    await db.insert(interfaceComments).values([
      {
        interfaceId: interfacesList[2].id,
        comment: "Payment gateway experiencing intermittent timeouts. Vendor investigating.",
        author: "Mike Chen"
      },
      {
        interfaceId: interfacesList[1].id,
        comment: "Performance improved by 40% after adding Redis cache layer",
        author: "Sarah Johnson"
      },
      {
        interfaceId: interfacesList[8].id,
        comment: "Scheduled for deprecation in Q2 2024. Migration plan in progress.",
        author: "Integration Team"
      }
    ]);

    console.log("✅ Added interface comments");

    // Add interface versions
    console.log("📌 Creating interface version history...");
    
    await db.insert(interfaceVersions).values([
      {
        interfaceId: interfacesList[0].id,
        version: "2.0",
        changeDescription: "Added bulk order support",
        createdBy: "Order Team"
      },
      {
        interfaceId: interfacesList[0].id,
        version: "2.1", 
        changeDescription: "Added order status webhook",
        createdBy: "Order Team"
      },
      {
        interfaceId: interfacesList[2].id,
        version: "3.0",
        changeDescription: "PCI DSS 3.2.1 compliance update",
        createdBy: "Payment Team"
      }
    ]);

    console.log("✅ Created interface version history");

    console.log("\n🎉 Business data seeding completed successfully!");
    console.log("\n📊 Summary:");
    console.log("- 10 Applications (E-commerce platform)");
    console.log("- 10 Interfaces with sample code");
    console.log("- 3 Business Processes");
    console.log("- 5 Change Requests");
    console.log("- Impact mappings and relationships");
    
  } catch (error) {
    console.error("❌ Error seeding business data:", error);
    throw error;
  } finally {
    process.exit(0);
  }
}

seedBusinessData();