import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Building2 } from "lucide-react";

interface InterfaceBusinessProcessesProps {
  interfaceId: number;
}

export default function InterfaceBusinessProcesses({ interfaceId }: InterfaceBusinessProcessesProps) {
  const { data: businessProcesses = [], isLoading } = useQuery({
    queryKey: ["/api/interfaces", interfaceId, "business-processes"],
    queryFn: async () => {
      const response = await fetch(`/api/interfaces/${interfaceId}/business-processes`);
      if (!response.ok) throw new Error("Failed to fetch business processes");
      return response.json();
    },
  });

  if (isLoading) {
    return <div className="text-sm text-gray-400">Loading...</div>;
  }

  if (businessProcesses.length === 0) {
    return (
      <div className="text-sm text-gray-400 italic">
        No business processes assigned
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {businessProcesses.map((bp: any) => (
        <div key={bp.id} className="flex items-center gap-2">
          <Building2 className="h-3 w-3 text-gray-400" />
          <span className="text-sm text-white">{bp.businessProcess}</span>
          <Badge variant="outline" className="text-xs text-white border-gray-600">
            #{bp.sequenceNumber}
          </Badge>
        </div>
      ))}
    </div>
  );
}