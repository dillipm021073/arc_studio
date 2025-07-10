import { Switch, Route } from "wouter";
import { useState, useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, withAuth } from "@/contexts/auth-context";
import Dashboard from "@/pages/dashboard";
import Applications from "@/pages/applications";
import Interfaces from "@/pages/interfaces";
import ChangeRequests from "@/pages/change-requests";
import BusinessProcesses from "@/pages/business-processes";
import BusinessProcessDiagram from "@/pages/business-process-diagram";
import InternalActivities from "@/pages/internal-activities";
import TechnicalProcesses from "@/pages/technical-processes";
import TechnicalProcessDetail from "@/pages/technical-process-detail";
import TechnicalProcessDiagram from "@/pages/technical-process-diagram";
import ImpactAnalysis from "@/pages/impact-analysis";
import EnhancedImpactAnalysis from "@/pages/impact-analysis-enhanced";
import Timeline from "@/pages/timeline";
import Reports from "@/pages/reports";
import Communications from "@/pages/communications";
import CommunicationTimeline from "@/pages/communication-timeline";
import ImportExport from "@/pages/import-export";
import InterfaceBuilder from "@/pages/interface-builder";
import InterfaceBuilderRecovery from "@/pages/interface-builder-recovery";
import TestN8nStyle from "@/pages/test-n8n-style";
import UserManagement from "@/pages/user-management";
import RoleManagement from "@/pages/role-management";
import ApiPermissions from "@/pages/api-permissions";
import UserActivityMonitor from "@/pages/user-activity-monitor";
import { SettingsPage } from "@/pages/settings";
import Login from "@/pages/login";
import NotFound from "@/pages/not-found";
import Sidebar from "@/components/layout/sidebar";
import TestAllShapes from "@/pages/test-all-shapes";
import TestVisioFeatures from "@/pages/test-visio-features";
import TestAlignmentFeatures from "@/pages/test-alignment-features";
import TestVisioComplete from "@/pages/test-visio-complete";
import TestImportDebug from "@/pages/test-import-debug";
import TMFDomainView from "@/pages/tmf-domain-view";

// Protected components
const ProtectedDashboard = withAuth(Dashboard);
const ProtectedApplications = withAuth(Applications);
const ProtectedInterfaces = withAuth(Interfaces);
const ProtectedChangeRequests = withAuth(ChangeRequests);
const ProtectedBusinessProcesses = withAuth(BusinessProcesses);
const ProtectedBusinessProcessDiagram = withAuth(BusinessProcessDiagram);
const ProtectedInternalActivities = withAuth(InternalActivities);
const ProtectedTechnicalProcesses = withAuth(TechnicalProcesses);
const ProtectedTechnicalProcessDetail = withAuth(TechnicalProcessDetail);
const ProtectedTechnicalProcessDiagram = withAuth(TechnicalProcessDiagram);
const ProtectedImpactAnalysis = withAuth(ImpactAnalysis);
const ProtectedEnhancedImpactAnalysis = withAuth(EnhancedImpactAnalysis);
const ProtectedTimeline = withAuth(Timeline);
const ProtectedReports = withAuth(Reports);
const ProtectedCommunications = withAuth(Communications);
const ProtectedCommunicationTimeline = withAuth(CommunicationTimeline);
const ProtectedImportExport = withAuth(ImportExport);
const ProtectedInterfaceBuilder = withAuth(InterfaceBuilder);
const ProtectedInterfaceBuilderRecovery = withAuth(InterfaceBuilderRecovery);
const ProtectedUserManagement = withAuth(UserManagement);
const ProtectedRoleManagement = withAuth(RoleManagement);
const ProtectedApiPermissions = withAuth(ApiPermissions);
const ProtectedUserActivityMonitor = withAuth(UserActivityMonitor);
const ProtectedSettings = withAuth(SettingsPage);
const ProtectedTMFDomainView = withAuth(TMFDomainView);

function Router() {
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(() => {
    // Load from localStorage
    const saved = localStorage.getItem('sidebar-minimized');
    return saved === 'true';
  });

  // Save to localStorage when state changes
  useEffect(() => {
    localStorage.setItem('sidebar-minimized', isSidebarMinimized.toString());
  }, [isSidebarMinimized]);

  // Add keyboard shortcut for toggle
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + B to toggle sidebar
      if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
        event.preventDefault();
        setIsSidebarMinimized(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route>
        {() => (
          <div className="flex h-screen bg-gray-900">
            <Sidebar isMinimized={isSidebarMinimized} setIsMinimized={setIsSidebarMinimized} />
            <main className="flex-1 flex flex-col overflow-hidden">
              <Switch>
                <Route path="/" component={ProtectedDashboard} />
                <Route path="/applications" component={ProtectedApplications} />
                <Route path="/interfaces" component={ProtectedInterfaces} />
                <Route path="/change-requests" component={ProtectedChangeRequests} />
                <Route path="/business-processes" component={ProtectedBusinessProcesses} />
                <Route path="/business-processes/:id/diagram" component={ProtectedBusinessProcessDiagram} />
                <Route path="/internal-activities" component={ProtectedInternalActivities} />
                <Route path="/technical-processes" component={ProtectedTechnicalProcesses} />
                <Route path="/technical-processes/:id/diagram" component={ProtectedTechnicalProcessDiagram} />
                <Route path="/technical-processes/:id" component={ProtectedTechnicalProcessDetail} />
                <Route path="/communications" component={ProtectedCommunications} />
                <Route path="/communications/timeline" component={ProtectedCommunicationTimeline} />
                <Route path="/impact-analysis" component={ProtectedImpactAnalysis} />
                <Route path="/impact-analysis-enhanced" component={ProtectedEnhancedImpactAnalysis} />
                <Route path="/timeline" component={ProtectedTimeline} />
                <Route path="/reports" component={ProtectedReports} />
                <Route path="/import-export" component={ProtectedImportExport} />
                <Route path="/interface-builder" component={ProtectedInterfaceBuilder} />
                <Route path="/interface-builder/recovery" component={ProtectedInterfaceBuilderRecovery} />
                <Route path="/test-n8n-style" component={TestN8nStyle} />
                <Route path="/users" component={ProtectedUserManagement} />
                <Route path="/roles" component={ProtectedRoleManagement} />
                <Route path="/api-permissions" component={ProtectedApiPermissions} />
                <Route path="/activity-monitor" component={ProtectedUserActivityMonitor} />
                <Route path="/settings" component={ProtectedSettings} />
                <Route path="/tmf-domain-view" component={ProtectedTMFDomainView} />
                <Route path="/test/all-shapes" component={TestAllShapes} />
                <Route path="/test/visio-features" component={TestVisioFeatures} />
                <Route path="/test/alignment-features" component={TestAlignmentFeatures} />
                <Route path="/test/visio-complete" component={TestVisioComplete} />
                <Route path="/test/import-debug" component={TestImportDebug} />
                <Route component={NotFound} />
              </Switch>
            </main>
          </div>
        )}
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
