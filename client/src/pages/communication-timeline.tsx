import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import ConversationDetail from "@/components/communications/conversation-detail";
import {
  Calendar,
  MessageSquare,
  User,
  Clock,
  Filter,
  ChevronDown,
  ChevronRight,
  Box,
  Plug,
  Workflow,
  GitBranch,
  AlertCircle,
  CheckCircle,
  Timer,
  XCircle
} from "lucide-react";
import { Link } from "wouter";

interface TimelineEvent {
  type: string;
  timestamp: string;
  conversation: any;
  comment: any;
  link?: any;
}

interface TimelineDay {
  date: string;
  events: TimelineEvent[];
}

export default function CommunicationTimeline() {
  const [dateRange, setDateRange] = useState("week");
  const [entityTypeFilter, setEntityTypeFilter] = useState("all");
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [viewingConversationId, setViewingConversationId] = useState<number | null>(null);

  // Calculate date range
  const getDateRange = () => {
    const now = new Date();
    switch (dateRange) {
      case "today":
        return {
          start: new Date(now.setHours(0, 0, 0, 0)),
          end: new Date(now.setHours(23, 59, 59, 999))
        };
      case "week":
        return {
          start: startOfWeek(now),
          end: endOfWeek(now)
        };
      case "month":
        return {
          start: startOfMonth(now),
          end: endOfMonth(now)
        };
      case "all":
      default:
        return { start: undefined, end: undefined };
    }
  };

  const { start: startDate, end: endDate } = getDateRange();

  // Fetch timeline data
  const { data: timeline, isLoading } = useQuery<TimelineDay[]>({
    queryKey: ["/api/communications/timeline", startDate, endDate, entityTypeFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate.toISOString());
      if (endDate) params.append("endDate", endDate.toISOString());
      if (entityTypeFilter && entityTypeFilter !== "all") params.append("entityType", entityTypeFilter);
      
      const response = await fetch(`/api/communications/timeline?${params}`);
      if (!response.ok) throw new Error("Failed to fetch timeline");
      return response.json();
    },
  });

  const toggleDate = (date: string) => {
    const newExpanded = new Set(expandedDates);
    if (newExpanded.has(date)) {
      newExpanded.delete(date);
    } else {
      newExpanded.add(date);
    }
    setExpandedDates(newExpanded);
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open': return <AlertCircle className="h-3 w-3" />;
      case 'resolved': return <CheckCircle className="h-3 w-3" />;
      case 'pending': return <Timer className="h-3 w-3" />;
      case 'closed': return <XCircle className="h-3 w-3" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open': return 'bg-blue-600 text-white';
      case 'resolved': return 'bg-green-600 text-white';
      case 'pending': return 'bg-yellow-600 text-white';
      case 'closed': return 'bg-gray-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'application': return <Box className="h-4 w-4 text-blue-500" />;
      case 'interface': return <Plug className="h-4 w-4 text-green-600" />;
      case 'business_process': return <Workflow className="h-4 w-4 text-purple-600" />;
      case 'change_request': return <GitBranch className="h-4 w-4 text-orange-600" />;
      default: return null;
    }
  };

  const formatEntityType = (type: string) => {
    switch (type) {
      case 'application': return 'Application';
      case 'interface': return 'Interface';
      case 'business_process': return 'Business Process';
      case 'change_request': return 'Change Request';
      default: return type;
    }
  };

  const renderTimelineEvent = (event: TimelineEvent) => {
    const { conversation, comment, link } = event;
    
    return (
      <Card 
        key={`${conversation.id}-${comment.id}`} 
        className="bg-gray-800 border-gray-700 hover:bg-gray-700/50 transition-colors cursor-pointer"
        onClick={() => setViewingConversationId(conversation.id)}
      >
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <div className="bg-gray-700 rounded-full p-2 mt-1">
              <MessageSquare className="h-4 w-4 text-blue-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-white truncate">{conversation.title}</h4>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge className={`status-badge ${getStatusColor(conversation.status)} text-xs inline-flex items-center gap-1`}>
                      {getStatusIcon(conversation.status)}
                      {conversation.status}
                    </Badge>
                    {link && (
                      <div className="flex items-center space-x-1 text-xs text-gray-400">
                        {getEntityIcon(link.entityType)}
                        <span>{formatEntityType(link.entityType)} #{link.entityId}</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-2 bg-gray-900 p-2 rounded">
                    <div className="flex items-center space-x-2 text-xs text-gray-400 mb-1">
                      <User className="h-3 w-3" />
                      <span>{comment.author}</span>
                      <Clock className="h-3 w-3" />
                      <span>{format(new Date(comment.createdAt), 'HH:mm')}</span>
                    </div>
                    <p className="text-sm text-gray-300 line-clamp-2">{comment.content}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <nav className="flex" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-2 text-sm text-gray-400">
                <li><Link href="/" className="hover:text-gray-200">Home</Link></li>
                <li className="flex items-center">
                  <span className="mx-2">/</span>
                  <Link href="/communications" className="hover:text-gray-200">Communications</Link>
                </li>
                <li className="flex items-center">
                  <span className="mx-2">/</span>
                  <span className="text-white font-medium">Timeline</span>
                </li>
              </ol>
            </nav>
            <h1 className="text-2xl font-semibold text-white mt-1">Communication Timeline</h1>
          </div>
          <Button
            onClick={() => window.location.href = '/communications'}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            <MessageSquare className="mr-2" size={16} />
            View All Conversations
          </Button>
        </div>
      </header>

      {/* Filters */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-40 bg-gray-700 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
              <SelectTrigger className="w-48 bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="All Entity Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entity Types</SelectItem>
                <SelectItem value="application">Applications</SelectItem>
                <SelectItem value="interface">Interfaces</SelectItem>
                <SelectItem value="business_process">Business Processes</SelectItem>
                <SelectItem value="change_request">Change Requests</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Timeline Content */}
      <ScrollArea className="flex-1 p-6">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-gray-400">Loading timeline...</div>
          </div>
        ) : !timeline || timeline.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No communications found</h3>
            <p className="text-gray-400">
              {dateRange === "all" 
                ? "There are no communications to display." 
                : "Try adjusting the date range or filters."}
            </p>
          </div>
        ) : (
          <div className="space-y-6 max-w-4xl mx-auto">
            {timeline.map((day) => {
              const isExpanded = expandedDates.has(day.date);
              const dayDate = new Date(day.date);
              const isToday = format(dayDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
              
              return (
                <div key={day.date}>
                  <div 
                    className="flex items-center space-x-2 mb-3 cursor-pointer"
                    onClick={() => toggleDate(day.date)}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-0 h-auto text-gray-400 hover:text-white"
                    >
                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </Button>
                    <h3 className="text-lg font-semibold text-white">
                      {format(dayDate, 'EEEE, MMMM d, yyyy')}
                      {isToday && <Badge className="ml-2 bg-blue-600 text-white">Today</Badge>}
                    </h3>
                    <Badge className="bg-gray-700 text-gray-300">
                      {day.events.length} event{day.events.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  
                  {isExpanded && (
                    <div className="ml-6 space-y-3">
                      {day.events.map((event, index) => (
                        <div key={index} className="relative">
                          {index < day.events.length - 1 && (
                            <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-gray-700" />
                          )}
                          {renderTimelineEvent(event)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Conversation Detail Dialog */}
      <Dialog 
        open={!!viewingConversationId} 
        onOpenChange={(open) => !open && setViewingConversationId(null)}
      >
        <DialogContent className="max-w-5xl bg-gray-800 border-gray-700 max-h-[90vh] overflow-y-auto">
          {viewingConversationId && (
            <ConversationDetail conversationId={viewingConversationId} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}