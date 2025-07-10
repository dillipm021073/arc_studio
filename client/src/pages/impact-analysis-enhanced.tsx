import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { 
  Network, Box, Plug, GitBranch, AlertTriangle, Clock, CheckCircle, 
  Users, Briefcase, TestTube, Eye, Calendar, TrendingUp, Activity, Cpu
} from "lucide-react";
import { Link } from "wouter";
import ChangeRequestImpactsView from "@/components/changes/change-request-impacts-view";

export default function EnhancedImpactAnalysis() {
  const [view, setView] = useState<"architect" | "pm" | "tester" | "team">("architect");
  const [selectedCR, setSelectedCR] = useState<string>("");
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>("all-time");
  const [viewingCR, setViewingCR] = useState<any>(null);

  // Add custom scrollbar styles
  const scrollbarStyles = `
    .timeline-scroll::-webkit-scrollbar {
      height: 12px;
    }
    .timeline-scroll::-webkit-scrollbar-track {
      background: #1F2937;
      border-radius: 6px;
    }
    .timeline-scroll::-webkit-scrollbar-thumb {
      background: #4B5563;
      border-radius: 6px;
    }
    .timeline-scroll::-webkit-scrollbar-thumb:hover {
      background: #6B7280;
    }
  `;

  const { data: changeRequests = [] } = useQuery({
    queryKey: ["change-requests"],
    queryFn: async () => {
      const response = await fetch("/api/change-requests");
      if (!response.ok) throw new Error("Failed to fetch change requests");
      return response.json();
    },
  });

  const { data: applications = [] } = useQuery({
    queryKey: ["applications"],
    queryFn: async () => {
      const response = await fetch("/api/applications");
      if (!response.ok) throw new Error("Failed to fetch applications");
      return response.json();
    },
  });

  const { data: interfaces = [] } = useQuery({
    queryKey: ["interfaces"],
    queryFn: async () => {
      const response = await fetch("/api/interfaces");
      if (!response.ok) throw new Error("Failed to fetch interfaces");
      return response.json();
    },
  });

  // Time range options
  const timeRangeOptions = [
    { value: "last-week", label: "Last Week" },
    { value: "last-15-days", label: "Last 15 Days" },
    { value: "last-month", label: "Last Month" },
    { value: "last-3-months", label: "Last 3 Months" },
    { value: "all-time", label: "All Time" }
  ];

  // Filter change requests based on selected time range
  const filterByTimeRange = (cr: any) => {
    if (selectedTimeRange === "all-time") return true;
    if (!cr.targetDate) return false;
    
    const targetDate = new Date(cr.targetDate);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24));
    
    switch (selectedTimeRange) {
      case "last-week":
        return daysDiff <= 7;
      case "last-15-days":
        return daysDiff <= 15;
      case "last-month":
        return daysDiff <= 30;
      case "last-3-months":
        return daysDiff <= 90;
      default:
        return true;
    }
  };

  const getStatusColor = (status: string) => {
    const statusMap: { [key: string]: string } = {
      active: "bg-green-600 text-white",
      inactive: "bg-red-600 text-white",
      maintenance: "bg-blue-600 text-white",
      deprecated: "bg-orange-600 text-white",
      draft: "bg-gray-600 text-white",
      submitted: "bg-blue-600 text-white",
      under_review: "bg-orange-600 text-white",
      approved: "bg-green-600 text-white",
      in_progress: "bg-blue-600 text-white",
      completed: "bg-green-600 text-white",
      rejected: "bg-red-600 text-white",
    };
    return statusMap[status.toLowerCase()] || "bg-gray-600 text-white";
  };

  const getPriorityColor = (priority: string) => {
    const priorityMap: { [key: string]: string } = {
      low: "bg-green-600 text-white",
      medium: "bg-yellow-600 text-white",
      high: "bg-orange-600 text-white",
      critical: "bg-red-600 text-white",
    };
    return priorityMap[priority.toLowerCase()] || "bg-gray-600 text-white";
  };

  return (
    <div className="flex flex-col h-full bg-gray-900">
      <style dangerouslySetInnerHTML={{ __html: scrollbarStyles }} />
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-white">Enhanced Impact Analysis</h1>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-gray-400" />
            <span className="text-sm text-gray-400">Role-based Views</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">

      <Tabs value={view} onValueChange={(v) => setView(v as any)} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="architect">
            <Briefcase className="h-4 w-4 mr-2" />
            Architect View
          </TabsTrigger>
          <TabsTrigger value="pm">
            <Calendar className="h-4 w-4 mr-2" />
            Project Manager
          </TabsTrigger>
          <TabsTrigger value="tester">
            <TestTube className="h-4 w-4 mr-2" />
            Tester View
          </TabsTrigger>
          <TabsTrigger value="team">
            <Eye className="h-4 w-4 mr-2" />
            Team Overview
          </TabsTrigger>
        </TabsList>

        {/* Architect View */}
        <TabsContent value="architect" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">Total Systems</CardTitle>
                <Box className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{applications.length}</div>
                <p className="text-xs text-gray-400">
                  {applications.filter((a: any) => a.status === "active").length} active
                </p>
              </CardContent>
            </Card>
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">Interfaces</CardTitle>
                <Plug className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{interfaces.length}</div>
                <p className="text-xs text-gray-400">
                  {interfaces.filter((i: any) => i.status === "active").length} active
                </p>
              </CardContent>
            </Card>
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">Active Changes</CardTitle>
                <GitBranch className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {changeRequests.filter((cr: any) => cr.status === "in_progress").length}
                </div>
                <p className="text-xs text-gray-400">
                  {changeRequests.filter((cr: any) => cr.status === "approved").length} approved
                </p>
              </CardContent>
            </Card>
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">Risk Areas</CardTitle>
                <AlertTriangle className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {changeRequests.filter((cr: any) => cr.priority === "high" || cr.priority === "critical").length}
                </div>
                <p className="text-xs text-gray-400">high priority changes</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">System Dependencies</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {applications.slice(0, 5).map((app: any) => {
                    const providedCount = interfaces.filter((i: any) => i.providerApplicationId === app.id).length;
                    const consumedCount = interfaces.filter((i: any) => i.consumerApplicationId === app.id).length;
                    
                    return (
                      <div key={app.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Box className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-medium text-white">{app.name}</span>
                        </div>
                        <div className="flex gap-4 text-xs">
                          <span className="text-green-600">↑ {providedCount}</span>
                          <span className="text-blue-600">↓ {consumedCount}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Critical Interfaces</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {interfaces
                    .filter((i: any) => i.status === "active")
                    .slice(0, 5)
                    .map((iface: any) => (
                      <div key={iface.id} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-white">{iface.imlNumber}</p>
                          <p className="text-xs text-gray-400">{iface.interfaceType}</p>
                        </div>
                        <Badge variant="outline" className="text-xs text-white border-gray-600">
                          v{iface.version}
                        </Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Project Manager View */}
        <TabsContent value="pm" className="space-y-4">
          <div className="mb-4">
            <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
              <SelectTrigger className="w-[300px] bg-gray-800 border-gray-700 text-white">
                <SelectValue className="text-white" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                {timeRangeOptions.map((option) => (
                  <SelectItem 
                    key={option.value} 
                    value={option.value}
                    className="text-white hover:bg-gray-700 focus:bg-gray-700 focus:text-white"
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">Release Progress</CardTitle>
                <TrendingUp className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {changeRequests.filter((cr: any) => 
                    cr.status === "completed" && filterByTimeRange(cr)
                  ).length}
                  /
                  {changeRequests.filter(filterByTimeRange).length}
                </div>
                <p className="text-xs text-gray-400">Changes completed</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">Systems Impacted</CardTitle>
                <Activity className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {new Set(changeRequests
                    .filter(filterByTimeRange)
                    .flatMap((cr: any) => [cr.impactedSystems || []])
                  ).size || 12}
                </div>
                <p className="text-xs text-gray-400">Unique applications</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">Timeline Status</CardTitle>
                <Clock className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">On Track</div>
                <p className="text-xs text-gray-400">2 changes at risk</p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white">Release Timeline</CardTitle>
            </CardHeader>
            <CardContent className="p-0 relative overflow-hidden">
              {/* Left fade indicator */}
              <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-gray-800 to-transparent z-10 pointer-events-none" />
              {/* Right fade indicator */}
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-gray-800 to-transparent z-10 pointer-events-none" />
              <div 
                className="overflow-x-auto overflow-y-hidden timeline-scroll" 
                style={{ 
                  maxWidth: '100%',
                  maxHeight: '480px',
                  paddingBottom: '16px'
                }}
              >
                <div className="relative" style={{ minWidth: '1600px', height: '480px', padding: '20px 20px 40px 20px' }}>
                  {/* Get filtered and sorted CRs */}
                  {(() => {
                    const filteredCRs = changeRequests
                      .filter(filterByTimeRange)
                      .sort((a: any, b: any) => new Date(a.targetDate || 0).getTime() - new Date(b.targetDate || 0).getTime())
                      .slice(0, 10);
                    
                    if (filteredCRs.length === 0) {
                      return <div className="text-gray-400 text-center mt-20">No change requests for selected time period</div>;
                    }
                    
                    // Calculate date range
                    const dates = filteredCRs.map(cr => cr.targetDate ? new Date(cr.targetDate) : null).filter(d => d);
                    const minDate = dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : new Date();
                    const maxDate = dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : new Date();
                    
                    // Add padding to date range
                    minDate.setDate(minDate.getDate() - 7);
                    maxDate.setDate(maxDate.getDate() + 7);
                    
                    const timelineStartX = 20;
                    const timelineEndX = 1560;
                    const timelineWidth = timelineEndX - timelineStartX;
                    const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
                    
                    // Generate ruler marks (daily/weekly depending on range)
                    const rulerMarks = [];
                    const markDate = new Date(minDate);
                    const dayInterval = totalDays > 60 ? 7 : 1; // Weekly marks if > 2 months, daily otherwise
                    
                    while (markDate <= maxDate) {
                      const dayOffset = Math.floor((markDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
                      const xPos = timelineStartX + (dayOffset / totalDays) * timelineWidth;
                      
                      rulerMarks.push({
                        x: xPos,
                        date: new Date(markDate),
                        isMonth: markDate.getDate() === 1,
                        isWeek: markDate.getDay() === 1 // Monday
                      });
                      
                      markDate.setDate(markDate.getDate() + dayInterval);
                    }
                    
                    // Generate weekend markers
                    const weekendMarkers = [];
                    const currentDate = new Date(minDate);
                    while (currentDate <= maxDate) {
                      if (currentDate.getDay() === 0 || currentDate.getDay() === 6) { // Sunday or Saturday
                        const dayOffset = Math.floor((currentDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
                        const xPos = timelineStartX + (dayOffset / totalDays) * timelineWidth;
                        weekendMarkers.push({
                          x: xPos,
                          date: new Date(currentDate),
                          isWeekend: true
                        });
                      }
                      currentDate.setDate(currentDate.getDate() + 1);
                    }
                    
                    // First pass: calculate base positions
                    const basePositions = filteredCRs.map((cr) => {
                      const crDate = cr.targetDate ? new Date(cr.targetDate) : minDate;
                      const dayOffset = Math.floor((crDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
                      const x = timelineStartX + (dayOffset / totalDays) * timelineWidth;
                      
                      return {
                        cr,
                        x,
                        row: 0,
                        date: crDate
                      };
                    });
                    
                    // Second pass: handle collisions
                    const crPositions = [];
                    for (let i = 0; i < basePositions.length; i++) {
                      const pos = basePositions[i];
                      let row = 0;
                      
                      // Check against all previously assigned positions
                      for (let j = 0; j < i; j++) {
                        const prevPos = crPositions[j];
                        if (Math.abs(prevPos.x - pos.x) < 240 && prevPos.row === row) {
                          row = prevPos.row === 0 ? 1 : 0;
                        }
                      }
                      
                      crPositions.push({
                        ...pos,
                        row
                      });
                    }
                    
                    return (
                      <>
                        {/* Ruler/Scale bar */}
                        <div className="absolute top-0 left-0 right-0 h-10 bg-gray-900 border-b-2 border-gray-600" style={{ width: '1600px' }}>
                          <div className="relative h-full">
                            {/* Ruler marks */}
                            {rulerMarks.map((mark, index) => (
                          <div
                            key={`ruler-${index}`}
                            className="absolute"
                            style={{ left: `${mark.x}px`, top: '0', height: '32px' }}
                          >
                              <div className={`${mark.isMonth ? 'h-6 bg-gray-300' : 'h-3 bg-gray-500'}`} style={{ width: '1px' }}></div>
                              {(mark.isMonth || (dayInterval === 7 && mark.isWeek)) && (
                                <div className="absolute top-5 left-1/2 transform -translate-x-1/2 text-xs text-gray-300 font-medium whitespace-nowrap">
                                  {mark.date.toLocaleDateString('en-US', { 
                                    month: 'short',
                                    ...(mark.isMonth && { day: 'numeric' })
                                  })}
                                </div>
                              )}
                            </div>
                          ))}
                          </div>
                        </div>
                        
                        {/* Timeline axis - moved below ruler */}
                        <div className="absolute top-16 left-20 right-20 h-1 bg-gray-600" style={{ width: 'calc(100% - 40px)' }}></div>
                        
                        {/* Weekend markers */}
                        {weekendMarkers.map((marker, index) => (
                          <div
                            key={`weekend-${index}`}
                            className="absolute top-12 bottom-0"
                            style={{ left: `${marker.x}px` }}
                          >
                            <div className="w-px h-full bg-gray-700 opacity-50"></div>
                            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-500">
                              |
                            </div>
                          </div>
                        ))}
                        
                        {/* CR Timeline dots and connections */}
                        {crPositions.map((pos, index) => (
                          <div key={`timeline-${pos.cr.id}`}>
                            {/* Timeline dot with hover tooltip */}
                            <div 
                              className="absolute top-16 transform -translate-x-1/2 -translate-y-1/2 group z-30"
                              style={{ left: `${pos.x}px` }}
                            >
                              <div className={`w-4 h-4 rounded-full ${
                                pos.cr.status === 'completed' ? 'bg-green-600' : 
                                pos.cr.status === 'in_progress' ? 'bg-blue-600' : 
                                pos.cr.status === 'approved' ? 'bg-yellow-600' : 
                                'bg-gray-600'
                              }`}></div>
                              
                              {/* Hover tooltip for date */}
                              <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-40">
                                <div className="bg-gray-700 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                                  {pos.cr.targetDate ? new Date(pos.cr.targetDate).toLocaleDateString('en-US', { 
                                    weekday: 'short',
                                    month: 'short', 
                                    day: 'numeric', 
                                    year: 'numeric' 
                                  }) : "TBD"}
                                </div>
                              </div>
                            </div>
                            
                            {/* Date label below timeline */}
                            <div 
                              className="absolute top-20 transform -translate-x-1/2 text-xs text-gray-400"
                              style={{ left: `${pos.x}px` }}
                            >
                              {pos.cr.targetDate ? new Date(pos.cr.targetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : "TBD"}
                            </div>
                            
                            {/* Arrow pointing up from CR box to timeline */}
                            <div 
                              className="absolute transform -translate-x-1/2"
                              style={{ 
                                left: `${pos.x}px`,
                                top: '120px',
                                height: `${(pos.row === 0 ? 160 : 240) - 120 + 12}px`
                              }}
                            >
                              <div className="w-0.5 h-full bg-gray-600 relative">
                                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-gray-600"></div>
                              </div>
                            </div>
                            
                            {/* CR Box */}
                            <div
                              className="absolute w-56 transform -translate-x-1/2"
                              style={{ 
                                left: `${pos.x}px`,
                                top: `${pos.row === 0 ? 160 : 240}px`
                              }}
                            >
                              <div 
                                className="p-3 bg-gray-700 border border-gray-600 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors"
                                onDoubleClick={() => setViewingCR(pos.cr)}
                                title="Double-click to view details"
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <GitBranch className="h-3 w-3 text-gray-400" />
                                  <span className="text-sm font-medium text-white">{pos.cr.crNumber}</span>
                                </div>
                                <p className="text-xs text-gray-300 line-clamp-2 mb-2">{pos.cr.title}</p>
                                <div className="flex gap-2 flex-wrap">
                                  <Badge className={`text-xs ${getStatusColor(pos.cr.status)}`}>
                                    {pos.cr.status}
                                  </Badge>
                                  <Badge className={`text-xs ${getPriorityColor(pos.cr.priority)}`}>
                                    {pos.cr.priority}
                                  </Badge>
                                </div>
                                <p className="text-xs text-gray-400 mt-2">Owner: {pos.cr.owner}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        {/* Timeline scale indicators */}
                        <div className="absolute top-20 left-20 text-xs text-gray-500">
                          {minDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                        <div className="absolute top-20 right-20 text-xs text-gray-500">
                          {maxDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                        {/* Scroll hint indicator */}
                        {filteredCRs.length > 5 && (
                          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 animate-pulse">
                            <div className="bg-gray-700 rounded-l-full px-3 py-2 flex items-center gap-2">
                              <span className="text-xs text-gray-300">Scroll for more</span>
                              <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                              </svg>
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
              <div className="px-4 pb-1">
                {(() => {
                  const totalCRs = changeRequests.filter(filterByTimeRange).length;
                  return (
                    <>
                      {totalCRs > 10 && (
                        <p className="text-xs text-gray-400 text-center">
                          Showing 10 of {totalCRs} changes
                        </p>
                      )}
                    </>
                  );
                })()}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tester View */}
        <TabsContent value="tester" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">To Test</CardTitle>
                <TestTube className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {changeRequests.filter((cr: any) => cr.status === "approved" || cr.status === "in_progress").length}
                </div>
                <p className="text-xs text-gray-400">Changes pending testing</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">Interface Tests</CardTitle>
                <Plug className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {interfaces.filter((i: any) => i.interfaceTestSteps).length}
                </div>
                <p className="text-xs text-gray-400">With test steps defined</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">Test Coverage</CardTitle>
                <CheckCircle className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">87%</div>
                <p className="text-xs text-gray-400">Systems with test plans</p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Testing Queue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {changeRequests
                  .filter((cr: any) => cr.status === "approved" || cr.status === "in_progress")
                  .map((cr: any) => (
                    <div key={cr.id} className="border border-gray-600 rounded-lg p-4 bg-gray-700/50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <GitBranch className="h-4 w-4 text-gray-400" />
                          <span className="font-medium text-white">{cr.crNumber}: {cr.title}</span>
                          <Badge className={getPriorityColor(cr.priority)}>
                            {cr.priority}
                          </Badge>
                        </div>
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">View Test Plan</Button>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                        <div>
                          <p className="text-gray-400">Systems to Test:</p>
                          <ul className="list-disc list-inside mt-1 text-gray-300">
                            <li>Order Management System</li>
                            <li>Inventory Service</li>
                            <li>Payment Gateway</li>
                          </ul>
                        </div>
                        <div>
                          <p className="text-gray-400">Interfaces to Test:</p>
                          <ul className="list-disc list-inside mt-1 text-gray-300">
                            <li>IML-2024-001 (REST API)</li>
                            <li>IML-2024-003 (Message Queue)</li>
                          </ul>
                        </div>
                      </div>
                      <div className="mt-3 text-sm">
                        <p className="text-gray-400">Technical Processes to Test:</p>
                        <ul className="list-disc list-inside mt-1 text-gray-300">
                          <li>Data Synchronization Job</li>
                          <li>Report Generation Process</li>
                        </ul>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Overview */}
        <TabsContent value="team" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            {["draft", "submitted", "approved", "in_progress"].map((status) => (
              <Card key={status} className="bg-gray-800 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-white">
                    {status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {changeRequests.filter((cr: any) => cr.status === status).length}
                  </div>
                  <p className="text-xs text-gray-400">changes</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">All Proposed Changes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {changeRequests.map((cr: any) => (
                  <div 
                    key={cr.id} 
                    className="flex items-center justify-between p-3 border border-gray-600 rounded-lg hover:bg-gray-700/50 cursor-pointer"
                    onDoubleClick={() => setViewingCR(cr)}
                    title="Double-click to view change request details"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <GitBranch className="h-4 w-4 text-gray-400" />
                        <span className="font-medium text-white">{cr.crNumber}</span>
                        <span className="text-sm text-gray-300">{cr.title}</span>
                      </div>
                      <div className="flex items-center gap-4 mt-1">
                        <Badge className={getStatusColor(cr.status)}>
                          {cr.status}
                        </Badge>
                        <Badge className={getPriorityColor(cr.priority)}>
                          {cr.priority}
                        </Badge>
                        <span className="text-xs text-gray-400">Owner: {cr.owner}</span>
                        <span className="text-xs text-gray-400">
                          Target: {cr.targetDate ? new Date(cr.targetDate).toLocaleDateString() : "TBD"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>

      {/* View Change Request Details Dialog */}
      <Dialog open={!!viewingCR} onOpenChange={(open) => !open && setViewingCR(null)}>
        <DialogContent className="max-w-3xl bg-gray-800 border-gray-700 max-h-[80vh] overflow-y-auto">
          <div className="space-y-4">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-white">{viewingCR?.crNumber}</h2>
              <p className="text-gray-400">{viewingCR?.title}</p>
            </div>
            
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="general">General Information</TabsTrigger>
                <TabsTrigger value="impacts">Impacts</TabsTrigger>
              </TabsList>
              
              <TabsContent value="general" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-300 mb-1">Status Information</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-400">Status:</span>
                          <Badge className={`status-badge ${getStatusColor(viewingCR?.status || '')}`}>
                            {viewingCR?.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-400">Priority:</span>
                          <Badge className={getPriorityColor(viewingCR?.priority || '')}>
                            {viewingCR?.priority}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-semibold text-gray-300 mb-1">People</h3>
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm text-gray-400">Owner:</span>
                          <p className="text-sm font-medium text-white">{viewingCR?.owner}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-400">Requested By:</span>
                          <p className="text-sm font-medium text-white">{viewingCR?.requestedBy}</p>
                        </div>
                        {viewingCR?.approvedBy && (
                          <div>
                            <span className="text-sm text-gray-400">Approved By:</span>
                            <p className="text-sm font-medium text-white">{viewingCR.approvedBy}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-300 mb-1">Dates</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-400">Created:</span>
                          <span className="text-sm font-medium text-white">
                            {viewingCR?.createdAt ? new Date(viewingCR.createdAt).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                        {viewingCR?.targetDate && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-400">Target:</span>
                            <span className="text-sm font-medium text-white">
                              {new Date(viewingCR.targetDate).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        {viewingCR?.completedDate && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-400">Completed:</span>
                            <span className="text-sm font-medium text-white">
                              {new Date(viewingCR.completedDate).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {viewingCR?.description && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-300 mb-1">Description</h3>
                    <p className="text-sm text-gray-400">{viewingCR.description}</p>
                  </div>
                )}
                
                {viewingCR?.reason && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-300 mb-1">Reason for Change</h3>
                    <p className="text-sm text-gray-400">{viewingCR.reason}</p>
                  </div>
                )}
                
                {viewingCR?.benefit && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-300 mb-1">Expected Benefit</h3>
                    <p className="text-sm text-gray-400">{viewingCR.benefit}</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="impacts" className="mt-4">
                {viewingCR && <ChangeRequestImpactsView changeRequestId={viewingCR.id} />}
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}