import { AlertTriangle, GitBranch, Globe } from "lucide-react";
import { useInitiative } from "./initiative-context";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function ViewModeIndicator() {
  const { currentInitiative, isProductionView, toggleView } = useInitiative();

  if (!currentInitiative) {
    return null;
  }

  if (isProductionView) {
    return (
      <Alert className="bg-yellow-900/20 border-yellow-700">
        <Globe className="h-4 w-4" />
        <AlertDescription>
          <span className="font-medium">Production View Mode</span> - You are viewing the production baseline. 
          Checkout/checkin features are disabled. 
          <button 
            onClick={toggleView}
            className="underline ml-1 hover:no-underline"
          >
            Switch to initiative view
          </button>
          to make changes.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="bg-blue-900/20 border-blue-700">
      <GitBranch className="h-4 w-4" />
      <AlertDescription>
        <span className="font-medium">Initiative View Mode</span> - Working in: {currentInitiative.name}. 
        You can checkout and edit items.
        <button 
          onClick={toggleView}
          className="underline ml-1 hover:no-underline"
        >
          Switch to production view
        </button>
        to see the baseline.
      </AlertDescription>
    </Alert>
  );
}