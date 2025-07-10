import { 
  applications, 
  interfaces, 
  changeRequests, 
  changeRequestApplications,
  changeRequestInterfaces,
  interfaceComments,
  users,
  businessProcesses,
  businessProcessInterfaces,
  businessProcessRelationships,
  interfaceVersions,
  interfaceConsumerDescriptions,
  imlDiagrams,
  conversations,
  conversationLinks,
  communicationComments,
  communicationAttachments,
  conversationParticipants,
  communicationMentions,
  technicalProcesses,
  technicalProcessInterfaces,
  technicalProcessDependencies,
  changeRequestTechnicalProcesses,
  changeRequestInternalActivities,
  internalActivities,
  roles,
  permissions,
  rolePermissions,
  userRoles,
  apiEndpoints,
  permissionAuditLog,
  userActivityLog,
  applicationCapabilities,
  uploadedDocuments,
  capabilities,
  capabilityExtractionHistory,
  type User, 
  type InsertUser,
  type Application,
  type InsertApplication,
  type Interface,
  type InsertInterface,
  type ChangeRequest,
  type InsertChangeRequest,
  type ChangeRequestApplication,
  type ChangeRequestInterface,
  type InterfaceComment,
  type InsertInterfaceComment,
  type InsertChangeRequestApplication,
  type InsertChangeRequestInterface,
  type BusinessProcess,
  type InsertBusinessProcess,
  type BusinessProcessInterface,
  type InsertBusinessProcessInterface,
  type BusinessProcessRelationship,
  type InsertBusinessProcessRelationship,
  type InterfaceVersion,
  type InsertInterfaceVersion,
  type InterfaceConsumerDescription,
  type InsertInterfaceConsumerDescription,
  type ImlDiagram,
  type InsertImlDiagram,
  type Conversation,
  type InsertConversation,
  type ConversationLink,
  type InsertConversationLink,
  type CommunicationComment,
  type InsertCommunicationComment,
  type CommunicationAttachment,
  type InsertCommunicationAttachment,
  type ConversationParticipant,
  type InsertConversationParticipant,
  type CommunicationMention,
  type InsertCommunicationMention,
  type TechnicalProcess,
  type InsertTechnicalProcess,
  type TechnicalProcessInterface,
  type InsertTechnicalProcessInterface,
  type TechnicalProcessDependency,
  type InsertTechnicalProcessDependency,
  type ChangeRequestTechnicalProcess,
  type InsertChangeRequestTechnicalProcess,
  type Role,
  type InsertRole,
  type Permission,
  type InsertPermission,
  type RolePermission,
  type InsertRolePermission,
  type UserRole,
  type InsertUserRole,
  type ApiEndpoint,
  type InsertApiEndpoint,
  type PermissionAuditLog,
  type InsertPermissionAuditLog,
  type UserActivityLog,
  type InsertUserActivityLog,
  type ApplicationCapability,
  type InsertApplicationCapability,
  type UploadedDocument,
  type InsertUploadedDocument,
  type Capability,
  type InsertCapability
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, gte, lte, desc, asc, inArray, count, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  validateUserPassword(userId: number, passwordHash: string): Promise<boolean>;
  
  // Applications
  getAllApplications(): Promise<Application[]>;
  getApplication(id: number): Promise<Application | undefined>;
  createApplication(application: InsertApplication): Promise<Application>;
  updateApplication(id: number, application: InsertApplication): Promise<Application | undefined>;
  deleteApplication(id: number): Promise<boolean>;
  
  // Interfaces
  getAllInterfaces(): Promise<Interface[]>;
  getInterface(id: number): Promise<Interface | undefined>;
  createInterface(interface_: InsertInterface): Promise<Interface>;
  updateInterface(id: number, interface_: InsertInterface): Promise<Interface | undefined>;
  deleteInterface(id: number): Promise<boolean>;
  getInterfaceComments(interfaceId: number): Promise<InterfaceComment[]>;
  addInterfaceComment(comment: InsertInterfaceComment): Promise<InterfaceComment>;
  
  // Change Requests
  getAllChangeRequests(): Promise<ChangeRequest[]>;
  getChangeRequest(id: number): Promise<ChangeRequest | undefined>;
  createChangeRequest(changeRequest: InsertChangeRequest): Promise<ChangeRequest>;
  updateChangeRequest(id: number, changeRequest: InsertChangeRequest): Promise<ChangeRequest | undefined>;
  addChangeRequestApplication(impact: InsertChangeRequestApplication): Promise<ChangeRequestApplication>;
  addChangeRequestInterface(impact: InsertChangeRequestInterface): Promise<ChangeRequestInterface>;
  
  // Impact Analysis
  getApplicationImpactAnalysis(applicationId: number): Promise<any>;
  getChangeRequestImpactAnalysis(changeRequestId: number): Promise<any>;
  getMultiApplicationImpactAnalysis(applicationIds: number[]): Promise<any>;
  getMultiChangeRequestImpactAnalysis(changeRequestIds: number[]): Promise<any>;
  getMultiInterfaceImpactAnalysis(interfaceIds: number[]): Promise<any>;
  
  // Dashboard
  getDashboardMetrics(): Promise<any>;
  getRecentChanges(): Promise<any[]>;
  
  // Timeline
  getTimelineData(startDate?: Date, endDate?: Date): Promise<any[]>;
  
  // Business Processes
  getAllBusinessProcesses(): Promise<BusinessProcess[]>;
  getBusinessProcess(id: number): Promise<BusinessProcess | undefined>;
  createBusinessProcess(businessProcess: InsertBusinessProcess): Promise<BusinessProcess>;
  updateBusinessProcess(id: number, businessProcess: InsertBusinessProcess): Promise<BusinessProcess | undefined>;
  deleteBusinessProcess(id: number): Promise<boolean>;
  duplicateBusinessProcessWithChildren(id: number): Promise<BusinessProcess | undefined>;
  getBusinessProcessDeletionImpact(id: number): Promise<{ canDelete: boolean; orphanedChildren: BusinessProcess[]; message: string; }>;
  
  // Business Process Relationships
  getBusinessProcessParents(childProcessId: number): Promise<BusinessProcess[]>;
  getBusinessProcessChildren(parentProcessId: number): Promise<BusinessProcess[]>;
  addBusinessProcessRelationship(relationship: InsertBusinessProcessRelationship): Promise<BusinessProcessRelationship>;
  removeBusinessProcessRelationship(parentId: number, childId: number): Promise<boolean>;
  getBusinessProcessRelationships(processId: number): Promise<BusinessProcessRelationship[]>;
  getAllBusinessProcessRelationships(): Promise<BusinessProcessRelationship[]>;
  
  // Business Process Interfaces
  getBusinessProcessInterfaces(businessProcessId: number): Promise<any[]>;
  getInterfaceBusinessProcesses(interfaceId: number): Promise<any[]>;
  addBusinessProcessInterface(bpInterface: InsertBusinessProcessInterface): Promise<BusinessProcessInterface>;
  removeBusinessProcessInterface(id: number): Promise<boolean>;
  updateBusinessProcessInterfaceSequence(id: number, sequenceNumber: number): Promise<BusinessProcessInterface | undefined>;
  
  // Interface Versions
  getInterfaceVersions(interfaceId: number): Promise<InterfaceVersion[]>;
  createInterfaceVersion(version: InsertInterfaceVersion): Promise<InterfaceVersion>;
  
  // Interface Consumer Descriptions
  getInterfaceConsumerDescription(interfaceId: number, consumerApplicationId: number): Promise<InterfaceConsumerDescription | undefined>;
  createInterfaceConsumerDescription(description: InsertInterfaceConsumerDescription): Promise<InterfaceConsumerDescription>;
  updateInterfaceConsumerDescription(id: number, description: InsertInterfaceConsumerDescription): Promise<InterfaceConsumerDescription | undefined>;
  
  // IML Diagrams
  getImlDiagram(businessProcessId: number): Promise<ImlDiagram | undefined>;
  createImlDiagram(diagram: InsertImlDiagram): Promise<ImlDiagram>;
  updateImlDiagram(id: number, diagram: InsertImlDiagram): Promise<ImlDiagram | undefined>;
  deleteImlDiagramsForBusinessProcess(businessProcessId: number): Promise<boolean>;
  deleteImlDiagramsForBusinessProcesses(businessProcessIds: number[]): Promise<boolean>;
  
  // Import/Export
  exportAllData(): Promise<any>;
  importData(data: any, mode: 'truncate' | 'incremental'): Promise<{ success: boolean; message: string; details?: any }>;
  
  // Entity-specific Import/Export
  exportApplications(): Promise<any>;
  importApplications(data: any, mode: 'truncate' | 'incremental'): Promise<{ success: boolean; message: string; details?: any }>;
  exportInterfaces(): Promise<any>;
  importInterfaces(data: any, mode: 'truncate' | 'incremental'): Promise<{ success: boolean; message: string; details?: any }>;
  exportBusinessProcesses(): Promise<any>;
  importBusinessProcesses(data: any, mode: 'truncate' | 'incremental'): Promise<{ success: boolean; message: string; details?: any }>;
  exportChangeRequests(): Promise<any>;
  importChangeRequests(data: any, mode: 'truncate' | 'incremental'): Promise<{ success: boolean; message: string; details?: any }>;
  exportTechnicalProcesses(): Promise<any>;
  importTechnicalProcesses(data: any, mode: 'truncate' | 'incremental'): Promise<{ success: boolean; message: string; details?: any }>;
  
  // Communication
  getAllConversations(): Promise<any[]>;
  getConversationWithDetails(id: number): Promise<any | undefined>;
  getConversationCountForEntity(entityType: string, entityId: number): Promise<number>;
  getBulkConversationCounts(entityType: string, entityIds: number[]): Promise<{ entityId: number; count: number }[]>;
  getConversationsForEntity(entityType: string, entityId: number): Promise<any[]>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  updateConversation(id: number, conversation: InsertConversation): Promise<Conversation | undefined>;
  deleteConversation(id: number): Promise<boolean>;
  
  // Conversation Links
  addConversationLink(link: InsertConversationLink): Promise<ConversationLink>;
  removeConversationLink(id: number): Promise<boolean>;
  getConversationsByEntity(entityType: string, entityId: number): Promise<any[]>;
  
  // Communication Comments
  getConversationComments(conversationId: number): Promise<any[]>;
  addCommunicationComment(comment: InsertCommunicationComment): Promise<CommunicationComment>;
  updateCommunicationComment(id: number, content: string): Promise<CommunicationComment | undefined>;
  deleteCommunicationComment(id: number): Promise<boolean>;
  
  // Conversation Participants
  addConversationParticipant(participant: InsertConversationParticipant): Promise<ConversationParticipant>;
  removeConversationParticipant(id: number): Promise<boolean>;
  
  // Communication Timeline
  getCommunicationTimeline(options: { startDate?: Date; endDate?: Date; entityType?: string; entityId?: number }): Promise<any[]>;
  
  // Communication Dashboard
  getCommunicationMetrics(): Promise<any>;
  getRecentCommunications(): Promise<any[]>;
  
  // Change Request Technical Process Impacts
  getChangeRequestTechnicalProcessImpacts(changeRequestId: number): Promise<any[]>;
  updateChangeRequestTechnicalProcessImpacts(changeRequestId: number, technicalProcesses: any[]): Promise<void>;
  
  // Change Request Internal Activity Impacts
  getChangeRequestInternalActivityImpacts(changeRequestId: number): Promise<any[]>;
  updateChangeRequestInternalActivityImpacts(changeRequestId: number, internalActivities: any[]): Promise<void>;
  
  // RBAC - Roles
  getAllRoles(): Promise<Role[]>;
  getRole(id: number): Promise<Role | undefined>;
  getRoleByName(name: string): Promise<Role | undefined>;
  createRole(role: InsertRole): Promise<Role>;
  updateRole(id: number, role: InsertRole): Promise<Role | undefined>;
  deleteRole(id: number): Promise<boolean>;
  duplicateRole(id: number, newName: string): Promise<Role | undefined>;
  
  // RBAC - Permissions
  getAllPermissions(): Promise<Permission[]>;
  getPermission(id: number): Promise<Permission | undefined>;
  getPermissionsByResource(resource: string): Promise<Permission[]>;
  createPermission(permission: InsertPermission): Promise<Permission>;
  updatePermission(id: number, permission: InsertPermission): Promise<Permission | undefined>;
  deletePermission(id: number): Promise<boolean>;
  
  // RBAC - Role Permissions
  getRolePermissions(roleId: number): Promise<RolePermission[]>;
  getRolePermissionsWithDetails(roleId: number): Promise<any[]>;
  grantPermissionToRole(rolePermission: InsertRolePermission): Promise<RolePermission>;
  revokePermissionFromRole(roleId: number, permissionId: number): Promise<boolean>;
  updateRolePermissions(roleId: number, permissionIds: number[]): Promise<void>;
  
  // RBAC - User Roles
  getUserRoles(userId: number): Promise<UserRole[]>;
  getUserRolesWithDetails(userId: number): Promise<any[]>;
  assignRoleToUser(userRole: InsertUserRole): Promise<UserRole>;
  removeRoleFromUser(userId: number, roleId: number): Promise<boolean>;
  updateUserRoles(userId: number, roleIds: number[]): Promise<void>;
  getUserPermissions(userId: number): Promise<Permission[]>;
  
  // RBAC - API Endpoints
  getAllApiEndpoints(): Promise<ApiEndpoint[]>;
  getApiEndpoint(id: number): Promise<ApiEndpoint | undefined>;
  createApiEndpoint(endpoint: InsertApiEndpoint): Promise<ApiEndpoint>;
  updateApiEndpoint(id: number, endpoint: InsertApiEndpoint): Promise<ApiEndpoint | undefined>;
  deleteApiEndpoint(id: number): Promise<boolean>;
  discoverApiEndpoints(): Promise<ApiEndpoint[]>;
  
  // RBAC - Audit
  createPermissionAuditLog(log: InsertPermissionAuditLog): Promise<PermissionAuditLog>;
  getPermissionAuditLogs(filters?: { roleId?: number; userId?: number; limit?: number }): Promise<PermissionAuditLog[]>;
  
  // RBAC - User with Roles
  getUserWithRoles(id: number): Promise<User & { roles: Role[] } | undefined>;
  getAllUsersWithRoles(): Promise<(User & { roles: Role[] })[]>;
  
  // User Management
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  
  // User Activity Logging
  createUserActivityLog(log: InsertUserActivityLog): Promise<UserActivityLog>;
  getUserActivityLogs(filters?: { 
    userId?: number; 
    username?: string;
    activityType?: string;
    resource?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<UserActivityLog[]>;
  getUserActivitySummary(userId?: number): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async validateUserPassword(userId: number, passwordHash: string): Promise<boolean> {
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.id, userId), eq(users.passwordHash, passwordHash)));
    return !!user;
  }

  // Applications
  async getAllApplications(): Promise<Application[]> {
    return await db.select().from(applications).orderBy(asc(applications.name));
  }

  async getApplication(id: number): Promise<Application | undefined> {
    const [application] = await db.select().from(applications).where(eq(applications.id, id));
    return application || undefined;
  }

  async createApplication(insertApplication: InsertApplication): Promise<Application> {
    const [application] = await db
      .insert(applications)
      .values({
        ...insertApplication,
        lastChangeDate: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return application;
  }

  async updateApplication(id: number, insertApplication: InsertApplication): Promise<Application | undefined> {
    const [application] = await db
      .update(applications)
      .set({
        ...insertApplication,
        lastChangeDate: new Date(),
        updatedAt: new Date()
      })
      .where(eq(applications.id, id))
      .returning();
    return application || undefined;
  }

  async deleteApplication(id: number): Promise<boolean> {
    const result = await db.delete(applications).where(eq(applications.id, id));
    return (result.rowCount || 0) > 0;
  }

  async setApplicationDecommissionDate(id: number, decommissionDate: Date): Promise<void> {
    await db
      .update(applications)
      .set({ decommissionDate })
      .where(eq(applications.id, id));
  }

  // Interfaces
  async getAllInterfaces(): Promise<Interface[]> {
    const interfacesData = await db.select().from(interfaces).orderBy(asc(interfaces.imlNumber));
    
    // Add provider and consumer application data
    return await Promise.all(interfacesData.map(async (iface) => {
      const providerApp = iface.providerApplicationId ? 
        await this.getApplication(iface.providerApplicationId) : null;
      const consumerApp = iface.consumerApplicationId ? 
        await this.getApplication(iface.consumerApplicationId) : null;
      
      return {
        ...iface,
        providerApplication: providerApp,
        consumerApplication: consumerApp,
        providerApplicationName: providerApp?.name || 'Unknown',
        consumerApplicationName: consumerApp?.name || 'Unknown'
      } as any;
    }));
  }

  async getInterface(id: number): Promise<Interface | undefined> {
    const [interface_] = await db.select().from(interfaces).where(eq(interfaces.id, id));
    if (!interface_) return undefined;
    
    // Add provider and consumer application data
    const providerApp = interface_.providerApplicationId ? 
      await this.getApplication(interface_.providerApplicationId) : null;
    const consumerApp = interface_.consumerApplicationId ? 
      await this.getApplication(interface_.consumerApplicationId) : null;
    
    return {
      ...interface_,
      providerApplication: providerApp,
      consumerApplication: consumerApp,
      providerApplicationName: providerApp?.name || 'Unknown',
      consumerApplicationName: consumerApp?.name || 'Unknown'
    } as any;
  }

  async createInterface(insertInterface: InsertInterface): Promise<Interface> {
    const [interface_] = await db
      .insert(interfaces)
      .values({
        ...insertInterface,
        lastChangeDate: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return interface_;
  }

  async updateInterface(id: number, insertInterface: InsertInterface): Promise<Interface | undefined> {
    const [interface_] = await db
      .update(interfaces)
      .set({
        ...insertInterface,
        lastChangeDate: new Date(),
        updatedAt: new Date()
      })
      .where(eq(interfaces.id, id))
      .returning();
    return interface_ || undefined;
  }

  async deleteInterface(id: number): Promise<boolean> {
    try {
      // First, get all business processes that use this interface
      const businessProcessAssignments = await db
        .select()
        .from(businessProcessInterfaces)
        .where(eq(businessProcessInterfaces.interfaceId, id));
      
      const affectedBPIds = businessProcessAssignments
        .map(bp => bp.businessProcessId)
        .filter((id): id is number => id !== null);
      
      // Delete the interface (this will cascade to business process interfaces due to foreign key constraints)
      const result = await db.delete(interfaces).where(eq(interfaces.id, id));
      const success = (result.rowCount || 0) > 0;
      
      // Clear saved diagrams for all affected business processes
      if (success && affectedBPIds.length > 0) {
        await this.deleteImlDiagramsForBusinessProcesses(affectedBPIds);
        console.log(`Cleared saved diagrams for business processes: ${affectedBPIds.join(', ')} due to interface ${id} deletion`);
      }
      
      return success;
    } catch (error) {
      console.error('Error in deleteInterface:', error);
      throw error;
    }
  }

  async getInterfaceComments(interfaceId: number): Promise<InterfaceComment[]> {
    return await db
      .select()
      .from(interfaceComments)
      .where(eq(interfaceComments.interfaceId, interfaceId))
      .orderBy(desc(interfaceComments.createdAt));
  }

  async addInterfaceComment(comment: InsertInterfaceComment): Promise<InterfaceComment> {
    const [newComment] = await db
      .insert(interfaceComments)
      .values(comment)
      .returning();
    return newComment;
  }

  // Change Requests
  async getAllChangeRequests(): Promise<ChangeRequest[]> {
    return await db.select().from(changeRequests).orderBy(desc(changeRequests.createdAt));
  }

  async getChangeRequest(id: number): Promise<ChangeRequest | undefined> {
    const [changeRequest] = await db.select().from(changeRequests).where(eq(changeRequests.id, id));
    return changeRequest || undefined;
  }

  async createChangeRequest(insertChangeRequest: InsertChangeRequest): Promise<ChangeRequest> {
    const [changeRequest] = await db
      .insert(changeRequests)
      .values({
        ...insertChangeRequest,
        updatedAt: new Date()
      })
      .returning();
    return changeRequest;
  }

  async updateChangeRequest(id: number, insertChangeRequest: InsertChangeRequest): Promise<ChangeRequest | undefined> {
    const [changeRequest] = await db
      .update(changeRequests)
      .set({
        ...insertChangeRequest,
        updatedAt: new Date()
      })
      .where(eq(changeRequests.id, id))
      .returning();
    return changeRequest || undefined;
  }

  async addChangeRequestApplication(impact: InsertChangeRequestApplication): Promise<ChangeRequestApplication> {
    const [newImpact] = await db
      .insert(changeRequestApplications)
      .values(impact)
      .returning();
    return newImpact;
  }

  async addChangeRequestInterface(impact: InsertChangeRequestInterface): Promise<ChangeRequestInterface> {
    const [newImpact] = await db
      .insert(changeRequestInterfaces)
      .values(impact)
      .returning();
    return newImpact;
  }

  async getChangeRequestApplicationImpacts(changeRequestId: number): Promise<any[]> {
    const impacts = await db
      .select({
        id: changeRequestApplications.id,
        changeRequestId: changeRequestApplications.changeRequestId,
        applicationId: changeRequestApplications.applicationId,
        impactType: changeRequestApplications.impactType,
        impactDescription: changeRequestApplications.impactDescription,
        application: applications
      })
      .from(changeRequestApplications)
      .leftJoin(applications, eq(changeRequestApplications.applicationId, applications.id))
      .where(eq(changeRequestApplications.changeRequestId, changeRequestId));
    
    return impacts;
  }

  async updateChangeRequestApplicationImpacts(changeRequestId: number, applications: any[]): Promise<void> {
    // Delete existing impacts
    await db
      .delete(changeRequestApplications)
      .where(eq(changeRequestApplications.changeRequestId, changeRequestId));
    
    // Insert new impacts
    if (applications.length > 0) {
      await db
        .insert(changeRequestApplications)
        .values(
          applications.map(app => ({
            changeRequestId,
            applicationId: app.applicationId,
            impactType: app.impactType,
            impactDescription: app.impactDescription
          }))
        );
    }
  }

  async getChangeRequestInterfaceImpacts(changeRequestId: number): Promise<any[]> {
    const impacts = await db
      .select({
        id: changeRequestInterfaces.id,
        changeRequestId: changeRequestInterfaces.changeRequestId,
        interfaceId: changeRequestInterfaces.interfaceId,
        impactType: changeRequestInterfaces.impactType,
        impactDescription: changeRequestInterfaces.impactDescription,
        interface: interfaces
      })
      .from(changeRequestInterfaces)
      .leftJoin(interfaces, eq(changeRequestInterfaces.interfaceId, interfaces.id))
      .where(eq(changeRequestInterfaces.changeRequestId, changeRequestId));
    
    return impacts;
  }

  async updateChangeRequestInterfaceImpacts(changeRequestId: number, interfaces: any[]): Promise<void> {
    // Delete existing impacts
    await db
      .delete(changeRequestInterfaces)
      .where(eq(changeRequestInterfaces.changeRequestId, changeRequestId));
    
    // Insert new impacts
    if (interfaces.length > 0) {
      await db
        .insert(changeRequestInterfaces)
        .values(
          interfaces.map(iface => ({
            changeRequestId,
            interfaceId: iface.interfaceId,
            impactType: iface.impactType,
            impactDescription: iface.impactDescription
          }))
        );
    }
  }

  async deleteChangeRequest(id: number): Promise<boolean> {
    // Delete related impacts first
    await db.delete(changeRequestApplications).where(eq(changeRequestApplications.changeRequestId, id));
    await db.delete(changeRequestInterfaces).where(eq(changeRequestInterfaces.changeRequestId, id));
    await db.delete(changeRequestTechnicalProcesses).where(eq(changeRequestTechnicalProcesses.changeRequestId, id));
    
    // Delete the change request
    const result = await db.delete(changeRequests).where(eq(changeRequests.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Impact Analysis
  async getApplicationImpactAnalysis(applicationId: number): Promise<any> {
    // Get the application
    const application = await this.getApplication(applicationId);
    if (!application) return null;

    // Get interfaces where this application is provider
    const providedInterfacesRaw = await db
      .select()
      .from(interfaces)
      .where(eq(interfaces.providerApplicationId, applicationId));

    // Get interfaces where this application is consumer
    const consumedInterfacesRaw = await db
      .select()
      .from(interfaces)
      .where(eq(interfaces.consumerApplicationId, applicationId));

    // Transform the raw results to include application names
    const providedInterfaces = await Promise.all(providedInterfacesRaw.map(async (iface) => {
      const consumerApp = iface.consumerApplicationId ? 
        await this.getApplication(iface.consumerApplicationId) : null;
      return {
        ...iface,
        providerApplicationName: application.name,
        consumerApplicationName: consumerApp?.name || 'Unknown'
      };
    }));

    const consumedInterfaces = await Promise.all(consumedInterfacesRaw.map(async (iface) => {
      const providerApp = iface.providerApplicationId ? 
        await this.getApplication(iface.providerApplicationId) : null;
      return {
        ...iface,
        providerApplicationName: providerApp?.name || 'Unknown',
        consumerApplicationName: application.name
      };
    }));

    // Get ALL related applications (direct and indirect)
    const relatedAppIds = new Set<number>();
    const indirectlyImpactedApps = new Set<number>();
    
    // Direct relationships
    providedInterfaces.forEach(i => {
      if (i.consumerApplicationId && i.consumerApplicationId !== applicationId) {
        relatedAppIds.add(i.consumerApplicationId);
        indirectlyImpactedApps.add(i.consumerApplicationId); // Consumers are impacted
      }
    });
    
    consumedInterfaces.forEach(i => {
      if (i.providerApplicationId && i.providerApplicationId !== applicationId) {
        relatedAppIds.add(i.providerApplicationId);
      }
    });

    // Find second-level impacts (applications that consume from our consumers)
    if (indirectlyImpactedApps.size > 0) {
      const secondLevelInterfaces = await db
        .select()
        .from(interfaces)
        .where(inArray(interfaces.providerApplicationId, Array.from(indirectlyImpactedApps)));
      
      secondLevelInterfaces.forEach(i => {
        if (i.consumerApplicationId && i.consumerApplicationId !== applicationId) {
          relatedAppIds.add(i.consumerApplicationId);
          indirectlyImpactedApps.add(i.consumerApplicationId);
        }
      });
    }

    let relatedApplications: any[] = [];
    if (relatedAppIds.size > 0) {
      relatedApplications = await db
        .select()
        .from(applications)
        .where(inArray(applications.id, Array.from(relatedAppIds)));
    }

    // Get business processes impacted through interfaces
    const interfaceIds = [
      ...providedInterfaces.map(i => i.id),
      ...consumedInterfaces.map(i => i.id)
    ];

    let impactedBusinessProcesses: any[] = [];
    if (interfaceIds.length > 0) {
      const bpInterfaceResults = await db
        .select({
          businessProcess: businessProcesses,
          interfaceId: businessProcessInterfaces.interfaceId,
          sequenceNumber: businessProcessInterfaces.sequenceNumber
        })
        .from(businessProcessInterfaces)
        .leftJoin(businessProcesses, eq(businessProcessInterfaces.businessProcessId, businessProcesses.id))
        .where(inArray(businessProcessInterfaces.interfaceId, interfaceIds));

      impactedBusinessProcesses = bpInterfaceResults.map(row => ({
        businessProcess: row.businessProcess,
        interfaceId: row.interfaceId,
        sequenceNumber: row.sequenceNumber
      }));
    }

    // Get active change requests affecting this application
    const changeRequestApps = await db
      .select({
        changeRequest: changeRequests,
        impact: changeRequestApplications
      })
      .from(changeRequestApplications)
      .leftJoin(changeRequests, eq(changeRequestApplications.changeRequestId, changeRequests.id))
      .where(eq(changeRequestApplications.applicationId, applicationId));

    const activeChangeRequests = changeRequestApps
      .filter(cra => cra.changeRequest && ['submitted', 'approved', 'in_progress'].includes(cra.changeRequest.status))
      .map(cra => ({
        ...cra.changeRequest,
        impactType: cra.impact.impactType,
        impactDescription: cra.impact.impactDescription
      }));

    // Format impacted interfaces for UI
    const impactedInterfaces = [
      ...providedInterfaces.map(i => ({
        interface: i,
        impact: { impactType: 'provider', impactDescription: 'Application provides this interface' }
      })),
      ...consumedInterfaces.map(i => ({
        interface: i,
        impact: { impactType: 'consumer', impactDescription: 'Application consumes this interface' }
      }))
    ];

    // Format impacted applications for UI
    const impactedApplications = relatedApplications.map(app => ({
      application: app,
      impact: {
        impactType: indirectlyImpactedApps.has(app.id) ? 'indirect' : 'direct',
        impactDescription: indirectlyImpactedApps.has(app.id) 
          ? 'Indirectly impacted through interface dependencies'
          : 'Directly connected through interfaces'
      }
    }));

    // Calculate risk level
    const totalInterfaces = providedInterfaces.length + consumedInterfaces.length;
    const totalBusinessProcesses = new Set(impactedBusinessProcesses.map(bp => bp.businessProcess?.id)).size;
    let riskLevel = 'low';
    if (totalInterfaces > 10 || activeChangeRequests.length > 3 || totalBusinessProcesses > 5) riskLevel = 'high';
    else if (totalInterfaces > 5 || activeChangeRequests.length > 1 || totalBusinessProcesses > 2) riskLevel = 'medium';

    return {
      application,
      providedInterfaces,
      consumedInterfaces,
      relatedApplications,
      activeChangeRequests,
      impactedApplications,
      impactedInterfaces,
      impactedBusinessProcesses,
      impactSummary: {
        totalInterfaces: totalInterfaces,
        totalApplications: relatedApplications.length,
        relatedApplications: relatedApplications.length,
        activeChanges: activeChangeRequests.length,
        totalBusinessProcesses,
        riskLevel
      }
    };
  }

  async getMultiApplicationImpactAnalysis(applicationIds: number[]): Promise<any> {
    // Get all applications
    const selectedApplications = await db
      .select()
      .from(applications)
      .where(inArray(applications.id, applicationIds));

    if (selectedApplications.length === 0) return null;

    // Aggregate data for all selected applications
    const allProvidedInterfaces: any[] = [];
    const allConsumedInterfaces: any[] = [];
    const allRelatedAppIds = new Set<number>();
    const allIndirectlyImpactedApps = new Set<number>();
    const allActiveChangeRequests: any[] = [];
    const allInterfaceIds = new Set<number>();

    // Process each application
    for (const app of selectedApplications) {
      // Get interfaces where this application is provider
      const providedInterfacesRaw = await db
        .select()
        .from(interfaces)
        .where(eq(interfaces.providerApplicationId, app.id));

      // Get interfaces where this application is consumer
      const consumedInterfacesRaw = await db
        .select()
        .from(interfaces)
        .where(eq(interfaces.consumerApplicationId, app.id));

      // Transform and add to aggregated lists
      const providedInterfaces = await Promise.all(providedInterfacesRaw.map(async (iface) => {
        const consumerApp = iface.consumerApplicationId ? 
          await this.getApplication(iface.consumerApplicationId) : null;
        allInterfaceIds.add(iface.id);
        return {
          ...iface,
          providerApplicationName: app.name,
          consumerApplicationName: consumerApp?.name || 'Unknown',
          sourceApplicationId: app.id
        };
      }));

      const consumedInterfaces = await Promise.all(consumedInterfacesRaw.map(async (iface) => {
        const providerApp = iface.providerApplicationId ? 
          await this.getApplication(iface.providerApplicationId) : null;
        allInterfaceIds.add(iface.id);
        return {
          ...iface,
          providerApplicationName: providerApp?.name || 'Unknown',
          consumerApplicationName: app.name,
          sourceApplicationId: app.id
        };
      }));

      allProvidedInterfaces.push(...providedInterfaces);
      allConsumedInterfaces.push(...consumedInterfaces);

      // Collect related applications
      providedInterfaces.forEach(i => {
        if (i.consumerApplicationId && !applicationIds.includes(i.consumerApplicationId)) {
          allRelatedAppIds.add(i.consumerApplicationId);
          allIndirectlyImpactedApps.add(i.consumerApplicationId);
        }
      });
      
      consumedInterfaces.forEach(i => {
        if (i.providerApplicationId && !applicationIds.includes(i.providerApplicationId)) {
          allRelatedAppIds.add(i.providerApplicationId);
        }
      });

      // Get active change requests for this application
      const changeRequestApps = await db
        .select({
          changeRequest: changeRequests,
          impact: changeRequestApplications
        })
        .from(changeRequestApplications)
        .leftJoin(changeRequests, eq(changeRequestApplications.changeRequestId, changeRequests.id))
        .where(eq(changeRequestApplications.applicationId, app.id));

      const activeChangeRequests = changeRequestApps
        .filter(cra => cra.changeRequest && ['submitted', 'approved', 'in_progress'].includes(cra.changeRequest.status))
        .map(cra => ({
          ...cra.changeRequest,
          impactType: cra.impact.impactType,
          impactDescription: cra.impact.impactDescription,
          relatedApplicationId: app.id
        }));

      allActiveChangeRequests.push(...activeChangeRequests);
    }

    // Find second-level impacts
    if (allIndirectlyImpactedApps.size > 0) {
      const secondLevelInterfaces = await db
        .select()
        .from(interfaces)
        .where(inArray(interfaces.providerApplicationId, Array.from(allIndirectlyImpactedApps)));
      
      secondLevelInterfaces.forEach(i => {
        if (i.consumerApplicationId && !applicationIds.includes(i.consumerApplicationId)) {
          allRelatedAppIds.add(i.consumerApplicationId);
          allIndirectlyImpactedApps.add(i.consumerApplicationId);
        }
      });
    }

    // Get all related applications
    let relatedApplications: any[] = [];
    if (allRelatedAppIds.size > 0) {
      relatedApplications = await db
        .select()
        .from(applications)
        .where(inArray(applications.id, Array.from(allRelatedAppIds)));
    }

    // Get business processes impacted through interfaces
    let impactedBusinessProcesses: any[] = [];
    if (allInterfaceIds.size > 0) {
      const bpInterfaceResults = await db
        .select({
          businessProcess: businessProcesses,
          interfaceId: businessProcessInterfaces.interfaceId,
          sequenceNumber: businessProcessInterfaces.sequenceNumber
        })
        .from(businessProcessInterfaces)
        .leftJoin(businessProcesses, eq(businessProcessInterfaces.businessProcessId, businessProcesses.id))
        .where(inArray(businessProcessInterfaces.interfaceId, Array.from(allInterfaceIds)));

      impactedBusinessProcesses = bpInterfaceResults.map(row => ({
        businessProcess: row.businessProcess,
        interfaceId: row.interfaceId,
        sequenceNumber: row.sequenceNumber
      }));
    }

    // Remove duplicate change requests
    const uniqueChangeRequests = Array.from(
      new Map(allActiveChangeRequests.map(cr => [cr.id, cr])).values()
    );

    // Format impacted interfaces for UI
    const impactedInterfaces = [
      ...allProvidedInterfaces.map(i => ({
        interface: i,
        impact: { impactType: 'provider', impactDescription: 'Application provides this interface' }
      })),
      ...allConsumedInterfaces.map(i => ({
        interface: i,
        impact: { impactType: 'consumer', impactDescription: 'Application consumes this interface' }
      }))
    ];

    // Format impacted applications for UI
    const impactedApplications = relatedApplications.map(app => ({
      application: app,
      impact: {
        impactType: allIndirectlyImpactedApps.has(app.id) ? 'indirect' : 'direct',
        impactDescription: allIndirectlyImpactedApps.has(app.id) 
          ? 'Indirectly impacted through interface dependencies'
          : 'Directly connected through interfaces'
      }
    }));

    // Calculate risk level
    const totalInterfaces = allProvidedInterfaces.length + allConsumedInterfaces.length;
    const totalBusinessProcesses = new Set(impactedBusinessProcesses.map(bp => bp.businessProcess?.id)).size;
    let riskLevel = 'low';
    if (totalInterfaces > 15 || uniqueChangeRequests.length > 5 || totalBusinessProcesses > 8) riskLevel = 'critical';
    else if (totalInterfaces > 10 || uniqueChangeRequests.length > 3 || totalBusinessProcesses > 5) riskLevel = 'high';
    else if (totalInterfaces > 5 || uniqueChangeRequests.length > 1 || totalBusinessProcesses > 2) riskLevel = 'medium';

    return {
      applications: selectedApplications,
      providedInterfaces: allProvidedInterfaces,
      consumedInterfaces: allConsumedInterfaces,
      relatedApplications,
      activeChangeRequests: uniqueChangeRequests,
      impactedApplications,
      impactedInterfaces,
      impactedBusinessProcesses,
      impactSummary: {
        totalInterfaces,
        totalApplications: relatedApplications.length,
        relatedApplications: relatedApplications.length,
        activeChanges: uniqueChangeRequests.length,
        totalBusinessProcesses,
        riskLevel
      }
    };
  }

  async getChangeRequestImpactAnalysis(changeRequestId: number): Promise<any> {
    // Get the change request
    const changeRequest = await this.getChangeRequest(changeRequestId);
    if (!changeRequest) return null;

    // Get impacted applications
    const impactedApps = await db
      .select({
        application: applications,
        impact: changeRequestApplications
      })
      .from(changeRequestApplications)
      .leftJoin(applications, eq(changeRequestApplications.applicationId, applications.id))
      .where(eq(changeRequestApplications.changeRequestId, changeRequestId));

    // Get impacted interfaces
    const impactedInterfacesRaw = await db
      .select({
        interface: interfaces,
        impact: changeRequestInterfaces
      })
      .from(changeRequestInterfaces)
      .leftJoin(interfaces, eq(changeRequestInterfaces.interfaceId, interfaces.id))
      .where(eq(changeRequestInterfaces.changeRequestId, changeRequestId));

    // Add provider and consumer application names to interfaces
    const impactedInterfaces = await Promise.all(impactedInterfacesRaw.map(async (item) => {
      if (!item.interface) return item;
      
      const providerApp = item.interface.providerApplicationId ? 
        await this.getApplication(item.interface.providerApplicationId) : null;
      const consumerApp = item.interface.consumerApplicationId ? 
        await this.getApplication(item.interface.consumerApplicationId) : null;
      
      return {
        ...item,
        interface: {
          ...item.interface,
          providerApplicationName: providerApp?.name || 'Unknown',
          consumerApplicationName: consumerApp?.name || 'Unknown',
          providerApplication: providerApp,
          consumerApplication: consumerApp
        }
      };
    }));

    // Get business processes related to impacted interfaces
    let impactedBusinessProcesses: any[] = [];
    let uniqueBusinessProcesses = 0;
    
    const interfaceIds = impactedInterfaces.map(i => i.interface?.id).filter(Boolean);
    if (interfaceIds.length > 0) {
      const bpRelations = await db
        .select({
          businessProcess: businessProcesses,
          interfaceId: businessProcessInterfaces.interfaceId,
          sequenceNumber: businessProcessInterfaces.sequenceNumber
        })
        .from(businessProcessInterfaces)
        .leftJoin(businessProcesses, eq(businessProcessInterfaces.businessProcessId, businessProcesses.id))
        .where(inArray(businessProcessInterfaces.interfaceId, interfaceIds));
      
      impactedBusinessProcesses = bpRelations.filter(rel => rel.businessProcess);
      
      // Get hierarchical impacts (parent and child processes)
      const hierarchicalImpacts: any[] = [];
      const processedIds = new Set<number>();
      
      for (const bp of impactedBusinessProcesses) {
        if (bp.businessProcess && !processedIds.has(bp.businessProcess.id)) {
          processedIds.add(bp.businessProcess.id);
          
          // Get all parent processes
          const parentProcesses = await this.getBusinessProcessParents(bp.businessProcess.id);
          for (const parent of parentProcesses) {
            if (!processedIds.has(parent.id)) {
              hierarchicalImpacts.push({
                businessProcess: parent,
                interfaceId: bp.interfaceId,
                sequenceNumber: null,
                impactType: 'parent'
              });
              processedIds.add(parent.id);
            }
          }
          
          // Get all child processes
          const childProcesses = await this.getBusinessProcessChildren(bp.businessProcess.id);
          for (const child of childProcesses) {
            if (!processedIds.has(child.id)) {
              hierarchicalImpacts.push({
                businessProcess: child,
                interfaceId: bp.interfaceId,
                sequenceNumber: null,
                impactType: 'child'
              });
              processedIds.add(child.id);
            }
          }
        }
      }
      
      // Combine direct and hierarchical impacts
      impactedBusinessProcesses = [...impactedBusinessProcesses, ...hierarchicalImpacts];
      const uniqueBPIds = [...new Set(impactedBusinessProcesses.map(bp => bp.businessProcess?.id).filter(Boolean))];
      uniqueBusinessProcesses = uniqueBPIds.length;
    }

    // Get impacted technical processes
    const impactedTechnicalProcessesRaw = await db
      .select({
        technicalProcess: technicalProcesses,
        impact: changeRequestTechnicalProcesses
      })
      .from(changeRequestTechnicalProcesses)
      .leftJoin(technicalProcesses, eq(changeRequestTechnicalProcesses.technicalProcessId, technicalProcesses.id))
      .where(eq(changeRequestTechnicalProcesses.changeRequestId, changeRequestId));

    // Add application details to technical processes
    const impactedTechnicalProcesses = await Promise.all(impactedTechnicalProcessesRaw.map(async (item) => {
      if (!item.technicalProcess) return item;
      
      const app = item.technicalProcess.applicationId ? 
        await this.getApplication(item.technicalProcess.applicationId) : null;
      
      return {
        ...item,
        technicalProcess: {
          ...item.technicalProcess,
          applicationName: app?.name || null
        }
      };
    }));

    const uniqueTechnicalProcesses = new Set(impactedTechnicalProcesses.map(tp => tp.technicalProcess?.id).filter(Boolean)).size;

    return {
      changeRequest,
      impactedApplications: impactedApps,
      impactedInterfaces: impactedInterfaces,
      impactedBusinessProcesses: impactedBusinessProcesses,
      impactedTechnicalProcesses: impactedTechnicalProcesses,
      impactSummary: {
        totalApplications: impactedApps.length,
        totalInterfaces: impactedInterfaces.length,
        totalBusinessProcesses: uniqueBusinessProcesses,
        totalTechnicalProcesses: uniqueTechnicalProcesses,
        riskLevel: impactedApps.length + impactedInterfaces.length + uniqueTechnicalProcesses > 8 ? 'high' : 'medium'
      }
    };
  }

  async getMultiChangeRequestImpactAnalysis(changeRequestIds: number[]): Promise<any> {
    // Get all change requests
    const selectedChangeRequests = await db
      .select()
      .from(changeRequests)
      .where(inArray(changeRequests.id, changeRequestIds));

    if (selectedChangeRequests.length === 0) return null;

    // Get all impacted applications across all CRs
    const impactedApps = await db
      .select({
        application: applications,
        impact: changeRequestApplications,
        changeRequest: changeRequests
      })
      .from(changeRequestApplications)
      .leftJoin(applications, eq(changeRequestApplications.applicationId, applications.id))
      .leftJoin(changeRequests, eq(changeRequestApplications.changeRequestId, changeRequests.id))
      .where(inArray(changeRequestApplications.changeRequestId, changeRequestIds));

    // Get all impacted interfaces across all CRs
    const impactedInterfacesRaw = await db
      .select({
        interface: interfaces,
        impact: changeRequestInterfaces,
        changeRequest: changeRequests
      })
      .from(changeRequestInterfaces)
      .leftJoin(interfaces, eq(changeRequestInterfaces.interfaceId, interfaces.id))
      .leftJoin(changeRequests, eq(changeRequestInterfaces.changeRequestId, changeRequests.id))
      .where(inArray(changeRequestInterfaces.changeRequestId, changeRequestIds));

    // Add provider and consumer application names to interfaces
    const impactedInterfaces = await Promise.all(impactedInterfacesRaw.map(async (item) => {
      if (!item.interface) return item;
      
      const providerApp = item.interface.providerApplicationId ? 
        await this.getApplication(item.interface.providerApplicationId) : null;
      const consumerApp = item.interface.consumerApplicationId ? 
        await this.getApplication(item.interface.consumerApplicationId) : null;
      
      return {
        ...item,
        interface: {
          ...item.interface,
          providerApplicationName: providerApp?.name || 'Unknown',
          consumerApplicationName: consumerApp?.name || 'Unknown',
          providerApplication: providerApp,
          consumerApplication: consumerApp
        }
      };
    }));

    // Get unique applications and interfaces
    const uniqueAppIds = [...new Set(impactedApps.map(a => a.application?.id).filter(Boolean))];
    const uniqueInterfaceIds = [...new Set(impactedInterfaces.map(i => i.interface?.id).filter(Boolean))];

    // Get business processes related to impacted interfaces
    let impactedBusinessProcesses: any[] = [];
    let uniqueBusinessProcesses = 0;
    
    if (uniqueInterfaceIds.length > 0) {
      const bpRelations = await db
        .select({
          businessProcess: businessProcesses,
          interfaceId: businessProcessInterfaces.interfaceId,
          sequenceNumber: businessProcessInterfaces.sequenceNumber
        })
        .from(businessProcessInterfaces)
        .leftJoin(businessProcesses, eq(businessProcessInterfaces.businessProcessId, businessProcesses.id))
        .where(inArray(businessProcessInterfaces.interfaceId, uniqueInterfaceIds));
      
      impactedBusinessProcesses = bpRelations.filter(rel => rel.businessProcess);
      const uniqueBPIds = [...new Set(impactedBusinessProcesses.map(bp => bp.businessProcess?.id).filter(Boolean))];
      uniqueBusinessProcesses = uniqueBPIds.length;
    }

    // Get all impacted technical processes across all CRs
    const impactedTechnicalProcessesRaw = await db
      .select({
        technicalProcess: technicalProcesses,
        impact: changeRequestTechnicalProcesses,
        changeRequest: changeRequests
      })
      .from(changeRequestTechnicalProcesses)
      .leftJoin(technicalProcesses, eq(changeRequestTechnicalProcesses.technicalProcessId, technicalProcesses.id))
      .leftJoin(changeRequests, eq(changeRequestTechnicalProcesses.changeRequestId, changeRequests.id))
      .where(inArray(changeRequestTechnicalProcesses.changeRequestId, changeRequestIds));

    // Add application details to technical processes
    const impactedTechnicalProcesses = await Promise.all(impactedTechnicalProcessesRaw.map(async (item) => {
      if (!item.technicalProcess) return item;
      
      const app = item.technicalProcess.applicationId ? 
        await this.getApplication(item.technicalProcess.applicationId) : null;
      
      return {
        ...item,
        technicalProcess: {
          ...item.technicalProcess,
          applicationName: app?.name || null
        }
      };
    }));

    const uniqueTechnicalProcessIds = [...new Set(impactedTechnicalProcesses.map(tp => tp.technicalProcess?.id).filter(Boolean))];

    // Calculate risk level based on total impact
    const totalImpact = uniqueAppIds.length + uniqueInterfaceIds.length + uniqueTechnicalProcessIds.length;
    let riskLevel = 'low';
    if (totalImpact > 15) riskLevel = 'critical';
    else if (totalImpact > 8) riskLevel = 'high';
    else if (totalImpact > 3) riskLevel = 'medium';

    return {
      changeRequests: selectedChangeRequests,
      impactedApplications: impactedApps,
      impactedInterfaces: impactedInterfaces,
      impactedBusinessProcesses: impactedBusinessProcesses,
      impactedTechnicalProcesses: impactedTechnicalProcesses,
      impactSummary: {
        totalApplications: uniqueAppIds.length,
        totalInterfaces: uniqueInterfaceIds.length,
        totalBusinessProcesses: uniqueBusinessProcesses,
        totalTechnicalProcesses: uniqueTechnicalProcessIds.length,
        activeChanges: selectedChangeRequests.length,
        riskLevel
      }
    };
  }

  async getMultiInterfaceImpactAnalysis(interfaceIds: number[]): Promise<any> {
    // Get all interfaces
    const selectedInterfaces = await db
      .select()
      .from(interfaces)
      .where(inArray(interfaces.id, interfaceIds));

    if (selectedInterfaces.length === 0) return null;

    // Get all change requests that impact these interfaces
    const relatedCRs = await db
      .select({
        changeRequest: changeRequests,
        impact: changeRequestInterfaces,
        interface: interfaces
      })
      .from(changeRequestInterfaces)
      .leftJoin(changeRequests, eq(changeRequestInterfaces.changeRequestId, changeRequests.id))
      .leftJoin(interfaces, eq(changeRequestInterfaces.interfaceId, interfaces.id))
      .where(inArray(changeRequestInterfaces.interfaceId, interfaceIds));

    // Get unique change requests
    const uniqueCRIds = [...new Set(relatedCRs.map(cr => cr.changeRequest?.id).filter(Boolean))];

    // Get all applications related to these interfaces (as providers or consumers)
    const providerAppIds = selectedInterfaces.map(i => i.providerApplicationId).filter(Boolean);
    const consumerAppIds = selectedInterfaces.map(i => i.consumerApplicationId).filter(Boolean);
    const allAppIds = [...new Set([...providerAppIds, ...consumerAppIds])];

    let relatedApplications: any[] = [];
    if (allAppIds.length > 0) {
      relatedApplications = await db
        .select()
        .from(applications)
        .where(inArray(applications.id, allAppIds));
    }

    // Get business processes related to these interfaces through the join table
    let impactedBusinessProcesses: any[] = [];
    let uniqueBusinessProcesses = 0;
    
    if (interfaceIds.length > 0) {
      const bpRelations = await db
        .select({
          businessProcess: businessProcesses,
          interfaceId: businessProcessInterfaces.interfaceId,
          sequenceNumber: businessProcessInterfaces.sequenceNumber
        })
        .from(businessProcessInterfaces)
        .leftJoin(businessProcesses, eq(businessProcessInterfaces.businessProcessId, businessProcesses.id))
        .where(inArray(businessProcessInterfaces.interfaceId, interfaceIds));
      
      impactedBusinessProcesses = bpRelations.filter(rel => rel.businessProcess);
      const uniqueBPIds = [...new Set(impactedBusinessProcesses.map(bp => bp.businessProcess?.id).filter(Boolean))];
      uniqueBusinessProcesses = uniqueBPIds.length;
    }

    // Format the impacted applications for display
    const impactedApplications = relatedApplications.map(app => ({
      application: app,
      impact: {
        impactType: 'related',
        impactDescription: 'Application is related through selected interfaces'
      }
    }));

    return {
      interfaces: selectedInterfaces,
      relatedChangeRequests: relatedCRs,
      relatedApplications,
      impactedApplications,
      impactedBusinessProcesses,
      impactSummary: {
        totalApplications: relatedApplications.length,
        totalInterfaces: selectedInterfaces.length,
        totalBusinessProcesses: uniqueBusinessProcesses,
        relatedChangeRequests: uniqueCRIds.length,
        riskLevel: uniqueCRIds.length > 5 ? 'high' : uniqueCRIds.length > 2 ? 'medium' : 'low'
      }
    };
  }

  // Dashboard
  async getDashboardMetrics(): Promise<any> {
    const totalApplications = await db.select().from(applications);
    const activeInterfaces = await db.select().from(interfaces).where(eq(interfaces.status, 'active'));
    const pendingChanges = await db.select().from(changeRequests).where(eq(changeRequests.status, 'submitted'));
    
    // Mock critical issues for demo
    const criticalIssues = totalApplications.filter(app => app.uptime && parseFloat(app.uptime) < 95);

    return {
      totalApplications: totalApplications.length,
      activeInterfaces: activeInterfaces.length,
      pendingChanges: pendingChanges.length,
      criticalIssues: criticalIssues.length
    };
  }

  async getRecentChanges(): Promise<any[]> {
    const recentChanges = await db
      .select()
      .from(changeRequests)
      .orderBy(desc(changeRequests.updatedAt))
      .limit(5);

    return recentChanges.map(cr => ({
      id: cr.id,
      title: `${cr.crNumber}: ${cr.title}`,
      description: cr.description,
      status: cr.status,
      owner: cr.owner,
      date: cr.updatedAt ? new Date(cr.updatedAt).toLocaleDateString() : 'Unknown',
      impactedApps: Math.floor(Math.random() * 10) + 1 // Simplified calculation
    }));
  }

  // Timeline
  async getTimelineData(startDate?: Date, endDate?: Date): Promise<any[]> {
    const timelineEvents: any[] = [];
    
    // First, get user activity logs to match with changes
    const activityLogsQuery = startDate && endDate
      ? db.select().from(userActivityLog).where(
          and(
            gte(userActivityLog.createdAt, startDate),
            lte(userActivityLog.createdAt, endDate)
          )
        )
      : db.select().from(userActivityLog);
    
    const activityLogs = await activityLogsQuery;
    
    // Create a helper to find the user who made a change
    const findUserForChange = (resourceType: string, resourceId: number, action: string, changeDate: Date): string => {
      // Find the closest activity log entry
      const relevantLogs = activityLogs.filter(log => 
        log.resource === resourceType && 
        log.resourceId === resourceId && 
        log.action === action &&
        log.statusCode && log.statusCode < 400 // Only successful operations
      );
      
      // Find the log closest to the change date
      let closestLog = null;
      let minTimeDiff = Infinity;
      
      for (const log of relevantLogs) {
        const timeDiff = Math.abs(log.createdAt.getTime() - changeDate.getTime());
        if (timeDiff < minTimeDiff && timeDiff < 60000) { // Within 1 minute
          minTimeDiff = timeDiff;
          closestLog = log;
        }
      }
      
      return closestLog ? closestLog.username : 'System';
    };
    
    // Helper function to check if date is within range
    const isWithinRange = (date: Date | null | undefined): boolean => {
      if (!date) return false;
      if (!startDate && !endDate) return true;
      if (startDate && endDate) {
        return date >= startDate && date <= endDate;
      }
      if (startDate) return date >= startDate;
      if (endDate) return date <= endDate;
      return true;
    };

    // 1. Get Change Requests with various status changes
    const changeRequestsQuery = startDate && endDate 
      ? db.select().from(changeRequests).where(
          or(
            // Created within range
            and(
              gte(changeRequests.createdAt, startDate),
              lte(changeRequests.createdAt, endDate)
            ),
            // Status changed within range (check date fields)
            and(
              gte(changeRequests.targetDate!, startDate),
              lte(changeRequests.targetDate!, endDate)
            ),
            and(
              gte(changeRequests.completedDate!, startDate),
              lte(changeRequests.completedDate!, endDate)
            ),
            // Also check updated date for status changes
            and(
              gte(changeRequests.updatedAt, startDate),
              lte(changeRequests.updatedAt, endDate)
            )
          )
        )
      : db.select().from(changeRequests);

    const changeRequestsData = await changeRequestsQuery;
    
    // Add change request events
    changeRequestsData.forEach(cr => {
      // Add creation event
      if (isWithinRange(cr.createdAt)) {
        timelineEvents.push({
          id: `cr-${cr.id}-created`,
          type: 'change_request',
          title: `Change Request Created: ${cr.title}`,
          description: cr.description || 'No description provided',
          status: 'created',
          date: cr.createdAt,
          owner: cr.requestedBy || cr.owner || findUserForChange('change_requests', cr.id, 'create', cr.createdAt) || 'Unknown',
          priority: cr.priority,
          entityId: cr.id,
          crNumber: cr.crNumber
        });
      }

      // Add status change events based on current status and dates
      if (cr.updatedAt && cr.updatedAt !== cr.createdAt && isWithinRange(cr.updatedAt)) {
        // Add a status change event based on current status
        let statusEvent = null;
        switch (cr.status) {
          case 'submitted':
            statusEvent = {
              id: `cr-${cr.id}-submitted`,
              type: 'change_request',
              title: `Change Request Submitted: ${cr.title}`,
              description: `Status changed to submitted`,
              status: 'submitted',
              date: cr.updatedAt,
              owner: findUserForChange('change_requests', cr.id, 'update', cr.updatedAt) || cr.owner || 'Unknown',
              priority: cr.priority,
              entityId: cr.id,
              crNumber: cr.crNumber
            };
            break;
          case 'approved':
            statusEvent = {
              id: `cr-${cr.id}-approved`,
              type: 'change_request',
              title: `Change Request Approved: ${cr.title}`,
              description: `Approved by ${cr.approvedBy || 'reviewer'}`,
              status: 'approved',
              date: cr.updatedAt,
              owner: cr.approvedBy || cr.owner || 'Unknown',
              priority: cr.priority,
              entityId: cr.id,
              crNumber: cr.crNumber
            };
            break;
          case 'in_progress':
            statusEvent = {
              id: `cr-${cr.id}-in-progress`,
              type: 'change_request',
              title: `Change Request In Progress: ${cr.title}`,
              description: `Implementation started`,
              status: 'in_progress',
              date: cr.updatedAt,
              owner: findUserForChange('change_requests', cr.id, 'update', cr.updatedAt) || cr.owner || 'Unknown',
              priority: cr.priority,
              entityId: cr.id,
              crNumber: cr.crNumber
            };
            break;
          case 'rejected':
            statusEvent = {
              id: `cr-${cr.id}-rejected`,
              type: 'change_request',
              title: `Change Request Rejected: ${cr.title}`,
              description: `Rejected by reviewer`,
              status: 'rejected',
              date: cr.updatedAt,
              owner: findUserForChange('change_requests', cr.id, 'update', cr.updatedAt) || cr.owner || 'Unknown',
              priority: cr.priority,
              entityId: cr.id,
              crNumber: cr.crNumber
            };
            break;
        }
        
        if (statusEvent) {
          timelineEvents.push(statusEvent);
        }
      }

      // Add completed event if completed date is set
      if (cr.completedDate && isWithinRange(cr.completedDate)) {
        timelineEvents.push({
          id: `cr-${cr.id}-completed`,
          type: 'change_request',
          title: `Change Request Completed: ${cr.title}`,
          description: `Implementation completed`,
          status: 'completed',
          date: cr.completedDate,
          owner: cr.owner || 'Unknown',
          priority: cr.priority,
          entityId: cr.id,
          crNumber: cr.crNumber
        });
      }

      // Add target date event if applicable
      if (cr.targetDate && isWithinRange(cr.targetDate)) {
        timelineEvents.push({
          id: `cr-${cr.id}-target`,
          type: 'change_request',
          title: `Change Request Target Date: ${cr.title}`,
          description: `Target completion date set`,
          status: cr.status,
          date: cr.targetDate,
          owner: cr.owner || 'Unknown',
          priority: cr.priority,
          entityId: cr.id,
          crNumber: cr.crNumber
        });
      }
    });

    // 2. Get Applications that changed
    const applicationsQuery = startDate && endDate
      ? db.select().from(applications).where(
          and(
            gte(applications.lastChangeDate, startDate),
            lte(applications.lastChangeDate, endDate)
          )
        )
      : db.select().from(applications);

    const applicationsData = await applicationsQuery;
    
    applicationsData.forEach(app => {
      if (isWithinRange(app.lastChangeDate)) {
        timelineEvents.push({
          id: `app-${app.id}-changed`,
          type: 'application',
          title: `Application Updated: ${app.name}`,
          description: `AML: ${app.amlNumber} - ${app.description || 'No description'}`,
          status: app.status,
          date: app.lastChangeDate,
          owner: findUserForChange('applications', app.id, 'update', app.lastChangeDate) || 'System',
          priority: 'medium',
          entityId: app.id,
          amlNumber: app.amlNumber
        });
      }
    });

    // 3. Get Interfaces that changed
    const interfacesQuery = startDate && endDate
      ? db.select()
        .from(interfaces)
        .where(
          and(
            gte(interfaces.lastChangeDate, startDate),
            lte(interfaces.lastChangeDate, endDate)
          )
        )
      : db.select()
        .from(interfaces);

    const interfacesData = await interfacesQuery;
    
    // Get all application IDs we need to look up
    const appIds = new Set<number>();
    interfacesData.forEach(iface => {
      if (iface.providerApplicationId) appIds.add(iface.providerApplicationId);
      if (iface.consumerApplicationId) appIds.add(iface.consumerApplicationId);
    });
    
    // Fetch all needed applications in one query
    const appsMap = new Map<number, any>();
    if (appIds.size > 0) {
      const apps = await db.select()
        .from(applications)
        .where(inArray(applications.id, [...appIds]));
      
      apps.forEach(app => {
        appsMap.set(app.id, app);
      });
    }
    
    interfacesData.forEach(iface => {
      if (isWithinRange(iface.lastChangeDate)) {
        const provider = iface.providerApplicationId ? appsMap.get(iface.providerApplicationId) : null;
        const consumer = iface.consumerApplicationId ? appsMap.get(iface.consumerApplicationId) : null;
        const providerName = provider?.name || 'Unknown Provider';
        const consumerName = consumer?.name || 'Unknown Consumer';
        
        timelineEvents.push({
          id: `iface-${iface.id}-changed`,
          type: 'interface',
          title: `Interface Updated: ${iface.imlNumber}`,
          description: `${providerName} → ${consumerName} (${iface.interfaceType})`,
          status: iface.status,
          date: iface.lastChangeDate,
          owner: findUserForChange('interfaces', iface.id, 'update', iface.lastChangeDate) || iface.providerOwner || 'System',
          priority: 'medium',
          entityId: iface.id,
          imlNumber: iface.imlNumber
        });
      }
    });

    // 4. Get Business Processes that changed
    const businessProcessesQuery = startDate && endDate
      ? db.select().from(businessProcesses).where(
          and(
            gte(businessProcesses.updatedAt, startDate),
            lte(businessProcesses.updatedAt, endDate)
          )
        )
      : db.select().from(businessProcesses);

    const businessProcessesData = await businessProcessesQuery;
    
    businessProcessesData.forEach(bp => {
      // Only add if updated after creation
      if (bp.updatedAt && bp.updatedAt !== bp.createdAt && isWithinRange(bp.updatedAt)) {
        timelineEvents.push({
          id: `bp-${bp.id}-changed`,
          type: 'business_process',
          title: `Business Process Updated: ${bp.businessProcess}`,
          description: `${bp.lob || 'N/A'} - ${bp.product || 'N/A'}`,
          status: 'updated',
          date: bp.updatedAt,
          owner: findUserForChange('business_processes', bp.id, 'update', bp.updatedAt) || bp.domainOwner || bp.itOwner || 'System',
          priority: 'medium',
          entityId: bp.id
        });
      } else if (isWithinRange(bp.createdAt)) {
        timelineEvents.push({
          id: `bp-${bp.id}-created`,
          type: 'business_process',
          title: `Business Process Created: ${bp.businessProcess}`,
          description: `${bp.lob || 'N/A'} - ${bp.product || 'N/A'}`,
          status: 'created',
          date: bp.createdAt,
          owner: findUserForChange('business_processes', bp.id, 'create', bp.createdAt) || bp.domainOwner || bp.itOwner || 'System',
          priority: 'medium',
          entityId: bp.id
        });
      }
    });

    // Sort all events by date (newest first)
    timelineEvents.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA;
    });

    return timelineEvents;
  }

  // Business Processes
  async getAllBusinessProcesses(): Promise<BusinessProcess[]> {
    return await db.select().from(businessProcesses).orderBy(asc(businessProcesses.businessProcess));
  }

  async getBusinessProcess(id: number): Promise<BusinessProcess | undefined> {
    const [bp] = await db.select().from(businessProcesses).where(eq(businessProcesses.id, id));
    return bp || undefined;
  }

  async createBusinessProcess(insertBP: InsertBusinessProcess): Promise<BusinessProcess> {
    const [bp] = await db
      .insert(businessProcesses)
      .values({
        ...insertBP,
        updatedAt: new Date()
      })
      .returning();
    return bp;
  }

  async updateBusinessProcess(id: number, insertBP: InsertBusinessProcess): Promise<BusinessProcess | undefined> {
    const [bp] = await db
      .update(businessProcesses)
      .set({
        ...insertBP,
        updatedAt: new Date()
      })
      .where(eq(businessProcesses.id, id))
      .returning();
    return bp || undefined;
  }

  async deleteBusinessProcess(id: number): Promise<boolean> {
    try {
      const bp = await this.getBusinessProcess(id);
      if (!bp) return false;

      // If this was a Level A or B process, get children before deleting relationships
      let childrenToCheck: BusinessProcess[] = [];
      if (bp.level === 'A' || bp.level === 'B') {
        childrenToCheck = await this.getBusinessProcessChildren(id);
      }

      // Delete related records in dependent tables
      await db.delete(businessProcessInterfaces).where(eq(businessProcessInterfaces.businessProcessId, id));
      await db.delete(imlDiagrams).where(eq(imlDiagrams.businessProcessId, id));
      
      // Delete all relationships where this process is the parent
      await db.delete(businessProcessRelationships).where(
        eq(businessProcessRelationships.parentProcessId, id)
      );
      
      // Delete relationships where this process is the child
      await db.delete(businessProcessRelationships).where(
        eq(businessProcessRelationships.childProcessId, id)
      );
      
      // Delete conversation links to this business process
      await db.delete(conversationLinks).where(
        and(
          eq(conversationLinks.entityType, 'business_process'),
          eq(conversationLinks.entityId, id)
        )
      );
      
      // Delete the business process
      const result = await db.delete(businessProcesses).where(eq(businessProcesses.id, id));
      
      // Check for orphaned children after deletion
      for (const child of childrenToCheck) {
        // Check if this child has any remaining parents
        const remainingParents = await this.getBusinessProcessParents(child.id);
        
        // If no parents remain, recursively delete the orphan
        if (remainingParents.length === 0) {
          await this.deleteBusinessProcess(child.id);
        }
      }
      
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error('Error in deleteBusinessProcess:', error);
      throw error;
    }
  }

  // Business Process Relationships
  async getBusinessProcessParents(childProcessId: number): Promise<BusinessProcess[]> {
    const relationships = await db
      .select({
        parent: businessProcesses,
        sequenceNumber: businessProcessRelationships.sequenceNumber
      })
      .from(businessProcessRelationships)
      .innerJoin(businessProcesses, eq(businessProcessRelationships.parentProcessId, businessProcesses.id))
      .where(eq(businessProcessRelationships.childProcessId, childProcessId))
      .orderBy(businessProcessRelationships.sequenceNumber);
    
    return relationships.map(r => ({
      ...r.parent,
      sequenceNumber: r.sequenceNumber
    }));
  }

  async getBusinessProcessChildren(parentProcessId: number): Promise<BusinessProcess[]> {
    const relationships = await db
      .select({
        child: businessProcesses,
        sequenceNumber: businessProcessRelationships.sequenceNumber
      })
      .from(businessProcessRelationships)
      .innerJoin(businessProcesses, eq(businessProcessRelationships.childProcessId, businessProcesses.id))
      .where(eq(businessProcessRelationships.parentProcessId, parentProcessId))
      .orderBy(businessProcessRelationships.sequenceNumber);
    
    return relationships.map(r => ({
      ...r.child,
      sequenceNumber: r.sequenceNumber
    }));
  }

  async addBusinessProcessRelationship(relationship: InsertBusinessProcessRelationship): Promise<BusinessProcessRelationship> {
    const [result] = await db
      .insert(businessProcessRelationships)
      .values(relationship)
      .returning();
    return result;
  }

  async updateBusinessProcessRelationship(parentId: number, childId: number, updates: Partial<InsertBusinessProcessRelationship>): Promise<BusinessProcessRelationship | undefined> {
    const [result] = await db
      .update(businessProcessRelationships)
      .set(updates)
      .where(
        and(
          eq(businessProcessRelationships.parentProcessId, parentId),
          eq(businessProcessRelationships.childProcessId, childId)
        )
      )
      .returning();
    return result || undefined;
  }

  async removeBusinessProcessRelationship(parentId: number, childId: number): Promise<boolean> {
    const result = await db
      .delete(businessProcessRelationships)
      .where(
        and(
          eq(businessProcessRelationships.parentProcessId, parentId),
          eq(businessProcessRelationships.childProcessId, childId)
        )
      );
    return (result.rowCount || 0) > 0;
  }

  async getBusinessProcessRelationships(processId: number): Promise<BusinessProcessRelationship[]> {
    return await db
      .select()
      .from(businessProcessRelationships)
      .where(
        or(
          eq(businessProcessRelationships.parentProcessId, processId),
          eq(businessProcessRelationships.childProcessId, processId)
        )
      );
  }

  async getAllBusinessProcessRelationships(): Promise<BusinessProcessRelationship[]> {
    return await db
      .select()
      .from(businessProcessRelationships)
      .orderBy(asc(businessProcessRelationships.sequenceNumber));
  }

  async duplicateBusinessProcessWithChildren(id: number): Promise<BusinessProcess | undefined> {
    const originalBP = await this.getBusinessProcess(id);
    if (!originalBP) return undefined;

    // Create the duplicated business process
    const duplicatedBP = await this.createBusinessProcess({
      businessProcess: `${originalBP.businessProcess} (Copy)`,
      lob: originalBP.lob,
      product: originalBP.product,
      version: '1.0',
      domainOwner: originalBP.domainOwner,
      itOwner: originalBP.itOwner,
      vendorFocal: originalBP.vendorFocal,
      status: originalBP.status,
      level: originalBP.level,
    });

    // Handle children based on the level
    if (originalBP.level === 'A') {
      // For Level A: reuse existing Level B and C children (don't duplicate them)
      const children = await this.getBusinessProcessChildren(id);
      
      // Create relationships to existing children
      for (const child of children) {
        await this.addBusinessProcessRelationship({
          parentProcessId: duplicatedBP.id,
          childProcessId: child.id,
          relationshipType: 'contains',
          sequenceNumber: (child as any).sequenceNumber || 1
        });
      }
    } else if (originalBP.level === 'B') {
      // For Level B: duplicate all Level C children
      const children = await this.getBusinessProcessChildren(id);
      
      for (const child of children) {
        const duplicatedChild = await this.createBusinessProcess({
          businessProcess: `${child.businessProcess} (Copy)`,
          lob: child.lob,
          product: child.product,
          version: child.version || '1.0',
          domainOwner: child.domainOwner,
          itOwner: child.itOwner,
          vendorFocal: child.vendorFocal,
          status: child.status,
          level: child.level,
        });
        
        // Create relationship between duplicated parent and duplicated child
        await this.addBusinessProcessRelationship({
          parentProcessId: duplicatedBP.id,
          childProcessId: duplicatedChild.id,
          relationshipType: 'contains',
          sequenceNumber: (child as any).sequenceNumber || 1
        });
      }
    }
    // Level C processes have no children, so nothing to do

    // Also duplicate parent relationships if any
    const parents = await this.getBusinessProcessParents(id);
    for (const parent of parents) {
      await this.addBusinessProcessRelationship({
        parentProcessId: parent.id,
        childProcessId: duplicatedBP.id,
        relationshipType: 'contains',
        sequenceNumber: (parent as any).sequenceNumber || 1
      });
    }

    return duplicatedBP;
  }

  async getBusinessProcessDeletionImpact(id: number): Promise<{ canDelete: boolean; orphanedChildren: BusinessProcess[]; message: string; }> {
    const bp = await this.getBusinessProcess(id);
    if (!bp) {
      return {
        canDelete: false,
        orphanedChildren: [],
        message: "Business process not found"
      };
    }

    const orphanedChildren: BusinessProcess[] = [];
    
    // Check if this process has children
    if (bp.level === 'A' || bp.level === 'B') {
      const children = await this.getBusinessProcessChildren(id);
      
      for (const child of children) {
        // Check if this child has other parents
        const allParents = await this.getBusinessProcessParents(child.id);
        
        // If this is the only parent, the child will be orphaned
        if (allParents.length === 1 && allParents[0].id === id) {
          orphanedChildren.push(child);
        }
      }
    }
    
    let message = `Business process "${bp.businessProcess}" will be deleted.`;
    if (orphanedChildren.length > 0) {
      const orphanNames = orphanedChildren.map(c => c.businessProcess).join(', ');
      message += ` The following child processes will also be deleted as they will have no remaining parents: ${orphanNames}`;
    }
    
    return {
      canDelete: true,
      orphanedChildren,
      message
    };
  }

  // Business Process Interfaces
  async getBusinessProcessInterfaces(businessProcessId: number): Promise<any[]> {
    try {
      // First, get the business process interface mappings
      const bpInterfaceMappings = await db
        .select()
        .from(businessProcessInterfaces)
        .where(eq(businessProcessInterfaces.businessProcessId, businessProcessId))
        .orderBy(asc(businessProcessInterfaces.sequenceNumber));

      if (bpInterfaceMappings.length === 0) {
        return [];
      }

      // Then fetch the full interface details for each mapping
      const interfacesWithDetails = await Promise.all(
        bpInterfaceMappings.map(async (mapping) => {
          const [interfaceData] = await db
            .select()
            .from(interfaces)
            .where(eq(interfaces.id, mapping.interfaceId!));

          if (!interfaceData) {
            return null;
          }

          // Fetch provider and consumer applications
          let providerApp = null;
          let consumerApp = null;

          if (interfaceData.providerApplicationId) {
            const [provider] = await db
              .select()
              .from(applications)
              .where(eq(applications.id, interfaceData.providerApplicationId));
            providerApp = provider || null;
          }

          if (interfaceData.consumerApplicationId) {
            const [consumer] = await db
              .select()
              .from(applications)
              .where(eq(applications.id, interfaceData.consumerApplicationId));
            consumerApp = consumer || null;
          }

          return {
            id: mapping.id,
            businessProcessId: mapping.businessProcessId,
            interfaceId: mapping.interfaceId,
            sequenceNumber: mapping.sequenceNumber,
            description: mapping.description,
            createdAt: mapping.createdAt,
            // Interface details
            imlNumber: interfaceData.imlNumber,
            interfaceType: interfaceData.interfaceType,
            interfaceDescription: interfaceData.description,
            status: interfaceData.status,
            version: interfaceData.version,
            businessProcessName: interfaceData.businessProcessName,
            customerFocal: interfaceData.customerFocal,
            providerOwner: interfaceData.providerOwner,
            consumerOwner: interfaceData.consumerOwner,
            providerApplicationId: interfaceData.providerApplicationId,
            consumerApplicationId: interfaceData.consumerApplicationId,
            lastChangeDate: interfaceData.lastChangeDate,
            connectivitySteps: interfaceData.connectivitySteps,
            sampleCode: interfaceData.sampleCode,
            providerApp,
            consumerApp,
          };
        })
      );

      return interfacesWithDetails.filter(item => item !== null);
    } catch (error) {
      console.error("Error fetching business process interfaces:", error);
      throw error;
    }
  }

  async addBusinessProcessInterface(bpInterface: InsertBusinessProcessInterface): Promise<BusinessProcessInterface> {
    const [result] = await db
      .insert(businessProcessInterfaces)
      .values(bpInterface)
      .returning();
    
    // Clear saved diagram for the business process since a new interface was added
    if (result && result.businessProcessId) {
      await this.deleteImlDiagramsForBusinessProcess(result.businessProcessId);
      console.log(`Cleared saved diagram for business process ${result.businessProcessId} due to new interface ${result.interfaceId} assignment`);
    }
    
    return result;
  }

  async removeBusinessProcessInterface(id: number): Promise<boolean> {
    try {
      // First, get the business process interface to find which BP will be affected
      const [existing] = await db
        .select()
        .from(businessProcessInterfaces)
        .where(eq(businessProcessInterfaces.id, id));
      
      if (!existing) return false;
      
      // Delete the assignment
      const result = await db.delete(businessProcessInterfaces).where(eq(businessProcessInterfaces.id, id));
      const success = (result.rowCount || 0) > 0;
      
      // Clear saved diagram for the affected business process
      if (success && existing.businessProcessId) {
        await this.deleteImlDiagramsForBusinessProcess(existing.businessProcessId);
        console.log(`Cleared saved diagram for business process ${existing.businessProcessId} due to interface ${existing.interfaceId} removal`);
      }
      
      return success;
    } catch (error) {
      console.error('Error in removeBusinessProcessInterface:', error);
      throw error;
    }
  }

  async removeAllBusinessProcessesFromInterface(interfaceId: number): Promise<boolean> {
    try {
      // First, get all business processes that currently use this interface
      const existing = await db
        .select()
        .from(businessProcessInterfaces)
        .where(eq(businessProcessInterfaces.interfaceId, interfaceId));
      
      const affectedBPIds = existing
        .map(e => e.businessProcessId)
        .filter((id): id is number => id !== null);
      
      // Remove all assignments
      const result = await db.delete(businessProcessInterfaces).where(eq(businessProcessInterfaces.interfaceId, interfaceId));
      
      // Clear saved diagrams for all affected business processes
      if (affectedBPIds.length > 0) {
        await this.deleteImlDiagramsForBusinessProcesses(affectedBPIds);
        console.log(`Cleared saved diagrams for business processes: ${affectedBPIds.join(', ')} due to interface ${interfaceId} being removed from all business processes`);
      }
      
      return true; // Always return true as we don't care if there were any to delete
    } catch (error) {
      console.error('Error in removeAllBusinessProcessesFromInterface:', error);
      throw error;
    }
  }

  async updateInterfaceBusinessProcesses(interfaceId: number, assignments: any[]): Promise<void> {
    try {
      // First, get existing assignments
      const existing = await db
        .select()
        .from(businessProcessInterfaces)
        .where(eq(businessProcessInterfaces.interfaceId, interfaceId));
      
      // Collect all business process IDs that will be affected by this change
      const existingBPIds = existing.map(e => e.businessProcessId);
      const newBPIds = assignments.map(a => a.businessProcessId);
      const allAffectedBPIds = [...new Set([...existingBPIds, ...newBPIds])];
      
      // Delete all existing assignments
      if (existing.length > 0) {
        await db.delete(businessProcessInterfaces)
          .where(eq(businessProcessInterfaces.interfaceId, interfaceId));
      }
      
      // Then, insert new assignments
      if (assignments.length > 0) {
        const newAssignments = assignments.map(assignment => ({
          interfaceId,
          businessProcessId: assignment.businessProcessId,
          sequenceNumber: assignment.sequenceNumber,
          description: assignment.description || null
        }));
        
        await db.insert(businessProcessInterfaces).values(newAssignments);
      }
      
      // Clear saved diagrams for all affected business processes
      // This ensures diagrams are regenerated with the updated interface assignments
      if (allAffectedBPIds.length > 0) {
        await this.deleteImlDiagramsForBusinessProcesses(allAffectedBPIds);
        console.log(`Cleared saved diagrams for business processes: ${allAffectedBPIds.join(', ')} due to interface ${interfaceId} assignment changes`);
      }
    } catch (error) {
      console.error('Error in updateInterfaceBusinessProcesses:', error);
      throw error;
    }
  }

  async getInterfaceBusinessProcesses(interfaceId: number): Promise<any[]> {
    try {
      const mappings = await db
        .select()
        .from(businessProcessInterfaces)
        .where(eq(businessProcessInterfaces.interfaceId, interfaceId))
        .orderBy(asc(businessProcessInterfaces.sequenceNumber));

      const businessProcessesWithDetails = await Promise.all(
        mappings.map(async (mapping) => {
          const [businessProcessData] = await db
            .select()
            .from(businessProcesses)
            .where(eq(businessProcesses.id, mapping.businessProcessId));

          if (!businessProcessData) return null;

          return {
            id: mapping.id,
            businessProcessId: mapping.businessProcessId,
            interfaceId: mapping.interfaceId,
            sequenceNumber: mapping.sequenceNumber,
            description: mapping.description,
            createdAt: mapping.createdAt,
            // Business Process details
            businessProcess: businessProcessData.businessProcess,
            lob: businessProcessData.lob,
            product: businessProcessData.product,
            version: businessProcessData.version,
            domainOwner: businessProcessData.domainOwner,
            itOwner: businessProcessData.itOwner,
            vendorFocal: businessProcessData.vendorFocal,
            status: businessProcessData.status,
          };
        })
      );

      return businessProcessesWithDetails.filter(item => item !== null);
    } catch (error) {
      console.error("Error fetching interface business processes:", error);
      throw error;
    }
  }

  async updateBusinessProcessInterfaceSequence(id: number, sequenceNumber: number): Promise<BusinessProcessInterface | undefined> {
    const [result] = await db
      .update(businessProcessInterfaces)
      .set({ sequenceNumber })
      .where(eq(businessProcessInterfaces.id, id))
      .returning();
    return result || undefined;
  }

  // Interface Versions
  async getInterfaceVersions(interfaceId: number): Promise<InterfaceVersion[]> {
    return await db
      .select()
      .from(interfaceVersions)
      .where(eq(interfaceVersions.interfaceId, interfaceId))
      .orderBy(desc(interfaceVersions.createdAt));
  }

  async createInterfaceVersion(version: InsertInterfaceVersion): Promise<InterfaceVersion> {
    const [result] = await db
      .insert(interfaceVersions)
      .values(version)
      .returning();
    return result;
  }

  // Interface Consumer Descriptions
  async getInterfaceConsumerDescription(interfaceId: number, consumerApplicationId: number): Promise<InterfaceConsumerDescription | undefined> {
    const [result] = await db
      .select()
      .from(interfaceConsumerDescriptions)
      .where(and(
        eq(interfaceConsumerDescriptions.interfaceId, interfaceId),
        eq(interfaceConsumerDescriptions.consumerApplicationId, consumerApplicationId)
      ));
    return result || undefined;
  }

  async createInterfaceConsumerDescription(description: InsertInterfaceConsumerDescription): Promise<InterfaceConsumerDescription> {
    const [result] = await db
      .insert(interfaceConsumerDescriptions)
      .values({
        ...description,
        updatedAt: new Date()
      })
      .returning();
    return result;
  }

  async updateInterfaceConsumerDescription(id: number, description: InsertInterfaceConsumerDescription): Promise<InterfaceConsumerDescription | undefined> {
    const [result] = await db
      .update(interfaceConsumerDescriptions)
      .set({
        ...description,
        updatedAt: new Date()
      })
      .where(eq(interfaceConsumerDescriptions.id, id))
      .returning();
    return result || undefined;
  }

  // Business Process Move and Resequence methods
  async moveBusinessProcess(processId: number, newParentId: number | null, position?: number): Promise<BusinessProcess | undefined> {
    try {
      // Get the process being moved
      const process = await this.getBusinessProcess(processId);
      if (!process) return undefined;

      // Prevent moving a process to itself or its descendants
      if (newParentId) {
        const isDescendant = await this.isDescendantOf(newParentId, processId);
        if (isDescendant || newParentId === processId) {
          throw new Error("Cannot move a process to itself or its descendants");
        }
      }

      // Determine new level based on parent
      let newLevel = 'A';
      if (newParentId) {
        const newParent = await this.getBusinessProcess(newParentId);
        if (!newParent) throw new Error("New parent not found");
        
        if (newParent.level === 'A') newLevel = 'B';
        else if (newParent.level === 'B') newLevel = 'C';
        else throw new Error("Cannot add children to Level C process");
      }

      // Remove existing parent relationship
      const currentParents = await this.getBusinessProcessParents(processId);
      for (const parent of currentParents) {
        await this.removeBusinessProcessRelationship(parent.id, processId);
      }

      // Update the process level
      await this.updateProcessLevelRecursively(processId, newLevel);

      // Add new parent relationship if not root
      if (newParentId) {
        // Get siblings to determine sequence number
        const siblings = await this.getBusinessProcessChildren(newParentId);
        let sequenceNumber = 10;

        if (position !== undefined && position >= 0 && position <= siblings.length) {
          // Insert at specific position
          if (position === 0) {
            // Insert at beginning
            sequenceNumber = 5; // Place at beginning with lower sequence
          } else if (position >= siblings.length) {
            // Insert at end
            const lastSibling = siblings[siblings.length - 1];
            sequenceNumber = (siblings.length + 1) * 10;
          } else {
            // Insert between siblings
            const prevSibling = siblings[position - 1];
            const nextSibling = siblings[position];
            sequenceNumber = (position * 10) + 5; // Place between positions
          }
        } else {
          // Append to end
          const lastSibling = siblings[siblings.length - 1];
          sequenceNumber = siblings.length > 0 ? (siblings.length + 1) * 10 : 10;
        }

        await this.addBusinessProcessRelationship({
          parentProcessId: newParentId,
          childProcessId: processId,
          relationshipType: 'contains',
          sequenceNumber: Math.round(sequenceNumber)
        });

        // Resequence if needed
        if (sequenceNumber % 10 !== 0) {
          await this.resequenceBusinessProcessChildren(newParentId);
        }
      }

      return await this.getBusinessProcess(processId);
    } catch (error) {
      console.error('Error moving business process:', error);
      throw error;
    }
  }

  async updateProcessLevelRecursively(processId: number, newLevel: string): Promise<void> {
    // Update the process level
    await db
      .update(businessProcesses)
      .set({ level: newLevel, updatedAt: new Date() })
      .where(eq(businessProcesses.id, processId));

    // Update children levels recursively
    const children = await this.getBusinessProcessChildren(processId);
    const childLevel = newLevel === 'A' ? 'B' : newLevel === 'B' ? 'C' : 'C';
    
    for (const child of children) {
      if (childLevel !== 'C' || child.level !== 'C') {
        await this.updateProcessLevelRecursively(child.id, childLevel);
      }
    }
  }

  async isDescendantOf(possibleDescendantId: number, ancestorId: number): Promise<boolean> {
    const children = await this.getBusinessProcessChildren(ancestorId);
    
    for (const child of children) {
      if (child.id === possibleDescendantId) return true;
      const isChildDescendant = await this.isDescendantOf(possibleDescendantId, child.id);
      if (isChildDescendant) return true;
    }
    
    return false;
  }

  async resequenceBusinessProcessChildren(parentId: number): Promise<void> {
    const children = await this.getBusinessProcessChildren(parentId);
    
    // Sort by current sequence number
    children.sort((a, b) => (a.sequenceNumber || 0) - (b.sequenceNumber || 0));
    
    // Resequence with increments of 10
    for (let i = 0; i < children.length; i++) {
      const newSequence = (i + 1) * 10;
      if (children[i].sequenceNumber !== newSequence) {
        await this.updateBusinessProcessRelationship(
          parentId,
          children[i].id,
          { sequenceNumber: newSequence }
        );
      }
    }
  }

  // IML Diagrams
  async getImlDiagram(businessProcessId: number): Promise<ImlDiagram | undefined> {
    const [diagram] = await db
      .select()
      .from(imlDiagrams)
      .where(eq(imlDiagrams.businessProcessId, businessProcessId));
    return diagram || undefined;
  }

  async createImlDiagram(diagram: InsertImlDiagram): Promise<ImlDiagram> {
    const [result] = await db
      .insert(imlDiagrams)
      .values({
        ...diagram,
        updatedAt: new Date()
      })
      .returning();
    return result;
  }

  async updateImlDiagram(id: number, diagram: InsertImlDiagram): Promise<ImlDiagram | undefined> {
    const [result] = await db
      .update(imlDiagrams)
      .set({
        ...diagram,
        updatedAt: new Date()
      })
      .where(eq(imlDiagrams.id, id))
      .returning();
    return result || undefined;
  }

  async deleteImlDiagramsForBusinessProcess(businessProcessId: number): Promise<boolean> {
    const result = await db.delete(imlDiagrams).where(eq(imlDiagrams.businessProcessId, businessProcessId));
    return (result.rowCount || 0) > 0;
  }

  async deleteImlDiagramsForBusinessProcesses(businessProcessIds: number[]): Promise<boolean> {
    if (businessProcessIds.length === 0) return false;
    const result = await db.delete(imlDiagrams).where(inArray(imlDiagrams.businessProcessId, businessProcessIds));
    return (result.rowCount || 0) > 0;
  }

  // Import/Export methods
  async exportAllData(): Promise<any> {
    try {
      // Fetch all data from all tables
      const [
        applicationsData,
        interfacesData,
        businessProcessesData,
        businessProcessInterfacesData,
        changeRequestsData,
        changeRequestApplicationsData,
        changeRequestInterfacesData,
        interfaceCommentsData,
        interfaceVersionsData,
        interfaceConsumerDescriptionsData,
        imlDiagramsData
      ] = await Promise.all([
        db.select().from(applications),
        db.select().from(interfaces),
        db.select().from(businessProcesses),
        db.select().from(businessProcessInterfaces),
        db.select().from(changeRequests),
        db.select().from(changeRequestApplications),
        db.select().from(changeRequestInterfaces),
        db.select().from(interfaceComments),
        db.select().from(interfaceVersions),
        db.select().from(interfaceConsumerDescriptions),
        db.select().from(imlDiagrams)
      ]);

      return {
        version: "1.0",
        exportDate: new Date().toISOString(),
        data: {
          applications: applicationsData,
          interfaces: interfacesData,
          businessProcesses: businessProcessesData,
          businessProcessInterfaces: businessProcessInterfacesData,
          changeRequests: changeRequestsData,
          changeRequestApplications: changeRequestApplicationsData,
          changeRequestInterfaces: changeRequestInterfacesData,
          interfaceComments: interfaceCommentsData,
          interfaceVersions: interfaceVersionsData,
          interfaceConsumerDescriptions: interfaceConsumerDescriptionsData,
          imlDiagrams: imlDiagramsData
        }
      };
    } catch (error) {
      console.error("Error exporting data:", error);
      throw error;
    }
  }

  async importData(data: any, mode: 'truncate' | 'incremental'): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      // Validate data structure
      if (!data.version || !data.data) {
        return { success: false, message: "Invalid import file format" };
      }

      // Start transaction
      return await db.transaction(async (tx) => {
        const importDetails: any = {};

        // If truncate mode, delete all existing data
        if (mode === 'truncate') {
          // Delete in reverse order of dependencies
          await tx.delete(imlDiagrams);
          await tx.delete(interfaceConsumerDescriptions);
          await tx.delete(interfaceVersions);
          await tx.delete(interfaceComments);
          await tx.delete(changeRequestInterfaces);
          await tx.delete(changeRequestApplications);
          await tx.delete(changeRequests);
          await tx.delete(businessProcessInterfaces);
          await tx.delete(businessProcesses);
          await tx.delete(interfaces);
          await tx.delete(applications);
        }

        // Import applications
        if (data.data.applications?.length > 0) {
          const insertedApps = await tx
            .insert(applications)
            .values(data.data.applications.map((app: any) => ({
              ...app,
              id: mode === 'incremental' ? undefined : app.id,
              createdAt: new Date(app.createdAt),
              updatedAt: new Date(),
              firstActiveDate: app.firstActiveDate ? new Date(app.firstActiveDate) : null,
              lastChangeDate: new Date()
            })))
            .onConflictDoNothing()
            .returning();
          importDetails.applications = insertedApps.length;
        }

        // Import interfaces
        if (data.data.interfaces?.length > 0) {
          const insertedInterfaces = await tx
            .insert(interfaces)
            .values(data.data.interfaces.map((iface: any) => ({
              ...iface,
              id: mode === 'incremental' ? undefined : iface.id,
              createdAt: new Date(iface.createdAt),
              updatedAt: new Date(),
              lastChangeDate: new Date()
            })))
            .onConflictDoNothing()
            .returning();
          importDetails.interfaces = insertedInterfaces.length;
        }

        // Import business processes
        if (data.data.businessProcesses?.length > 0) {
          const insertedBPs = await tx
            .insert(businessProcesses)
            .values(data.data.businessProcesses.map((bp: any) => ({
              ...bp,
              id: mode === 'incremental' ? undefined : bp.id,
              createdAt: new Date(bp.createdAt),
              updatedAt: new Date()
            })))
            .onConflictDoNothing()
            .returning();
          importDetails.businessProcesses = insertedBPs.length;
        }

        // Import business process interfaces
        if (data.data.businessProcessInterfaces?.length > 0) {
          const insertedBPIs = await tx
            .insert(businessProcessInterfaces)
            .values(data.data.businessProcessInterfaces.map((bpi: any) => ({
              ...bpi,
              id: mode === 'incremental' ? undefined : bpi.id,
              createdAt: new Date(bpi.createdAt)
            })))
            .onConflictDoNothing()
            .returning();
          importDetails.businessProcessInterfaces = insertedBPIs.length;
        }

        // Import change requests
        if (data.data.changeRequests?.length > 0) {
          const insertedCRs = await tx
            .insert(changeRequests)
            .values(data.data.changeRequests.map((cr: any) => ({
              ...cr,
              id: mode === 'incremental' ? undefined : cr.id,
              createdAt: new Date(cr.createdAt),
              updatedAt: new Date(),
              targetDate: cr.targetDate ? new Date(cr.targetDate) : null,
              completedDate: cr.completedDate ? new Date(cr.completedDate) : null
            })))
            .onConflictDoNothing()
            .returning();
          importDetails.changeRequests = insertedCRs.length;
        }

        // Import related data (comments, versions, etc.)
        // ... (similar pattern for other tables)

        return {
          success: true,
          message: `Data imported successfully in ${mode} mode`,
          details: importDetails
        };
      });
    } catch (error) {
      console.error("Error importing data:", error);
      return { 
        success: false, 
        message: "Import failed", 
        details: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }

  // Entity-specific Export methods
  async exportApplications(): Promise<any> {
    try {
      console.log("Starting applications export...");
      const applicationsData = await db.select().from(applications);
      console.log(`Exported ${applicationsData.length} applications`);
      return {
        version: "1.0",
        exportDate: new Date().toISOString(),
        entity: "applications",
        data: applicationsData
      };
    } catch (error) {
      console.error("Error exporting applications:", error);
      throw error;
    }
  }

  async exportInterfaces(): Promise<any> {
    try {
      const [
        interfacesData,
        businessProcessInterfacesData,
        interfaceCommentsData,
        interfaceVersionsData,
        interfaceConsumerDescriptionsData
      ] = await Promise.all([
        db.select().from(interfaces),
        db.select().from(businessProcessInterfaces),
        db.select().from(interfaceComments),
        db.select().from(interfaceVersions),
        db.select().from(interfaceConsumerDescriptions)
      ]);

      return {
        version: "1.0",
        exportDate: new Date().toISOString(),
        entity: "interfaces",
        data: {
          interfaces: interfacesData,
          businessProcessInterfaces: businessProcessInterfacesData,
          interfaceComments: interfaceCommentsData,
          interfaceVersions: interfaceVersionsData,
          interfaceConsumerDescriptions: interfaceConsumerDescriptionsData
        }
      };
    } catch (error) {
      console.error("Error exporting interfaces:", error);
      throw error;
    }
  }

  async exportBusinessProcesses(): Promise<any> {
    try {
      const [
        businessProcessesData,
        businessProcessInterfacesData,
        imlDiagramsData
      ] = await Promise.all([
        db.select().from(businessProcesses),
        db.select().from(businessProcessInterfaces),
        db.select().from(imlDiagrams)
      ]);

      return {
        version: "1.0",
        exportDate: new Date().toISOString(),
        entity: "businessProcesses",
        data: {
          businessProcesses: businessProcessesData,
          businessProcessInterfaces: businessProcessInterfacesData,
          imlDiagrams: imlDiagramsData
        }
      };
    } catch (error) {
      console.error("Error exporting business processes:", error);
      throw error;
    }
  }

  async exportChangeRequests(): Promise<any> {
    try {
      const [
        changeRequestsData,
        changeRequestApplicationsData,
        changeRequestInterfacesData
      ] = await Promise.all([
        db.select().from(changeRequests),
        db.select().from(changeRequestApplications),
        db.select().from(changeRequestInterfaces)
      ]);

      return {
        version: "1.0",
        exportDate: new Date().toISOString(),
        entity: "changeRequests",
        data: {
          changeRequests: changeRequestsData,
          changeRequestApplications: changeRequestApplicationsData,
          changeRequestInterfaces: changeRequestInterfacesData
        }
      };
    } catch (error) {
      console.error("Error exporting change requests:", error);
      throw error;
    }
  }

  async exportTechnicalProcesses(): Promise<any> {
    try {
      const [
        technicalProcessesData,
        technicalProcessInterfacesData,
        technicalProcessDependenciesData,
        changeRequestTechnicalProcessesData
      ] = await Promise.all([
        db.select().from(technicalProcesses),
        db.select().from(technicalProcessInterfaces),
        db.select().from(technicalProcessDependencies),
        db.select().from(changeRequestTechnicalProcesses)
      ]);

      return {
        version: "1.0",
        exportDate: new Date().toISOString(),
        entity: "technicalProcesses",
        data: {
          technicalProcesses: technicalProcessesData,
          technicalProcessInterfaces: technicalProcessInterfacesData,
          technicalProcessDependencies: technicalProcessDependenciesData,
          changeRequestTechnicalProcesses: changeRequestTechnicalProcessesData
        }
      };
    } catch (error) {
      console.error("Error exporting technical processes:", error);
      throw error;
    }
  }

  // Entity-specific Import methods
  async importApplications(data: any, mode: 'truncate' | 'incremental'): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      if (!data.version || !data.entity || data.entity !== 'applications') {
        return { success: false, message: "Invalid applications export file" };
      }

      return await db.transaction(async (tx) => {
        const importDetails: any = {};

        if (mode === 'truncate') {
          // Delete related data first
          await tx.delete(changeRequestApplications);
          await tx.delete(interfaces);
          await tx.delete(applications);
        }

        if (data.data?.length > 0) {
          // Filter and validate data
          const validApps = data.data.filter((app: any) => {
            // Skip records with invalid IDs
            if (app.id && (isNaN(app.id) || app.id === 'NaN')) {
              console.warn(`Skipping application with invalid ID: ${app.id}`);
              return false;
            }
            return true;
          });

          const insertedApps = await tx
            .insert(applications)
            .values(validApps.map((app: any) => {
              const cleanApp = { ...app };
              // Remove id for incremental mode or if invalid
              if (mode === 'incremental' || !cleanApp.id || isNaN(cleanApp.id)) {
                delete cleanApp.id;
              }
              
              // Clean up date fields
              cleanApp.createdAt = app.createdAt ? new Date(app.createdAt) : new Date();
              cleanApp.updatedAt = new Date();
              cleanApp.firstActiveDate = app.firstActiveDate ? new Date(app.firstActiveDate) : null;
              cleanApp.lastChangeDate = new Date();
              
              // Ensure numeric fields are valid
              if (cleanApp.uptime && isNaN(cleanApp.uptime)) {
                cleanApp.uptime = null;
              }
              
              return cleanApp;
            }))
            .onConflictDoNothing()
            .returning();
          importDetails.applications = insertedApps.length;
          importDetails.skipped = data.data.length - validApps.length;
        }

        return {
          success: true,
          message: `Applications imported successfully in ${mode} mode`,
          details: importDetails
        };
      });
    } catch (error) {
      console.error("Error importing applications:", error);
      return { success: false, message: "Import failed", details: error };
    }
  }

  async importInterfaces(data: any, mode: 'truncate' | 'incremental'): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      if (!data.version || !data.entity || data.entity !== 'interfaces') {
        return { success: false, message: "Invalid interfaces export file" };
      }

      return await db.transaction(async (tx) => {
        const importDetails: any = {};

        if (mode === 'truncate') {
          // Delete in reverse order of dependencies
          await tx.delete(interfaceConsumerDescriptions);
          await tx.delete(interfaceVersions);
          await tx.delete(interfaceComments);
          await tx.delete(businessProcessInterfaces);
          await tx.delete(interfaces);
        }

        // Import interfaces
        if (data.data.interfaces?.length > 0) {
          // Filter and validate data
          const validInterfaces = data.data.interfaces.filter((iface: any) => {
            // Skip records with invalid IDs
            if (iface.id && (isNaN(iface.id) || iface.id === 'NaN')) {
              console.warn(`Skipping interface with invalid ID: ${iface.id}`);
              return false;
            }
            // Validate foreign key IDs
            if (iface.providerApplicationId && (isNaN(iface.providerApplicationId) || iface.providerApplicationId === 'NaN')) {
              console.warn(`Skipping interface with invalid provider ID: ${iface.providerApplicationId}`);
              return false;
            }
            if (iface.consumerApplicationId && (isNaN(iface.consumerApplicationId) || iface.consumerApplicationId === 'NaN')) {
              console.warn(`Skipping interface with invalid consumer ID: ${iface.consumerApplicationId}`);
              return false;
            }
            return true;
          });

          const insertedInterfaces = await tx
            .insert(interfaces)
            .values(validInterfaces.map((iface: any) => {
              const cleanInterface = { ...iface };
              // Remove id for incremental mode or if invalid
              if (mode === 'incremental' || !cleanInterface.id || isNaN(cleanInterface.id)) {
                delete cleanInterface.id;
              }
              
              // Clean up date fields
              cleanInterface.createdAt = iface.createdAt ? new Date(iface.createdAt) : new Date();
              cleanInterface.updatedAt = new Date();
              cleanInterface.lastChangeDate = new Date();
              
              // Ensure foreign key IDs are valid integers
              if (cleanInterface.providerApplicationId) {
                cleanInterface.providerApplicationId = parseInt(cleanInterface.providerApplicationId);
              }
              if (cleanInterface.consumerApplicationId) {
                cleanInterface.consumerApplicationId = parseInt(cleanInterface.consumerApplicationId);
              }
              
              return cleanInterface;
            }))
            .onConflictDoNothing()
            .returning();
          importDetails.interfaces = insertedInterfaces.length;
          importDetails.skipped = data.data.interfaces.length - validInterfaces.length;
        }

        // Import related data
        if (data.data.businessProcessInterfaces?.length > 0) {
          const insertedBPIs = await tx
            .insert(businessProcessInterfaces)
            .values(data.data.businessProcessInterfaces.map((bpi: any) => ({
              ...bpi,
              id: mode === 'incremental' ? undefined : bpi.id,
              createdAt: new Date(bpi.createdAt)
            })))
            .onConflictDoNothing()
            .returning();
          importDetails.businessProcessInterfaces = insertedBPIs.length;
        }

        return {
          success: true,
          message: `Interfaces imported successfully in ${mode} mode`,
          details: importDetails
        };
      });
    } catch (error) {
      console.error("Error importing interfaces:", error);
      return { success: false, message: "Import failed", details: error };
    }
  }

  async importBusinessProcesses(data: any, mode: 'truncate' | 'incremental'): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      if (!data.version || !data.entity || data.entity !== 'businessProcesses') {
        return { success: false, message: "Invalid business processes export file" };
      }

      return await db.transaction(async (tx) => {
        const importDetails: any = {};

        if (mode === 'truncate') {
          await tx.delete(imlDiagrams);
          await tx.delete(businessProcessInterfaces);
          await tx.delete(businessProcesses);
        }

        // Import business processes
        if (data.data.businessProcesses?.length > 0) {
          // Filter and validate data
          const validBPs = data.data.businessProcesses.filter((bp: any) => {
            // Skip records with invalid IDs
            if (bp.id && (isNaN(bp.id) || bp.id === 'NaN')) {
              console.warn(`Skipping business process with invalid ID: ${bp.id}`);
              return false;
            }
            return true;
          });

          const insertedBPs = await tx
            .insert(businessProcesses)
            .values(validBPs.map((bp: any) => {
              const cleanBP = { ...bp };
              // Remove id for incremental mode or if invalid
              if (mode === 'incremental' || !cleanBP.id || isNaN(cleanBP.id)) {
                delete cleanBP.id;
              }
              
              // Clean up date fields
              cleanBP.createdAt = bp.createdAt ? new Date(bp.createdAt) : new Date();
              cleanBP.updatedAt = new Date();
              
              return cleanBP;
            }))
            .onConflictDoNothing()
            .returning();
          importDetails.businessProcesses = insertedBPs.length;
          importDetails.skippedBPs = data.data.businessProcesses.length - validBPs.length;
        }

        return {
          success: true,
          message: `Business processes imported successfully in ${mode} mode`,
          details: importDetails
        };
      });
    } catch (error) {
      console.error("Error importing business processes:", error);
      return { success: false, message: "Import failed", details: error };
    }
  }

  async importChangeRequests(data: any, mode: 'truncate' | 'incremental'): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      if (!data.version || !data.entity || data.entity !== 'changeRequests') {
        return { success: false, message: "Invalid change requests export file" };
      }

      return await db.transaction(async (tx) => {
        const importDetails: any = {};

        if (mode === 'truncate') {
          await tx.delete(changeRequestInterfaces);
          await tx.delete(changeRequestApplications);
          await tx.delete(changeRequests);
        }

        // Import change requests
        if (data.data.changeRequests?.length > 0) {
          // Filter and validate data
          const validCRs = data.data.changeRequests.filter((cr: any) => {
            // Skip records with invalid IDs
            if (cr.id && (isNaN(cr.id) || cr.id === 'NaN')) {
              console.warn(`Skipping change request with invalid ID: ${cr.id}`);
              return false;
            }
            return true;
          });

          const insertedCRs = await tx
            .insert(changeRequests)
            .values(validCRs.map((cr: any) => {
              const cleanCR = { ...cr };
              // Remove id for incremental mode or if invalid
              if (mode === 'incremental' || !cleanCR.id || isNaN(cleanCR.id)) {
                delete cleanCR.id;
              }
              
              // Clean up date fields
              cleanCR.createdAt = cr.createdAt ? new Date(cr.createdAt) : new Date();
              cleanCR.updatedAt = new Date();
              cleanCR.targetDate = cr.targetDate ? new Date(cr.targetDate) : null;
              cleanCR.completedDate = cr.completedDate ? new Date(cr.completedDate) : null;
              
              return cleanCR;
            }))
            .onConflictDoNothing()
            .returning();
          importDetails.changeRequests = insertedCRs.length;
          importDetails.skippedCRs = data.data.changeRequests.length - validCRs.length;
        }

        return {
          success: true,
          message: `Change requests imported successfully in ${mode} mode`,
          details: importDetails
        };
      });
    } catch (error) {
      console.error("Error importing change requests:", error);
      return { success: false, message: "Import failed", details: error };
    }
  }

  async importTechnicalProcesses(data: any, mode: 'truncate' | 'incremental'): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      if (!data.version || !data.entity || data.entity !== 'technical-processes') {
        return { success: false, message: "Invalid technical processes export file" };
      }

      return await db.transaction(async (tx) => {
        const importDetails: any = {};

        if (mode === 'truncate') {
          // Delete in reverse order of dependencies
          await tx.delete(changeRequestTechnicalProcesses);
          await tx.delete(technicalProcessDependencies);
          await tx.delete(technicalProcessInterfaces);
          await tx.delete(technicalProcesses);
        }

        // Import technical processes
        if (data.data?.length > 0) {
          const validProcesses = data.data.filter((proc: any) => {
            // Skip records with invalid IDs
            if (proc.id && (isNaN(proc.id) || proc.id === 'NaN')) {
              console.warn(`Skipping technical process with invalid ID: ${proc.id}`);
              return false;
            }
            return true;
          });

          const insertedProcesses = await tx
            .insert(technicalProcesses)
            .values(validProcesses.map((proc: any) => {
              const cleanProc: any = {};
              
              // Map Excel columns to database fields
              cleanProc.name = proc['Process Name'] || proc.name;
              cleanProc.jobName = proc['Job Name'] || proc.jobName;
              cleanProc.description = proc['Description'] || proc.description || null;
              cleanProc.frequency = proc['Frequency'] || proc.frequency || 'on-demand';
              cleanProc.schedule = proc['Schedule'] || proc.schedule || null;
              cleanProc.criticality = proc['Criticality'] || proc.criticality || 'medium';
              cleanProc.status = proc['Status'] || proc.status || 'active';
              cleanProc.owner = proc['Business Owner'] || proc.owner || null;
              cleanProc.technicalOwner = proc['Technical Owner'] || proc.technicalOwner || null;
              
              // Handle ID for truncate mode
              if (mode === 'truncate' && proc.id && !isNaN(proc.id)) {
                cleanProc.id = proc.id;
              }
              
              // Convert Excel date strings back to proper dates
              cleanProc.createdAt = proc['Created At'] || proc.createdAt ? new Date(proc['Created At'] || proc.createdAt) : new Date();
              cleanProc.updatedAt = new Date();
              cleanProc.lastRunDate = proc['Last Run Date'] || proc.lastRunDate ? new Date(proc['Last Run Date'] || proc.lastRunDate) : null;
              cleanProc.nextRunDate = proc['Next Run Date'] || proc.nextRunDate ? new Date(proc['Next Run Date'] || proc.nextRunDate) : null;
              
              // Handle application lookup by name (for now, set to null)
              // In a real scenario, you might want to look up the application ID by name
              if (proc.Application && !proc.applicationId) {
                console.warn(`Technical process ${cleanProc.name} has application name but no ID`);
              }
              cleanProc.applicationId = proc.applicationId || null;
              
              return cleanProc;
            }))
            .onConflictDoNothing()
            .returning();
          
          importDetails.technicalProcesses = insertedProcesses.length;
          importDetails.skipped = data.data.length - validProcesses.length;
        }

        return {
          success: true,
          message: `Technical processes imported successfully in ${mode} mode`,
          details: importDetails
        };
      });
    } catch (error) {
      console.error("Error importing technical processes:", error);
      return { success: false, message: "Import failed", details: error };
    }
  }

  // Communication methods
  async getAllConversations(): Promise<any[]> {
    const conversationList = await db
      .select({
        conversation: conversations,
        links: conversationLinks,
        participants: conversationParticipants
      })
      .from(conversations)
      .leftJoin(conversationLinks, eq(conversationLinks.conversationId, conversations.id))
      .leftJoin(conversationParticipants, eq(conversationParticipants.conversationId, conversations.id))
      .orderBy(desc(conversations.updatedAt));

    // Group results by conversation
    const conversationMap = new Map();
    
    for (const row of conversationList) {
      const convId = row.conversation.id;
      if (!conversationMap.has(convId)) {
        conversationMap.set(convId, {
          ...row.conversation,
          links: [],
          participants: []
        });
      }
      
      const conv = conversationMap.get(convId);
      if (row.links && !conv.links.some((l: any) => l.id === row.links.id)) {
        conv.links.push(row.links);
      }
      if (row.participants && !conv.participants.some((p: any) => p.id === row.participants.id)) {
        conv.participants.push(row.participants);
      }
    }
    
    // Enrich links with entity names
    const conversationsArray = Array.from(conversationMap.values());
    for (const conversation of conversationsArray) {
      if (conversation.links && conversation.links.length > 0) {
        conversation.links = await Promise.all(
          conversation.links.map(async (link: any) => {
            let entityName = '';
            
            switch (link.entityType) {
              case 'application':
                const [app] = await db.select({ name: applications.name }).from(applications).where(eq(applications.id, link.entityId));
                entityName = app?.name || `Application #${link.entityId}`;
                break;
              case 'interface':
                const [iml] = await db.select({ imlNumber: interfaces.imlNumber }).from(interfaces).where(eq(interfaces.id, link.entityId));
                entityName = iml?.imlNumber || `Interface #${link.entityId}`;
                break;
              case 'business_process':
                const [bp] = await db.select({ businessProcess: businessProcesses.businessProcess }).from(businessProcesses).where(eq(businessProcesses.id, link.entityId));
                entityName = bp?.businessProcess || `Business Process #${link.entityId}`;
                break;
              case 'change_request':
                const [cr] = await db.select({ crNumber: changeRequests.crNumber }).from(changeRequests).where(eq(changeRequests.id, link.entityId));
                entityName = cr?.crNumber || `Change Request #${link.entityId}`;
                break;
              default:
                entityName = `${link.entityType} #${link.entityId}`;
            }
            
            return {
              ...link,
              entityName
            };
          })
        );
      }
    }
    
    return conversationsArray;
  }

  async getConversationWithDetails(id: number): Promise<any | undefined> {
    const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id));
    if (!conversation) return undefined;

    const links = await db.select().from(conversationLinks).where(eq(conversationLinks.conversationId, id));
    const participants = await db.select().from(conversationParticipants).where(eq(conversationParticipants.conversationId, id));
    const comments = await this.getConversationComments(id);

    // Enrich links with entity names
    const enrichedLinks = await Promise.all(
      links.map(async (link) => {
        let entityName = '';
        let entityDetails: any = {};
        
        switch (link.entityType) {
          case 'application':
            const [app] = await db.select({ name: applications.name }).from(applications).where(eq(applications.id, link.entityId));
            entityName = app?.name || `Application #${link.entityId}`;
            entityDetails = app;
            break;
          case 'interface':
            const [iml] = await db.select({ imlNumber: interfaces.imlNumber, description: interfaces.description }).from(interfaces).where(eq(interfaces.id, link.entityId));
            entityName = iml?.imlNumber || `Interface #${link.entityId}`;
            entityDetails = iml;
            break;
          case 'business_process':
            const [bp] = await db.select({ businessProcess: businessProcesses.businessProcess }).from(businessProcesses).where(eq(businessProcesses.id, link.entityId));
            entityName = bp?.businessProcess || `Business Process #${link.entityId}`;
            entityDetails = bp;
            break;
          case 'change_request':
            const [cr] = await db.select({ crNumber: changeRequests.crNumber, title: changeRequests.title }).from(changeRequests).where(eq(changeRequests.id, link.entityId));
            entityName = cr?.crNumber || `Change Request #${link.entityId}`;
            entityDetails = cr;
            break;
          default:
            entityName = `${link.entityType} #${link.entityId}`;
        }
        
        return {
          ...link,
          entityName,
          entityDetails
        };
      })
    );

    return {
      ...conversation,
      links: enrichedLinks,
      participants,
      comments
    };
  }

  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const [conversation] = await db
      .insert(conversations)
      .values({
        ...insertConversation,
        updatedAt: new Date()
      })
      .returning();
    return conversation;
  }

  async updateConversation(id: number, insertConversation: InsertConversation): Promise<Conversation | undefined> {
    const [conversation] = await db
      .update(conversations)
      .set({
        ...insertConversation,
        updatedAt: new Date()
      })
      .where(eq(conversations.id, id))
      .returning();
    return conversation || undefined;
  }

  async deleteConversation(id: number): Promise<boolean> {
    // Delete all related data first
    await db.delete(communicationMentions).where(
      inArray(communicationMentions.commentId, 
        db.select({ id: communicationComments.id })
          .from(communicationComments)
          .where(eq(communicationComments.conversationId, id))
      )
    );
    await db.delete(communicationAttachments).where(
      inArray(communicationAttachments.commentId,
        db.select({ id: communicationComments.id })
          .from(communicationComments)
          .where(eq(communicationComments.conversationId, id))
      )
    );
    await db.delete(communicationComments).where(eq(communicationComments.conversationId, id));
    await db.delete(conversationParticipants).where(eq(conversationParticipants.conversationId, id));
    await db.delete(conversationLinks).where(eq(conversationLinks.conversationId, id));
    await db.delete(conversations).where(eq(conversations.id, id));
    return true;
  }

  async getConversationCountForEntity(entityType: string, entityId: number): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(conversationLinks)
      .where(
        and(
          eq(conversationLinks.entityType, entityType),
          eq(conversationLinks.entityId, entityId)
        )
      );
    return result[0]?.count || 0;
  }

  async getBulkConversationCounts(entityType: string, entityIds: number[]): Promise<{ entityId: number; count: number }[]> {
    if (entityIds.length === 0) {
      return [];
    }

    const result = await db
      .select({
        entityId: conversationLinks.entityId,
        count: count()
      })
      .from(conversationLinks)
      .where(
        and(
          eq(conversationLinks.entityType, entityType),
          inArray(conversationLinks.entityId, entityIds)
        )
      )
      .groupBy(conversationLinks.entityId);

    // Create a map of entityId to count from the query results
    const countMap = new Map(result.map(row => [row.entityId, row.count]));
    
    // Return an array with counts for all requested entity IDs (0 if no conversations)
    return entityIds.map(entityId => ({
      entityId,
      count: countMap.get(entityId) || 0
    }));
  }

  async getConversationsForEntity(entityType: string, entityId: number): Promise<any[]> {
    // Get all conversation IDs linked to this entity
    const linkedConversations = await db
      .select({
        conversationId: conversationLinks.conversationId
      })
      .from(conversationLinks)
      .where(
        and(
          eq(conversationLinks.entityType, entityType),
          eq(conversationLinks.entityId, entityId)
        )
      );

    const conversationIds = linkedConversations.map(lc => lc.conversationId);
    
    if (conversationIds.length === 0) {
      return [];
    }

    // Get conversations with comment counts and last comment info
    const conversationList = await db
      .select({
        conversation: conversations,
        commentCount: sql<number>`count(distinct ${communicationComments.id})`.as('commentCount'),
        lastCommentAuthor: sql<string>`(
          SELECT author FROM ${communicationComments} 
          WHERE conversation_id = ${conversations.id} 
          ORDER BY created_at DESC 
          LIMIT 1
        )`.as('lastCommentAuthor'),
        lastCommentContent: sql<string>`(
          SELECT content FROM ${communicationComments} 
          WHERE conversation_id = ${conversations.id} 
          ORDER BY created_at DESC 
          LIMIT 1
        )`.as('lastCommentContent'),
        lastCommentDate: sql<Date>`(
          SELECT created_at FROM ${communicationComments} 
          WHERE conversation_id = ${conversations.id} 
          ORDER BY created_at DESC 
          LIMIT 1
        )`.as('lastCommentDate')
      })
      .from(conversations)
      .leftJoin(communicationComments, eq(communicationComments.conversationId, conversations.id))
      .where(inArray(conversations.id, conversationIds))
      .groupBy(conversations.id)
      .orderBy(desc(conversations.updatedAt));

    return conversationList.map(row => ({
      ...row.conversation,
      commentCount: row.commentCount || 0,
      lastComment: row.lastCommentAuthor ? {
        author: row.lastCommentAuthor,
        content: row.lastCommentContent,
        createdAt: row.lastCommentDate
      } : undefined
    }));
  }

  async addConversationLink(link: InsertConversationLink): Promise<ConversationLink> {
    const [conversationLink] = await db
      .insert(conversationLinks)
      .values(link)
      .returning();
    return conversationLink;
  }

  async removeConversationLink(id: number): Promise<boolean> {
    await db.delete(conversationLinks).where(eq(conversationLinks.id, id));
    return true;
  }

  async getConversationsByEntity(entityType: string, entityId: number): Promise<any[]> {
    const links = await db
      .select({
        conversationId: conversationLinks.conversationId
      })
      .from(conversationLinks)
      .where(and(
        eq(conversationLinks.entityType, entityType),
        eq(conversationLinks.entityId, entityId)
      ));

    if (links.length === 0) return [];

    const conversationIds = links.map(l => l.conversationId);
    return await db
      .select()
      .from(conversations)
      .where(inArray(conversations.id, conversationIds))
      .orderBy(desc(conversations.updatedAt));
  }

  async getConversationComments(conversationId: number): Promise<any[]> {
    const comments = await db
      .select()
      .from(communicationComments)
      .where(eq(communicationComments.conversationId, conversationId))
      .orderBy(asc(communicationComments.createdAt));

    // Get attachments and mentions for each comment
    const enrichedComments = await Promise.all(
      comments.map(async (comment) => {
        const attachments = await db
          .select()
          .from(communicationAttachments)
          .where(eq(communicationAttachments.commentId, comment.id));
        
        const mentions = await db
          .select()
          .from(communicationMentions)
          .where(eq(communicationMentions.commentId, comment.id));

        return {
          ...comment,
          attachments,
          mentions
        };
      })
    );

    return enrichedComments;
  }

  async addCommunicationComment(comment: InsertCommunicationComment): Promise<CommunicationComment> {
    const [newComment] = await db
      .insert(communicationComments)
      .values(comment)
      .returning();
    
    // Update conversation's updatedAt
    await db
      .update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, newComment.conversationId));
    
    return newComment;
  }

  async updateCommunicationComment(id: number, content: string): Promise<CommunicationComment | undefined> {
    const [comment] = await db
      .update(communicationComments)
      .set({
        content,
        isEdited: true,
        editedAt: new Date()
      })
      .where(eq(communicationComments.id, id))
      .returning();
    
    if (comment) {
      // Update conversation's updatedAt
      await db
        .update(conversations)
        .set({ updatedAt: new Date() })
        .where(eq(conversations.id, comment.conversationId!));
    }
    
    return comment || undefined;
  }

  async deleteCommunicationComment(id: number): Promise<boolean> {
    // Get the comment first to know which conversation to update
    const [comment] = await db.select().from(communicationComments).where(eq(communicationComments.id, id));
    
    if (comment) {
      // Delete related data
      await db.delete(communicationMentions).where(eq(communicationMentions.commentId, id));
      await db.delete(communicationAttachments).where(eq(communicationAttachments.commentId, id));
      await db.delete(communicationComments).where(eq(communicationComments.id, id));
      
      // Update conversation's updatedAt
      await db
        .update(conversations)
        .set({ updatedAt: new Date() })
        .where(eq(conversations.id, comment.conversationId!));
    }
    
    return true;
  }

  async addConversationParticipant(participant: InsertConversationParticipant): Promise<ConversationParticipant> {
    const [newParticipant] = await db
      .insert(conversationParticipants)
      .values(participant)
      .returning();
    return newParticipant;
  }

  async removeConversationParticipant(id: number): Promise<boolean> {
    await db.delete(conversationParticipants).where(eq(conversationParticipants.id, id));
    return true;
  }

  async getCommunicationTimeline(options: { 
    startDate?: Date; 
    endDate?: Date; 
    entityType?: string; 
    entityId?: number 
  }): Promise<any[]> {
    let query = db
      .select({
        conversation: conversations,
        comment: communicationComments,
        link: conversationLinks
      })
      .from(communicationComments)
      .innerJoin(conversations, eq(communicationComments.conversationId, conversations.id))
      .leftJoin(conversationLinks, eq(conversationLinks.conversationId, conversations.id));

    const conditions = [];
    
    if (options.startDate) {
      conditions.push(gte(communicationComments.createdAt, options.startDate));
    }
    if (options.endDate) {
      conditions.push(lte(communicationComments.createdAt, options.endDate));
    }
    if (options.entityType && options.entityId) {
      conditions.push(
        and(
          eq(conversationLinks.entityType, options.entityType),
          eq(conversationLinks.entityId, options.entityId)
        )
      );
    }

    const results = conditions.length > 0 
      ? await query.where(and(...conditions)).orderBy(desc(communicationComments.createdAt))
      : await query.orderBy(desc(communicationComments.createdAt));
    
    // Group by date for timeline view
    const timeline = results.reduce((acc, row) => {
      const date = row.comment.createdAt ? new Date(row.comment.createdAt).toISOString().split('T')[0] : 'unknown';
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push({
        type: 'communication',
        timestamp: row.comment.createdAt,
        conversation: row.conversation,
        comment: row.comment,
        link: row.link
      });
      return acc;
    }, {} as Record<string, any[]>);

    return Object.entries(timeline).map(([date, events]) => ({
      date,
      events
    }));
  }

  async getCommunicationMetrics(): Promise<any> {
    // Get total conversations
    const totalConversations = await db
      .select({ count: count() })
      .from(conversations);

    // Get conversations by status
    const conversationsByStatus = await db
      .select({
        status: conversations.status,
        count: count()
      })
      .from(conversations)
      .groupBy(conversations.status);

    // Get active conversations (open or pending)
    const activeConversations = await db
      .select({ count: count() })
      .from(conversations)
      .where(inArray(conversations.status, ['open', 'pending']));

    // Get total comments
    const totalComments = await db
      .select({ count: count() })
      .from(communicationComments);

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentActivity = await db
      .select({ count: count() })
      .from(communicationComments)
      .where(gte(communicationComments.createdAt, sevenDaysAgo));

    return {
      totalConversations: totalConversations[0]?.count || 0,
      activeConversations: activeConversations[0]?.count || 0,
      totalComments: totalComments[0]?.count || 0,
      recentActivity: recentActivity[0]?.count || 0,
      conversationsByStatus: conversationsByStatus.reduce((acc, row) => {
        acc[row.status] = row.count;
        return acc;
      }, {} as Record<string, number>)
    };
  }

  async getRecentCommunications(): Promise<any[]> {
    // Get recent conversations with their latest comment
    const recentConversations = await db
      .select({
        conversation: conversations,
        latestComment: {
          id: communicationComments.id,
          content: communicationComments.content,
          author: communicationComments.author,
          createdAt: communicationComments.createdAt
        }
      })
      .from(conversations)
      .leftJoin(
        communicationComments,
        eq(conversations.id, communicationComments.conversationId)
      )
      .orderBy(desc(conversations.updatedAt))
      .limit(5);

    // Group by conversation and get the latest comment for each
    const conversationMap = new Map<number, any>();
    
    for (const row of recentConversations) {
      const convId = row.conversation.id;
      if (!conversationMap.has(convId)) {
        conversationMap.set(convId, {
          ...row.conversation,
          latestComment: null,
          linkedEntities: []
        });
      }
      
      const conv = conversationMap.get(convId);
      if (row.latestComment && (!conv.latestComment || 
          new Date(row.latestComment.createdAt) > new Date(conv.latestComment.createdAt))) {
        conv.latestComment = row.latestComment;
      }
    }

    // Get linked entities for each conversation
    const conversationIds = Array.from(conversationMap.keys());
    if (conversationIds.length > 0) {
      const links = await db
        .select()
        .from(conversationLinks)
        .where(inArray(conversationLinks.conversationId, conversationIds));

      for (const link of links) {
        const conv = conversationMap.get(link.conversationId);
        if (conv) {
          conv.linkedEntities.push({
            entityType: link.entityType,
            entityId: link.entityId
          });
        }
      }
    }

    return Array.from(conversationMap.values());
  }

  // Change Request Technical Process Impacts
  async getChangeRequestTechnicalProcessImpacts(changeRequestId: number): Promise<any[]> {
    const impacts = await db
      .select({
        id: changeRequestTechnicalProcesses.id,
        changeRequestId: changeRequestTechnicalProcesses.changeRequestId,
        technicalProcessId: changeRequestTechnicalProcesses.technicalProcessId,
        impactType: changeRequestTechnicalProcesses.impactType,
        impactDescription: changeRequestTechnicalProcesses.impactDescription,
        technicalProcess: technicalProcesses
      })
      .from(changeRequestTechnicalProcesses)
      .leftJoin(technicalProcesses, eq(changeRequestTechnicalProcesses.technicalProcessId, technicalProcesses.id))
      .where(eq(changeRequestTechnicalProcesses.changeRequestId, changeRequestId));
    
    return impacts;
  }

  async updateChangeRequestTechnicalProcessImpacts(changeRequestId: number, technicalProcesses: any[]): Promise<void> {
    // Delete existing impacts
    await db
      .delete(changeRequestTechnicalProcesses)
      .where(eq(changeRequestTechnicalProcesses.changeRequestId, changeRequestId));
    
    // Insert new impacts
    if (technicalProcesses.length > 0) {
      await db
        .insert(changeRequestTechnicalProcesses)
        .values(
          technicalProcesses.map(process => ({
            changeRequestId,
            technicalProcessId: process.technicalProcessId,
            impactType: process.impactType,
            impactDescription: process.impactDescription
          }))
        );
    }
  }

  async getChangeRequestInternalActivityImpacts(changeRequestId: number): Promise<any[]> {
    const impacts = await db
      .select({
        id: changeRequestInternalActivities.id,
        changeRequestId: changeRequestInternalActivities.changeRequestId,
        internalActivityId: changeRequestInternalActivities.internalActivityId,
        impactType: changeRequestInternalActivities.impactType,
        impactDescription: changeRequestInternalActivities.impactDescription,
        internalActivity: internalActivities
      })
      .from(changeRequestInternalActivities)
      .leftJoin(internalActivities, eq(changeRequestInternalActivities.internalActivityId, internalActivities.id))
      .where(eq(changeRequestInternalActivities.changeRequestId, changeRequestId));
    
    return impacts;
  }

  async updateChangeRequestInternalActivityImpacts(changeRequestId: number, internalActivitiesData: any[]): Promise<void> {
    // Delete existing impacts
    await db
      .delete(changeRequestInternalActivities)
      .where(eq(changeRequestInternalActivities.changeRequestId, changeRequestId));
    
    // Insert new impacts
    if (internalActivitiesData.length > 0) {
      await db
        .insert(changeRequestInternalActivities)
        .values(
          internalActivitiesData.map(activity => ({
            changeRequestId,
            internalActivityId: activity.internalActivityId,
            impactType: activity.impactType,
            impactDescription: activity.impactDescription
          }))
        );
    }
  }

  // RBAC - Roles Implementation
  async getAllRoles(): Promise<Role[]> {
    return await db.select().from(roles).where(eq(roles.isActive, true)).orderBy(roles.name);
  }

  async getRole(id: number): Promise<Role | undefined> {
    const [role] = await db.select().from(roles).where(eq(roles.id, id));
    return role || undefined;
  }

  async getRoleByName(name: string): Promise<Role | undefined> {
    const [role] = await db.select().from(roles).where(eq(roles.name, name));
    return role || undefined;
  }

  async createRole(role: InsertRole): Promise<Role> {
    const [newRole] = await db.insert(roles).values(role).returning();
    return newRole;
  }

  async updateRole(id: number, role: InsertRole): Promise<Role | undefined> {
    const [updatedRole] = await db.update(roles).set(role).where(eq(roles.id, id)).returning();
    return updatedRole || undefined;
  }

  async deleteRole(id: number): Promise<boolean> {
    const role = await this.getRole(id);
    if (!role || role.isSystem) return false;
    
    await db.update(roles).set({ isActive: false }).where(eq(roles.id, id));
    return true;
  }

  async duplicateRole(id: number, newName: string): Promise<Role | undefined> {
    const sourceRole = await this.getRole(id);
    if (!sourceRole) return undefined;

    // Create new role
    const newRole = await this.createRole({
      name: newName,
      description: `Duplicated from ${sourceRole.name}`,
      isSystem: false,
      isActive: true,
      createdBy: sourceRole.createdBy
    });

    // Copy permissions
    const permissions = await this.getRolePermissions(id);
    for (const perm of permissions) {
      await this.grantPermissionToRole({
        roleId: newRole.id,
        permissionId: perm.permissionId,
        granted: perm.granted,
        grantedBy: perm.grantedBy
      });
    }

    return newRole;
  }

  // RBAC - Permissions Implementation
  async getAllPermissions(): Promise<Permission[]> {
    return await db.select().from(permissions).orderBy(permissions.resource, permissions.action);
  }

  async getPermission(id: number): Promise<Permission | undefined> {
    const [permission] = await db.select().from(permissions).where(eq(permissions.id, id));
    return permission || undefined;
  }

  async getPermissionsByResource(resource: string): Promise<Permission[]> {
    return await db.select().from(permissions).where(eq(permissions.resource, resource));
  }

  async createPermission(permission: InsertPermission): Promise<Permission> {
    const [newPermission] = await db.insert(permissions).values(permission).returning();
    return newPermission;
  }

  async updatePermission(id: number, permission: InsertPermission): Promise<Permission | undefined> {
    const [updatedPermission] = await db.update(permissions).set(permission).where(eq(permissions.id, id)).returning();
    return updatedPermission || undefined;
  }

  async deletePermission(id: number): Promise<boolean> {
    const permission = await this.getPermission(id);
    if (!permission || permission.isSystem) return false;
    
    await db.delete(permissions).where(eq(permissions.id, id));
    return true;
  }

  // RBAC - Role Permissions Implementation
  async getRolePermissions(roleId: number): Promise<RolePermission[]> {
    return await db.select().from(rolePermissions).where(eq(rolePermissions.roleId, roleId));
  }

  async getRolePermissionsWithDetails(roleId: number): Promise<any[]> {
    return await db
      .select({
        rolePermission: rolePermissions,
        permission: permissions
      })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.roleId, roleId));
  }

  async grantPermissionToRole(rolePermission: InsertRolePermission): Promise<RolePermission> {
    const [granted] = await db.insert(rolePermissions).values(rolePermission).returning();
    return granted;
  }

  async revokePermissionFromRole(roleId: number, permissionId: number): Promise<boolean> {
    await db
      .delete(rolePermissions)
      .where(and(
        eq(rolePermissions.roleId, roleId),
        eq(rolePermissions.permissionId, permissionId)
      ));
    return true;
  }

  async updateRolePermissions(roleId: number, permissionIds: number[]): Promise<void> {
    // Delete existing permissions
    await db.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));

    // Add new permissions
    if (permissionIds.length > 0) {
      await db.insert(rolePermissions).values(
        permissionIds.map(permissionId => ({
          roleId,
          permissionId,
          granted: true
        }))
      );
    }
  }

  // RBAC - User Roles Implementation
  async getUserRoles(userId: number): Promise<UserRole[]> {
    return await db.select().from(userRoles).where(eq(userRoles.userId, userId));
  }

  async getUserRolesWithDetails(userId: number): Promise<any[]> {
    return await db
      .select({
        userRole: userRoles,
        role: roles
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, userId));
  }

  async assignRoleToUser(userRole: InsertUserRole): Promise<UserRole> {
    const [assigned] = await db.insert(userRoles).values(userRole).returning();
    return assigned;
  }

  async removeRoleFromUser(userId: number, roleId: number): Promise<boolean> {
    await db
      .delete(userRoles)
      .where(and(
        eq(userRoles.userId, userId),
        eq(userRoles.roleId, roleId)
      ));
    return true;
  }

  async updateUserRoles(userId: number, roleIds: number[]): Promise<void> {
    // Delete existing roles
    await db.delete(userRoles).where(eq(userRoles.userId, userId));

    // Add new roles
    if (roleIds.length > 0) {
      await db.insert(userRoles).values(
        roleIds.map(roleId => ({
          userId,
          roleId
        }))
      );
    }
  }

  async getUserPermissions(userId: number): Promise<Permission[]> {
    // Get all permissions through user's roles
    const result = await db
      .selectDistinct({
        permission: permissions
      })
      .from(userRoles)
      .innerJoin(rolePermissions, eq(userRoles.roleId, rolePermissions.roleId))
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(and(
        eq(userRoles.userId, userId),
        eq(rolePermissions.granted, true)
      ));

    return result.map(r => r.permission);
  }

  // RBAC - API Endpoints Implementation
  async getAllApiEndpoints(): Promise<ApiEndpoint[]> {
    return await db.select().from(apiEndpoints).orderBy(apiEndpoints.resource, apiEndpoints.method, apiEndpoints.path);
  }

  async getApiEndpoint(id: number): Promise<ApiEndpoint | undefined> {
    const [endpoint] = await db.select().from(apiEndpoints).where(eq(apiEndpoints.id, id));
    return endpoint || undefined;
  }

  async createApiEndpoint(endpoint: InsertApiEndpoint): Promise<ApiEndpoint> {
    const [newEndpoint] = await db.insert(apiEndpoints).values(endpoint).returning();
    return newEndpoint;
  }

  async updateApiEndpoint(id: number, endpoint: InsertApiEndpoint): Promise<ApiEndpoint | undefined> {
    const [updatedEndpoint] = await db.update(apiEndpoints).set(endpoint).where(eq(apiEndpoints.id, id)).returning();
    return updatedEndpoint || undefined;
  }

  async deleteApiEndpoint(id: number): Promise<boolean> {
    await db.delete(apiEndpoints).where(eq(apiEndpoints.id, id));
    return true;
  }

  async discoverApiEndpoints(): Promise<ApiEndpoint[]> {
    // Define all API endpoints in the system
    const endpoints = [
      // Applications
      { method: "GET", path: "/api/applications", resource: "applications", action: "read", description: "List all applications" },
      { method: "GET", path: "/api/applications/:id", resource: "applications", action: "read", description: "Get application by ID" },
      { method: "POST", path: "/api/applications", resource: "applications", action: "create", description: "Create new application" },
      { method: "PUT", path: "/api/applications/:id", resource: "applications", action: "update", description: "Update application" },
      { method: "DELETE", path: "/api/applications/:id", resource: "applications", action: "delete", description: "Delete application" },
      { method: "GET", path: "/api/applications/export", resource: "applications", action: "export", description: "Export applications data" },
      
      // Interfaces
      { method: "GET", path: "/api/interfaces", resource: "interfaces", action: "read", description: "List all interfaces" },
      { method: "GET", path: "/api/interfaces/:id", resource: "interfaces", action: "read", description: "Get interface by ID" },
      { method: "POST", path: "/api/interfaces", resource: "interfaces", action: "create", description: "Create new interface" },
      { method: "PUT", path: "/api/interfaces/:id", resource: "interfaces", action: "update", description: "Update interface" },
      { method: "DELETE", path: "/api/interfaces/:id", resource: "interfaces", action: "delete", description: "Delete interface" },
      { method: "GET", path: "/api/interfaces/export", resource: "interfaces", action: "export", description: "Export interfaces data" },
      { method: "POST", path: "/api/interfaces/:id/comments", resource: "interfaces", action: "comment", description: "Add comment to interface" },
      
      // Business Processes
      { method: "GET", path: "/api/business-processes", resource: "business_processes", action: "read", description: "List all business processes" },
      { method: "GET", path: "/api/business-processes/:id", resource: "business_processes", action: "read", description: "Get business process by ID" },
      { method: "POST", path: "/api/business-processes", resource: "business_processes", action: "create", description: "Create new business process" },
      { method: "PUT", path: "/api/business-processes/:id", resource: "business_processes", action: "update", description: "Update business process" },
      { method: "DELETE", path: "/api/business-processes/:id", resource: "business_processes", action: "delete", description: "Delete business process" },
      { method: "POST", path: "/api/business-processes/:id/move", resource: "business_processes", action: "update", description: "Move business process in hierarchy" },
      
      // Technical Processes
      { method: "GET", path: "/api/technical-processes", resource: "technical_processes", action: "read", description: "List all technical processes" },
      { method: "GET", path: "/api/technical-processes/:id", resource: "technical_processes", action: "read", description: "Get technical process by ID" },
      { method: "POST", path: "/api/technical-processes", resource: "technical_processes", action: "create", description: "Create new technical process" },
      { method: "PUT", path: "/api/technical-processes/:id", resource: "technical_processes", action: "update", description: "Update technical process" },
      { method: "DELETE", path: "/api/technical-processes/:id", resource: "technical_processes", action: "delete", description: "Delete technical process" },
      
      // Change Requests
      { method: "GET", path: "/api/change-requests", resource: "change_requests", action: "read", description: "List all change requests" },
      { method: "GET", path: "/api/change-requests/:id", resource: "change_requests", action: "read", description: "Get change request by ID" },
      { method: "POST", path: "/api/change-requests", resource: "change_requests", action: "create", description: "Create new change request" },
      { method: "PUT", path: "/api/change-requests/:id", resource: "change_requests", action: "update", description: "Update change request" },
      { method: "DELETE", path: "/api/change-requests/:id", resource: "change_requests", action: "delete", description: "Delete change request" },
      { method: "GET", path: "/api/change-requests/export", resource: "change_requests", action: "export", description: "Export change requests data" },
      
      // Communications
      { method: "GET", path: "/api/conversations", resource: "communications", action: "read", description: "List all conversations" },
      { method: "GET", path: "/api/conversations/:id", resource: "communications", action: "read", description: "Get conversation by ID" },
      { method: "POST", path: "/api/conversations", resource: "communications", action: "create", description: "Create new conversation" },
      { method: "PUT", path: "/api/conversations/:id", resource: "communications", action: "update", description: "Update conversation" },
      { method: "DELETE", path: "/api/conversations/:id", resource: "communications", action: "delete", description: "Delete conversation" },
      { method: "POST", path: "/api/conversations/:id/comments", resource: "communications", action: "comment", description: "Add comment to conversation" },
      
      // Reports and Analysis
      { method: "GET", path: "/api/reports/dashboard-stats", resource: "reports", action: "read", description: "Get dashboard statistics" },
      { method: "GET", path: "/api/reports/timeline", resource: "reports", action: "read", description: "Get timeline report" },
      { method: "GET", path: "/api/impact-analysis", resource: "impact_analysis", action: "read", description: "Get impact analysis" },
      
      // User Management
      { method: "GET", path: "/api/users", resource: "users", action: "read", description: "List all users" },
      { method: "GET", path: "/api/users/:id", resource: "users", action: "read", description: "Get user by ID" },
      { method: "POST", path: "/api/users", resource: "users", action: "create", description: "Create new user" },
      { method: "PUT", path: "/api/users/:id", resource: "users", action: "update", description: "Update user" },
      { method: "DELETE", path: "/api/users/:id", resource: "users", action: "delete", description: "Delete user" },
      { method: "PUT", path: "/api/users/:id/roles", resource: "users", action: "manage_roles", description: "Update user roles" },
      
      // Role Management
      { method: "GET", path: "/api/roles", resource: "roles", action: "read", description: "List all roles" },
      { method: "GET", path: "/api/roles/:id", resource: "roles", action: "read", description: "Get role by ID" },
      { method: "POST", path: "/api/roles", resource: "roles", action: "create", description: "Create new role" },
      { method: "PUT", path: "/api/roles/:id", resource: "roles", action: "update", description: "Update role" },
      { method: "DELETE", path: "/api/roles/:id", resource: "roles", action: "delete", description: "Delete role" },
      { method: "PUT", path: "/api/roles/:id/permissions", resource: "roles", action: "manage_permissions", description: "Update role permissions" },
      { method: "POST", path: "/api/roles/:id/duplicate", resource: "roles", action: "create", description: "Duplicate role" },
      
      // Permissions
      { method: "GET", path: "/api/permissions", resource: "permissions", action: "read", description: "List all permissions" },
      { method: "POST", path: "/api/permissions", resource: "permissions", action: "create", description: "Create new permission" },
      
      // API Endpoints
      { method: "GET", path: "/api/api-endpoints", resource: "api_endpoints", action: "read", description: "List all API endpoints" },
      { method: "POST", path: "/api/api-endpoints/discover", resource: "api_endpoints", action: "create", description: "Discover and register API endpoints" },
      
      // Activity Logs
      { method: "GET", path: "/api/activity/logs", resource: "activity_logs", action: "read", description: "List activity logs" },
      { method: "GET", path: "/api/activity/summary", resource: "activity_logs", action: "read", description: "Get activity summary" },
      { method: "GET", path: "/api/users/:id/activity", resource: "activity_logs", action: "read", description: "Get user activity logs" },
      
      // Audit Logs
      { method: "GET", path: "/api/audit/permissions", resource: "audit_logs", action: "read", description: "Get permission audit logs" },
      
      // IML Diagrams
      { method: "GET", path: "/api/iml-diagrams", resource: "iml_diagrams", action: "read", description: "List all IML diagrams" },
      { method: "GET", path: "/api/iml-diagrams/:id", resource: "iml_diagrams", action: "read", description: "Get IML diagram by ID" },
      { method: "POST", path: "/api/iml-diagrams", resource: "iml_diagrams", action: "create", description: "Create new IML diagram" },
      { method: "PUT", path: "/api/iml-diagrams/:id", resource: "iml_diagrams", action: "update", description: "Update IML diagram" },
      { method: "DELETE", path: "/api/iml-diagrams/:id", resource: "iml_diagrams", action: "delete", description: "Delete IML diagram" },
      
      // Import/Export
      { method: "POST", path: "/api/import/applications", resource: "import_export", action: "import", description: "Import applications data" },
      { method: "POST", path: "/api/import/interfaces", resource: "import_export", action: "import", description: "Import interfaces data" },
      { method: "POST", path: "/api/import/change-requests", resource: "import_export", action: "import", description: "Import change requests data" },
    ];

    // Check which endpoints already exist in the database
    const existingEndpoints = await db.select().from(apiEndpoints);
    const existingPaths = new Set(existingEndpoints.map(e => `${e.method} ${e.path}`));

    // Insert new endpoints
    const newEndpoints = [];
    for (const endpoint of endpoints) {
      const key = `${endpoint.method} ${endpoint.path}`;
      if (!existingPaths.has(key)) {
        const [inserted] = await db.insert(apiEndpoints).values({
          method: endpoint.method,
          path: endpoint.path,
          resource: endpoint.resource,
          action: endpoint.action,
          description: endpoint.description || `${endpoint.action} ${endpoint.resource.replace(/_/g, ' ')}`,
          requiresAuth: true,
          isActive: true
        }).returning();
        newEndpoints.push(inserted);
      }
    }

    return newEndpoints;
  }

  // RBAC - Audit Implementation
  async createPermissionAuditLog(log: InsertPermissionAuditLog): Promise<PermissionAuditLog> {
    const [newLog] = await db.insert(permissionAuditLog).values(log).returning();
    return newLog;
  }

  async getPermissionAuditLogs(filters?: { roleId?: number; userId?: number; limit?: number }): Promise<PermissionAuditLog[]> {
    let conditions = [];
    
    if (filters?.roleId) {
      conditions.push(eq(permissionAuditLog.roleId, filters.roleId));
    }
    if (filters?.userId) {
      conditions.push(eq(permissionAuditLog.userId, filters.userId));
    }

    const baseQuery = db.select().from(permissionAuditLog);
    
    const queryWithWhere = conditions.length > 0 
      ? baseQuery.where(and(...conditions))
      : baseQuery;
    
    const queryWithOrder = queryWithWhere.orderBy(desc(permissionAuditLog.changedAt));
    
    const finalQuery = filters?.limit 
      ? queryWithOrder.limit(filters.limit)
      : queryWithOrder;

    return await finalQuery;
  }

  // RBAC - User with Roles Implementation
  async getUserWithRoles(id: number): Promise<User & { roles: Role[] } | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;

    const userRolesData = await this.getUserRolesWithDetails(id);
    const roles = userRolesData.map(ur => ur.role);

    return { ...user, roles };
  }

  async getAllUsersWithRoles(): Promise<(User & { roles: Role[] })[]> {
    const allUsers = await db.select().from(users);
    const usersWithRoles = [];

    for (const user of allUsers) {
      const userRolesData = await this.getUserRolesWithDetails(user.id);
      const roles = userRolesData.map(ur => ur.role);
      usersWithRoles.push({ ...user, roles });
    }

    return usersWithRoles;
  }

  // User Management Implementation
  async updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined> {
    const [updatedUser] = await db.update(users)
      .set(user)
      .where(eq(users.id, id))
      .returning();
    
    return updatedUser || undefined;
  }

  async deleteUser(id: number): Promise<boolean> {
    try {
      // First delete related records to avoid foreign key constraint errors
      // Delete user roles
      await db.delete(userRoles).where(eq(userRoles.userId, id));
      
      // Delete user activity logs
      await db.delete(userActivityLog).where(eq(userActivityLog.userId, id));
      
      // Delete permission audit logs where user is referenced
      await db.delete(permissionAuditLog).where(eq(permissionAuditLog.userId, id));
      
      // Delete capability extraction history where user is referenced
      await db.delete(capabilityExtractionHistory).where(eq(capabilityExtractionHistory.userId, id));
      
      // Finally delete the user
      await db.delete(users).where(eq(users.id, id));
      
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }

  // User Activity Logging Implementation
  async createUserActivityLog(log: InsertUserActivityLog): Promise<UserActivityLog> {
    const [newLog] = await db.insert(userActivityLog).values(log).returning();
    return newLog;
  }

  async getUserActivityLogs(filters?: { 
    userId?: number; 
    username?: string;
    activityType?: string;
    resource?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<UserActivityLog[]> {
    let conditions = [];
    
    if (filters?.userId) {
      conditions.push(eq(userActivityLog.userId, filters.userId));
    }
    if (filters?.username) {
      conditions.push(eq(userActivityLog.username, filters.username));
    }
    if (filters?.activityType) {
      conditions.push(eq(userActivityLog.activityType, filters.activityType));
    }
    if (filters?.resource) {
      conditions.push(eq(userActivityLog.resource, filters.resource));
    }
    if (filters?.startDate) {
      conditions.push(gte(userActivityLog.createdAt, filters.startDate));
    }
    if (filters?.endDate) {
      conditions.push(lte(userActivityLog.createdAt, filters.endDate));
    }

    const baseQuery = db.select().from(userActivityLog);
    
    const queryWithWhere = conditions.length > 0 
      ? baseQuery.where(and(...conditions))
      : baseQuery;
    
    const queryWithOrder = queryWithWhere.orderBy(desc(userActivityLog.createdAt));
    
    const queryWithLimit = filters?.limit 
      ? queryWithOrder.limit(filters.limit)
      : queryWithOrder;
      
    const finalQuery = filters?.offset 
      ? queryWithLimit.offset(filters.offset)
      : queryWithLimit;

    return await finalQuery;
  }

  async getUserActivitySummary(userId?: number): Promise<any> {
    const baseQuery = userId 
      ? db.select().from(userActivityLog).where(eq(userActivityLog.userId, userId))
      : db.select().from(userActivityLog);

    // Get activity counts by type
    const activityCounts = await db
      .select({
        activityType: userActivityLog.activityType,
        count: count()
      })
      .from(userActivityLog)
      .where(userId ? eq(userActivityLog.userId, userId) : undefined)
      .groupBy(userActivityLog.activityType);

    // Get activity counts by resource
    const resourceCounts = await db
      .select({
        resource: userActivityLog.resource,
        action: userActivityLog.action,
        count: count()
      })
      .from(userActivityLog)
      .where(and(
        userId ? eq(userActivityLog.userId, userId) : undefined,
        eq(userActivityLog.activityType, 'api_call')
      ))
      .groupBy(userActivityLog.resource, userActivityLog.action);

    // Get recent activities
    const recentActivities = await this.getUserActivityLogs({
      userId,
      limit: 10
    });

    return {
      activityCounts,
      resourceCounts,
      recentActivities
    };
  }

  // Application Capabilities methods
  async getApplicationCapabilities(applicationId: number): Promise<ApplicationCapability[]> {
    return await db
      .select()
      .from(applicationCapabilities)
      .where(eq(applicationCapabilities.applicationId, applicationId))
      .orderBy(desc(applicationCapabilities.createdAt));
  }

  async getApplicationCapability(id: number): Promise<ApplicationCapability | undefined> {
    const [result] = await db
      .select()
      .from(applicationCapabilities)
      .where(eq(applicationCapabilities.id, id));
    return result || undefined;
  }

  async createApplicationCapability(capability: InsertApplicationCapability): Promise<ApplicationCapability> {
    const [result] = await db
      .insert(applicationCapabilities)
      .values(capability)
      .returning();
    return result;
  }

  async updateApplicationCapability(id: number, capability: Partial<InsertApplicationCapability>): Promise<ApplicationCapability | undefined> {
    const [result] = await db
      .update(applicationCapabilities)
      .set({
        ...capability,
        updatedAt: new Date()
      })
      .where(eq(applicationCapabilities.id, id))
      .returning();
    return result || undefined;
  }

  async deleteApplicationCapability(id: number): Promise<boolean> {
    const result = await db
      .delete(applicationCapabilities)
      .where(eq(applicationCapabilities.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getCapabilitiesByStatus(applicationId: number, status: string): Promise<ApplicationCapability[]> {
    return await db
      .select()
      .from(applicationCapabilities)
      .where(and(
        eq(applicationCapabilities.applicationId, applicationId),
        eq(applicationCapabilities.status, status)
      ))
      .orderBy(desc(applicationCapabilities.createdAt));
  }

  async matchCapabilityWithIML(capabilityId: number, imlId: number): Promise<ApplicationCapability | undefined> {
    const [result] = await db
      .update(applicationCapabilities)
      .set({
        mappedImlId: imlId,
        isActive: true,
        status: 'in_use',
        updatedAt: new Date()
      })
      .where(eq(applicationCapabilities.id, capabilityId))
      .returning();
    return result || undefined;
  }

  // Uploaded Documents methods
  async getUploadedDocuments(applicationId: number): Promise<UploadedDocument[]> {
    return await db
      .select()
      .from(uploadedDocuments)
      .where(eq(uploadedDocuments.applicationId, applicationId))
      .orderBy(desc(uploadedDocuments.createdAt));
  }

  async getUploadedDocument(id: number): Promise<UploadedDocument | undefined> {
    const [result] = await db
      .select()
      .from(uploadedDocuments)
      .where(eq(uploadedDocuments.id, id));
    return result || undefined;
  }

  async createUploadedDocument(document: InsertUploadedDocument): Promise<UploadedDocument> {
    const [result] = await db
      .insert(uploadedDocuments)
      .values(document)
      .returning();
    return result;
  }

  async updateUploadedDocument(id: number, document: Partial<InsertUploadedDocument>): Promise<UploadedDocument | undefined> {
    const [result] = await db
      .update(uploadedDocuments)
      .set(document)
      .where(eq(uploadedDocuments.id, id))
      .returning();
    return result || undefined;
  }

  async deleteUploadedDocument(id: number): Promise<boolean> {
    const result = await db
      .delete(uploadedDocuments)
      .where(eq(uploadedDocuments.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Get interfaces by application (either as provider or consumer)
  async getInterfacesByApplication(applicationId: number): Promise<Interface[]> {
    return await db
      .select()
      .from(interfaces)
      .where(or(
        eq(interfaces.providerApplicationId, applicationId),
        eq(interfaces.consumerApplicationId, applicationId)
      ))
      .orderBy(desc(interfaces.createdAt));
  }

  // Get capabilities by extraction history ID
  async getCapabilitiesByExtraction(extractionId: number): Promise<Capability[]> {
    return await db
      .select()
      .from(capabilities)
      .where(eq(capabilities.extractionHistoryId, extractionId))
      .orderBy(asc(capabilities.name));
  }

  // Get capabilities by document filename
  async getCapabilitiesByDocument(fileName: string): Promise<ApplicationCapability[]> {
    return await db
      .select()
      .from(applicationCapabilities)
      .where(eq(applicationCapabilities.extractedFrom, fileName))
      .orderBy(asc(applicationCapabilities.capabilityName));
  }

  // Delete capabilities by document filename
  async deleteCapabilitiesByDocument(fileName: string): Promise<number> {
    const result = await db
      .delete(applicationCapabilities)
      .where(eq(applicationCapabilities.extractedFrom, fileName));
    return result.rowCount || 0;
  }

  // Delete extraction history by document filename
  async deleteExtractionHistoryByDocument(fileName: string): Promise<number> {
    const result = await db
      .delete(capabilityExtractionHistory)
      .where(eq(capabilityExtractionHistory.filename, fileName));
    return result.rowCount || 0;
  }
}

export const storage = new DatabaseStorage();
