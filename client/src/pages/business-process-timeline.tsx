import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Clock, GitBranch, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface InitiativeChange {
  initiativeId: string;
  initiativeName: string;
  initiativeStatus: string;
  changeDate: string;
  changedInterfaces: {
    interfaceId: number;
    imlNumber: string;
    changeType: 'create' | 'update' | 'delete';
    changedFields?: string[];
  }[];
  changedBusinessProcess?: {
    changeType: 'update';
    changedFields: string[];
  };
}

export default function BusinessProcessTimeline() {
  const params = useParams();
  const [, navigate] = useLocation();
  const businessProcessId = parseInt(params.id as string);

  // Fetch business process details
  const { data: businessProcess } = useQuery({
    queryKey: ["business-process", businessProcessId],
    queryFn: async () => {
      const response = await fetch(`/api/business-processes/${businessProcessId}`);
      if (!response.ok) throw new Error("Failed to fetch business process");
      return response.json();
    },
  });

  // Fetch timeline data - all initiatives that modified this business process
  const { data: timelineData = [] } = useQuery({
    queryKey: ["business-process-timeline", businessProcessId],
    queryFn: async () => {
      try {
        // Fetch all initiatives
        const initiativesRes = await api.get('/api/initiatives');
        const initiatives = initiativesRes.data;

        // For each initiative, check if it has changes for this business process
        const timelinePromises = initiatives.map(async (initiative: any) => {
          try {
            const changesRes = await api.get(`/api/version-control/initiative/${initiative.initiativeId}/changes`);
            const changes = changesRes.data;

            // Check if this business process or its interfaces were changed
            const bpChange = changes.businessProcesses?.find((c: any) => c.artifactId === businessProcessId);
            const interfaceChanges = changes.interfaces?.filter((c: any) => {
              // This would need to be enhanced to check if interface belongs to this BP
              return true; // Placeholder - would need BP-interface relationship check
            });

            if (bpChange || interfaceChanges?.length > 0) {
              return {
                initiativeId: initiative.initiativeId,
                initiativeName: initiative.name,
                initiativeStatus: initiative.status,
                changeDate: initiative.updatedAt || initiative.createdAt,
                changedInterfaces: interfaceChanges || [],
                changedBusinessProcess: bpChange,
              };
            }
          } catch (error) {
            console.error(`Failed to fetch changes for initiative ${initiative.initiativeId}:`, error);
          }
          return null;
        });

        const results = await Promise.all(timelinePromises);
        return results.filter(Boolean).sort((a, b) => 
          new Date(b.changeDate).getTime() - new Date(a.changeDate).getTime()
        );
      } catch (error) {
        console.error('Failed to fetch timeline data:', error);
        return [];
      }
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getChangeTypeBadge = (changeType: string) => {
    switch (changeType) {
      case 'create':
        return <Badge variant="default" className="bg-blue-600">New</Badge>;
      case 'update':
        return <Badge variant="default" className="bg-orange-600">Modified</Badge>;
      case 'delete':
        return <Badge variant="default" className="bg-red-600">Deleted</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/business-processes/${businessProcessId}/diagram`)}
            className="text-gray-300 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white">
              Timeline: {businessProcess?.businessProcess}
            </h1>
            <p className="text-sm text-gray-400">
              Evolution of business process through initiatives
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {timelineData.length === 0 ? (
          <Card className="bg-gray-800 border-gray-700 p-8 text-center">
            <p className="text-gray-400">No initiative changes found for this business process</p>
          </Card>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-700"></div>

            {/* Timeline entries */}
            <div className="space-y-8">
              {timelineData.map((entry, index) => (
                <div key={entry.initiativeId} className="relative flex items-start">
                  {/* Timeline dot */}
                  <div className="absolute left-6 w-4 h-4 bg-blue-600 rounded-full border-2 border-gray-800 z-10"></div>
                  
                  {/* Content card */}
                  <Card className="ml-16 bg-gray-800 border-gray-700 p-4 flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                          <GitBranch className="h-4 w-4" />
                          {entry.initiativeName}
                        </h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(entry.changeDate), 'MMM dd, yyyy')}
                          </span>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(entry.initiativeStatus)}
                            {entry.initiativeStatus.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/business-processes/${businessProcessId}/diagram`)}
                        className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600"
                      >
                        View in Diagram
                      </Button>
                    </div>

                    {/* Business Process Changes */}
                    {entry.changedBusinessProcess && (
                      <div className="mb-3">
                        <h4 className="text-sm font-medium text-gray-300 mb-2">Business Process Changes:</h4>
                        <div className="flex flex-wrap gap-2">
                          {getChangeTypeBadge(entry.changedBusinessProcess.changeType)}
                          {entry.changedBusinessProcess.changedFields?.map((field: string) => (
                            <Badge key={field} variant="outline" className="text-gray-300 border-gray-600">
                              {field}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Interface Changes */}
                    {entry.changedInterfaces.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-300 mb-2">
                          Interface Changes ({entry.changedInterfaces.length}):
                        </h4>
                        <div className="space-y-2">
                          {entry.changedInterfaces.slice(0, 5).map((iface: any) => (
                            <div key={iface.interfaceId} className="flex items-center gap-2 text-sm">
                              {getChangeTypeBadge(iface.changeType)}
                              <span className="text-gray-400">IML {iface.imlNumber}</span>
                              {iface.changedFields && iface.changedFields.length > 0 && (
                                <span className="text-gray-500">
                                  ({iface.changedFields.join(', ')})
                                </span>
                              )}
                            </div>
                          ))}
                          {entry.changedInterfaces.length > 5 && (
                            <p className="text-sm text-gray-500">
                              ...and {entry.changedInterfaces.length - 5} more
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </Card>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}