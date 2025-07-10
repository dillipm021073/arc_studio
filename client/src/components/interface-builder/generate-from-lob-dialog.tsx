import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Filter, GitBranch, Grid3X3, Shuffle, Layers } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

interface GenerateFromLobDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (data: any) => void;
}

export default function GenerateFromLobDialog({ 
  isOpen, 
  onClose, 
  onGenerate 
}: GenerateFromLobDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [lobsLoading, setLobsLoading] = useState(false);
  const [availableLobs, setAvailableLobs] = useState<string[]>([]);
  const [selectedLobs, setSelectedLobs] = useState<string[]>([]);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [layout, setLayout] = useState<"hierarchical" | "force" | "grid">("hierarchical");
  const [groupBy, setGroupBy] = useState<"none" | "team" | "layer" | "businessProcess">("none");

  useEffect(() => {
    if (isOpen) {
      fetchAvailableLobs();
    }
  }, [isOpen]);

  const fetchAvailableLobs = async () => {
    setLobsLoading(true);
    try {
      const response = await fetch('/api/interface-builder/lobs', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch LOBs');
      const lobs = await response.json();
      setAvailableLobs(lobs);
    } catch (error) {
      console.error('Error fetching LOBs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch available LOBs",
        variant: "destructive"
      });
    } finally {
      setLobsLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (selectedLobs.length === 0) {
      toast({
        title: "No LOBs selected",
        description: "Please select at least one Line of Business",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/interface-builder/generate-from-lob', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          lobs: selectedLobs,
          includeInactive,
          layout,
          groupBy
        })
      });

      if (!response.ok) throw new Error('Failed to generate diagram');
      
      const data = await response.json();
      onGenerate(data);
      onClose();
      
      toast({
        title: "Diagram generated",
        description: `Generated ${data.nodes.length} applications and ${data.edges.length} interfaces`,
      });
    } catch (error) {
      console.error('Error generating diagram:', error);
      toast({
        title: "Error",
        description: "Failed to generate diagram from LOB data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleLob = (lob: string) => {
    setSelectedLobs(prev => 
      prev.includes(lob) 
        ? prev.filter(l => l !== lob)
        : [...prev, lob]
    );
  };

  const selectAll = () => setSelectedLobs(availableLobs);
  const clearAll = () => setSelectedLobs([]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Generate Diagram from LOB</DialogTitle>
          <DialogDescription>
            Select one or more Lines of Business to generate an interface diagram
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* LOB Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Select Lines of Business</Label>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={selectAll}
                  disabled={lobsLoading}
                >
                  Select All
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={clearAll}
                  disabled={lobsLoading}
                >
                  Clear All
                </Button>
              </div>
            </div>
            
            {lobsLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <ScrollArea className="h-48 border rounded-md p-3">
                <div className="grid grid-cols-2 gap-2">
                  {availableLobs.map((lob) => (
                    <div key={lob} className="flex items-center space-x-2">
                      <Checkbox
                        id={`lob-${lob}`}
                        checked={selectedLobs.includes(lob)}
                        onCheckedChange={() => toggleLob(lob)}
                      />
                      <Label
                        htmlFor={`lob-${lob}`}
                        className="cursor-pointer flex-1"
                      >
                        {lob}
                      </Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
            
            {selectedLobs.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {selectedLobs.map(lob => (
                  <Badge key={lob} variant="secondary">
                    {lob}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Layout Options */}
          <div className="space-y-3">
            <Label>Layout Algorithm</Label>
            <RadioGroup value={layout} onValueChange={(v: any) => setLayout(v)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="hierarchical" id="hierarchical" />
                <Label htmlFor="hierarchical" className="cursor-pointer flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  Hierarchical (by layer)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="force" id="force" />
                <Label htmlFor="force" className="cursor-pointer flex items-center gap-2">
                  <Shuffle className="h-4 w-4" />
                  Force-directed (organic)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="grid" id="grid" />
                <Label htmlFor="grid" className="cursor-pointer flex items-center gap-2">
                  <Grid3X3 className="h-4 w-4" />
                  Grid (uniform spacing)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Grouping Options */}
          <div className="space-y-3">
            <Label>Group Applications By</Label>
            <Select value={groupBy} onValueChange={(v: any) => setGroupBy(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No grouping</SelectItem>
                <SelectItem value="team">Team</SelectItem>
                <SelectItem value="layer">Layer (Presentation/Application/Data)</SelectItem>
                <SelectItem value="businessProcess">Business Process</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filter Options */}
          <div className="space-y-3">
            <Label>Filter Options</Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeInactive"
                checked={includeInactive}
                onCheckedChange={(checked) => setIncludeInactive(checked as boolean)}
              />
              <Label htmlFor="includeInactive" className="cursor-pointer">
                Include inactive applications and interfaces
              </Label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleGenerate} 
            disabled={isLoading || selectedLobs.length === 0}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <GitBranch className="mr-2 h-4 w-4" />
                Generate Diagram
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}