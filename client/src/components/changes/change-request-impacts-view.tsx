import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Server, Plug, AlertCircle, Cpu, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import ApplicationDetailsModal from "@/components/modals/ApplicationDetailsModal";
import InterfaceDetailsModal from "@/components/modals/InterfaceDetailsModal";

interface ChangeRequestImpactsViewProps {
  changeRequestId: number;
}

export default function ChangeRequestImpactsView({ changeRequestId }: ChangeRequestImpactsViewProps) {
  const [applicationImpacts, setApplicationImpacts] = useState<any[]>([]);
  const [interfaceImpacts, setInterfaceImpacts] = useState<any[]>([]);
  const [technicalProcessImpacts, setTechnicalProcessImpacts] = useState<any[]>([]);
  const [internalActivityImpacts, setInternalActivityImpacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<number | null>(null);
  const [selectedInterface, setSelectedInterface] = useState<number | null>(null);

  useEffect(() => {
    const fetchImpacts = async () => {
      try {
        setLoading(true);
        
        // Fetch application impacts
        const appResponse = await fetch(`/api/change-requests/${changeRequestId}/applications`);
        if (appResponse.ok) {
          const appData = await appResponse.json();
          setApplicationImpacts(appData);
        }

        // Fetch interface impacts
        const intResponse = await fetch(`/api/change-requests/${changeRequestId}/interfaces`);
        if (intResponse.ok) {
          const intData = await intResponse.json();
          setInterfaceImpacts(intData);
        }

        // Fetch technical process impacts
        const tpResponse = await fetch(`/api/change-requests/${changeRequestId}/technical-processes`);
        if (tpResponse.ok) {
          const tpData = await tpResponse.json();
          setTechnicalProcessImpacts(tpData);
        }

        // Fetch internal activity impacts
        const iaResponse = await fetch(`/api/change-requests/${changeRequestId}/internal-activities`);
        if (iaResponse.ok) {
          const iaData = await iaResponse.json();
          setInternalActivityImpacts(iaData);
        }
      } catch (error) {
        console.error("Failed to fetch impacts:", error);
      } finally {
        setLoading(false);
      }
    };

    if (changeRequestId) {
      fetchImpacts();
    }
  }, [changeRequestId]);

  const getImpactTypeBadge = (type: string) => {
    switch (type) {
      case "modification":
        return <Badge className="bg-blue-600 text-white">Modification</Badge>;
      case "dependency":
        return <Badge className="bg-purple-600 text-white">Dependency</Badge>;
      case "testing":
        return <Badge className="bg-gray-600 text-white border-gray-600">Testing Only</Badge>;
      case "configuration":
        return <Badge className="bg-gray-600 text-white border-gray-600">Configuration</Badge>;
      case "version_change":
        return <Badge className="bg-orange-600 text-white">Version Change</Badge>;
      case "deprecation":
        return <Badge className="bg-red-600 text-white">Deprecation</Badge>;
      default:
        return <Badge className="bg-gray-600 text-white">{type}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <Skeleton className="h-6 w-40 bg-gray-700" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-20 w-full bg-gray-700" />
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <Skeleton className="h-6 w-40 bg-gray-700" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-20 w-full bg-gray-700" />
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <Skeleton className="h-6 w-40 bg-gray-700" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-20 w-full bg-gray-700" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalImpacts = applicationImpacts.length + interfaceImpacts.length + technicalProcessImpacts.length + internalActivityImpacts.length;

  return (
    <div className="space-y-4">
      {totalImpacts === 0 ? (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="text-center py-8">
            <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-2" />
            <p className="text-gray-400">No impacts recorded for this change request</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {applicationImpacts.length > 0 && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-white">
                  <Server className="h-4 w-4 text-gray-400" />
                  Application Impacts ({applicationImpacts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {applicationImpacts.map((impact, index) => (
                    <div 
                      key={index} 
                      className="border border-gray-600 rounded-lg p-3 bg-gray-700/50 cursor-pointer hover:bg-gray-600/50 transition-colors"
                      onDoubleClick={() => impact.applicationId && setSelectedApplication(impact.applicationId)}
                      title="Double-click to view application details"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-white">{impact.application?.name || "Unknown Application"}</p>
                          {impact.application?.description && (
                            <p className="text-sm text-gray-400">{impact.application.description}</p>
                          )}
                        </div>
                        {getImpactTypeBadge(impact.impactType)}
                      </div>
                      {impact.impactDescription && (
                        <p className="text-sm text-gray-300 mt-2">{impact.impactDescription}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {interfaceImpacts.length > 0 && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-white">
                  <Plug className="h-4 w-4 text-gray-400" />
                  Interface Impacts ({interfaceImpacts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {interfaceImpacts.map((impact, index) => (
                    <div 
                      key={index} 
                      className="border border-gray-600 rounded-lg p-3 bg-gray-700/50 cursor-pointer hover:bg-gray-600/50 transition-colors"
                      onDoubleClick={() => impact.interfaceId && setSelectedInterface(impact.interfaceId)}
                      title="Double-click to view interface details"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-white">{impact.interface?.imlNumber || "Unknown Interface"}</p>
                          <p className="text-sm text-gray-400">
                            {impact.interface?.interfaceType} - v{impact.interface?.version}
                          </p>
                        </div>
                        {getImpactTypeBadge(impact.impactType)}
                      </div>
                      {impact.impactDescription && (
                        <p className="text-sm text-gray-300 mt-2">{impact.impactDescription}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {technicalProcessImpacts.length > 0 && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-white">
                  <Cpu className="h-4 w-4 text-gray-400" />
                  Technical Process Impacts ({technicalProcessImpacts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {technicalProcessImpacts.map((impact, index) => (
                    <div 
                      key={index} 
                      className="border border-gray-600 rounded-lg p-3 bg-gray-700/50 cursor-pointer hover:bg-gray-600/50 transition-colors"
                      onDoubleClick={() => impact.technicalProcessId && (window.location.href = `/technical-processes/${impact.technicalProcessId}`)}
                      title="Double-click to view technical process details"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-white">{impact.technicalProcess?.name || "Unknown Technical Process"}</p>
                          <p className="text-sm text-gray-400">
                            Job: {impact.technicalProcess?.jobName}
                          </p>
                          {impact.technicalProcess?.applicationName && (
                            <p className="text-xs text-gray-400">
                              Application: {impact.technicalProcess.applicationName}
                            </p>
                          )}
                        </div>
                        {getImpactTypeBadge(impact.impactType)}
                      </div>
                      {impact.impactDescription && (
                        <p className="text-sm text-gray-300 mt-2">{impact.impactDescription}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {internalActivityImpacts.length > 0 && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-white">
                  <Activity className="h-4 w-4 text-gray-400" />
                  Internal Activity Impacts ({internalActivityImpacts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {internalActivityImpacts.map((impact, index) => (
                    <div 
                      key={index} 
                      className="border border-gray-600 rounded-lg p-3 bg-gray-700/50 cursor-pointer hover:bg-gray-600/50 transition-colors"
                      onDoubleClick={() => impact.internalActivityId && (window.location.href = `/internal-activities#${impact.internalActivityId}`)}
                      title="Double-click to view internal activity details"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-white">{impact.internalActivity?.activityName || "Unknown Internal Activity"}</p>
                          <p className="text-sm text-gray-400">
                            {impact.internalActivity?.activityType}
                          </p>
                          {impact.internalActivity?.applicationName && (
                            <p className="text-xs text-gray-400">
                              Application: {impact.internalActivity.applicationName}
                            </p>
                          )}
                        </div>
                        {getImpactTypeBadge(impact.impactType)}
                      </div>
                      {impact.impactDescription && (
                        <p className="text-sm text-gray-300 mt-2">{impact.impactDescription}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
      
      {/* Application Details Modal */}
      <ApplicationDetailsModal
        applicationId={selectedApplication}
        open={!!selectedApplication}
        onOpenChange={(open) => !open && setSelectedApplication(null)}
      />
      
      {/* Interface Details Modal */}
      <InterfaceDetailsModal
        interfaceId={selectedInterface}
        open={!!selectedInterface}
        onOpenChange={(open) => !open && setSelectedInterface(null)}
      />
    </div>
  );
}