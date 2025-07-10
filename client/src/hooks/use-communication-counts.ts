import { useQuery } from "@tanstack/react-query";

interface CommunicationCount {
  entityId: number;
  count: number;
}

export function useCommunicationCounts(entityType: string, entityIds: number[]) {
  return useQuery({
    queryKey: [`/api/conversations/counts/${entityType}`, entityIds],
    queryFn: async () => {
      if (entityIds.length === 0) return new Map<number, number>();
      
      // Fetch counts for all entities in one request
      const response = await fetch(`/api/conversations/counts/${entityType}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityIds })
      });
      
      if (!response.ok) throw new Error("Failed to fetch communication counts");
      
      const data: CommunicationCount[] = await response.json();
      
      // Convert to Map for easy lookup
      const countsMap = new Map<number, number>();
      data.forEach(item => {
        countsMap.set(item.entityId, item.count);
      });
      
      return countsMap;
    },
    enabled: entityIds.length > 0
  });
}