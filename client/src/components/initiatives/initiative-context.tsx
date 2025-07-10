import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';

interface Initiative {
  id: number;
  initiativeId: string;
  name: string;
  description?: string;
  status: string;
  priority?: string;
  createdAt: string;
  targetCompletionDate?: string;
  participantCount?: number;
  artifactCount?: number;
  isParticipant?: boolean;
}

interface InitiativeContextType {
  currentInitiative: Initiative | null;
  initiatives: Initiative[];
  isLoading: boolean;
  switchInitiative: (initiativeId: string | null) => void;
  createInitiative: (data: any) => Promise<void>;
  isProductionView: boolean;
  toggleView: () => void;
}

const InitiativeContext = createContext<InitiativeContextType | undefined>(undefined);

export function useInitiative() {
  const context = useContext(InitiativeContext);
  if (!context) {
    throw new Error('useInitiative must be used within InitiativeProvider');
  }
  return context;
}

interface InitiativeProviderProps {
  children: ReactNode;
}

export function InitiativeProvider({ children }: InitiativeProviderProps) {
  const [currentInitiativeId, setCurrentInitiativeId] = useState<string | null>(null);
  const [isProductionView, setIsProductionView] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Load saved initiative from localStorage
  useEffect(() => {
    const savedInitiativeId = localStorage.getItem('currentInitiativeId');
    const savedView = localStorage.getItem('isProductionView');
    
    if (savedInitiativeId && savedInitiativeId !== 'null') {
      setCurrentInitiativeId(savedInitiativeId);
      setIsProductionView(false);
    }
    
    if (savedView !== null) {
      setIsProductionView(savedView === 'true');
    }
  }, []);

  // Fetch all initiatives
  const { data: initiatives = [], isLoading } = useQuery({
    queryKey: ['initiatives', user?.id],
    queryFn: async () => {
      const response = await api.get('/api/initiatives');
      return response.data;
    },
    retry: false,
    enabled: !!user, // Only fetch when user is authenticated
    staleTime: 30000, // Cache for 30 seconds
  });

  // Find current initiative
  const currentInitiative = initiatives.find(
    (init: Initiative) => init.initiativeId === currentInitiativeId
  ) || null;

  // Create initiative mutation
  const createInitiativeMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/api/initiatives', data);
      return response.data;
    },
    onSuccess: (newInitiative) => {
      queryClient.invalidateQueries({ queryKey: ['initiatives'] });
      setCurrentInitiativeId(newInitiative.initiativeId);
      setIsProductionView(false);
      toast({
        title: "Initiative created",
        description: `${newInitiative.name} has been created successfully.`
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to create initiative",
        variant: "destructive"
      });
    }
  });

  const switchInitiative = (initiativeId: string | null) => {
    setCurrentInitiativeId(initiativeId);
    
    if (initiativeId) {
      setIsProductionView(false);
      localStorage.setItem('currentInitiativeId', initiativeId);
      localStorage.setItem('isProductionView', 'false');
      
      const initiative = initiatives.find((i: Initiative) => i.initiativeId === initiativeId);
      if (initiative) {
        toast({
          title: "Initiative switched",
          description: `Now working in: ${initiative.name}`
        });
      }
    } else {
      setIsProductionView(true);
      localStorage.removeItem('currentInitiativeId');
      localStorage.setItem('isProductionView', 'true');
      
      toast({
        title: "Switched to production",
        description: "Now viewing production baseline"
      });
    }

    // Invalidate all queries to refresh data
    queryClient.invalidateQueries();
  };

  const toggleView = () => {
    if (isProductionView && currentInitiativeId) {
      setIsProductionView(false);
      localStorage.setItem('isProductionView', 'false');
    } else {
      setIsProductionView(true);
      localStorage.setItem('isProductionView', 'true');
    }
    
    // Invalidate queries to refresh data
    queryClient.invalidateQueries();
  };

  return (
    <InitiativeContext.Provider 
      value={{
        currentInitiative,
        initiatives,
        isLoading,
        switchInitiative,
        createInitiative: createInitiativeMutation.mutateAsync,
        isProductionView,
        toggleView
      }}
    >
      {children}
    </InitiativeContext.Provider>
  );
}