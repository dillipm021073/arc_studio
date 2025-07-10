# E-Commerce Platform - Business Scenario Guide

## 🏢 Business Context

You're managing the IT landscape for a modern e-commerce company that operates an online store. The platform consists of 10 interconnected applications that handle everything from customer authentication to order fulfillment and shipping.

## 🚀 Getting Started

### 1. Setup the System

```bash
# First, ensure your PostgreSQL is running on localhost:5432

# Apply database schema
npm run db:push

# Create default users (admin/admin123)
npm run db:seed

# Load the e-commerce business data
npm run db:seed-business

# Start the application
npm run dev
```

### 2. Login
- Navigate to http://localhost:5000
- Username: `admin`
- Password: `admin123`

## 📊 System Overview

### Applications in Our E-Commerce Platform:

1. **Order Management System (OMS)** - Core order processing
2. **Inventory Service** - Real-time stock management  
3. **Payment Gateway** - Secure payment processing
4. **Customer Portal** - Web storefront
5. **Shipping Service** - Carrier integrations
6. **Notification Service** - Multi-channel communications
7. **Analytics Engine** - Business intelligence
8. **Product Catalog** - Product information management
9. **User Authentication Service** - SSO and access control
10. **Warehouse Management System** - Legacy warehouse operations

### Key Interfaces (IMLs):
- **IML-2024-001**: Order Placement (OMS → Customer Portal)
- **IML-2024-002**: Inventory Check (Inventory → OMS) 
- **IML-2024-003**: Payment Processing (Payment Gateway → OMS)
- **IML-2024-004**: Order Fulfillment (OMS → Shipping via Message Queue)
- And 6 more interfaces connecting various systems

### Business Processes:
1. **Order to Cash** - Complete order lifecycle
2. **Return and Refund** - Customer returns handling
3. **Inventory Replenishment** - Stock management

## 🗺️ Navigation Guide

### 1. View the IML Diagram for Order Processing

1. Click **"Business Processes"** in the sidebar
2. Find **"Order to Cash"** in the list
3. Click the **Network icon** (🔗) on the right
4. You'll see the visual flow diagram showing:
   - User Authentication → Product Browse → Order Placement → Inventory Check → Payment → Fulfillment → Shipping Updates

**Try this:**
- Drag nodes to rearrange the flow
- Click on a node to see interface details in the right panel
- Use the "+" button in the palette to add more interfaces
- Save your changes with the "Save Diagram" button

### 2. Analyze Impact of Payment Gateway Upgrade

1. Click **"Enhanced Analysis"** in the sidebar
2. You'll see 4 role-based views:

#### Architect View:
- Shows 10 total systems, 10 interfaces
- Highlights 2 active changes (CR-2024-001 and CR-2024-002)
- Displays system dependencies and critical interfaces

#### Project Manager View:
1. Select "2024-02" from the release dropdown
2. See CR-2024-001 (Payment Gateway Upgrade) scheduled
3. View impacted systems: Payment Gateway and Order Management
4. Timeline shows it's approved and ready for implementation

#### Tester View:
- Shows 2 changes pending testing
- CR-2024-001 requires testing:
  - Payment Gateway API v4.0
  - Order Management payment integration
  - IML-2024-003 (Payment Processing interface)

#### Team Overview:
- See all 5 change requests with their current status
- Filter by status: Draft (1), Submitted (1), Approved (1), In Progress (1), Under Review (1)

### 3. Check Real-time Inventory Sync Progress

1. Go to **"Change Requests"** 
2. Find **CR-2024-002** "Implement Real-time Inventory Sync"
3. Status: **In Progress** (Critical Priority)
4. Click to see details:
   - Impacts: Inventory Service, Warehouse System, Order Management
   - Interfaces affected: IML-2024-002 (Inventory Check), IML-2024-009 (Warehouse Sync)
   - Target date: January 30, 2024

### 4. View Interface Details with Test Steps

1. Go to **"Interfaces (IML)"**
2. Click on **IML-2024-001** (Order Placement)
3. View the **Sample Code** tab showing:
   ```
   POST /api/v2/orders
   Authorization: Bearer {token}
   ```
4. Check **Connectivity Steps** for setup instructions
5. Review **Interface Test Steps** for validation procedures

### 5. Timeline Visualization

1. Click **"History View"** in the sidebar
2. Set date range to see changes over time
3. View the timeline showing:
   - When applications were first activated
   - Change request schedules
   - Interface modifications

### 6. Impact Analysis for Specific Application

1. Go to **"Impact Analysis"** (original view)
2. Select **"Application Impact"** tab
3. Choose **"Order Management System"**
4. See comprehensive impact:
   - 3 provided interfaces
   - 5 consumed interfaces  
   - Related applications
   - Active change requests affecting OMS

## 🔍 Key Scenarios to Explore

### Scenario 1: Payment Gateway Upgrade Impact
- **Change Request**: CR-2024-001
- **What's changing**: Upgrading from v3.0 to v4.0 for PCI compliance
- **Systems affected**: Payment Gateway, Order Management
- **Interface changes**: IML-2024-003 needs version update
- **Business impact**: Support for digital wallets (Apple Pay, Google Pay)

### Scenario 2: Real-time Inventory Implementation  
- **Change Request**: CR-2024-002
- **Current state**: Batch updates causing overselling
- **Target state**: Real-time synchronization
- **Critical path**: Warehouse System → Inventory Service → Order Management
- **Risk**: High - affects core order flow

### Scenario 3: Legacy System Deprecation
- **Change Request**: CR-2024-005 (Draft)
- **Target**: Deprecate IML-2024-009 (SOAP interface)
- **Reason**: Security vulnerabilities in legacy warehouse system
- **Migration path**: Replace with REST API

## 📈 Business Value Demonstrations

1. **For Architects**: 
   - View system dependencies in Enhanced Analysis
   - See which interfaces are critical (most connections)
   - Identify integration patterns

2. **For Project Managers**:
   - Track release progress by month
   - See systems impacted per release
   - Monitor change request timelines

3. **For Testers**:
   - Access test steps for each interface
   - View testing queue by priority
   - Check which systems need regression testing

4. **For Business Teams**:
   - Understand change impacts on business processes
   - See timeline of system evolution
   - Track implementation of new capabilities

## 💡 Tips for Demo

1. Start with the **Business Process diagram** to show the visual flow
2. Demonstrate a **real change impact** using CR-2024-001 (Payment upgrade)
3. Show how different roles see different views in **Enhanced Analysis**
4. Highlight the **sample code and test steps** in interfaces
5. Use the **timeline** to show system evolution over time

## 🎯 Key Takeaways

This system provides:
- **Visual representation** of complex system interactions
- **Impact analysis** before making changes
- **Role-based views** for different stakeholders
- **Complete traceability** from business process to technical interface
- **Change management** with full impact visibility

The e-commerce scenario demonstrates how the platform helps manage a real-world microservices architecture with multiple integration points, ongoing changes, and the need for careful impact analysis before any modification.