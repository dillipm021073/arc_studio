import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, History as TimelineIcon, Filter, Download, ChevronDown, ChevronRight, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format, subDays, subMonths, startOfDay, endOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

interface TimelineEvent {
  id: string | number;
  type: string;
  title: string;
  description: string;
  status: string;
  date: string;
  owner: string;
  priority: string;
  entityId?: number;
  crNumber?: string;
  amlNumber?: string;
  imlNumber?: string;
}

export default function History() {
  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 2));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [timeRange, setTimeRange] = useState<string>("2days");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(() => {
    // Auto-expand today and yesterday, or the most recent 2 dates for 2-day view
    const defaultExpanded = new Set<string>();
    const today = format(new Date(), 'yyyy-MM-dd');
    const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
    defaultExpanded.add(today);
    defaultExpanded.add(yesterday);
    return defaultExpanded;
  });
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const { data: timelineData, isLoading } = useQuery<TimelineEvent[]>({
    queryKey: ["/api/timeline", { 
      startDate: startDate.toISOString(), 
      endDate: endDate.toISOString() 
    }],
  });

  const handleTimeRangeChange = (range: string) => {
    setTimeRange(range);
    const now = new Date();
    
    switch (range) {
      case "2days":
        setStartDate(subDays(now, 2));
        setEndDate(now);
        break;
      case "1week":
        setStartDate(subDays(now, 7));
        setEndDate(now);
        break;
      case "2weeks":
        setStartDate(subDays(now, 14));
        setEndDate(now);
        break;
      case "1month":
        setStartDate(subMonths(now, 1));
        setEndDate(now);
        break;
      case "3months":
        setStartDate(subMonths(now, 3));
        setEndDate(now);
        break;
      case "6months":
        setStartDate(subMonths(now, 6));
        setEndDate(now);
        break;
      case "1year":
        setStartDate(subMonths(now, 12));
        setEndDate(now);
        break;
      default:
        break;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft': return 'bg-gray-600 text-white';
      case 'submitted': return 'bg-blue-600 text-white';
      case 'under_review': return 'bg-orange-600 text-white';
      case 'approved': return 'bg-green-600 text-white';
      case 'in_progress': return 'bg-blue-600 text-white';
      case 'completed': return 'bg-green-600 text-white';
      case 'rejected': return 'bg-red-600 text-white';
      case 'created': return 'bg-purple-600 text-white';
      case 'active': return 'bg-green-600 text-white';
      case 'inactive': return 'bg-gray-600 text-white';
      case 'deprecated': return 'bg-orange-600 text-white';
      case 'decommissioned': return 'bg-red-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'low': return 'bg-green-600 text-white';
      case 'medium': return 'bg-yellow-600 text-white';
      case 'high': return 'bg-orange-600 text-white';
      case 'critical': return 'bg-red-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'change_request': return '🔄';
      case 'application': return '📦';
      case 'interface': return '🔌';
      case 'deployment': return '🚀';
      case 'business_process': return '📊';
      default: return '📋';
    }
  };

  const filteredEvents = timelineData?.filter(event => {
    if (statusFilter !== "all" && event.status !== statusFilter) return false;
    if (typeFilter !== "all" && event.type !== typeFilter) return false;
    return true;
  }) || [];

  // Enhanced grouping logic for tree format
  const getDateGroup = (date: Date): string => {
    const now = new Date();
    const today = startOfDay(now);
    const yesterday = startOfDay(subDays(now, 1));
    const weekAgo = startOfDay(subDays(now, 7));
    const twoWeeksAgo = startOfDay(subDays(now, 14));
    const monthAgo = startOfDay(subMonths(now, 1));
    const eventDate = startOfDay(date);

    // For 2-day filter, show individual dates
    if (timeRange === '2days') {
      return format(date, 'yyyy-MM-dd');
    }

    // For other filters, use appropriate grouping
    if (eventDate.getTime() === today.getTime()) return format(date, 'yyyy-MM-dd');
    if (eventDate.getTime() === yesterday.getTime()) return format(date, 'yyyy-MM-dd');
    
    // For week view, show individual dates for recent days
    if (timeRange === '1week' && eventDate > subDays(now, 7)) {
      return format(date, 'yyyy-MM-dd');
    }
    
    if (eventDate > weekAgo) return 'last-week';
    if (eventDate > twoWeeksAgo) return 'last-2-weeks';
    if (eventDate > monthAgo) return 'this-month';
    
    // Group by month-year for older events
    return format(date, 'MMM-yyyy');
  };

  // Group events by time periods with sub-grouping for weeks
  const groupedByPeriod = filteredEvents.reduce((groups: Record<string, { events: TimelineEvent[], dates: Set<string>, subGroups?: Record<string, TimelineEvent[]> }>, event) => {
    const dateGroup = getDateGroup(new Date(event.date));
    const dateStr = format(new Date(event.date), 'yyyy-MM-dd');
    
    if (!groups[dateGroup]) {
      groups[dateGroup] = { events: [], dates: new Set() };
    }
    
    groups[dateGroup].events.push(event);
    groups[dateGroup].dates.add(dateStr);
    
    // For week groups, also create sub-groups by date
    if (dateGroup === 'last-week' || dateGroup === 'last-2-weeks') {
      if (!groups[dateGroup].subGroups) {
        groups[dateGroup].subGroups = {};
      }
      if (!groups[dateGroup].subGroups[dateStr]) {
        groups[dateGroup].subGroups[dateStr] = [];
      }
      groups[dateGroup].subGroups[dateStr].push(event);
    }
    
    return groups;
  }, {});

  // Sort events within each group by date (newest first)
  Object.keys(groupedByPeriod).forEach(period => {
    groupedByPeriod[period].events.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  });

  // Sort periods - for date strings, sort by date descending
  const sortedPeriods = Object.keys(groupedByPeriod).sort((a, b) => {
    // Check if both are date strings (yyyy-MM-dd format)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (dateRegex.test(a) && dateRegex.test(b)) {
      return new Date(b).getTime() - new Date(a).getTime();
    }
    
    // Define order for named periods
    const periodOrder = ['last-week', 'last-2-weeks', 'this-month'];
    const aIndex = periodOrder.indexOf(a);
    const bIndex = periodOrder.indexOf(b);
    
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    
    // For month-year periods, sort by date
    return new Date(b).getTime() - new Date(a).getTime();
  });

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const handleEventDoubleClick = (event: TimelineEvent) => {
    setSelectedEvent(event);
    setShowDetail(true);
  };

  const getPeriodLabel = (period: string): { label: string; tags: string[] } => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    
    if (dateRegex.test(period)) {
      const date = new Date(period);
      const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
      const isYesterday = format(date, 'yyyy-MM-dd') === format(subDays(new Date(), 1), 'yyyy-MM-dd');
      
      return {
        label: isToday ? 'Today' : isYesterday ? 'Yesterday' : format(date, 'MMMM d, yyyy'),
        tags: [
          format(date, 'EEEE'), // Day of week
          isToday ? 'Today' : isYesterday ? 'Yesterday' : format(date, 'MMM d')
        ]
      };
    }
    
    switch (period) {
      case 'last-week': return { label: 'Last Week', tags: ['7 days'] };
      case 'last-2-weeks': return { label: 'Last 2 Weeks', tags: ['14 days'] };
      case 'this-month': return { label: 'This Month', tags: [format(new Date(), 'MMMM')] };
      default: {
        // For month-year format
        try {
          const date = new Date(period);
          return { label: format(date, 'MMMM yyyy'), tags: [] };
        } catch {
          return { label: period, tags: [] };
        }
      }
    }
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
                  <span className="text-white font-medium">History</span>
                </li>
              </ol>
            </nav>
            <h1 className="text-2xl font-semibold text-white mt-1">History View</h1>
          </div>
          <div className="flex items-center space-x-3">
            <Button className="bg-blue-600 text-white hover:bg-blue-700">
              <Download className="mr-2" size={16} />
              Export History
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        {/* Filters */}
        <Card className="mb-6 bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center text-white">
              <Filter className="mr-2" size={20} />
              History Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Time Range Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Time Range</label>
                <Select value={timeRange} onValueChange={handleTimeRangeChange}>
                  <SelectTrigger className="bg-black border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-gray-600">
                    <SelectItem value="2days">Last 2 Days</SelectItem>
                    <SelectItem value="1week">Last Week</SelectItem>
                    <SelectItem value="2weeks">Last 2 Weeks</SelectItem>
                    <SelectItem value="1month">Last Month</SelectItem>
                    <SelectItem value="3months">Last 3 Months</SelectItem>
                    <SelectItem value="6months">Last 6 Months</SelectItem>
                    <SelectItem value="1year">Last Year</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Start Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-black border-gray-600 text-white hover:bg-gray-800",
                        !startDate && "text-gray-400"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => date && setStartDate(startOfDay(date))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">End Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-black border-gray-600 text-white hover:bg-gray-800",
                        !endDate && "text-gray-400"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={(date) => date && setEndDate(endOfDay(date))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="bg-black border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-gray-600">
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="created">Created</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="deprecated">Deprecated</SelectItem>
                    <SelectItem value="decommissioned">Decommissioned</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="bg-black border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-gray-600">
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="change_request">Change Requests</SelectItem>
                    <SelectItem value="application">Applications</SelectItem>
                    <SelectItem value="interface">Interfaces</SelectItem>
                    <SelectItem value="business_process">Business Processes</SelectItem>
                    <SelectItem value="deployment">Deployments</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* History */}
        {isLoading ? (
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="text-center py-12">
              <div className="text-gray-400">Loading timeline...</div>
            </CardContent>
          </Card>
        ) : filteredEvents.length === 0 ? (
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="text-center py-12">
              <TimelineIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No events found</h3>
              <p className="text-gray-400">
                No events match your current filter criteria. Try adjusting the date range or filters.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {sortedPeriods.map((period) => {
              const isExpanded = expandedSections.has(period);
              const periodData = groupedByPeriod[period];
              
              return (
                <div key={period} className="relative">
                  {/* Period Header with Expand/Collapse */}
                  <div 
                    className="sticky top-0 z-10 bg-gray-700 rounded-lg p-4 mb-2 cursor-pointer hover:bg-gray-650 transition-colors"
                    onClick={() => toggleSection(period)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                        <h3 className="text-lg font-semibold text-white">{getPeriodLabel(period).label}</h3>
                        {getPeriodLabel(period).tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs bg-gray-600 text-gray-200">
                            {tag}
                          </Badge>
                        ))}
                        <span className="text-sm text-gray-400">
                          ({periodData.events.length} event{periodData.events.length !== 1 ? 's' : ''})
                        </span>
                      </div>
                      <p className="text-sm text-gray-400">
                        {periodData.dates.size} day{periodData.dates.size !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  {/* Events for this period */}
                  {isExpanded && (
                    <div className="relative pl-8">
                      {/* Timeline Line */}
                      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-600"></div>

                      <div className="space-y-4">
                        {/* Check if this period has sub-groups (for week views) */}
                        {periodData.subGroups ? (
                          // Render sub-groups for week views
                          Object.keys(periodData.subGroups)
                            .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
                            .map(dateStr => {
                              const dayEvents = periodData.subGroups![dateStr];
                              const dateLabel = getPeriodLabel(dateStr);
                              
                              return (
                                <div key={dateStr} className="mb-6">
                                  {/* Date sub-header */}
                                  <div className="flex items-center space-x-2 mb-3 ml-4">
                                    <h4 className="text-md font-medium text-gray-300">{dateLabel.label}</h4>
                                    {dateLabel.tags.map((tag, idx) => (
                                      <Badge key={idx} variant="outline" className="text-xs border-gray-600 text-gray-400">
                                        {tag}
                                      </Badge>
                                    ))}
                                    <span className="text-xs text-gray-500">
                                      ({dayEvents.length} event{dayEvents.length !== 1 ? 's' : ''})
                                    </span>
                                  </div>
                                  
                                  {/* Events for this date */}
                                  {dayEvents.map((event) => (
                                    <div key={event.id} className="relative">
                                      {/* Timeline Dot */}
                                      <div className="absolute -left-4 top-6 w-3 h-3 bg-blue-600 rounded-full border-2 border-gray-800 shadow"></div>

                                      {/* Event Card */}
                                      <Card 
                                        className="ml-4 hover:shadow-md transition-shadow bg-gray-800 border-gray-700 cursor-pointer"
                                        onDoubleClick={() => handleEventDoubleClick(event)}
                                      >
                                        <CardContent className="p-4">
                                          <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                              <div className="flex items-center space-x-2 mb-2">
                                                <span className="text-lg">{getEventIcon(event.type)}</span>
                                                <h4 className="text-lg font-semibold text-white">{event.title}</h4>
                                              </div>
                                              <p className="text-gray-300 mb-3">{event.description}</p>
                                              <div className="flex items-center space-x-4 text-sm text-gray-400">
                                                <span>By {event.owner}</span>
                                                <span>•</span>
                                                <span>{format(new Date(event.date), 'h:mm a')}</span>
                                                {event.crNumber && (
                                                  <>
                                                    <span>•</span>
                                                    <Link href={`/change-requests`} className="text-blue-400 hover:text-blue-300">
                                                      {event.crNumber}
                                                    </Link>
                                                  </>
                                                )}
                                                {event.amlNumber && (
                                                  <>
                                                    <span>•</span>
                                                    <Link href={`/applications`} className="text-blue-400 hover:text-blue-300">
                                                      {event.amlNumber}
                                                    </Link>
                                                  </>
                                                )}
                                                {event.imlNumber && (
                                                  <>
                                                    <span>•</span>
                                                    <Link href={`/interfaces`} className="text-blue-400 hover:text-blue-300">
                                                      {event.imlNumber}
                                                    </Link>
                                                  </>
                                                )}
                                              </div>
                                            </div>
                                            <div className="flex flex-col items-end space-y-2">
                                              <Badge className={`status-badge ${getStatusColor(event.status)}`}>
                                                {event.status.replace('_', ' ')}
                                              </Badge>
                                              {event.priority && (
                                                <Badge className={`status-badge ${getPriorityColor(event.priority)}`}>
                                                  {event.priority}
                                              </Badge>
                                              )}
                                            </div>
                                          </div>
                                        </CardContent>
                                      </Card>
                                    </div>
                                  ))}
                                </div>
                              );
                            })
                        ) : (
                          // Regular rendering for individual dates or months
                          periodData.events.map((event) => (
                            <div key={event.id} className="relative">
                              {/* Timeline Dot */}
                              <div className="absolute -left-4 top-6 w-3 h-3 bg-blue-600 rounded-full border-2 border-gray-800 shadow"></div>

                              {/* Event Card */}
                              <Card 
                                className="ml-4 hover:shadow-md transition-shadow bg-gray-800 border-gray-700 cursor-pointer"
                                onDoubleClick={() => handleEventDoubleClick(event)}
                              >
                                <CardContent className="p-4">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center space-x-2 mb-2">
                                        <span className="text-lg">{getEventIcon(event.type)}</span>
                                        <h4 className="text-lg font-semibold text-white">{event.title}</h4>
                                      </div>
                                      <p className="text-gray-300 mb-3">{event.description}</p>
                                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                                        <span>By {event.owner}</span>
                                        <span>•</span>
                                        <span>{format(new Date(event.date), 'h:mm a')}</span>
                                        {event.crNumber && (
                                          <>
                                            <span>•</span>
                                            <Link href={`/change-requests`} className="text-blue-400 hover:text-blue-300">
                                              {event.crNumber}
                                            </Link>
                                          </>
                                        )}
                                        {event.amlNumber && (
                                          <>
                                            <span>•</span>
                                            <Link href={`/applications`} className="text-blue-400 hover:text-blue-300">
                                              {event.amlNumber}
                                            </Link>
                                          </>
                                        )}
                                        {event.imlNumber && (
                                          <>
                                            <span>•</span>
                                            <Link href={`/interfaces`} className="text-blue-400 hover:text-blue-300">
                                              {event.imlNumber}
                                            </Link>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex flex-col items-end space-y-2">
                                      <Badge className={`status-badge ${getStatusColor(event.status)}`}>
                                        {event.status.replace('_', ' ')}
                                      </Badge>
                                      {event.priority && (
                                        <Badge className={`status-badge ${getPriorityColor(event.priority)}`}>
                                          {event.priority}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Summary */}
            <div className="text-center py-8">
              <p className="text-sm text-gray-400">
                Showing {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} 
                between {format(startDate, 'MMM d, yyyy')} and {format(endDate, 'MMM d, yyyy')}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Double-click on any event to see more details
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-2xl bg-gray-800 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Event Details</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetail(false)}
                className="hover:bg-gray-700"
              >
                <X size={16} />
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          {selectedEvent && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{getEventIcon(selectedEvent.type)}</span>
                <h3 className="text-xl font-semibold">{selectedEvent.title}</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400">Type</label>
                  <p className="font-medium">{selectedEvent.type.replace('_', ' ')}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Status</label>
                  <Badge className={`${getStatusColor(selectedEvent.status)}`}>
                    {selectedEvent.status.replace('_', ' ')}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Created By</label>
                  <p className="font-medium">{selectedEvent.owner}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Date & Time</label>
                  <p className="font-medium">{format(new Date(selectedEvent.date), 'PPpp')}</p>
                </div>
                {selectedEvent.priority && (
                  <div>
                    <label className="text-sm text-gray-400">Priority</label>
                    <Badge className={`${getPriorityColor(selectedEvent.priority)}`}>
                      {selectedEvent.priority}
                    </Badge>
                  </div>
                )}
                {selectedEvent.crNumber && (
                  <div>
                    <label className="text-sm text-gray-400">Change Request</label>
                    <Link href={`/change-requests`} className="text-blue-400 hover:text-blue-300 font-medium">
                      {selectedEvent.crNumber}
                    </Link>
                  </div>
                )}
                {selectedEvent.amlNumber && (
                  <div>
                    <label className="text-sm text-gray-400">Application (AML)</label>
                    <Link href={`/applications`} className="text-blue-400 hover:text-blue-300 font-medium">
                      {selectedEvent.amlNumber}
                    </Link>
                  </div>
                )}
                {selectedEvent.imlNumber && (
                  <div>
                    <label className="text-sm text-gray-400">Interface (IML)</label>
                    <Link href={`/interfaces`} className="text-blue-400 hover:text-blue-300 font-medium">
                      {selectedEvent.imlNumber}
                    </Link>
                  </div>
                )}
              </div>
              
              <div>
                <label className="text-sm text-gray-400">Description</label>
                <p className="mt-1 text-gray-200">{selectedEvent.description}</p>
              </div>
              
              <div className="pt-4 border-t border-gray-700">
                <p className="text-sm text-gray-400">
                  Event ID: {selectedEvent.id}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
