# TM Forum Domain View Implementation Guide

## Overview

This document describes the implementation of TM Forum Domain-specific views for the Application Interface Tracker. The implementation enables architects to visualize and analyze their application architecture from a TM Forum domain perspective, following the Open Digital Architecture (ODA) principles.

## Implementation Summary

### 1. Database Schema Updates

Added TM Forum domain classification fields to support domain-based categorization and analysis:

#### Applications Table
- `tmfDomain` (text): TM Forum domain classification
  - Values: product, customer, service, resource, partner, enterprise
- `tmfSubDomain` (text): More specific sub-domain classification
- `tmfProcessArea` (text): eTOM process area mapping
- `tmfCapability` (text): Specific capability within the domain

#### Interfaces Table
- `tmfIntegrationPattern` (text): Standard TM Forum integration pattern used
- `tmfDomainInteraction` (text): Type of domain interaction (e.g., "service-to-resource", "product-to-service")

#### Business Processes Table
- `tmfEtomL1` (text): Level 1 eTOM process (e.g., "Operations")
- `tmfEtomL2` (text): Level 2 eTOM process (e.g., "Service Management & Operations")
- `tmfEtomL3` (text): Level 3 eTOM process (e.g., "Service Configuration & Activation")
- `tmfEtomL4` (text): Level 4 eTOM process (specific activity)

### 2. TM Forum Domain View Page

**Location**: `/tmf-domain-view`

A comprehensive visualization page with three view modes:

#### Domain View
- Applications organized by TM Forum domains
- Color-coded swim lanes for each domain
- Visual representation of inter-domain interfaces
- Domain filtering capabilities

#### Interaction View
- Aggregated view showing domain-to-domain interactions
- Interface count and types between domains
- Helps identify integration complexity between domains

#### Process View
- Applications grouped by business processes
- Shows end-to-end process flows
- Placeholder for future eTOM process mapping

**Key Features:**
- Interactive React Flow diagram
- Export to PNG functionality
- Real-time filtering by domain
- Toggle swim lanes on/off
- Mini-map for navigation

### 3. Domain-Based Reporting

Enhanced the Reports section with TM Forum domain analytics:

#### Domain Distribution
- Bar charts showing application count by domain
- Pie chart for overall domain distribution
- Active vs. total application metrics

#### Cross-Domain Interactions
- Matrix view of domain-to-domain interfaces
- Identifies integration patterns
- Highlights cross-domain dependencies

#### Capabilities Overview
- Lists capabilities by domain
- Shows capability coverage gaps
- Helps with capability planning

**Export Functionality:**
- CSV export for all report data
- Formatted for further analysis in Excel

### 4. Integration Patterns Guide

Comprehensive reference for TM Forum standard integration patterns:

#### Patterns Included:
1. **API Gateway Pattern**
   - Centralized API management
   - Security and rate limiting
   - TMF APIs: TMF640, TMF641, TMF642

2. **Event-Driven Integration**
   - Asynchronous communication
   - Event streaming
   - TMF APIs: TMF688, TMF724

3. **Service Mesh Pattern**
   - Microservices communication
   - Service discovery
   - TMF APIs: TMF640, TMF639

4. **Data Federation Pattern**
   - Virtual data integration
   - Unified data access
   - TMF APIs: TMF620, TMF622

5. **Process Orchestration**
   - Cross-domain workflows
   - State management
   - TMF APIs: TMF641, TMF640, TMF633

Each pattern includes:
- Applicable domains
- Key characteristics
- Implementation guidelines
- Security considerations
- Best practices

### 5. UI/UX Enhancements

#### Application Form Updates
- Added TM Forum Domain Classification section
- Domain selection dropdown
- Free-text fields for sub-domain, process area, and capability

#### Navigation
- Added "TM Forum View" menu item in sidebar under Analysis section
- Icon: Layers (representing domain layers)

#### Reports Page Transformation
- Converted from placeholder to functional reports page
- Tabbed interface for different report types
- Clean, modern design with proper data visualization

## Domain Color Scheme

Consistent color coding across all views:
- **Product**: Purple (#8B5CF6)
- **Customer**: Green (#10B981)
- **Service**: Blue (#3B82F6)
- **Resource**: Amber (#F59E0B)
- **Partner**: Pink (#EC4899)
- **Enterprise**: Gray (#6B7280)

## Usage Instructions

### 1. Classify Applications
1. Navigate to Applications (AML)
2. Edit an application
3. Scroll to "TM Forum Domain Classification" section
4. Select appropriate domain and fill in details
5. Save changes

### 2. View Domain Architecture
1. Navigate to "TM Forum View" in sidebar
2. Choose view type (Domain, Interaction, or Process)
3. Use filters to focus on specific domains
4. Toggle swim lanes for clearer visualization
5. Export diagram as PNG for presentations

### 3. Generate Domain Reports
1. Navigate to Reports
2. Select "TM Forum Domain" tab
3. Review distribution charts and interaction matrix
4. Export data as CSV for further analysis

### 4. Reference Integration Patterns
1. In TM Forum View, click "Integration Patterns"
2. Browse different pattern types
3. Review implementation guidelines
4. Note relevant TMF Open APIs

## Technical Implementation Details

### Frontend Components
- `/client/src/pages/tmf-domain-view.tsx` - Main visualization page
- `/client/src/components/reports/tmf-domain-report.tsx` - Domain reporting component
- `/client/src/components/tmf-integration-patterns.tsx` - Integration patterns guide
- `/client/src/components/applications/application-form.tsx` - Updated with TM Forum fields

### Database Migration
- `/migrations/add_tmf_domain_fields.sql` - SQL migration for new fields

### Key Technologies Used
- React Flow - For interactive diagrams
- Recharts - For data visualization
- React Query - For data fetching
- Tailwind CSS - For styling

## Benefits

1. **Architecture Alignment**: Align IT architecture with TM Forum standards
2. **Domain Visibility**: Clear visualization of domain boundaries and interactions
3. **Integration Planning**: Identify integration patterns and complexity
4. **Standards Compliance**: Follow TM Forum ODA principles
5. **Communication Tool**: Export capabilities for stakeholder presentations

## Future Enhancements

1. **eTOM Process Mapping**: Full integration with eTOM process hierarchy
2. **TAM Mapping**: Technical Architecture Mapping
3. **ODA Component Mapping**: Map applications to ODA components
4. **Automated Pattern Detection**: AI-based pattern recognition
5. **Integration Health Scoring**: Rate integration quality against TM Forum standards

## Conclusion

This implementation provides a solid foundation for viewing and analyzing application architecture through the lens of TM Forum domains. It enables architects to ensure their systems align with industry standards while providing practical tools for day-to-day architecture management.