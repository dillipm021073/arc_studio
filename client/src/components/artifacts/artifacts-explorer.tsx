import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Grid3x3, 
  List, 
  Box,
  Plug,
  GitBranch,
  Activity,
  Cpu,
  Filter
} from "lucide-react";
import { cn } from "@/lib/utils";
import ArtifactCardView from "./artifact-card-view";
import ArtifactListView from "./artifact-list-view";
import { useInitiative } from "@/components/initiatives/initiative-context";
import { ViewModeIndicator } from "@/components/initiatives/view-mode-indicator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";

export type ArtifactType = "application" | "interface" | "businessProcess" | "internalActivity" | "technicalProcess";

interface ArtifactsExplorerProps {
  artifacts: any[];
  artifactType: ArtifactType;
  isLoading?: boolean;
  onView?: (artifact: any) => void;
  onEdit?: (artifact: any) => void;
  onDelete?: (artifact: any) => void;
  onCheckout?: (artifact: any) => void;
  onCheckin?: (artifact: any, changes: any) => void;
  onCancelCheckout?: (artifact: any) => void;
  customActions?: (artifact: any) => React.ReactNode;
  showTypeSelector?: boolean;
  onTypeChange?: (type: ArtifactType) => void;
}

const artifactTypeConfig = {
  application: {
    icon: Box,
    label: "Applications",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  interface: {
    icon: Plug,
    label: "Interfaces",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  businessProcess: {
    icon: GitBranch,
    label: "Business Processes",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  internalActivity: {
    icon: Activity,
    label: "Internal Activities",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
  technicalProcess: {
    icon: Cpu,
    label: "Technical Processes",
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10",
  },
};

export default function ArtifactsExplorer({
  artifacts,
  artifactType,
  isLoading = false,
  onView,
  onEdit,
  onDelete,
  onCheckout,
  onCheckin,
  onCancelCheckout,
  customActions,
  showTypeSelector = false,
  onTypeChange,
}: ArtifactsExplorerProps) {
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"card" | "list">("card");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const { currentInitiative, isProductionView } = useInitiative();

  // Filter artifacts based on search and status
  const filteredArtifacts = useMemo(() => {
    return artifacts.filter((artifact) => {
      // Search filter
      const searchLower = search.toLowerCase();
      const matchesSearch = !search || 
        artifact.name?.toLowerCase().includes(searchLower) ||
        artifact.amlNumber?.toLowerCase().includes(searchLower) ||
        artifact.imlNumber?.toLowerCase().includes(searchLower) ||
        artifact.businessProcess?.toLowerCase().includes(searchLower) ||
        artifact.description?.toLowerCase().includes(searchLower);

      // Status filter
      const matchesStatus = statusFilter.length === 0 || 
        statusFilter.includes(artifact.status);

      return matchesSearch && matchesStatus;
    });
  }, [artifacts, search, statusFilter]);

  // Get unique statuses from artifacts
  const availableStatuses = useMemo(() => {
    const statuses = new Set<string>();
    artifacts.forEach((artifact) => {
      if (artifact.status) {
        statuses.add(artifact.status);
      }
    });
    return Array.from(statuses).sort();
  }, [artifacts]);

  const toggleStatusFilter = (status: string) => {
    setStatusFilter((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };

  const clearFilters = () => {
    setStatusFilter([]);
    setSearch("");
  };

  const hasActiveFilters = statusFilter.length > 0 || search.length > 0;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          {showTypeSelector && onTypeChange ? (
            <Tabs value={artifactType} onValueChange={(value) => onTypeChange(value as ArtifactType)}>
              <TabsList>
                {Object.entries(artifactTypeConfig).map(([type, config]) => {
                  const Icon = config.icon;
                  return (
                    <TabsTrigger key={type} value={type} className="flex items-center gap-2">
                      <Icon className={cn("h-4 w-4", config.color)} />
                      {config.label}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </Tabs>
          ) : (
            <h2 className="text-2xl font-bold flex items-center gap-2">
              {(() => {
                const config = artifactTypeConfig[artifactType];
                const Icon = config.icon;
                return (
                  <>
                    <Icon className={cn("h-6 w-6", config.color)} />
                    {config.label}
                  </>
                );
              })()}
            </h2>
          )}
          <ViewModeIndicator />
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {filteredArtifacts.length} of {artifacts.length}
          </Badge>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search artifacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className={cn(hasActiveFilters && "border-blue-500")}>
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {statusFilter.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {statusFilter.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {availableStatuses.map((status) => (
              <DropdownMenuCheckboxItem
                key={status}
                checked={statusFilter.includes(status)}
                onCheckedChange={() => toggleStatusFilter(status)}
              >
                {status.replace('_', ' ')}
              </DropdownMenuCheckboxItem>
            ))}
            {hasActiveFilters && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={clearFilters}>
                  Clear all filters
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center gap-1">
          <Button
            variant={viewMode === "card" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("card")}
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <Card className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-400">Loading artifacts...</div>
          </div>
        ) : filteredArtifacts.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-400">
              {hasActiveFilters ? "No artifacts match your filters" : "No artifacts found"}
            </div>
          </div>
        ) : viewMode === "card" ? (
          <ArtifactCardView
            artifacts={filteredArtifacts}
            artifactType={artifactType}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
            onCheckout={onCheckout}
            onCheckin={onCheckin}
            onCancelCheckout={onCancelCheckout}
            customActions={customActions}
            isProductionView={isProductionView}
          />
        ) : (
          <ArtifactListView
            artifacts={filteredArtifacts}
            artifactType={artifactType}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
            onCheckout={onCheckout}
            onCheckin={onCheckin}
            onCancelCheckout={onCancelCheckout}
            customActions={customActions}
            isProductionView={isProductionView}
          />
        )}
      </Card>
    </div>
  );
}