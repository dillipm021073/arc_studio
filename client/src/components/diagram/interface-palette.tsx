import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Search, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Node } from "reactflow";

interface InterfacePaletteProps {
  businessProcessId: number;
  onAddInterface: (interfaceData: any) => void;
  selectedNode: Node | null;
}

export default function InterfacePalette({
  businessProcessId,
  onAddInterface,
  selectedNode,
}: InterfacePaletteProps) {
  const [search, setSearch] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all interfaces
  const { data: allInterfaces = [] } = useQuery({
    queryKey: ["interfaces"],
    queryFn: async () => {
      const response = await fetch("/api/interfaces");
      if (!response.ok) throw new Error("Failed to fetch interfaces");
      return response.json();
    },
  });

  // Fetch interfaces already in this business process
  const { data: bpInterfaces = [] } = useQuery({
    queryKey: ["business-process-interfaces", businessProcessId],
    queryFn: async () => {
      const response = await fetch(`/api/business-processes/${businessProcessId}/interfaces`);
      if (!response.ok) throw new Error("Failed to fetch BP interfaces");
      return response.json();
    },
  });

  // Add interface to business process
  const addInterfaceMutation = useMutation({
    mutationFn: async ({ interfaceId, sequenceNumber }: { interfaceId: number; sequenceNumber: number }) => {
      const response = await fetch(`/api/business-processes/${businessProcessId}/interfaces`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interfaceId, sequenceNumber }),
      });
      if (!response.ok) throw new Error("Failed to add interface");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-process-interfaces", businessProcessId] });
      toast({
        title: "Success",
        description: "Interface added to business process",
      });
    },
  });

  // Remove interface from business process
  const removeInterfaceMutation = useMutation({
    mutationFn: async (bpInterfaceId: number) => {
      const response = await fetch(`/api/business-process-interfaces/${bpInterfaceId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to remove interface");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-process-interfaces", businessProcessId] });
      toast({
        title: "Success",
        description: "Interface removed from business process",
      });
    },
  });

  const filteredInterfaces = allInterfaces.filter((iml: any) =>
    iml.imlNumber.toLowerCase().includes(search.toLowerCase()) ||
    iml.interfaceType.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddToProcess = async (interfaceData: any) => {
    const nextSequence = bpInterfaces.length + 1;
    await addInterfaceMutation.mutateAsync({
      interfaceId: interfaceData.id,
      sequenceNumber: nextSequence,
    });
    onAddInterface(interfaceData);
  };

  return (
    <div className="h-full flex flex-col">
      <CardHeader className="px-4 py-3">
        <CardTitle className="text-lg">Interface Palette</CardTitle>
      </CardHeader>
      
      <Tabs defaultValue="available" className="flex-1 flex flex-col">
        <TabsList className="mx-4">
          <TabsTrigger value="available">Available</TabsTrigger>
          <TabsTrigger value="used">In Process</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="flex-1 flex flex-col px-4">
          <div className="flex items-center gap-2 mb-3">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search interfaces..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8"
            />
          </div>
          
          <ScrollArea className="flex-1">
            <div className="space-y-2">
              {filteredInterfaces.map((iml: any) => (
                <Card key={iml.id} className="p-3 cursor-pointer hover:bg-accent">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium">{iml.imlNumber}</h4>
                      <p className="text-xs text-muted-foreground">{iml.interfaceType}</p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => handleAddToProcess(iml)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="used" className="flex-1 px-4">
          <ScrollArea className="h-full">
            <div className="space-y-2">
              {bpInterfaces.map((bpInterface: any) => (
                <Card key={bpInterface.id} className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          #{bpInterface.sequenceNumber}
                        </Badge>
                        <h4 className="text-sm font-medium">
                          {bpInterface.interface?.imlNumber}
                        </h4>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {bpInterface.interface?.interfaceType}
                      </p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => removeInterfaceMutation.mutate(bpInterface.id)}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="details" className="flex-1 px-4">
          {selectedNode && selectedNode.data?.interface ? (
            <Card className="p-4">
              <h4 className="font-medium mb-2">Selected Interface</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">IML#:</span>{" "}
                  {selectedNode.data.interface.imlNumber}
                </div>
                <div>
                  <span className="text-muted-foreground">Type:</span>{" "}
                  {selectedNode.data.interface.interfaceType}
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>{" "}
                  <Badge variant="outline" className="text-xs">
                    {selectedNode.data.interface.status}
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Sequence:</span>{" "}
                  {selectedNode.data.sequenceNumber}
                </div>
              </div>
            </Card>
          ) : selectedNode && selectedNode.data?.application ? (
            <Card className="p-4">
              <h4 className="font-medium mb-2">Selected Application</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Name:</span>{" "}
                  {selectedNode.data.application.name}
                </div>
                <div>
                  <span className="text-muted-foreground">Type:</span>{" "}
                  <Badge variant="outline" className="text-xs">
                    {selectedNode.data.type}
                  </Badge>
                </div>
                {selectedNode.data.application.status && (
                  <div>
                    <span className="text-muted-foreground">Status:</span>{" "}
                    <Badge variant="outline" className="text-xs">
                      {selectedNode.data.application.status}
                    </Badge>
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <p className="text-sm text-muted-foreground text-center mt-4">
              Select a node to view details
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}