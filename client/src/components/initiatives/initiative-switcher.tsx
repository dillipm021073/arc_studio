import { Check, ChevronsUpDown, Plus, GitBranch, Globe, Users, Package, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useInitiative } from "./initiative-context";
import { CreateInitiativeDialog } from "./create-initiative-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function InitiativeSwitcher() {
  const [open, setOpen] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { 
    currentInitiative, 
    initiatives, 
    isLoading, 
    switchInitiative,
    isProductionView,
    toggleView 
  } = useInitiative();

  const activeInitiatives = initiatives.filter(i => i.status === 'active');
  const otherInitiatives = initiatives.filter(i => i.status !== 'active');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'review': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityIcon = (priority?: string) => {
    switch (priority) {
      case 'critical': return '🔴';
      case 'high': return '🟠';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '';
    }
  };

  return (
    <div className="flex items-center gap-2">
      {currentInitiative && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleView}
                className="h-10 w-10"
              >
                {isProductionView ? (
                  <Eye className="h-4 w-4" />
                ) : (
                  <EyeOff className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-sm">
                {isProductionView 
                  ? "Currently viewing production. Click to switch to initiative view." 
                  : "Currently viewing initiative. Click to switch to production view."}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[300px] justify-between"
            disabled={isLoading}
          >
            <div className="flex items-center gap-2">
              {isProductionView ? (
                <>
                  <Globe className="h-4 w-4" />
                  <span>Production Baseline</span>
                </>
              ) : currentInitiative ? (
                <>
                  <GitBranch className="h-4 w-4" />
                  <span className="truncate">{currentInitiative.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {getPriorityIcon(currentInitiative.priority)}
                  </span>
                </>
              ) : (
                <span className="text-muted-foreground">Select initiative...</span>
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0">
          <Command>
            <CommandInput placeholder="Search initiatives..." />
            <CommandList>
              <CommandEmpty>No initiatives found.</CommandEmpty>
              
              <CommandGroup heading="View Mode">
                <CommandItem
                  onSelect={() => {
                    switchInitiative(null);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      isProductionView ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <Globe className="mr-2 h-4 w-4" />
                  <div className="flex-1">
                    <div>Production Baseline</div>
                    <div className="text-xs text-muted-foreground">
                      View current production state
                    </div>
                  </div>
                </CommandItem>
              </CommandGroup>

              <CommandSeparator />

              {activeInitiatives.length > 0 && (
                <CommandGroup heading="Active Initiatives">
                  {activeInitiatives.map((initiative) => (
                    <CommandItem
                      key={initiative.initiativeId}
                      onSelect={() => {
                        switchInitiative(initiative.initiativeId);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          currentInitiative?.initiativeId === initiative.initiativeId && !isProductionView
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      <GitBranch className="mr-2 h-4 w-4" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span>{initiative.name}</span>
                          <span className="text-xs">
                            {getPriorityIcon(initiative.priority)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {initiative.isParticipant && (
                            <Badge variant="secondary" className="h-4 px-1 text-xs">
                              Member
                            </Badge>
                          )}
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {initiative.participantCount || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            {initiative.artifactCount || 0}
                          </span>
                        </div>
                      </div>
                      <Badge 
                        variant="secondary" 
                        className={cn("ml-2", getStatusColor(initiative.status))}
                      >
                        {initiative.status}
                      </Badge>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {otherInitiatives.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup heading="Other Initiatives">
                    {otherInitiatives.map((initiative) => (
                      <CommandItem
                        key={initiative.initiativeId}
                        onSelect={() => {
                          switchInitiative(initiative.initiativeId);
                          setOpen(false);
                        }}
                        disabled={initiative.status === 'completed' || initiative.status === 'cancelled'}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            currentInitiative?.initiativeId === initiative.initiativeId && !isProductionView
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        <GitBranch className="mr-2 h-4 w-4 opacity-50" />
                        <div className="flex-1 opacity-75">
                          <div>{initiative.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {initiative.description}
                          </div>
                        </div>
                        <Badge 
                          variant="secondary" 
                          className={cn("ml-2", getStatusColor(initiative.status))}
                        >
                          {initiative.status}
                        </Badge>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}

              <CommandSeparator />
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    setShowCreateDialog(true);
                    setOpen(false);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create new initiative
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <CreateInitiativeDialog 
        open={showCreateDialog} 
        onOpenChange={setShowCreateDialog} 
      />
    </div>
  );
}